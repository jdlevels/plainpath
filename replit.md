# PlainPath

## Overview

PlainPath is a full-stack web application designed to transform complex paperwork (PDFs, pasted text) into clear, actionable plans. It aims to simplify understanding of documents like contracts, legal notices, and administrative forms, providing users with a structured breakdown of their contents. The project seeks to empower individuals by demystifying document-based obligations, risks, and next steps, with a vision to become a go-to tool for personal and small business document management.

The application includes a unique "Document Trust Check" feature that evaluates documents for authenticity risks, potential harm from contract terms, and the verifiability of the issuer, helping users identify scams or predatory agreements.

## User Preferences

I want iterative development.
Ask before making major changes.
Do not make changes to the folder `lib/api-spec`.
Do not make changes to the file `artifacts/plainpath/src/lib/legalGlossary.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/trustCheckDemoData.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/demoData.ts`.
Do not make changes to the file `artifacts/plainpath/APP_STORE_METADATA.md`.

## System Architecture

PlainPath is structured as a monorepo using pnpm workspaces.

### Frontend
- **Technology**: React with Vite.
- **UI/UX**: Premium SaaS style with warm tones and high whitespace. Uses Framer Motion for animations, Radix UI primitives, and Tailwind CSS for styling.
- **Theme System**: Supports Light, Dark, and System themes, persisted in `localStorage`. Features FOUC prevention and forces light mode for printing.
- **Platform Readiness**: Designed for cross-platform compatibility with Capacitor for iOS/Android, including native file pickers, haptic feedback, and status bar integration.

### Backend
- **Technology**: Express 5 API server.
- **Monorepo Structure**:
    - `artifacts/plainpath`: React + Vite frontend.
    - `artifacts/api-server`: Express 5 backend API.
- **Shared Libraries**:
    - `lib/api-spec`: OpenAPI specification for API.
    - `lib/api-client-react`: Auto-generated React Query hooks from OpenAPI.
    - `lib/api-zod`: Auto-generated Zod schemas from OpenAPI.
    - `lib/db`: Drizzle ORM with PostgreSQL schema.
    - `lib/integrations-openai-ai-server`: OpenAI AI integration.

### Core Features
- **Document Import**: Supports text pasting and PDF uploads, with built-in demo documents.
- **AI Analysis**: Extracts actionable steps, required documents, deadlines, risks, and plain-English overviews using `gpt-5.2`. Provides confidence and priority badges for extracted items and source evidence tooltips.
- **Analysis Results View**: A 10-tab interface including Plain English summary, Source Sections, Checklist, Key Terms, and Action Pack.
- **Explain This Section**: Provides inline breakdowns (meaning, what to do, why it matters, risk if skipped) for action steps.
- **Interactive Checklist**: Allows users to track progress on action steps and required documents.
- **Save & Manage Analyses**: Users can save analysis snapshots locally, with options to open, rename, and delete saved analyses.
- **Export/Share**: Options to print/PDF, copy as text, download .txt, and share via Web Share API.
- **Key Terms Glossary**: A client-side legal glossary with fuzzy matching to enrich AI-generated key terms, linking to external legal resources.
- **Add to Calendar**: Integrates with deadlines to generate `.ics` files for calendar applications.
- **Deadline Reminders**: Bell/BellDot buttons on every DeadlineCard for browser push notifications (via `reminderStorage.ts`). Plus a Mail button that expands an inline email input; submits to `POST /api/reminders/email` (Resend-powered, activates when RESEND_API_KEY is set). Key files: `artifacts/plainpath/src/lib/reminderStorage.ts`, `artifacts/api-server/src/routes/reminders/index.ts`
- **Shareable Analysis Links**: "Copy share link" in ExportMenu posts analysis JSON to `/api/shares` (PostgreSQL-backed), returns a `/shared/:token` URL. `SharedAnalysis.tsx` renders read-only shared view. Key API: `artifacts/api-server/src/routes/shares/index.ts`

