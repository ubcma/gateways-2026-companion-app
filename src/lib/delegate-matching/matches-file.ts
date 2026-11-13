import type { MatchingConfig } from "./config";
import { inputHash, isMatchableDelegate, type Delegate } from "./score";
import { generateMatches, type Attendee, type MatchEntry, type StoredMatch } from "./select";

export type MatchesFile = {
  generatedAt: string | null;
  configVersion: string;
  /** Keyed by user id. */
  matches: Record<string, MatchEntry>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStoredMatch(value: unknown): StoredMatch | null {
  if (!isRecord(value) || typeof value.delegateId !== "string") {
    return null;
  }
  return {
    delegateId: value.delegateId,
    rank: typeof value.rank === "number" ? value.rank : 0,
    score: typeof value.score === "number" ? value.score : 0,
    why: typeof value.why === "string" ? value.why : "",
  };
}

/** Parses an untrusted matches file, dropping malformed entries instead of throwing. */
export function readMatchesFile(raw: unknown): MatchesFile {
  const file = isRecord(raw) ? raw : {};
  const matches: Record<string, MatchEntry> = {};
  if (isRecord(file.matches)) {
    for (const [userId, entry] of Object.entries(file.matches)) {
      if (isRecord(entry) && typeof entry.inputHash === "string" && Array.isArray(entry.matches)) {
        matches[userId] = {
          inputHash: entry.inputHash,
          matches: entry.matches.flatMap((match) => readStoredMatch(match) ?? []),
        };
      }
    }
  }
  return {
    generatedAt: typeof file.generatedAt === "string" ? file.generatedAt : null,
    configVersion: typeof file.configVersion === "string" ? file.configVersion : "",
    matches,
  };
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Parses an untrusted delegate list, trimming fields and dropping entries without an id or name. */
export function readDelegates(raw: unknown): Delegate[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((value): Delegate[] => {
    if (!isRecord(value) || !trimmed(value.id) || !trimmed(value.name)) {
      return [];
    }
    return [
      {
        id: trimmed(value.id),
        name: trimmed(value.name),
        company: trimmed(value.company),
        role: trimmed(value.role),
        jobTags: Array.isArray(value.jobTags) ? value.jobTags.map(trimmed).filter(Boolean) : [],
        matchable: value.matchable === true,
      },
    ];
  });
}

function byCodePoint(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Fixed key order, sorted user ids and 2-space indent, so diffs stay readable. */
export function serializeMatchesFile(file: MatchesFile): string {
  const matches = Object.fromEntries(
    Object.keys(file.matches)
      .sort(byCodePoint)
      .map((userId) => {
        const entry = file.matches[userId];
        return [
          userId,
          {
            inputHash: entry.inputHash,
            matches: entry.matches.map(({ delegateId, rank, score, why }) => ({
              delegateId,
              rank,
              score,
              why,
            })),
          },
        ];
      }),
  );
  const ordered = {
    generatedAt: file.generatedAt,
    configVersion: file.configVersion,
    matches,
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export function loadsFromEntries(
  entries: Record<string, MatchEntry>,
  excludeUserId?: string,
): Map<string, number> {
  const loads = new Map<string, number>();
  for (const [userId, entry] of Object.entries(entries)) {
    if (userId === excludeUserId) {
      continue;
    }
    for (const { delegateId } of entry.matches) {
      loads.set(delegateId, (loads.get(delegateId) ?? 0) + 1);
    }
  }
  return loads;
}

export type RegenerateMode =
  | { kind: "all" }
  /** Keeps entries whose inputs and delegates are unchanged; matches everyone else. */
  | { kind: "only-missing" }
  /** Rematches one attendee and leaves every other entry untouched. */
  | { kind: "user"; userId: string };

export type RegenerateResult = {
  file: MatchesFile;
  generated: string[];
  kept: string[];
  /** Entries removed because the user is no longer a registered attendee. */
  dropped: string[];
};

export function regenerateMatchesFile({
  existing,
  attendees,
  delegates,
  config,
  mode,
  generatedAt,
}: {
  existing: MatchesFile | null;
  attendees: readonly Attendee[];
  delegates: readonly Delegate[];
  config: MatchingConfig;
  mode: RegenerateMode;
  generatedAt: string;
}): RegenerateResult {
  const previous = existing?.matches ?? {};
  const current = new Map(attendees.map((attendee) => [attendee.userId, attendee]));
  const matchableIds = new Set(delegates.filter(isMatchableDelegate).map(({ id }) => id));

  let kept: Record<string, MatchEntry> = {};
  let toGenerate: Attendee[] = [...current.values()];

  if (mode.kind === "only-missing") {
    for (const [userId, entry] of Object.entries(previous)) {
      const attendee = current.get(userId);
      if (
        attendee &&
        entry.inputHash === inputHash(attendee) &&
        entry.matches.every(({ delegateId }) => matchableIds.has(delegateId))
      ) {
        kept[userId] = entry;
      }
    }
    toGenerate = toGenerate.filter(({ userId }) => !Object.hasOwn(kept, userId));
  } else if (mode.kind === "user") {
    const attendee = current.get(mode.userId);
    if (!attendee) {
      throw new Error(`${mode.userId} is not a registered attendee`);
    }
    kept = Object.fromEntries(
      Object.entries(previous).filter(([userId]) => userId !== mode.userId),
    );
    toGenerate = [attendee];
  }

  const { matches } = generateMatches(toGenerate, delegates, config, {
    initialLoads: loadsFromEntries(kept),
  });

  return {
    file: {
      generatedAt,
      configVersion: config.configVersion,
      matches: { ...kept, ...matches },
    },
    generated: Object.keys(matches),
    kept: Object.keys(kept),
    dropped: Object.keys(previous).filter(
      (userId) => !Object.hasOwn(kept, userId) && !current.has(userId),
    ),
  };
}
