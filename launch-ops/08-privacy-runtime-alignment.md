# PlainPath — Privacy Policy / Runtime Alignment Verification

This document verifies that what the privacy policy says matches what the app actually does.

**Privacy policy location:** `/privacy` route in app — `artifacts/plainpath/src/pages/Privacy.tsx`
**Last updated in policy:** May 7, 2026

---

## Section 1 — Data Collection Alignment

### 1.1 Document analysis (free tier)

**Policy states:**
- Uploaded files held in server memory only for processing duration; never written to disk
- Extracted text sent to OpenAI; not stored by PlainPath after response
- Analysis results returned to browser; not stored unless user explicitly saves them
- If saved, only the generated output is stored — not the original document or extracted text

**Runtime verification:**
| Check | How to verify | Status |
|---|---|---|
| No file written to disk | Search API server for any `fs.writeFile` or `writeFileSync` in document processing route | |
| Text not stored after response | Confirm analysis route does not INSERT extracted text into any database table | |
| Only output stored on save | Confirm `savedAnalyses` table stores AI output fields, not raw document content | |

**File to audit:** `artifacts/api-server/src/routes/` — document analysis endpoint

---

### 1.2 Paid subscriptions

**Policy states:**
- Email address stored on PlainPath servers
- Email processed by Stripe for payment
- PlainPath does not store payment card details
- Subscription records retained up to 90 days after cancellation, then deleted

**Runtime verification:**
| Check | How to verify | Status |
|---|---|---|
| Email stored in billing DB | Confirm `billing` or equivalent table stores email | |
| No card data stored | Confirm no card number, CVV, or expiry stored in any table | |
| 90-day retention enforced | Confirm there is a data deletion job or note that this is a manual process | |

**Files to audit:** `artifacts/api-server/src/lib/billingDb.ts`, `artifacts/api-server/src/lib/stripeClient.ts`

---

### 1.3 Email deadline reminders

**Policy states:**
- Email sent to Resend for delivery
- PlainPath does not retain the email address after delivery attempt

**Runtime verification:**
| Check | How to verify | Status |
|---|---|---|
| Email not stored in DB after reminder sent | Confirm reminder route does not persist the email address | |
| Resend is the only processor | Confirm no other email provider in reminder flow | |

**File to audit:** `artifacts/api-server/src/routes/reminders/`

---

### 1.4 Share feature

**Policy states:**
- Analysis output stored for up to 30 days to power shareable link
- No personal information or document content attached to share record
- Shares automatically deleted after 30 days

**Runtime verification:**
| Check | How to verify | Status |
|---|---|---|
| Share record contains only output, not document content | Inspect `shares` table schema | |
| 30-day deletion enforced | Confirm there is a cleanup job or cron that deletes expired shares | |
| No user PII attached to share record | Confirm share is accessible without auth and contains no email/name | |

**File to audit:** `artifacts/api-server/src/routes/shares/`

---

## Section 2 — Third-Party Processors Declared

The privacy policy must declare every third-party service that receives user data.

| Service | Data received | Declared in policy | Status |
|---|---|---|---|
| OpenAI | Document text (for analysis) | Yes — explicitly named | |
| Stripe | Email address, subscription events | Yes — explicitly named | |
| Resend | Email address (for reminders) | Yes — explicitly named | |
| Clerk | Email address, session tokens | Check — Clerk is the auth provider | |
| RevenueCat | Apple purchase receipt, subscriber ID | Check — must be declared if not already | |

**Action required:** Verify Clerk and RevenueCat are named in the privacy policy. If not, add them to the "Third-Party Services" section.

---

## Section 3 — App Store Connect Privacy Nutrition Labels

Verify these labels match actual behavior:

| Data type | Collected? | Linked to user? | Used for tracking? | Label set? |
|---|---|---|---|---|
| Email address | Yes (subscribers) | Yes | No | |
| Purchase history | Yes (via RevenueCat/Stripe) | Yes | No | |
| User content (documents) | No — processed, not stored | N/A | N/A | |
| Crash data | If crash reporting enabled | No (anonymized) | No | |
| Usage data / analytics | Check `analytics.ts` | Check | Check | |

**File to audit:** `artifacts/plainpath/src/lib/analytics.ts`

---

## Section 4 — Future Tools Disclosure

The privacy policy contains a forward-looking disclosure for tools not yet in v1.0 (Clause Extractor, Compare Versions, Document Builder). Verify:

| Check | Status |
|---|---|
| These tools are NOT accessible to users in the current build (routes redirect to `/`) | |
| The policy language is clearly marked as "coming in future updates" | |
| No data is being collected for these tools in the current build | |

---

## Section 5 — User Data Deletion

**Policy states:** Users can delete saved analyses at any time.

**Runtime verification:**
| Check | Status |
|---|---|
| Delete button present on saved analysis items in My Analyses | |
| Deletion confirmed: API deletes the record from the database | |
| Account deletion process exists (even if manual via support request) | |

---

*Document: 08 | Phase: Compliance Verification | Last updated: May 2026*
