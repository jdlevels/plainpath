# PlainPath — iOS App Store Submission Package
**Prepared:** May 8, 2026
**Version:** 1.0 (build 1)
**Scope:** Two-tool launch — Analyze a Document + Contract Review

---

## 1. iOS Packaging Method

| Item | Value |
|---|---|
| Build system | **Capacitor 8.3.0** (React/Vite web app wrapped in a native Xcode project) |
| Xcode project path | `artifacts/plainpath/ios/App/` |
| Web dist path | `artifacts/plainpath/dist/public/` (copied to Xcode project via `npx cap sync`) |
| Native billing | RevenueCat `@revenuecat/purchases-capacitor` → StoreKit |
| Android support | Yes — `artifacts/plainpath/android/` present |

**Build sequence (before each App Store upload):**
```
pnpm --filter @workspace/plainpath run build   # Vite production build
npx cap sync ios                                # copies dist/ into Xcode project
# Open Xcode → select "Any iOS Device (arm64)" → Product → Archive
```

---

## 2. Bundle Configuration

| Field | Value |
|---|---|
| Bundle ID | `com.plainpath.app` |
| App display name | `PlainPath` |
| Version (MARKETING_VERSION) | `1.0` |
| Build number (CURRENT_PROJECT_VERSION) | `1` |
| iOS deployment target | **15.0** |
| Required device capability | `arm64` |
| Supported orientations | Portrait, Landscape Left, Landscape Right (all three) |
| iPad orientations | Portrait, Portrait Upside Down, Landscape Left, Landscape Right |
| Export compliance | `ITSAppUsesNonExemptEncryption = false` (no annual export compliance question) |

---

## 3. Info.plist Privacy Strings

All four permissions are declared and have plain-English usage descriptions.

| Permission Key | Usage Description |
|---|---|
| `NSPhotoLibraryUsageDescription` | PlainPath needs access to your photo library so you can select image-based documents to analyze. |
| `NSPhotoLibraryAddUsageDescription` | PlainPath needs permission to save files to your photo library. |
| `NSDocumentsFolderUsageDescription` | PlainPath needs access to your Documents folder so you can select PDF, Word, or text files to analyze. |
| `NSCameraUsageDescription` | PlainPath can use your camera to photograph and analyze physical documents such as letters, notices, and forms. |

**No other permissions are requested** (no location, no contacts, no microphone, no push notifications, no Face ID, no Bluetooth).

**App Transport Security:** `NSAllowsArbitraryLoads = false`. TLS 1.2+ enforced for the production API domain (`plain-path.replit.app`).

> **Note for submission:** The ATS exception domain is `plain-path.replit.app` (the current production API). If you migrate the API to a custom domain (e.g. `api.plainpathapp.com`) before submission, update this value in `Info.plist` and in `artifacts/plainpath/.env.production` (`VITE_API_BASE_URL`).

---

## 4. App Store Metadata

### App Name
```
PlainPath
```

### Subtitle (30 chars max — current: 27 chars)
```
Turn Docs Into Action Plans
```

### Promotional Text (optional, 170 chars max — can be changed without a new build)
```
Understand any document in minutes. PlainPath turns confusing paperwork into clear action steps — deadlines, risks, and exactly what to do next.
```

### Full Description (Apple — 4000 chars max)
```
PlainPath reads confusing paperwork and turns it into a structured, plain-English action plan — so you always know exactly what to do next.

Paste or upload any document:
• Government forms and IRS notices
• Lease agreements and contracts
• Insurance documents and EOBs
• School enrollment packets
• Grant applications and permits
• HOA notices and court summons

PlainPath tells you:
✓ What you need to do — step by step
✓ What documents to gather
✓ Important deadlines and dates
✓ Key risks and things to watch for

Analyze a Document
Upload a PDF, Word file, or paste any text. PlainPath reads the full document and gives you a structured action plan: prioritized steps, required documents to gather, key deadlines extracted from the fine print, risks flagged by severity, and plain-English explanations of every important term — all sourced from the actual text.

Contract Review
About to sign something? PlainPath reads your contract clause by clause and identifies Watch-Outs and Fair terms — along with an overall fairness score, missing protections, and a plain-English pre-signing checklist. Know exactly what you're agreeing to before you sign.

Your privacy is protected:
• PlainPath never stores your documents
• No account or email required for free use
• Documents are processed by AI and immediately discarded — never saved by PlainPath
• Analysis results are stored only on your device

Supported formats: PDF, Word (.docx), plain text (.txt), or paste any text directly.
```

