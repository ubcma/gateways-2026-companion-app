import { Suspense, type ReactNode } from "react";
import { Spinner } from "@/components/Spinner";
import { requireAttendee } from "@/lib/auth/session";

// Every page waits on the attendee check, which may redirect.
export const instant = false;

async function RequireAttendee({ children }: { children: ReactNode }) {
  await requireAttendee();
  return children;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      }
    >
      <RequireAttendee>{children}</RequireAttendee>
    </Suspense>
  );
}
