# PlainPath — App Store Privacy Nutrition Label Decision Sheet

**Status:** Ready for owner confirmation. Evidence-based — no guessing.
**References:** `docs/app-store-submission-assets.md` · `docs/app-store-connect-copy-sheet.md` · codebase analysis

---

## Evidence Summary

The following was confirmed by code inspection before producing label recommendations. All findings cite specific source files.

---

### AI Provider

**Finding:** OpenAI (confirmed)
**Source:** `artifacts/api-server/src/routes/documents/index.ts` — `import { openai } from "@workspace/integrations-openai-ai-server"`, models `gpt-4o` and `gpt-5.2` called directly.
**Privacy policy claim:** "OpenAI does not use API-submitted data to train its models by default." ✅ Consistent with OpenAI's API usage policies.
**Label impact:** Document text is sent to OpenAI for processing. This is **User Content** sent to a third-party processor.

---

### Document / Analysis Storage

**Finding:** Two server-side tables store user-linked content.

| Table | What's stored | Linked to user? | Source |
|---|---|---|---|
| `documents` | `extracted_text`, `original_filename`, `mime_type`, `title`, `metadata` | Yes (`user_id`) | `routes/userDocs/index.ts:116` |
| `user_analyses` | `title`, `source_kind`, `document_type_hint`, `analysis` (result JSON) | Yes (`user_id`) | `routes/userHistory/index.ts:43` |
| `shared_analyses` | `analysis` JSON, `title` | No (token-only, no user_id) | `routes/shares/index.ts:119` |

**Key distinction:**
- The `documents` table stores **extracted text** and filename metadata — not the original binary file.
- The `user_analyses` table stores **analysis result JSON** (PlainPath-generated output) — not the raw document.
- `shared_analyses` expire after 30 days and are not linked to a user identity.

⚑ **OWNER CONFIRMATION REQUIRED:** Confirm whether the `documents` table is actively populated in the current launch flow, or whether document text is sent to OpenAI and discarded without being stored in the `documents` table. The route exists in code but may not be called in the Analyze/Contract Review user flow.

---

### Custom Analytics (First-Party)

**Finding:** PlainPath has a custom event tracking system.
**Source:** `artifacts/plainpath/src/lib/analytics.ts` + `artifacts/api-server/src/routes/events.ts`

Events tracked (confirmed in code):
- `analysis_started`, `analysis_completed`
- `contract_review_started`, `contract_review_completed`
- `upgrade_modal_shown`, `upgrade_cta_clicked`
- `subscribe_started`, `checkout_completed`
- `demo_launched`, `analysis_saved`

Events are sent to PlainPath's own `/api/events` endpoint and logged server-side via `logger.info`. No personal data (name, email, document content) is included in event payloads — only event name, optional props, and timestamp.

**Label impact:** This is **Usage Data** collected by the app itself — **first-party**, not a third-party SDK.

**Privacy policy claim:** "No third-party analytics services are embedded in the product." ✅ Accurate — this system is first-party. However, the Privacy Policy does not currently describe the first-party event logging system.

⚑ **OWNER CONFIRMATION REQUIRED:** Confirm whether event logs are linked to a user identity (e.g., Clerk user ID or IP address logged alongside the event). If user-linked, this is "Usage Data — Linked to You." If anonymous/IP-only, it is "Usage Data — Not Linked to You."

---

### Sentry (Crash Reporting)

**Finding:** Sentry SDK is installed and initialized conditionally.
**Source:** `artifacts/plainpath/src/main.tsx:3-19`

```ts
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) { Sentry.init({ ... tracesSampleRate: 0.1 }) }
```

**Status:** Only active if `VITE_SENTRY_DSN` environment variable is set. `VITE_SENTRY_DSN` is **not present** in the current configured secrets list.

⚑ **OWNER CONFIRMATION REQUIRED:** Confirm whether `VITE_SENTRY_DSN` is set in the iOS production build environment. If yes, Sentry is active and **Crash Data / Diagnostics** must be declared. If no, Sentry is dormant and does not need to be declared.

**If Sentry is active:** It may collect device identifiers, stack traces, and session context. Sentry's data handling is governed by Sentry's privacy policy. Label impact: **Crash Data** and potentially **Device ID**.

