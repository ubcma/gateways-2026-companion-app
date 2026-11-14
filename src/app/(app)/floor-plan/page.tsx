import type { Metadata, Viewport } from "next";
import { Download } from "lucide-react";
import Image from "next/image";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = { title: "Floor Plan" };

export const viewport: Viewport = { themeColor: "#0e0e0e" };

const PDF_URL = "/venue/gateways-floor-plan.pdf";

// Pages 2 and 3 of the PDF, rendered at 2.5x so they stay sharp when pinch-zoomed.
const PAGES = [
  {
    src: "/venue/map-summary.webp",
    alt: "Map summary. Alumni Centre venue: Jack Poole Hall, the main conference hall, 2nd floor; coat check, 2nd floor, Bill & Rise Levine Classroom. AMS Nest venue, all on the 2nd floor: Telus workshop, room 2311; L'Oréal workshop, room 2314; Kimberly Clark (Kenvue) case, room 2504; Tocha Foods workshop, room 2311; Kits Eyewear, room 2314; lunch room, room 2528; lunch games, rooms 2311 and 2314.",
  },
  {
    src: "/venue/networking-floor-plan.webp",
    alt: "Networking floor plan: booths 1 to 29 line the walls of the hall, colour-coded as technology, retail, agency, entertainment, food, clubs and miscellaneous, with Studios and UBCMA up front by the two projector screens and rows of seating in the middle.",
  },
];

export default function FloorPlanPage() {
  return (
    <div className="flex-1 bg-night font-display text-white">
      <AppHeader title="Floor Plan" subtitle="Pinch to zoom in on the map." backHref="/" />

      <main className="pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        {PAGES.map((page, index) => (
          <Image
            key={page.src}
            src={page.src}
            alt={page.alt}
            width={3240}
            height={4319}
            unoptimized
            priority={index === 0}
            className="h-auto w-full"
          />
        ))}
        <div className="px-5">
          <a
            href={PDF_URL}
            download
            className="inline-flex bg-white text-night h-9 items-center gap-1.5 rounded-full px-4 text-[15px] font-medium tracking-[-0.04em] outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Download aria-hidden className="size-4" />
            Download PDF
          </a>
        </div>
      </main>
    </div>
  );
}
