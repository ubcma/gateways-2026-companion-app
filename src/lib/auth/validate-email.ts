export type ValidateEmailResponse = {
  hasAccount: boolean;
  provider?: "google" | "credential";
};

// Called from the browser rather than a server action so mp-backend rate-limits
// each attendee by their own IP instead of this app's server IP.
export async function validateEmail(email: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    },
  );

  if (response.status === 429) {
    throw new Error("Too many attempts. Please wait 10 minutes before trying again.");
  }
  if (!response.ok) {
    throw new Error("Failed to validate email");
  }

  const data = (await response.json()) as ValidateEmailResponse;
  if (!data.hasAccount) {
    throw new Error("No account found for this email");
  }
  return data;
}
