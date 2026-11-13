/** The six job tags, in tie-break order: on equal contributions, the earlier tag wins. */
export const JOB_TAGS = [
  "Brand Management",
  "Creative, Content & Advertising",
  "Growth & Digital Marketing",
  "Product Management / Product Marketing",
  "Business Strategy & Market Research",
  "Partnerships, Events & Experiential Marketing",
] as const;

export type JobTag = (typeof JOB_TAGS)[number];

/** A delegate whose only tag is this one is spread evenly across every job tag. */
export const GENERAL_TAG = "General";

export type DelegateTag = JobTag | typeof GENERAL_TAG;

export type TagAffinity = Partial<Record<JobTag, number>>;

export type WorkshopConfig = {
  /** Shown in the match explanation; describes the topic, never the sponsor. */
  label: string;
  affinity: TagAffinity;
};

export type MatchingConfig = {
  /** Bump whenever anything below changes, so regenerated files can be told apart. */
  configVersion: string;
  componentWeights: { interests: number; workshops: number; major: number };
  /** Keys must match mp-frontend's `INTEREST_OPTIONS`; lookups are trimmed and case-insensitive. */
  interests: Record<string, TagAffinity>;
  /**
   * Keyed by the workshop title in mp-backend, since workshop ids differ between the
   * dev and prod events. Affinity reflects the workshop's topic, never its sponsor.
   */
  workshops: Record<string, WorkshopConfig>;
  /** Keys are majors as stored in onboarding; unlisted majors add no signal. */
  majors: Record<string, TagAffinity>;
  matchesPerAttendee: number;
  /** Max attendees per delegate; enforced only when generating matches for everyone. */
  delegateCap: number;
  loadPenalty: number;
  overlapPenalty: number;
  seed: number;
  /** Explanation used when the attendee has no interests, workshops or major on file. */
  noSignalWhy: string;
  /** Appended to the delegate's tag when none of the attendee's choices point to it. */
  noOverlapWhy: string;
};

const B = "Brand Management";
const C = "Creative, Content & Advertising";
const G = "Growth & Digital Marketing";
const PR = "Product Management / Product Marketing";
const S = "Business Strategy & Market Research";
const PA = "Partnerships, Events & Experiential Marketing";

export const MATCHING_CONFIG: MatchingConfig = {
  configVersion: "2026-11-12.1",
  componentWeights: { interests: 0.5, workshops: 0.35, major: 0.15 },
  interests: {
    "Digital Marketing": { [G]: 3, [B]: 1, [C]: 1, [S]: 1 },
    "Brand Management": { [B]: 3, [C]: 1, [PA]: 1 },
    Entrepreneurship: { [S]: 2, [G]: 1, [PR]: 1, [B]: 1 },
    "UI/UX": { [PR]: 3, [C]: 2 },
    "Graphic Design": { [C]: 3, [B]: 1 },
    Consulting: { [S]: 3, [G]: 1 },
    "Product Management": { [PR]: 3, [S]: 1 },
    Sales: { [PA]: 3, [G]: 1, [S]: 1 },
  },
  workshops: {
    "L'Oréal: Brandstorm Workshop - Rethinking the Future of Beauty": {
      label: "Brandstorm",
      affinity: { [B]: 3, [C]: 2, [S]: 2, [G]: 1 },
    },
    "Telus: Own Your Narrative - Turning Setbacks into Strategy": {
      label: "Own Your Narrative",
      affinity: { [C]: 3, [B]: 2, [PA]: 1, [S]: 1 },
    },
    "Kenvue: Case Challenge - Product Innovation Strategy": {
      label: "Product Innovation Case Challenge",
      affinity: { [PR]: 3, [S]: 2, [B]: 2 },
    },
    "KITS Eyewhere: Retention-Driven Growth and a Fast-Growing Brand": {
      label: "Retention-Driven Growth",
      affinity: { [G]: 3, [B]: 2, [S]: 1 },
    },
    "Tocha Foods: What Marketing Looks Like in a Start-Up": {
      label: "Start-Up Marketing",
      affinity: { [S]: 2, [G]: 2, [B]: 2, [PA]: 1, [C]: 1 },
    },
  },
  majors: {
    Finance: { [S]: 2 },
    Accounting: { [S]: 2 },
    Economics: { [S]: 2 },
    Psychology: { [S]: 1, [B]: 1 },
    BTM: { [PR]: 2, [G]: 1 },
    BUCS: { [PR]: 2, [G]: 1 },
    "Media Studies": { [C]: 2, [PA]: 1 },
    Marketing: { [B]: 1, [G]: 1, [C]: 1 },
    "Marketing Management": { [B]: 1, [G]: 1, [C]: 1 },
    "Visual Art": { [C]: 3 },
    Architecture: { [C]: 2 },
    "Political Science": { [S]: 1, [PA]: 1 },
    Entrepreneurship: { [S]: 2, [G]: 1 },
  },
  matchesPerAttendee: 3,
  delegateCap: 6,
  loadPenalty: 0.4,
  overlapPenalty: 0.08,
  seed: 2026,
  noSignalWhy: "A broad pick to widen your network",
  noOverlapWhy: "a new area to explore",
};
