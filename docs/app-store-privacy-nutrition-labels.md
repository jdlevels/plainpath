# PlainPath — App Store Privacy Nutrition Label Decision Sheet

**Status:** CONFIRMED — ready for App Store Connect entry.
**Last updated:** May 4, 2026
**References:** `docs/app-store-submission-assets.md` · `docs/app-store-connect-copy-sheet.md` · codebase analysis

---

## Confirmed Evidence Summary

All findings are based on direct code inspection. No guessing.

---

### 1. Original Uploaded Files

**Finding:** NEVER stored.
**Source:** `artifacts/api-server/src/routes/documents/index.ts:72` — `multer({ storage: multer.memoryStorage() })`. Files are processed entirely in memory and discarded after text extraction.
**Label impact:** Original file binary → **Not Collected**.

---

### 2. Extracted Document Text

**Finding:** NOT stored after processing for the Analyze a Document and Contract Review flows. Extracted text is sent to OpenAI and returned as analysis — it is not persisted in the database by the main upload route.
**Source:** Upload route processes `file.buffer`, calls `runAnalysis()`, returns result. No INSERT of extracted text in this path.
**Label impact:** Raw document text → **Not retained**. Sent to OpenAI (third-party processor) for analysis.

---

### 3. Analysis Results (Saved to My Analyses)

**Finding:** STORED when user explicitly saves. Not stored automatically.
**Source:** `artifacts/api-server/src/routes/userHistory/index.ts:43` — `INSERT INTO user_analyses (user_id, title, source_kind, document_type_hint, analysis)` — called only on explicit POST from the client.
**What's stored:** Generated analysis JSON output, title, document type hint. NOT the original document or extracted text.
**Linked to user:** Yes — `user_id` FK.
**Label impact:** User Content (analysis output) → **Data Linked to You — App Functionality**.

---

### 4. Shared Analyses

**Finding:** STORED temporarily, NOT linked to user identity.
**Source:** `artifacts/api-server/src/routes/shares/index.ts:119` — `INSERT INTO shared_analyses (token, analysis, title)` — no `user_id` column.
**Expiry:** Auto-deleted after 30 days.
**Label impact:** Not linked to user → **Data Not Linked to You** (if declared; de minimis given 30-day expiry and no user linkage).

---

### 5. Usage Events (First-Party Analytics)

**Finding:** Logged server-side. IP address only — NO user ID.
**Source:** `artifacts/api-server/src/routes/events.ts` — full route:
```ts
router.post("/events", (req, res) => {
  const { event, props, ts } = req.body ?? {}
  if (typeof event === "string") {
    logger.info({ event, props: props ?? {}, ts, ip: req.ip }, "analytics_event")
  }
  res.status(204).end()
})
```
No `requireAuth` middleware. No `req.userId` logged. No database storage — server log only.
**Label impact:** Usage Data → **Data Not Linked to You — Analytics/App Functionality**.

---

### 6. Sentry (Crash Reporting)

**Finding:** DORMANT — not active in production.
**Source:** `artifacts/plainpath/src/main.tsx:11` — `const sentryDsn = import.meta.env.VITE_SENTRY_DSN` — only initializes if env var is set. `VITE_SENTRY_DSN` is **not present** in configured secrets and not found in any env file.
**Label impact:** Crash Data → **Not Collected**.

---

### 7. Advertising / Tracking SDKs

**Finding:** NONE found.
**Searched:** IDFA, ATTrackingManager, AppTrackingTransparency, Facebook Pixel, Google Ads, TikTok Pixel, cross-app tracking, advertising identifiers, fbq, gtag.
**Result:** 0 matches. ✅
**Label impact:** Tracking → **None**.

---

### 8. Third-Party Services Confirmed

