# PlainPath — Architecture Blueprint
**Version:** 1.0  
**Last updated:** May 7, 2026  
**Status:** Launch-locked — two-tool scope only

---

## 1. Problem Statement

Most people encounter confusing paperwork at the worst possible moments — an IRS notice they don't understand, a lease with buried obligations, a contract handed to them the day before signing. Hiring a lawyer to read every document is out of reach for most households. Ignoring the paperwork is the default, and the default is dangerous.

PlainPath solves this by reading the document for you, in plain English, and telling you exactly what to do — the steps, the deadlines, the risks, and what to watch out for. It is not a search engine. It is not a document storage service. It is a structured action engine.

---

## 2. Target User

**Primary:** Individual adults in the US who regularly receive documents they don't fully understand — leases, contracts, government notices, insurance EOBs, HOA correspondence, and grant applications.

**Demographics:**
- Age 25–55
- Not legally trained; no professional advisors on call
- May be bilingual but reads English
- Uses both mobile (iOS) and desktop (web)

**Secondary:** Small business owners and freelancers who sign contracts without professional review.

**Not the target user:**
- Enterprise legal teams
- Law firms or paralegals
- Users who need document storage or case management

---

## 3. Primary User Outcome

> "I uploaded a confusing document and PlainPath told me exactly what I need to do, what deadlines I have, what risks I'm facing, and whether the contract I'm about to sign is fair — all in plain English, in under two minutes."

---

## 4. MVP Scope (v1.0 — Launch-Locked)

### Live tools (v1.0 only)
1. **Analyze a Document** — Upload PDF/DOCX/TXT or paste text. Receive a structured action plan: prioritized steps, required documents, key deadlines, risks by severity, and plain-English explanations. Saved to My Analyses.
2. **Contract Review** — Paste or upload a contract. Receive a clause-by-clause review: Watch-Out / Fair labels, overall fairness score, missing protections, negotiation language, and a pre-signing checklist.

### Supporting capabilities (v1.0)
- Saved analysis history (My Analyses)
- Shareable analysis links (30-day expiry)
- Document demo (pre-loaded sample docs, no upload required)
- Deadline email reminders via Resend
- Free tier with usage metering (limited analyses per month)
- PlainPath Pro subscription at $19.99/month (Stripe)
- Clerk authentication (email + OAuth)
- Static guide pages (IRS letter, lease, job offer, eviction, medical billing, non-compete, NDA)
- Native iOS/Android app shell (web-based via Capacitor/similar)
- Marketing site at separate artifact (`plainpath-marketing`)

---

## 5. Out-of-Scope List (Post-Launch Only)

The following features are explicitly excluded from v1.0 and must not be unlocked without completing the post-launch gate criteria defined in `plainpath-post-launch-roadmap.md`.

| Feature | Status |
|---|---|
| Clause Extractor | Hidden — post-launch |
| Compare Versions | Hidden — post-launch |
| Document Trust Check | Hidden — post-launch |
| Redact Sensitive Info | Hidden — post-launch |
| Ask This Document | Hidden — post-launch |
| Contract Builder | Hidden — post-launch |
| Completion Engine Phase 3 | Not built |
| Document Packet Compiler | Not built |
| Team plans / multi-seat billing | Not at launch |
| In-app payments (native IAP) | Not at launch |
| Real-time collaboration | Not planned |
| Document storage (file retention) | Not planned |

---

## 6. Main User Workflow

### Analyze a Document

```
User → Upload or paste document
     → Import screen (/app/analyze)
     → Format detection (PDF → text extraction via pdf-parse / pdfjs)
     → PII scan offered if enabled
     → POST /api/documents/analyze
     → API: auth check → entitlement check → OpenAI prompt → structured JSON response
     → Results rendered in tabbed UI: Plain English / Source Sections / Overview / Requirements
     → User saves → POST /api/documents/history (saves analysis output, not document)
     → User shares → POST /api/shares (generates token, 30-day TTL)
```

### Contract Review

```
User → Paste or upload contract
     → Contract Review screen (/app/contract-review)
     → POST /api/contracts/review
     → API: auth check → entitlement check → OpenAI prompt → structured JSON response
     → Results: Fairness Score, clause cards (Watch-Out / Fair), Before You Sign checklist,
       Balanced Clauses, Missing Protections, Negotiation Language
     → User saves or shares (same path as Analyze)
```

