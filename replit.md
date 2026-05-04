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
-   **Clause Extractor**: Upload a PDF or DOCX contract → OpenAI (gpt-4o) extracts structured data: key dates (effective, expiration, notice deadlines), parties (name/role/type/signer), financial terms (payment amount, schedule, late fees, refund language), 8 legal clauses (each with present/summary/snippet), obligations (party, obligation, deadline, consequence), and missing fields. Three-state UI: upload (drag/drop), processing (poll `/api/clause-extractor/sessions/:id`), results (structured cards with expandable clause details). DB: `clause_extractor_sessions` (id, user_id, file_name, file_size_bytes, file_type, status, results jsonb, error_message). Routes: `POST /api/clause-extractor/sessions` (upload + extract), `GET /api/clause-extractor/sessions` (list), `GET /api/clause-extractor/sessions/:id` (detail), `DELETE /api/clause-extractor/sessions/:id`. Marketing demo at `/demo/clause-extractor` with static sample lease data.
-   **Public Demo (/demo)**: No-auth free-trial experience at `/demo` (landing) and `/demo/analyze` (upload page), served by the **marketing site** (`artifacts/plainpath-marketing`). Server-issues an opaque `demo_guest_id` cookie (HttpOnly, SameSite=Lax). Guest identity: random 32-byte token; DB stores SHA-256 hash (`guest_hash`) never the raw token. Quota: 2 completed uses per guest. Fingerprint backstop: SHA-256(ip_prefix:user_agent) — if a recently exhausted fingerprint is detected within 7 days, new guests from that device are also blocked. DB tables: `demo_guests` + `demo_runs`. Only Analyze a Document tool enabled in demo; others shown as "Full app" locked. Limits: PDF only, 10 MB, 10 pages. Demo analysis uses OpenAI (gpt-5.2) for summary, key risks, next steps, missing items. Failed runs (server error) do NOT count toward quota. Successful runs do. Marketing "Try it free" CTAs all point to `/demo`. Any visit to `/app/demo` or `/app/demo/analyze` redirects client-side to `/demo`. Routes: `GET /api/demo/status`, `POST /api/demo/analyze`. Key files: `routes/demo/index.ts`, `artifacts/plainpath-marketing/src/pages/DemoLanding.tsx`, `artifacts/plainpath-marketing/src/pages/DemoAnalyze.tsx`.
-   **Compare Versions**: PDF-first workspace for comparing original and revised documents. Slices 1–5 shipped. Engine: Stage A spatial/visual diff, Stage B Myers text diff, Stage C structural signals. Slice 4: union-rect group zones, hover/selection sync, severity override, notes CRUD. Slice 5 (AI enrichment): after deterministic scan completes, async OpenAI pass enriches text diff items with `ai_category` (9-value enum) + `ai_explanation` (one-sentence plain English). AI may upgrade severity but never downgrade below deterministic baseline. Manager override always wins. DB: `compare_versions_sessions.ai_status` (idle/running/complete/error) + `ai_enriched_at`. Auto-enrich fires after each fresh scan; manual retry via "AI Review" button in toolbar. Polling for `ai_status === 'running'` mirrors scan polling. Summary rows show AI category pill + explanation. Non-blocking: workspace fully usable if AI fails. Routes: `POST /sessions/:id/enrich`. Key files: `compareVersionsEnrichment.ts`, `compareVersionsGrouping.ts`, `compareVersionsTypes.ts`, `CompareVersionsSession.tsx`.

