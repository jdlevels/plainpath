# iOS Subscription — RevenueCat Implementation Plan
**Date:** 2026-05-09  
**Status:** Ready to implement — pending App Store Connect + RevenueCat dashboard setup  
**Author:** Audit of current codebase

---

## Executive Summary

The iOS subscription infrastructure is **substantially pre-built**. The RevenueCat SDK is installed, the purchase/restore functions are fully coded, the server-side verification route exists, and the native paywall screen is wired into the app. What is blocking activation is:

1. **App Store Connect** — subscription product `plainpath_pro_monthly` not yet created
2. **RevenueCat dashboard** — app not connected, entitlement/offering not configured
3. **Two environment variables** — `VITE_REVENUECAT_PUBLIC_KEY_IOS` (client) and `REVENUECAT_API_KEY_IOS` (server) not set
4. **One missing code call** — `purchaseNativePlan()` doesn't yet call `POST /api/entitlements/native-verify` after a successful purchase

The web Stripe path is completely unaffected. Do not implement until App Store Connect and RevenueCat are set up — those provide the keys the code needs.

---

## 1. Current iOS Packaging

- **Method:** Capacitor (`com.plainpath.app`)
- **Capacitor version:** `@capacitor/ios` ^8.3.0
- **Xcode project:** `artifacts/plainpath/ios/App/App.xcodeproj` ✅ (exists)
- **Android project:** `artifacts/plainpath/android/` (exists but not in launch scope)
- **App ID:** `com.plainpath.app`

---

## 2. RevenueCat SDK Status

**Installed:** `@revenuecat/purchases-capacitor` ^13.0.1 ✅

**Already implemented (client):**

| Function | File | Status |
|----------|------|--------|
| `configureRevenueCat(userId)` | `src/lib/nativeBilling.ts` | ✅ Done |
| `purchaseNativePlan("pro")` | `src/lib/nativeBilling.ts` | ✅ Done |
| `restoreNativePurchases()` | `src/lib/nativeBilling.ts` | ✅ Done |
| `checkNativeEntitlements()` | `src/lib/nativeBilling.ts` | ✅ Done |

**Already implemented (server):**

| Route | File | Status |
|-------|------|--------|
| `POST /api/entitlements/native-verify` | `src/routes/nativeEntitlements.ts` | ✅ Built, not yet activated |

**Not yet done:**
- `VITE_REVENUECAT_PUBLIC_KEY_IOS` env var — missing from `.env.production`
- `REVENUECAT_API_KEY_IOS` server env var — not set
- Client doesn't call `/native-verify` after purchase (one code addition needed)

---

## 3. Product ID Confirmation

| Setting | Value | Source |
|---------|-------|--------|
| iOS Product ID | `plainpath_pro_monthly` | `nativeBillingConfig.ts` + `nativeBilling.ts` |
| Interval | Monthly | `nativeBillingConfig.ts` |
| Price | $19.99/month | Matching web/Stripe price |

This is already defined in code. It must match exactly in App Store Connect.

---

## 4. Entitlement Name — Important Clarification

There are two different "entitlement" concepts in play. Do not confuse them:

| Concept | ID | Where used |
|---------|----|-----------|
| **RevenueCat entitlement ID** | `plainpath_pro` | RevenueCat dashboard, `RC_ENTITLEMENT_IDS.pro` in `nativeBilling.ts` and `nativeBillingConfig.ts` |
| **Internal plan key** | `pro` | PlainPath DB, `resolvePlan.ts`, `planEntitlements.ts`, Clerk metadata |

The **RevenueCat entitlement must be created with ID `plainpath_pro`** in the RevenueCat dashboard. The internal plan key `pro` is what gets written to the PlainPath billing DB after verification.

---

## 5. Files That Handle Each Area

### Subscribe page
**`artifacts/plainpath/src/pages/Subscribe.tsx`**  
- Web: Shows Stripe checkout buttons ✅  
- Native: Currently shows `<NativeMessage>` — a static screen saying "Subscription management is handled on the PlainPath website"  
- **Note:** This is acceptable — native users who land here via a deep link see the message. The primary native paywall is shown by `ChoosePlanScreen` in `App.tsx` (before the app loads), not by the Subscribe page route.

