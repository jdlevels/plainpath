// ─── Master Billing Configuration ─────────────────────────────────────────────
//
// LIVE MODE — activated for controlled soft launch.
//
// Required secrets in environment:
//   STRIPE_SECRET_KEY      = sk_live_...
//   STRIPE_WEBHOOK_SECRET  = whsec_...
//
// To revert to test mode:
//   BILLING_ENABLED: false
//   BILLING_MODE: "test"
//   STRIPE_TEST_MODE: true
//
// ─────────────────────────────────────────────────────────────────────────────

export const BILLING_CONFIG = {
  // Master switch. When true, live Stripe billing is active.
  BILLING_ENABLED: true,

  // "live" → Production mode (real charges, sk_live_... keys required)
  // "test" → Stripe test mode (no real charges, sk_test_... keys)
  BILLING_MODE: "live" as "test" | "live",

  // When true: tools are gated by the subscriber's active plan.
  // Free users: 2 analyses/month. Starter: analyze+redact. Pro: all 5 tools.
  PAYWALL_ENFORCEMENT: true,

  // Explicit live-mode confirmation. Set to true only when using test keys.
  STRIPE_TEST_MODE: false,
} as const

export type BillingMode = typeof BILLING_CONFIG.BILLING_MODE
