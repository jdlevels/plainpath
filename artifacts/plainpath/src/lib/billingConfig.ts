// ─── Client-side Billing Configuration ────────────────────────────────────────
//
// Mirrors artifacts/api-server/src/lib/billingConfig.ts exactly.
// LIVE MODE — activated for controlled soft launch.
//
// To revert to test mode:
//   BILLING_ENABLED: false
//   BILLING_MODE: "test"
//   STRIPE_TEST_MODE: true
//
// ─────────────────────────────────────────────────────────────────────────────

export const BILLING_CONFIG = {
  // Master billing switch. When true, live checkout buttons are shown.
  BILLING_ENABLED: true,

  // "live" → Production mode (real charges)
  // "test" → Stripe test mode (Stripe test clock, no real charges)
  BILLING_MODE: "live" as "test" | "live",

  // When true: tools are gated by the user's active subscription plan.
  // Free: 2 analyses/month. Starter: analyze+redact. Pro: all 5 tools.
  PAYWALL_ENFORCEMENT: true,

  // Explicit live-mode guard. Set to true only when using test keys.
  STRIPE_TEST_MODE: false,
} as const

export type BillingMode = typeof BILLING_CONFIG.BILLING_MODE

/** True during test/pre-launch period — no real charges occur. */
export const isTestMode = BILLING_CONFIG.BILLING_MODE === "test"

/** Whether to show paywall UI to users. */
export const isPaywallActive = BILLING_CONFIG.PAYWALL_ENFORCEMENT