### isNative() detection
**`artifacts/plainpath/src/lib/platform.ts`**  
- Reads `window.Capacitor.isNative` and `window.Capacitor.getPlatform()` ✅  
- No changes needed

### RevenueCat config (client)
**`artifacts/plainpath/src/lib/nativeBilling.ts`**  
- `configureRevenueCat()` reads `VITE_REVENUECAT_PUBLIC_KEY_IOS` from env ✅  
- Calls `Purchases.configure({ apiKey })` + `Purchases.logIn({ appUserID: clerkUserId })` ✅  
- No changes needed once env var is set

### RevenueCat config (server)
**`artifacts/api-server/src/lib/nativeBillingConfig.ts`**  
- Defines `RC_ENTITLEMENT_IDS`, `IOS_PRODUCT_IDS`, `getRevenueCatApiKey()` ✅  
- Reads `REVENUECAT_API_KEY_IOS` from env ✅  
- No changes needed once env var is set

### Entitlement checks
**`artifacts/plainpath/src/hooks/useEntitlements.ts`** (client)  
- Calls `GET /api/entitlements/status` (server-side billing DB check) ✅  
- Works for native once `/native-verify` has written the subscriber row to the DB

**`artifacts/api-server/src/routes/entitlements.ts`** (server)  
- Checks ADMIN_EMAILS → MANUAL_PRO_EMAILS → Stripe subscriber DB ✅  
- Also serves native subscribers once their row is in the DB (provider = "storekit") ✅  
- No separate RevenueCat SDK call needed server-side — verification happens at purchase time

**`artifacts/api-server/src/routes/nativeEntitlements.ts`** (server)  
- `POST /api/entitlements/native-verify` — verifies with RevenueCat REST API, writes to billing DB ✅  
- Currently guarded by `!REVENUECAT_API_KEY_IOS` (returns 503 until key is set)  
- Activated automatically once `REVENUECAT_API_KEY_IOS` env var is set

### Billing page
**`artifacts/plainpath/src/pages/Billing.tsx`**  
- Web: Stripe portal + subscription status ✅  
- Native: `<NativeBillingView>` — shows plan status + Restore Purchases button ✅  
- Restore Purchases calls `restoreNativePurchases()` ✅  
- **Needs addition:** After restore succeeds, should also call `/native-verify` to sync DB  

### Restore subscription
**`restoreNativePurchases()`** in `artifacts/plainpath/src/lib/nativeBilling.ts` ✅  
- Calls `Purchases.restorePurchases()` ✅  
- Returns `{ success, plan }` ✅  
- **Needs addition:** Call `/native-verify` after successful restore (same as after purchase)

---

## 6. Exact iOS Purchase Flow (Design)

### Happy path — new purchase

```
User opens iOS app (signed in, no active subscription)
  │
  ▼
App.tsx: ChoosePlanScreen renders NativePaywallScreen
  (isNative() = true → NativePaywallScreen, not Stripe ChoosePlanScreen)
  │
  ▼
configureRevenueCat(clerkUserId) ← already called in useEffect
  Purchases.configure({ apiKey: VITE_REVENUECAT_PUBLIC_KEY_IOS })
  Purchases.logIn({ appUserID: clerkUserId })
  │
  ▼
User taps "Get PlainPath Pro"
  → purchaseNativePlan("pro") called
  │
  ▼
Purchases.getOfferings() → finds package with productIdentifier = "plainpath_pro_monthly"
  │
  ▼
Purchases.purchasePackage({ aPackage: pkg })
  → Apple StoreKit sheet appears
  → User confirms purchase with Face ID / Apple ID
  │
  ▼
Purchase completes → result.customerInfo.entitlements.active["plainpath_pro"] is set
  │
  ▼
[NEW] POST /api/entitlements/native-verify
  Body: { platform: "ios", rcUserId: clerkUserId, activeEntitlements: ["plainpath_pro"] }
  Server verifies with RevenueCat REST API → writes to billing DB (provider: "storekit")
  │
  ▼
reload() ← useEntitlements re-fetches from /api/entitlements/status
  Server finds active "storekit" subscriber → returns plan: "pro"
  │
  ▼
PlanGate unlocks → user lands on PlainPath Pro dashboard
  Tools unlocked: Analyze a Document, Contract Review, Saved history
```

