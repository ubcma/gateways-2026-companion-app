import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { GatewaysRoute } from "@/components/GatewaysRoute";
import { Spinner } from "@/components/Spinner";
import { getMyDelegateMatches } from "@/lib/data/delegate-matches";
import { getGatewaysRoute } from "@/lib/data/gateways-route";

export const metadata: Metadata = { title: "Gateways Route" };

export const viewport: Viewport = { themeColor: "#0e0e0e" };

async function Route() {
  const [{ line, scores, workshops }, delegateMatches] = await Promise.all([
    getGatewaysRoute(),
    getMyDelegateMatches(),
  ]);
  return (
    <GatewaysRoute
      line={line}
      scores={scores}
      workshops={workshops}
      delegates={delegateMatches.matches}
    />
  );
}

export default function ItineraryPage() {
  return (
    <div className="flex-1 bg-[#0e0e0e]">
      <main className="relative mx-auto h-[874px] w-full max-w-[402px] overflow-hidden font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
        <h1 className="sr-only">Gateways Route</h1>
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="size-6" />
            </div>
          }
        >
          <Route />
        </Suspense>
        <Link
          href="/"
          aria-label="Back"
          className="absolute left-[10px] top-[max(29px,env(safe-area-inset-top))] p-3"
        >
          <Image src="/gateways-route/back.svg" alt="" width={10} height={16} />
        </Link>
      </main>
    </div>
  );
}
