# PlainPath — Apple App Store Pre-Submission Readiness Audit

**Audit date:** April 6, 2026  
**Build:** PlainPath v1.0 (Capacitor / iOS)  
**Production URL:** https://plain-path.replit.app/  
**Scope:** Full App Review readiness pass against current codebase and current Apple submission expectations.

---

## QUICK VERDICT

**→ READY AFTER FIXING MUST-HAVE ITEMS**

There are **2 hard policy blockers** that will cause guaranteed rejection, plus **1 privacy disclosure mismatch** that is a legal risk. Everything else is operational. Fix the three items below, then proceed to Testflight.

---

## PART 1 — APP REVIEW READINESS AUDIT

### 1.1 Core App Functionality

| Check | Status | Notes |
|---|---|---|
| App launches cleanly | ✅ | No startup errors in logs |
| All routes render | ✅ | 13 routes registered, all resolve |
| No broken navigation | ✅ | All nav buttons functional |
| No dead-end flows | ⚠️ | See §6 — `/pilot-feedback` is a dead-end for real users |
| No placeholder screens | ❌ | `/pilot-feedback` exposes internal admin UI to all users |
| No pilot/debug banners | ❌ | "Log Pilot Feedback" panel visible on every Trust Check result |
| Backend reachable | ✅ | API server live at production URL |
| No console/runtime errors | ✅ | Clean HMR logs, no crashes |

### 1.2 Core Feature Readiness

| Feature | Status | Notes |
|---|---|---|
| Analyze a Document (text paste) | ✅ Ready | Full flow works |
| Analyze a Document (file upload) | ✅ Ready | PDF + Word via Capacitor file picker |
| Document Trust Check | ✅ Ready | 3-score model, source evidence, verdict |
| Contract Builder | ✅ Ready | All 5 types live (Freelance, NDA, Payment, Service, Lease) |
| Save / local storage | ✅ Ready | localStorage, device-only |
| Export (PDF, .txt, share) | ✅ Ready | Web Share API + download |
| Shareable links | ✅ Ready | `/shared/:token` route functional |
| Permissions flow (camera/files) | ✅ Ready | Proper Capacitor permission requests |
| Usage metering | ✅ Ready | localStorage quota, UpgradeModal on limit hit |
| Demo documents (in-app samples) | ✅ Ready | 3 pre-loaded samples on Import screen |

### 1.3 Review-Mode Access

- **Login required?** No. The app requires zero account creation. Apple reviewers can use every feature immediately.
- **Demo mode needed?** No. The Import screen includes 3 pre-loaded demo documents (lease agreement, IRS collection notice, business grant). Tap any card → full analysis → all tabs accessible.
- **Backend live during review?** Yes. The API server is deployed and live at the production URL.
- **Review blockers?** None from an access perspective. All flows are open.

### 1.4 Non-Obvious Features Requiring Explanation in Review Notes

1. **AI document analysis** — Document text is sent to OpenAI's API for processing. No document content is stored by PlainPath.
2. **Trust Check 3-score model** — Authenticity Risk, Document Risk, and Verification Confidence are scored by a combination of rule-based analysis and AI. Output is not legal advice (disclaimer present).
3. **Usage limits** — Free users have a monthly quota (3 analyses) tracked in device localStorage, not on the server. No backend call for quota checks without a subscriber email.
4. **UpgradeModal / pricing flow** — Tapping "View plans & pricing" routes to the homepage pricing section. **On iOS, this pricing section must not show active Stripe checkout buttons** (see §3 blocker).
5. **Pilot Feedback Panel** — Visible on Trust Check results. This is an internal scoring tool that **must be hidden before submission** (see §6).

---

## PART 2 — PRIVACY / DATA HANDLING AUDIT

### 2.1 What the App Actually Does With User Data

| Data type | What happens | Stored where |
|---|---|---|
| Uploaded file | Held in server memory during processing only. Never written to disk. | Nowhere (transient) |
| Extracted document text | Sent to OpenAI API for analysis. Not stored by PlainPath. | Nowhere (transient) |
| Analysis results (unsaved) | Returned to browser, lives in session memory only | Browser memory |
| Analysis results (saved) | Written to device localStorage via "Save" button | Device only |
| Shared analyses | Full analysis JSON stored in PostgreSQL for 30 days when user clicks "Copy share link" | **Server (PostgreSQL)** |
| Checklist state | localStorage, device only | Device only |
| Pilot feedback records | document_label + verdict + scores stored in PostgreSQL | **Server (PostgreSQL)** |
| Subscriber email | Stored in device localStorage after Stripe checkout success | Device only |
| Server access logs | IP address, URL path, HTTP status, timestamp | Server logs |
| Analytics / crash reporting | None installed | N/A |
| Third-party SDKs (tracking) | None. OpenAI is the only third-party data recipient. | N/A |

