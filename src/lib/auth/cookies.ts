// Issued by mp-backend's Better Auth (`cookiePrefix: "membership-portal"`). In
// production they're scoped to `.ubcma.ca`, so a portal sign-in is visible here.
// The `__Secure-` prefix is only added when the backend is served over HTTPS.
const COOKIE_PREFIXES = ["__Secure-membership-portal.", "membership-portal."];

const SESSION_TOKEN_COOKIES = COOKIE_PREFIXES.map(
  (prefix) => `${prefix}session_token`,
);

type CookieReader = {
  has(name: string): boolean;
  getAll(): { name: string; value: string }[];
};

export function hasSessionCookie(cookies: CookieReader) {
  return SESSION_TOKEN_COOKIES.some((name) => cookies.has(name));
}

export function authCookieHeader(cookies: CookieReader) {
  return cookies
    .getAll()
    .filter(({ name }) => COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix)))
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}
