# PlainPath

## Overview

PlainPath is a full-stack commercial multi-platform product (Web, iPhone, Android) turning confusing paperwork into structured action plans. Stack: React + Vite, Express 5, PostgreSQL, OpenAI. Live at **https://plainpathapp.com/**.

## Routing Architecture

- `https://plainpathapp.com/` → Marketing site (artifact: `plainpath-marketing`, BASE_PATH="/")
- `https://plainpathapp.com/app/` → PlainPath web app (artifact: `plainpath`, BASE_PATH="/app/")
- `https://plainpathapp.com/api/*` → Express API server (artifact: `api-server`)

**App clean URLs (all under `/app/`):**
- `/app/analyze` → Analyze a Document entry (redirects to `/import` if no context)
- `/app/trust-check` → Document Trust Check
- `/app/review` → Contract Review (alias for `/contract-review`)
- `/app/build` → Build a Contract (alias for `/contract-builder`)

**CRITICAL:** Do NOT swap the artifact `previewPath` values. Marketing must stay at `/`, app at `/app/`.

## User Preferences

I want iterative development.
Ask before making major changes.
Do not make changes to the folder `lib/api-spec`.
Do not make changes to the file `artifacts/plainpath/src/lib/legalGlossary.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/trustCheckDemoData.ts`.
Do not make changes to the file `artifacts/api-server/src/lib/demoData.ts`.
Do not make changes to the file `artifacts/plainpath/APP_STORE_METADATA.md`.

## System Architecture

PlainPath is a monorepo using pnpm workspaces.

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

### Core Features (Built)

**Four tools, one platform:**

1. **Analyze a Document** (`/import` → `/analyze`)
   - Supports text paste, PDF/Word file upload, and multi-page camera scan (mobile)
   - AI (`gpt-5.2`) extracts action steps, deadlines, risks, key terms, plain-English summaries
   - 10-tab results view, interactive checklist, "Explain This Section", source evidence tooltips
   - Export: print/PDF, copy text, download .txt, Web Share API, shareable links (PostgreSQL)
   - Deadline reminders: browser push notifications + email (Resend-powered when RESEND_API_KEY set)
   - Key files: `artifacts/plainpath/src/pages/Import.tsx`, `artifacts/plainpath/src/pages/Analyze.tsx`

2. **Document Trust Check** (`/import?mode=trust-check` → `/trust-check`)
   - Three-score model: Authenticity Risk, Document Risk, Verification Confidence
   - Structural + metadata findings, scam pattern detection
   - Key file: `artifacts/api-server/src/routes/documents/index.ts`

3. **Contract Builder** (`/contract-builder`)
   - 6-step guided intake wizard: Type → People → Scope → Money → Rights → Review
   - Contract types: Freelance, NDA, Payment Agreement, Service Agreement, Lease
   - AI Insight Panel (desktop right-side, mobile drawer)
   - Gap analysis + quick-fill in Review step
   - Generates structured draft with 5 sections, payment summary, protection summary, default clauses
   - "Download PDF" opens formatted contract in print dialog
   - **"Send for Signature"** button on draft output — opens SendForSignatureModal (Dropbox Sign)
   - Key files: `artifacts/plainpath/src/pages/ContractBuilder.tsx`, `artifacts/plainpath/src/components/SendForSignatureModal.tsx`, `artifacts/api-server/src/routes/contracts/index.ts`
   - API endpoints: `POST /api/contracts/insight`, `POST /api/contracts/generate-draft`, `POST /api/contracts/send-for-signature`, `POST /api/contracts/review`

4. **Fair Deal Check** (`/contract-review`) — NEW
   - Clause-by-clause fairness review of a contract the user received (not built themselves)
   - Input: paste text or upload PDF/Word file
   - AI reviews every clause → rates Fair / Watch Out / Red Flag
   - For each flagged clause: plain-English explanation, why it's unfair, copyable negotiation language, exit guidance
   - Overall Fairness Score (0–100) + verdict label
   - Key file: `artifacts/plainpath/src/pages/ContractReview.tsx`
   - API: `POST /api/contracts/review` (accepts JSON `{text}` or multipart file)

**AI Help Assistant (HelpWidget)**
- Floating chat bubble (all pages), GPT-4o-mini, page context injection
- Key files: `artifacts/plainpath/src/components/HelpWidget.tsx`, `artifacts/api-server/src/routes/help/index.ts`

