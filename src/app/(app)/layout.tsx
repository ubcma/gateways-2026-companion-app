import { Suspense, type ReactNode } from "react";
import { IntroSplash } from "@/components/motion/IntroSplash";
import { PageTransitions } from "@/components/motion/PageTransitions";
import { TransitLoader } from "@/components/motion/TransitLoader";
import { requireAttendee } from "@/lib/auth/session";

// Every page waits on the attendee check, which may redirect.
export const instant = false;

async function RequireAttendee({ children }: { children: ReactNode }) {
  if (process.env.PREVIEW_NO_AUTH !== "1") await requireAttendee();
  return children;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div data-theme="night" className="flex flex-1 flex-col bg-night">
      <PageTransitions>
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <TransitLoader label="Boarding" />
            </div>
          }
        >
          <RequireAttendee>{children}</RequireAttendee>
        </Suspense>
      </PageTransitions>
      <IntroSplash />
    </div>
  );
}
