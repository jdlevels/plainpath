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
6.  **PII Redaction**: A pre-processing safety step across the document pipeline, enabling detection and permanent redaction of sensitive information via regex and OpenAI.
7.  **Document Comparison**: Allows comparison of two document versions, highlighting changes and their significance (added, removed, modified, risk-increased/decreased).

### Payment and Billing
-   Full billing architecture implemented in test mode with Stripe, supporting Starter ($4.99/month) and Pro ($19.99/month) tiers.
-   Native billing abstraction built for iOS/Android using RevenueCat.

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