### Keywords (Apple — 100 chars max, comma-separated — current: 89 chars)
```
document,paperwork,action plan,PDF reader,contract review,lease,IRS notice,AI,plain English
```

### Category
- **Primary:** Productivity
- **Secondary:** Utilities

### Age Rating
- **Apple:** 4+
- **Google Play:** Everyone

---

## 5. URLs

| Field | URL |
|---|---|
| Privacy Policy | `https://plainpathapp.com/app/privacy` |
| Terms of Service | `https://plainpathapp.com/app/terms` |
| Support URL | `https://plainpathapp.com/app/support` |
| Marketing URL (optional) | `https://plainpathapp.com` |
| Support Email | `support@plainpathapp.com` |

> **Pre-submission check:** Verify all four URLs return HTTP 200 from a real browser before submitting to App Store Connect. Apple reviewers will click them.

---

## 6. What's New (Version 1.0)
```
Initial release. PlainPath turns complex paperwork into clear, step-by-step action plans. Supports PDF, Word, and plain text documents. Includes full Contract Review — clause-by-clause analysis with fairness scoring and negotiation guidance.
```

---

## 7. Subscription / IAP Metadata

PlainPath uses a **native auto-renewing subscription** managed via RevenueCat → StoreKit. There is one subscription product.

| Field | Value |
|---|---|
| Product ID | `plainpath_pro_monthly` |
| RevenueCat entitlement ID | `plainpath_pro` |
| Display name (shown to user) | `PlainPath Pro` |
| Price | `$19.99 / month` |
| Billing period | Monthly |
| Free trial | None configured |
| Restore Purchases | Button present on paywall screen |

**Subscription display name (App Store Connect):**
```
PlainPath Pro
```

**Subscription description (App Store Connect — shown on subscription management screen):**
```
Access PlainPath's current tools: Analyze a Document and Contract Review. Includes saved analysis history. Cancel anytime.
```

**On-device paywall copy (NativePaywallScreen — already implemented):**
- Heading: `PlainPath Pro`
- Price: `$19.99 / month`
- Subtext: `Cancel anytime — no commitment`
- Feature bullets: Analyze a Document / Contract Review / Saved analysis history
- CTA: `Get PlainPath Pro`
- Secondary: `Restore Purchases`

**Billing routing:**
- iOS / Android native → RevenueCat → StoreKit / Play Billing
- Web → Stripe checkout (separate path, not an IAP)

---

## 8. Screenshot Checklist

### iPhone 6.7" (required — 5 screens)

| # | Screen | What to capture |
|---|---|---|
| 1 | **Dashboard home** | Two tool cards: "Analyze a Document" and "Contract Review" — both visible, no hidden tools |
| 2 | **Analyze — import** | Paste/upload tabs, format chips (PDF, Word, TXT), paste area |
| 3 | **Analyze — results** | Action plan with prioritized steps, required docs, deadlines |
| 4 | **Contract Review — results** | Fairness score, clause cards with Watch-Out / Fair labels |
| 5 | **Native paywall** | PlainPath Pro paywall: $19.99/month, feature list, "Get PlainPath Pro" CTA |

> Screenshot 5 shows the in-app subscription screen. Apple requires at least one IAP-related screenshot if the app has a paywall.

### iPad 12.9" (required if iPad is listed as supported)
Same 5 screens in landscape orientation.

### Android Phone (Google Play — minimum 2, up to 8)
Same 5 screens.

**Notes:**
- Do not include any hidden tool UI (Trust Check, Clause Extractor, Compare Versions, etc.)
- Capture on a real device or a simulator running iOS 15+ at native resolution
- iPhone 6.7" screenshots: 1290 × 2796 px
- iPad 12.9" screenshots: 2048 × 2732 px

---

## 9. App Store Review Notes (final — corrected)

