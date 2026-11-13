import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DelegateCard } from "@/components/DelegateCard";
import { ListSkeleton } from "@/components/ListSkeleton";
import { getMyDelegateMatches } from "@/lib/data/delegate-matches";

export const metadata: Metadata = { title: "Delegate Matching" };

async function DelegateMatches() {
  const { matches, reason } = await getMyDelegateMatches();

  if (matches.length === 0) {
    return <p className="text-sm text-zinc-600">{reason ?? "Your matches are on their way."}</p>;
  }

  return (
    <ul className="space-y-3">
      {matches.map((match) => (
        <DelegateCard key={match.delegateId} match={match} />
      ))}
    </ul>
  );
}

export default function DelegatesPage() {
  return (
    <>
      <AppHeader
        title="Delegate Matching"
        subtitle="3 delegates based on your interests, workshops and major."
        backHref="/"
      />
      <main className="flex-1 p-4">
        <Suspense fallback={<ListSkeleton />}>
          <DelegateMatches />
        </Suspense>
      </main>
    </>
  );
}
