import { createHash } from "node:crypto";
import { normalizeKey, type WorkshopPick } from "../gateways-line/assign-line";
import {
  GENERAL_TAG,
  JOB_TAGS,
  type MatchingConfig,
  type TagAffinity,
  type WorkshopConfig,
} from "./config";

export type Delegate = {
  /** Stable slug of the name; the only thing matches refer to. */
  id: string;
  name: string;
  company: string;
  role: string;
  /** Absolute https URL of their LinkedIn profile. */
  linkedinUrl?: string;
  jobTags: string[];
  matchable: boolean;
};

export type AttendeeInput = {
  workshops?: readonly [slot1: WorkshopPick, slot2: WorkshopPick] | null;
  /** An array, or a comma-separated string like "Sales, UI/UX". */
  interests?: string | readonly string[] | null;
  major?: string | null;
};

export type AttendeeRecord = AttendeeInput & { onboardingComplete?: boolean | null };

/** One weight per job tag, in `JOB_TAGS` order. */
export type TagVector = number[];

type Driver = {
  kind: "interest" | "workshop" | "major";
  label: string;
  affinity: TagAffinity;
};

export type AttendeeProfile = {
  /** L1-normalized; null when the component has no signal. */
  components: {
    interests: TagVector | null;
    workshops: TagVector | null;
    major: TagVector | null;
  };
  drivers: Driver[];
};

/**
 * Interests and major count only once onboarding is complete, the same rule the
 * Gateways line uses. Shared by the generator and the runtime so their input
 * hashes agree.
 */
export function toAttendeeInput(record: AttendeeRecord | null | undefined): AttendeeInput {
  const onboarded = record?.onboardingComplete === true;
  return {
    workshops: record?.workshops ?? null,
    interests: onboarded ? (record?.interests ?? null) : null,
    major: onboarded ? (record?.major ?? null) : null,
  };
}

type Named = { name: string; affinity: TagAffinity };
type Lookups = {
  interests: Map<string, Named>;
  workshops: Map<string, WorkshopConfig>;
  majors: Map<string, Named>;
};

const lookupCache = new WeakMap<MatchingConfig, Lookups>();

function named(table: Record<string, TagAffinity>) {
  return new Map(
    Object.entries(table).map(([name, affinity]) => [normalizeKey(name), { name, affinity }]),
  );
}

function lookups(config: MatchingConfig): Lookups {
  let cached = lookupCache.get(config);
  if (!cached) {
    cached = {
      interests: named(config.interests),
      workshops: new Map(
        Object.entries(config.workshops).map(([title, workshop]) => [normalizeKey(title), workshop]),
      ),
      majors: named(config.majors),
    };
    lookupCache.set(config, cached);
  }
  return cached;
}

const NOT_PICKED = normalizeKey("Not picked");

function workshopKey(pick: unknown): string {
  if (typeof pick !== "string") {
    return "";
  }
  const key = normalizeKey(pick);
  return key === NOT_PICKED ? "" : key;
}

function interestKeys(interests: unknown): string[] {
  const raw = typeof interests === "string" ? [interests] : interests;
  if (!Array.isArray(raw)) {
    return [];
  }
  const keys = raw
    .filter((entry): entry is string => typeof entry === "string")
    .flatMap((entry) => entry.split(","))
    .map(normalizeKey)
    .filter(Boolean);
  return [...new Set(keys)].sort();
}

export type NormalizedInputs = {
  workshops: [slot1: string, slot2: string];
  interests: string[];
  major: string;
};

/** Normalized for comparison; empty strings mean "not picked" or blank. */
export function normalizeInputs(input: AttendeeInput | null | undefined): NormalizedInputs {
  const workshops = Array.isArray(input?.workshops) ? input.workshops : [];
  return {
    workshops: [workshopKey(workshops[0]), workshopKey(workshops[1])],
    interests: interestKeys(input?.interests),
    major: typeof input?.major === "string" ? normalizeKey(input.major) : "",
  };
}

export function inputHash(input: AttendeeInput | null | undefined): string {
  const { workshops, interests, major } = normalizeInputs(input);
  return createHash("sha256")
    .update(JSON.stringify([workshops[0], workshops[1], interests, major]))
    .digest("hex")
    .slice(0, 16);
}

function toVector(affinities: readonly TagAffinity[]): TagVector | null {
  const sums = JOB_TAGS.map((tag) =>
    affinities.reduce((sum, affinity) => sum + (affinity[tag] ?? 0), 0),
  );
  const total = sums.reduce((sum, value) => sum + value, 0);
  return total > 0 ? sums.map((value) => value / total) : null;
}