### Pricing Tiers
- **Starter** ($4.99/month): Analyze a Document only
- **Pro** ($24.99/month): All 3 tools — Document Analysis, Trust Check, Contract Builder
- **Team** ($49.99/month): Pro + team features (planned)
- Trust Check and Contract Builder are Pro/Team gated (lock icon shown to Starter users)
- Key file: `artifacts/plainpath/src/data/pricingData.ts`

### Homepage Aesthetic (Full Overhaul)
- **Hero**: Layered gradient + dot-grid SVG background, gradient headline text (blue → violet)
- **StatsBar**: 4 animated stat counters (analyses, rating, trust checks, contracts)
- **ToolsShowcase**: 3 tool cards with colored gradient backgrounds and tier badges
- **TestimonialsSection**: 6 user testimonials in a 3-column grid
- **FAQSection**: 8-item accordion FAQ
- Key file: `artifacts/plainpath/src/pages/Home.tsx`
- Component files: `src/components/home/StatsBar.tsx`, `ToolsShowcase.tsx`, `TestimonialsSection.tsx`, `FAQSection.tsx`

### Contract Builder (Phase 1 — Complete)
- **Route**: `/contract-builder` (frontend), `/api/contracts/*` (API)
- **Purpose**: Guided 6-step intake wizard that produces a structured draft payload for freelance and other contracts.
- **Steps**: Type → People → Scope → Money/Timing → Rights/Protection → Review Summary
- **Contract Types**: Freelance Services Agreement (full), NDA (full), Simple Payment Agreement (full), Service Agreement (full), Lease/Rental Agreement (full)
- **AI Insight Panel**: Desktop right-side panel; mobile collapsible drawer. Combines rule-based insights (immediate) with AI-enhanced insights (on step navigation).
- **API Endpoints**:
  - `POST /api/contracts/insight` — returns live AI suggestions, warnings, and draft guidance for the current step
  - `POST /api/contracts/generate-draft` — generates a structured draft payload (5 sections + summary + flags) via `gpt-5.2`
- **Draft Output**: Includes parties, 5 contract sections with clauses, payment summary, protection summary, default clauses, review flags, missing protection warnings, plain-English summary
- **Persistence**: Draft state saved to `localStorage` under `plainpath-contract-draft-latest`
- **Key file**: `artifacts/plainpath/src/pages/ContractBuilder.tsx`, `artifacts/api-server/src/routes/contracts/index.ts`
- **PDF Export**: "Download PDF" button opens a formatted HTML contract in a print dialog via `downloadPDF()` helper
- **Note**: Uses `max_completion_tokens` (not `max_tokens`) for gpt-5.2 compatibility

### Document Trust Check
- **Purpose**: Evaluates documents for potential risks, focusing on scams, predatory terms, and issuer authenticity.
- **Three-Score Model**:
    1.  **Authenticity Risk**: Identifies scam/impersonation signals (0-100).
    2.  **Document Risk**: Assesses contract-term harm potential (0-100).
    3.  **Verification Confidence**: Measures verifiability of issuer identity (0-100).
- **Findings**: Includes structural findings (e.g., generic greetings, domain mismatches, anti-verification instructions) and metadata findings (PDF metadata inspection).
- **Scoring Engine**: Utilizes a sophisticated rule-based and AI-enhanced engine with continuous tuning and validation against various document types and adversarial examples.

### AI Help Assistant (HelpWidget)
- **Purpose**: In-app chat assistant that answers questions about PlainPath features, helping users understand how to use each tool and interpret their results.
- **Access**: Available to all users on every page — no plan restriction, no message limit
- **UI**: Floating chat bubble (bottom-right corner) that expands to a compact chat panel. Includes 4 quick-start suggested questions shown before first message.
- **Tone**: Warm, direct, plain-spoken — redirects legal/financial advice questions to professionals while offering to help with PlainPath features
- **Backend**: `POST /api/help/chat` — accepts `messages[]` array (last 20 messages), system prompt instructs GPT-4o-mini as a PlainPath expert
- **Frontend**: `artifacts/plainpath/src/components/HelpWidget.tsx` — renders inside `Router` in `App.tsx`, above `<Footer />`
- **API Route**: `artifacts/api-server/src/routes/help/index.ts`
- **Model**: `gpt-4o-mini` with `max_completion_tokens: 600`
- **Limits**: Conversation history capped at last 20 messages, each message content capped at 2000 chars server-side

