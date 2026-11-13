import { describe, expect, it } from "vitest";
import { GENERAL_TAG, JOB_TAGS, MATCHING_CONFIG } from "./config";
import {
  baseScore,
  buildAttendeeProfile,
  delegateTagVector,
  explainMatch,
  inputHash,
  isMatchableDelegate,
  toAttendeeInput,
  type AttendeeInput,
} from "./score";
import { delegate, KENVUE, KITS, LOREAL, TOCHA } from "./test-fixtures";

const [B, C, G, PR, S] = JOB_TAGS;

function score(input: AttendeeInput, tags: string[]) {
  return baseScore(buildAttendeeProfile(input, MATCHING_CONFIG), delegateTagVector(tags)!, MATCHING_CONFIG);
}

const attendeeA: AttendeeInput = {
  interests: "Digital Marketing, Sales, Entrepreneurship",
  workshops: [KENVUE, KITS],
  major: "Other",
};
const attendeeB: AttendeeInput = {
  interests: "Product Management, Entrepreneurship, UI/UX",
  workshops: [LOREAL, TOCHA],
  major: "BUCS",
};
const attendeeC: AttendeeInput = {
  interests: "Digital Marketing, Brand Management, Graphic Design, Product Management",
  workshops: [LOREAL, TOCHA],
  major: "Marketing",
};

describe("baseScore", () => {
  it.each<[string, AttendeeInput, string[], number]>([
    ["A vs Growth", attendeeA, [G], 0.2788],
    ["A vs Product", attendeeA, [PR], 0.1318],
    ["A vs Strategy + Brand", attendeeA, [S, B], 0.2212],
    ["B vs Product", attendeeB, [PR], 0.35],
    ["C vs Brand + Creative", attendeeC, [B, C], 0.2691],
    ["C vs General", attendeeC, [GENERAL_TAG], 0.1667],
  ])("%s", (_, input, tags, expected) => {
    expect(score(input, tags)).toBeCloseTo(expected, 3);
  });

  it("scores every delegate 1/6 when the attendee has no data", () => {
    for (const tags of [[G], [S, B], [GENERAL_TAG]]) {
      expect(score({}, tags)).toBeCloseTo(1 / 6, 9);
    }
  });

  it("treats interests as a string or an array the same", () => {
    expect(score({ interests: ["Sales", "UI/UX"] }, [PR])).toBe(score({ interests: "Sales, UI/UX" }, [PR]));
  });

  it("ignores whitespace and casing in interests, workshops and major", () => {
    const messy: AttendeeInput = {
      interests: "  digital MARKETING ,sales,   entrepreneurship ",
      workshops: [`  ${KENVUE.toUpperCase()} `, KITS.replace(": ", ":   ")],
      major: " other ",
    };
    expect(score(messy, [G])).toBeCloseTo(0.2788, 3);
    expect(inputHash(messy)).toBe(inputHash(attendeeA));
  });

  it("ignores unknown interests, workshops and majors", () => {
    const withUnknowns: AttendeeInput = {
      interests: ["Underwater Basket Weaving", "Digital Marketing", "Sales", "Entrepreneurship", ""],
      workshops: [KENVUE, KITS],
      major: "Computer Science",
    };
    expect(score(withUnknowns, [G])).toBeCloseTo(0.2788, 3);
  });

  it("gives no workshop signal when both slots are Not picked", () => {
    const notPicked = buildAttendeeProfile({ workshops: ["Not picked", "not picked"] }, MATCHING_CONFIG);
    expect(notPicked.components.workshops).toBeNull();
    expect(inputHash({ workshops: ["Not picked", null] })).toBe(inputHash({}));
  });

  it("counts the same workshop in both slots twice", () => {
    const once = buildAttendeeProfile({ workshops: [KENVUE, null], interests: "Sales" }, MATCHING_CONFIG);
    const twice = buildAttendeeProfile({ workshops: [KENVUE, KENVUE], interests: "Sales" }, MATCHING_CONFIG);
    expect(twice.components.workshops).toEqual(once.components.workshops);
    expect(inputHash({ workshops: [KENVUE, KENVUE] })).not.toBe(inputHash({ workshops: [KENVUE, null] }));
  });

  it("never uses the delegate's company", () => {
    const kenvueDelegate = delegate("kenvue-person", [G], { company: "Kenvue" });
    const otherDelegate = delegate("other-person", [G], { company: "Elsewhere" });
    const profile = buildAttendeeProfile(attendeeA, MATCHING_CONFIG);
    expect(baseScore(profile, delegateTagVector(kenvueDelegate.jobTags)!, MATCHING_CONFIG)).toBe(
      baseScore(profile, delegateTagVector(otherDelegate.jobTags)!, MATCHING_CONFIG),
    );
  });
});

