# PlainPath — RevenueCat Configuration Plan

## Status: Scaffold Ready — Awaiting Account Setup

This document defines the product/entitlement structure for RevenueCat and documents the integration code scaffold. Wire up when you have a RevenueCat account and API key.

---

## Account Setup Steps

1. Create account at https://app.revenuecat.com
2. Create a new Project: **PlainPath**
3. Add Apps:
   - iOS — connect to App Store Bundle ID: `com.plainpath.app`
   - Android — connect to Google Play Package: `com.plainpath.app`
   - Web (optional) — connect to Stripe for web subscriptions
4. Note your **Public API Key** for each platform (used in client code)
5. Note your **Secret API Key** (server-side only — never in client code)

---

## Product Structure

### Entitlements

| Entitlement ID | Display Name | Description |
|---|---|---|
| `starter` | Starter | Access to Analyze tool (unlimited) + basic features |
| `pro` | Pro | Full access to all 5 tools |

> **Note:** Keep entitlements simple. Two tiers. When a user has `pro`, they also get everything in `starter`. Check `pro` first, then `starter`.

### Products

| Product ID | Platform | Type | Price | Entitlement |
|---|---|---|---|---|
| `plainpath_starter_monthly` | iOS + Android | Auto-Renewable Subscription | $4.99/month | `starter` |
| `plainpath_pro_monthly` | iOS + Android | Auto-Renewable Subscription | $29.99/month | `pro` |

### Offerings

**Default Offering ID:** `default`

| Package Identifier | Package Type | Product |
|---|---|---|
| `$rc_monthly_starter` | Monthly | plainpath_starter_monthly |
| `$rc_monthly_pro` | Monthly | plainpath_pro_monthly |

---

## Environment Variables Needed

```bash
# Public API key — safe to include in client builds
VITE_REVENUECAT_IOS_API_KEY=appl_...        # iOS public key from RevenueCat
VITE_REVENUECAT_ANDROID_API_KEY=goog_...    # Android public key from RevenueCat

# Server-side only — NEVER expose to client
REVENUECAT_SECRET_API_KEY=sk_...            # Secret key for server-side webhooks
REVENUECAT_PROJECT_ID=...                   # Project ID for Replit integration
```

---

## Client Code Scaffold (React Native / Capacitor)

File: `artifacts/plainpath/src/lib/nativeBilling.ts`

