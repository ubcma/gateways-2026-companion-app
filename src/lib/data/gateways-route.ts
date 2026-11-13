import "server-only";
import { cache } from "react";
import { getMe, getMyWorkshopTitles, valueOrNull } from "@/lib/data/attendee";
import { toAttendeeInput } from "@/lib/delegate-matching/score";
import {
  assignLine,
  type LineAssignment,
  type WorkshopPick,
} from "@/lib/gateways-line/assign-line";

export type GatewaysRouteData = LineAssignment & {
  /** Workshop titles for slot 1 and slot 2; undefined when not picked. */
  workshops: [WorkshopPick, WorkshopPick];
};

// Computed on every read rather than stored, so it follows the attendee's
// latest workshop picks and interests. If one source fails, the line is
// scored from the other.
export const getGatewaysRoute = cache(async (): Promise<GatewaysRouteData> => {
  const [workshopsResult, meResult] = await Promise.allSettled([
    getMyWorkshopTitles(),
    getMe(),
  ]);
  const workshops = valueOrNull(workshopsResult, "workshop picks") ?? [undefined, undefined];
  const me = valueOrNull(meResult, "onboarding interests");
  const assignment = assignLine({
    workshops,
    interests: toAttendeeInput(me).interests,
  });
  return { ...assignment, workshops };
});
