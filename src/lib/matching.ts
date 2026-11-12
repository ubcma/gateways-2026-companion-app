import type { Match, Profile } from "@/lib/types";

type Matchable = { majors: string[]; interests: string[] };

const MAJOR_WEIGHT = 2;
const INTEREST_WEIGHT = 1;

export function rankMatches<T extends Matchable>(
  profile: Profile,
  items: T[],
  limit = 3,
): Match<T>[] {
  return items
    .map((item) => {
      const sharedInterests = item.interests.filter((i) =>
        profile.interests.includes(i),
      );
      const sharesMajor = item.majors.includes(profile.major);
      const score =
        (sharesMajor ? MAJOR_WEIGHT : 0) +
        sharedInterests.length * INTEREST_WEIGHT;
      return { item, score, sharedInterests, sharesMajor };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