**Camera Scan (Mobile)**
- "Scan" tab on Import page (sm:hidden on desktop), up to 10 pages
- API: `POST /api/documents/scan-images` (standard analysis), `POST /api/documents/scan-images-trust` (trust check)

### Pricing Tiers
- **Starter** ($4.99/month): Analyze a Document only
- **Pro** ($24.99/month): All 4 tools — Analyze, Trust Check, Contract Builder, Fair Deal Check
- **Team** ($49.99/month): Pro + team features (planned)
- Key file: `artifacts/plainpath/src/data/pricingData.ts`

### Homepage
- **Hero CTA Cluster**: 4 outline buttons — Analyze a Document (blue), Document Trust Check (red), Build a Contract (green), Fair Deal Check (amber)
- **ToolsShowcase**: 4 tool cards in `md:grid-cols-2 xl:grid-cols-4` grid, heading "Four tools, one platform"
- **StatsBar**, **TestimonialsSection**, **FAQSection**, **PricingSection** all present
- Key file: `artifacts/plainpath/src/pages/Home.tsx`

### Authentication (Clerk)
- **Provider**: Clerk (via Replit integration — keys auto-provisioned, no separate Clerk account needed)
- **Methods**: Google OAuth + email/password
- **Sign-in page**: `/sign-in` — clean centered card with "Continue with Google" + email field
- **Sign-up page**: `/sign-up`
- **Navbar**: Shows "Sign in" button when logged out; shows user initials + dropdown (with Sign out) when logged in
- **ClerkProvider** wraps app inside `<WouterRouter>` in `App.tsx`
- **Server**: `clerkMiddleware()` and `clerkProxyMiddleware` mounted in `artifacts/api-server/src/app.ts`
- **Env vars**: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` (auto-provisioned)
- **Vite**: `vite.config.ts` uses `define` to forward `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PROXY_URL` to the client

### Key Technical Notes
- Use `max_completion_tokens` (not `max_tokens`) for gpt-5.2 and gpt-5.2 compatibility
- DB pattern: always `import { pool } from "@workspace/db"` — never import pg directly
- pdf-parse must be dynamically imported (`await import("pdf-parse")`) to avoid startup crash
- React Hooks rule: all useState/useEffect must be BEFORE any early returns
- `isNative` import: must come from `@/lib/platform`, NOT `@/lib/native`
- Plan limits: Free=2 analyses; Starter=unlimited analyses; Pro=all 4 tools

## Shared Product Patterns

### "Check for Gaps & Fill"
- **Contract Builder**: fully implemented — gap warnings, quick-fill, auto-added defaults
- **Analyze a Document**: planned Phase 2
- **Document Trust Check**: planned Phase 2
- **Design rule**: Do NOT silently add major business terms. Auto-add only neutral legal scaffolding.

## Pre-Launch Improvements (Completed)

- **API Rate Limiting**: `express-rate-limit` added; general 200 req/15 min, AI endpoints 20 req/15 min (skipped in dev). Covers `/api/documents/analyze`, `/api/documents/trust-check*`, `/api/contracts/draft`, `/api/contracts/review`, scan-images, explain-section.
- **Analytics Baseline**: `artifacts/plainpath/src/lib/analytics.ts` — `trackEvent()` via `navigator.sendBeacon`. API endpoint `POST /api/events` logs events via pino. Infrastructure ready for wiring key actions.
- **Per-page Error Boundary**: `<ErrorBoundary>` wraps the `<Switch>` block in `App.tsx` — Navbar and Footer stay alive during page crashes.
- **First-run Nudge**: Dismissible banner on `/import` for first-time visitors (`plainpath-visited` localStorage key). Points to built-in demos.
- **Usage Indicator**: Shows "X of 2 free analyses used" pill on `/import` for free users who have already run an analysis.
- **Trust Check Demo Shortcuts**: Empty state on `/trust-check` now shows 3 demo chips (Fake Utility Shutoff, Fake IRS Letter, Legitimate Utility Notice) below the main CTA.
- **OG / Social Meta Tags**: `index.html` now has full `og:*` and `twitter:*` meta tags for rich social sharing previews.
- **Share Confirmation**: Already implemented — `copiedLink` state shows "Copied!" with a check icon inside the Export dropdown.

## Competitive Improvements (Shipped)

### T001: Savings Framing
- Analyze sticky header now shows "Saved you $X–Y vs. an attorney" for matched doc types
- Helper `getAttorneyCostEstimate(docType)` maps document types to attorney cost ranges
- Shown on sm+ screens only to avoid mobile header clutter

### T002: Attorney-Reviewed Badge
- Small "Methodology reviewed by licensed attorneys → /methodology" link in Analyze results
- Same badge in TrustCheck footer
- `/methodology` page explains 5-step analysis process: extraction, AI analysis, trust check model, contract fairness model, attorney review

### T003: Audit Trail Download
- Export dropdown in Analyze now includes "Download audit trail"
- Creates timestamped .txt with doc hash, findings counts, confidence level, PlainPath attribution

### T004: Email Capture
- Existing `/api/reminders/email` flow covers email collection (Resend-powered)

### T005: Referral Program
- `artifacts/plainpath/src/lib/referral.ts`: `getReferralCode()`, `getReferralLink()`, `captureInboundRef()`
- `ReferralBand` component on Home.tsx (between pricing and FAQ)
- Inbound `?ref=` params captured in localStorage on app init

### T006: Negotiation Letter Generator
- "Draft negotiation email" button on every Red Flag and Watch Out clause in Contract Review
- Calls `POST /api/contracts/negotiate-clause` → GPT-4o-mini generates polished negotiation email body
- Email shown in copyable violet card within ClauseCard

### T007: Document Version Comparison
- New tool at `/compare`: paste two versions of any document
- `POST /api/documents/compare` endpoint → GPT JSON response with typed change list
- Change types: added, removed, modified, risk-increased, risk-decreased; each with high/medium/low significance

### T008: Dropbox Import
- "Import from Dropbox" button in the file upload tab on Import page
- Uses Dropbox Chooser JavaScript SDK (loaded dynamically, no API key required)
- Downloads chosen file and feeds it into existing file processing pipeline

### T009: SEO Guide Pages
- `/guides/irs-letter` — How to read an IRS letter
- `/guides/lease-agreement` — What to check in a lease before signing
- `/guides/job-offer-red-flags` — Job offer red flags
- `/guides/scam-notice` — How to identify a scam document
- All routes registered in App.tsx

## Post-Launch Roadmap

### E-Signature — "Send for Signature" (Contract Builder, Pro Plan)
- **Status**: UI + API built. Waiting for DROPBOX_SIGN_API_KEY to activate.
- **Approach**: Dropbox Sign REST API (`https://api.hellosign.com/v3/signature_request/send`)
- **UX**: "Send for Signature" button on draft output → modal with two email inputs → signing emails sent
- **Backend**: `POST /api/contracts/send-for-signature` — returns 503 gracefully if key not set
- **Frontend**: `artifacts/plainpath/src/components/SendForSignatureModal.tsx`
- **Env var needed**: `DROPBOX_SIGN_API_KEY` (create account at sign.dropbox.com)

### Stripe Payments
- **Status**: All backend code built (`/api/stripe/*` routes, billing DB, webhook handler). Waiting for Friday (developer accounts).
- **Env vars needed**: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- **Integration**: `connector:ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y`

### Resend Email Reminders
- **Status**: Route built (`POST /api/reminders/email`). Gracefully returns 503 until key set.
- **Env var needed**: `RESEND_API_KEY`
- **Integration**: `connector:ccfg_resend_01K69QKYK789WN202XSE3QS17V`

## External Dependencies

- **OpenAI**: Utilized via Replit AI Integrations (`gpt-5.2` for analysis/contracts, `gpt-4o-mini` for HelpWidget)
- **PostgreSQL**: Database used with Drizzle ORM for data storage and shareable links
- **Capacitor**: Framework for building native mobile applications (iOS/Android)
- **Radix UI**: Unstyled component primitives for building accessible UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Framer Motion**: React animation library
- **`@capawesome/capacitor-file-picker`**: Capacitor plugin for native file selection
- **`@capacitor/haptics`**: Capacitor plugin for haptic feedback
- **`@capacitor/status-bar`**: Capacitor plugin for status bar control
- **Cornell LII (law.cornell.edu) and CFPB**: External sources for legal glossary definitions