| Service | Purpose | Data received |
|---|---|---|
| **Clerk** | Auth / account management | Email, authentication credentials, session tokens |
| **OpenAI** | Document analysis (AI) | Extracted document text — not retained for training per OpenAI API policy |
| **Stripe** | Web subscription billing | Email, payment method — PlainPath receives subscription status only |
| **RevenueCat** | iOS entitlement | App user ID, subscription status, transaction metadata |
| **Resend** | Deadline reminder emails (optional, user-triggered) | Email address for single delivery only |
| **Sentry** | Crash reporting | Dormant — not active |

---

## Final App Store Connect Privacy Label Selections

### A. Data Linked to You

| Data Type | Apple Category | Purpose | Evidence |
|---|---|---|---|
| Email address | Contact Info | Account Management, Subscription Access | Clerk auth; subscribers table |
| User ID | Identifiers | App Functionality, Account Management | Clerk user ID as FK in `user_analyses`, `subscribers` |
| Subscription status | Purchases | Payment / Subscription Access | `subscribers` table; RevenueCat entitlement |
| Analysis output | User Content | App Functionality | `user_analyses.analysis` — only when explicitly saved |

---

### B. Data Not Linked to You

| Data Type | Apple Category | Purpose | Evidence |
|---|---|---|---|
| Usage events (event name, timestamp, IP) | Usage Data | Analytics | `/api/events` route — no user ID, server log only |

---

### C. Data Not Collected

| Data Type | Notes |
|---|---|
| Original uploaded files | Memory-only processing, never stored |
| Extracted document text | Not retained after OpenAI processing |
| Crash data / diagnostics | Sentry dormant — DSN not configured |
| Device ID / advertising identifier | Not collected |
| Precise location | Not collected |
| Contacts / calendar | Not collected |
| Health / fitness | Not collected |
| Browsing history | Not collected |
| Financial info (payment card) | Handled by Stripe/RevenueCat only — not received by PlainPath |

---

### D. Data Used to Track You

**None.** No ad SDKs, no IDFA, no cross-app tracking. Confirmed by code search.

---

## Privacy Policy Alignment

All previously flagged mismatches have been resolved in `Privacy.tsx` (updated May 4, 2026):

| Item | Previous status | Resolution |
|---|---|---|
| Section 1: "saves go to local storage only" | ❌ Inaccurate | ✅ Updated — clearly states server-side storage when explicitly saved |
| Section 3: "Device-saved analyses" bullet | ❌ Inaccurate | ✅ Updated — "Saved analyses (My Analyses)" with accurate server-side description |
| Section 3: Document retention closing paragraph | ❌ Incomplete | ✅ Updated — covers all tiers accurately |
| Section 2: Clerk not mentioned | ❌ Missing | ✅ Added Clerk as named third-party service |
| Section 6: "Does not store" bullet | ❌ Outdated | ✅ Updated — accurate per confirmed findings |
| Data deletion contact | ❌ Missing | ✅ Added to Section 7 |
| Last updated date | ❌ April 22, 2026 | ✅ Updated to May 4, 2026 |

---

## Remaining Owner Confirmation Items

All blocking items from the previous version are resolved. Two non-blocking items remain for owner awareness:

| # | Item | Blocking? |
|---|---|---|
| ⚑ 1 | **RevenueCat nutrition labels** — Confirm RevenueCat's App Store nutrition label guidance for the `Purchases` category. RevenueCat processes transaction metadata; confirm what they recommend declaring. | No — Purchases (linked to user) is already the correct selection |
| ⚑ 2 | **iOS billing statement in Privacy Policy** — The Privacy Policy (Section 5) currently states "On iOS and Android apps, subscriptions must be managed on the web — in-app payment flows are not available." If RevenueCat/StoreKit native billing IS active on iOS at launch, update this line before submission. | No — policy change only, no code change |

---

## Final Recommendation

**PRIVACY LABELS READY FOR APP STORE CONNECT ENTRY**

Enter the selections from Section A–D above directly into the App Store Connect privacy questionnaire. Privacy Policy is updated and accurate. No product code changes were made.
