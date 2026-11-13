import type { MatchingConfig } from "./config";
import {
  baseScore,
  buildAttendeeProfile,
  delegateTagVector,
  explainMatch,
  inputHash,
  isMatchableDelegate,
  type AttendeeInput,
  type AttendeeProfile,
  type Delegate,
  type TagVector,
} from "./score";

export type StoredMatch = {
  delegateId: string;
  rank: number;
  /** Base score before load and diversity adjustments, to 3 decimals. */
  score: number;
  why: string;
};

export type MatchEntry = {
  inputHash: string;
  matches: StoredMatch[];
};

export type Attendee = AttendeeInput & { userId: string };

/** Attendees matched to each delegate id. */
export type DelegateLoads = ReadonlyMap<string, number>;

type Candidate = {
  delegate: Delegate;
  vector: TagVector;
  tags: Set<string>;
  company: string;
};

type Scored = Candidate & { base: number };

type AttendeeState = {
  profile: AttendeeProfile;
  scored: Scored[];
  chosen: Scored[];
};

/** Lowercase letters and digits only, so "L'Oréal Canada" and "loreal canada" collide. */
export function normalizeCompany(company: unknown): string {
  return typeof company === "string"
    ? company
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
    : "";
}

function byCodePoint(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function eligibleCandidates(delegates: readonly Delegate[]): Candidate[] {
  const seen = new Set<string>();
  return delegates
    .filter((delegate) => {
      if (!isMatchableDelegate(delegate) || seen.has(delegate.id)) {
        return false;
      }
      seen.add(delegate.id);
      return true;
    })
    .sort((a, b) => byCodePoint(a.id, b.id))
    .map((delegate) => ({
      delegate,
      vector: delegateTagVector(delegate.jobTags)!,
      tags: new Set(delegate.jobTags),
      // A delegate without a usable company only conflicts with itself.
      company: normalizeCompany(delegate.company) || `id:${delegate.id}`,
    }));
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  let shared = 0;
  for (const tag of a) {
    if (b.has(tag)) {
      shared += 1;
    }
  }
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

// Rounding keeps ties exact when float error makes equal scores differ in the last bits.
function roundScore(value: number) {
  return Math.round(value * 1e9) / 1e9;
}

function prepare(attendee: AttendeeInput, candidates: Candidate[], config: MatchingConfig): AttendeeState {
  const profile = buildAttendeeProfile(attendee, config);
  return {
    profile,
    scored: candidates.map((candidate) => ({
      ...candidate,
      base: baseScore(profile, candidate.vector, config),
    })),
    chosen: [],
  };
}

/**
 * The best remaining delegate by adjusted score, skipping repeats and companies
 * already chosen. Ties go to the lower load, then the lower id (candidates are
 * sorted by id).
 */
function pickNext(
  state: AttendeeState,
  loads: DelegateLoads,
  config: MatchingConfig,
  enforceCap: boolean,
): Scored | undefined {
  const chosenIds = new Set(state.chosen.map((choice) => choice.delegate.id));
  const chosenCompanies = new Set(state.chosen.map((choice) => choice.company));
  const cap = config.delegateCap;

  let best: { candidate: Scored; adjusted: number; load: number } | undefined;
  for (const candidate of state.scored) {
    if (chosenIds.has(candidate.delegate.id) || chosenCompanies.has(candidate.company)) {
      continue;
    }
    const load = loads.get(candidate.delegate.id) ?? 0;
    if (enforceCap && load >= cap) {
      continue;
    }
    const overlap = Math.max(0, ...state.chosen.map((choice) => jaccard(candidate.tags, choice.tags)));
    const adjusted = roundScore(
      candidate.base -
        config.loadPenalty * (cap > 0 ? load / cap : 0) -
        config.overlapPenalty * overlap,
    );
    if (
      !best ||
      adjusted > best.adjusted ||
      (adjusted === best.adjusted && load < best.load)
    ) {
      best = { candidate, adjusted, load };
    }
  }
  return best?.candidate;
}

function toStoredMatches(state: AttendeeState, config: MatchingConfig): StoredMatch[] {
  return state.chosen.map((choice, index) => ({
    delegateId: choice.delegate.id,
    rank: index + 1,
    score: Math.round(choice.base * 1000) / 1000,
    why: explainMatch(state.profile, choice.delegate, choice.vector, config),
  }));
}

function addLoad(loads: Map<string, number>, delegateId: string) {
  loads.set(delegateId, (loads.get(delegateId) ?? 0) + 1);
}

/**
 * Picks one attendee's delegates against fixed starting loads. The per-delegate
 * cap is only enforced when `enforceCap` is set.
 */
export function rankAndSelect(
  attendee: AttendeeInput | null | undefined,
  delegates: readonly Delegate[],
  config: MatchingConfig,
  options: { loads?: DelegateLoads; enforceCap?: boolean } = {},
): StoredMatch[] {
  const state = prepare(attendee ?? {}, eligibleCandidates(delegates), config);
  const loads = new Map(options.loads ?? []);
  for (let round = 0; round < config.matchesPerAttendee; round++) {
    const pick = pickNext(state, loads, config, options.enforceCap ?? false);
    if (!pick) {
      break;
    }
    state.chosen.push(pick);
    addLoad(loads, pick.delegate.id);
  }
  return toStoredMatches(state, config);
}

/** Small seeded PRNG returning floats in [0, 1), so shuffles are reproducible anywhere. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export type GenerateResult = {
  /** Keyed by user id, in sorted order. */
  matches: Record<string, MatchEntry>;
  /** Final loads, including `initialLoads`. */
  loads: Map<string, number>;
};

/**
 * Matches every attendee in rounds of one pick each, in a seeded shuffled order
 * per round, sharing delegate loads and enforcing the per-delegate cap. Attendees
 * are deduplicated and sorted by user id first, so input order doesn't matter.
 */
export function generateMatches(
  attendees: readonly Attendee[],
  delegates: readonly Delegate[],
  config: MatchingConfig,
  options: { initialLoads?: DelegateLoads } = {},
): GenerateResult {
  const candidates = eligibleCandidates(delegates);
  const byUserId = new Map<string, Attendee>();
  for (const attendee of attendees) {
    if (typeof attendee?.userId === "string" && attendee.userId && !byUserId.has(attendee.userId)) {
      byUserId.set(attendee.userId, attendee);
    }
  }
  const states = [...byUserId.keys()].sort(byCodePoint).map((userId) => {
    const attendee = byUserId.get(userId)!;
    return { attendee, ...prepare(attendee, candidates, config) };
  });

  const loads = new Map(options.initialLoads ?? []);
  const random = mulberry32(config.seed);
  for (let round = 0; round < config.matchesPerAttendee; round++) {
    for (const state of shuffle(states, random)) {
      const pick = pickNext(state, loads, config, true);
      if (pick) {
        state.chosen.push(pick);
        addLoad(loads, pick.delegate.id);
      }
    }
  }

  const matches: Record<string, MatchEntry> = {};
  for (const state of states) {
    matches[state.attendee.userId] = {
      inputHash: inputHash(state.attendee),
      matches: toStoredMatches(state, config),
    };
  }
  return { matches, loads };
}
