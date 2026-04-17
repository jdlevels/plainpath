// ─── Billing Provider Abstraction ─────────────────────────────────────────────
//
// PlainPath supports three billing providers:
//
//   stripe       — Web (currently active, test mode)
//   storekit     — iOS / Apple In-App Purchase (placeholder, not yet built)
//   play_billing — Android / Google Play Billing (placeholder, not yet built)
//
// All plan and entitlement logic should flow through this module so that
// platform-specific billing never bleeds into product logic.  When building
// native apps, replace the placeholder `active: false` entries with real
// StoreKit / Play Billing SDK integrations.
//
// ─────────────────────────────────────────────────────────────────────────────

export type BillingProvider = "stripe" | "storekit" | "play_billing"

export type ProviderConfig = {
  provider: BillingProvider
  displayName: string
  /** Whether a real implementation exists and is wired up */
  active: boolean
  /** Operating in test / sandbox mode */
  testMode: boolean
}

// ─── Provider Registry ────────────────────────────────────────────────────────

export const BILLING_PROVIDERS: Record<BillingProvider, ProviderConfig> = {
  stripe: {
    provider: "stripe",
    displayName: "Stripe",
    active: true,
    testMode: true, // TODO: Set to false when going live
  },
  storekit: {
    provider: "storekit",
    displayName: "Apple In-App Purchase",
    active: false, // TODO: Implement when building iOS native app (RevenueCat recommended)
    testMode: true,
  },
  play_billing: {
    provider: "play_billing",
    displayName: "Google Play Billing",
    active: false, // TODO: Implement when building Android native app (RevenueCat recommended)
    testMode: true,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getProviderConfig(
  provider?: BillingProvider | null
): ProviderConfig {
  return BILLING_PROVIDERS[provider ?? "stripe"] ?? BILLING_PROVIDERS.stripe
}

export function isProviderTestMode(
  provider: BillingProvider = "stripe"
): boolean {
  return BILLING_PROVIDERS[provider]?.testMode ?? true
}