### Subscription

```
User → Hits usage limit or Pro-gated feature
     → Upgrade modal or Upgrade page (/app/subscribe)
     → POST /api/stripe/create-checkout-session → Stripe hosted checkout
     → Stripe webhook → POST /stripe-webhook → writes subscriber record to DB
     → User redirected to /subscribe/success → Clerk session refreshed
     → Plan gate re-resolves to "pro"
```

---

## 7. Internal System Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  Client (React/Vite)                                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Import /   │  │  Contract    │  │  Results /        │  │
│  │  Analyze    │  │  Review      │  │  My Analyses      │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                │                    │             │
│  ┌──────▼────────────────▼────────────────────▼──────────┐ │
│  │  Clerk (auth) + EntitlementContext + UsageMeter        │ │
│  └──────────────────────────┬────────────────────────────┘ │
└─────────────────────────────│────────────────────────────────┘
                              │ HTTPS (proxied)
┌─────────────────────────────▼────────────────────────────────┐
│  API Server (Express / Node.js)                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Clerk middleware (auth)                             │    │
│  │  requireEntitlement(tool) middleware                 │    │
│  │  resolvePlan() → DB lookup (Stripe subscriber table) │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                             │                                 │
│  ┌──────────────────────────▼───────────────────────────┐    │
│  │  Tool Handlers                                       │    │
│  │  POST /api/documents/analyze                         │    │
│  │  POST /api/contracts/review                          │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                             │                                 │
│  ┌──────────────────────────▼───────────────────────────┐    │
│  │  OpenAI API (chat completions, structured JSON)      │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                             │                                 │
│  ┌──────────────────────────▼───────────────────────────┐    │
│  │  PostgreSQL (Neon)                                   │    │
│  │  subscribers · user_analyses · shares                │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│  Third-party services                                        │
│  Clerk (auth/session) · Stripe (billing) · Resend (email)   │
│  Object Storage (PDF utilities — Replit bucket)              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Required Engines

| Engine | Purpose | Status |
|---|---|---|
| Document Analysis Engine | Parses uploaded text → OpenAI prompt → structured action plan JSON | Live (v1.0) |
| Contract Review Engine | Clause-by-clause contract analysis → fairness score + clause cards | Live (v1.0) |
| PDF Extraction Worker | Converts PDF binary to plain text for analysis (pdf-parse / pdfjs) | Live (v1.0) |
| Usage Meter | Tracks monthly free-tier analyses in browser localStorage | Live (v1.0) |
| Plan Resolution Engine | Server-side: Clerk userId → Stripe → PlanKey ("free" / "pro") | Live (v1.0) |
| Share Engine | Generates token-based shareable links with 30-day TTL | Live (v1.0) |
| Completion Engine (Phase 1–2) | Action pack post-processing / checklist generation | Live (v1.0) |
| Completion Engine (Phase 3) | Full completion workflow (multi-step guided filing) | Post-launch |
| Clause Extractor Engine | Clause-level extraction and classification | Hidden — post-launch |
| Compare Versions Engine | Diff-based document version comparison | Hidden — post-launch |
| Trust Check Engine | Fraud/scam indicator scoring | Hidden — post-launch |
| PII Detection Engine | Named-entity PII detection across 14 categories | Hidden — post-launch |
| Document Builder Engine | Guided contract generation wizard | Hidden — post-launch |

---

## 9. Required Modules and Services

### Client modules (`artifacts/plainpath/src/`)
| Module | Purpose |
|---|---|
| `context/AnalysisContext.tsx` | Global analysis state (current result, loading, error) |
| `context/EntitlementContext.tsx` | Fetches /api/entitlements/status; provides plan/tool access to all components |
| `hooks/useEntitlements.ts` | Hook wrapper; provides `canRunAnalyze`, `canRunContractReview`, getToken with timeout |
| `lib/planEntitlements.ts` | Client-side TOOL_ACCESS map and plan definitions |
| `lib/usageMeter.ts` | Browser localStorage usage tracking for free tier |
| `lib/api.ts` | Typed API fetch wrapper with base URL resolution |
| `lib/analysisGate.ts` | Pre-flight check before API call (auth + plan + usage) |
| `lib/exportAnalysis.ts` | PDF/text export of analysis results |
| `data/pricingData.ts` | Single source of truth for plan copy, prices, and feature lists |
| `components/PlanGate.tsx` | Wraps protected routes; redirects unauthenticated users |
| `components/UpgradeModal.tsx` | Paywall modal with upgrade CTA |

