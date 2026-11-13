import { describe, expect, it } from "vitest";
import { GENERAL_TAG, JOB_TAGS, MATCHING_CONFIG } from "./config";
import { regenerateMatchesFile, serializeMatchesFile, loadsFromEntries } from "./matches-file";
import { isMatchableDelegate, type Delegate } from "./score";
import { generateMatches, mulberry32, normalizeCompany, rankAndSelect } from "./select";
import {
  delegate,
  KENVUE,
  KITS,
  syntheticAttendees,
  fixtureDelegates,
} from "./test-fixtures";

const [B, C, G, PR, S, PA] = JOB_TAGS;
const config = MATCHING_CONFIG;
const delegates = fixtureDelegates();
const attendees = syntheticAttendees();
const matchableIds = new Set(delegates.filter(isMatchableDelegate).map(({ id }) => id));
const byId = new Map(delegates.map((d) => [d.id, d]));

describe("normalizeCompany", () => {
  it("keeps lowercase letters and digits only", () => {
    expect(normalizeCompany(" L'Oréal Canada ")).toBe("lorealcanada");
    expect(normalizeCompany("loreal-canada")).toBe("lorealcanada");
    expect(normalizeCompany(null)).toBe("");
  });
});

describe("mulberry32", () => {
  it("is reproducible for a seed", () => {
    const a = mulberry32(2026);
    const b = mulberry32(2026);
    const values = Array.from({ length: 5 }, () => a());
    expect(values).toEqual(Array.from({ length: 5 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

describe("rankAndSelect", () => {
  const pool: Delegate[] = [
    delegate("growth-a", [G], { company: "Acme" }),
    delegate("growth-b", [G], { company: "ACME!" }),
    delegate("growth-c", [G], { company: "Beta" }),
    delegate("strategy", [S], { company: "Gamma" }),
    delegate("product", [PR], { company: "Delta" }),
    delegate("brand", [B], { company: "Epsilon" }),
    delegate("hidden-growth", [G], { company: "Zeta", matchable: false }),
  ];
  const growthFan = { interests: "Digital Marketing", workshops: [KITS, KITS] as const };

  it("picks 3 different delegates from 3 different companies", () => {
    const picks = rankAndSelect(growthFan, pool, config);
    expect(picks.map(({ delegateId }) => delegateId)).toEqual(["growth-a", "growth-c", "brand"]);
    expect(picks.map(({ rank }) => rank)).toEqual([1, 2, 3]);
  });

  it("never picks a non-matchable delegate", () => {
    const picks = rankAndSelect(growthFan, pool, config);
    expect(picks.some(({ delegateId }) => delegateId === "hidden-growth")).toBe(false);
  });

  it("stores the base score to 3 decimals, not the adjusted score", () => {
    const [first] = rankAndSelect(growthFan, pool, config, { loads: new Map([["growth-a", 3]]) });
    expect(first).toMatchObject({ delegateId: "growth-b", score: 0.5 });
  });

  it("breaks ties by lower load, then by id", () => {
    const twins = [delegate("twin-b", [G], { company: "B" }), delegate("twin-a", [G], { company: "A" })];
    expect(rankAndSelect({}, twins, { ...config, matchesPerAttendee: 1 })[0].delegateId).toBe("twin-a");
    const fullerA = new Map([["twin-a", 1]]);
    expect(
      rankAndSelect({}, twins, { ...config, matchesPerAttendee: 1, loadPenalty: 0 }, { loads: fullerA })[0]
        .delegateId,
    ).toBe("twin-b");
  });

  it("gives an attendee with no data 3 diverse delegates", () => {
    const picks = rankAndSelect({ workshops: ["Not picked", "Not picked"], interests: [] }, delegates, config);
    expect(picks).toHaveLength(3);
    const chosen = picks.map(({ delegateId }) => byId.get(delegateId)!);
    expect(new Set(chosen.map(({ company }) => normalizeCompany(company))).size).toBe(3);
    expect(new Set(chosen.map(({ jobTags }) => jobTags.join(";"))).size).toBe(3);
    expect(picks.every(({ score, why }) => score === 0.167 && why === config.noSignalWhy)).toBe(true);
  });

  it("can pick a General delegate when signals are weak", () => {
    const generalOnly = [
      delegate("general", [GENERAL_TAG], { company: "G" }),
      delegate("creative", [C], { company: "C" }),
      delegate("partners", [PA], { company: "P" }),
    ];
    const picks = rankAndSelect({ interests: "Consulting" }, generalOnly, config);
    expect(picks[0]).toMatchObject({ delegateId: "general", score: 0.167 });
    expect(picks[0].why).toMatch(/^General: Business Strategy & Market Research/);
  });

  it("returns fewer picks instead of repeating a company", () => {
    const sameCompany = [delegate("a", [G], { company: "Same" }), delegate("b", [B], { company: "same" })];
    expect(rankAndSelect({}, sameCompany, config)).toHaveLength(1);
  });

  it("returns no picks for malformed input when there are no delegates", () => {
    expect(rankAndSelect(null, [], config)).toEqual([]);
  });
});

describe("generateMatches", () => {
  const { matches, loads } = generateMatches(attendees, delegates, config);
  const entries = Object.entries(matches);

  it("gives every attendee exactly 3 distinct delegates from 3 distinct companies", () => {
    expect(entries).toHaveLength(attendees.length);
    for (const [, entry] of entries) {
      const ids = entry.matches.map(({ delegateId }) => delegateId);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      expect(new Set(ids.map((id) => normalizeCompany(byId.get(id)!.company))).size).toBe(3);
    }
  });

  it("respects the cap and never picks non-matchable delegates", () => {
    for (const [delegateId, load] of loads) {
      expect(matchableIds.has(delegateId)).toBe(true);
      expect(load).toBeLessThanOrEqual(config.delegateCap);
    }
  });

  it("gives every matchable delegate at least one match when there's enough capacity", () => {
    for (const id of matchableIds) {
      expect(loads.get(id) ?? 0).toBeGreaterThanOrEqual(1);
    }
  });

  it("is byte-for-byte identical across runs and attendee orders", () => {
    const serialize = (result: ReturnType<typeof generateMatches>) =>
      serializeMatchesFile({ generatedAt: "fixed", configVersion: config.configVersion, matches: result.matches });
    const first = serialize(generateMatches(attendees, delegates, config));
    expect(serialize(generateMatches(attendees, delegates, config))).toBe(first);
    expect(serialize(generateMatches([...attendees].reverse(), delegates, config))).toBe(first);
  });

  it("enforces the cap even when capacity runs out", () => {
    const tiny = [delegate("x", [G], { company: "X" }), delegate("y", [B], { company: "Y" })];
    const result = generateMatches(syntheticAttendees(10), tiny, { ...config, delegateCap: 2 });
    expect(Math.max(...result.loads.values())).toBe(2);
    const picked = Object.values(result.matches).reduce((sum, entry) => sum + entry.matches.length, 0);
    expect(picked).toBe(4);
  });
});

describe("regenerateMatchesFile", () => {
  const firstWave = attendees.slice(0, 60);
  const base = regenerateMatchesFile({
    existing: null,
    attendees: firstWave,
    delegates,
    config,
    mode: { kind: "all" },
    generatedAt: "t1",
  }).file;

  it("--only-missing keeps unchanged entries and only adds new or changed attendees", () => {
    const changed = { ...attendees[5], workshops: [KENVUE, KENVUE] as const, interests: "UI/UX" };
    const everyone = [...attendees.slice(0, 5), changed, ...attendees.slice(6)];
    const { file, generated, kept, dropped } = regenerateMatchesFile({
      existing: base,
      attendees: everyone,
      delegates,
      config,
      mode: { kind: "only-missing" },
      generatedAt: "t2",
    });

    expect(kept).toHaveLength(59);
    expect(generated.sort()).toEqual([changed.userId, ...attendees.slice(60).map(({ userId }) => userId)].sort());
    expect(dropped).toEqual([]);
    for (const userId of kept) {
      expect(file.matches[userId]).toEqual(base.matches[userId]);
    }
    for (const load of loadsFromEntries(file.matches).values()) {
      expect(load).toBeLessThanOrEqual(config.delegateCap);
    }
    expect(Object.keys(file.matches)).toHaveLength(attendees.length);
  });

  it("--only-missing drops entries for users who are no longer registered", () => {
    const { dropped, file } = regenerateMatchesFile({
      existing: base,
      attendees: firstWave.slice(1),
      delegates,
      config,
      mode: { kind: "only-missing" },
      generatedAt: "t2",
    });
    expect(dropped).toEqual([firstWave[0].userId]);
    expect(file.matches[firstWave[0].userId]).toBeUndefined();
  });

  it("--only-missing rematches attendees whose delegate is no longer matchable", () => {
    const [victim] = base.matches[firstWave[0].userId].matches;
    const withoutVictim = delegates.map((d) => (d.id === victim.delegateId ? { ...d, matchable: false } : d));
    const { generated } = regenerateMatchesFile({
      existing: base,
      attendees: firstWave,
      delegates: withoutVictim,
      config,
      mode: { kind: "only-missing" },
      generatedAt: "t2",
    });
    expect(generated).toContain(firstWave[0].userId);
  });

  it("--user rematches only that attendee", () => {
    const target = { ...firstWave[3], interests: "Sales", workshops: null, major: null };
    const others = firstWave.filter(({ userId }) => userId !== target.userId);
    const { file, generated } = regenerateMatchesFile({
      existing: base,
      attendees: [...others, target],
      delegates,
      config,
      mode: { kind: "user", userId: target.userId },
      generatedAt: "t2",
    });
    expect(generated).toEqual([target.userId]);
    for (const { userId } of others) {
      expect(file.matches[userId]).toEqual(base.matches[userId]);
    }
    expect(file.matches[target.userId].inputHash).not.toBe(base.matches[target.userId].inputHash);
  });

  it("--user rejects someone who isn't registered", () => {
    expect(() =>
      regenerateMatchesFile({
        existing: base,
        attendees: firstWave,
        delegates,
        config,
        mode: { kind: "user", userId: "nobody" },
        generatedAt: "t2",
      }),
    ).toThrow(/not a registered attendee/);
  });
});
