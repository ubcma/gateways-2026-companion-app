import delegatesJson from "../../data/delegates.json";
import matchesJson from "../../data/delegate-matches.json";
import { MATCHING_CONFIG, type MatchingConfig } from "./config";
import {
  loadsFromEntries,
  readDelegates,
  readMatchesFile,
  type MatchesFile,
} from "./matches-file";
import { inputHash, isMatchableDelegate, type AttendeeInput, type Delegate } from "./score";
import { rankAndSelect, type StoredMatch } from "./select";

export type DelegateMatch = StoredMatch &
  Pick<Delegate, "name" | "company" | "role" | "linkedinUrl" | "jobTags">;

export type DelegateMatchesResult = {
  matches: DelegateMatch[];
  /** "file" is the pre-generated match, "fallback" was scored just now. */
  source: "file" | "fallback" | "none";
  /** Why the file wasn't used, or why there are no matches. */
  reason?: string;
};

export type MatchData = {
  file: MatchesFile;
  delegates: Delegate[];
  config: MatchingConfig;
};

export const bundledMatchData: MatchData = {
  file: readMatchesFile(matchesJson),
  delegates: readDelegates(delegatesJson),
  config: MATCHING_CONFIG,
};

/**
 * Looks the attendee up in the generated matches file. If they're missing, their
 * workshops or onboarding answers changed since generation, or a matched delegate
 * is no longer matchable, scores them now against the file's delegate loads.
 * Never writes to disk and never throws.
 *
 * Pass `inputComplete: false` when some of the attendee's data failed to load, so
 * a stored match is shown as-is instead of being replaced on a partial read.
 */
export function getDelegateMatchesForUser(
  userId: string,
  input: AttendeeInput | null,
  { inputComplete = true, data = bundledMatchData }: { inputComplete?: boolean; data?: MatchData } = {},
): DelegateMatchesResult {
  const matchable = new Map(
    data.delegates.filter(isMatchableDelegate).map((delegate) => [delegate.id, delegate]),
  );
  if (matchable.size === 0) {
    return { matches: [], source: "none", reason: "No delegates are available for matching yet." };
  }

  const hydrate = (matches: StoredMatch[]): DelegateMatch[] =>
    matches.flatMap((match) => {
      const delegate = matchable.get(match.delegateId);
      return delegate
        ? [
            {
              ...match,
              name: delegate.name,
              company: delegate.company,
              role: delegate.role,
              linkedinUrl: delegate.linkedinUrl,
              jobTags: delegate.jobTags,
            },
          ]
        : [];
    });

  const entry = userId ? data.file.matches[userId] : undefined;
  let reason = "Not in the generated matches file.";
  if (entry) {
    const delegatesStillMatchable = entry.matches.every(({ delegateId }) => matchable.has(delegateId));
    const inputsUnchanged = !inputComplete || entry.inputHash === inputHash(input);
    if (delegatesStillMatchable && inputsUnchanged) {
      return { matches: hydrate(entry.matches), source: "file" };
    }
    reason = delegatesStillMatchable
      ? "Workshop or onboarding answers changed since matches were generated."
      : "A matched delegate is no longer available.";
  }

  const matches = rankAndSelect(input, data.delegates, data.config, {
    loads: loadsFromEntries(data.file.matches, userId),
  });
  return { matches: hydrate(matches), source: "fallback", reason };
}
