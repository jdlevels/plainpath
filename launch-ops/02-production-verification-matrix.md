# PlainPath — Production Verification Matrix

Run this matrix after every production deployment and at launch. Mark each item Pass / Fail / N-A with the date tested.

---

## Section A — Authentication

| # | Verification | Expected result | Status |
|---|---|---|---|
| A1 | Open app fresh (not signed in) | Sign-in screen appears; no crash | |
| A2 | Create a new account with a real email | Account created; email verification sent (if configured) | |
| A3 | Sign in with existing credentials | Dashboard loads within 3 seconds | |
| A4 | Sign out | Returns to sign-in screen; session cleared | |
| A5 | Sign in on a second device | Session shared correctly; same entitlements | |
| A6 | Access a protected route without sign-in (e.g. `/results`) | Redirected to sign-in | |

---

## Section B — Subscription and Billing

| # | Verification | Expected result | Status |
|---|---|---|---|
| B1 | Tap Subscribe in paywall | Native purchase sheet appears (iOS) | |
| B2 | Complete purchase with Sandbox Apple ID | App unlocks Pro tools; RevenueCat records new subscriber | |
| B3 | Force-close app and reopen after purchase | Entitlements persist; tools still unlocked | |
| B4 | Tap Restore Purchases | Purchase is restored without re-charging | |
| B5 | Cancel subscription in iOS Settings | After expiry, app shows paywall again | |
| B6 | RevenueCat dashboard shows subscriber | Subscriber visible within 60 seconds of purchase | |
| B7 | `/billing` route shows correct plan and renewal date | Subscription details accurate | |
| B8 | Non-subscriber sees paywall when accessing gated tool | Paywall displayed; tool not accessible | |

---

## Section C — Core Tools

| # | Verification | Expected result | Status |
|---|---|---|---|
| C1 | Upload a PDF to Analyze a Document | Document processed; action plan returned within 30 seconds | |
| C2 | Upload a DOCX to Analyze a Document | Document processed correctly | |
| C3 | Analyze a Document returns key actions, deadlines, risks | All sections populated; no empty result | |
| C4 | Save an analysis to My Analyses | Analysis appears in My Analyses list | |
| C5 | Open a saved analysis | Full result displayed correctly | |
| C6 | Delete a saved analysis | Analysis removed from list | |
| C7 | Upload a contract to Contract Review | Contract review result returned correctly | |
| C8 | Contract Review shows concerns and risk rating | Risk section populated | |
| C9 | Share an analysis | Share link generated; link opens correctly in browser | |

---

## Section D — Navigation and Routes

| # | Verification | Expected result | Status |
|---|---|---|---|
| D1 | `/privacy` accessible without sign-in | Privacy policy displayed | |
| D2 | `/terms` accessible without sign-in | Terms of service displayed | |
| D3 | `/support` accessible without sign-in | Support page displayed | |
| D4 | `/methodology` accessible without sign-in | Methodology page displayed | |
| D5 | `/paywall-preview` accessible without sign-in | Paywall UI renders (screenshot-capture route) | |
| D6 | `/shared/:token` with valid token | Shared analysis displayed without sign-in | |
| D7 | `/demo/:id` route | Demo content displayed correctly | |
| D8 | Deprecated routes (`/clause-extractor`, `/redact`, `/compare`) | Redirect to `/`; no 404 | |

---

## Section E — Privacy and Data Handling

| # | Verification | Expected result | Status |
|---|---|---|---|
| E1 | Upload a document; do not save analysis | No document data retained after session | |
| E2 | Save an analysis; check My Analyses | Analysis output stored; original document not stored | |
| E3 | Delete account or data from Settings | User data removed from database | |
| E4 | Privacy policy URL resolves | `https://plain-path.replit.app/privacy` returns 200 | |
| E5 | Terms URL resolves | `https://plain-path.replit.app/terms` returns 200 | |
| E6 | Support URL resolves | Support page returns 200 | |

---

## Section F — Performance and Stability

| # | Verification | Expected result | Status |
|---|---|---|---|
| F1 | App launch to interactive in under 3 seconds (WiFi) | Dashboard or sign-in appears within 3 seconds | |
| F2 | Document upload and analysis under 30 seconds for a typical document | Result returned within 30 seconds | |
| F3 | No crash on fresh install | App opens without crash | |
| F4 | No crash when backgrounding and foregrounding during analysis | Analysis continues or resumes correctly | |
| F5 | Offline mode shows appropriate error | Offline banner appears; no crash | |
| F6 | API health check endpoint | `GET /api/health` returns 200 | |
| F7 | No JavaScript console errors on web | Browser console shows no uncaught errors | |

---

## Section G — App Store Connect Asset Verification

| # | Verification | Expected result | Status |
|---|---|---|---|
| G1 | App icon in App Store Connect Included Assets | PlainPath icon (not blue X placeholder) | |
| G2 | Screenshots uploaded for 6.9" display | At least 3 screenshots, correct dimensions | |
| G3 | App description populated | No placeholder text | |
| G4 | Privacy nutrition labels completed | All relevant data types declared | |
| G5 | Age rating completed | Age rating accurately reflects content | |
| G6 | Support URL live | Returns 200 | |
| G7 | IAP product `plainpath_pro_monthly` status | Approved or Ready to Submit | |

---

*Document: 02 | Phase: Production Verification | Last updated: May 2026*
