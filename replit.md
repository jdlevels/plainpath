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
- **Starter** ($4.99/month): Unlimited Analyze a Document
- **Pro** ($19.99/month): All 4 tools — Analyze, Trust Check, Contract Builder, Contract Review
- No Team plan (removed)
- Key file: `artifacts/plainpath/src/data/pricingData.ts`

### Payment / Paywall Enforcement
- **Status: DISABLED during build/testing phase**
- Free-limit gating and upgrade prompts are bypassed via `PAYMENT_ENFORCEMENT_ENABLED = false` in `artifacts/plainpath/src/lib/analysisGate.ts`
- **To re-enable:** Set `PAYMENT_ENFORCEMENT_ENABLED = true` in `analysisGate.ts` once Stripe is fully live in production
- All underlying limit/usage/counter logic is preserved and will activate immediately when the flag is flipped
- Free tier limits (when re-enabled): 2 analyses/month, no Pro tools without subscription

### Homepage
- **Hero CTA Cluster**: 4 outline buttons — Analyze a Document (blue), Document Trust Check (red), Build a Contract (green), Fair Deal Check (amber)
- **ToolsShowcase**: 4 tool cards in `md:grid-cols-2 xl:grid-cols-4` grid, heading "Four tools, one platform"
- **StatsBar**, **TestimonialsSection**, **FAQSection**, **PricingSection** all present
- Key file: `artifacts/plainpath/src/pages/Home.tsx`

### Marketing Site — Mobile Waitlist
- **App Store + Play Store badges** appear in the hero download section; clicking opens `WaitlistModal`
- **WaitlistModal** (`artifacts/plainpath-marketing/src/components/WaitlistModal.tsx`): platform selector (iOS / Android / Both) + email capture; on success shows confirmation state
- **API**: `POST /api/waitlist/join` — body `{email, platform, source}` → inserts into SQLite `mobile_waitlist` table; sends Resend confirmation email if `RESEND_API_KEY` set
- **API**: `GET /api/waitlist/count` — returns `{count}`
- **DB**: `artifacts/api-server/data/plainpath-waitlist.sqlite` — `mobile_waitlist` table (email UNIQUE, platform, source, created_at)

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

## PII Redaction Feature (Phase 1 — Shipped)

### Architecture
- **Route**: `/redact` — standalone page + entry point from Import flow
- **Entry**: On Analyze page (paste or upload mode), after text/file is ready, "Redact sensitive info first" secondary button appears
- **Flow**: Import → sessionStorage `pii_redact_input` → `/redact` → review → sessionStorage `pii_analyze_text` → `/analyze` with redacted text pre-loaded

### Server-side
- **`POST /api/documents/detect-pii`** (`artifacts/api-server/src/routes/piiDetection.ts`):
  - Regex pass: email, phone, SSN, EIN/tax ID, credit card, IP address, DOB, routing number, account number, policy ID, case number, license number (with labeled context patterns)
  - OpenAI pass (gpt-4o-mini): names, addresses, member IDs, license numbers, case numbers, other personal identifiers — returns raw value strings, matched back to text for character positions
  - Merges results, removes overlapping spans (longer/higher-priority wins)
  - Returns `{ spans: PiiSpan[] }` with id, type, label, value, start, end, confidence, source

### Client-side
- **`artifacts/plainpath/src/lib/piiTypes.ts`** — PiiType enum, PiiSpan type, PII_TYPE_META (label, category, badge colors, redact label), CATEGORY_ORDER
- **`artifacts/plainpath/src/lib/piiExport.ts`** — `applyRedactions()` (true text replacement), `buildPreviewSegments()` (for live preview), `downloadRedactedText()`, `copyRedactedText()`, `buildRedactionSummary()`
- **`artifacts/plainpath/src/components/PiiReview.tsx`** — full review UI: loading state, grouped detection list, per-item toggle, approve/reject all per category, live preview (black label blocks show what will be replaced), apply → export panel
- **`artifacts/plainpath/src/pages/Redact.tsx`** — standalone route with paste + upload input step; reads from sessionStorage when launched from Analyze flow

