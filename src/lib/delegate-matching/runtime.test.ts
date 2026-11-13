import { describe, expect, it } from "vitest";
import { MATCHING_CONFIG } from "./config";
import { readMatchesFile, type MatchesFile } from "./matches-file";
import { getDelegateMatchesForUser, type MatchData } from "./runtime";
import { generateMatches } from "./select";
import { delegate, KENVUE, KITS, syntheticAttendees, fixtureDelegates } from "./test-fixtures";

const delegates = fixtureDelegates();
const attendees = syntheticAttendees(30);
const file: MatchesFile = {
  generatedAt: "fixed",
  configVersion: MATCHING_CONFIG.configVersion,
  matches: generateMatches(attendees, delegates, MATCHING_CONFIG).matches,
};
const data: MatchData = { file, delegates, config: MATCHING_CONFIG };
const [first] = attendees;

describe("getDelegateMatchesForUser", () => {
  it("returns the stored matches, hydrated with delegate details", () => {
    const result = getDelegateMatchesForUser(first.userId, first, { data });
    expect(result.source).toBe("file");
    expect(result.matches.map(({ delegateId }) => delegateId)).toEqual(
      file.matches[first.userId].matches.map(({ delegateId }) => delegateId),
    );
    const delegateInfo = delegates.find(({ id }) => id === result.matches[0].delegateId)!;
    expect(result.matches[0]).toMatchObject({
      name: delegateInfo.name,
      company: delegateInfo.company,
      role: delegateInfo.role,
      jobTags: delegateInfo.jobTags,
    });
  });

  it("scores on the fly when the stored inputHash is stale", () => {
    const changed = { ...first, workshops: [KENVUE, KITS] as const, interests: "Product Management" };
    const result = getDelegateMatchesForUser(first.userId, changed, { data });
    expect(result.source).toBe("fallback");
    expect(result.reason).toMatch(/changed/);
    expect(result.matches).toHaveLength(3);
  });

  it("keeps the stored match when the current inputs couldn't be fully loaded", () => {
    const result = getDelegateMatchesForUser(first.userId, { interests: null }, { data, inputComplete: false });
    expect(result.source).toBe("file");
  });

  it("scores attendees missing from the file", () => {
    const result = getDelegateMatchesForUser("new-user", { workshops: ["Not picked", "Not picked"] }, { data });
    expect(result.source).toBe("fallback");
    expect(result.matches).toHaveLength(3);
    expect(new Set(result.matches.map(({ company }) => company)).size).toBe(3);
  });

  it("falls back when a stored delegate is no longer matchable", () => {
    const [stored] = file.matches[first.userId].matches;
    const withdrawn = delegates.map((d) => (d.id === stored.delegateId ? { ...d, matchable: false } : d));
    const result = getDelegateMatchesForUser(first.userId, first, { data: { ...data, delegates: withdrawn } });
    expect(result.source).toBe("fallback");
    expect(result.matches.some(({ delegateId }) => delegateId === stored.delegateId)).toBe(false);
  });

  it("returns an empty list with a reason only when no delegate is matchable", () => {
    const none = { ...data, delegates: [delegate("off", [], { matchable: false })] };
    const result = getDelegateMatchesForUser(first.userId, first, { data: none });
    expect(result).toEqual({ matches: [], source: "none", reason: expect.any(String) });
  });

  it("handles a malformed matches file and missing user id", () => {
    const broken = { ...data, file: readMatchesFile({ matches: { x: { inputHash: 3 } } }) };
    const result = getDelegateMatchesForUser("", null, { data: broken });
    expect(result.source).toBe("fallback");
    expect(result.matches).toHaveLength(3);
  });
});
