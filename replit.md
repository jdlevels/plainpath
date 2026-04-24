# PlainPath

## Overview
PlainPath is a commercial multi-platform product (Web, iPhone, Android) that uses AI to simplify legal and administrative paperwork. It transforms complex documents into clear, actionable plans through features like AI-powered document analysis, trustworthiness checks, contract building, and fair deal reviews. The project aims to reduce complexity and improve accessibility in legal and administrative processes.

## User Preferences
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `lib/api-spec`.
Do not make changes to the file `artifacts/plainpath/src/lib/legalGlossary.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/trustCheckDemoData.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/demoData.ts`.
Do not make changes to the file `artifacts/plainpath/APP_STORE_METADATA.md`.

## System Architecture
PlainPath is a monorepo built with pnpm workspaces, separating frontend and backend while sharing core libraries. The architecture is transitioning to a document-first model, where uploaded documents are persistent and reusable across tools, utilizing a `documents` table and `document_tool_runs` for linking.

### Frontend
-   **Technology**: React with Vite.
-   **UI/UX**: Premium SaaS aesthetic, warm tones, high whitespace, Framer Motion for animations, Radix UI primitives, and Tailwind CSS. Supports Light, Dark, and System themes.
-   **Platform Readiness**: Uses Capacitor for cross-platform iOS/Android compatibility, integrating native features.
-   **Routing**: Marketing site at `/` and the main application at `/app/`.

### Backend
-   **Technology**: Express 5 API server.
-   **Monorepo Structure**: `artifacts/plainpath` for frontend and `artifacts/api-server` for backend API.
-   **Shared Libraries**: `lib/api-spec` (OpenAPI), `lib/api-client-react` (React Query hooks), `lib/api-zod` (Zod schemas), `lib/db` (Drizzle ORM with PostgreSQL), and `lib/integrations-openai-ai-server` (OpenAI integration).

