import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DelegateCard } from "@/components/DelegateCard";
import { ListSkeleton } from "@/components/ListSkeleton";
import { getDelegates } from "@/lib/data/delegates";
import { getProfile } from "@/lib/data/profile";
import { rankMatches } from "@/lib/matching";

export const metadata: Metadata = { title: "Delegate Matching" };

async function DelegateMatches() {
  const [profile, delegates] = await Promise.all([
    getProfile(),
    getDelegates(),
  ]);
  const matches = rankMatches(profile, delegates);

  return (
    <ul className="space-y-3">
      {matches.map((match) => (
        <DelegateCard key={match.item.id} match={match} major={profile.major} />
      ))}
    </ul>
  );
}

export default function DelegatesPage() {
  return (
    <>
      <AppHeader
        title="Delegate Matching"
        subtitle="3 delegates based on your interests and major."
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
