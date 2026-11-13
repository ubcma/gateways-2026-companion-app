import delegatesJson from "../../data/delegates.json";
import { MATCHING_CONFIG } from "./config";
import { readDelegates } from "./matches-file";
import type { Delegate } from "./score";
import { mulberry32, type Attendee } from "./select";

export const LOREAL = "L'Oréal: Brandstorm Workshop - Rethinking the Future of Beauty";
export const TELUS = "Telus: Own Your Narrative - Turning Setbacks into Strategy";
export const KENVUE = "Kenvue: Case Challenge - Product Innovation Strategy";
export const KITS = "KITS Eyewhere: Retention-Driven Growth and a Fast-Growing Brand";
export const TOCHA = "Tocha Foods: What Marketing Looks Like in a Start-Up";

export function delegate(
  id: string,
  jobTags: string[],
  overrides: Partial<Delegate> = {},
): Delegate {
  return { id, name: id, company: `${id} Inc`, role: "Marketer", jobTags, matchable: true, ...overrides };
}

/** The real delegate list plus two test-only delegates that must never be picked. */
export function fixtureDelegates(): Delegate[] {
  return [
    ...readDelegates(delegatesJson),
    delegate("test-blank-tag", [], { matchable: false }),
    delegate("test-bad-tag", ["Underwater Basket Weaving"], { matchable: false }),
  ];
}

const INTERESTS = Object.keys(MATCHING_CONFIG.interests);
const WORKSHOPS = [LOREAL, TELUS, KENVUE, KITS, TOCHA, "Not picked", null];
const MAJORS = [...Object.keys(MATCHING_CONFIG.majors), "Other", "No", "Computer Science", "", null];

/** Seeded synthetic attendees with a mix of full, partial, unknown and empty data. */
export function syntheticAttendees(count = 90, seed = 7): Attendee[] {
  const random = mulberry32(seed);
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)];
  return Array.from({ length: count }, (_, i) => {
    const interests = INTERESTS.filter(() => random() < 0.35);
    if (i % 15 === 0) {
      interests.push("Underwater Basket Weaving");
    }
    const empty = i % 20 === 0;
    return {
      userId: `user-${String(i).padStart(3, "0")}`,
      workshops: empty ? null : [pick(WORKSHOPS), pick(WORKSHOPS)],
      interests: empty ? null : i % 2 ? interests : interests.join(", "),
      major: empty ? null : pick(MAJORS),
    };
  });
}
