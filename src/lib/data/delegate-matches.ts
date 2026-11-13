import "server-only";
import { cache } from "react";
import { getMe, getMyWorkshopTitles, valueOrNull } from "@/lib/data/attendee";
import {
  getDelegateMatchesForUser,
  type DelegateMatchesResult,
} from "@/lib/delegate-matching/runtime";
import { toAttendeeInput } from "@/lib/delegate-matching/score";

/** The signed-in attendee's 3 delegates; scored on the fly if the generated file is stale. */
export const getMyDelegateMatches = cache(async (): Promise<DelegateMatchesResult> => {
  const [workshopsResult, meResult] = await Promise.allSettled([
    getMyWorkshopTitles(),
    getMe(),
  ]);
  const workshops = valueOrNull(workshopsResult, "workshop picks");
  const me = valueOrNull(meResult, "onboarding answers");
  const userId = me?.userId ?? "";

  const result = getDelegateMatchesForUser(
    userId,
    toAttendeeInput({ ...me, workshops }),
    { inputComplete: workshopsResult.status === "fulfilled" && me !== null },
  );
  if (result.source === "fallback") {
    console.info(`Delegate matches for ${userId || "unknown user"} scored on the fly: ${result.reason}`);
  }
  return result;
});