### True Redaction Implementation
- **Text/paste**: `applyRedactions()` replaces character spans in the actual string. The original value is gone. Exported `.txt` and clipboard contain only the redacted version.
- **Uploaded files (PDF/DOCX/TXT)**: Phase 1 calls `/api/documents/extract-text`, applies redactions to extracted text, exports as `.txt`. PDF binary modification is Phase 2.
- **No overlay masking**: There are no visual-only black boxes. The text itself is replaced.

### PII Types Detected
Identity: Full names, Dates of birth | Government ID: SSN, Tax ID/EIN, License numbers | Contact: Email addresses, Phone numbers | Financial: Account numbers, Routing numbers, Credit card numbers | Location: Street addresses | Healthcare/Insurance: Policy IDs, Member/Subscriber IDs | Legal: Case/Reference numbers | Technical: IP addresses | Other: General personal identifiers

### Phase 2 Scaffolding (prepared, not built)
- Manual box-select redaction on PDF/image
- "Redact all SSNs" one-click rules
- Redaction audit log
- Document-type redaction templates
- Standalone "Redact a Document" tool card in Home/Navbar

## Post-Launch Roadmap

### E-Signature — "Send for Signature" (Contract Builder, Pro Plan)
- **Status**: UI + API built. Waiting for DROPBOX_SIGN_API_KEY to activate.
- **Approach**: Dropbox Sign REST API (`https://api.hellosign.com/v3/signature_request/send`)
- **UX**: "Send for Signature" button on draft output → modal with two email inputs → signing emails sent
- **Backend**: `POST /api/contracts/send-for-signature` — returns 503 gracefully if key not set
- **Frontend**: `artifacts/plainpath/src/components/SendForSignatureModal.tsx`
- **Env var needed**: `DROPBOX_SIGN_API_KEY` (create account at sign.dropbox.com)

### Stripe Payments — Full Billing Architecture Built (Test Mode)
- **Status**: Full billing foundation built and running in test mode. Waiting for business bank account approval to go live.
- **Env vars needed**: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- **Integration**: `connector:ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y`

**Architecture (all centralized):**
- `artifacts/api-server/src/lib/billingConfig.ts` — Master server billing flags (`BILLING_ENABLED`, `BILLING_MODE`, `PAYWALL_ENFORCEMENT`, `STRIPE_TEST_MODE`)
- `artifacts/api-server/src/lib/billingProvider.ts` — Provider abstraction (stripe active; storekit + play_billing placeholders for native)
- `artifacts/api-server/src/lib/planEntitlements.ts` — `PLAN_ENTITLEMENTS` (starter/pro only), `TOOL_ACCESS` map, `canAccessTool()`, `normalizePlan()`. Prices: Starter=$4.99 (499¢), Pro=$19.99 (1999¢)
- `artifacts/api-server/src/lib/billingDb.ts` — SQLite billing DB (`plainpath-billing.sqlite`). Schema includes `billingMode` + `billingProvider` columns
- `artifacts/api-server/src/lib/usageDb.ts` — Per-tool usage tracking (`tool_usage` table: email × tool × monthKey)
- `artifacts/api-server/src/routes/stripe.ts` — Checkout, billing portal, subscriber-status, webhook (handles: checkout.session.completed, subscription.created/updated/deleted, invoice.paid, invoice.payment_failed)
- `artifacts/api-server/src/routes/entitlements.ts` — `/status`, `/consume` (all tools), `/consume-analysis` (legacy)
- `artifacts/plainpath/src/lib/billingConfig.ts` — Client-side mirror of billing flags
- `artifacts/plainpath/src/lib/analysisGate.ts` — Always tracks usage (fire-and-forget server call); gates bypass when `PAYWALL_ENFORCEMENT=false`
- `artifacts/plainpath/src/lib/entitlements.ts` — `fetchEntitlements()`, `consumeToolUsage()`, `openBillingPortal()`
- `artifacts/plainpath/src/pages/Billing.tsx` — `/billing` route: current plan, tool access grid, restore subscription, upgrade CTA, test-mode notice

