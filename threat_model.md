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
- **Deployment origin boundary** — any live deployment origin, including Replit-hosted aliases under `*.replit.app` or `*.repl.co`, is part of the production surface. Wildcard trust of sibling deployment origins must be treated as trusting attacker-controlled internet sites.
- **API server to PostgreSQL / SQLite state** — the API has broad authority over persisted user data, billing state, invites, and collaboration records. Query scoping and route-level authz are critical.
- **API server to third-party services** — the server sends user data to OpenAI, Stripe, Dropbox Sign, Resend, RevenueCat, Clerk, and object storage. Each integration requires origin/authenticity checks and least-privilege handling.
- **Public / authenticated / admin boundaries** — the marketing site and several API endpoints are intentionally public, while document history, builder, clause extractor, compare versions, signatures, and team routes are intended to be protected. Admin-only behavior is encoded separately from billing-plan access.
- **Invite-only product boundary** — allowlist enforcement currently restricts production app access to approved emails, but public endpoints still exist and must not trust caller-supplied identity claims.
- **Dev / production boundary** — mockup, pitch, generated artifacts, and skill scripts should normally be excluded from production vulnerability reporting.

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/plainpath/src/main.tsx`, `artifacts/plainpath-marketing/src/main.tsx`
- **Highest-risk server areas**: `artifacts/api-server/src/routes/{documents,contracts,compare-versions,clause-extractor,signatures,stripe,entitlements,teams}` and `artifacts/api-server/src/lib/{billingDb,pdfObjectStorage,compareVersionsEnrichment}`
- **Cross-origin policy anchors**: `artifacts/api-server/src/app.ts` CORS and trusted-origin logic for production deployment aliases
- **Public surfaces**: marketing pages, demo routes, waitlist, reminders, shares, health, some document-analysis routes, Stripe/Dropbox webhook endpoints
- **Authenticated surfaces**: builder, user docs/history, signatures, clause extractor, compare versions, team management, entitlement bootstrap
- **Dev-only areas to usually ignore**: `artifacts/mockup-sandbox`, `artifacts/pitch-deck`, `.agents/`, screenshots, docs, and generated/native wrapper artifacts unless production reachability is demonstrated

## Threat Categories

### Spoofing

PlainPath relies on Clerk for user identity, but some billing and entitlement flows accept caller-supplied email addresses or IDs. Production guarantees must ensure that protected billing, subscription-management, team, and document routes derive identity from the authenticated session or a cryptographically strong invite/token flow, never from arbitrary request parameters alone. Webhooks from Stripe and Dropbox Sign must continue to reject unsigned or invalid callbacks.

### Tampering

Users can upload files, submit document text, update compare-version review metadata, create team invites, and trigger external workflows. The server must validate uploaded content, restrict object and record updates to the owning user or authorized team member, and ensure public endpoints cannot alter another user’s billing, usage, or collaboration state.

### Information Disclosure

The application processes highly sensitive document contents and exposes sharing, e-signature, and collaboration features. API responses, object-storage fetches, share links, billing status endpoints, and team invitation flows must not leak document contents, billing state, internal roles, or other users’ data. Logs and error responses must avoid including document text, secrets, or provider credentials.

### Denial of Service

OpenAI-backed analysis, OCR, PDF parsing, image processing, email delivery, and third-party API calls are all potentially expensive. Public routes need rate limiting, file-size limits, and reasonable request shaping so attackers cannot burn API credits, flood outbound email, or exhaust storage/DB capacity. Timeouts on third-party calls and bounded request sizes are required.

### Elevation of Privilege

This codebase has multiple privilege layers: unauthenticated users, authenticated users, allowlisted users, admins, paid subscribers, and team members. The core guarantee is that every protected operation enforces server-side authorization against the correct principal and scope. In particular, team invites, billing portal access, compare-version sessions, saved documents, and e-signature records must not be accessible or modifiable through guessed identifiers, forwarded invite links, or user-controlled email parameters.
