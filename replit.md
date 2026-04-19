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
9.  **Document Builder (Slice 1)**: Structured document editor at `/app/builder`. Supports 9 block types (Heading, Paragraph, BulletList, NumberedList, Checklist, KeyValue, Divider, Note, Table) organized into sections. Features: optimistic autosave (2s debounce + server_version concurrency), Draft/Final status toggle, Archive with confirmation, 7 seeded system templates (SOP, Handbook, Policy, Checklist, Incident Report, Proposal, PRD), template-based or blank creation wizard. Feature-flagged via `BUILDER_ENABLED` (backend) and `VITE_BUILDER_ENABLED` (frontend), both default `true` in development.

### Document-First Architecture
The project is transitioning to a document-first model where uploaded documents become persistent, reusable assets across tools. This involves a `documents` table for storing user-owned documents and `document_tool_runs` for linking tool outputs to documents. Cross-tool sessionStorage keys facilitate seamless handoffs between features like Redact, Analyze, and Signature.

### Payment and Billing
-   Implemented a full billing architecture with Stripe for Starter and Pro tiers, enforcing paywall access.
-   Scaffold built for native iOS/Android billing using RevenueCat.

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