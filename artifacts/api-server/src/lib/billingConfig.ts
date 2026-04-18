// ─── Master Billing Configuration ─────────────────────────────────────────────
//
// LIVE ACTIVATION CHECKLIST (do NOT touch until business bank account
// is approved and Stripe live keys are in the environment):
//
//   1. Add live keys to environment:
//        STRIPE_SECRET_KEY   = sk_live_...
//        STRIPE_WEBHOOK_SECRET = whsec_live_...
//   2. Set BILLING_MODE = "live"
//   3. Set STRIPE_TEST_MODE = false
//   4. Set BILLING_ENABLED = true
//   5. Set PAYWALL_ENFORCEMENT = true  ← this activates tool gating
//
// Nothing else in the codebase needs to change for go-live.
// All activation points reference this file.
//
// ─────────────────────────────────────────────────────────────────────────────

export const BILLING_CONFIG = {
  // Master switch. When false, billing endpoints operate in passive/test mode.
  // TODO: Set to true when Stripe live keys are active.
  BILLING_ENABLED: false,

  // "test"  → Stripe test mode (no real charges, use sk_test_... keys)
  // "live"  → Production mode (real charges, use sk_live_... keys)
  // TODO: Switch to "live" when business account is approved.
  BILLING_MODE: "test" as "test" | "live",

  // When false: all users can use all tools regardless of plan.
  // When true:  tools are gated by the subscriber's plan.
  // TODO: Set to true once live billing is confirmed working end-to-end.
  PAYWALL_ENFORCEMENT: true,

  // Explicit test-mode guard. Should stay true until go-live.
  STRIPE_TEST_MODE: true,
} as const

export type BillingMode = typeof BILLING_CONFIG.BILLING_MODE
