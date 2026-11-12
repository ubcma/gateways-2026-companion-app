import type { Profile } from "@/lib/types";

// Placeholder until onboarding is built and the profile is stored per user.
export const mockProfile: Profile = {
  name: "Alex",
  major: "Commerce",
  interests: ["Brand Strategy", "Digital Marketing", "Analytics"],
};

export async function getProfile(): Promise<Profile> {
  return mockProfile;
}
