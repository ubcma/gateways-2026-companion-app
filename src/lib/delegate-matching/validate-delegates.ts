import { GENERAL_TAG } from "./config";
import { delegateTagVector } from "./score";

export type DelegateIssue = { index: number; id: string; problem: string };

export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Checks a hand-maintained delegates.json. Delegates with bad tags are excluded
 * from matching regardless; this reports them so the file can be fixed.
 */
export function findDelegateIssues(raw: unknown): DelegateIssue[] {
  if (!Array.isArray(raw)) {
    return [{ index: -1, id: "", problem: "delegates.json must be an array" }];
  }

  const issues: DelegateIssue[] = [];
  const seenIds = new Set<string>();

  raw.forEach((value, index) => {
    const delegate = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
    const id = typeof delegate.id === "string" ? delegate.id : "";
    const report = (problem: string) => issues.push({ index, id, problem });

    for (const field of ["id", "name", "company", "role"]) {
      const text = delegate[field];
      if (typeof text !== "string" || !text.trim()) {
        report(`blank ${field}`);
      } else if (text !== text.trim()) {
        report(`${field} has leading or trailing whitespace`);
      }
    }
    const { linkedinUrl } = delegate;
    if (linkedinUrl !== undefined && (typeof linkedinUrl !== "string" || !linkedinUrl.startsWith("https://"))) {
      report("linkedinUrl must start with https://; it won't be shown");
    }
    if (typeof delegate.name === "string" && id && id !== slugify(delegate.name)) {
      report(`id should be "${slugify(delegate.name)}"`);
    }
    if (id && seenIds.has(id)) {
      report("duplicate id");
    }
    seenIds.add(id);

    if (typeof delegate.matchable !== "boolean") {
      report("matchable must be true or false");
    }
    const tags = Array.isArray(delegate.jobTags) ? delegate.jobTags : [];
    if (tags.length === 0) {
      report("blank tag; excluded from matching");
    } else if (!delegateTagVector(tags)) {
      const problem = tags.includes(GENERAL_TAG) ? `"${GENERAL_TAG}" combined with other tags` : "unrecognized tag";
      report(`${problem} (${tags.map((tag) => JSON.stringify(tag)).join(", ")}); excluded from matching`);
    }
  });

  return issues;
}