**To go live (activation checklist):**
1. Add `STRIPE_SECRET_KEY=sk_live_...` and `STRIPE_WEBHOOK_SECRET=whsec_live_...` to environment
2. In `artifacts/api-server/src/lib/billingConfig.ts`: set `BILLING_MODE = "live"`, `STRIPE_TEST_MODE = false`, `BILLING_ENABLED = true`
3. In `artifacts/api-server/src/lib/billingConfig.ts`: set `PAYWALL_ENFORCEMENT = true`
4. Mirror the same flags in `artifacts/plainpath/src/lib/billingConfig.ts`
5. Remove test-mode notice from `artifacts/plainpath/src/pages/Billing.tsx`
6. Register Stripe webhook at `https://plainpathapp.com/api/stripe/webhook` in Stripe Dashboard

### Native Billing — RevenueCat Architecture (Built, Not Yet Activated)

**Status**: Full native billing abstraction layer built. Waiting for:
- RevenueCat account creation
- App Store Connect and Google Play Console products created
- Capacitor SDK installed

**Architecture files:**
- `artifacts/api-server/src/lib/nativeBillingConfig.ts` — RevenueCat product IDs for iOS + Android, entitlement ID mappings, `resolvePlanFromRCEntitlements()`, `getRevenueCatApiKey()`
- `artifacts/api-server/src/routes/nativeEntitlements.ts` — `POST /api/entitlements/native-verify`: verifies RC purchase with RevenueCat REST API, syncs to billing DB. Returns 503 until RC keys set.
- `artifacts/plainpath/src/lib/nativeBilling.ts` — Client-side: `configureRevenueCat()`, `checkNativeEntitlements()`, `purchaseNativePlan()`, `restoreNativePurchases()`. All are platform-aware (no-op on web). All stubbed until RC SDK installed.

**Product IDs (both iOS and Android use same IDs):**
- Starter: `plainpath_starter_monthly` ($4.99/month)
- Pro: `plainpath_pro_monthly` ($19.99/month)

**RevenueCat Entitlement IDs:** `starter` | `pro` (must match RC dashboard exactly)

**To activate native billing (iOS):**
1. Create RevenueCat account → Create Project "PlainPath" → Add iOS app (Bundle ID: `com.plainpath.app`)
2. Create products in App Store Connect: `plainpath_starter_monthly` ($4.99) + `plainpath_pro_monthly` ($19.99), type: Auto-Renewable Subscription, group: "PlainPath"
3. In RevenueCat dashboard: create Entitlements `starter` and `pro`, map products
4. Set `REVENUECAT_API_KEY_IOS` (secret key) in environment; set `VITE_REVENUECAT_PUBLIC_KEY_IOS` for client
5. Install SDK: `pnpm --filter @workspace/plainpath add @revenuecat/purchases-capacitor`
6. Uncomment all `// TODO: ACTIVATE` blocks in `nativeBilling.ts` and `nativeEntitlements.ts`
7. Call `configureRevenueCat()` in native app init (App.tsx initStatusBar block)
8. Wire `purchaseNativePlan()` into `Billing.tsx` upgrade CTA when `isNative() === true`
9. Wire `restoreNativePurchases()` into `Billing.tsx` restore button when `isNative() === true`
10. In `billingProvider.ts`: set `storekit.active = true`, `storekit.testMode = false`

**To activate native billing (Android):**
- Same as iOS but: RevenueCat Android app, `REVENUECAT_API_KEY_ANDROID`, Google Play Console products, `billingProvider.play_billing.active = true`

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
