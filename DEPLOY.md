# Gateways Companion — Deployment Checklist

Auth is owned by **mp-backend** (Better Auth). This app only talks to it with cookies scoped to `.ubcma.ca`.

## 1. Before first Production deploy

- [ ] `src/proxy.ts` gates on `hasSessionCookie` (no `true ||` bypass)
- [ ] `npm run build` and `npm test` pass locally
- [ ] `src/data/delegates.json` is final for the event
- [ ] Production `delegate-matches.json` has been generated (see §6) and committed

## 2. Vercel — Project

- [ ] Import `ubcma/gateways-2026-companion-app`
- [ ] Framework: Next.js (defaults are fine)
- [ ] Attach a **`*.ubcma.ca` domain** (e.g. `gateways.ubcma.ca`)
  - Non-`ubcma.ca` hosts (including bare `*.vercel.app`) will not share the portal session cookie

## 3. Vercel — Environment variables (Production)

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `https://api.ubcma.ca` | Browser auth client |
| `BACKEND_URL` | `https://api.ubcma.ca` | Server-side fetches (optional if same as above) |
| `GATEWAYS_EVENT_ID` | `32` | Prod Gateways event (`65` is the test event) |
| `NEXT_PUBLIC_PORTAL_URL` | `https://app.ubcma.ca` | Sign-up / register / forgot-password links |

**Do not set on Production:**

- `PREVIEW_NO_AUTH` — bypasses registration checks
- `GATEWAYS_ADMIN_COOKIE` — local match-generation only; never ship an admin session

Preview deploys may use event `65` + test backend, or `PREVIEW_NO_AUTH=1` only if you intentionally want open previews.

## 4. mp-backend — Rate limits (Gateways day)

Limits are **per IP**. Conference WiFi often NATs everyone behind one address, so defaults were raised for ~170 attendees:

| Limiter | Default | Env overrides |
|---|---|---|
| Express (all `/api/*`) | 10 000 / 10 min | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` |
| Better Auth (`/api/auth/*`) | 1 000 / 60 s | `AUTH_RATE_LIMIT_WINDOW`, `AUTH_RATE_LIMIT_MAX` |

Ship the mp-backend change that includes these defaults (or set the env vars on the backend host).

## 5. mp-backend — Allow this app’s origin (required for Google / CORS)

Browser calls from the companion hit `api.ubcma.ca`. Origins must be in `getAllowedOrigins()` (`mp-backend/src/lib/auth.ts`), which feeds both Express CORS and Better Auth `trustedOrigins`.

`https://gateways.ubcma.ca` is hardcoded in mp-backend `getAllowedOrigins()` (with `localhost:3001` for local companion). Missing origin → **CORS error** on `/api/auth/*` and often a **500** on social sign-in.

If you need a one-off preview URL (e.g. `*.vercel.app`), set on **mp-backend**:

```bash
ADDITIONAL_ORIGINS=https://gateways-2026-companion-app-….vercel.app
```

Then restart / redeploy mp-backend so the env var is picked up.

Google Cloud Console does **not** need the companion URL. The OAuth redirect stays:

`https://api.ubcma.ca/api/auth/callback/google`

## 6. Delegate matches

Matches are baked into `src/data/delegate-matches.json` at build time. Runtime only falls back to on-the-fly scoring if someone is missing or stale.

### Generate (against Production)

In `.env.local` (never commit, never put on Vercel):

```bash
NEXT_PUBLIC_BACKEND_URL="https://api.ubcma.ca"
BACKEND_URL="https://api.ubcma.ca"
GATEWAYS_EVENT_ID="32"
GATEWAYS_ADMIN_COOKIE="__Secure-membership-portal.session_token=…"
```

Get the cookie from DevTools → Application → Cookies while signed in as an **admin** on `app.ubcma.ca` (or from a successful **GET** to `/api/me`, not an `OPTIONS` preflight).

```bash
npm run generate:delegate-matches
```

Commit the updated JSON and redeploy.

### After attendees have seen matches

```bash
npm run generate:delegate-matches -- --only-missing   # new registrants only
npm run generate:delegate-matches -- --user <userId>  # rematch one person
```

Avoid a full regenerate (no flags) after matches are visible — it can reshuffle existing assignments.

## 7. Smoke test after deploy

- [ ] Open the companion domain → redirected to `/sign-in` when logged out
- [ ] Email + password sign-in works
- [ ] Google sign-in works (no CORS / social 500)
- [ ] After portal sign-in on `app.ubcma.ca`, companion recognizes the same session (shared `.ubcma.ca` cookie)
- [ ] Registered Gateways attendee reaches home
- [ ] Unregistered signed-in user hits `/not-registered`
- [ ] `/delegates` shows three matches for a generated attendee

## 8. Launch order

1. Confirm proxy auth gate + Production env vars on Vercel  
2. Custom domain under `.ubcma.ca`  
3. Deploy mp-backend with companion origin + raised rate limits  
4. Generate + commit prod `delegate-matches.json` → deploy companion  
5. Smoke-test sign-in and delegates  
6. During registration, re-run `--only-missing` periodically and redeploy  