### API server modules (`artifacts/api-server/src/`)
| Module | Purpose |
|---|---|
| `lib/resolvePlan.ts` | Single source of truth for server-side plan resolution |
| `lib/requireEntitlement.ts` | Express middleware: auth + entitlement enforcement |
| `lib/planEntitlements.ts` | Server-side TOOL_ACCESS, PlanKey types, feature flags |
| `lib/billingConfig.ts` | PAYWALL_ENFORCEMENT flag, BILLING_MODE (test/live) |
| `lib/stripe.ts` | Stripe checkout session and webhook handlers |
| `routes/documents.ts` | POST /api/documents/analyze, GET /api/documents/demo/:id |
| `routes/contracts.ts` | POST /api/contracts/review |
| `routes/entitlements.ts` | GET /api/entitlements/status, POST /api/entitlements/consume |
| `routes/userHistory.ts` | GET/POST/DELETE /api/documents/history |
| `routes/shares.ts` | POST /api/shares, GET /api/shares/:token |

### External services
| Service | Purpose | Auth method |
|---|---|---|
| Clerk | User auth, session management, Clerk publicMetadata for role/accessTier | Clerk publishable + secret keys |
| Stripe | Subscription billing, webhook event processing | Stripe secret key + webhook secret |
| OpenAI | GPT-4o for document analysis and contract review | API key (server-side only) |
| Resend | Deadline reminder email delivery | API key |
| Neon PostgreSQL | Subscribers, analyses, shares, usage, team records | DATABASE_URL |
| Replit Object Storage | PDF file handling for redaction utilities (post-launch path) | Bucket credentials |

---

## 10. Data Models

### `subscribers`
| Field | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `clerk_user_id` | TEXT UNIQUE | Clerk userId |
| `email` | TEXT | Subscriber email |
| `stripe_customer_id` | TEXT | Stripe customer object |
| `stripe_subscription_id` | TEXT | Active subscription ID |
| `plan` | TEXT | "pro" (only active plan at launch) |
| `status` | TEXT | "active" \| "canceled" \| "past_due" |
| `current_period_end` | TIMESTAMPTZ | Next renewal or cancellation date |
| `cancel_at_period_end` | BOOLEAN | Scheduled cancellation flag |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `user_analyses`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `clerk_user_id` | TEXT | Owner |
| `tool` | TEXT | "analyze" \| "contract-review" |
| `title` | TEXT | Document title or auto-generated |
| `result_json` | JSONB | Full structured analysis output |
| `created_at` | TIMESTAMPTZ | |

### `shares`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `token` | TEXT UNIQUE | URL-safe random token |
| `clerk_user_id` | TEXT | Owner |
| `tool` | TEXT | "analyze" \| "contract-review" |
| `result_json` | JSONB | Analysis snapshot (no document text) |
| `expires_at` | TIMESTAMPTZ | Now + 30 days |
| `created_at` | TIMESTAMPTZ | |

### `tool_usage`
| Field | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `clerk_user_id` | TEXT | |
| `tool` | TEXT | Tool key |
| `month_key` | TEXT | "YYYY-MM" |
| `count` | INTEGER | Analyses run in this month |

---

## 11. API Routes

### Live — v1.0

| Method | Path | Auth | Plan | Purpose |
|---|---|---|---|---|
| `POST` | `/api/documents/analyze` | Required | pro | Run document analysis via OpenAI |
| `GET` | `/api/documents/demo/:id` | None | None | Fetch pre-loaded demo document |
| `POST` | `/api/contracts/review` | Required | pro | Run contract review via OpenAI |
| `GET` | `/api/entitlements/status` | Required | None | Get user plan, tool access, usage |
| `POST` | `/api/entitlements/consume` | Required | None | Record tool usage for metering |
| `GET` | `/api/documents/history` | Required | pro | List saved analyses |
| `POST` | `/api/documents/history` | Required | pro | Save analysis result |
| `DELETE` | `/api/documents/history/:id` | Required | pro | Delete a saved analysis |
| `POST` | `/api/shares` | Required | pro | Create shareable link |
| `GET` | `/api/shares/:token` | None | None | Fetch shared analysis |
| `POST` | `/api/stripe/create-checkout-session` | Required | None | Start Stripe checkout |
| `POST` | `/api/stripe/create-portal-session` | Required | None | Open billing portal |
| `POST` | `/stripe-webhook` | Stripe signature | None | Handle Stripe webhook events |
| `POST` | `/api/reminders` | Required | None | Schedule deadline email reminder |
| `GET` | `/api/health` | None | None | Health check |

