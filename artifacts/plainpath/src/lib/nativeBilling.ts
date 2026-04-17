// ─── Native Billing Layer (Client-Side) ───────────────────────────────────────
//
// Platform-agnostic billing interface for the Capacitor native apps.
//
// ROUTING:
//   Web     → does nothing (Stripe web checkout handles this path)
//   iOS     → RevenueCat SDK → Apple StoreKit
//   Android → RevenueCat SDK → Google Play Billing
//
// ACTIVATION (do not activate until RevenueCat account is set up):
//
//   1. Install SDK:  pnpm --filter @workspace/plainpath add @revenuecat/purchases-capacitor
//   2. In Capacitor app initialization (App.tsx or capacitor.config.ts):
//        import { Purchases } from "@revenuecat/purchases-capacitor"
//        await Purchases.configure({ apiKey: RC_PUBLIC_KEY_IOS_OR_ANDROID })
//   3. Set VITE_REVENUECAT_PUBLIC_KEY_IOS and VITE_REVENUECAT_PUBLIC_KEY_ANDROID
//      in environment (these are PUBLIC keys, safe to expose to client)
//   4. Uncomment the Purchases SDK calls below (marked with TODO: ACTIVATE)
//   5. In billingProvider.ts (server): set storekit.active = true / play_billing.active = true
//   6. Wire purchaseNativePlan() into the Billing.tsx upgrade CTA when isNative() === true
//   7. Wire restoreNativePurchases() into the Billing.tsx restore button when isNative() === true
//
// ─────────────────────────────────────────────────────────────────────────────

import { getPlatform } from "@/lib/platform"

export type PlanKey = "starter" | "pro"
export type NativePlatform = "ios" | "android"

// ─── Product ID Maps ──────────────────────────────────────────────────────────
// Must match App Store Connect and Google Play Console exactly.

export const NATIVE_PRODUCT_IDS: Record<NativePlatform, Record<PlanKey, string>> = {
  ios: {
    starter: "plainpath_starter_monthly",
    pro: "plainpath_pro_monthly",
  },
  android: {
    starter: "plainpath_starter_monthly",
    pro: "plainpath_pro_monthly",
  },
}

// ─── RevenueCat Entitlement IDs ───────────────────────────────────────────────
// Must match the entitlement IDs set in the RevenueCat dashboard exactly.

export const RC_ENTITLEMENT_IDS: Record<PlanKey, string> = {
  starter: "starter",
  pro: "pro",
}

// ─── State Type ───────────────────────────────────────────────────────────────

export type NativeEntitlementResult = {
  platform: NativePlatform | "web"
  plan: PlanKey
  isActive: boolean
  expiresAt: string | null
  productId: string | null
  provider: "storekit" | "play_billing" | "web"
}

// ─── Check Native Entitlements ────────────────────────────────────────────────
// Returns the user's current plan based on their active native subscription.
// On web: returns null (caller should use web Stripe entitlements instead).

export async function checkNativeEntitlements(): Promise<NativeEntitlementResult | null> {
  const platform = getPlatform()
  if (platform === "web") return null

  // TODO: ACTIVATE — Uncomment when RevenueCat SDK is installed and configured.
  //
  // import { Purchases } from "@revenuecat/purchases-capacitor"
  // const customerInfo = await Purchases.getCustomerInfo()
  // const entitlements = customerInfo.customerInfo.entitlements.active
  //
  // if (entitlements[RC_ENTITLEMENT_IDS.pro]) {
  //   const ent = entitlements[RC_ENTITLEMENT_IDS.pro]
  //   return {
  //     platform,
  //     plan: "pro",
  //     isActive: true,
  //     expiresAt: ent.expirationDate ?? null,
  //     productId: ent.productIdentifier,
  //     provider: platform === "ios" ? "storekit" : "play_billing",
  //   }
  // }
  // if (entitlements[RC_ENTITLEMENT_IDS.starter]) {
  //   const ent = entitlements[RC_ENTITLEMENT_IDS.starter]
  //   return {
  //     platform,
  //     plan: "starter",
  //     isActive: true,
  //     expiresAt: ent.expirationDate ?? null,
  //     productId: ent.productIdentifier,
  //     provider: platform === "ios" ? "storekit" : "play_billing",
  //   }
  // }
  // return { platform, plan: "starter", isActive: false, expiresAt: null, productId: null, provider: platform === "ios" ? "storekit" : "play_billing" }

  // Stub: no native billing active yet. Fall through to web entitlements.
  return null
}

