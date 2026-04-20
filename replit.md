# PlainPath

## Overview

PlainPath is a commercial multi-platform product (Web, iPhone, Android) that utilizes AI to transform complex paperwork into clear, actionable plans. Its core purpose is to simplify legal and administrative processes by offering features like AI-powered document analysis, trustworthiness checks, contract building, and fair deal reviews. The project aims to reduce complexity and improve accessibility for users dealing with legal and administrative documents.

## User Preferences

I want iterative development.
Ask before making major changes.
Do not make changes to the folder `lib/api-spec`.
Do not make changes to the file `artifacts/plainpath/src/lib/legalGlossary.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/trustCheckDemoData.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/demoData.ts`.
Do not make changes to the file `artifacts/plainpath/APP_STORE_METADATA.md`.

## System Architecture

PlainPath is built as a monorepo using pnpm workspaces, separating frontend and backend concerns while sharing core libraries.

### Frontend
- **Technology**: React with Vite.
- **UI/UX**: Features a premium SaaS aesthetic with warm tones, high whitespace, Framer Motion for animations, Radix UI primitives, and Tailwind CSS. Supports Light, Dark, and System themes with FOUC prevention.
- **Platform Readiness**: Utilizes Capacitor for cross-platform iOS/Android compatibility, integrating native features like file pickers, haptics, and status bar control.
- **Routing**: Marketing site at `/` and the main web application at `/app/`.

### Backend
- **Technology**: Express 5 API server.
- **Monorepo Structure**: `artifacts/plainpath` for frontend and `artifacts/api-server` for backend API.
- **Shared Libraries**: Includes `lib/api-spec` (OpenAPI), `lib/api-client-react` (React Query hooks), `lib/api-zod` (Zod schemas), `lib/db` (Drizzle ORM with PostgreSQL), and `lib/integrations-openai-ai-server` (OpenAI integration).

