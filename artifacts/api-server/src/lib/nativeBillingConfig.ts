// ─── Native Billing Configuration ─────────────────────────────────────────────
//
// RevenueCat product ID and entitlement mappings for iOS and Android.
//
// ARCHITECTURE:
//   Web      → Stripe (stripe.ts routes)
//   iOS      → RevenueCat SDK → Apple StoreKit → plainpath-starter / plainpath-pro
//   Android  → RevenueCat SDK → Google Play Billing → plainpath_starter / plainpath_pro
//
// ACTIVATION STEPS (do not activate until bank account approved + stores registered):
//
//   1. Create a RevenueCat account at https://www.revenuecat.com
//   2. Create one Project: "PlainPath"
//   3. Add iOS app (Bundle ID: com.plainpath.app) and Android app (com.plainpath.app)
//   4. Create products in App Store Connect and Google Play Console (see PRODUCTS below)
//   5. Create entitlements in RevenueCat: "starter" and "pro"
//   6. Map products → entitlements in RevenueCat dashboard
//   7. Set REVENUECAT_API_KEY_IOS and REVENUECAT_API_KEY_ANDROID in environment
//   8. In billingProvider.ts: set storekit.active = true, play_billing.active = true
//   9. In Capacitor app: install @revenuecat/purchases-capacitor, call Purchases.configure()
//  10. Route Purchases.getCustomerInfo() results through nativeBilling.ts (client) and
//      POST /api/entitlements/native-verify (server) to sync with billing DB
//
// ─────────────────────────────────────────────────────────────────────────────

import type { PlanKey } from "./planEntitlements"

// ─── RevenueCat Entitlement IDs ───────────────────────────────────────────────
// These must match exactly what is set in the RevenueCat dashboard.

export const RC_ENTITLEMENT_IDS: Record<PlanKey, string> = {
  starter: "starter",
  pro: "pro",
}

// ─── Apple App Store Product IDs ──────────────────────────────────────────────
// Create these in App Store Connect → My Apps → In-App Purchases.
// Type: Auto-Renewable Subscription
// Subscription Group: "PlainPath" (create one group for both)

export const IOS_PRODUCT_IDS: Record<PlanKey, string> = {
  starter: "plainpath_starter_monthly",  // $4.99/month — must match App Store Connect
  pro: "plainpath_pro_monthly",           // $19.99/month — must match App Store Connect
}

// ─── Google Play Product IDs ──────────────────────────────────────────────────
// Create these in Google Play Console → Monetize → Subscriptions.
// Create one base plan per product, monthly billing period.

export const ANDROID_PRODUCT_IDS: Record<PlanKey, string> = {
  starter: "plainpath_starter_monthly",  // $4.99/month — must match Play Console
  pro: "plainpath_pro_monthly",           // $19.99/month — must match Play Console
}

// ─── RevenueCat Offering IDs ──────────────────────────────────────────────────
// RevenueCat "Offerings" are the named groupings of packages shown to users.
// Create in RevenueCat dashboard → Offerings.

export const RC_OFFERING_ID = "default"

// ─── RevenueCat Package IDs ───────────────────────────────────────────────────
// Within an Offering, packages represent individual purchasable items.
// RevenueCat uses $rc_monthly for the standard monthly package identifier.

export const RC_PACKAGE_IDS: Record<PlanKey, string> = {
  starter: "$rc_monthly",  // Maps to starter product within the starter offering
  pro: "$rc_monthly",      // Maps to pro product within the pro offering
}

// ─── RevenueCat API Keys ──────────────────────────────────────────────────────
// Server-side secret keys for receipt verification and customer lookup.
// Set in environment: REVENUECAT_API_KEY_IOS and REVENUECAT_API_KEY_ANDROID
// (Also set the PUBLIC keys in the Capacitor app for SDK initialization)

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
  if (activeEntitlementIds.includes(RC_ENTITLEMENT_IDS.starter)) return "starter"
  return "starter"
}
