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
-   **Document Trust Check**: Full split-workspace UX for evaluating document authenticity and risk. Desktop: left panel (57%) = DocViewer with section-by-section document content + violet highlight ring when a source chip is clicked; right panel (43%) = TrustIntelPanel with 7 sections: A. Trust Summary, B. Trust Score & Confidence, C. Major Trust Concerns (with clickable source chips), D. Verification Checklist (interactive checkboxes, urgent flags), E. Document Consistency, F. Metadata/Structure Signals, G. Source Traceability. Mobile: tabbed Trust Check / Document layout. States: empty (upload zone + "Works well with" grid + 4 demo chips), loading, error (encrypted/unreadable → `/trust-check?error=encrypted`), low-confidence (`scanQuality === "poor"` → LowConfPanel with partial scan explanation + recommended next steps), full workspace. Source chips link trust concerns to document sections via `sourceSectionId` + `findBestSection()` fuzzy match. Trust score = 100 − riskScore. `scanQuality` derived from `verificationConfidence` (<30 = poor, 30–50 = partial, >50 = good). Backend: API prompt now returns `sections[]` (verbatim document sections) and `sourceRef` per indicator; `documentType` label; `scanQuality` field on all responses. Demo data: `northstar-invoice` (Invoice, riskScore 69, Northstar Cloud Services / Meridian Group LLC / Coastal Pacific Bank Singapore) and `atlas-lowconf` (poor scan, riskScore 71, Atlas Vendor Services PR-2025-3391). Key files: `artifacts/plainpath/src/pages/TrustCheck.tsx`, `artifacts/plainpath/src/lib/trustCheckTypes.ts`, `artifacts/api-server/src/lib/trustCheckDemoData.ts`, `artifacts/api-server/src/routes/documents/index.ts`.
-   **Contract Builder** (APPROVED AND IMPLEMENTED — approved split-screen design): Full guided contract creation workspace. Routes: `/build`, `/contract-builder`, `/build-contract` (all protected). Desktop: split-screen — left 58% = live paper preview (`#FFFEF8` surface, `#111115` bg) that populates in real-time as user fills the form; right 42% = builder controls with step progress, Required/Optional field badges, form inputs, Back/Next/Skip navigation. Mobile: Builder tab (first) / Preview tab (second). 8 states: (1) Empty — template selection grid (Freelance, NDA, Service, Lease, Payment, Custom Agreement), scoping notice, recent drafts, legal disclaimer; (2) Builder Workspace — split-screen, step progress, live preview updates per field; (3) Clause Active/Editing — active step's section highlighted with violet ring + "Editing this section" label in paper preview; (4) AI Suggestion — generating state with phase checklist + paper showing pending clause with dashed violet border + "SUGGESTION — PENDING YOUR REVIEW" label; (5) Review & Export — full draft on left, section checklist + Export PDF/DOCX/Copy text on right; E-signature (Dropbox Sign) greyed out with "Coming soon" badge; (6) Error — "Document could not be generated." + Try again / Save draft / Use another template / Ask PlainPath; (7) Mobile Builder — full-width form with sticky nav bar; (8) Mobile Preview — "Return to Builder to edit" banner + paper surface + disclaimer. Legal disclaimers on every step. AI language: "Suggested language only — review before use. Not legal advice." Contract types: freelance, nda, payment-agreement, service-agreement, lease, custom (mapped to freelance for API). API: `POST /api/contracts/generate-draft`. Draft auto-saved to `localStorage`. `saveRecentWork` called on save/generate. Key file: `artifacts/plainpath/src/pages/ContractBuilder.tsx`.
-   **Fair Deal Check**: Reviews contracts for unfair terms and provides negotiation guidance.
-   **AI Help Assistant**: Context-aware chat for user support.
-   **Redact Sensitive Info** (APPROVED AND LOCKED — redesign complete): Text-first PII detection and redaction workspace. User pastes text, uploads a file (PDF/DOCX/image), or imports via URL → backend extracts text + runs regex+AI PII detection pipeline → full workspace renders. Desktop: two-panel split — left 60% = white paper surface (`#FFFEF8`) displaying extracted document text with inline amber highlight spans at character-level PII positions; right 40% = redaction control panel (Sections A–H: Redaction Summary, Detection Strip, Suggested Redactions with masked previews, Category Filter, Review Queue, Manual Tools, Save/Export, Source Traceability). Toggle: Original view (amber highlights) ↔ Redaction Preview (black bars inline on paper, sized to match text). Active item: clicking any right-panel card scrolls the paper to that span + highlights with violet ring + shows an evidence banner (amber "Was: [value] → [black bar]"). Export: builds in-memory redacted text with `[REDACTED]` replacing selected spans → downloads `[filename]_redacted.txt`. **PRODUCTION GAP — must fix before release**: PDF inputs currently export `.txt` only; true redacted PDF copy (embedded black bars in PDF layout) is not yet implemented — requires backend pdf-lib or similar pipeline. Save: amber Save button + unsaved indicator when redactions are modified. Mobile: Redactions tab (default, full right panel) / Document tab (paper surface). All 9 states implemented: Empty, Processing (paper skeleton + 7-step checklist), Workspace, Active Item, Redaction Preview, Low Confidence, Error, Mobile Redactions, Mobile Document. Demo data is fictional (Jordan M. Whitfield, 542-87-1934, jordan.whitfield@myemail.com). Route `/redact` is auth-protected via `protect(Redact)`. Key files: `artifacts/plainpath/src/pages/Redact.tsx`, `artifacts/api-server/src/routes/piiDetection.ts`. API: `POST /api/documents/detect-pii` returns `{ spans: PiiSpan[] }` (regex + AI, confirmed working). No TypeScript errors in Redact.tsx.
-   **Document Comparison**: Highlights changes between document versions.
-   **Digital Signature**: E-signature workflow via Dropbox Sign.
-   **Document Builder**: Structured document editor with multiple block types, templates, and optimistic autosave.
-   **Document Overview Hub**: The primary post-upload surface — document-first UX replacing the tool-first flow. Upload any document → AI generates a structured overview in one shot: plain-English summary, risks (with page citations), key dates, key parties, key obligations, recommended next actions, and suggested follow-up questions. Left panel: live pdfjs-dist PDF viewer with page navigation, zoom, fullscreen; clicking a citation chip jumps the viewer to that page with a violet highlight ring. Right panel: intelligence hierarchy rendered in structured cards. "Recommended Next Actions" are document-specific and link directly to the correct downstream tool. "Ask This Document" integration: overview upload also creates a linked `ask_document_sessions` record; clicking "Ask This Document" from the overview opens Ask Document with the document already loaded — no re-upload. States: empty (upload zone + recent docs), processing (stage animation), completed overview, partial/low-confidence (with amber warning), error. Mobile: tab-based layout (Overview / Document) with source-jump return UX. DB table: `document_overview_sessions` (id UUID, user_id, file_name, file_size_bytes, file_type, page_count, status [analyzing/ready/partial/error], overview JSONB, ask_session_id UUID, error_message, created_at, updated_at). Routes: `POST /api/document-overview/sessions`, `GET /api/document-overview/sessions`, `GET /api/document-overview/sessions/:id`. Frontend routes: `/document-overview`, `/document-overview/:id`. Key files: `artifacts/plainpath/src/pages/DocumentOverview.tsx`, `artifacts/plainpath/src/lib/documentOverviewApi.ts`, `artifacts/plainpath/src/lib/documentOverviewTypes.ts`, `artifacts/api-server/src/routes/document-overview/index.ts`. Prominent card on Home page with NEW badge.
-   **Clause Extractor**: Full scan workspace (8 states). Upload a PDF or DOCX contract → OpenAI (gpt-4o) extracts structured data: key dates, parties, financial terms, 8 legal clauses (each with present/summary/snippet), obligations, and missing fields. Desktop: split workspace — left panel DocViewer (58%, independently scrollable) shows document sections; right panel ExtractionPanel (42%) shows: A. Extraction Summary, B. Confidence Strip, C. Key Extracted Clauses with category filters (All/Payment/Termination/Obligations/Liability/Confidentiality/Deadlines/Missing), D. Inline category chips, E. Obligations & Owners table, F. Dates & Deadlines list, G. Missing/Unclear (collapsible), H. Source Traceability (collapsible). Mobile: Clauses/Document tab layout. Source chips: clicking a §N·p.N chip scrolls DocViewer to that section, highlights it with a violet ring, and shows an evidence banner above the active clause card. States: Empty (upload dropzone), Processing (progress steps with "N of 6 steps" + live scan animation), Completed, SourceActive (source chip clicked), LowConf (`extractionConfidence === "low"` → amber partial extraction notice + "WHAT PLAINPATH COULD READ" / "WHAT COULD NOT BE VERIFIED" panels + recommended next steps), Error ("Clause extraction could not be completed." + Try again / Different file). Wording: "extracted clause", "source-backed extracted term", "term to verify", "possible missing clause", "unclear term", "not legal advice". Importance dots: amber = "Needs attention", blue = "Standard term", grey = "Noted". DB: `clause_extractor_sessions` (id, user_id, file_name, file_size_bytes, file_type, status, results jsonb, error_message). Routes: `POST /api/clause-extractor/sessions`, `GET /api/clause-extractor/sessions`, `GET /api/clause-extractor/sessions/:id`, `DELETE /api/clause-extractor/sessions/:id`. Key files: `artifacts/plainpath/src/pages/ClauseExtractor.tsx`, `artifacts/plainpath/src/lib/clauseExtractorTypes.ts`, `artifacts/plainpath/src/lib/clauseExtractorApi.ts`, `artifacts/api-server/src/routes/clause-extractor/index.ts`.
-   **Public Demo (/demo)**: No-auth free-trial experience at `/demo` (landing) and `/demo/analyze` (upload page), served by the **marketing site** (`artifacts/plainpath-marketing`). Server-issues an opaque `demo_guest_id` cookie (HttpOnly, SameSite=Lax). Guest identity: random 32-byte token; DB stores SHA-256 hash (`guest_hash`) never the raw token. Quota: 2 completed uses per guest. Fingerprint backstop: SHA-256(ip_prefix:user_agent) — if a recently exhausted fingerprint is detected within 7 days, new guests from that device are also blocked. DB tables: `demo_guests` + `demo_runs`. Only Analyze a Document tool enabled in demo; others shown as "Full app" locked. Limits: PDF only, 10 MB, 10 pages. Demo analysis uses OpenAI (gpt-5.2) for summary, key risks, next steps, missing items. Failed runs (server error) do NOT count toward quota. Successful runs do. Marketing "Try it free" CTAs all point to `/demo`. Any visit to `/app/demo` or `/app/demo/analyze` redirects client-side to `/demo`. Routes: `GET /api/demo/status`, `POST /api/demo/analyze`. Key files: `routes/demo/index.ts`, `artifacts/plainpath-marketing/src/pages/DemoLanding.tsx`, `artifacts/plainpath-marketing/src/pages/DemoAnalyze.tsx`.
-   **Compare Versions**: Text-first AI comparison workspace. Upload two PDF documents → GPT-4o extracts text sections from both, pairs them, and produces structured Change Intelligence. Desktop: three-zone layout — Original text panel (33%) + Revised text panel (33%) + Change Intelligence panel (34%). Right panel sections A–H: A. Change Summary, B. Change Strip (counts/confidence badge), C. Key Changes (top 5–8 changes, clickable), D. Added Language, E. Removed Language, F. Modified Terms (before/after), G. Possible Risk Changes, H. Source Traceability (collapsible chip list). Change chip click: scrolls both text panels to the paired sections, highlights them with violet ring, shows Evidence Banner (before/after). Mobile: three tabs — Original / Revised / Analysis. States: loading (spinner), scanning (processing animation), processing/analyzing (CI running), complete (workspace), scan error, CI error, not found. DB: `compare_versions_sessions` — `change_intelligence JSONB`, `ci_status TEXT` (pending/running/complete/error). Auto-trigger: when GET /sessions/:id detects status='complete' + ci_status='pending', auto-kicks off intelligence analysis in background. New scan also resets ci_status='pending'. Backend lib: `compareVersionsIntelligence.ts` (pdf-parse + GPT-4o, returns sections_original/sections_revised + key_changes/added_language/removed_language/modified_terms/risk_changes). Key files: `artifacts/plainpath/src/pages/CompareVersionsSession.tsx`, `artifacts/plainpath/src/lib/compareVersionsTypes.ts`, `artifacts/api-server/src/lib/compareVersionsIntelligence.ts`, `artifacts/api-server/src/routes/compare-versions/index.ts`.

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