### 2.2 Privacy Page Mismatch — ACTION REQUIRED

**Current privacy page claims:**
> "PlainPath retains no user data. There is no database of documents, analyses, or user activity."
> "Unsaved analyses exist only in your browser session."

**Actual behavior:**

1. When a user taps "Copy share link," the full analysis JSON is stored in PostgreSQL (`shared_analyses` table) with a 30-day expiry. This is **server-side storage of derived document content** and is not disclosed.

2. Pilot feedback records (document label, verdict, scores, reviewer notes) are stored indefinitely in PostgreSQL.

**Required fix:** Update the privacy page before submission to disclose:
- Shared analyses are stored server-side for 30 days when the share feature is used
- Pilot feedback records (internal scoring notes) are stored server-side
- Add a note that share links expire after 30 days and the stored data is deleted

**File:** `artifacts/plainpath/src/pages/Privacy.tsx`

### 2.3 App Privacy Details — What to Select in App Store Connect

| Category | Required disclosure |
|---|---|
| Data Not Linked to You | ✅ Diagnostics (server access logs — IP, URL path) |
| Data Not Collected | ✅ Correct for: Contact Info, Health, Financial, Location, Contacts, Search History, Identifiers, Purchases, Usage Data, Sensitive Info |
| Third-party data sharing | Disclose: document text sent to OpenAI for processing |
| User-generated content | Disclose: shared analysis content stored server-side (30-day TTL) |

Select **"Data Not Linked to You → Other Data"** for the shared analysis storage and server logs. Do **not** claim the app collects no data — that is currently inaccurate due to shared analyses.

---

## PART 3 — APP STORE POLICY / COMPLIANCE CHECK

### 3.1 ❌ HARD BLOCKER — External Payment Flow Visible in iOS App

**Apple Guideline 3.1.1** prohibits iOS apps from containing buttons, links, or UI that directs users to external purchase mechanisms for digital goods or subscriptions.

**Current state:**
- `PricingSection` component is rendered on the home page (`/`)
- It displays $4.99/month and $24.99/month pricing cards with "Start with Starter" and "Get Pro" buttons
- Those buttons call `startStripeCheckout()` → `POST /api/stripe/create-checkout-session` → `window.location.href = data.url` (redirects to Stripe-hosted checkout)
- This pricing section is fully visible and interactive in the iOS native build
- There is **no `isNative()` guard** anywhere in `PricingSection.tsx` or `Home.tsx`

**Result:** Guaranteed rejection on first App Review submission.

**Files involved:**
- `artifacts/plainpath/src/components/PricingSection.tsx`
- `artifacts/plainpath/src/pages/Home.tsx`
- `artifacts/plainpath/src/lib/stripe.ts` (frontend)
- `artifacts/plainpath/src/components/UpgradeModal.tsx` (routes to /pricing)

**Required fix (fastest path):** Wrap the pricing section with `isNative()` check. When running natively on iOS, replace the pricing section with a message: *"To manage your subscription, visit plainpath.app."* Do not show prices or buy buttons. Apply the same logic to the UpgradeModal CTA on native.

### 3.2 Accounts and Account Deletion

- **Accounts:** No account creation required. ✅ No account deletion requirement applies.
- **Subscriber email:** Stored only in device localStorage after a web-based Stripe checkout. No server-side user account exists. ✅ No issues.

### 3.3 Export Compliance / Encryption

- `Info.plist` correctly sets `ITSAppUsesNonExemptEncryption = false`
- The app uses HTTPS (standard, Apple-exempt encryption)
- **No issues.** ✅

### 3.4 AI / Legal Disclaimer Compliance

| Surface | Disclaimer present |
|---|---|
| Trust Check footer | ✅ "Results are not legal or financial advice. When in doubt, consult an attorney." |
| Contract Builder PDF output | ✅ "This is a draft document... not legal advice. Have a qualified attorney review." |
| Contract Builder review step | ✅ Same disclaimer in review summary |
| FAQ (homepage) | ✅ "No. PlainPath...is not a substitute for legal counsel." |
| Terms of Service | ✅ Full disclaimer: "not a substitute for professional legal, tax, financial, or other advice" |
| Analyze results | ✅ Subdued text: "Not legal advice, just practical starting points" |