describe("delegateTagVector", () => {
  it("splits multiple tags evenly and spreads General across all six", () => {
    expect(delegateTagVector([S, B])).toEqual([0.5, 0, 0, 0, 0.5, 0]);
    expect(delegateTagVector([GENERAL_TAG])).toEqual(JOB_TAGS.map(() => 1 / 6));
  });

  it.each([[[]], [["Marketing"]], [[GENERAL_TAG, B]], [null]])("rejects %j", (tags) => {
    expect(delegateTagVector(tags as string[])).toBeNull();
  });

  it("only treats delegates marked matchable with valid tags as matchable", () => {
    expect(isMatchableDelegate(delegate("ok", [GENERAL_TAG]))).toBe(true);
    expect(isMatchableDelegate(delegate("off", [B], { matchable: false }))).toBe(false);
    expect(isMatchableDelegate(delegate("bad", ["Sales"]))).toBe(false);
  });
});

describe("inputHash", () => {
  it("ignores interest order and duplicates but not workshop slot order", () => {
    expect(inputHash({ interests: "Sales, UI/UX, sales" })).toBe(inputHash({ interests: ["UI/UX", "Sales"] }));
    expect(inputHash({ workshops: [KENVUE, KITS] })).not.toBe(inputHash({ workshops: [KITS, KENVUE] }));
  });

  it("changes when the major changes", () => {
    expect(inputHash({ ...attendeeA, major: "Finance" })).not.toBe(inputHash(attendeeA));
  });
});

describe("toAttendeeInput", () => {
  it("drops interests and major until onboarding is complete", () => {
    const record = { workshops: [KENVUE, KITS] as const, interests: "Sales", major: "BTM" };
    expect(toAttendeeInput({ ...record, onboardingComplete: false })).toEqual({
      workshops: record.workshops,
      interests: null,
      major: null,
    });
    expect(toAttendeeInput({ ...record, onboardingComplete: true })).toEqual(record);
    expect(toAttendeeInput(null)).toEqual({ workshops: null, interests: null, major: null });
  });
});

describe("explainMatch", () => {
  const why = (input: AttendeeInput, tags: string[]) =>
    explainMatch(
      buildAttendeeProfile(input, MATCHING_CONFIG),
      { jobTags: tags },
      delegateTagVector(tags)!,
      MATCHING_CONFIG,
    );

  it("names the top tag and the choices behind it, never the sponsor", () => {
    expect(why(attendeeA, [G])).toBe(
      "Growth & Digital Marketing (interest: Digital Marketing, Entrepreneurship, Sales; workshop: Retention-Driven Growth)",
    );
    expect(why({ interests: "Digital Marketing, Brand Management", workshops: [LOREAL, null] }, [B])).toBe(
      "Brand Management (interest: Brand Management, Digital Marketing; workshop: Brandstorm)",
    );
    expect(why(attendeeB, [PR])).toBe(
      "Product Management / Product Marketing (interest: Product Management, UI/UX, Entrepreneurship; major: BUCS)",
    );
  });

  it("labels General delegates and falls back when there is no signal or overlap", () => {
    expect(why(attendeeC, [GENERAL_TAG])).toMatch(/^General: Brand Management \(/);
    expect(why({}, [G])).toBe(MATCHING_CONFIG.noSignalWhy);
    expect(why({ interests: "Graphic Design" }, [PR])).toBe(
      `${PR} (${MATCHING_CONFIG.noOverlapWhy})`,
    );
  });
});