## Shared Product Patterns

### "Check for Gaps & Fill"

A cross-app concept where each product lane scans its own structured output for missing, incomplete, or risky items and surfaces them with clear recommendations before the user finalises or generates anything. The pattern always separates:

- **Actionable gaps** — items the user must review (warning) or should consider (suggestion), with inline quick-fill or a link to the relevant step
- **Auto-added defaults** — neutral legal/structural scaffolding added automatically without user confirmation, displayed in green as reassurance

**Contract Builder** (fully implemented, Phase 1):
- Gaps: no late fee, no kill fee, no client feedback deadline, no revision limit, no governing state, no delivery deadline, no invoice payment window, no termination notice, no deposit, IP transferring before payment
- Quick-fill: inline input for most money/protection/people gaps, "Edit" link for scope-based gaps
- Defaults shown: Severability, Force Majeure, Limitation of Liability, Entire Agreement, Notices
- Key file: `artifacts/plainpath/src/pages/ContractBuilder.tsx` — `computeGaps()` function + `GapRow` component + `ReviewStep` section "Check for Gaps & Fill Recommendations"
- Fill callbacks: `onFillMoney`, `onFillProtection`, `onFillPeople` passed from ContractBuilder into ReviewStep

**Analyze a Document** (planned, Phase 2):
- Gaps will cover: missing required documents, missing action steps, unresolved deadlines, missing supporting information, incomplete process steps
- Will appear in the Analysis Results view before export/share, in a dedicated "Gaps" tab or section

**Document Trust Check** (planned, Phase 2):
- Gaps will cover: missing issuer verification, unverified contact details, missing identifiers (registration numbers, licence IDs), missing authenticity signals, low-confidence findings needing manual review
- Will appear on the Trust Check results page, surfaced alongside the three-score model

**Design rule**: Do NOT silently add major business terms. Auto-add only neutral legal scaffolding. Business-impacting terms must be surfaced as recommendations and require user confirmation or input.

### Hero CTA Cluster

The homepage hero contains three visually uniform CTAs designed as one product-action group:
1. **Analyze a Document** — primary filled button (solid, shadow), trailing arrow icon
2. **Document Trust Check** — outline button, leading ShieldCheck icon
3. **Build a Contract** — outline button, leading PenLine icon

All three share: `h-12 px-8 text-base rounded-xl font-semibold`. The two outline buttons are intentionally identical in className. Do not add special border, hover, or icon coloring overrides to either outline button that the other does not share.

## Pending Integration Connections (not yet authorized)

- **Stripe** (`connector:ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y`): All backend code is built (`/api/stripe/*` routes, billing SQLite DB, webhook handler). Needs `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` env vars — either connect via Replit integration or add secrets manually.
- **Resend** (`connector:ccfg_resend_01K69QKYK789WN202XSE3QS17V`): Email reminder route is built (`/api/reminders/email`). Needs `RESEND_API_KEY` env var — either connect via Replit integration or add secret manually. The `resend` npm package is already installed in `@workspace/api-server`.

## External Dependencies

- **OpenAI**: Utilized via Replit AI Integrations (`gpt-5.2` model) for document analysis and extraction.
- **PostgreSQL**: Database used with Drizzle ORM for data storage.
- **Capacitor**: Framework for building native mobile applications (iOS/Android) from the web codebase.
- **Radix UI**: Unstyled component primitives for building accessible UI.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Framer Motion**: React animation library.
- **`@capawesome/capacitor-file-picker`**: Capacitor plugin for native file selection.
- **`@capacitor/haptics`**: Capacitor plugin for haptic feedback.
- **`@capacitor/status-bar`**: Capacitor plugin for status bar control.
- **Cornell LII (law.cornell.edu) and CFPB**: External sources for legal glossary definitions.