export function buildAttendeeProfile(
  input: AttendeeInput | null | undefined,
  config: MatchingConfig,
): AttendeeProfile {
  const normalized = normalizeInputs(input);
  const tables = lookups(config);

  const interests = normalized.interests.flatMap((key) => tables.interests.get(key) ?? []);
  const workshops = normalized.workshops.flatMap((key) => tables.workshops.get(key) ?? []);
  const major = tables.majors.get(normalized.major);

  const drivers: Driver[] = [
    ...interests.map(({ name, affinity }) => ({ kind: "interest" as const, label: name, affinity })),
    ...[...new Set(workshops)].map(({ label, affinity }) => ({
      kind: "workshop" as const,
      label,
      affinity,
    })),
    ...(major ? [{ kind: "major" as const, label: major.name, affinity: major.affinity }] : []),
  ];

  return {
    components: {
      interests: toVector(interests.map(({ affinity }) => affinity)),
      workshops: toVector(workshops.map(({ affinity }) => affinity)),
      major: major ? toVector([major.affinity]) : null,
    },
    drivers,
  };
}

export function hasSignal(profile: AttendeeProfile): boolean {
  return Object.values(profile.components).some(Boolean);
}

const jobTagSet = new Set<string>(JOB_TAGS);

/**
 * One tag scores 1.0, several split evenly, and "General" alone spreads across
 * all six. Returns null for blank, unknown or mixed-with-General tags.
 */
export function delegateTagVector(jobTags: readonly unknown[] | null | undefined): TagVector | null {
  if (!Array.isArray(jobTags)) {
    return null;
  }
  const tags = new Set(jobTags);
  if (tags.size === 1 && tags.has(GENERAL_TAG)) {
    return JOB_TAGS.map(() => 1 / JOB_TAGS.length);
  }
  if (tags.size === 0 || ![...tags].every((tag) => typeof tag === "string" && jobTagSet.has(tag))) {
    return null;
  }
  return JOB_TAGS.map((tag) => (tags.has(tag) ? 1 / tags.size : 0));
}

export function isMatchableDelegate(delegate: Delegate): boolean {
  return delegate.matchable === true && delegateTagVector(delegate.jobTags) !== null;
}

/** Each tag's share of the base score; sums to the base score. */
export function tagContributions(
  profile: AttendeeProfile,
  delegateVector: TagVector,
  config: MatchingConfig,
): TagVector {
  const weights = config.componentWeights;
  const present = (["interests", "workshops", "major"] as const).flatMap((component) => {
    const vector = profile.components[component];
    return vector ? [{ weight: weights[component], vector }] : [];
  });
  const totalWeight = present.reduce((sum, { weight }) => sum + weight, 0);

  if (totalWeight <= 0) {
    return delegateVector.map((value) => value / JOB_TAGS.length);
  }
  return delegateVector.map(
    (value, tag) =>
      present.reduce((sum, { weight, vector }) => sum + weight * vector[tag] * value, 0) /
      totalWeight,
  );
}

export function baseScore(
  profile: AttendeeProfile,
  delegateVector: TagVector,
  config: MatchingConfig,
): number {
  return tagContributions(profile, delegateVector, config).reduce((sum, value) => sum + value, 0);
}

const DRIVER_KINDS = ["interest", "workshop", "major"] as const;

/**
 * Names the tag that contributes most to the score and the attendee's choices
 * behind it, e.g. "Brand Management (interest: Brand Management; workshop: Brandstorm)".
 */
export function explainMatch(
  profile: AttendeeProfile,
  delegate: Pick<Delegate, "jobTags">,
  delegateVector: TagVector,
  config: MatchingConfig,
): string {
  if (!hasSignal(profile)) {
    return config.noSignalWhy;
  }

  const contributions = tagContributions(profile, delegateVector, config);
  let top = 0;
  contributions.forEach((value, index) => {
    if (value > contributions[top]) {
      top = index;
    }
  });
  if (contributions[top] <= 0) {
    return `${delegate.jobTags[0]} (${config.noOverlapWhy})`;
  }

  const tag = JOB_TAGS[top];
  const reasons = DRIVER_KINDS.flatMap((kind) => {
    const labels = profile.drivers
      .filter((driver) => driver.kind === kind && (driver.affinity[tag] ?? 0) > 0)
      .sort((a, b) => (b.affinity[tag] ?? 0) - (a.affinity[tag] ?? 0))
      .map((driver) => driver.label);
    return labels.length ? [`${kind}: ${labels.join(", ")}`] : [];
  });

  const headline = delegate.jobTags.length === 1 && delegate.jobTags[0] === GENERAL_TAG
    ? `${GENERAL_TAG}: ${tag}`
    : tag;
  return reasons.length ? `${headline} (${reasons.join("; ")})` : headline;
}
