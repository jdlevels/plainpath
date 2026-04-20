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
-   **Compare Versions**: PDF-first workspace for comparing original and revised documents. Slices 1–3 shipped: dual-pane pdfjs renderer, async comparison engine (Stage A spatial/visual diff, Stage B Myers text diff via `diff` package, Stage C structural pattern signals), severity-coded overlays (HIGH red, MEDIUM amber, LOW gray, added blue) on each PDF pane, enriched Summary drawer with All/High/Med/Low tabs, click-to-jump page navigation, polling for scan status, Rescan button. Engine: `artifacts/api-server/src/lib/compareVersionsEngine.ts`. Routes: POST /sessions (status=scanning + fire-and-forget scan), GET /sessions/:id (includes diffResult), POST /sessions/:id/scan (rescan).

### Product Design Rules
-   **Split-Screen Creation Principle**: Tools involving document creation/editing must default to a split-screen layout for real-time visual feedback (Left pane: live document/reference, Right pane: controls).
-   **Document Surface Proportions and Legibility**: Document-heavy tools must display document surfaces at realistic US Letter proportions on desktop for readability.

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