# Threat Model

## Project Overview

PlainPath is a legal-tech document platform with a public marketing site, a React web app (also wrapped with Capacitor for iOS/Android), and an Express API server. Users upload or paste legal and administrative documents for AI-assisted analysis, trust checks, redaction, clause extraction, version comparison, document building, and e-signature workflows. The production code paths are primarily `artifacts/api-server`, `artifacts/plainpath`, `artifacts/plainpath-marketing`, and shared libraries under `lib/`.

Production assumptions for this threat model:
- `NODE_ENV` is `production` in live deployments.
- TLS between clients and the deployed app is handled by the platform.
- `artifacts/mockup-sandbox`, `artifacts/pitch-deck`, `.agents/`, docs, screenshots, and local helper scripts are not production attack surfaces unless future scans prove they are reachable in production.

## Assets

- **User accounts and sessions** — Clerk identities, session cookies, role/access tier metadata, and any team membership state. Compromise would allow impersonation or unauthorized feature access.
- **Sensitive document content** — uploaded PDFs, DOCX files, pasted text, extracted OCR text, analysis outputs, compare-version sessions, clause extraction results, and saved user documents. These may contain contracts, IDs, addresses, financial details, and other sensitive legal data.
- **Billing and entitlement state** — Stripe customer and subscription mappings, billing portal access, plan entitlements, team-plan status, and usage/account metadata. Abuse can cause revenue loss, subscription tampering, or unauthorized access to paid features.
- **Third-party integration credentials and callbacks** — OpenAI, Stripe, Dropbox Sign, Resend, Clerk, RevenueCat, and object-storage sidecar credentials or webhook verification secrets. Leakage or misuse can cause data disclosure, fraudulent actions, or service abuse.
- **Audit and workflow records** — signature request history, share links, team invites, reminder emails, waitlist entries, pilot feedback, and activity records. These affect privacy, repudiation, and business integrity.

## Trust Boundaries

