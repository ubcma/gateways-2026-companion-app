import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { TransitLoader } from "@/components/motion/TransitLoader";
import { NEXT_PARAM, safeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export const viewport: Viewport = { themeColor: "#0e0e0e" };

type SearchParams = PageProps<"/sign-in">["searchParams"];

// Users already signed in (e.g. on the membership portal) skip the form.
async function RedirectIfSignedIn({
  searchParams,
  children,
}: {
  searchParams: SearchParams;
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(safeNextPath((await searchParams)[NEXT_PARAM]));
  }
  return children;
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main
      data-theme="night"
      className="relative flex flex-1 flex-col bg-night font-display text-white"
    >
      <div className="relative flex flex-1 flex-col items-center justify-center px-8 pb-[max(env(safe-area-inset-bottom),3rem)] pt-[max(env(safe-area-inset-top),3rem)]">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <TransitLoader label="Boarding" />
            </div>
          }
        >
          <RedirectIfSignedIn searchParams={searchParams}>
            <SignInForm />
          </RedirectIfSignedIn>
        </Suspense>
      </div>
    </main>
  );
}
