import { MatchReasons } from "@/components/MatchReasons";
import type { Delegate, Match } from "@/lib/types";

type DelegateCardProps = {
  match: Match<Delegate>;
  major: string;
};

export function DelegateCard({ match, major }: DelegateCardProps) {
  const { item: delegate } = match;

  return (
    <li className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600"
        >
          {delegate.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold">{delegate.name}</h3>
          <p className="text-sm text-zinc-600">
            {delegate.title} · {delegate.company}
          </p>
        </div>
      </div>
      <MatchReasons
        sharesMajor={match.sharesMajor}
        major={major}
        sharedInterests={match.sharedInterests}
      />
    </li>
  );
}