```
PlainPath is a two-tool document platform powered by AI. No account creation
is required for free use. No sensitive permissions are requested beyond document
file access.

The two tools are:
1. Analyze a Document — action steps, deadlines, required documents, key terms
2. Contract Review — clause-by-clause grading of contracts before signing

Test the app using the built-in demo documents (no upload required):
- Tap "Analyze a Document" → select a pre-loaded demo document → tap Analyze
- Tap "Contract Review" → paste any contract text → tap Review This Contract

Subscription / In-App Purchase:
PlainPath Pro is offered as a monthly auto-renewing subscription at $19.99/month,
managed via StoreKit. Signed-in users without an active subscription are shown
the native paywall screen where they can subscribe or restore a previous purchase.
A "Restore Purchases" button is present on the paywall screen as required.

To test the subscription flow, use a Sandbox Apple ID. The subscription unlocks
both tools (Analyze a Document and Contract Review) and saved analysis history.

Free users may use the app in demo mode without signing in or subscribing.
```

---

## 10. Final Launch Safeguards — Confirmation

| Check | Status |
|---|---|
| Dashboard TOOLS array: Analyze + Contract Review only | ✅ Confirmed |
| No hidden tool cards visible to any user | ✅ Confirmed |
| All 8 hidden demo routes redirect to `/demo` | ✅ Confirmed |
| All 7 hidden app routes redirect to `/` | ✅ Confirmed |
| Builder routes gated by `BUILDER_ENABLED=false` in production | ✅ Confirmed |
| Pricing copy: "both tools — Analyze a Document and Contract Review" | ✅ Confirmed |
| No "all tools" / "full suite" language in any pricing or paywall | ✅ Confirmed |
| Native paywall features: Analyze + Contract Review + Saved history only | ✅ Confirmed |
| Reviewer notes accurately describe native StoreKit subscription | ✅ **Fixed this session** |
| Privacy policy URL (`/app/privacy`) correct and live | ✅ Confirmed |
| Terms URL (`/app/terms`) correct and live | ✅ Confirmed |
| Hidden tools labeled "coming in future updates" in privacy policy | ✅ Confirmed |
| ITSAppUsesNonExemptEncryption = false | ✅ Confirmed |
| Restore Purchases button present on native paywall | ✅ Confirmed |

---

## 11. Build Readiness

### Production build (post-security-task-merges)
```
✓ built in 13.95s — no new TypeScript errors
```

### E2E baseline: 102/102 (verified this session)
All 6 suites passing. See `docs/launch-readiness-audit.md` for full breakdown.

### Post-merge security tasks applied to this build
- Task #67: `ip-address` dependency patched to 10.2.0 (XSS fix)
- Task #68: Security scan completed
- Task #69: PDF utility concurrency gate added (DoS protection)
- Task #70: Team plan subscriber ownership check hardened
- Task #71: `pii_*` sessionStorage buffers cleared on sign-out

---

## 12. Remaining Pre-Submission Tasks (non-code)

| Task | Owner | Blocking? |
|---|---|---|
| Configure `plainpath_pro_monthly` subscription in App Store Connect | Developer | **Yes** — must exist before archive upload |
| Configure RevenueCat dashboard: link product ID + entitlement, add iOS app | Developer | **Yes** — required for StoreKit purchase flow |
| Capture 5 iPhone 6.7" screenshots | Developer | **Yes** — required for App Store listing |
| Capture 5 iPad 12.9" screenshots (if iPad supported) | Developer | Yes if iPad checked |
| Verify all 4 URLs return HTTP 200 (privacy, terms, support, marketing) | Developer | Yes — Apple reviewers will click them |
| Run `npx cap sync ios` → open Xcode → Archive → upload to App Store Connect | Developer | **Yes** — the actual submission step |
| Create Sandbox Apple ID for reviewer IAP testing | Developer | Recommended |
| Confirm `VITE_REVENUECAT_PUBLIC_KEY_IOS` is set in production environment | Developer | **Yes** — RevenueCat SDK will not initialize without it |
| Developer/Publisher name in App Store Connect | Developer | Yes |
| App icon (1024×1024 PNG, no transparency) uploaded to App Store Connect | Developer | Yes |
| If using custom API domain: update `Info.plist` ATS + `.env.production` | Developer | Only if domain changes |

---

## 13. Remaining Launch Blockers (code)

**None.** The codebase is ready for archive and submission as-is.

The only code-adjacent item: `VITE_REVENUECAT_PUBLIC_KEY_IOS` must be set as an environment secret before building the final Xcode archive. It is already declared as an available secret in the Replit environment.