// ─── Purchase Native Plan ─────────────────────────────────────────────────────
// Triggers the native purchase flow for the given plan.
// On web: no-op — Stripe checkout handles this path.

export async function purchaseNativePlan(plan: PlanKey): Promise<{
  success: boolean
  plan?: PlanKey
  error?: string
}> {
  const platform = getPlatform()
  if (platform === "web") {
    return { success: false, error: "Native billing not available on web" }
  }

  // TODO: ACTIVATE — Uncomment when RevenueCat SDK is installed and configured.
  //
  // import { Purchases } from "@revenuecat/purchases-capacitor"
  // const productId = NATIVE_PRODUCT_IDS[platform][plan]
  // try {
  //   const offerings = await Purchases.getOfferings()
  //   const current = offerings.offerings.current
  //   if (!current) return { success: false, error: "No offerings available" }
  //
  //   const pkg = current.availablePackages.find(
  //     (p) => p.storeProduct.productIdentifier === productId
  //   )
  //   if (!pkg) return { success: false, error: `Product ${productId} not found` }
  //
  //   const result = await Purchases.purchasePackage({ aPackage: pkg })
  //   const active = result.customerInfo.entitlements.active
  //   const resolvedPlan = active[RC_ENTITLEMENT_IDS.pro]
  //     ? "pro" : active[RC_ENTITLEMENT_IDS.starter]
  //     ? "starter" : undefined
  //
  //   return { success: true, plan: resolvedPlan }
  // } catch (err: any) {
  //   if (err.code === "PURCHASE_CANCELLED") return { success: false, error: "Purchase cancelled" }
  //   return { success: false, error: err.message ?? "Purchase failed" }
  // }

  return { success: false, error: "Native billing not yet activated" }
}

// ─── Restore Native Purchases ─────────────────────────────────────────────────
// Restores previously purchased subscriptions.
// Required by Apple App Store guidelines — must be accessible in the UI.

export async function restoreNativePurchases(): Promise<{
  success: boolean
  plan?: PlanKey
  error?: string
}> {
  const platform = getPlatform()
  if (platform === "web") {
    return { success: false, error: "Native billing not available on web" }
  }

  // TODO: ACTIVATE — Uncomment when RevenueCat SDK is installed and configured.
  //
  // import { Purchases } from "@revenuecat/purchases-capacitor"
  // try {
  //   const result = await Purchases.restorePurchases()
  //   const active = result.customerInfo.entitlements.active
  //   const plan = active[RC_ENTITLEMENT_IDS.pro]
  //     ? "pro" : active[RC_ENTITLEMENT_IDS.starter]
  //     ? "starter" : undefined
  //   return { success: true, plan }
  // } catch (err: any) {
  //   return { success: false, error: err.message ?? "Restore failed" }
  // }

  return { success: false, error: "Native billing not yet activated" }
}

// ─── Configure RevenueCat SDK ─────────────────────────────────────────────────
// Call this once on native app startup (e.g., in App.tsx initStatusBar block).
// On web: no-op.

export async function configureRevenueCat(): Promise<void> {
  const platform = getPlatform()
  if (platform === "web") return

  // TODO: ACTIVATE — Uncomment when RevenueCat SDK is installed and configured.
  //
  // import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor"
  // const apiKey = platform === "ios"
  //   ? import.meta.env.VITE_REVENUECAT_PUBLIC_KEY_IOS
  //   : import.meta.env.VITE_REVENUECAT_PUBLIC_KEY_ANDROID
  //
  // if (!apiKey) {
  //   console.warn("[RevenueCat] Missing public API key — native billing disabled")
  //   return
  // }
  //
  // await Purchases.configure({ apiKey })
  // if (import.meta.env.DEV) {
  //   await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
  // }
}
