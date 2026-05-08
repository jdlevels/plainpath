# Actionable Button & Click-Path Audit — PlainPath v1.0
**Date:** 2026-05-08  
**Audited surfaces:** Marketing site, Auth flow, Paywall, Dashboard, Analyze, Contract Review, My Analyses, Documents, Billing, Support/Legal, Mobile viewport, Hidden tool routes  
**Audit result:** 1 bug fixed, all other paths verified correct. App Store ready.

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Marketing Navbar | ✅ Pass | All CTAs correct |
| Marketing Hero | ✅ Pass | Both tool CTAs → demo pages |
| Marketing Pricing | ✅ Pass | CTA → `/app/subscribe?plan=pro` |
| Marketing Footer | ✅ Pass | All links verified |
| Demo Landing | ✅ Pass | Sign-up, tool, pricing CTAs correct |
| Auth Flow | ✅ Pass | Sign-in/sign-up routes render |
| Paywall/Subscribe | ✅ Pass | Plan selection, checkout button present |
| Subscribe Success/Cancel | ✅ Pass | Post-checkout CTAs correct |
| App Dashboard | ✅ Pass | Only Analyze + Contract Review shown |
| Analyze Tool | ✅ Pass | Entry, import, results paths intact |
| Contract Review | ✅ Pass | Entry path intact |
| Documents Page | ✅ Fixed | Clause Extractor + Compare Versions empty-state CTAs removed (was exposing hidden tool names) |
| My Analyses | ✅ Pass | Page renders, no hidden tools shown |
| Billing | ✅ Pass | Upgrade CTA + support link correct |
| Support | ✅ Pass | All mailto links present |
| Legal (Privacy/Terms) | ✅ Pass | Pages render without error |
| Mobile Viewport | ✅ Pass | Hamburger, tools accordion, auth CTAs correct |
| Hidden Tool Routes | ✅ Pass | All 6 routes redirect away |

---

## Detailed Findings

### 1. Marketing Site — Navbar

| Button / Link | Destination | Status |
|---------------|-------------|--------|
| PlainPath logo | `/` | ✅ |
| Features (scroll) | `/#features` | ✅ |
| How it Works (scroll) | `/#how-it-works` | ✅ |
| Pricing (scroll) | `/#pricing` | ✅ |
| Tools › Analyze a Document | `/demo/analyze` | ✅ |
| Tools › Contract Review | `/demo/contract-review` | ✅ |
| Support | `/support` | ✅ |
| Try demo | `/demo` | ✅ |
| Log in | `/app/sign-in` | ✅ |
| Open App | `/app/sign-in` | ✅ |
| **Mobile: hamburger open/close** | toggles mobile menu | ✅ |
| **Mobile: Tools accordion** | expands `/demo/analyze`, `/demo/contract-review` | ✅ |
| **Mobile: Log in** | `/app/sign-in` | ✅ |
| **Mobile: Open App** | `/app/sign-in` | ✅ |

**Note:** Both "Log in" and "Open App" route to `/app/sign-in`. Clerk's sign-in page includes a "Don't have an account? Sign up" link, so new users can self-register without a dedicated sign-up button in the navbar.

---

### 2. Marketing Hero

| Button / Link | Destination | Status |
|---------------|-------------|--------|
| Start a Document Plan (primary CTA) | `/demo/analyze` | ✅ |
| Review a Contract (secondary CTA) | `/demo/contract-review` | ✅ |

---

### 3. Marketing Pricing Section

| Button / Link | Destination | Status |
|---------------|-------------|--------|
| Get PlainPath Pro (only plan) | `/app/subscribe?plan=pro` | ✅ |
| 30-day money-back guarantee (text only) | — | ✅ |
| support email | `mailto:support@plainpathapp.com` | ✅ |

The subscribe URL correctly carries `?plan=pro`, which the app's Subscribe page reads and uses to auto-select the Pro plan.

---

### 4. Marketing Footer

| Link | Destination | Status |
|------|-------------|--------|
| Features | `/#features` | ✅ |
| Pricing | `/#pricing` | ✅ |
| Web App | `/app/sign-in` | ✅ |
| Reviewing a Lease (guide) | `/guides/reviewing-a-lease` | ✅ |
| Understanding an NDA (guide) | `/guides/understanding-an-nda` | ✅ |
| Employment Contract Red Flags (guide) | `/guides/employment-contract-red-flags` | ✅ |
| Support | `/support` | ✅ |
| Privacy Policy | `/privacy` | ✅ |
| Terms of Service | `/terms` | ✅ |
| support@plainpathapp.com | `mailto:support@plainpathapp.com` | ✅ |

---

### 5. Demo Landing Page (`/demo`)

| Button / Link | Destination | Status |
|---------------|-------------|--------|
| Analyze a Document card | `/demo/analyze` | ✅ |
| Contract Review card | `/demo/contract-review` | ✅ |
| Start free (hero CTA) | `/app/sign-up` | ✅ |
| See pricing (hero) | `/#pricing` | ✅ |
| Start free (bottom CTA) | `/app/sign-up` | ✅ |
| See pricing (bottom) | `/#pricing` | ✅ |
| Try a demo (waitlist modal) | `/demo` | ✅ |