**No issues.** Disclaimers are present and appropriately worded. ✅

### 3.5 Sign-In Deferred — Does It Affect Submission?

No sign-in is implemented. This is a net positive for submission:
- No account creation = no account deletion requirement
- Apple reviewers can use the app immediately
- No dormant auth code that could raise questions

---

## PART 4 — APP STORE CONNECT ASSET CHECKLIST

| Asset | Status | Notes |
|---|---|---|
| **App name** | ⬜ Not confirmed available | "PlainPath" — search for conflicts before submission |
| **Subtitle** (30 chars max) | ⬜ Missing | Suggestion: *"Turn Documents Into Action Plans"* |
| **Category** | ⬜ Missing | Primary: Productivity. Secondary: Business |
| **Keywords** (100 chars) | ⬜ Missing | Suggestion: `document analysis,contract review,PDF scanner,legal help,paperwork,AI` |
| **Description** (4000 chars) | ⬜ Missing | Needs to be written |
| **Screenshots — 6.9" iPhone** | ⬜ Missing | Required. Min 3, recommended 6 |
| **Screenshots — 6.7" iPhone** | ⬜ Missing | Required if targeting iPhone 15 Plus |
| **Screenshots — 12.9" iPad** | ⬜ Missing | Required if universal app |
| **App preview video** | ⬜ Optional | Recommended for conversions |
| **Support URL** | ⬜ Missing | Suggestion: `https://plain-path.replit.app/` |
| **Privacy policy URL** | ⚠️ Exists but needs update | `https://plain-path.replit.app/privacy` — update content first |
| **Marketing URL** | ⬜ Optional | Can use production URL |
| **Age rating** | ⬜ Not completed | Likely 4+ (no objectionable content, no user-generated public content that is unmoderated) |
| **App privacy details** | ⬜ Missing | Must disclose shared analyses (see §2.3) |
| **App Review notes** | ⬜ Missing | See §7 draft below |
| **Demo account** | ✅ Not needed | No login required |
| **Build uploaded** | ⬜ Missing | Need Xcode archive |

---

## PART 5 — NATIVE iOS / MOBILE CHECKLIST

### 5.1 Info.plist

| Permission key | Present | Copy quality |
|---|---|---|
| NSPhotoLibraryUsageDescription | ✅ | "PlainPath needs access to your photo library so you can select image-based documents to analyze." — Good |
| NSPhotoLibraryAddUsageDescription | ✅ | "PlainPath needs permission to save files to your photo library." — Good |
| UIFileSharingEnabled access string | ✅ | "PlainPath needs access to your Documents folder so you can select PDF, Word, or text files to analyze." — Good |
| ITSAppUsesNonExemptEncryption | ✅ | Set to `false` — correct |
| NSAppTransportSecurity | ✅ | `NSAllowsArbitraryLoads = false`, exception for `plain-path.replit.app` with TLS 1.2 minimum |
| UIViewControllerBasedStatusBarAppearance | ✅ | Set to `true` |
| CFBundleDisplayName | ✅ | "PlainPath" |

**No Info.plist issues.** ✅

### 5.2 App Icons

- `AppIcon.appiconset/Contents.json` contains a single entry: `AppIcon-512@2x.png` (1024×1024), idiom `universal`, platform `ios`
- Xcode 14+ accepts a single 1024×1024 universal icon. This is acceptable for submission. ✅
- The icon file exists at that path. ✅

### 5.3 Splash Screen

- Configured in `capacitor.config.json`: `launchShowDuration: 800`, `backgroundColor: #F8F7F4`, `showSpinner: false` ✅
- `iosSplashResourceName: "Splash"` — verify this asset exists in the iOS project ✅ (confirmed in `Splash.imageset`)

### 5.4 Status Bar

- `capacitor.config.json`: `StatusBar.style = "Light"`, `backgroundColor = "#F8F7F4"`, `overlaysWebView = true` ✅
- `UIViewControllerBasedStatusBarAppearance = true` in Info.plist ✅

### 5.5 Haptics