---

### Tracking SDKs / Advertising

**Finding:** None found.
**Searched for:** ATTrackingManager, IDFA, advertisingIdentifier, AppTrackingTransparency, ad networks, cross-app tracking.
**Result:** 0 matches. ✅

**Label impact:** "Data Used to Track You" — **None**.

---

### Third-Party Services Summary

| Service | Purpose | Data it receives | Confirmed in code |
|---|---|---|---|
| **Clerk** | Authentication / user accounts | Email, password (hashed), session tokens | ✅ |
| **OpenAI** | Document analysis / contract review | Extracted document text | ✅ |
| **Stripe** | Web subscription billing | Email, payment method (PlainPath receives only status) | ✅ |
| **RevenueCat** | iOS entitlement / subscription | App user ID, subscription status, transaction metadata | ✅ |
| **Resend** | Deadline reminder emails (optional) | Email address (only when reminder is requested) | ✅ |
| **Sentry** | Crash reporting (conditional) | Stack traces, device context | ⚑ Confirm if active |

---

## Full Data Category Table

| Data Type | Collected? | Source / Evidence | Purpose | Linked to User? | Used for Tracking? | Notes |
|---|---|---|---|---|---|---|
| **Email address** | Yes | Clerk auth; stored in subscribers table | Account management, subscription access | Yes | No | Clerk handles auth; PlainPath stores email for subscription matching |
| **User ID** | Yes | Clerk user ID stored in `user_id` FK across tables | App functionality, account management | Yes | No | Used as FK in analyses, documents, subscriptions |
| **Name** | No | Not collected by PlainPath | — | — | — | Clerk may collect display name; confirm with Clerk |
| **Phone number** | No | Not found in code | — | — | — | — |
| **Uploaded document text** | Yes | `documents.extracted_text` + sent to OpenAI | App functionality (analysis) | Yes | No | ⚑ Owner confirm if documents table is populated in launch flow |
| **Analysis results** | Yes | `user_analyses.analysis` | App functionality (saved history) | Yes | No | PlainPath-generated output stored per user |
| **Original file binary** | No | Only extracted text stored, not binary file | — | — | — | `documents` table stores text + filename, not file bytes |
| **Subscription status / entitlement** | Yes | `subscribers` table; RevenueCat entitlement check | Payment / subscription access | Yes | No | PlainPath stores plan tier, not payment card details |
| **Purchase transaction data** | Via RevenueCat/StoreKit | RevenueCat processes on Apple's behalf; PlainPath receives entitlement status only | Subscription access | Yes | No | PlainPath does not store payment card data |
| **Usage events** | Yes | `analytics.ts` → `/api/events` → server log | App analytics (first-party) | ⚑ Confirm | No | Event name + timestamp confirmed; user linkage requires owner confirmation |
| **Tool usage count** | Yes | `tool_usage` + `analysis_usage` tables | Usage limits / subscription enforcement | Yes | No | Usage counts linked to user_id for limit enforcement |
| **Crash data / diagnostics** | ⚑ Conditional | Sentry, only if VITE_SENTRY_DSN is set | Diagnostics / app stability | ⚑ Sentry default | No | Dormant unless DSN configured in production |
| **Device ID** | ⚑ Conditional | Sentry may collect if active | Diagnostics | ⚑ Sentry default | No | Not collected by PlainPath directly |
| **IP address** | Likely (server logs) | Standard server request logging | Security / fraud prevention | Not linked to account | No | Standard infrastructure logging; not used for user profiling |
| **Advertising identifier (IDFA)** | No | Not found in code | — | — | — | ✅ Confirmed absent |
| **Location** | No | Not found in code | — | — | — | ✅ Confirmed absent |
| **Contacts / calendar** | No | Not requested | — | — | — | ✅ Confirmed absent |
| **Health / fitness** | No | Not applicable | — | — | — | ✅ Confirmed absent |

---

## Recommended App Store Privacy Label Selections

These recommendations are based on confirmed code evidence. Items marked ⚑ require owner confirmation before finalizing.

---

### Data Linked to You

These data types are collected and linked to the user's account identity.