---

### 6. Auth Flow

| Route | Behavior | Status |
|-------|----------|--------|
| `/app/sign-in` | Renders Clerk sign-in widget | ✅ |
| `/app/sign-up` | Renders Clerk sign-up widget | ✅ |
| `/app/*` (unauthenticated) | Redirects to sign-in | ✅ |
| `/app/sign-in` redirect_url | Preserved from originating URL | ✅ |

---

### 7. Paywall / Subscribe Flow

| Button / Link | Destination / Behavior | Status |
|---------------|------------------------|--------|
| Marketing `Get PlainPath Pro` → `/app/subscribe?plan=pro` | Subscribe page loads, plan pre-selected | ✅ |
| Subscribe page "Get PlainPath Pro" button | Calls `POST /api/stripe/create-checkout-session` → Stripe redirect | ✅ |
| Subscribe page back link | `/` | ✅ |
| Unauthenticated `/app/subscribe` | Redirects to `/sign-up?redirect_url=...` | ✅ |
| `/app/subscribe/success` "Analyze a Document" | `/import` | ✅ |
| `/app/subscribe/success` "Go to dashboard" | `/` (app home) | ✅ |
| `/app/subscribe/cancel` "Try again" | `/subscribe` | ✅ |
| `/app/subscribe/cancel` "Return to home" | `/` (app home) | ✅ |

**API fix (pre-existing, already applied):** `allowlistEnforcement` middleware was removed from `POST /api/stripe/create-checkout-session` so that authenticated users not on an explicit allow-list can reach checkout.

---

### 8. App Dashboard (Home)

| Button / Link | Destination | Status |
|---------------|-------------|--------|
| Analyze a Document tool card | `/analyze` | ✅ |
| Contract Review tool card | `/contract-review` | ✅ |
| Quick-Start: Event Permit demo | `/analyze?demo=event-permit` | ✅ |
| Quick-Start: Employment Offer demo | `/contract-review` | ✅ |
| Upgrade to Pro CTA (free user) | `/subscribe` | ✅ |
| Help / Support link | `/support` | ✅ |
| **Hidden tools NOT present:** Trust Check, Clause Extractor, Compare Versions, Redact | — | ✅ |

---

### 9. Analyze Tool

| Route | Behavior | Status |
|-------|----------|--------|
| `/app/analyze` | Renders tool input | ✅ |
| `/app/import` | Renders document import / upload | ✅ |
| `/app/results/:id` | Renders analysis results | ✅ |
| Free user hits analyze limit | Shows upgrade prompt → `/subscribe` | ✅ |

---

### 10. Contract Review Tool

| Route | Behavior | Status |
|-------|----------|--------|
| `/app/contract-review` | Renders tool input | ✅ |
| Free user without Pro | Shows upgrade modal → `/subscribe` | ✅ |

---

### 11. Documents Page

| Section / Button | Status | Notes |
|------------------|--------|-------|
| Uploaded Documents section | ✅ | Shows only when user has documents |
| Uploaded Documents — archive action | ✅ | Confirmation dialog → archives correctly |
| Uploaded Documents — tool-run badges (analyze, contract-review, import) | ✅ | Correct labels only |
| **Clause Extractor section header** | ✅ Fixed | Was showing "No Clause Extractor sessions yet. Extract Clauses →" for any user with documents. Now suppressed when zero sessions. |
| **Compare Versions section header** | ✅ Fixed | Was showing "No Compare Versions sessions yet. Compare two versions →" for any user with documents. Now suppressed when zero sessions. |
| Document Builder section | ✅ | Gated behind `BUILDER_ENABLED=false`, not rendered at all |

#### Bug Fixed: Hidden Tool Sections in Documents.tsx

**Problem:** The "Clause Extractor" and "Compare Versions" sections each had a condition that rendered an empty-state row (with the tool name and a CTA link) whenever `hasAnyContent` was `true` and the respective session list was empty. Since any user who has ever analyzed a document has `hasAnyContent=true`, every v1.0 user would see "No Clause Extractor sessions yet. Extract Clauses →" and "No Compare Versions sessions yet. Compare two versions →" — exposing hidden tool names to all users.

**Fix applied (`artifacts/plainpath/src/pages/Documents.tsx`):**
1. Removed `clauseSessions.length > 0 || compareSessions.length > 0` from `hasAnyContent` — so `hasAnyContent` now reflects only uploaded documents and (if enabled) builder drafts.
2. Removed the `|| (!pdfLoading && !pdfError && clauseSessions.length === 0 && hasAnyContent)` branch from the Clause Extractor `SectionHeader` visibility condition.
3. Removed the Clause Extractor "no sessions" empty-state block entirely.
4. Removed the `|| (!compareLoading && !compareError && compareSessions.length === 0 && hasAnyContent)` branch from the Compare Versions `SectionHeader` visibility condition.
5. Removed the Compare Versions "no sessions" empty-state block entirely.

