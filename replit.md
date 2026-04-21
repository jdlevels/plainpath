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
-   **PDF Editor**: Full editing workspace for PDFs with tools like Select, Text, Mask, Highlight, and undo/redo. Features GCS object storage for PDFs and visual change indicators.
-   **Public Demo (/demo)**: No-auth free-trial experience at `/demo` (landing) and `/demo/analyze` (upload page), served by the **marketing site** (`artifacts/plainpath-marketing`). Server-issues an opaque `demo_guest_id` cookie (HttpOnly, SameSite=Lax). Guest identity: random 32-byte token; DB stores SHA-256 hash (`guest_hash`) never the raw token. Quota: 2 completed uses per guest. Fingerprint backstop: SHA-256(ip_prefix:user_agent) — if a recently exhausted fingerprint is detected within 7 days, new guests from that device are also blocked. DB tables: `demo_guests` + `demo_runs`. Only Analyze a Document tool enabled in demo; others shown as "Full app" locked. Limits: PDF only, 10 MB, 10 pages. Demo analysis uses OpenAI (gpt-5.2) for summary, key risks, next steps, missing items. Failed runs (server error) do NOT count toward quota. Successful runs do. Marketing "Try it free" CTAs all point to `/demo`. Any visit to `/app/demo` or `/app/demo/analyze` redirects client-side to `/demo`. Routes: `GET /api/demo/status`, `POST /api/demo/analyze`. Key files: `routes/demo/index.ts`, `artifacts/plainpath-marketing/src/pages/DemoLanding.tsx`, `artifacts/plainpath-marketing/src/pages/DemoAnalyze.tsx`.
-   **Compare Versions**: PDF-first workspace for comparing original and revised documents. Slices 1–5 shipped. Engine: Stage A spatial/visual diff, Stage B Myers text diff, Stage C structural signals. Slice 4: union-rect group zones, hover/selection sync, severity override, notes CRUD. Slice 5 (AI enrichment): after deterministic scan completes, async OpenAI pass enriches text diff items with `ai_category` (9-value enum) + `ai_explanation` (one-sentence plain English). AI may upgrade severity but never downgrade below deterministic baseline. Manager override always wins. DB: `compare_versions_sessions.ai_status` (idle/running/complete/error) + `ai_enriched_at`. Auto-enrich fires after each fresh scan; manual retry via "AI Review" button in toolbar. Polling for `ai_status === 'running'` mirrors scan polling. Summary rows show AI category pill + explanation. Non-blocking: workspace fully usable if AI fails. Routes: `POST /sessions/:id/enrich`. Key files: `compareVersionsEnrichment.ts`, `compareVersionsGrouping.ts`, `compareVersionsTypes.ts`, `CompareVersionsSession.tsx`.

### Product Design Rules
-   **Split-Screen Creation Principle**: Tools involving document creation/editing must default to a split-screen layout for real-time visual feedback (Left pane: live document/reference, Right pane: controls).
-   **Document Surface Proportions and Legibility**: Document-heavy tools must display document surfaces at realistic US Letter proportions on desktop for readability.
-   **Tool Surface Parity (Standardization Pass applied)**: All 8 first-class tools must be consistently represented across: (a) authenticated dashboard tool grid, (b) marketing navbar Tools dropdown, (c) marketing ToolsShowcase feature cards. The 8 tools are: Analyze a Document (`FileScan`), Document Trust Check (`ShieldCheck`), Contract Review (`Scale`), Build a Contract (`PenLine`), Redact Sensitive Info (`EyeOff`), Digital Signature (`FileSignature`), PDF Editor (`FileEdit`), Compare Versions (`GitCompare`). Document Builder (`LayoutTemplate`) is a separate utility tool — shown in dashboard but not in the marketing tools surfaces.
-   **Standard Intake Rule**: All document-intake tools must show: (1) pre-run confirmation state on upload, (2) file card with filename + size, (3) explicit X/remove button, (4) no auto-processing, (5) tool-specific explicit CTA button.
-   **Save Standard for Editing Tools**: Document Builder and PDF Editor must have a visible Save button, autosave every 60s, amber highlight when unsaved changes are pending, saving state indicator, and retryable failure state. Document Builder has autosave indicator + explicit Save button (added in standardization pass). PDF Editor has amber-highlighted Save button + SaveIndicator + 60s autosave.

### Payment and Billing
-   Full billing architecture implemented with Stripe for Starter and Pro tiers.
-   Scaffold for native iOS/Android billing using RevenueCat.

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