### Core Features
-   **AI Document Analysis**: Extracts insights, deadlines, risks, and summaries.
-   **Document Trust Check**: Evaluates authenticity and risk.
-   **Contract Builder**: Guided contract creation with AI insights.
-   **Fair Deal Check**: Reviews contracts for unfair terms and provides negotiation guidance.
-   **AI Help Assistant**: Context-aware chat for user support.
-   **PII Redaction**: Detects and redacts PII.
-   **Document Comparison**: Highlights changes between document versions.
-   **Digital Signature**: E-signature workflow via Dropbox Sign.
-   **Document Builder**: Structured document editor with multiple block types, templates, and optimistic autosave.
-   **Document Overview Hub**: The primary post-upload surface — document-first UX replacing the tool-first flow. Upload any document → AI generates a structured overview in one shot: plain-English summary, risks (with page citations), key dates, key parties, key obligations, recommended next actions, and suggested follow-up questions. Left panel: live pdfjs-dist PDF viewer with page navigation, zoom, fullscreen; clicking a citation chip jumps the viewer to that page with a violet highlight ring. Right panel: intelligence hierarchy rendered in structured cards. "Recommended Next Actions" are document-specific and link directly to the correct downstream tool. "Ask This Document" integration: overview upload also creates a linked `ask_document_sessions` record; clicking "Ask This Document" from the overview opens Ask Document with the document already loaded — no re-upload. States: empty (upload zone + recent docs), processing (stage animation), completed overview, partial/low-confidence (with amber warning), error. Mobile: tab-based layout (Overview / Document) with source-jump return UX. DB table: `document_overview_sessions` (id UUID, user_id, file_name, file_size_bytes, file_type, page_count, status [analyzing/ready/partial/error], overview JSONB, ask_session_id UUID, error_message, created_at, updated_at). Routes: `POST /api/document-overview/sessions`, `GET /api/document-overview/sessions`, `GET /api/document-overview/sessions/:id`. Frontend routes: `/document-overview`, `/document-overview/:id`. Key files: `artifacts/plainpath/src/pages/DocumentOverview.tsx`, `artifacts/plainpath/src/lib/documentOverviewApi.ts`, `artifacts/plainpath/src/lib/documentOverviewTypes.ts`, `artifacts/api-server/src/routes/document-overview/index.ts`. Prominent card on Home page with NEW badge.
-   **Clause Extractor**: Upload a PDF or DOCX contract → OpenAI (gpt-4o) extracts structured data: key dates (effective, expiration, notice deadlines), parties (name/role/type/signer), financial terms (payment amount, schedule, late fees, refund language), 8 legal clauses (each with present/summary/snippet), obligations (party, obligation, deadline, consequence), and missing fields. Three-state UI: upload (drag/drop), processing (poll `/api/clause-extractor/sessions/:id`), results (structured cards with expandable clause details). DB: `clause_extractor_sessions` (id, user_id, file_name, file_size_bytes, file_type, status, results jsonb, error_message). Routes: `POST /api/clause-extractor/sessions` (upload + extract), `GET /api/clause-extractor/sessions` (list), `GET /api/clause-extractor/sessions/:id` (detail), `DELETE /api/clause-extractor/sessions/:id`. Marketing demo at `/demo/clause-extractor` with static sample lease data.
-   **Public Demo (/demo)**: No-auth free-trial experience at `/demo` (landing) and `/demo/analyze` (upload page), served by the **marketing site** (`artifacts/plainpath-marketing`). Server-issues an opaque `demo_guest_id` cookie (HttpOnly, SameSite=Lax). Guest identity: random 32-byte token; DB stores SHA-256 hash (`guest_hash`) never the raw token. Quota: 2 completed uses per guest. Fingerprint backstop: SHA-256(ip_prefix:user_agent) — if a recently exhausted fingerprint is detected within 7 days, new guests from that device are also blocked. DB tables: `demo_guests` + `demo_runs`. Only Analyze a Document tool enabled in demo; others shown as "Full app" locked. Limits: PDF only, 10 MB, 10 pages. Demo analysis uses OpenAI (gpt-5.2) for summary, key risks, next steps, missing items. Failed runs (server error) do NOT count toward quota. Successful runs do. Marketing "Try it free" CTAs all point to `/demo`. Any visit to `/app/demo` or `/app/demo/analyze` redirects client-side to `/demo`. Routes: `GET /api/demo/status`, `POST /api/demo/analyze`. Key files: `routes/demo/index.ts`, `artifacts/plainpath-marketing/src/pages/DemoLanding.tsx`, `artifacts/plainpath-marketing/src/pages/DemoAnalyze.tsx`.
-   **Compare Versions**: PDF-first workspace for comparing original and revised documents. Slices 1–5 shipped. Engine: Stage A spatial/visual diff, Stage B Myers text diff, Stage C structural signals. Slice 4: union-rect group zones, hover/selection sync, severity override, notes CRUD. Slice 5 (AI enrichment): after deterministic scan completes, async OpenAI pass enriches text diff items with `ai_category` (9-value enum) + `ai_explanation` (one-sentence plain English). AI may upgrade severity but never downgrade below deterministic baseline. Manager override always wins. DB: `compare_versions_sessions.ai_status` (idle/running/complete/error) + `ai_enriched_at`. Auto-enrich fires after each fresh scan; manual retry via "AI Review" button in toolbar. Polling for `ai_status === 'running'` mirrors scan polling. Summary rows show AI category pill + explanation. Non-blocking: workspace fully usable if AI fails. Routes: `POST /sessions/:id/enrich`. Key files: `compareVersionsEnrichment.ts`, `compareVersionsGrouping.ts`, `compareVersionsTypes.ts`, `CompareVersionsSession.tsx`.

### Product Design Rules

#### PlainPath Scan Workspace Standard (standing rule — applies to all scan/analysis tools)
Every PlainPath tool that scans, reviews, analyzes, checks, extracts, compares, or explains an uploaded document must follow this standard:

**1. Document-first layout**
The document is always the source of truth. The user should always be able to see the uploaded document or document preview. AI/intelligence output explains the document — it never replaces it.

**2. Desktop layout**
Two-panel workspace:
- Left panel: document viewer — 55–60% width
- Right panel: intelligence/action panel — 40–45% width
Both panels support independent scrolling.

**3. Mobile layout**
Tabbed layout with two tabs: Analysis (default) and Document. Analysis tab opens first. Document is one tap away.

**4. Source-backed findings**
Every major finding includes clickable source chips when source information is available (e.g. `p.2 §4.1`, `p.5 Termination`). Clicking a source chip scrolls the document viewer to the referenced page or section, highlights and pulses it, and keeps the related intelligence card active. If exact PDF coordinates are unavailable, scroll to the nearest page/section and highlight the nearest block.

**5. Intelligence panel**
Concise, structured, action-oriented. Do not expand everything by default. Hierarchy:
- Plain-English summary
- Confidence / risk status
- Top findings
- Required next steps
- Deadlines / dates
- Key parties / terms
- Source traceability
Long details are collapsible or secondary.

