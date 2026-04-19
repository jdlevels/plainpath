# PlainPath

## Overview

PlainPath is a commercial multi-platform product (Web, iPhone, Android) designed to transform complex paperwork into clear, actionable plans. It leverages AI to analyze documents, check trustworthiness, build contracts, and review existing contracts for fairness. The project aims to simplify legal and administrative processes for users.

## User Preferences

I want iterative development.
Ask before making major changes.
Do not make changes to the folder `lib/api-spec`.
Do not make changes to the file `artifacts/plainpath/src/lib/legalGlossary.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/trustCheckDemoData.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/demoData.ts`.
Do not make changes to the file `artifacts/plainpath/APP_STORE_METADATA.md`.

## Standing Engineering Rules

These rules apply to all future PlainPath implementation work unless explicitly overridden.

### 1. Product Architecture Discipline
- Marketing always at `/`; protected product always under `/app`
- New tool pages must live inside the `/app` shell unless explicitly approved
- Reuse existing routing, navigation, page layout, and history patterns

### 2. Server + Client Entitlement Enforcement
- All plan/tool access enforced in both frontend UX AND backend/API routes — UI locks alone are never sufficient
- Protected endpoints must verify auth and plan entitlement server-side
- Do not change the access matrix unless explicitly instructed

### 3. Design System Consistency
- Reuse the existing PlainPath card system, spacing, button styles, status badges, and locked-tool patterns
- Do not introduce one-off visual systems without approval
- New pages must visually match the existing product shell

### 4. TypeScript Contract Discipline
- Keep shared types aligned across DB, API, and frontend
- Avoid `any`, `never`, or patch casts unless absolutely necessary
- Update union types, entity types, response types, and tool keys when features expand
- Prefer explicit typed contracts over implicit shape assumptions

### 5. Status Normalization
- Keep normalized app statuses separate from raw provider/vendor statuses
- Persist workflow states cleanly; timestamp major state transitions
- Never fabricate status history from UI assumptions

### 6. Audit Trail + Event Logging
- Workflow-changing actions must persist event history where appropriate
- Preserve raw provider event names and payloads
- User-visible timelines must be based on stored events, not invented UI states
- Implement dedupe/idempotency for webhook/event processing

### 7. Webhook and Integration Safety
- Verify callback authenticity where supported (HMAC etc.)
- Handle duplicate deliveries safely with stable dedupe keys
- Never expose provider secrets to the client
- Build integrations with clear test-mode/live-mode behavior

### 8. Schema + Data Hygiene
- New workflow features require explicit schema design
- Add indexes, constraints, timestamps, and dedupe keys intentionally
- Avoid loose ad hoc persistence patterns
- Prefer consistent entity naming and storage conventions

### 9. File Handling Discipline
- Validate upload type and size; reuse secure upload/storage patterns
- Do not assume uploaded files are valid
- Handle download/proxy flows safely and explicitly

### 10. Responsive Completion Standard
- Do not mark features complete without checking desktop, tablet, and mobile layouts
- Verify loading, empty, locked, and error states in all views

### 11. Runtime Config State Handling
- Distinguish clearly between: (a) feature built, (b) feature live, (c) feature blocked by missing credentials/config
- **Never label a built feature as "coming soon" just because credentials are missing**
- Show real configuration-dependent states (e.g. "Provider configuration required" banner) instead
- For all provider-backed features: persist local draft first → persist provider IDs/metadata after send → normalize provider states into app states → persist raw provider events → use webhook-driven updates when available → handle missing credentials as a configuration state

### 12. Regression Prevention
- Do not rewrite unrelated completed sections unless required
- Do not disturb marketing, auth, billing, or other stable tools unless explicitly instructed
- Minimize blast radius on every sprint

### Implementation Sequence (apply to every feature)
inspect existing architecture → identify exact reuse points → implement with minimal blast radius → verify route/auth/plan enforcement → verify responsive behavior → report exact files read and changed

## System Architecture

PlainPath is built as a monorepo using pnpm workspaces.

### Frontend
- **Technology**: React with Vite.
- **UI/UX**: Premium SaaS aesthetic featuring warm tones, high whitespace, Framer Motion for animations, Radix UI primitives, and Tailwind CSS. Supports Light, Dark, and System themes, with FOUC prevention and print-specific light mode.
- **Platform Readiness**: Designed for cross-platform compatibility with Capacitor for iOS/Android, incorporating native features like file pickers, haptic feedback, and status bar integration.
- **Routing**: Marketing site at `/` and web application at `/app/`.