```typescript
// ─── Native Billing (RevenueCat) ───────────────────────────────────────────────
// Used when running as a Capacitor iOS/Android app.
// Falls back gracefully when running in web browser (Stripe billing used instead).
//
// SETUP: Install react-native-purchases in the plainpath artifact workspace:
//   pnpm --filter @workspace/plainpath add react-native-purchases
//
// IMPORTANT: Only initialize on native platforms. Web uses Stripe.

import { Capacitor } from '@capacitor/core'

// ── Types ──────────────────────────────────────────────────────────────────────

export type NativePlan = "starter" | "pro" | null

export type NativeCustomerInfo = {
  activeSubscriptions: string[]
  entitlements: {
    active: Record<string, { identifier: string; isActive: boolean; expirationDate: string | null }>
  }
}

// ── Platform guard ────────────────────────────────────────────────────────────

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

// ── Initialize RevenueCat ─────────────────────────────────────────────────────
// Call once on app startup, only on native platforms.

export async function initRevenueCat(userId?: string): Promise<void> {
  if (!isNativePlatform()) return

  const { default: Purchases, LOG_LEVEL } = await import('react-native-purchases')

  const apiKey = Capacitor.getPlatform() === 'ios'
    ? import.meta.env.VITE_REVENUECAT_IOS_API_KEY
    : import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY

  if (!apiKey) {
    console.warn('[RevenueCat] API key not set — billing disabled')
    return
  }

  Purchases.setLogLevel(LOG_LEVEL.DEBUG) // Remove in production
  await Purchases.configure({ apiKey, appUserID: userId ?? null })
}

// ── Identify user ─────────────────────────────────────────────────────────────
// Call after sign-in so RevenueCat can link purchase history to the user.

export async function identifyRevenueCatUser(userId: string): Promise<void> {
  if (!isNativePlatform()) return
  const { default: Purchases } = await import('react-native-purchases')
  await Purchases.logIn(userId)
}

// ── Get current plan ──────────────────────────────────────────────────────────

export async function getNativePlan(): Promise<NativePlan> {
  if (!isNativePlatform()) return null

  const { default: Purchases } = await import('react-native-purchases')
  const customerInfo = await Purchases.getCustomerInfo()

  if (customerInfo.entitlements.active['pro']?.isActive) return 'pro'
  if (customerInfo.entitlements.active['starter']?.isActive) return 'starter'
  return null
}

// ── Get offerings ─────────────────────────────────────────────────────────────

export async function getNativeOfferings() {
  if (!isNativePlatform()) return null

  const { default: Purchases } = await import('react-native-purchases')
  const offerings = await Purchases.getOfferings()
  return offerings.current
}

// ── Purchase a package ────────────────────────────────────────────────────────

export async function purchaseNativePackage(packageToPurchase: any): Promise<{
  success: boolean
  plan: NativePlan
  error?: string
}> {
  if (!isNativePlatform()) return { success: false, plan: null, error: 'Not on native platform' }

  try {
    const { default: Purchases } = await import('react-native-purchases')
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase)

    const plan = customerInfo.entitlements.active['pro']?.isActive ? 'pro'
      : customerInfo.entitlements.active['starter']?.isActive ? 'starter'
      : null

    return { success: true, plan }
  } catch (err: any) {
    if (err.userCancelled) return { success: false, plan: null, error: 'cancelled' }
    return { success: false, plan: null, error: err.message ?? 'Purchase failed' }
  }
}

// ── Restore purchases ─────────────────────────────────────────────────────────

export async function restoreNativePurchases(): Promise<NativePlan> {
  if (!isNativePlatform()) return null

  const { default: Purchases } = await import('react-native-purchases')
  const customerInfo = await Purchases.restorePurchases()

  if (customerInfo.entitlements.active['pro']?.isActive) return 'pro'
  if (customerInfo.entitlements.active['starter']?.isActive) return 'starter'
  return null
}
```

---

## Integration with Existing Billing Gate

The existing `billingConfig.ts` controls web billing (Stripe). For native, use `nativeBilling.ts` above alongside it.

**Decision logic in `analysisGate.ts`:**
```typescript
import { isNativePlatform, getNativePlan } from '@/lib/nativeBilling'

// In beforeRunAnalysis() etc.:
const plan = isNativePlatform()
  ? await getNativePlan()           // RevenueCat on native
  : await getWebPlan()              // Stripe on web
```

---

## Webhook Setup (when ready)

1. In RevenueCat Dashboard → Integrations → Webhooks
2. Add endpoint: `https://api.plainpathapp.com/api/revenuecat/webhook`
3. Select events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`
4. Set `REVENUECAT_SECRET_API_KEY` as the webhook auth header

Server handler stub location: `artifacts/api-server/src/routes/revenuecat.ts` (to be created when wiring up)

---

## Pricing Notes

Based on RevenueCat's State of Subscription Apps 2026 (Productivity category):
- Median monthly price: $7.99–$12.99
- PlainPath Starter at $4.99 is positioned as accessible/entry
- PlainPath Pro at $29.99 is positioned as professional-grade (above category median by design — 5 live tools with unlimited use)

Consider offering an **annual option** at ~20–30% discount:
- Starter Annual: $47.99/year (~$4.00/month — 20% off)
- Pro Annual: $251.99/year (~$21.00/month — 30% off; aligns with marketing "save 30%" messaging)

Annual products would be added as additional packages in the same Default Offering.

---

## Future Upgrade Items (out of scope for MVP)

- [ ] Annual subscription products
- [ ] Free trial period (configure in App Store Connect / Play Console — RevenueCat reads automatically)
- [ ] Promotional offers / winback campaigns
- [ ] Paywalled feature gating via RevenueCat entitlements on native
- [ ] RevenueCat webhook handler on API server
- [ ] Syncing RevenueCat → App Store Connect via Replit Publishing pane
