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
// Post-purchase sync:
//   After a successful purchase or restore the client POSTs to
//   /api/entitlements/native-verify. The server re-verifies with the RevenueCat
//   REST API and writes an active subscriber row to the billing DB so the
//   standard useEntitlements hook sees Pro access immediately.
//
// ─────────────────────────────────────────────────────────────────────────────

import { getPlatform } from "@/lib/platform"
import { getApiBaseUrl } from "@/lib/api"
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

// ─── Module-level identity cache ──────────────────────────────────────────────
// Set by configureRevenueCat() so purchase/restore can reference it when
// building the native-verify request body without needing a prop-drilled userId.

let _configuredUserId: string | null = null

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

  // Cache for use in purchase/restore verify calls
  _configuredUserId = userId

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

// ─── Internal: Call native-verify endpoint ────────────────────────────────────
// Fires after a successful purchase or restore. Asks the server to re-verify
// the subscriber with the RevenueCat REST API and write an active billing row
// to the DB, so useEntitlements immediately reflects Pro access.
//
// Failures are logged but never surface to the user — the purchase or restore
// already succeeded in RevenueCat's eyes. The DB row will be created on the
// next successful verification attempt (e.g. next app launch or restore).

async function callNativeVerify(
  platform: NativePlatform,
  rcUserId: string,
  activeEntitlements: string[],
  getToken: (() => Promise<string | null>) | undefined,
): Promise<void> {
  try {
    const token = getToken ? await getToken().catch(() => null) : null
    const apiBase = getApiBaseUrl()

    const res = await fetch(`${apiBase}/api/entitlements/native-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ platform, rcUserId, activeEntitlements }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.warn("[RevenueCat] native-verify non-OK:", res.status, body)
    } else {
      console.info("[RevenueCat] native-verify: billing DB synced", await res.json())
    }
  } catch (err) {
    console.warn("[RevenueCat] native-verify network error — DB sync deferred:", err)
  }
}

// ─── Purchase Native Plan ─────────────────────────────────────────────────────
// Triggers the native purchase flow for PlainPath Pro via RevenueCat/StoreKit.
// configureRevenueCat(userId) must be called before this function.
// On web: no-op.
//
// getToken — pass the Clerk getToken function so the verify call is authenticated.

export async function purchaseNativePlan(
  plan: PlanKey,
  getToken?: () => Promise<string | null>,
): Promise<{
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

    // Sync purchase to billing DB via server-side RevenueCat verification.
    // Fire-and-forget — purchase is already confirmed; DB sync is best-effort.
    if (_configuredUserId) {
      const activeEntitlementIds = Object.keys(active)
      void callNativeVerify(platform, _configuredUserId, activeEntitlementIds, getToken)
    }

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
//
// getToken — pass the Clerk getToken function so the verify call is authenticated.

export async function restoreNativePurchases(
  getToken?: () => Promise<string | null>,
): Promise<{
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

    // Sync restored subscription to billing DB.
    if (_configuredUserId) {
      const activeEntitlementIds = Object.keys(active)
      void callNativeVerify(platform, _configuredUserId, activeEntitlementIds, getToken)
    }

    return { success: true, plan }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Restore failed"
    return { success: false, error: message }
  }
}
