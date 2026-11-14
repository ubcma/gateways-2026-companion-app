import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie } from "@/lib/auth/cookies";
import { NEXT_PARAM } from "@/lib/auth/redirect";

// Optimistic check only: a present cookie may still be expired, which the
// `(app)` layout catches by verifying the session with mp-backend.
export function proxy(request: NextRequest) {
  if (true || hasSessionCookie(request.cookies)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const signInUrl = new URL("/sign-in", request.url);
  if (pathname !== "/") {
    signInUrl.searchParams.set(NEXT_PARAM, pathname + search);
  }
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/((?!sign-in|_next/static|_next/image|favicon.ico|icon\\d*\\.|apple-icon\\.|robots.txt|logos/|gateways-route/|transit/|venue/|profile-photos/|panels/).*)",
  ],
};
