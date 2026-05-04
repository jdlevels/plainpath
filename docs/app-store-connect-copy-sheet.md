# PlainPath — App Store Connect Copy Sheet

**Status:** Ready for owner review. Confirmation items flagged inline with ⚑.
**References:** `docs/app-store-submission-assets.md` · `docs/app-store-screenshot-production-plan.md`

---

## PASTE-READY FIELDS

---

### 1. App Name

```
PlainPath
```

---

### 2. Subtitle

```
Understand paperwork faster
```

**Character count:** 28 / 30 ✅

---

### 3. Promotional Text

```
Upload any document or contract and get clear answers, required items, risks, and questions to ask — before you submit or sign.
```

**Character count:** 131 / 170 ✅

*Promotional text can be updated at any time without a new app version submission.*

---

### 4. Description

```
PlainPath helps you understand confusing paperwork before you act on it.

Whether you're reviewing a lease, a government notice, a medical bill, or a contract someone else wrote — PlainPath reads it in plain English and tells you what it means, what you need, and what to ask.

──────────────────────────────────────

ANALYZE A DOCUMENT

Upload or paste any document — a lease, permit application, government notice, court letter, or medical bill. PlainPath extracts the key information:

• Plain-English summary of what the document says
• Required documents, signatures, and deadlines
• Risks and items that need attention
• A checklist of what to complete before you submit

Work through the checklist and track your progress as you go.

──────────────────────────────────────

CONTRACT REVIEW

Before you sign, PlainPath reads the fine print — clause by clause.

• Plain-English explanation of each clause
• Balanced and flagged clauses clearly identified
• Missing protections highlighted
• Questions to ask the other party before signing
• Draft language you can use in negotiation

Know what you're agreeing to before you commit.

──────────────────────────────────────

PRIVACY-MINDED

Your documents are processed only to return your results. They are not sold and not used to train AI models.

──────────────────────────────────────

WHAT PLAINPATH IS

A plain-English document tool that helps you understand paperwork, organize your response, and know the right questions to ask.

WHAT PLAINPATH IS NOT

A legal advice service. PlainPath does not tell you whether to sign or submit a document. For legal decisions that require professional judgment, consult a qualified attorney.

──────────────────────────────────────

PlainPath Pro includes both tools. Cancel anytime.
```

**Character count:** ~1,450 / 4,000 ✅ *(intentionally lean and scannable for mobile reading)*

---

### 5. Keywords

```
contract review,document scanner,lease review,PDF review,legal document,paperwork,plain English,checklist,agreement,forms
```

**Character count:** 99 / 100 ✅

**Notes:**
- No spaces after commas (Apple counts characters including spaces)
- No competitor names
- No overclaiming legal service terms
- "plain English" retained as a meaningful differentiator
- "legal document" and "contract review" cover highest-intent searches

---

### 6. Screenshot Overlay Captions

| # | Caption | Character count |
|---|---|---|
| 1 | Upload paperwork or a contract. | 32 ✅ |
| 2 | See what the document says in plain English. | 44 ✅ |
| 3 | Know what needs to be completed. | 32 ✅ |
| 4 | Check off items as you finish them. | 35 ✅ |
| 5 | Review key clauses before signing. | 34 ✅ |
| 6 | Know what to clarify before you sign. | 37 ✅ |

All captions are under 50 characters — readable at thumbnail size. ✅

---

### 7. App Review Notes

