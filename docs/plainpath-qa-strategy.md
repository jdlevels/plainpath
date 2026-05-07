# PlainPath — QA Strategy
**Version:** 1.0  
**Last updated:** May 7, 2026  
**Baseline:** 102/102 E2E tests passing

---

## QA Philosophy

PlainPath's QA strategy is built on three priorities:

1. **Hidden tools stay hidden.** Any regression that makes a hidden tool visible or accessible is a launch-blocking failure. This is tested explicitly and independently.
2. **Live tools work end-to-end.** The two live tools (Analyze + Contract Review) must function correctly for authenticated users, handle errors gracefully, and enforce the paywall correctly.
3. **Public surfaces are accurate.** Marketing copy, pricing, demo routes, and app store metadata must not overpromise hidden tools. This is verified by spec.

---

## Test Framework

| Property | Value |
|---|---|
| Framework | Playwright (`@playwright/test`) |
| Language | TypeScript |
| Runner | `pnpm exec playwright test` (project root) |
| Config | `playwright.config.ts` (project root) |
| Test directory | `e2e/` |
| Browser | Chromium (headless) |
| Base URL | `http://localhost:80` (proxied via Replit workspace) |
| Retries | 1 (non-blocking retries on first failure) |
| Per-test timeout | 30–40 seconds |

### Sharding requirement

Running all suites simultaneously causes OOM in the Replit sandbox. Suites with >15 tests must be run in shards:

```bash
# Example: split a 32-test suite into 4 shards
pnpm exec playwright test e2e/contract-review-tool.spec.ts --shard=1/4
pnpm exec playwright test e2e/contract-review-tool.spec.ts --shard=2/4
pnpm exec playwright test e2e/contract-review-tool.spec.ts --shard=3/4
pnpm exec playwright test e2e/contract-review-tool.spec.ts --shard=4/4
```

Parallel shards for small suites (≤15 tests) are safe:
```bash
pnpm exec playwright test e2e/hidden-tools.spec.ts e2e/auth-plan-gate.spec.ts --workers=2
```

---

## Test Suites

### Baseline (v1.0 launch-locked)

| Suite | File | Tests | Purpose |
|---|---|---|---|
| Marketing demo | `e2e/marketing-demo.spec.ts` | 23 | Demo pages render correctly; retired demo routes redirect; no hidden tool UI exposed |
| Hidden tools enforcement | `e2e/hidden-tools.spec.ts` | 15 | All hidden tool routes inaccessible to unauthenticated users; no leaked UI content |
| Auth & plan gate | `e2e/auth-plan-gate.spec.ts` | 7 | Unauthenticated access blocked; plan gating enforced |
| App public routes | `e2e/app-public-routes.spec.ts` | 12 | Public pages load without auth; shared links work; privacy/terms accessible |
| Analyze tool | `e2e/analyze-tool.spec.ts` | 21 | End-to-end analyze flow; tab navigation; error states; API enforcement |
| Contract review tool | `e2e/contract-review-tool.spec.ts` | 24 | End-to-end contract review flow; clause cards; error states; API enforcement |
| **Total** | | **102** | **All passing as of May 7, 2026** |

---

## Auth and Billing Mocking Strategy

**Critical constraint:** Tests must never make real Clerk or Stripe API calls. All auth and billing behavior is mocked at the browser layer via `page.addInitScript`.

### Clerk mock
All protected-route tests use `clerk-mock.js` (loaded via `setupAuthMocks` helper in `e2e/fixtures/auth-helpers.ts`). The mock:
- Replaces Clerk JS before page load
- Returns a signed-in admin user for all `useUser()`, `useAuth()`, and `getToken()` calls
- Allows `RequireAuth` and `PlanGate` components to pass
- Never makes real HTTPS calls to Clerk

### Entitlement mock
`/api/entitlements/status` is mocked via `page.route()` to return an active pro plan:
```json
{ "status": "active", "plan": "pro", "toolAccess": ["analyze", "contract-review"] }
```

### AI call mock
All OpenAI calls are replaced by fixture injection. No real OpenAI API calls are made in any test:
- Analyze: `window.__PLAYWRIGHT_INITIAL_ANALYSIS__` injected from `e2e/fixtures/analyze-fixture.json`
- Contract review: `window.__PLAYWRIGHT_INITIAL_CONTRACT_REVIEW__` injected from contract review fixture

### Paywall bypass flag
A single window flag `window.__PLAYWRIGHT_BYPASS_PAYWALL__` allows the client-side paywall gate to pass in tests:
```ts
await page.addInitScript(() => {
  (window as any).__PLAYWRIGHT_BYPASS_PAYWALL__ = true;
});
```
This flag is set only by Playwright's `addInitScript` API. It is `undefined` in all real browser sessions. The server-side `requireEntitlement` middleware operates independently and is not bypassed by this flag.