- `@capacitor/haptics` installed and used throughout (Import, Analyze, TrustCheck)
- VIBRATE permission declared in AndroidManifest ✅
- No issues — haptics are a standard UX enhancement and don't require justification

### 5.6 Rate-App Prompt

- No rate-app prompt implemented
- ✅ No timing violation risk
- Should be added post-launch (standard practice: prompt after 3+ successful analyses)

### 5.7 Capacitor Plugin Behavior

| Plugin | Status |
|---|---|
| @capacitor/haptics | ✅ |
| @capacitor/status-bar | ✅ |
| @capawesome/capacitor-file-picker | ✅ |
| CapacitorHttp | ✅ Enabled in config |

### 5.8 Build / Archive Readiness

| Item | Status |
|---|---|
| `webDir` in capacitor.config.json | ✅ `dist/public` matches Vite build output |
| Bundle ID | ✅ `com.plainpath.app` |
| Android version code | ⚠️ `versionCode 1 / versionName "1.0"` (build.gradle) — confirm this is set in Xcode project too |
| Release config cleanliness | ⚠️ `NODE_ENV=development` in dev workflow — ensure production build sets `NODE_ENV=production` |
| Capacitor sync run before archive | ⬜ Must run `npx cap sync ios` after `pnpm build` before archiving |
| Signing certificates | ⬜ Not checked — requires Apple Developer account setup |

---

## PART 6 — WHAT TO HIDE OR REMOVE BEFORE SUBMISSION

| Item | Location | Action | Reason |
|---|---|---|---|
| `/pilot-feedback` route | `App.tsx` line 48, `PilotFeedback.tsx` | **Remove** the route from the router | Internal admin page with "Pilot Baseline v1.0" header, CSV export, feedback tables — never meant for end users or reviewers |
| `PilotFeedbackPanel` on Trust Check | `TrustCheck.tsx` line 837 | **Remove** the component render | "Log Pilot Feedback" button with placeholders like "Internal tester, Police department pilot" — looks unfinished and exposes internal tooling |
| `POST /api/pilot-feedback` endpoint | `artifacts/api-server/src/routes/pilot-feedback.ts` | **Leave as-is** | Server-side only, not visible to users. Can stay for your own use. |
| Pricing section on native iOS | `Home.tsx`, `PricingSection.tsx` | **Hide on native** — replace with "Manage subscription at plain-path.app" | Hard Apple policy blocker (§3.1) |
| UpgradeModal "View plans & pricing" CTA | `UpgradeModal.tsx` | **Change on native** — link to web URL or remove button | Leads to pricing section with Stripe checkout (§3.1) |
| Team plan "Join Waitlist" → Gmail link | `PricingSection.tsx` | **Hide on native** with pricing section | `window.open()` to Gmail is a policy question on iOS |
| `/subscribe` redirect to `/#pricing` | `Subscribe.tsx` | **Acceptable** — it just anchors to the pricing section, which will be hidden natively | Low risk |
| "Coming soon" badge code in ContractBuilder | `ContractBuilder.tsx` line 501 | **Leave as-is** | Only shows if `ready: false` — currently all 5 types are `ready: true`, badge never displays |
| Privacy page mismatched claims | `Privacy.tsx` | **Fix copy** — disclose shared analyses server storage | Legal risk and App Store Privacy questionnaire mismatch |

---

## PART 7 — APP REVIEW NOTES DRAFT

