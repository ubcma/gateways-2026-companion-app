import type { Viewport } from "next";
import Image from "next/image";
import { Suspense, type ComponentProps } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { HomePanel, PanelBackground } from "@/components/HomePanel";
import { RememberLine } from "@/components/motion/PageTransitions";
import { TransitBackdrop } from "@/components/TransitLines";
import { getMe } from "@/lib/data/attendee";
import { getGatewaysRoute } from "@/lib/data/gateways-route";
import type { Line } from "@/lib/gateways-line/config";

export const viewport: Viewport = { themeColor: "#0e0e0e" };

const portalURL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://app.ubcma.ca";

const ROUTE_PANEL_IMAGES: Record<Line, string> = {
  General: "/panels/route-general.webp",
  Brand: "/panels/route-brand.webp",
  Creative: "/panels/route-creative.webp",
  Product: "/panels/route-product.webp",
};

/** The route drawn in the attendee's line colour. */
async function RouteLineImage() {
  const { line } = await getGatewaysRoute();
  return (
    <>
      <Image
        src={ROUTE_PANEL_IMAGES[line]}
        alt=""
        width={470}
        height={1024}
        unoptimized
        priority
        className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2"
      />
      <RememberLine line={line} />
    </>
  );
}

const panels: Omit<ComponentProps<typeof HomePanel>, "index">[] = [
  {
    href: "/itinerary",
    title: "View your personalized route",
    action: "Open",
    featured: true,
    scrim: "strong",
    transition: { kind: "board" },
    background: (
      <PanelBackground>
        <Suspense>
          <RouteLineImage />
        </Suspense>
      </PanelBackground>
    ),
  },
  {
    href: "/delegates",
    title: "Browse your delegates",
    action: "Connect",
    narrowTitle: true,
    scrim: "soft",
    transition: { kind: "doors", stop: "Your Delegates" },
    background: (
      <PanelBackground>
        <Image
          src="/panels/delegates.webp"
          alt=""
          width={860}
          height={502}
          unoptimized
          className="absolute right-0 top-[35px] h-auto w-[213px]"
        />
      </PanelBackground>
    ),
  },
  {
    href: "https://app.ubcma.ca/job-board",
    title: "View 50+ marketing internships",
    action: "View",
    external: true,
    background: (
      <PanelBackground>
        <Image
          src="/logos/ma-logo.webp"
          alt=""
          width={1024}
          height={1024}
          className="absolute left-[-4.33%] top-[-83.72%] h-auto w-[127.1%] max-w-none blur-[6.1px]"
        />
      </PanelBackground>
    ),
  },
  {
    href: "/floor-plan",
    title: "Floor Plan",
    action: "View",
    scrim: "soft",
    transition: { kind: "doors", stop: "Floor Plan" },
    background: (
      <PanelBackground>
        <Image
          src="/panels/floor-plan.webp"
          alt=""
          width={908}
          height={760}
          unoptimized
          className="absolute right-0 top-0 h-full w-auto max-w-none"
        />
      </PanelBackground>
    ),
  },
];

async function Account() {
  const me = await getMe();
  if (!me) {
    return <AccountPlaceholder />;
  }
  // The portal's preset avatars are paths on the portal itself.
  const avatar = me.avatar ? new URL(me.avatar, portalURL).toString() : null;
  return <AccountMenu name={me.name} email={me.email} image={avatar} />;
}

function AccountPlaceholder() {
  return <span className="block size-12 rounded-full bg-zinc-800" />;
}

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col bg-night font-display text-white">
      <TransitBackdrop />

      {/* Bottom padding keeps the last panel clear of the red line when scrolled to the end. */}
      <main className="relative flex flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-[max(73px,calc(env(safe-area-inset-top)+1rem))]">
        <header className="flex items-end justify-between gap-4 px-5">
          <h1>
            <span className="rise-in block text-[20px] font-bold leading-[30px] tracking-[-0.04em]">
              Welcome to
            </span>
            {/* The intro's logo flies into this spot. */}
            <Image
              src="/logos/gateways-logo.png"
              alt="Gateways"
              width={1024}
              height={217}
              priority
              data-intro-logo
              className="mt-0.5 h-[35px] w-auto"
            />
          </h1>
          <div className="rise-in [--delay:200ms]">
            <Suspense fallback={<AccountPlaceholder />}>
              <Account />
            </Suspense>
          </div>
        </header>

        <nav aria-label="Gateways 2026" className="relative z-10 mt-4 flex flex-col gap-3.5 px-5">
          {panels.map((panel, index) => (
            <HomePanel key={panel.href} index={index} {...panel} />
          ))}
        </nav>
      </main>
    </div>
  );
}
