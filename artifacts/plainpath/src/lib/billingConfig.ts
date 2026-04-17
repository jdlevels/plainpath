// ─── Client-side Billing Configuration ────────────────────────────────────────
//
// Mirrors the server-side BILLING_CONFIG in artifacts/api-server/src/lib/billingConfig.ts
// These values control what the frontend shows and how it behaves.
//
// LIVE ACTIVATION CHECKLIST (do NOT touch until business bank is approved):
//
//   1. Set BILLING_ENABLED = true
//   2. Set BILLING_MODE = "live"
//   3. Set PAYWALL_ENFORCEMENT = true  ← activates tool gating in analysisGate.ts
//   4. Set STRIPE_TEST_MODE = false
//   5. Remove test-mode banners from Billing.tsx
//
// ─────────────────────────────────────────────────────────────────────────────

export const BILLING_CONFIG = {
  // Master billing switch. When false, no charges occur and access is open.
  // TODO: Set to true once Stripe live keys are confirmed working.
  BILLING_ENABLED: false,

  // "test"  → Stripe test mode (Stripe test clock, no real charges)
  // "live"  → Production mode (real charges)
  // TODO: Switch to "live" when business bank account is approved.
  BILLING_MODE: "test" as "test" | "live",

  // When false: all tools work regardless of plan (testing / launch window).
  // When true:  tools are gated by the user's active subscription plan.
  // TODO: Set to true after live billing is confirmed end-to-end.
  PAYWALL_ENFORCEMENT: false,

  // Explicit Stripe test-mode guard.
  STRIPE_TEST_MODE: true,
} as const

export type BillingMode = typeof BILLING_CONFIG.BILLING_MODE

/** True during test/pre-launch period — no real charges occur. */
export const isTestMode = BILLING_CONFIG.BILLING_MODE === "test"

/** Whether to show paywall UI to users. */
export const isPaywallActive = BILLING_CONFIG.PAYWALL_ENFORCEMENT