### Cancellation / failure path

```
User taps "Get PlainPath Pro"
  → Purchases.purchasePackage() called
  │
  ▼
User cancels Apple payment sheet
  → err.code === "PURCHASE_CANCELLED"
  → purchaseNativePlan returns { success: false, error: "Purchase cancelled" }
  │
  ▼
NativePaywallScreen shows: "Purchase cancelled" (already implemented)
  No change to subscription state
```

### Restore path (required by Apple)

```
User taps "Restore Purchases" (NativePaywallScreen or Billing page)
  → restoreNativePurchases() called
  │
  ▼
Purchases.restorePurchases() → checks prior App Store purchases
  │
  ▼
If active: result.customerInfo.entitlements.active["plainpath_pro"] set
  │
  ▼
[NEW] POST /api/entitlements/native-verify  ← same call as after purchase
  Writes subscriber row to DB
  │
  ▼
reload() → user regains Pro access

If inactive: { success: true, plan: undefined }
  → "No active subscription found for this account." shown
```

---

## 7. App Store Connect Setup Steps

These must be completed in App Store Connect **before** RevenueCat can be configured or the app can be tested.

### Step 1 — Create Subscription Group
1. Open [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Go to **My Apps → PlainPath → In-App Purchases**
3. Click **+** → **Auto-Renewable Subscription**
4. **Subscription Group Name:** `PlainPath Pro` (or `PlainPath Subscriptions`)
5. **Reference Name:** `PlainPath Pro Monthly`

### Step 2 — Create the Monthly Subscription Product

| Field | Value |
|-------|-------|
| Product ID | `plainpath_pro_monthly` |
| Reference Name | PlainPath Pro Monthly |
| Subscription Duration | 1 Month |
| Subscription Group | (group created in Step 1) |
| Display Name | PlainPath Pro |
| Description | Analyze a Document and Contract Review |
| Price | $19.99 / month (Tier 20) |
| Availability | All territories (or US + initial markets) |

### Step 3 — Localization
- Add English (US) localization:
  - **Display Name:** PlainPath Pro
  - **Description:** Analyze any document in plain English and review contracts clause-by-clause before you sign. Cancel anytime.

### Step 4 — Review Screenshot
- Provide a 640×920 px screenshot of the paywall screen for App Store review (already designed in `NativePaywallScreen`)

### Step 5 — Submit with App Version
- In-App Purchases must be submitted alongside the initial app version review, not separately

---

## 8. RevenueCat Dashboard Setup Steps

These can be done in parallel with App Store Connect, but the product must exist there first before it can be mapped.

### Step 1 — Create RevenueCat Project
1. Sign in at [app.revenuecat.com](https://app.revenuecat.com)
2. **Create new Project:** `PlainPath`

### Step 2 — Add iOS App
1. In the project, click **+ Add app → App Store**
2. **App name:** PlainPath
3. **Bundle ID:** `com.plainpath.app`
4. **App Store Connect API key:** upload a key with App Manager access (generated in App Store Connect → Keys)

### Step 3 — Create Entitlement
1. Go to **Entitlements → + New**
2. **Identifier:** `plainpath_pro` ← must match code exactly
3. **Description:** PlainPath Pro

### Step 4 — Create Product
1. Go to **Products → + New**
2. **Product identifier:** `plainpath_pro_monthly` ← must match App Store Connect exactly
3. **Product type:** Subscription

### Step 5 — Map Product → Entitlement
1. Open the `plainpath_pro` entitlement
2. Click **Attach products**
3. Select `plainpath_pro_monthly`

### Step 6 — Configure Offering
1. Go to **Offerings → + New**
2. **Identifier:** `default` (matches `RC_OFFERING_ID = "default"` in code)
3. **Description:** PlainPath Pro Monthly
4. Add Package:
   - **Identifier:** `$rc_monthly` (matches `RC_PACKAGE_IDS.pro = "$rc_monthly"` in code)
   - **Product:** `plainpath_pro_monthly`
5. Set this offering as **Current Offering**

### Step 7 — Retrieve API Keys
1. Go to **Project Settings → API Keys**
2. Copy **Public SDK key for iOS** → used for `VITE_REVENUECAT_PUBLIC_KEY_IOS` (client)
3. Copy **Secret API key** → used for `REVENUECAT_API_KEY_IOS` (server, for verification)

---

## 9. Environment Variables to Set

Two variables must be added before implementation is activated. Set them as Replit secrets.

| Variable | Where Used | How to Get |
|----------|-----------|------------|
| `VITE_REVENUECAT_PUBLIC_KEY_IOS` | Client (`nativeBilling.ts`) — passed to `Purchases.configure()` | RevenueCat dashboard → Project Settings → API Keys → Public SDK key (iOS) |
| `REVENUECAT_API_KEY_IOS` | Server (`nativeEntitlements.ts`) — used to verify purchases via RevenueCat REST API | RevenueCat dashboard → Project Settings → API Keys → Secret API key |

**Note:** `VITE_REVENUECAT_PUBLIC_KEY_IOS` is listed in the available Replit secrets already. Once it has the real value from RevenueCat, it is ready to use.

---

## 10. Code Changes Required (Small)

There are **two** code additions. Everything else is already built.

### Change 1 — Call `/native-verify` after successful purchase

**File:** `artifacts/plainpath/src/lib/nativeBilling.ts`  
**Where:** Inside `purchaseNativePlan()`, after the `Purchases.purchasePackage()` call succeeds

Add a call to `POST /api/entitlements/native-verify` using the authenticated Clerk token and the RevenueCat user ID (= Clerk user ID). This writes the subscriber row to the billing DB so `useEntitlements` can confirm Pro access.

```typescript
// After Purchases.purchasePackage() returns successfully:
// POST /api/entitlements/native-verify
// Body: { platform: "ios", rcUserId: userId, activeEntitlements: ["plainpath_pro"] }
// This syncs the purchase to the PlainPath billing DB.
```

This call requires the Clerk auth token — the function signature will need to accept a `getToken` callback (or the token directly) from the calling component.

### Change 2 — Call `/native-verify` after successful restore

**File:** `artifacts/plainpath/src/lib/nativeBilling.ts`  
**Where:** Inside `restoreNativePurchases()`, after `Purchases.restorePurchases()` returns active entitlements

Same call as Change 1 — required so that a restored purchase also syncs to the billing DB.

---

## 11. Flow: Reviewer Access (reviewer@plainpathapp.com)

`reviewer@plainpathapp.com` is in `MANUAL_PRO_EMAILS` and receives Pro access without Stripe or RevenueCat. This is handled entirely server-side in `resolvePlan.ts`.

- The reviewer does **not** go through Stripe checkout ✅
- The reviewer does **not** go through RevenueCat/StoreKit ✅
- The reviewer gets Pro from `/api/entitlements/status` → `grantType: "manual"` ✅
- The billing page correctly hides the Stripe portal for manual grants ✅
- **No changes needed for reviewer access**

If the Apple reviewer installs the iOS app with their `reviewer@plainpathapp.com` account, they will receive Pro access without needing to make any in-app purchase.

---

## 12. QA Checklist

### Pre-launch (Sandbox)

| Test | Expected result | Verified |
|------|-----------------|---------|
| iOS sandbox purchase | StoreKit sandbox sheet appears → completes → Pro unlocked | □ |
| Purchase cancellation | User taps Cancel → "Purchase cancelled" message → no state change | □ |
| Restore purchase (valid) | Prior sandbox purchase → Pro restored | □ |
| Restore purchase (none) | "No active subscription found for this account." | □ |
| Reviewer manual Pro access | `reviewer@plainpathapp.com` signs in → Pro access, no paywall | □ |
| Free user paywall (iOS) | New account → NativePaywallScreen shown, tools locked | □ |
| Free user paywall (web) | New account → ChoosePlanScreen → Stripe checkout | □ |
| Web Stripe checkout unaffected | Existing free web user → Stripe checkout → Pro | □ |
| Hidden tools remain hidden (iOS) | Trust Check, Clause Extractor, Compare Versions, Redact not visible | □ |
| Billing page — native restore | Billing page shows Restore Purchases button, works correctly | □ |
| configureRevenueCat called on sign-in | No "Missing public API key" warning in console | □ |

### Post-launch
- Monitor RevenueCat dashboard for subscription activations
- Confirm webhook events from Apple reach RevenueCat correctly
- Confirm `POST /native-verify` succeeds and subscriber rows appear in DB

---

## 13. Architecture — Before vs. After

### Before (current state)
```
iOS user (signed in, no sub)
  → NativePaywallScreen shown ✅
  → Taps "Get PlainPath Pro"
  → purchaseNativePlan() → Purchases.purchasePackage() ✅
  → Purchase succeeds
  → [MISSING] No call to /native-verify
  → reload() hits /api/entitlements/status
  → Server finds no subscriber row → returns "free"
  → User still sees paywall ✗
```

### After (with 2 code changes + env vars + dashboard setup)
```
iOS user (signed in, no sub)
  → NativePaywallScreen shown ✅
  → Taps "Get PlainPath Pro"
  → purchaseNativePlan() → Purchases.purchasePackage() ✅
  → Purchase succeeds
  → POST /api/entitlements/native-verify ← NEW
  → Server verifies with RevenueCat REST API ✅
  → Writes subscriber row (provider: "storekit") ✅
  → reload() hits /api/entitlements/status ✅
  → Server finds active storekit row → returns plan: "pro" ✅
  → PlanGate unlocks → user uses Analyze + Contract Review ✅
```

---

## 14. What Is Already Complete

| Component | Status |
|-----------|--------|
| Capacitor iOS project | ✅ Exists |
| RevenueCat SDK installed | ✅ `@revenuecat/purchases-capacitor` ^13.0.1 |
| `configureRevenueCat()` | ✅ Implemented + called in App.tsx |
| `purchaseNativePlan()` | ✅ Implemented (StoreKit sheet works) |
| `restoreNativePurchases()` | ✅ Implemented |
| `NativePaywallScreen` | ✅ Full UI with purchase + restore buttons |
| `NativeBillingView` | ✅ Native billing view with Restore button |
| `POST /api/entitlements/native-verify` server route | ✅ Built, waiting for env vars |
| `nativeBillingConfig.ts` product/entitlement IDs | ✅ Defined |
| `billingProvider.ts` storekit provider | ✅ Defined |
| `billingDb` — `billingProvider` column | ✅ Exists (storekit writes go there) |
| `resolvePlan.ts` — subscriber DB check | ✅ Works for all providers |
| Reviewer manual Pro access | ✅ Unaffected |
| Web Stripe path | ✅ Fully separate, unaffected |

---

## 15. Final Recommendation

**The codebase is implementation-ready. The blockers are external account setup, not code.**

### Required before implementation begins:
1. **App Store Connect** — Create subscription product `plainpath_pro_monthly` at $19.99/month in the PlainPath app
2. **RevenueCat dashboard** — Create project, add iOS app (`com.plainpath.app`), create entitlement `plainpath_pro`, create product `plainpath_pro_monthly`, configure `default` offering with `$rc_monthly` package, retrieve API keys

### After dashboard setup:
3. Set `VITE_REVENUECAT_PUBLIC_KEY_IOS` (client) and `REVENUECAT_API_KEY_IOS` (server) as Replit secrets
4. Add the two `/native-verify` calls to `purchaseNativePlan()` and `restoreNativePurchases()` in `nativeBilling.ts`
5. Run QA checklist using App Store sandbox environment

### Estimated code work once external setup is complete:
- ~30–50 lines of code in `nativeBilling.ts` (adding the two `/native-verify` calls)
- No schema changes
- No new routes (server route already exists)
- No UI changes
- No Stripe changes