- **Browser / mobile client to API server** — all request bodies, uploaded files, cookies, headers, query parameters, and session state from the client are untrusted.
- **API server to PostgreSQL / SQLite state** — the API has broad authority over persisted user data, billing state, invites, collaboration records, and usage telemetry. Query scoping and route-level authz are critical.
- **API server to third-party services** — the server sends user data to OpenAI, Stripe, Dropbox Sign, Resend, RevenueCat, Clerk, and object storage. Each integration requires origin/authenticity checks and least-privilege handling.
- **Public / authenticated / admin boundaries** — the marketing site and several API endpoints are intentionally public, while document history, builder persistence, compare versions, clause extraction, team routes, billing state, and reminders are intended to be protected. Admin-only behavior is encoded separately from billing-plan access.
- **Invite-only product boundary** — `allowlistEnforcement()` is mounted globally in `artifacts/api-server/src/app.ts` and evaluates any request that already has a Clerk session. The current implementation fails closed when `ALLOWED_EMAILS` is empty, so authenticated routes are production-reachable only to explicitly allowlisted accounts. Public routes remain reachable without a Clerk session because unauthenticated requests bypass this middleware.
- **Paid-feature boundary** — client-side plan gates exist, but they are not authoritative. Any server route that should be limited to Starter, Pro, Team, or admin users must enforce authentication and entitlements on the server.
- **Conditional feature boundary** — Document Builder is production-reachable only when `BUILDER_ENABLED=true` on the server and `VITE_BUILDER_ENABLED=true` on the client. Native RevenueCat verification is mounted in production code and becomes reachable as soon as `REVENUECAT_API_KEY_IOS` or `REVENUECAT_API_KEY_ANDROID` is configured, so future billing scans should keep `/api/entitlements/native-verify` in scope whenever native billing appears enabled.
- **Dev / production boundary** — mockup, pitch, generated artifacts, and skill scripts should normally be excluded from production vulnerability reporting.

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/plainpath/src/main.tsx`, `artifacts/plainpath-marketing/src/main.tsx`
- **Highest-risk server areas**: `artifacts/api-server/src/routes/{documents,contracts,compare-versions,clause-extractor,signatures,stripe,entitlements,teams,reminders}` and `artifacts/api-server/src/lib/{billingDb,pdfObjectStorage,compareVersionsEnrichment}`
- **Public surfaces**: marketing pages, demo routes, waitlist, shares, health, webhook endpoints, and any API route that does not call `getAuth(req)` or another server-side authorization check
- **Authenticated surfaces**: builder persistence when enabled, user docs/history, signatures, clause extractor, compare versions, team management, entitlement bootstrap/status, reminders, and billing-portal flows
- **Cross-cutting risk areas**: server-side paywall enforcement, outbound email sending, entitlement identity binding, object-storage access, invite/team flows, and server-side fetch behavior
- **Dev-only areas to usually ignore**: `artifacts/mockup-sandbox`, `artifacts/pitch-deck`, `.agents/`, screenshots, docs, and generated/native wrapper artifacts unless production reachability is demonstrated

## Threat Categories

### Spoofing

PlainPath relies on Clerk for user identity, but some billing and entitlement flows accept caller-supplied email addresses or IDs. Production guarantees must ensure that protected billing, subscription-management, reminder, team, and document routes derive identity from the authenticated session or a cryptographically strong invite/token flow, never from arbitrary request parameters alone. Webhooks from Stripe and Dropbox Sign must continue to reject unsigned or invalid callbacks.

### Tampering

Users can upload files, submit document text, update compare-version review metadata, create team invites, trigger external workflows, and mutate usage/account telemetry. The server must validate uploaded content, restrict object and record updates to the owning user or authorized team member, and ensure public endpoints cannot alter another user’s billing, usage, or collaboration state.

### Information Disclosure

The application processes highly sensitive document contents and exposes sharing, e-signature, collaboration, and billing features. API responses, object-storage fetches, share links, billing status endpoints, entitlement responses, team invitation flows, and any server-side URL import feature must not leak document contents, billing state, internal roles, or other users’ data. Document redaction flows must actually remove or irreversibly destroy sensitive content in exported files; visual overlays alone are not an adequate protection boundary. Logs and error responses must avoid including document text, secrets, or provider credentials.

### Denial of Service

OpenAI-backed analysis, OCR, PDF parsing, image processing, email delivery, and third-party API calls are all potentially expensive. Public routes need rate limiting, file-size limits, and reasonable request shaping so attackers cannot burn API credits, flood outbound email, or exhaust storage/DB capacity. Timeouts on third-party calls, bounded request sizes, and streaming or disk-backed handling for large files are required.

### Elevation of Privilege

This codebase has multiple privilege layers: unauthenticated users, authenticated users, intended allowlisted users, admins, paid subscribers, and team members. The core guarantee is that every protected operation enforces server-side authorization against the correct principal and scope. In particular, paid AI routes, team invites, billing portal access, compare-version sessions, saved documents, reminder delivery, and e-signature records must not be accessible or modifiable through public endpoints, guessed identifiers, forwarded invite links, user-controlled email parameters, or client-only plan checks. Document-tool upsells such as negotiation assistance must be enforced on the server, not only hidden in the UI.

## Current Scan Notes

- Confirmed on 2026-04-27: `allowlistEnforcement()` fails closed when `ALLOWED_EMAILS` is empty. Clerk-authenticated routes should be treated as allowlist-gated in production, while unauthenticated routes remain public unless the handler enforces auth itself.
- Reviewed on 2026-05-04: Stripe checkout, billing-portal, subscriber-status, and webhook handling appear materially hardened in the current code. Signature verification, processed-event deduplication, cancellation tombstones, and Clerk ownership checks were present during this scan. Stripe remains a high-value audit anchor, but the earlier email-rebinding and out-of-order lifecycle concerns were not re-confirmed in the reviewed revision.
- Confirmed on 2026-04-27: server-side paid-feature enforcement currently fails closed to `free`, not `starter`, when no verified active entitlement is found. Future scans should keep auditing whether specific routes rely on client gates, but `resolvePlan.ts` now defaults non-subscribers to `free` and remains a key anchor for entitlement reviews.
- Confirmed on 2026-04-27: `/api/documents/redact-pdf` is materially more hardened than earlier revisions. It now applies a page-count ceiling, extracted-text ceiling, bounded stream inflation, and redaction-term budgets before the heaviest work. Future scans should still watch this route for regressions, but parser-bomb scrutiny should stay focused on any adjacent document-processing routes that stop sharing the bounded `parsePdfWithLimits()` / `parseDocxWithLimits()` helpers.
- Confirmed on 2026-04-27: `/api/documents/import-url` appears hardened against straightforward SSRF bypasses in the current code through HTTPS host allowlisting, redirect revalidation, size caps, and timeouts. Future scans should keep watching this surface for regressions because it remains a high-cost server-side fetch path.
- Reviewed on 2026-05-04: team collaboration routes still merit team-scoped authorization review, but the current analytics/admin mutations appeared to enforce membership and admin checks correctly. Future scans should keep invite redemption and post-cancellation access in the same review pass as team-plan enforcement.
- Confirmed on 2026-04-27: the public demo quota is now atomic, but it is still keyed to a coarse trusted-network prefix rather than a per-visitor identity. Future abuse reviews should treat anonymous demo quota granularity as a production availability risk even if the old race condition is gone.
- Confirmed on 2026-04-27: request logging is part of the secret-handling boundary. Any route that uses path tokens or bearer-style link secrets (shares, invites, verification links) must be reviewed together with the global `pino-http` serializer so those tokens are not written into logs.
- Confirmed on 2026-04-27: browser storage is a confidentiality boundary, not just a UX cache. `localStorage`-backed analyses, trust checks, drafts, offline fallbacks, recent-work history, and subscriber-email caches should be reviewed for cross-account leakage whenever multiple authenticated users can reuse the same browser profile.
- Confirmed on 2026-04-27: public email-oriented routes deserve separate abuse review even when they are intentionally public. `POST /waitlist/join` and `GET /waitlist/verify` should be treated as outbound-email and consent-integrity surfaces, not just harmless signup endpoints.
- Confirmed on 2026-04-27: public share creation is a production abuse surface, not just a convenience feature. Future scans should treat `POST /api/shares` plus `/shared/:token` as a trusted-domain publication and storage-consumption boundary, especially because expiry checks alone do not remove old rows.
- Reviewed on 2026-05-08: `/api/documents/trust-check-upload` now funnels uploaded PDF/DOCX files through `parsePdfWithLimits()` / `parseDocxWithLimits()` inside `extractTextFromBuffer()`. Keep this route in future document-ingest reviews, but the earlier unbounded parser path was not re-confirmed in the current revision.
- Reviewed on 2026-05-04: team authorization now resolves the verified primary Clerk email rather than trusting `emailAddresses[0]` for plan checks. Future scans should focus on invite redemption, billing-state rechecks, and other email-to-identity binding edges instead of the older primary-email-selection bug.
- Confirmed on 2026-05-04: the public help assistant remains an unauthenticated OpenAI-backed route with only IP-based rate limiting. Future scans should continue treating `/api/help/chat` as a cost and availability abuse boundary even though it does not currently expose cross-user data.
- Reviewed on 2026-05-08: `/api/entitlements/native-verify` now requires a Clerk session, resolves the verified primary email from Clerk instead of trusting the request body, and enforces `rcUserId === auth.userId` before syncing subscriber state. Keep this route in scope whenever RevenueCat is enabled, but the earlier public caller-controlled identity-binding issue was not re-confirmed in the current revision.
- Reviewed on 2026-05-08: `/api/pilot-feedback*` is mounted behind `internalOnlyPaths` in `artifacts/api-server/src/routes/index.ts` and returns 404 unless `INTERNAL_API_TOKEN` is configured and supplied via `X-Internal-Token`. Treat these routes as internal integration surfaces rather than public API exposure unless a future revision changes the mount-time gate.
- Confirmed on 2026-05-08: `artifacts/api-server/src/routes/teams/index.ts` still contains a weaker billing authorization path than `resolvePlan.ts`. `requireTeamPlan()` authorizes Team access with `getSubscriberByEmail(email)` and does not verify that an active subscriber row is either unbound or bound to the current `clerkUserId`, so future billing scans should keep team collaboration routes in scope for email-to-identity binding regressions.
- Confirmed on 2026-05-08: `artifacts/api-server/src/routes/pdf-utilities/index.ts` remains an availability-sensitive surface. The routes buffer large PDFs in memory and spawn a fresh worker thread per request via `runPdfUtilInWorker()` without a process-wide concurrency cap, so future document scans should review this area together with rate limiting and worker fanout controls.
- Confirmed on 2026-05-08: browser `sessionStorage` remains part of the confidentiality boundary for document text. Cross-page handoff keys such as `pii_redact_input`, `pii_analyze_text`, and `pii_contract_review_text` can survive sign-out unless explicitly cleared, so future frontend scans should treat sign-out/storage cleanup as part of sensitive-data handling.
