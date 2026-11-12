import { toast } from "sonner";
import { authClient } from "./auth-client";
import { NEXT_PARAM, safeNextPath } from "./redirect";

function callbackURL() {
  const params = new URLSearchParams(window.location.search);
  return window.location.origin + safeNextPath(params.get(NEXT_PARAM));
}

const isRestartProcessError = (message?: string) =>
  (message ?? "").toLowerCase().includes("please_restart_the_process");

const beginGoogleOAuth = () => {
  const url = callbackURL();

  return authClient.signIn.social({
    provider: "google",
    callbackURL: url,
    errorCallbackURL: `${window.location.origin}/sign-in`,
    newUserCallbackURL: url,
  });
};

export async function signInWithGoogle() {
  let response = await beginGoogleOAuth();

  // Usually a stale/expired OAuth state; one fresh retry often resolves it.
  if (response.error && isRestartProcessError(response.error.message)) {
    response = await beginGoogleOAuth();
  }

  if (response.error) {
    if (isRestartProcessError(response.error.message)) {
      toast.error("Sign-in session expired. Please try Google sign-in again.");
    } else {
      toast.error("Error signing in with Google, please contact our team for support");
    }
    throw new Error(response.error.message);
  }

  const redirectUrl = response.data?.url;
  if (!redirectUrl) {
    throw new Error("Google OAuth redirect URL not found in response.");
  }
  window.location.href = redirectUrl;
}

export async function signInWithEmail(email: string, password: string) {
  const response = await authClient.signIn.email(
    {
      email,
      password,
      callbackURL: callbackURL(),
      rememberMe: true,
    },
    {
      onSuccess() {
        toast.success("Sign in successful!");
      },
    },
  );

  if (response.error) {
    if (response.error.message === "Email not verified") {
      toast.error("Please verify your email before signing in.");
    } else {
      throw new Error(response.error.message);
    }
  }
  return response;
}
