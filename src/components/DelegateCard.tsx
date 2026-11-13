import type { DelegateMatch } from "@/lib/delegate-matching/runtime";

export function DelegateCard({ match }: { match: DelegateMatch }) {
  return (
    <li className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600"
        >
          {match.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold">{match.name}</h3>
          <p className="text-sm text-zinc-600">
            {match.role} · {match.company}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-700">{match.why}</p>
    </li>
  );
}
