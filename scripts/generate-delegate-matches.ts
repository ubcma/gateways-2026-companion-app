// Writes src/data/delegate-matches.json for every registered Gateways attendee.
// Usage: npm run generate:delegate-matches [-- --only-missing | --user <userId>]
//
// Reads attendees from mp-backend's admin endpoints, so it needs BACKEND_URL (or
// NEXT_PUBLIC_BACKEND_URL), GATEWAYS_EVENT_ID and GATEWAYS_ADMIN_COOKIE (the
// Cookie header of a signed-in admin) in the environment or .env.local.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { MATCHING_CONFIG } from "@/lib/delegate-matching/config";
import {
  loadsFromEntries,
  readDelegates,
  readMatchesFile,
  regenerateMatchesFile,
  serializeMatchesFile,
  type MatchesFile,
  type RegenerateMode,
} from "@/lib/delegate-matching/matches-file";
import { isMatchableDelegate, toAttendeeInput } from "@/lib/delegate-matching/score";
import type { Attendee } from "@/lib/delegate-matching/select";
import { findDelegateIssues } from "@/lib/delegate-matching/validate-delegates";

const DATA_DIR = path.join(process.cwd(), "src/data");
const DELEGATES_PATH = path.join(DATA_DIR, "delegates.json");
const MATCHES_PATH = path.join(DATA_DIR, "delegate-matches.json");

// `incomplete` is only set manually by admins to revoke a registration.
const ACTIVE_REGISTRATION_STATUSES = new Set(["registered", "checkedIn"]);

type RegistrationsResponse = {
  registrations: {
    userId: string;
    userEmail: string | null;
    status: string;
    workshops: { slot: number; workshopId: number; title: string }[];
  }[];
};

type UserRow = {
  userId: string;
  major: string | null;
  interests: string[] | null;
  onboardingComplete: boolean | null;
};

type UsersResponse = { data: UserRow[]; meta: { totalPages: number } };

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Missing env files are fine; variables may come from the shell.
    }
  }
}

function requireEnv(name: string, value = process.env[name]) {
  if (!value) {
    throw new Error(`${name} must be set (in the shell or .env.local)`);
  }
  return value;
}

