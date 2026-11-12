import { MatchReasons } from "@/components/MatchReasons";
import type { Job, Match } from "@/lib/types";

type JobCardProps = {
  match: Match<Job>;
  major: string;
};

export function JobCard({ match, major }: JobCardProps) {
  const { item: job } = match;

  return (
    <li className="rounded-xl border border-zinc-200 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {job.type}
      </span>
      <h3 className="font-semibold">{job.title}</h3>
      <p className="text-sm text-zinc-600">
        {job.company} · {job.location}
      </p>
      <MatchReasons
        sharesMajor={match.sharesMajor}
        major={major}
        sharedInterests={match.sharedInterests}
      />
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
      >
        View on UBCMA job portal
      </a>
    </li>
  );
}