### Product Design Rules
-   **Split-Screen Creation Principle**: Tools involving document creation/editing must default to a split-screen layout for real-time visual feedback (Left pane: live document/reference, Right pane: controls).
-   **Document Surface Proportions and Legibility**: Document-heavy tools must display document surfaces at realistic US Letter proportions on desktop for readability.
-   **Launch Scope (2 tools)**: PlainPath launches with two core tools only — **Analyze a Document** (`FileScan`) and **Contract Review** (`Scale`). These are the only tools shown in the authenticated dashboard tool grid, the Plans & Pricing page, and the first-run onboarding. All other tools (Trust Check, Build a Contract, Redact Sensitive Info, Clause Extractor, Compare Versions, Ask This Document) are not shown in user-facing navigation. PlainPath Pro at $19.99/month includes both tools plus saved analysis history.
-   **Document Builder (9th tool, feature-flagged)**: Route `/builder`. BUILDER_ENABLED flag gates all nav/grid appearances. Phase 1 complete: 5-tab right panel (Guide/Outline/Edit/Style/Export), click-to-select blocks with blue ring, AiGuidePanel, OutlinePanel, StylePanel, ExportPanel, BuilderPagePreview with click-select. Phase 2 complete: Structured Document Templates + Guided Question Flow. 8 client-side template definitions in `src/lib/builderTemplates.ts` (SOP, Employee Onboarding Manual, Policy Document, Training Manual, Process Guide, Safety Manual, Incident Report, Checklist) — each with 5-8 guided questions and `dbCategory` mapping to existing DB categories. Template card grid → select template → guided questions wizard (all optional, multiline textarea for prose, single-line for short answers) → `generateDraftContent()` produces rich `BuilderContent` with real sections+blocks using answers where provided and helpful placeholder text where not. Content generation in `src/lib/templateQuestions.ts`. AI Guide panel (`AiGuidePanel.tsx`) now accepts `category` prop and shows contextual headline, recommended next steps, and tips per document type. Start from blank still works. Phase 3 complete: Branding + Logo Controls. `BrandingState` and `BrandingData` types in `builderTypes.ts`. `StylePanel.tsx` rewritten with 7 grouped sections: Company Identity (name, dept, owner, approver, review cycle), Logo (FileReader local preview, position: left/center/right, remove, persistence notice), Brand Color (8 presets + native picker + hex input), Header Style (minimal/formal/modern/internal), Footer (text + 3 toggles: page number, Confidential badge, revision line), Watermark toggle. `BuilderPagePreview.tsx` updated with `branding` prop via React context — renders branded header per headerStyle, logo in selected position, brand color on section borders + h1/h2 headings + dividers, footer zone, and diagonal CONFIDENTIAL watermark. `BrandingData` (text fields only, no logo) persisted in `content.branding` via existing JSONB column — backward compatible (older drafts load with DEFAULT_BRANDING). Logo data URL is local-only and never persisted. `Workspace.tsx` wires branding load from `content.branding`, `handleBrandingChange()` schedules autosave, `buildSaveContent()` strips logoDataUrl before save.
-   **Standard Intake Rule**: All document-intake tools must show: (1) pre-run confirmation state on upload, (2) file card with filename + size, (3) explicit X/remove button, (4) no auto-processing, (5) tool-specific explicit CTA button.
-   **Save Standard for Editing Tools**: Document Builder must have a visible Save button, autosave every 60s, amber highlight when unsaved changes are pending, saving state indicator, and retryable failure state. Document Builder has autosave indicator + explicit Save button (added in standardization pass).
-   **[DEFERRED] Real-document preview during scan (Analyze, Document Trust Check, Contract Review)**: These three tools run in a two-step intake model — the user uploads a file, the PDF bytes are sent to the API server, the server extracts text and feeds it to OpenAI, and then returns results. After the user clicks the CTA, the client has no persistent reference to the uploaded PDF bytes; the scan state is represented by a polling/streaming wait screen (`AnalyzingLoader`) with no document surface. To support a real live-document preview during the scan phase, the following would be required: (a) retain the uploaded File object in component state through the analyzing phase, (b) add a PDF renderer (pdfjs-dist canvas layer) alongside the analyzing overlay, (c) redesign the analyzing-state layout to split-screen (document left, progress right). This is a non-trivial layout rearchitecture and is explicitly deferred to a future product iteration. It is NOT considered part of the standardization pass.

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

## Document Completion Engine — Phase Status

