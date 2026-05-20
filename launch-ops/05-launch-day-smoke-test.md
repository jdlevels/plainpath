# PlainPath — Launch Day Smoke Test Checklist

Run this checklist immediately after the app status changes to "Ready for Sale" and before any public announcement.
Estimated time: 20–30 minutes.

Record pass/fail and your name for each item.

**Tester:** ___________________
**Date:** ___________________
**Build number tested:** ___________________
**Device(s) used:** ___________________

---

## Block 1 — Pre-Launch Environment Checks (5 min)

| # | Check | Pass / Fail |
|---|---|---|
| 1.1 | `ALLOWED_EMAILS` env var updated to allow all users, OR allowlist middleware removed | |
| 1.2 | `GET https://[api-domain]/api/health` returns 200 | |
| 1.3 | `https://plain-path.replit.app/privacy` returns 200 (HTTP, not redirect) | |
| 1.4 | `https://plain-path.replit.app/terms` returns 200 | |
| 1.5 | RevenueCat product `plainpath_pro_monthly` shows "Approved" in App Store Connect | |
| 1.6 | CI icon verification step shows "✓ Production app icon verified" in last successful build log | |

---

## Block 2 — Auth Flow (5 min)

| # | Check | Pass / Fail |
|---|---|---|
| 2.1 | Open app from cold start (not in recent apps) — sign-in screen appears, no crash | |
| 2.2 | Create a brand-new account using an email not previously registered | |
| 2.3 | Sign in — dashboard loads within 3 seconds | |
| 2.4 | Sign out — returns to sign-in screen | |
| 2.5 | Sign back in — dashboard loads correctly | |

---

## Block 3 — Core Tool: Analyze a Document (5 min)

| # | Check | Pass / Fail |
|---|---|---|
| 3.1 | Tap "Analyze a Document" — file picker opens | |
| 3.2 | Select a PDF (any standard PDF from Files app) | |
| 3.3 | Analysis completes within 30 seconds | |
| 3.4 | Result shows: Summary, Action Steps, Key Dates, Risk Flags sections | |
| 3.5 | No error banner or empty result | |
| 3.6 | Save the analysis — appears in My Analyses | |

---

## Block 4 — Core Tool: Contract Review (5 min)

| # | Check | Pass / Fail |
|---|---|---|
| 4.1 | Navigate to Contract Review | |
| 4.2 | Upload a contract PDF | |
| 4.3 | Review completes within 30 seconds | |
| 4.4 | Result shows risk assessment and concern flags | |
| 4.5 | No error or crash | |

---

## Block 5 — Subscription Flow (5 min)

| # | Check | Pass / Fail |
|---|---|---|
| 5.1 | Sign in as a non-subscriber — paywall appears when accessing gated feature | |
| 5.2 | Tap Subscribe — native purchase sheet appears from iOS | |
| 5.3 | Complete purchase using Sandbox Apple ID | |
| 5.4 | App unlocks tools after purchase completes | |
| 5.5 | RevenueCat dashboard shows new subscriber record within 60 seconds | |
| 5.6 | Tap Restore Purchases — purchase restored without re-charging | |
| 5.7 | `/billing` screen shows correct plan name and renewal date | |

---

## Block 6 — Privacy and Legal Routes (2 min)

| # | Check | Pass / Fail |
|---|---|---|
| 6.1 | Tap Privacy Policy link — correct page loads | |
| 6.2 | Tap Terms of Service link — correct page loads | |
| 6.3 | Support route accessible from within app | |

---

## Block 7 — Stability Checks (3 min)

| # | Check | Pass / Fail |
|---|---|---|
| 7.1 | Background app during analysis, foreground — no crash | |
| 7.2 | Kill and reopen app — session persists (still signed in) | |
| 7.3 | Open app with airplane mode on — offline banner appears, no crash | |
| 7.4 | Turn off airplane mode — app recovers without restart | |

---

## Pass Criteria

All items in Blocks 1–5 must be Pass.
Items in Blocks 6–7 must have zero Fails.

If any Block 1–5 item fails: **do not announce launch**. Resolve the issue, re-run the failed block.

---

## Sign-off

**Smoke test complete:** Yes / No
**Launch cleared:** Yes / No
**Notes:**

---

*Document: 05 | Phase: Launch Day | Last updated: May 2026*
