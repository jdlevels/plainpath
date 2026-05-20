# PlainPath — Hidden Pilot / Test Tooling Audit

Verifies that no internal test routes, pilot features, or development fixtures are exposed to App Store users.

---

## Section 1 — Routes Audit

All routes registered in `artifacts/plainpath/src/App.tsx` are listed here with their access classification.

### Public routes (no auth required)
| Route | Component | Intended for public? | Notes |
|---|---|---|---|
| `/sign-in` | SignInPage | Yes | Auth flow |
| `/sign-up` | SignUpPage | Yes | Auth flow |
| `/privacy` | Privacy | Yes | Required by App Store |
| `/terms` | Terms | Yes | Required by App Store |
| `/support` | Support | Yes | Required by App Store |
| `/paywall-preview` | PaywallPreview | **Internal only** | App Store screenshot capture route; publicly accessible but contains no real data or purchase capability on web. Acceptable. |
| `/methodology` | Methodology | Yes | SEO content |
| `/guides/*` | Various guide pages | Yes | SEO content |
| `/shared/:token` | SharedAnalysis | Yes | Share links are designed to be public |
| `/demo/:id` | Demo | **Review needed** | Demo content routes — confirm no real user data is accessible |
| `/subscribe` | Subscribe | Yes | Web subscription flow |
| `/subscribe/success` | SubscribeSuccess | Yes | Post-purchase redirect |
| `/subscribe/cancel` | SubscribeCancel | Yes | Cancelled purchase redirect |

**Action required for `/paywall-preview`:** This route is publicly accessible without auth. It was built for App Store screenshot capture. Its buttons do not complete real purchases on web. This is acceptable as-is, but note it for awareness.

**Action required for `/demo/:id`:** Verify demo routes serve only fixture/demo data and do not expose any real user data.

### Protected routes (auth required)
All of the following routes are wrapped with `protect()` and require a signed-in session:

| Route | Accessible without subscription? | Notes |
|---|---|---|
| `/` | No (paywall) | Dashboard — tool entry point |
| `/results` | No (paywall) | Analyze results |
| `/my-analyses` | No (paywall) | Saved analyses list |
| `/contract-review` | No (paywall) | Contract Review tool |
| `/review` | No (paywall) | Alias for contract review |
| `/billing` | Yes (account access) | Subscription management |
| `/upgrade` | Yes (account access) | Upgrade/subscribe flow |
| `/team` | No (paywall) | Team management |
| `/documents` | No (paywall) | Documents list |
| `/account-security` | Yes (account access) | Auth settings |
| `/builder/*` | Controlled by BUILDER_ENABLED flag | |

### Deprecated routes (redirect to `/`)
These routes are registered but redirect to the homepage rather than serving content. They exist to handle legacy links gracefully.

| Route | Redirects to |
|---|---|
| `/ask-document` | `/` |
| `/ask-this-document` | `/` |
| `/trust-check` | `/` |
| `/contract-builder` | `/` |
| `/build-contract` | `/` |
| `/build` | `/` |
| `/compare` | `/` |
| `/redact` | `/` |
| `/clause-extractor` | `/` |
| `/clause-extractor/:id` | `/` |
| `/compare-versions` | `/` |
| `/compare-versions/:id` | `/` |

**Status: PASS** — Deprecated tools are correctly hidden. Users who navigate to these routes are redirected to the home screen.

---

## Section 2 — Fixture / Test Data Files

| File | Purpose | Imported in production? | Risk |
|---|---|---|---|
| `src/lib/completionFixture.ts` | QA test data for school enrollment packet | Via `DemoSection.tsx` | Low — demo content only |
| `src/lib/completionFixtureContract.ts` | QA test data for renovation contract | Via `DemoSection.tsx` | Low — demo content only |
| `src/lib/completionFixtureEOB.ts` | QA test data for medical bill | Via `DemoSection.tsx` | Low — demo content only |
| `src/lib/__tests__/completionParserQA.ts` | Parser unit test | Test file only | None — not bundled |