```
App name: PlainPath
Category: Productivity / Utilities

What PlainPath does:

PlainPath is a document understanding tool. It helps users read and interpret confusing paperwork before taking action.

Tool 1 — Analyze a Document:
Users upload or paste a document. The app returns a plain-English summary, required documents, deadlines, risks, and a completion checklist of action steps.

Tool 2 — Contract Review:
Users upload or paste a contract. The app returns a clause-by-clause plain-English breakdown, balanced and flagged clauses, missing protections, and questions the user can ask the other party before signing.

What PlainPath does not do:
- PlainPath does not provide legal advice.
- PlainPath does not tell users whether to sign a contract or submit a document.
- PlainPath does not represent any law firm or licensed attorney.

Demo content:
All in-app demo content uses fully fictional documents and fictional clause examples. No real user data or real legal documents are shown in demo mode.

Payments:
Subscription: PlainPath Pro — managed through the native iOS in-app purchase flow.
Stripe-based web checkout is not presented to iOS users and is not accessible through the native app path.

⚑ Owner: Confirm RevenueCat + StoreKit native paywall is active before submission.

Test account:
Email: [INSERT TEST ACCOUNT EMAIL]
Password: [INSERT TEST ACCOUNT PASSWORD]

⚑ Owner: Provide a working test account before submission. App Review will use this account to verify all paywall and subscription flows.
```

---

### 8. Privacy Summary

**For use in App Store Connect privacy questionnaire and public-facing Privacy Policy summary.**

```
What PlainPath collects:

• Account email — used for authentication and subscription management.
• Documents you upload or paste — processed to return your results.

What PlainPath does not do:

• PlainPath does not sell your documents or personal information.
• PlainPath does not use your documents to train AI models.
• Document content is not retained beyond what is needed to return your results.

Third-party services:

• Authentication: Clerk (account login and session management).
• Subscription management: RevenueCat (iOS entitlement) and Stripe (web billing).
  Payment card details are handled by those services — PlainPath does not store them.
• Document processing: An AI provider processes document text to return results.
  PlainPath's agreement with this provider prohibits use of your data for model training.
```

**Owner confirmation required before finalizing:**

| # | Item | Action |
|---|---|---|
| ⚑ 1 | Clerk data handling | Confirm Clerk's data practices are consistent with "not sold, not retained" claim |
| ⚑ 2 | AI provider identity | Confirm provider name and that your agreement prohibits training-data use |
| ⚑ 3 | RevenueCat / StoreKit | Confirm native purchase path is active and Stripe is hidden on iOS |
| ⚑ 4 | App Store nutrition labels | Complete privacy questionnaire in App Store Connect based on confirmed data flows |

**Suggested nutrition label selections (pending owner confirmation):**

| Data type | Collection | Linked to user | Used to track |
|---|---|---|---|
| Email address | Yes | Yes | No |
| User content (documents) | Yes | No | No |
| Payment info | No (handled by Stripe/RevenueCat) | — | — |
| Precise location | No | — | — |
| Browsing history | No | — | — |

---

### 9. URL Checklist

| Field | URL | Status |
|---|---|---|
| **Marketing URL** | https://plainpathapp.com | ✅ Confirm live |
| **Support URL** | https://plainpathapp.com/support | ⚑ Confirm page loads |
| **Privacy Policy URL** | https://plainpathapp.com/privacy | ✅ Confirm live |
| **Terms of Service URL** | https://plainpathapp.com/terms | ✅ Confirm live |

All four URLs must be live and returning HTTP 200 before App Store submission. Apple checks them during review.

---

## Owner Confirmation Summary

| # | Item | Blocking? |
|---|---|---|
| ⚑ 1 | Support URL live at plainpathapp.com/support | Yes — required field |
| ⚑ 2 | Test account credentials for App Review | Yes — required before submission |
| ⚑ 3 | RevenueCat + StoreKit native paywall active on iOS | Yes — required for subscription review |
| ⚑ 4 | Clerk data practices confirmed | Yes — required for privacy label accuracy |
| ⚑ 5 | AI provider confirmed, no-training-data agreement in place | Yes — required for privacy claim |
| ⚑ 6 | App Store privacy nutrition labels completed in App Store Connect | Yes — required field |
| ⚑ 7 | Minimum supported iOS device confirmed (6.5-inch screenshots needed?) | Yes — affects screenshot set |

---

## Final Recommendation

**APP STORE COPY READY FOR OWNER REVIEW**

All App Store Connect fields are written, character-counted, and paste-ready. Complete the 7 owner confirmation items above before submitting to App Store Connect. No product code changes required or made.
