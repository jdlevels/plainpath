# PlainPath — Operational Monitoring Checklist

**Phase:** Gate 16 — Stabilization
**Purpose:** Verify all production monitoring systems are active and correctly surfacing data before and during the live launch window.
**Rule:** Run this checklist on launch day and then weekly during stabilization.

---

## Section 1 — Analytics Integrity

| # | Check | Expected | Status |
|---|---|---|---|
| 1.1 | Analytics events fire on document upload | Event recorded with document type, not document content | |
| 1.2 | Analytics events fire on analysis completion | Completion event includes tool name and duration; no PII | |
| 1.3 | Analytics events fire on subscription purchase | Purchase event recorded with plan name; no payment data | |
| 1.4 | Analytics does NOT capture document text or file contents | Confirm by inspecting `analytics.ts` event payloads | |
| 1.5 | Analytics does NOT capture user-uploaded file names | File names may be personal; confirm they are excluded or hashed | |
| 1.6 | Session analytics show expected funnel: open → upload → result | Funnel visible and making sense | |

**File to audit:** `artifacts/plainpath/src/lib/analytics.ts`

---

## Section 2 — Upload Failure Logging

| # | Check | Expected | Status |
|---|---|---|---|
| 2.1 | Upload a file that exceeds the size limit | User sees a clear error message; API returns a structured error (not a 500) | |
| 2.2 | Upload a corrupted PDF | User sees a clear error message; no crash or blank screen | |
| 2.3 | Upload a file type not supported (e.g. `.exe`) | User sees "unsupported file type" error | |
| 2.4 | Upload failure logged in API server logs | Log entry shows file type, size, and error reason — but NOT file content | |
| 2.5 | Network interruption during upload | User sees a retry prompt or clear error; app does not hang | |
| 2.6 | Upload failure does NOT expose internal stack trace to user | Error message is user-friendly, not a raw exception | |

---

## Section 3 — Runtime Error Visibility

| # | Check | Expected | Status |
|---|---|---|---|
| 3.1 | API server deployment logs are accessible | Logs viewable in Replit deployment dashboard | |
| 3.2 | 5xx error rate is below 1% | Check API logs for error rate over last 24 hours | |
| 3.3 | 4xx error rate on protected routes is expected (auth failures) | Most 4xx are 401/403 from unauthenticated requests — expected | |
| 3.4 | Unhandled promise rejections appear in logs | Any unhandled rejection logged with stack trace | |
| 3.5 | OpenAI API errors are caught and returned as structured errors | AI failure returns user-friendly message, not raw OpenAI error | |
| 3.6 | ErrorBoundary component is active in frontend | React ErrorBoundary wraps the app; crash shows fallback UI, not blank white screen | |
| 3.7 | Frontend JavaScript errors not silently swallowed | Check browser console on a test device for any uncaught errors | |

**File to audit:** `artifacts/plainpath/src/components/shared/ErrorBoundary.tsx`

---

## Section 4 — Payment and Subscription Visibility

| # | Check | Expected | Status |
|---|---|---|---|
| 4.1 | RevenueCat dashboard shows subscriber count | At least 1 subscriber visible after first real purchase | |
| 4.2 | RevenueCat shows entitlement `plainpath_pro` as active for paying users | Entitlement visible in subscriber detail view | |
| 4.3 | Failed purchase attempts visible in RevenueCat | Any StoreKit errors appear in RC event log | |
| 4.4 | Stripe dashboard (web users) shows live mode transactions | Not test mode; real transactions visible | |
| 4.5 | Stripe webhook events are reaching the API server | Check Stripe dashboard → Webhooks → Recent deliveries; all should be 200 | |
| 4.6 | Subscription cancellations visible in RevenueCat | Cancelled subscriptions appear in RC within 24 hours of user cancellation | |
| 4.7 | API `/api/entitlements/status` returns correct state per user | Active subscriber → active; cancelled → inactive | |

**RevenueCat dashboard:** dashboard.revenuecat.com
**Stripe dashboard:** dashboard.stripe.com

---

## Section 5 — Crash and Error Monitoring

| # | Check | Expected | Status |
|---|---|---|---|
| 5.1 | Crash reporting is active | Confirm whether Sentry, Firebase Crashlytics, or equivalent is configured | |
| 5.2 | If no crash reporting tool: API logs are the fallback | Confirm API logs are retained for at least 7 days | |
| 5.3 | TestFlight crash logs are being reviewed | App Store Connect → TestFlight → Crashes — check weekly | |
| 5.4 | iOS crash rate below 1% | App Store Connect → App Analytics → Crash Rate | |
| 5.5 | Crashes do NOT expose user document content in crash reports | Confirm no document text is in the crash context | |
| 5.6 | Memory warnings handled gracefully | App does not crash on low-memory warning during analysis | |

**App Store Connect crash logs:** App Store Connect → My Apps → PlainPath → TestFlight → Crashes

---

## Section 6 — Production Environment Variables

Verify all required environment variables are set in the production deployment. A missing variable causes silent failures or startup errors.

### API Server — Required Variables

| Variable | Required | Purpose | Confirmed set? |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection | |
| `CLERK_SECRET_KEY` | Yes | Clerk server-side auth | |
| `STRIPE_SECRET_KEY` | Yes | Stripe live key (sk_live_...) | |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe live public key (pk_live_...) | |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signature verification | |
| `REVENUECAT_API_KEY_IOS` | Yes | RevenueCat server-side key | |
| `ALLOWED_EMAILS` | **Resolve per Blocker 1** | Remove or expand for public launch | |
| `DROPBOX_SIGN_API_KEY` | If used | Document signing feature | |
| `RESEND_API_KEY` | If reminder feature is live | Email delivery | |
| `NODE_ENV` | Yes | Must be `production` | |

### Frontend — Required Variables

| Variable | Required | Purpose | Confirmed set? |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend auth | |
| `VITE_REVENUECAT_PUBLIC_KEY_IOS` | Yes | RevenueCat iOS SDK | |
| `VITE_BUILDER_ENABLED` | Confirm intended | Document Builder visibility | |

### Verification method
Run a test request to `/api/health` immediately after each deployment. A missing critical variable will usually cause the server to fail to start or return 500 on first request. Do not infer the variable is set just because the server starts — test each dependent feature.

---

## Section 7 — Monitoring Response Thresholds

If any of the following thresholds are crossed, treat it as a production incident and follow the hotfix/rollback flow in document `06-rollback-hotfix-flow.md`:

| Metric | Warning threshold | Critical (P0) threshold |
|---|---|---|
| API 5xx error rate | > 1% over 10 minutes | > 5% over 5 minutes |
| App crash rate | > 0.5% | > 1% |
| Failed subscription purchases | > 1 per hour | > 3 per hour |
| API response time (p95) | > 10 seconds | > 30 seconds |
| Auth failure rate (401/403) | > 20% of requests | > 50% of requests |

---

## Sign-Off

**Monitoring checklist completed by:** ___________________
**Date:** ___________________
**All systems nominal:** Yes / No
**Open issues:**

---

*Document: 11 | Phase: Stabilization Monitoring | Last updated: May 2026*