### Hidden — post-launch only
Routes exist in the codebase but all require auth + a plan entitlement that is not currently granted to any non-admin user:

- `POST /api/clause-extractor/*`
- `POST /api/compare-versions/*`
- `POST /api/trust-check`
- `POST /api/pii/*` (redaction)
- `POST /api/builder/*`
- `POST /api/ask-document`

---

## 12. UI Screens and Components

### Public screens (no auth required)
| Route | Component | Purpose |
|---|---|---|
| `/sign-in` | Clerk `<SignIn>` | Authentication |
| `/privacy` | `Privacy.tsx` | Privacy policy |
| `/terms` | `Terms.tsx` | Terms of service |
| `/support` | `Support.tsx` | Support page |
| `/methodology` | `Methodology.tsx` | How PlainPath works |
| `/shared/:token` | `SharedAnalysis.tsx` | View a shared analysis |
| `/demo/:id` | `DemoResult.tsx` | Public demo results |
| `/subscribe` | `Subscribe.tsx` | Subscription / paywall |
| `/guides/*` | Guide pages | SEO content pages |

### Protected screens (auth required)
| Route | Component | Purpose |
|---|---|---|
| `/` | `Home.tsx` | Dashboard — two tool cards |
| `/analyze` | `Import.tsx` | Document upload / paste |
| `/results` | `Analyze.tsx` | Analysis result viewer |
| `/contract-review` | `ContractReview.tsx` | Contract review form + results |
| `/my-analyses` | `MyAnalyses.tsx` | Saved analysis history |
| `/billing` | `Billing.tsx` | Plan status, usage, manage subscription |
| `/upgrade` | `Upgrade.tsx` | Upgrade page / plan comparison |

### Core shared components
| Component | Purpose |
|---|---|
| `Navbar.tsx` | Top navigation — sign in, plan status, user menu |
| `PlanGate.tsx` | Auth enforcement wrapper (redirects to sign-in) |
| `UpgradeModal.tsx` | Paywall modal shown when limit hit |
| `PricingSection.tsx` | Plan cards rendered on Subscribe / marketing site |
| `FirstRunOnboarding.tsx` | First-login tool chooser (Analyze vs Contract Review) |
| `RequireActiveSubscription.tsx` | Plan tier enforcement |
| `AnalysisContext.tsx` | Global state for current analysis result |
| `EntitlementContext.tsx` | Global plan/tool access state |

---

## 13. Permissions and Policy Layer

### Identity model
```
role        = "admin" | "member"         (internal privilege — NOT billing)
accessTier  = "free" | "pro"             (product entitlement — billing-driven)
```

### Plan-to-tool access matrix
| Plan | Analyze | Contract Review | All hidden tools |
|---|---|---|---|
| `free` | ✗ | ✗ | ✗ |
| `pro` | ✅ | ✅ | ✗ |
| `admin` | ✅ | ✅ | routes exist but UI hidden |

### Server enforcement (always active)
1. `getAuth(req)` → 401 if no valid Clerk session
2. `requireEntitlement(tool)` middleware → 403 if plan does not include tool (when `PAYWALL_ENFORCEMENT=true`)
3. Plan resolution: ADMIN_EMAILS env → MANUAL_PRO_EMAILS env → Stripe subscriber record → default "free"

### Client enforcement (defense-in-depth)
1. `PlanGate` component wraps all protected routes → redirects to sign-in if not authenticated
2. `EntitlementContext` fetches `/api/entitlements/status` on mount → provides `canRunAnalyze`, `canRunContractReview`
3. `analysisGate.ts` pre-flight check before every API call → `UpgradeModal` if limit reached
4. `UsageMeter` in localStorage for free-tier tracking

