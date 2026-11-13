import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { fetchWithSession } from "@/lib/auth/session";
import type { WorkshopPick } from "@/lib/gateways-line/assign-line";

export type Me = {
  userId: string;
  interests: string[] | string | null;
  major: string | null;
  onboardingComplete: boolean | null;
};

type EventWorkshopsResponse = {
  workshops: { id: number; slot: number; title: string }[];
  /** Keyed by slot number, e.g. { "1": 12, "2": 14 } */
  mySelection: Record<string, number> | null;
};

export const getMe = cache(async (): Promise<Me | null> => {
  const res = await fetchWithSession("/api/me");
  return ((await res?.json()) as Me | undefined) ?? null;
});

export const getMyWorkshopTitles = cache(async (): Promise<[WorkshopPick, WorkshopPick]> => {
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
});

export function valueOrNull<T>(result: PromiseSettledResult<T>, label: string) {
  if (result.status === "fulfilled") {
    return result.value;
  }
  unstable_rethrow(result.reason);
  console.error(`Couldn't load ${label}:`, result.reason);
  return null;
}