### Core Features
1.  **Analyze a Document**: AI extracts action steps, deadlines, risks, key terms, and summaries from various document types.
2.  **Document Trust Check**: Evaluates documents for authenticity, risk, and verification confidence.
3.  **Contract Builder**: A guided wizard for creating contracts with AI insights and gap analysis.
4.  **Fair Deal Check**: Reviews contracts clause-by-clause, highlighting unfair terms and providing negotiation guidance.
5.  **AI Help Assistant**: Context-aware chat widget for user assistance.
6.  **PII Redaction (MVP — FROZEN)**: Pre-processing step to detect and redact PII across the document pipeline, with character-level replacement.
7.  **Document Comparison**: Highlights changes and their significance between two document versions.
8.  **Digital Signature (Pro-only)**: End-to-end e-signature workflow via Dropbox Sign, supporting Quick Send and Prepare & Place modes.
9.  **Document Builder (Slice 2)**: Structured document editor at `/app/builder`. Supports 9 block types (Heading, Paragraph, BulletList, NumberedList, Checklist, KeyValue, Divider, Note, Table) organized into sections. Features: optimistic autosave (2s debounce + server_version concurrency), Archive with confirmation, 7 seeded system templates (SOP, Handbook, Policy, Checklist, Incident Report, Proposal, PRD), template-based or blank creation wizard, IntersectionObserver scroll-spy for section nav, section/block counts in list view, page titles on all builder routes, Enter key in list blocks creates new items, ParagraphBlock uses useLayoutEffect for instant height sync, TableBlock uses table-layout: fixed for column consistency, BlockTypePicker opens downward with z-[200] to clear sticky headers. Feature-flagged via `BUILDER_ENABLED` (backend) and `VITE_BUILDER_ENABLED` (frontend), both default `true` in development.
10. **PDF Editor (Slice 4 — complete)**: Full editing workspace at `/app/pdf-editor`. Pro/admin gated. Upload → persistent session → split-screen editor. Left pane = Original (read-only), right pane = Working Copy with overlay ops. Four tools: Select (move/resize/delete), Text (click to place textarea), Mask (drag white rectangle), Highlight (drag yellow semi-transparent rectangle). Undo/redo (Ctrl+Z/Y, history stack, 50 entries). Save system: immediate on draw/place/delete, 800ms debounce on text typing. **Export (Slice 3)**: violet "Download" button in top-right toolbar. **Slice 4 additions**: GCS object storage for source PDFs; `ChangeIndicatorOverlay` on left pane with union-rect grouping; white-mask diagonal stripe hint; bidirectional hover sync. `pdfObjectStorage.ts` wrapper also exposes `uploadObject()` (generic path) for other tools.
11. **Audit Document Revisions / Compare Versions (Slice 1 — complete)**: PDF-first, deterministic manager/supervisor audit workspace at `/app/compare-versions`. Pro/admin gated. **Slice 1 foundation**: (a) DB table `compare_versions_sessions` — columns: id (uuid PK), user_id, title, original_storage_key, original_file_name, original_page_count (nullable), revised_storage_key, revised_file_name, revised_page_count (nullable), status (pending|scanning|complete|error), diff_result (jsonb nullable), manager_notes (jsonb, default []), scanned_at, created_at, updated_at. (b) API routes at `/api/compare-versions/sessions`: POST (multipart — originalFile + revisedFile, both PDF-only V1, 50 MB cap, explicit rejection of .docx/.txt/images, object storage upload to `compare-versions/{userId}/{sessionId}/original.pdf` + `revised.pdf`), GET list (user's sessions, most recent first), GET :id (metadata + manager_notes). (c) Frontend types (`compareVersionsTypes.ts`), API client (`compareVersionsApi.ts`), hook (`useCompareVersionsApi.ts`). (d) `CompareVersions.tsx` page — session list default view + "New Comparison" inline intake (two PDF slots with drag-drop/browse/X-remove, Manager Notes/Watchlist collapsible area with freeform textarea + structured watchlist rows with text/severity/resolved, "Scan Documents" button exact label, violet when enabled / grey when disabled, inline progress and error states). (e) `CompareVersionsSession.tsx` — Slice 1 placeholder scaffold showing session title/status/filenames/manager-notes summary (read-only), Slice 2 notice. (f) Routes `/compare-versions` and `/compare-versions/:id` added to `App.tsx`. (g) Dashboard card "Audit Document Revisions" (teal, `ScanSearch` icon) added to `Home.tsx` TOOLS array. (h) Navbar Tools dropdown entry added. (i) `compare-versions` added to pro plan TOOL_ACCESS in `artifacts/api-server/src/lib/planEntitlements.ts`.
    **Not yet in Slice 1**: pdfjs rendering, dual-pane workspace, visual/text/structural diff, summary panel, severity calculation, grouped zones, overlays, linked navigation, AI calls, export, Word conversion.
    Slice 2+ planned: dual-pane render + page mapping → diff engine → group zones + severity UI → AI enrichment → Word/export (V2). Full editing workspace at `/app/pdf-editor`. Pro/admin gated. Upload → persistent session → split-screen editor. Left pane = Original (read-only), right pane = Working Copy with overlay ops. Four tools: Select (move/resize/delete), Text (click to place textarea), Mask (drag white rectangle), Highlight (drag yellow semi-transparent rectangle). Undo/redo (Ctrl+Z/Y, history stack, 50 entries). Save system: immediate on draw/place/delete, 800ms debounce on text typing. **Export (Slice 3)**: violet "Download" button in top-right toolbar. On click: flushes pending saves, calls GET `/api/pdf-editor/sessions/:id/export` (Clerk-authed), server uses pdf-lib to load original PDF bytes and bake in all ops. **Slice 4 additions**: (a) **Object storage migration** — new sessions upload PDF to GCS via Replit object storage sidecar (`http://127.0.0.1:1106`, external_account credentials), stored in `pdf-editor/{userId}/{sessionId}.pdf`; `pdf_storage_key` column in `pdf_editor_sessions` stores the path; `pdf_bytes` made nullable; `resolvePdfBytes()` checks `pdf_storage_key` first (GCS download) then falls back to `pdf_bytes` (legacy). GCS wrapper at `artifacts/api-server/src/lib/pdfObjectStorage.ts`. (b) **Left-pane change indicators** — `ChangeIndicatorOverlay` component renders semi-transparent grouped badges on the original (read-only) left pane mirroring the positions of right-pane ops. Overlapping ops are union-grouped. Mask groups: charcoal tint + dashed border. Text groups: indigo. Highlight groups: amber. Active group (when selected in right or hovered from left) shows violet border. (c) **White-mask editor hint** — mask ops in the right pane show a repeating 45° diagonal stripe (`rgba(0,0,0,0.05)`) on a white background so they're visible on white pages; export still bakes a solid white rectangle. (d) **Bidirectional hover sync** — selecting an op in right highlights the matching left indicator; hovering a left badge shows a violet ring on the matching right ops. Coordinate system: both panes use fractional (0–1) top-left `x/y/w/h`. `pdf_editor_sessions` schema: `pdf_bytes` (bytea, nullable), `pdf_storage_key` (text, nullable), legacy sessions keep `pdf_bytes`.

### Document-First Architecture
The project is transitioning to a document-first model where uploaded documents become persistent, reusable assets across tools. This involves a `documents` table for storing user-owned documents and `document_tool_runs` for linking tool outputs to documents. Cross-tool sessionStorage keys facilitate seamless handoffs between features like Redact, Analyze, and Signature.

### Payment and Billing
-   Implemented a full billing architecture with Stripe for Starter and Pro tiers, enforcing paywall access.
-   Scaffold built for native iOS/Android billing using RevenueCat.

## Product Design Rules

These are standing rules that govern all current and future PlainPath tool design. They must be treated as constraints before implementation begins, not as optional polish.

### Rule 1 — Split-Screen Creation Principle
Any PlainPath tool in which a user is creating, editing, or restructuring a document must default to a split-screen layout when real-time visual feedback improves the quality or confidence of the user's work. Left pane: live document output or reference. Right pane: creation and editing controls. Users must not edit blind. This is the default. Single-pane is the exception and must be justified.

Applies to: Document Builder, PDF Editor, and any future creation/editing tool.

### Rule 2 — Document Surface Proportions and Legibility
For document-heavy tools, the document surface (the rendered page/canvas area) must appear at realistic US Letter proportions on desktop when possible. The surrounding workspace must be wide enough that the page is comfortably readable and workable — not thumbnail-sized.

Split-screen alone is not sufficient. Pane sizing must prioritize document legibility. A narrow preview pane that renders the page too small to read defeats the purpose of the live preview.

On smaller screens and mobile, preserve page proportions but adapt layout responsively. Stacked or toggled layouts (e.g., preview tab / editor tab) are acceptable if they improve usability. Desktop remains the primary simultaneous split-screen experience.

Applies to: Document Builder (current), PDF Editor, any future document-rendering tool.

## External Dependencies

-   **OpenAI**: For AI functionalities (analysis, contract generation, help).
-   **PostgreSQL**: Primary database, managed by Drizzle ORM.
-   **Clerk**: User authentication (Google OAuth, email/password).
-   **Capacitor**: Native mobile application development, including file pickers, haptics, and status bar.
-   **Radix UI**: Unstyled component primitives for UI.
-   **Tailwind CSS**: For styling.
-   **Framer Motion**: For animations.
-   **Dropbox Sign**: For digital signature workflows.
-   **Stripe**: Payment gateway for subscriptions.
-   **RevenueCat**: Native in-app purchase and subscription management (iOS/Android).
-   **Resend**: For email delivery services.
-   **Dropbox Chooser**: For importing files from Dropbox.
-   **Cornell LII (law.cornell.edu) and CFPB**: External sources for legal glossary definitions.