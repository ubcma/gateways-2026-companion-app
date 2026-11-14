import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DelegateCard } from "@/components/DelegateCard";
import { TransitLoader } from "@/components/motion/TransitLoader";
import { getMyDelegateMatches } from "@/lib/data/delegate-matches";

export const metadata: Metadata = { title: "Delegate Matching" };

export const viewport: Viewport = { themeColor: "#0e0e0e" };

async function DelegateMatches() {
  const { matches, reason } = await getMyDelegateMatches();

  if (matches.length === 0) {
    return <p className="text-sm text-zinc-400">{reason ?? "Your matches are on their way."}</p>;
  }

  return (
    <ul className="flex flex-1 flex-col gap-3.5">
      {matches.map((match, index) => (
        <DelegateCard key={match.delegateId} match={match} index={index} />
      ))}
    </ul>
  );
}

export default function DelegatesPage() {
  return (
    <div className="flex flex-1 flex-col bg-night font-display text-white">
      <AppHeader
        title="Your Delegates"
        subtitle="Here are your personalized delegate matches. Go connect!"
        backHref="/"
      />
      <main className="flex flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-2">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center pb-16">
              <TransitLoader label="Finding your delegates" />
            </div>
          }
        >
          <DelegateMatches />
        </Suspense>
      </main>
    </div>
  );
}
