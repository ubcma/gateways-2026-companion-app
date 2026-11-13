import {
  INTEREST_WEIGHTS,
  LINES,
  WORKSHOP_WEIGHTS,
  type Line,
  type LineWeights,
} from "./config";

/** A workshop title, or null/undefined/"Not picked" when the slot is empty. */
export type WorkshopPick = string | null | undefined;

export type AssignLineInput = {
  workshops?: readonly [slot1: WorkshopPick, slot2: WorkshopPick] | null;
  /** An array, or a comma-separated string like "Sales, UI/UX". */
  interests?: string | readonly string[] | null;
};

export type LineAssignment = {
  line: Line;
  scores: Record<Line, number>;
};

// Titles and interests are typed by people, so tolerate case, spacing, Unicode
// composition ("é" vs "e" + accent) and curly vs straight apostrophes.
export function normalizeKey(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function byNormalizedKey(weights: Record<string, LineWeights>) {
  return new Map(
    Object.entries(weights).map(([key, value]) => [normalizeKey(key), value]),
  );
}

const interestWeights = byNormalizedKey(INTEREST_WEIGHTS);
const workshopWeights = byNormalizedKey(WORKSHOP_WEIGHTS);

function zeroScores(): Record<Line, number> {
  return { General: 0, Brand: 0, Creative: 0, Product: 0 };
}

function addWeights(scores: Record<Line, number>, weights: LineWeights) {
  for (const line of LINES) {
    scores[line] += weights[line];
  }
}

/** Unique, normalized interest keys; selecting an interest twice counts once. */
function parseInterests(interests: unknown): Set<string> {
  const raw = typeof interests === "string" ? [interests] : interests;
  if (!Array.isArray(raw)) {
    return new Set();
  }
  return new Set(
    raw
      .filter((entry): entry is string => typeof entry === "string")
      .flatMap((entry) => entry.split(","))
      .map(normalizeKey)
      .filter(Boolean),
  );
}

/**
 * Scores every line from the attendee's two workshop slots plus their
 * onboarding interests and returns the highest, breaking ties in `LINES`
 * order. Unknown workshops and interests score zero; never throws.
 */
export function assignLine(
  input: AssignLineInput | null | undefined,
): LineAssignment {
  const scores = zeroScores();

  const workshops = input?.workshops;
  if (Array.isArray(workshops)) {
    for (const title of workshops) {
      const weights =
        typeof title === "string" ? workshopWeights.get(normalizeKey(title)) : undefined;
      if (weights) {
        addWeights(scores, weights);
      }
    }
  }

  for (const interest of parseInterests(input?.interests)) {
    const weights = interestWeights.get(interest);
    if (weights) {
      addWeights(scores, weights);
    }
  }

  let line: Line = LINES[0];
  for (const candidate of LINES) {
    if (scores[candidate] > scores[line]) {
      line = candidate;
    }
  }

  return { line, scores };
}