**DemoSection.tsx** renders fixture data for demonstration/onboarding purposes using clearly fictional data. All fixture records contain an `id` prefix of `fixture-*` and clearly labelled fictional company/person names.

**Status: ACCEPTABLE** — Fixture files serve a legitimate demo purpose. Data is clearly fictional and cannot be mistaken for real analysis output.

---

## Section 3 — API Server Internal Tooling

| File | Purpose | Exposed via API? | Risk |
|---|---|---|---|
| `src/lib/pilotFeedbackDb.ts` | Pilot feedback database table | Unknown — check routes | Investigate |
| `src/lib/demoData.ts` | Demo/seed data for API routes | Via `/api/demo/*` routes | Low — demo only |
| `src/lib/trustCheckDemoData.ts` | Demo data for Trust Check feature | Demo only | Low |
| `src/middlewares/allowlistEnforcement.ts` | Pilot-era allowlist | Applied to all auth routes | **CRITICAL** — see Blocker 1 in document 00 |
| `src/middlewares/builderFeatureFlag.ts` | Builder feature flag | Applied to `/api/builder/*` | Acceptable |

**Pilot feedback table:** Verify whether any route exposes the `pilot_feedback` table to end users. If so, ensure it requires admin auth. This table should not be accessible to regular subscribers.

---

## Section 4 — Feature Flag State at Launch

| Flag | Env var | Production value | Effect |
|---|---|---|---|
| Builder enabled | `VITE_BUILDER_ENABLED` / `BUILDER_ENABLED` | **Confirm before launch** | Controls Document Builder visibility |
| Billing enabled | Hardcoded in `billingConfig.ts` | `true` | Live billing active |
| Billing mode | Hardcoded in `billingConfig.ts` | `"live"` | Real charges |
| Paywall enforcement | Hardcoded in `billingConfig.ts` | `true` | Tools gated behind subscription |
| Stripe test mode | Hardcoded in `billingConfig.ts` | `false` | No test charges |

**Status: PASS** for billing flags — live mode is correctly configured.
**Status: VERIFY** for Builder flag — confirm intended state before launch.

---

## Section 5 — Clerk Allowlist (User Registration Control)

Separate from the API server allowlist, Clerk itself may have an allowlist configured that restricts which email domains or addresses can create accounts.

| Check | Status |
|---|---|
| Clerk dashboard → User & Authentication → Restrictions — confirm allowlist/blocklist settings | |
| If Clerk has an email allowlist: confirm it is either removed or covers intended user base | |
| If Clerk has domain restrictions: confirm they are not blocking public signup | |

---

## Section 6 — Environment Variable Audit

Confirm no development-only secrets are present in the production environment:

| Variable | Should be in production? | Notes |
|---|---|---|
| `CLERK_SECRET_KEY` | Yes | Server auth |
| `CLERK_PUBLISHABLE_KEY` | Yes | Client auth |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Frontend Clerk |
| `STRIPE_SECRET_KEY` | Yes | Live Stripe key (NOT test key) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Live Stripe public key |
| `REVENUECAT_API_KEY_IOS` | Yes | RevenueCat server key |
| `VITE_REVENUECAT_PUBLIC_KEY_IOS` | Yes | RevenueCat frontend key |
| `ALLOWED_EMAILS` | **Resolve per Blocker 1** | Remove or expand for public launch |
| `VITE_BUILDER_ENABLED` | Confirm intended value | |
| `DATABASE_URL` | Yes | Production database |
| `DROPBOX_SIGN_API_KEY` | Verify if used | |

---

## Audit Summary

| Section | Status |
|---|---|
| Public routes | Acceptable — PaywallPreview noted |
| Protected routes | Pass |
| Deprecated routes | Pass — redirect correctly |
| Fixture files | Acceptable — fictional data, demo purpose |
| API server tooling | **Investigate pilot_feedback exposure** |
| Feature flags | Pass for billing; verify Builder flag |
| Clerk restrictions | Verify |
| Environment variables | **Resolve ALLOWED_EMAILS (Blocker 1)** |

---

*Document: 10 | Phase: Pre-Launch Audit | Last updated: May 2026*
