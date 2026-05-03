// ─── Native Billing Configuration ─────────────────────────────────────────────
//
// RevenueCat product ID and entitlement mappings for iOS.
//
// LAUNCH MODEL:
//   ONE plan: PlainPath Pro — $19.99/month
//   iOS  → RevenueCat SDK → Apple StoreKit → plainpath_pro_monthly
//
// ACTIVATION STEPS:
//   1. Create a RevenueCat account at https://www.revenuecat.com
//   2. Create one Project: "PlainPath"
//   3. Add iOS app (Bundle ID: com.plainpath.app)
//   4. Create product in App Store Connect (see PRODUCTS below)
//   5. Create entitlement in RevenueCat: "plainpath_pro"
//   6. Map product → entitlement in RevenueCat dashboard
//   7. Set REVENUECAT_API_KEY_IOS in environment
//   8. In billingProvider.ts: set storekit.active = true
//   9. In Capacitor app: install @revenuecat/purchases-capacitor, call Purchases.configure()
//  10. Route Purchases.getCustomerInfo() results through nativeBilling.ts (client) and
//      POST /api/entitlements/native-verify (server) to sync with billing DB
//
// ─────────────────────────────────────────────────────────────────────────────

import type { PlanKey } from "./planEntitlements"

// ─── Purchasable plan keys (only Pro at launch) ───────────────────────────────

type NativePlanKey = "pro"

// ─── RevenueCat Entitlement IDs ───────────────────────────────────────────────
// Must match exactly what is set in the RevenueCat dashboard.

export const RC_ENTITLEMENT_IDS: Record<NativePlanKey, string> = {
  pro: "plainpath_pro",
}

// ─── Apple App Store Product IDs ──────────────────────────────────────────────
// Create in App Store Connect → My Apps → In-App Purchases.
// Type: Auto-Renewable Subscription

export const IOS_PRODUCT_IDS: Record<NativePlanKey, string> = {
  pro: "plainpath_pro_monthly",           // $19.99/month — must match App Store Connect
}

// ─── Google Play Product IDs ──────────────────────────────────────────────────
// Not at launch — reserved for future Android release.

export const ANDROID_PRODUCT_IDS: Record<NativePlanKey, string> = {
  pro: "plainpath_pro_monthly",           // $19.99/month — must match Play Console
}

// ─── RevenueCat Offering ID ───────────────────────────────────────────────────

export const RC_OFFERING_ID = "default"

// ─── RevenueCat Package IDs ───────────────────────────────────────────────────

export const RC_PACKAGE_IDS: Record<NativePlanKey, string> = {
  pro: "$rc_monthly",
}

// ─── RevenueCat API Keys ──────────────────────────────────────────────────────

export function getRevenueCatApiKey(platform: "ios" | "android"): string | null {
  if (platform === "ios") return process.env.REVENUECAT_API_KEY_IOS ?? null
  if (platform === "android") return process.env.REVENUECAT_API_KEY_ANDROID ?? null
  return null
}

// ─── Plan resolution from RevenueCat entitlements ────────────────────────────
// Given the active entitlement IDs from RevenueCat's CustomerInfo,
// resolve to the canonical PlainPath PlanKey.

export function resolvePlanFromRCEntitlements(
  activeEntitlementIds: string[]
): PlanKey {
  if (activeEntitlementIds.includes(RC_ENTITLEMENT_IDS.pro)) return "pro"
  return "free"
}