### Test-only flags — production safety audit
| Flag | Set by | Visible in production? | Server-side impact? |
|---|---|---|---|
| `__PLAYWRIGHT_E2E__` | `addInitScript` only | No | None |
| `__PLAYWRIGHT_BYPASS_PAYWALL__` | `addInitScript` only | No | None |
| `__PLAYWRIGHT_INITIAL_ANALYSIS__` | `addInitScript` only | No | None |
| `__PLAYWRIGHT_INITIAL_CONTRACT_REVIEW__` | `addInitScript` only | No | None |

---

## Hidden Tool Enforcement Tests

The `hidden-tools.spec.ts` suite is the primary guard against launch-scope regressions. It must be run before every deploy and after any change to routing, entitlements, or the dashboard TOOLS array.

### What it tests
1. **Unauthenticated enforcement** — Each hidden tool route returns a redirect to sign-in (not a usable tool page):
   - `/app/trust-check`
   - `/app/clause-extractor`
   - `/app/compare-versions`
   - `/app/redact`
   - `/app/contract-builder`
   - `/app/build-contract`
   - `/app/builder`
   - `/app/ask-document`
   - `/app/ask-this-document`
   - `/app/compare`

2. **No leaked UI content** — Even if a route loads, it must not render tool-specific UI:
   - No Trust Check scam-analysis UI
   - No Clause Extractor UI
   - No Compare Versions diff UI
   - No Redact PII UI
   - No Document Builder UI

### When to run
- Before every production deploy
- After any change to `App.tsx` routing
- After any change to `Home.tsx` TOOLS array
- After any change to `EntitlementContext` or `PlanGate`
- After any change to `requireEntitlement` middleware

---

## Known Bugs — Fixed in This Codebase

| Bug | Root Cause | Fix Applied |
|---|---|---|
| `getToken()` hangs in ContractReview E2E | Raw Clerk hook never resolves with clerk-mock.js | Wrapped all call sites with `makeGetTokenWithTimeout` (5s timeout + fallback) |
| Paywall gate blocks form submission in E2E | `canRunContractReview(null)` resolves to free plan | `window.__PLAYWRIGHT_BYPASS_PAYWALL__` guard in `analysisGate.ts` |
| Error tests use `waitForTimeout(4000)` | Fixed delay — flaky on slow machines | Replaced with `page.waitForFunction` polling up to 15s |

---

## Pre-Deploy QA Checklist

Before every production deploy, run the following checks in order:

### 1. Hidden tool enforcement
```bash
pnpm exec playwright test e2e/hidden-tools.spec.ts --project=chromium --workers=1
```
**Must pass:** 15/15. Any failure is a deploy blocker.

### 2. Live tool smoke test
```bash
pnpm exec playwright test e2e/analyze-tool.spec.ts --project=chromium --shard=1/2
pnpm exec playwright test e2e/analyze-tool.spec.ts --project=chromium --shard=2/2
pnpm exec playwright test e2e/contract-review-tool.spec.ts --project=chromium --shard=1/4
pnpm exec playwright test e2e/contract-review-tool.spec.ts --project=chromium --shard=2/4
pnpm exec playwright test e2e/contract-review-tool.spec.ts --project=chromium --shard=3/4
pnpm exec playwright test e2e/contract-review-tool.spec.ts --project=chromium --shard=4/4
```
**Must pass:** 21/21 + 26/26.

### 3. Marketing and public routes
```bash
pnpm exec playwright test e2e/marketing-demo.spec.ts --project=chromium --workers=2
pnpm exec playwright test e2e/app-public-routes.spec.ts --project=chromium --workers=1
```
**Must pass:** 35/35 + 12/12.

### 4. Auth and plan gate
```bash
pnpm exec playwright test e2e/auth-plan-gate.spec.ts --project=chromium --workers=1
```
**Must pass:** 7/7.

### 5. Production build
```bash
pnpm --filter @workspace/plainpath run build
```
**Must produce:** `✓ built in <30s` with no TypeScript errors introduced by the change.

---

## QA Gates for Future Tool Unlocks

Before any hidden tool can be unlocked, it must pass a new QA gate:

1. **Dedicated E2E spec** — minimum 15 tests covering:
   - Page loads for authenticated user
   - Form renders and accepts input
   - Result renders correctly (fixture-injected)
   - API returns 401 for unauthenticated requests
   - Error states handled gracefully
   - Mobile viewport usable

2. **Hidden tool enforcement test updated** — the newly-live tool must be removed from the hidden list in `hidden-tools.spec.ts` and a new route added to confirm the previously hidden remaining tools are still hidden.

3. **Marketing copy E2E test** — at minimum a smoke test confirming the marketing site now mentions the new tool (or a separate spec covers the updated demo page).

4. **Full regression run** — all existing suites must still pass after the unlock.

---

## Test History

| Date | Event | Tests |
|---|---|---|
| Pre-session | Initial baseline | 0 (no E2E suite) |
| QA stabilization pass | Suite created; three bugs fixed | 102 passing |
| May 7, 2026 | Two-tool launch readiness pass | 102/102 passing |