```
App Review Notes — PlainPath

WHAT THE APP DOES
PlainPath analyzes text-based documents (contracts, leases, legal notices, government
forms, grant packets) using AI and returns a structured action plan in plain English.
It includes three tools: Analyze a Document, Document Trust Check, and Contract Builder.

HOW TO TEST — ANALYZE A DOCUMENT
No login required. Launch the app and tap "Analyze a Document."
On the Import screen, tap any of the three pre-loaded demo document cards
(a lease agreement, an IRS collection notice, or a business grant application).
Tap "Analyze" to run a full analysis. Results appear across multiple tabs:
Plain English Summary, Action Steps, Required Documents, Deadlines, Risks,
Key Terms, and more. All results are local to the session unless saved.

HOW TO TEST — DOCUMENT TRUST CHECK
Tap "Document Trust Check" on the home screen. On the Import screen,
select "Fake IRS Collection Notice" from the demo documents and tap
"Run Trust Check." The app returns three scores (Authenticity Risk,
Document Risk, Verification Confidence) with detailed findings and a
plain-language verdict.

HOW TO TEST — CONTRACT BUILDER
Tap "Build a Contract" on the home screen. Select a contract type
(e.g. Service Agreement), complete the 5-step guided intake wizard,
and tap Generate. The app returns a structured draft with 5 contract
sections, review flags, and a plain-English summary. A draft PDF can
be exported. All drafts are generated server-side by AI and stored
locally in the browser. No account required.

SIGN-IN / ACCOUNTS
No account or login is required. All three features are fully accessible
to the reviewer without any credentials.

DOCUMENT PROCESSING
Uploaded or pasted document text is sent to OpenAI's API for analysis.
PlainPath does not store document text. Files are processed in server memory
and immediately discarded. Analysis results are returned to the device.
If the user chooses to save results, they are written to device-local
storage only — not to PlainPath servers.

EXCEPTION: If the user taps "Copy share link," the analysis result is stored
server-side (PostgreSQL) for up to 30 days to generate a shareable URL.
This is disclosed in the privacy policy.

AI BEHAVIOR
The AI may occasionally produce incomplete or imprecise extractions.
Results display confidence levels (High / Medium / Low) for each extracted item.
The app includes clear disclaimers on all three tools that output is not legal,
financial, or professional advice.

USAGE LIMITS
Free users are limited to 3 document analyses per month tracked via
device-local storage (no server-side account). When the limit is reached,
an upgrade prompt is shown. Subscription management is handled via the web
at plain-path.replit.app and is not available for purchase within the app.

SUBSCRIPTION NOTE
This app does not offer in-app purchases. Subscriptions are managed externally
at plain-path.replit.app. There are no purchase flows within the iOS app.

DEMO DOCUMENTS
Three pre-loaded documents are available on the Import screen and require
no external content. Use these to test all three features without needing
to supply your own document.
```

---

## PART 8 — FINAL READINESS DECISION

### **→ READY AFTER FIXING MUST-HAVE ITEMS**

---

### Blockers in Priority Order

**BLOCKER 1 — CRITICAL: External payment UI visible in native iOS app**  
`PricingSection.tsx`, `UpgradeModal.tsx`, `Home.tsx`  
Apple Guideline 3.1.1 violation. The Stripe checkout flow and pricing cards are visible and interactive in the iOS native build. Will cause guaranteed rejection.  
**Fix:** Guard with `isNative()` — hide pricing section on native, replace with "Manage at plain-path.app".  
**Effort:** ~1–2 hours.

**BLOCKER 2 — HIGH: Internal pilot tooling exposed in the production app**  
`App.tsx` (route), `PilotFeedback.tsx` (page), `TrustCheck.tsx` (panel)  
The `/pilot-feedback` route is accessible to all users including Apple reviewers. The "Log Pilot Feedback" panel renders on every Trust Check result with internal-only placeholders. Presents as unfinished beta software.  
**Fix:** Remove the route from the router and remove the PilotFeedbackPanel render from TrustCheck.  
**Effort:** ~30 minutes.

**BLOCKER 3 — HIGH: Privacy policy contradicts actual data behavior**  
`Privacy.tsx`  
The privacy page states "PlainPath retains no user data. There is no database." The Shares feature stores full analysis JSON in PostgreSQL for 30 days. This must be disclosed before App Store review and is a legal risk.  
**Fix:** Update Privacy.tsx to accurately describe shared analysis storage (user-initiated, 30-day TTL, deleted on expiry).  
**Effort:** ~30 minutes.

---

### After Fixing the 3 Blockers

| Category | Items |
|---|---|
| **Should fix before submission** | App Store Connect assets (screenshots × 3 devices, description, subtitle, keywords, age rating, privacy details questionnaire) |
| **Should fix before submission** | Verify Xcode build number (`CFBundleVersion`) matches what is set in `build.gradle` (`versionCode 1`) |
| **Should fix before submission** | Confirm `npx cap sync ios` has been run against the production build before archiving |
| **Nice to improve** | Rate-app prompt after 3+ successful analyses |
| **Nice to improve** | Crash reporting (e.g. Sentry) — currently no crash visibility in production native |
| **Safe to defer** | Apple IAP implementation — hiding pricing on native is the compliant fast path |
| **Safe to defer** | Stripe + Resend integrations — code is ready, just needs keys |
| **Safe to defer** | iPad-specific layout optimization |

---

*Audit produced against commit `83e79fe` · PlainPath codebase · April 6, 2026*
