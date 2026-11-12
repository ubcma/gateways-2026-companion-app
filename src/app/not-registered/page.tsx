import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Spinner } from "@/components/Spinner";
import { getCurrentUser, getGatewaysAccess } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Not registered" };

const portalURL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://app.ubcma.ca";

async function NotRegistered() {
  const access = await getGatewaysAccess();
  if (access === "signed-out") {
    redirect("/sign-in");
  }
  if (access === "registered") {
    redirect("/");
  }
  const user = await getCurrentUser();

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <Image src="/logos/logo_red.svg" width={96} height={96} alt="UBC MA Logo" priority />
      <div>
        <h1 className="mb-2 text-2xl font-semibold">You&apos;re not registered for Gateways</h1>
        <p className="text-base text-zinc-500">
          The companion app is only available to Gateways 2026 attendees.
          {user && (
            <>
              {" "}
              You&apos;re signed in as <span className="font-medium text-zinc-700">{user.email}</span>.
            </>
          )}
        </p>
      </div>
      <a
        href={`${portalURL}/events/gateways`}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ma-red px-6 text-base font-medium text-white shadow-xs transition-all hover:bg-ma-red/90 active:scale-[0.97]"
      >
        Register on the Membership Portal <ArrowUpRight className="size-4" />
      </a>
      <p className="text-sm text-zinc-500">Registered with a different account?</p>
      <SignOutButton />
    </div>
  );
}

export default function NotRegisteredPage() {
  return (
    <main className="relative flex flex-1 overflow-hidden">
      <div className="bg-auth-background absolute inset-0" aria-hidden />
      <div className="relative flex flex-1 flex-col items-center justify-center bg-white/60 px-8 pb-[max(env(safe-area-inset-bottom),3rem)] pt-[max(env(safe-area-inset-top),3rem)] backdrop-blur-xl">
        <Suspense fallback={<Spinner className="size-6" />}>
          <NotRegistered />
        </Suspense>
      </div>
    </main>
  );
}
