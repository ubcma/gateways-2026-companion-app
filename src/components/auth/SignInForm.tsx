"use client";

import { useForm } from "@tanstack/react-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, LogIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";
import { signInWithEmail } from "@/lib/auth/sign-in";
import { validateEmail } from "@/lib/auth/validate-email";
import { AuthButton } from "./AuthButton";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { InputField } from "./InputField";

const portalURL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://app.ubcma.ca";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  duration: 0.3,
};

const fadeTransition = { duration: 0.3 };

function showError(error: unknown) {
  console.error("Sign-in error:", error);
  toast.error(error instanceof Error ? error.message : "Something went wrong");
}

export function SignInForm() {
  const [step, setStep] = useState<"email" | "password" | "google">("email");
  const [email, setEmail] = useState("");

  const emailForm = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      try {
        const data = await validateEmail(value.email);
        setEmail(value.email);
        setStep(data.provider === "google" ? "google" : "password");
      } catch (error) {
        showError(error);
      }
    },
  });

  const passwordForm = useForm({
    defaultValues: { password: "" },
    onSubmit: async ({ value }) => {
      try {
        await signInWithEmail(email, value.password);
      } catch (error) {
        showError(error);
      }
    },
  });

  const handleGoBack = () => {
    setStep("email");
    passwordForm.reset();
  };

  return (
    <div className="flex h-fit w-full flex-col justify-center gap-6">
      <AnimatePresence mode="wait" custom={step === "email" ? -1 : 1}>
        {step === "email" ? (
          <motion.div
            key="email"
            variants={fadeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={fadeTransition}
            className="flex flex-col place-items-center gap-6 text-center"
          >
            <Image src="/logos/logo_red.svg" width={128} height={128} alt="UBC MA Logo" priority />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="mb-2 text-2xl font-semibold">Welcome to Gateways 2026</h2>
              <p className="text-base text-zinc-500">Enter your email to sign in</p>
            </motion.div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                emailForm.handleSubmit();
              }}
              className="flex w-full flex-col gap-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <emailForm.Field
                  name="email"
                  validators={{
                    onBlur: ({ value }) =>
                      !value
                        ? "Email is required."
                        : !EMAIL_PATTERN.test(value)
                          ? "Invalid email address."
                          : undefined,
                  }}
                >
                  {(field) => <InputField type="email" label="Email" field={field} />}
                </emailForm.Field>

                <emailForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <AuthButton
                      variant="ma"
                      type="submit"
                      disabled={isSubmitting || !canSubmit}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner />
                          <span>Loading</span>
                        </>
                      ) : (
                        <span>Continue</span>
                      )}
                    </AuthButton>
                  )}
                </emailForm.Subscribe>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex w-full flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <hr className="w-full border-zinc-900/20" />
                <span className="mx-2 text-xs text-zinc-500">OR</span>
                <hr className="w-full border-zinc-900/20" />
              </div>

              <GoogleSignInButton />

              <p className="text-sm text-zinc-700">
                New here?{" "}
                <a
                  href={`${portalURL}/sign-up`}
                  className="inline-flex items-center gap-1 font-semibold text-ma-red hover:underline"
                >
                  Sign Up <ArrowUpRight size={16} />
                </a>
              </p>
            </motion.div>
          </motion.div>
        ) : step === "password" ? (
          <motion.div
            key="password"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex flex-col gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="mb-2 text-xl font-semibold">Welcome back</h2>
              <p className="text-sm text-zinc-500">
                Enter your password for{" "}
                <motion.span
                  className="font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {email}
                </motion.span>
              </p>
            </motion.div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                passwordForm.handleSubmit();
              }}
              className="flex flex-col gap-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <passwordForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => (!value ? "Password is required." : undefined),
                  }}
                >
                  {(field) => <InputField type="password" label="Password" field={field} />}
                </passwordForm.Field>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-right"
              >
                <a
                  href={`${portalURL}/forgot-password`}
                  className="text-sm font-semibold text-ma-red hover:underline"
                >
                  Forgot password?
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-2"
              >
                <AuthButton
                  type="button"
                  variant="outline"
                  onClick={handleGoBack}
                  className="flex-1"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </AuthButton>

                <passwordForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <AuthButton
                      variant="ma"
                      type="submit"
                      disabled={isSubmitting || !canSubmit}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner />
                          <span>Signing In</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="size-4" />
                          <span>Sign In</span>
                        </>
                      )}
                    </AuthButton>
                  )}
                </passwordForm.Subscribe>
              </motion.div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="google"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex flex-col place-items-center gap-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="mb-2 text-xl font-semibold">Account Found</h2>
              <p className="text-sm text-zinc-500">
                We found an associated Google account with this email.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              <GoogleSignInButton />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm"
            >
              Or
              <button
                type="button"
                onClick={() => setStep("password")}
                className="mx-1 cursor-pointer font-semibold text-ma-red hover:underline"
              >
                click here
              </button>
              to continue with email
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