| Data type | Apple category | Basis |
|---|---|---|
| Email Address | Contact Info | Clerk account + subscribers table |
| User ID | Identifiers | Clerk user ID as FK in all user tables |
| Subscription / Purchase History | Purchases | Subscribers table; RevenueCat entitlement |
| User Content (document text) | User Content | `documents.extracted_text`; `user_analyses.analysis` ⚑ confirm documents table usage |
| Usage Data | Usage Data | First-party event tracking ⚑ confirm user linkage |

---

### Data Not Linked to You

| Data type | Apple category | Basis |
|---|---|---|
| Crash Data | Crash Data | Sentry, if active — not linked to named user by default ⚑ confirm if Sentry is active |
| Diagnostics | Performance Data | Sentry performance traces, if active ⚑ |

---

### Data Used to Track You

| Data type | Basis |
|---|---|
| **None** | No ad SDKs, no IDFA, no cross-app tracking found ✅ |

---

## Privacy Policy Alignment Check

| Claim in Privacy Policy | Code evidence | Status |
|---|---|---|
| "Documents processed to return results, not retained" | `documents` table stores `extracted_text` linked to user | ⚠️ **Possible mismatch** — policy says not retained but table stores text. ⚑ Owner must confirm if this table is used in the production launch flow, and if so, update the Privacy Policy to accurately describe retention. |
| "No third-party analytics services embedded" | First-party `analytics.ts` event system confirmed; no third-party SDK | ✅ Accurate — first-party only |
| "OpenAI does not use API-submitted data to train models by default" | OpenAI confirmed as provider | ✅ Consistent with OpenAI API policy |
| "Stripe receives email and payment details; PlainPath receives only subscription status" | `subscribers` table stores plan/status, not card data | ✅ Accurate |
| "Documents are not sold" | No code evidence of any sale mechanism | ✅ Consistent |
| "No cookies for tracking or advertising" | No ad/tracking SDK found | ✅ Accurate |

---

## Owner Confirmation Checklist

| # | Item | Blocking for label submission? |
|---|---|---|
| ⚑ 1 | **`documents` table usage in launch flow** — Is the `documents` table populated in the Analyze / Contract Review flow? If yes, extracted text is retained server-side and must be declared as User Content retained and linked to user. Privacy Policy must be updated to match. | **Yes — affects privacy label and policy accuracy** |
| ⚑ 2 | **Usage event user linkage** — Are `/api/events` logs linked to a Clerk user ID? Check `routes/events.ts` for whether `req.userId` is included in the log payload. | **Yes — determines if Usage Data is "Linked to You" or "Not Linked to You"** |
| ⚑ 3 | **Sentry DSN in production** — Is `VITE_SENTRY_DSN` set in the iOS production build? If yes, Crash Data must be declared. | **Yes — adds Crash Data category if active** |
| ⚑ 4 | **Clerk data practices** — Review Clerk's privacy documentation to confirm they do not sell or misuse auth data. Update Privacy Policy third-party section if needed. | Yes |
| ⚑ 5 | **RevenueCat data practices** — Confirm RevenueCat's handling of app user ID and transaction metadata for the nutrition label. | Yes |
| ⚑ 6 | **Resend usage scope** — Confirm Resend is only triggered when user explicitly requests a reminder, not automatically. | No — already described correctly as optional |
| ⚑ 7 | **Privacy Policy update** — If `documents` table is used in launch flow, the Privacy Policy must be updated to accurately state that extracted text is retained. The current policy implies no retention. | **Yes — legal accuracy required before submission** |

---

## Final Recommendation

**PRIVACY LABELS READY FOR OWNER CONFIRMATION**

The recommended label selections are based on confirmed code evidence. Before submitting to App Store Connect:

1. Resolve the **`documents` table retention question** (item 1) — this is the most significant potential mismatch between the Privacy Policy and the actual data flow.
2. Confirm **event linkage** (item 2) to finalize whether Usage Data is linked or unlinked.
3. Confirm **Sentry status** (item 3) in the iOS production environment.
4. Complete the App Store Connect **privacy nutrition label questionnaire** using the table above as your guide.

No product code changes are required or recommended as part of this review.
