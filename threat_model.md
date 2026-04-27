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
- **Conditional feature boundary** — Document Builder is production-reachable only when `BUILDER_ENABLED=true` on the server and `VITE_BUILDER_ENABLED=true` on the client. Native RevenueCat verification is out of production scope until the activation guard is removed and live keys are configured.
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
- Confirmed on 2026-04-27: the previously suspected cross-user billing identity-binding issue was not reproduced in the current code. `billingDb.ts`, `resolvePlan.ts`, `entitlements.ts`, and Stripe billing-portal flows should still be scanned together, but they currently appear to derive access from the authenticated session rather than allowing an already-bound subscriber record to be hijacked by arbitrary email fallback.
- Confirmed on 2026-04-27: server-side paid-feature enforcement remains an active risk area. `/api/documents/chat`, `/api/documents/redact-pdf`, and the `/api/builder/*` routes should be treated as explicit entitlement-audit anchors because client-side plan gating is not authoritative.
- Confirmed on 2026-04-27: `/api/documents/redact-pdf` still sanitizes attacker-supplied PDFs synchronously on the request path and inflates untrusted compressed streams without a decompressed-size ceiling or worker isolation. Future scans should continue checking both residual hidden-content removal and resource-exhaustion controls there.
- Confirmed on 2026-04-27: `/api/documents/import-url` appears hardened against straightforward SSRF bypasses in the current code through HTTPS host allowlisting, redirect revalidation, size caps, and timeouts. Future scans should keep watching this surface for regressions because it remains a high-cost server-side fetch path.
- Confirmed on 2026-04-27: team collaboration routes still require careful team-scoped authorization review. In particular, analytics access should be validated against both the target team and the caller's role, not merely any active Team subscription plus membership.
- Confirmed on 2026-04-27: the public demo quota remains attacker-controlled and non-atomic. Future abuse reviews should treat anonymous demo identity and quota accounting as untrusted until usage is tied to trusted proxy-derived client identity and enforced with atomic updates.
- Confirmed on 2026-04-27: public email-oriented routes deserve separate abuse review even when they are intentionally public. `POST /waitlist/join` and `GET /waitlist/verify` should be treated as outbound-email and consent-integrity surfaces, not just harmless signup endpoints.