### Backend
- **Technology**: Express 5 API server.
- **Monorepo Structure**: `artifacts/plainpath` for the frontend and `artifacts/api-server` for the backend API.
- **Shared Libraries**: Includes `lib/api-spec` (OpenAPI), `lib/api-client-react` (React Query hooks), `lib/api-zod` (Zod schemas), `lib/db` (Drizzle ORM with PostgreSQL), and `lib/integrations-openai-ai-server` (OpenAI integration).

### Core Features

1.  **Analyze a Document**: AI (`gpt-5.2`) extracts action steps, deadlines, risks, key terms, and summaries from pasted text, PDF/Word files, or camera scans. Results include a 10-tab view, interactive checklist, and export options.
2.  **Document Trust Check**: Evaluates documents with three scores: Authenticity Risk, Document Risk, and Verification Confidence, identifying structural and metadata issues.
3.  **Contract Builder**: A 6-step guided wizard to build contracts (e.g., Freelance, NDA). Features an AI Insight Panel, gap analysis, and generates a structured draft with options to send for signature.
4.  **Fair Deal Check**: Reviews user-received contracts clause-by-clause, flagging unfair terms with explanations, negotiation language, and exit guidance.
5.  **AI Help Assistant**: A floating chat widget (`gpt-4o-mini`) providing context-aware assistance.
6.  **PII Redaction (MVP — FROZEN)**: A pre-processing safety step across the document pipeline. Detects 16 PII types via regex + AI, groups repeated values, lets users select what to redact, and applies true character-level replacement (not masking). Exports a clean redacted `.txt` version. Original uploaded PDF/DOCX files are not modified — limitation note is displayed in the tool. Handoff: sets sessionStorage keys so Analyze, Trust Check, and Contract Review load the redacted version with a banner. **Native PDF/DOCX binary redaction is a future upgrade — do not modify redaction architecture unless a bug is found.**
7.  **Document Comparison**: Allows comparison of two document versions, highlighting changes and their significance (added, removed, modified, risk-increased/decreased).
8.  **Digital Signature** (Pro-only): End-to-end e-signature workflow via Dropbox Sign. 3-step wizard (upload document → signer details → review & send), status timeline with audit trail, download signed documents, HMAC-SHA256 webhook verification. Tables: `signature_requests` + `signature_request_events` in PostgreSQL. Frontend: `Signature.tsx` with ListView + NewRequestWizard + DetailView; client at `signatureApi.ts`. Routes at `/api/signatures`. DROPBOX_SIGN_API_KEY required; defaults to test mode (DROPBOX_SIGN_TEST_MODE != "false").

### Payment and Billing
-   Full billing architecture implemented in test mode with Stripe, supporting Starter ($4.99/month) and Pro ($19.99/month) tiers. Starter = Analyze a Document + Redact Sensitive Info. Pro = all 6 tools (including Digital Signature). PAYWALL_ENFORCEMENT is ON — gating is live. STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be added to secrets before payments go live.
-   Native billing abstraction scaffold built for iOS/Android using RevenueCat (account setup pending — see `docs/store/05-revenuecat-config.md`).

### Store & Launch Docs (`docs/store/`)
-   `01-store-metadata.md` — shared app name, description, keywords, category, pricing, URLs
-   `02-app-store-listing.md` — full Apple App Store copy, screenshot plan, IAP config, review notes
-   `03-play-store-listing.md` — full Google Play listing, data safety section, IAP config
-   `04-store-assets.md` — icon specs, screenshot sizes, feature graphic brief, preview video script
-   `05-revenuecat-config.md` — product/entitlement structure, client code scaffold, pricing notes
-   `06-native-packaging-checklist.md` — step-by-step Capacitor + App Store + Play Store checklist

## External Dependencies

-   **OpenAI**: For AI capabilities (analysis, contracts, help widget).
-   **PostgreSQL**: Database managed with Drizzle ORM.
-   **Clerk**: For user authentication (Google OAuth, email/password).
-   **Capacitor**: For native mobile application development, including `@capawesome/capacitor-file-picker`, `@capacitor/haptics`, and `@capacitor/status-bar`.
-   **Radix UI**: Unstyled component primitives.
-   **Tailwind CSS**: For styling.
-   **Framer Motion**: For animations.
-   **Dropbox Sign**: For "Send for Signature" functionality in Contract Builder.
-   **Stripe**: Payment gateway for subscriptions.
-   **RevenueCat**: Native in-app purchase and subscription management (for iOS/Android).
-   **Resend**: For email delivery (e.g., deadline reminders, waitlist confirmations).
-   **Dropbox Chooser**: For importing files from Dropbox.
-   **Cornell LII (law.cornell.edu) and CFPB**: External sources for legal glossary definitions.