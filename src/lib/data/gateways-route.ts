import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { fetchWithSession } from "@/lib/auth/session";
import {
  assignLine,
  type LineAssignment,
  type WorkshopPick,
} from "@/lib/gateways-line/assign-line";

type MeResponse = {
  interests: string[] | string | null;
  onboardingComplete: boolean | null;
};

type EventWorkshopsResponse = {
  workshops: { id: number; slot: number; title: string }[];
  /** Keyed by slot number, e.g. { "1": 12, "2": 14 } */
  mySelection: Record<string, number> | null;
};

async function getOnboardingInterests() {
  const res = await fetchWithSession("/api/me");
  const me = (await res?.json()) as MeResponse | undefined;
  return me?.onboardingComplete ? me.interests : null;
}

async function getWorkshopTitles(): Promise<[WorkshopPick, WorkshopPick]> {
  const eventId = Number(process.env.GATEWAYS_EVENT_ID);
  if (!Number.isInteger(eventId)) {
    throw new Error("GATEWAYS_EVENT_ID must be set to the Gateways event's ID");
  }

  const res = await fetchWithSession(`/api/events/${eventId}/workshops`);
  const data = (await res?.json()) as EventWorkshopsResponse | undefined;
  const titleForSlot = (slot: number) => {
    const workshopId = data?.mySelection?.[String(slot)];
    return data?.workshops.find((workshop) => workshop.id === workshopId)?.title;
  };
  return [titleForSlot(1), titleForSlot(2)];
}

function valueOrNull<T>(result: PromiseSettledResult<T>, label: string) {
  if (result.status === "fulfilled") {
    return result.value;
  }
  unstable_rethrow(result.reason);
  console.error(`Couldn't load ${label} for the Gateways route:`, result.reason);
  return null;
}

export type GatewaysRouteData = LineAssignment & {
  /** Workshop titles for slot 1 and slot 2; undefined when not picked. */
  workshops: [WorkshopPick, WorkshopPick];
};

// Computed on every read rather than stored, so it follows the attendee's
// latest workshop picks and interests. If one source fails, the line is
// scored from the other.
export const getGatewaysRoute = cache(async (): Promise<GatewaysRouteData> => {
  const [workshopsResult, interestsResult] = await Promise.allSettled([
    getWorkshopTitles(),
    getOnboardingInterests(),
  ]);
  const workshops = valueOrNull(workshopsResult, "workshop picks") ?? [undefined, undefined];
  const assignment = assignLine({
    workshops,
    interests: valueOrNull(interestsResult, "onboarding interests"),
  });
  return { ...assignment, workshops };
});
