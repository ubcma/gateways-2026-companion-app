/** In tie-break order: on equal scores, the earlier line wins. */
export const LINES = ["General", "Brand", "Creative", "Product"] as const;

export type Line = (typeof LINES)[number];

export type LineWeights = Record<Line, number>;

/**
 * Points each selected onboarding interest adds to every line. Keys must match
 * mp-frontend's `INTEREST_OPTIONS`; lookups are trimmed and case-insensitive.
 */
export const INTEREST_WEIGHTS: Record<string, LineWeights> = {
  "Digital Marketing": { General: 2, Brand: 1, Creative: 1, Product: 0 },
  "Brand Management": { General: 0, Brand: 3, Creative: 1, Product: 0 },
  Entrepreneurship: { General: 2, Brand: 0, Creative: 0, Product: 1 },
  "UI/UX": { General: 0, Brand: 0, Creative: 2, Product: 2 },
  "Graphic Design": { General: 0, Brand: 1, Creative: 3, Product: 0 },
  Consulting: { General: 2, Brand: 1, Creative: 0, Product: 1 },
  "Product Management": { General: 0, Brand: 0, Creative: 0, Product: 3 },
  Sales: { General: 3, Brand: 1, Creative: 0, Product: 0 },
};

/**
 * Points a workshop adds per slot it fills, so the same workshop in both slots
 * counts twice. Keyed by the workshop title in mp-backend, since workshop ids
 * differ between the dev and prod events. Lookups are trimmed and
 * case-insensitive; unknown titles and "Not picked" score zero.
 */
export const WORKSHOP_WEIGHTS: Record<string, LineWeights> = {
  "L'Oréal: Brandstorm Workshop - Rethinking the Future of Beauty": {
    General: 0,
    Brand: 4,
    Creative: 2,
    Product: 0,
  },
  "Telus: Own Your Narrative - Turning Setbacks into Strategy": {
    General: 1,
    Brand: 3,
    Creative: 3,
    Product: 0,
  },
  "Kenvue: Case Challenge - Product Innovation Strategy": {
    General: 1,
    Brand: 0,
    Creative: 0,
    Product: 4,
  },
  "KITS Eyewhere: Retention-Driven Growth and a Fast-Growing Brand": {
    General: 3,
    Brand: 2,
    Creative: 0,
    Product: 1,
  },
  "Tocha Foods: What Marketing Looks Like in a Start-Up": {
    General: 4,
    Brand: 0,
    Creative: 1,
    Product: 1,
  },
};