**6. Visual style**
Premium dark UI: calm dark background (`#0c0c0f`), strong controlled contrast, clean cards, clear spacing, readable text hierarchy, source chips as a consistent system.
- purple = PlainPath intelligence / source traceability
- green = verified / confidence / safe
- amber = caution / needs review
- red = critical risk only
- blue = neutral action / help state

Avoid: walls of text, dense report dumps, excessive warning cards, too many borders, tiny centered layouts on wide screens, generic AI chat/report styling.

**7. Tool-specific right-panel content**
Same scan-workspace layout, right panel adapts per tool:
- **Analyze a Document**: summary, risks, missing items, next steps, deadlines, key parties, source traceability
- **Document Trust Check**: trust score, authenticity concerns, metadata issues, visual/structure warnings, fraud indicators, confidence level, source-backed evidence
- **Contract Review**: risky clauses, obligations, payment terms, termination/cancellation, missing protections, next steps, source-backed clause references
- **Clause Extractor**: extracted clauses, clause category, obligation owner, deadline/date, risk level, source chip, compact table/card hybrid
- **Compare Versions**: modified layout — original viewer + revised viewer + change/risk intelligence panel or drawer + source-backed change references
- **Redact Sensitive Info**: modified layout — document viewer + detected sensitive items + redaction controls + preview before export + source/highlight for detected items
- **Ask This Document**: document-first — document viewer + question/answer intelligence panel; every answer includes source chips when possible
- **Build a Contract / Document Builder**: creation layout (not a scan tool) — left: live document preview/output; right: builder controls, questions, clauses, and export options. Same premium PlainPath visual language and split-screen philosophy, but adapted for document creation — not the same intelligence-panel structure as scan tools. Feels related to scan tools but serves building, not reviewing.

**8. Product focus rule**
PlainPath stays focused on: document scanning, document meaning, extraction, risk review, trust review, source-backed explanations, action steps. Do not add SOP/manual builder language. Do not add generic document-writing language. Do not add Document Classifier or Packet Splitter until current core tool redesigns are complete.

**9. Implementation discipline**
When implementing each redesigned tool:
- Follow the approved canvas mockup closely
- Do not reinterpret it into a long report page
- Do not expand every section by default
- Preserve compact cards and clear hierarchy
- Keep the document visible and dominant
- Keep source chips functional

---

-   **Split-Screen Creation Principle**: Tools involving document creation/editing must default to a split-screen layout for real-time visual feedback (Left pane: live document/reference, Right pane: controls).
-   **Document Surface Proportions and Legibility**: Document-heavy tools must display document surfaces at realistic US Letter proportions on desktop for readability.
-   **Tool Surface Parity (Standardization Pass applied)**: All 8 first-class tools must be consistently represented across: (a) authenticated dashboard tool grid, (b) marketing navbar Tools dropdown, (c) marketing ToolsShowcase feature cards. The 8 tools are: Analyze a Document (`FileScan`), Document Trust Check (`ShieldCheck`), Contract Review (`Scale`), Build a Contract (`PenLine`), Redact Sensitive Info (`EyeOff`), Digital Signature (`FileSignature`), Clause Extractor (`ListChecks`), Compare Versions (`GitCompare`). Document Builder (`LayoutTemplate`) is a separate utility tool — shown in dashboard but not in the marketing tools surfaces.
-   **Standard Intake Rule**: All document-intake tools must show: (1) pre-run confirmation state on upload, (2) file card with filename + size, (3) explicit X/remove button, (4) no auto-processing, (5) tool-specific explicit CTA button.
-   **Save Standard for Editing Tools**: Document Builder must have a visible Save button, autosave every 60s, amber highlight when unsaved changes are pending, saving state indicator, and retryable failure state. Document Builder has autosave indicator + explicit Save button (added in standardization pass).
-   **Analyze a Document (new layout — `/analyze` + `/analyze-document`)**: `/analyze` → `AnalyzePage.tsx` handles the full upload + processing + error flow with dark canvas-matching UI (empty state: centered upload zone + Works Well With grid + recent analyses; processing state: split-screen muted doc viewer on left + animated 4-stage checklist + progress bar on right; error state: centered error card + retry/alternatives). On success, context is set and user is redirected to `/analyze-document` → `AnalyzeDocument.tsx` (results). `AnalyzeDocument.tsx` implements the premium split-screen results page: desktop — document viewer (58% width, `w-[58%]`) on left showing extracted `analysis.sections` as scrollable section cards; intelligence panel (42%, `flex-1`) on right with strict hierarchy: Plain-English Summary → Risk & Confidence Status → Required Next Steps → Risks & Watchouts → Key Dates → Key Terms → Source Traceability → Follow-up Tools. Source chips are clickable — `findBestSection()` word-overlap algorithm matches `sourceEvidence` text to the best `DocumentSection`, scrolls it into view, applies violet highlight ring, shows a dismissable citation banner. Low-confidence state (when `overallConfidence === "low"`): full amber warning panel + 4 actions (upload clearer PDF, upload text-based version, continue partial, Ask This Document). Mobile: tab layout defaulting to Analysis tab; chip clicks switch to Document tab and show "Back to Analysis" banner. Save to cloud/local via `saveCloudAnalysis`/`saveAnalysis` utilities. Old `/results` route (Analyze.tsx) preserved for backward compat (demo documents). Key files: `artifacts/plainpath/src/pages/AnalyzePage.tsx`, `artifacts/plainpath/src/pages/AnalyzeDocument.tsx`, `App.tsx`.

