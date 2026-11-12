import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ListSkeleton } from "@/components/ListSkeleton";
import { SessionCard } from "@/components/SessionCard";
import { getItinerary } from "@/lib/data/itinerary";

export const metadata: Metadata = { title: "Gateways Route" };

async function Itinerary() {
  const sessions = await getItinerary();

  return (
    <ol className="space-y-3">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </ol>
  );
}

export default function ItineraryPage() {
  return (
    <>
      <AppHeader
        title="Gateways Route"
        subtitle="Know what's next and where to be."
        backHref="/"
      />
      <main className="flex-1 p-4">
        <Suspense fallback={<ListSkeleton rows={5} />}>
          <Itinerary />
        </Suspense>
      </main>
    </>
  );
}