### Phase 1 — Completion Object Parser (Complete)
- `artifacts/plainpath/src/lib/completionTypes.ts` — `CompletionObject`, `AnalysisInput`, and all sub-types
- `artifacts/plainpath/src/lib/completionParser.ts` — `analysisResultToCompletionObjects()` — deterministic, no AI calls
- `artifacts/plainpath/src/lib/completionFixture.ts` — fictional school enrollment fixture for QA
- `artifacts/plainpath/scripts/qa-completion-engine.ts` — 44/44 assertions passing, 27 completion objects from fixture

### Phase 2A — Grouped Analyze Modes (Complete)
Feature flag: `VITE_ANALYZE_COMPLETION_FLOW_ENABLED`
- **Production default**: off — requires `VITE_ANALYZE_COMPLETION_FLOW_ENABLED=true` to enable
- **Dev default**: on (set `VITE_ANALYZE_COMPLETION_FLOW_ENABLED=false` to disable in dev)
- Flag logic: `artifacts/plainpath/src/lib/completionFlowConfig.ts`

When flag is ON, the Analyze results panel shows 4 top-level modes instead of the flat 10-tab row:
- **Understand** — Plain English, Source Sections, Overview, Key Terms (existing tab content)
- **Plan** — Checklist, Required Docs, Deadlines, Risks & Notes, Action Pack, What's Missing (existing tab content, completion objects computed in background)
- **Complete** — Safe preview stub: item counts from completion objects, progress bar, "Review in Plan mode" link. No upload controls, no broken buttons.
- **Compile** — Safe preview stub: packet outline, item count, "coming next" disabled message. No export changes.

Mode switching auto-selects a default tab and also auto-switches mode when StatPill/StartHereBanner deep-links to a tab. When flag is OFF, Analyze page is byte-for-byte identical to the pre-Phase-2A behavior.

New files: `src/lib/completionFlowConfig.ts`, `src/components/AnalyzeModeNav.tsx`
Modified: `src/pages/Analyze.tsx` (imports + handlers + mode nav + tab filtering + preview panels)
Not touched: billing, RevenueCat, Stripe, auth, server routes, analysis generation, export behavior.

### Phase 3 — Guided Completion UI (Planned)
Step-by-step completion interface within Complete mode. One item at a time with source evidence, status tracking, upload per item, note per item.

### Phase 4 — Document Action Packet Compiler (Planned)
Full 15-section packet PDF export with three export states (incomplete/partial/final). Open items always included.

## Mobile Auth Fix (Round 2) — Completed April 2026

**Root causes fixed:**
1. `lib/entitlements.ts` — all 4 API calls used root-relative `/api/...` URLs (completely broken on native mobile, where there is no implicit origin). Fixed to use `getApiBaseUrl()`. Added optional `token?` param to `fetchEntitlements`, `consumeToolUsage`, `consumeAnalysis`, `openBillingPortal`.
2. `hooks/useEntitlements.ts` — bootstrap call used root-relative URL + had no auth header (server requires auth). Fixed URL, added `useAuth`/`getToken`, passes token to both bootstrap and `fetchEntitlements`.
3. `lib/piiExport.ts` — `downloadRedactedPdf` had no token param. Added `token?` param.
4. **Pages/components fixed** (all now send `Authorization: Bearer <token>` on every API call):
   - `pages/Compare.tsx` — extract-text (DocumentInput sub-component) + compare
   - `pages/TeamManage.tsx` — all 5 team management calls (fetch, create, invite, remove member, cancel invite)
   - `pages/ContractReview.tsx` — negotiate-clause (ClauseCard sub-component), scan-images, review (2 variants)
   - `pages/ContractBuilder.tsx` — insight, generate-draft
   - `components/HelpWidget.tsx` — help/chat
   - `components/PiiReview.tsx` — detect-pii (AppliedView sub-component + PiiReview), downloadRedactedPdf
   - `pages/Redact.tsx` — downloadRedactedPdf call
   - `pages/Analyze.tsx` — explain-section (ChecklistTab sub-component), shares POST
   - `pages/Billing.tsx` — openBillingPortal

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