### Payment and Billing
-   Full billing architecture implemented with Stripe for Starter and Pro tiers.
-   Scaffold for native iOS/Android billing using RevenueCat.
-   **Webhook secret — managed flow (no env var required)**: `STRIPE_WEBHOOK_SECRET` is NOT a required or used environment variable. On server startup, `initStripe()` in `index.ts` uses `stripe-replit-sync`'s `findOrCreateManagedWebhook()` to register the `/api/stripe/webhook` endpoint with Stripe. The signing secret is stored in the `stripe._managed_webhooks` table and loaded into memory via `setWebhookSecret()`. If the DB row is missing at startup, webhooks are safely rejected (400 "Webhook not configured") until the next restart. Source of truth: `artifacts/api-server/src/lib/stripeWebhookSecret.ts` and `artifacts/api-server/src/lib/billingConfig.ts`.
-   **Billing status: SAFE for real paid subscribers.** The managed webhook flow is active in production.

## Deployment Notes

- **Custom domain reattachment / auth changes → republish required**: After reattaching a custom domain in Replit Publishing, or after major Clerk/auth configuration changes (e.g. switching from dev to production keys, resolving a Clerk tenant domain conflict), always trigger a fresh republish from the Replit Publishing panel. This forces Replit to finalize its internal routing table against the current production build and bind the custom domain correctly. Without this step, the domain may resolve to Replit infrastructure but return a "This app isn't live yet" 404 even though DNS and SSL are correctly configured.

- **Stripe webhook — managed by stripe-replit-sync (no env var needed)**: The webhook signing secret is never set via `STRIPE_WEBHOOK_SECRET`. It is registered and persisted automatically by `stripe-replit-sync` in `stripe._managed_webhooks`. After any deployment or server restart, check API server logs for `"Stripe managed webhook configured"` or `"Stripe initialized and backfill complete"` to confirm the webhook loaded correctly.

- **Verifying the live webhook after the first real subscriber**: After the first paid checkout completes in production, confirm the full event chain landed correctly:
  1. **Check the managed webhook row**: `SELECT url, created_at FROM stripe._managed_webhooks;` — should show one row for `https://<replit-domain>/api/stripe/webhook`.
  2. **Check the subscriber was written**: `SELECT email, plan, status, billing_provider, created_at FROM stripe.subscribers ORDER BY created_at DESC LIMIT 5;` (or the equivalent `subscribers` table in your public schema if using billingDb).
  3. **Check Stripe Dashboard → Developers → Webhooks**: Open the managed webhook endpoint, look at the event log — `checkout.session.completed` and `customer.subscription.created` should both appear with status 200.
  4. **Check API server logs**: Look for `"Stripe managed webhook configured"` on startup, and no 400 webhook-rejected errors around the time of the checkout.
  5. If the subscriber row is missing despite a successful checkout: restart the API server (which re-runs `initStripe()` and reloads the secret from DB), then re-trigger the webhook from the Stripe Dashboard event log using "Resend".

## External Dependencies
-   **OpenAI**: AI functionalities.
-   **PostgreSQL**: Primary database (Drizzle ORM).
-   **Clerk**: User authentication.
-   **Capacitor**: Native mobile development.
-   **Radix UI**: Unstyled UI components.
-   **Tailwind CSS**: Styling.
-   **Framer Motion**: Animations.
-   **Dropbox Sign**: Digital signatures.
-   **Stripe**: Payment gateway.
-   **RevenueCat**: Native in-app purchases.
-   **Resend**: Email delivery.
-   **Dropbox Chooser**: File import.
-   **Cornell LII (law.cornell.edu) and CFPB**: Legal glossary definitions.