Both sections still render correctly if a user does have existing clause/compare sessions (e.g., data migrated from a prior release), so no existing data is lost.

---

### 12. My Analyses Page

| Button / Link | Destination | Status |
|---------------|-------------|--------|
| "Analyze a Document" empty-state CTA | `/import` | ✅ |
| Analysis card → open analysis | `/results/:id` | ✅ |
| Delete analysis button | Confirmation → deletes | ✅ |
| No hidden tool names shown | — | ✅ |

---

### 13. Billing Page

| Button / Link | Destination / Behavior | Status |
|---------------|------------------------|--------|
| Upgrade to Pro button (free user) | `/subscribe` | ✅ |
| Manage subscription (Stripe portal) | Stripe customer portal (Pro via Stripe only) | ✅ |
| Portal button hidden for manual Pro grants | — | ✅ |
| support@plainpathapp.com | `mailto:support@plainpathapp.com` | ✅ |
| Support page link | `/support` | ✅ |

---

### 14. Support Page

| Button / Link | Destination | Status |
|---------------|-------------|--------|
| Email support (top) | `mailto:support@plainpathapp.com` | ✅ |
| Email support (refund/cancellation) | `mailto:support@plainpathapp.com` | ✅ |
| Email support (tech issue) | `mailto:support@plainpathapp.com` | ✅ |
| Email support (general) | `mailto:support@plainpathapp.com` | ✅ |

---

### 15. Legal Pages

| Page | Status |
|------|--------|
| `/privacy` | ✅ Renders |
| `/terms` | ✅ Renders |
| `/support` (marketing) | ✅ Renders |

---

### 16. App Navbar (Authenticated)

| Link | Destination | Status |
|------|-------------|--------|
| PlainPath logo | `/` (app home) | ✅ |
| Analyze a Document | `/analyze` | ✅ |
| Contract Review | `/contract-review` | ✅ |
| Documents | `/documents` | ✅ |
| My Analyses | `/my-analyses` | ✅ |
| Account Security | `/account-security` | ✅ |
| Billing | `/billing` | ✅ |
| Support | `/support` | ✅ |
| Sign out | Clears session → `/` (marketing) | ✅ |
| **Hidden tools NOT shown:** Trust Check, Redact, Builder, Compare Versions, Clause Extractor | — | ✅ |

---

### 17. Hidden Tool Routes

All the following routes redirect away from the tool (to `/` or marketing home). None render tool UI:

| Route | Status |
|-------|--------|
| `/app/trust-check` | ✅ Redirects |
| `/app/clause-extractor` | ✅ Redirects |
| `/app/compare-versions` | ✅ Redirects |
| `/app/redact` | ✅ Redirects |
| `/app/ask-document` | ✅ Redirects |
| `/app/builder` | ✅ Redirects |

---

## Fixes Applied

### Fix 1 — API Server: allowlistEnforcement removed (pre-existing fix)
**File:** `artifacts/api-server/src/app.ts`  
**Change:** Removed the `allowlistEnforcement` global middleware. Free (non-allowlisted) authenticated users can now reach `POST /api/stripe/create-checkout-session` and complete checkout.

### Fix 2 — Documents.tsx: Hidden tool empty states suppressed
**File:** `artifacts/plainpath/src/pages/Documents.tsx`  
**Change:** Removed the "no sessions" empty-state blocks and their `hasAnyContent`-gated section headers for both Clause Extractor and Compare Versions. These sections now only render if a user actually has sessions for those tools, preventing any mention of hidden tool names for v1.0 users.

---

## No-Action Items (by design)

- **Trust Check / Redact / Builder / Clause Extractor / Compare Versions** — intentionally hidden for v1.0. Routes redirect, Navbar omits them, Dashboard excludes them, Documents empty states removed.
- **App Store pricing** — `$19.99/month` shown correctly on marketing site and subscribe page. No in-app purchase (IAP) flow; Pro is web-only for v1.0.
- **Reviewer account** — `reviewer@plainpathapp.com` is in `MANUAL_PRO_EMAILS`, granted Pro access via `grantType: "manual"`. Billing page correctly hides the Stripe portal button for manual grants.
- **BILLING_MODE: "live"** — live Stripe configured. Test cards will not work in the reviewer's session. The reviewer account bypasses checkout via manual grant.

---

## E2E Test Coverage

New spec added: `e2e/actionable-button-audit.spec.ts`

Covers 16 test groups, ~60 individual assertions:
- Marketing Navbar (desktop + mobile)
- Marketing Hero & Pricing CTAs
- Marketing Footer
- Demo Landing page
- Auth flow (sign-in/sign-up routes)
- Subscribe/Paywall (page render, plan selection, CTA present)
- Subscribe success and cancel post-checkout CTAs
- App Dashboard (tool cards visible, hidden tools absent)
- Analyze and Contract Review tool entry points
- Documents page — hidden tool sections suppressed (empty list AND with-documents scenarios)
- My Analyses page
- Billing page
- Support & legal pages
- Hidden tool routes (6 routes, all redirect)
- App Navbar authenticated state
