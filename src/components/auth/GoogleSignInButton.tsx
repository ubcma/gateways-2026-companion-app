"use client";

import Image from "next/image";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth/sign-in";
import { Spinner } from "@/components/Spinner";
import { AuthButton } from "./AuthButton";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <AuthButton
      type="button"
      variant="google"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Spinner />
          <span>Redirecting to login...</span>
        </>
      ) : (
        <>
          <Image src="/logos/google.svg" height={16} width={16} alt="" />
          <span>Continue with Google</span>
        </>
      )}
    </AuthButton>
  );
}
