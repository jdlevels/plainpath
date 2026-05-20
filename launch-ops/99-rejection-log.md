# PlainPath — Rejection and Incident Log

Log every App Store rejection and production incident here. This is the historical record for future submissions.

---

## App Store Rejections

| # | Date | Guideline | Apple's text (summary) | Root cause | Fix applied | Resubmission date | Resolved date |
|---|---|---|---|---|---|---|---|
| 1 | May 2026 | 2.1 Performance: App Completeness | "App failed to load any content upon launch." (iPad Air M3, iPadOS 26.4.2, IPv6) | Clerk JS loaded from custom domain with no DNS → bundle never downloaded → `isLoaded` stays false → blank screen | (1) `clerkProxyUrl` derived from `window.location.origin` at runtime; proxy forwards `/api/__clerk` → `frontend-api.clerk.dev`; (2) ClerkLoadingScreen replaces blank divs; (3) non-blocking Google Fonts | May 13, 2026 | Pending |

---

## Production Incidents

| # | Date | Severity | Description | Root cause | Fix applied | Time to resolution |
|---|---|---|---|---|---|---|
| — | — | — | No incidents yet | — | — | — |

---

## Notes

- Add a new row to the rejections table for every rejection received from Apple Review.
- Add a new row to the incidents table for every P0 or P1 issue encountered in production.
- Do not remove old entries — this log is append-only.

---

*Document: 99 | Phase: Ongoing | Last updated: May 2026*

---

## Production Incidents (Login Connectivity)

| # | Date | Severity | Description | Root cause | Fix applied | Time to resolution |
|---|---|---|---|---|---|---|
| 1 | May 13, 2026 | P0 | User on plainpathapp.com: clicked Login → "Unable to connect. Check internet connection." | `VITE_CLERK_PROXY_URL` baked as static `plain-path.replit.app/api/__clerk`. Clerk proxy mounted BEFORE CORS middleware in `app.ts`. Browser on `plainpathapp.com` made cross-origin Clerk API calls → no CORS headers on proxy path → preflight blocked → `isLoaded` stayed `false` → ClerkLoadingScreen timeout message shown | (1) `clerkProxyUrl` now derived from `window.location.origin` at runtime (same-origin for all web browsers, env var fallback for Capacitor native); (2) Clerk proxy CORS handler added to `app.ts` before proxy middleware for Capacitor native origins | < 1 hour |
