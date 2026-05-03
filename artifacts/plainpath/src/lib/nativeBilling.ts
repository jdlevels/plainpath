// ─── Native Billing Layer (Client-Side) ───────────────────────────────────────
//
// Platform-agnostic billing interface for the Capacitor native apps.
//
// ROUTING:
//   Web     → does nothing (Stripe web checkout handles this path)
//   iOS     → RevenueCat SDK → Apple StoreKit → plainpath_pro_monthly
//
// Identity:
//   RevenueCat App User ID = Clerk user ID.
//   configureRevenueCat(userId) must be called after sign-in and before any
//   purchase or restore call. Anonymous purchases are rejected.
//
// Launch model: ONE plan — PlainPath Pro $19.99/month (plainpath_pro entitlement)
//
// ─────────────────────────────────────────────────────────────────────────────

import { getPlatform } from "@/lib/platform"
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor"

export type PlanKey = "pro"
export type NativePlatform = "ios" | "android"

// ─── Product ID Maps ──────────────────────────────────────────────────────────
// Must match App Store Connect exactly.

export const NATIVE_PRODUCT_IDS: Record<NativePlatform, Record<PlanKey, string>> = {
  ios: {
    pro: "plainpath_pro_monthly",
  },
  android: {
    pro: "plainpath_pro_monthly",
  },
}

// ─── RevenueCat Entitlement IDs ───────────────────────────────────────────────
// Must match the entitlement IDs set in the RevenueCat dashboard exactly.

export const RC_ENTITLEMENT_IDS: Record<PlanKey, string> = {
  pro: "plainpath_pro",
}

// ─── State Type ───────────────────────────────────────────────────────────────

export type NativeEntitlementResult = {
  platform: NativePlatform | "web"
  plan: PlanKey | null
  isActive: boolean
  expiresAt: string | null
  productId: string | null
  provider: "storekit" | "play_billing" | "web"
}

// ─── Configure RevenueCat SDK ─────────────────────────────────────────────────
// Call once on native app startup, after the user is signed in.
// Passes the Clerk user ID as the RevenueCat App User ID — prevents
// anonymous purchases and ensures cross-platform entitlement sync.
// On web: no-op.

export async function configureRevenueCat(userId: string): Promise<void> {
  const platform = getPlatform()
  if (platform === "web") return

  if (!userId) {
    console.warn("[RevenueCat] No user ID provided — skipping SDK configuration")
    return
  }

  const apiKey =
    platform === "ios"
      ? import.meta.env.VITE_REVENUECAT_PUBLIC_KEY_IOS
      : import.meta.env.VITE_REVENUECAT_PUBLIC_KEY_ANDROID

  if (!apiKey) {
    console.warn("[RevenueCat] Missing public API key — native billing disabled")
    return
  }

  await Purchases.configure({ apiKey })
  await Purchases.logIn({ appUserID: userId })

  if (import.meta.env.DEV) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
  }
}

// ─── Check Native Entitlements ────────────────────────────────────────────────
// Returns the user's current plan based on their active native subscription.
// On web: returns null (caller should use web Stripe entitlements instead).

export async function checkNativeEntitlements(): Promise<NativeEntitlementResult | null> {
  const platform = getPlatform()
  if (platform === "web") return null

  const { customerInfo } = await Purchases.getCustomerInfo()
  const entitlements = customerInfo.entitlements.active

  if (entitlements[RC_ENTITLEMENT_IDS.pro]) {
    const ent = entitlements[RC_ENTITLEMENT_IDS.pro]
    return {
      platform,
      plan: "pro",
      isActive: true,
      expiresAt: ent.expirationDate ?? null,
      productId: ent.productIdentifier,
      provider: platform === "ios" ? "storekit" : "play_billing",
    }
  }

  return {
    platform,
    plan: null,
    isActive: false,
    expiresAt: null,
    productId: null,
    provider: platform === "ios" ? "storekit" : "play_billing",
  }
}

// ─── Purchase Native Plan ─────────────────────────────────────────────────────
// Triggers the native purchase flow for PlainPath Pro via RevenueCat/StoreKit.
// configureRevenueCat(userId) must be called before this function.
// On web: no-op.

export async function purchaseNativePlan(plan: PlanKey): Promise<{
  success: boolean
  plan?: PlanKey
  error?: string
}> {
  const platform = getPlatform()
  if (platform === "web") {
    return { success: false, error: "Native billing not available on web" }
  }

  const productId = NATIVE_PRODUCT_IDS[platform][plan]
  try {
    const offerings = await Purchases.getOfferings()
    const current = offerings.offerings.current
    if (!current) return { success: false, error: "No offerings available" }

    const pkg = current.availablePackages.find(
      (p) => p.storeProduct.productIdentifier === productId
    )
    if (!pkg) return { success: false, error: `Product ${productId} not found in current offering` }

    const result = await Purchases.purchasePackage({ aPackage: pkg })
    const active = result.customerInfo.entitlements.active
    const resolvedPlan: PlanKey | undefined = active[RC_ENTITLEMENT_IDS.pro]
      ? "pro"
      : undefined

    return { success: true, plan: resolvedPlan }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "PURCHASE_CANCELLED"
    ) {
      return { success: false, error: "Purchase cancelled" }
    }
    const message = err instanceof Error ? err.message : "Purchase failed"
    return { success: false, error: message }
  }
}

// ─── Restore Native Purchases ─────────────────────────────────────────────────
// Restores previously purchased subscriptions via RevenueCat.
// Required by Apple App Store guidelines — must be accessible in the UI.
// configureRevenueCat(userId) must be called before this function.
// On web: no-op.

export async function restoreNativePurchases(): Promise<{
  success: boolean
  plan?: PlanKey
  error?: string
}> {
  const platform = getPlatform()
  if (platform === "web") {
    return { success: false, error: "Native billing not available on web" }
  }

  try {
    const result = await Purchases.restorePurchases()
    const active = result.customerInfo.entitlements.active
    const plan: PlanKey | undefined = active[RC_ENTITLEMENT_IDS.pro]
      ? "pro"
      : undefined
    return { success: true, plan }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Restore failed"
    return { success: false, error: message }
  }
}
