import { authClient } from "./auth-client";

// Signs the user out of every UBCMA app, since the session cookie is shared.
export async function signOut() {
  const response = await authClient.signOut();
  if (response.error) {
    throw new Error(response.error.message);
  }
}
