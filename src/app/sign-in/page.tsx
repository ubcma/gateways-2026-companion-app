import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { Spinner } from "@/components/Spinner";
import { NEXT_PARAM, safeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

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
    <main className="relative flex flex-1 overflow-hidden">
      <div className="bg-auth-background absolute inset-0" aria-hidden />
      <div className="relative flex flex-1 flex-col items-center justify-center bg-white/60 px-8 pb-[max(env(safe-area-inset-bottom),3rem)] pt-[max(env(safe-area-inset-top),3rem)] shadow-[inset_0px_0px_80px_20px_rgba(255,255,255,0.1)] backdrop-blur-xl">
        <Suspense fallback={<Spinner className="size-6" />}>
          <RedirectIfSignedIn searchParams={searchParams}>
            <SignInForm />
          </RedirectIfSignedIn>
        </Suspense>
      </div>
    </main>
  );
}
