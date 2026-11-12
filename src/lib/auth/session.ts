import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { authCookieHeader, hasSessionCookie } from "./cookies";
import { NEXT_PARAM, safeNextPath } from "./redirect";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type GetSessionResponse = {
  user: SessionUser;
  session: { expiresAt: string };
} | null;

type RegistrationsResponse = {
  registrations: { eventId: number; status: "incomplete" | "registered" | "checkedIn" }[];
};

const backendURL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

// `incomplete` is only set manually by admins to revoke a registration.
const ACTIVE_REGISTRATION_STATUSES = new Set(["registered", "checkedIn"]);

async function fetchWithSession(path: string) {
  const cookieStore = await cookies();
  if (!hasSessionCookie(cookieStore)) {
    return null;
  }

  const res = await fetch(`${backendURL}${path}`, {
    headers: { cookie: authCookieHeader(cookieStore), Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`${path} failed with status ${res.status}`);
  }
  return res;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const res = await fetchWithSession("/api/auth/get-session");
  const data = (await res?.json()) as GetSessionResponse | undefined;
  if (!data?.user) {
    return null;
  }
  const { id, name, email, image } = data.user;
  return { id, name, email, image };
});

export type GatewaysAccess = "signed-out" | "unregistered" | "registered";

// `/api/me/registrations` also verifies the session (401 when signed out), so
// this costs a single backend request.
export const getGatewaysAccess = cache(async (): Promise<GatewaysAccess> => {
  const eventId = Number(process.env.GATEWAYS_EVENT_ID);
  if (!Number.isInteger(eventId)) {
    throw new Error("GATEWAYS_EVENT_ID must be set to the Gateways event's ID");
  }

  const res = await fetchWithSession("/api/me/registrations");
  if (!res) {
    return "signed-out";
  }

  const { registrations } = (await res.json()) as RegistrationsResponse;
  const isRegistered = registrations.some(
    (registration) =>
      Number(registration.eventId) === eventId &&
      ACTIVE_REGISTRATION_STATUSES.has(registration.status),
  );
  return isRegistered ? "registered" : "unregistered";
});

function signInPath(returnTo: string) {
  const next = safeNextPath(returnTo);
  return next === "/" ? "/sign-in" : `/sign-in?${NEXT_PARAM}=${encodeURIComponent(next)}`;
}

export async function requireUser(returnTo = "/") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(signInPath(returnTo));
  }
  return user;
}

export async function requireAttendee(returnTo = "/") {
  const access = await getGatewaysAccess();
  if (access === "signed-out") {
    redirect(signInPath(returnTo));
  }
  if (access === "unregistered") {
    redirect("/not-registered");
  }
}