async function fetchAttendees(): Promise<Attendee[]> {
  const backendURL = requireEnv("BACKEND_URL", process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL);
  const eventId = Number(requireEnv("GATEWAYS_EVENT_ID"));
  const cookie = requireEnv("GATEWAYS_ADMIN_COOKIE");

  const getJson = async <T>(pathname: string): Promise<T> => {
    const res = await fetch(`${backendURL}${pathname}`, {
      headers: { cookie, Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const hint = res.status === 401 || res.status === 403
        ? " (is GATEWAYS_ADMIN_COOKIE a current admin session?)"
        : "";
      throw new Error(`${pathname} failed with status ${res.status}${hint}`);
    }
    return (await res.json()) as T;
  };

  const { registrations } = await getJson<RegistrationsResponse>(`/api/events/${eventId}/registrations`);
  const active = registrations.filter(({ status }) => ACTIVE_REGISTRATION_STATUSES.has(status));

  const users = new Map<string, UserRow>();
  const firstPage = await getJson<UsersResponse>("/api/users?page=1&pageSize=100");
  const pages = [firstPage];
  for (let page = 2; page <= firstPage.meta.totalPages; page++) {
    pages.push(await getJson<UsersResponse>(`/api/users?page=${page}&pageSize=100`));
  }
  for (const user of pages.flatMap(({ data }) => data)) {
    users.set(user.userId, user);
  }

  // /api/users pages an unordered query, so look up anyone it skipped by email.
  for (const registration of active) {
    if (!users.has(registration.userId) && registration.userEmail) {
      const { data } = await getJson<UsersResponse>(
        `/api/users?pageSize=100&search=${encodeURIComponent(registration.userEmail)}`,
      );
      const match = data.find(({ userId }) => userId === registration.userId);
      if (match) {
        users.set(match.userId, match);
      }
    }
  }

  const missingProfiles = active.filter(({ userId }) => !users.has(userId));
  if (missingProfiles.length) {
    console.warn(`Warning: no profile found for ${missingProfiles.length} attendee(s); matching them on workshops only.`);
  }

  return active.map((registration) => {
    const titleForSlot = (slot: number) =>
      registration.workshops.find((workshop) => workshop.slot === slot)?.title;
    const user = users.get(registration.userId);
    return {
      userId: registration.userId,
      ...toAttendeeInput({
        workshops: [titleForSlot(1), titleForSlot(2)],
        interests: user?.interests ?? null,
        major: user?.major ?? null,
        onboardingComplete: user?.onboardingComplete ?? null,
      }),
    };
  });
}

async function readExisting(): Promise<MatchesFile | null> {
  try {
    return readMatchesFile(JSON.parse(await readFile(MATCHES_PATH, "utf8")));
  } catch {
    return null;
  }
}

function parseMode(): RegenerateMode {
  const { values } = parseArgs({
    options: {
      "only-missing": { type: "boolean", default: false },
      user: { type: "string" },
    },
  });
  if (values["only-missing"] && values.user) {
    throw new Error("Use either --only-missing or --user, not both");
  }
  if (values.user) {
    return { kind: "user", userId: values.user };
  }
  return values["only-missing"] ? { kind: "only-missing" } : { kind: "all" };
}

function round(value: number, places = 3) {
  return Math.round(value * 10 ** places) / 10 ** places;
}

async function main() {
  loadEnv();
  const mode = parseMode();
  const rawDelegates: unknown = JSON.parse(await readFile(DELEGATES_PATH, "utf8"));
  const issues = findDelegateIssues(rawDelegates);
  if (issues.length) {
    console.warn(`delegates.json has ${issues.length} problem(s):`);
    for (const { index, id, problem } of issues) {
      console.warn(`  [${index}] ${id || "(no id)"}: ${problem}`);
    }
  }
  const delegates = readDelegates(rawDelegates);
  const matchable = delegates.filter(isMatchableDelegate);
  if (matchable.length === 0) {
    throw new Error(`No matchable delegates in ${path.relative(process.cwd(), DELEGATES_PATH)}`);
  }

  const [attendees, existing] = await Promise.all([fetchAttendees(), readExisting()]);
  const { file, generated, kept, dropped } = regenerateMatchesFile({
    existing,
    attendees,
    delegates,
    config: MATCHING_CONFIG,
    mode,
    generatedAt: new Date().toISOString(),
  });
  await writeFile(MATCHES_PATH, serializeMatchesFile(file));

  const entries = Object.values(file.matches);
  const loads = loadsFromEntries(file.matches);
  const counts = matchable.map(({ id }) => loads.get(id) ?? 0);
  const picks = entries.flatMap(({ matches }) => matches);
  const short = Object.entries(file.matches).filter(
    ([, entry]) => entry.matches.length < MATCHING_CONFIG.matchesPerAttendee,
  );
  const excluded = delegates.filter((delegate) => !isMatchableDelegate(delegate));
  const changed = mode.kind === "all" && existing
    ? Object.keys(existing.matches).filter(
        (userId) => JSON.stringify(existing.matches[userId].matches) !== JSON.stringify(file.matches[userId]?.matches),
      ).length
    : 0;

  console.log(`Wrote ${path.relative(process.cwd(), MATCHES_PATH)} (config ${file.configVersion}, mode ${mode.kind})`);
  console.log(`Attendees: ${attendees.length} registered, ${generated.length} matched now, ${kept.length} kept, ${dropped.length} dropped (no longer registered)`);
  if (changed) {
    console.log(`Note: a full run changed ${changed} previously generated attendee(s)' matches. Use --only-missing after matches have been shown.`);
  }
  console.log(`Delegates: ${matchable.length} matchable, ${excluded.length} excluded`);
  for (const delegate of excluded) {
    const why = delegate.matchable ? "invalid tags" : "marked not matchable";
    console.log(`  excluded ${delegate.id} (${why}; tags: ${delegate.jobTags.join("; ") || "none"})`);
  }
  console.log(
    `Matches per delegate: min ${Math.min(...counts)}, max ${Math.max(...counts)}, avg ${round(picks.length / matchable.length, 2)} (cap ${MATCHING_CONFIG.delegateCap})`,
  );
  const unmatched = matchable.filter(({ id }) => !loads.get(id)).map(({ id }) => id);
  console.log(`Delegates with 0 matches: ${unmatched.length}${unmatched.length ? ` (${unmatched.join(", ")})` : ""}`);
  console.log(`Average base score of picks: ${picks.length ? round(picks.reduce((sum, { score }) => sum + score, 0) / picks.length) : "n/a"}`);
  if (short.length) {
    console.warn(`Warning: ${short.length} attendee(s) got fewer than ${MATCHING_CONFIG.matchesPerAttendee} matches (cap or company limits reached).`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
