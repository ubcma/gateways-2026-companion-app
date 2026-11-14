"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";
import { signOut } from "@/lib/auth/sign-out";

export function SignOutButton({
  className = "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.replace("/sign-in");
      // Drop cached protected pages rendered while signed in.
      router.refresh();
    } catch (error) {
      console.error("Sign out failed", error);
      toast.error("Couldn't sign out. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
