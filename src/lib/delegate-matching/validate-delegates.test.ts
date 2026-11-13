import { describe, expect, it } from "vitest";
import delegatesJson from "../../data/delegates.json";
import { findDelegateIssues, slugify } from "./validate-delegates";

describe("slugify", () => {
  it("makes a stable slug from the name", () => {
    expect(slugify("  Irene Zhang ")).toBe("irene-zhang");
    expect(slugify("Minnie (Parima) Tanglertsampa")).toBe("minnie-parima-tanglertsampa");
    expect(slugify("Zoë O'Brien-Smith")).toBe("zoe-o-brien-smith");
  });
});

describe("findDelegateIssues", () => {
  it("finds no problems in the committed delegates.json", () => {
    expect(findDelegateIssues(delegatesJson)).toEqual([]);
  });

  it("reports bad ids, whitespace, duplicates and bad tags", () => {
    const good = { company: "Acme", role: "Lead", matchable: true };
    const issues = findDelegateIssues([
      { ...good, id: "irene-zhang", name: "Irene Zhang", jobTags: ["Brand Management"] },
      { ...good, id: "irene-zhang", name: "Irene Zhang", jobTags: ["Brand Management"] },
      { ...good, id: "sam", name: "Sam Lee ", jobTags: ["General"] },
      { ...good, id: "no-tag", name: "No Tag", jobTags: [] },
      { ...good, id: "odd-tag", name: "Odd Tag", jobTags: ["Sales"] },
      { ...good, id: "mixed", name: "Mixed", jobTags: ["General", "Brand Management"] },
      { id: "bare", name: "Bare", company: "", role: "Lead", jobTags: ["Brand Management"] },
    ]);
    expect(issues.map(({ index, problem }) => `${index}: ${problem}`)).toEqual([
      "1: duplicate id",
      "2: name has leading or trailing whitespace",
      '2: id should be "sam-lee"',
      "3: blank tag; excluded from matching",
      '4: unrecognized tag ("Sales"); excluded from matching',
      '5: "General" combined with other tags ("General", "Brand Management"); excluded from matching',
      "6: blank company",
      "6: matchable must be true or false",
    ]);
  });
});