### Hidden tool enforcement
- Hidden tool routes (`/app/trust-check`, `/app/clause-extractor`, etc.) redirect to `/` at the router level
- Dashboard `TOOLS` array contains only Analyze + Contract Review — no cards rendered for hidden tools
- Marketing site `ToolsShowcase` contains only Analyze + Contract Review — no hidden tool marketing claims
- Demo routes for hidden tools (`/demo/trust-check`, etc.) redirect to `/demo`
- `UpgradeModal` paywall reasons for hidden tools cannot be triggered via any dashboard user flow

---

## 14. Guardrails

| Guardrail | Implementation |
|---|---|
| No document retention | Uploaded files processed in memory only; never written to disk or DB |
| No prompt injection | Document text passed as user content, not injected into system prompt |
| OpenAI key server-side only | Key never sent to client; all AI calls go through API server |
| Paywall enforcement flag | `BILLING_CONFIG.PAYWALL_ENFORCEMENT` — can be toggled without deploy |
| Hidden tool UI lockout | Dashboard TOOLS array is the single source of truth for visible tools |
| Hidden tool route redirect | All hidden tool paths redirect to `/` in `App.tsx` |
| Test-only bypass flags | `window.__PLAYWRIGHT_E2E__`, `window.__PLAYWRIGHT_BYPASS_PAYWALL__` only active via Playwright `addInitScript` — undefined in all real browser sessions |
| Admin bypass | ADMIN_EMAILS env var grants pro access without Stripe — never exposes hidden tools to regular users |
| Clerk publicMetadata authority | accessTier stored in Clerk publicMetadata — not in unsafeMetadata or localStorage |

---

## 15. QA Plan

See `docs/plainpath-qa-strategy.md` for full detail.

### Summary
- **Framework:** Playwright (E2E, browser-based)
- **Test runner:** Node.js, `pnpm exec playwright test`
- **Current baseline:** 102 tests across 6 suites — all passing
- **Sharding:** Required for suites >15 tests (OOM risk in sandbox)
- **No live AI calls in tests:** All AI responses mocked or fixture-injected
- **No real Clerk auth in tests:** Replaced with `clerk-mock.js` via `addInitScript`

---

## 16. Build Roadmap by Phase

See `docs/plainpath-post-launch-roadmap.md` for full detail.

| Phase | Name | Scope |
|---|---|---|
| v1.0 | **Launch** | Analyze + Contract Review — live now |
| v1.1 | **Trust Check** | Document authenticity scoring |
| v1.2 | **Redact** | PII detection and redaction |
| v1.3 | **Clause Extractor** | Clause-level extraction with Q&A guidance |
| v1.4 | **Compare Versions** | Document diff and change analysis |
| v1.5 | **Ask This Document** | Conversational document Q&A |
| v2.0 | **Builder + Packet Compiler** | Contract generation + multi-document filing |

Each phase requires: post-launch gate review, customer usage data, E2E coverage, marketing copy update, pricing review.

---

## 17. First Implementation / Launch-Lock Checklist

- [x] Analyze a Document — live and E2E tested
- [x] Contract Review — live and E2E tested
- [x] Free tier usage metering — active
- [x] PlainPath Pro plan ($19.99/month) — Stripe integration live
- [x] Clerk authentication — email + OAuth
- [x] Saved analysis history (My Analyses)
- [x] Shareable analysis links
- [x] Document demo (pre-loaded samples)
- [x] Deadline email reminders
- [x] Static guide pages (7 guides)
- [x] Marketing site — plainpath-marketing artifact
- [x] Privacy policy — two-tool scope, future tools labeled "coming in future updates"
- [x] Terms of service — published
- [x] App Store metadata — two-tool description only
- [x] Hidden tools confirmed hidden (dashboard, pricing, marketing, routes, demos)
- [x] All 102 E2E tests passing
- [x] Production build clean
- [ ] App Store screenshots captured (two-tool scope)
- [ ] App Store submission — Apple App Store Connect
- [ ] App Store submission — Google Play Console
- [ ] Stripe billing mode → live (currently test mode)
- [ ] ADMIN_EMAILS env var set for production
- [ ] STRIPE_WEBHOOK_SECRET set for production endpoint
