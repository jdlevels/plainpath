// ─── Master Billing Configuration ─────────────────────────────────────────────
//
// LIVE MODE — activated for controlled soft launch.
//
// Required secrets in environment:
//   STRIPE_SECRET_KEY  = sk_live_...   (via Replit Stripe integration)
//
// NOTE: STRIPE_WEBHOOK_SECRET is NOT a required environment variable.
// The webhook signing secret is managed by the stripe-replit-sync package.
// On startup, initStripe() calls findOrCreateManagedWebhook() which registers
// the webhook with Stripe and stores the signing secret in the
// stripe._managed_webhooks table. The secret is then loaded into memory via
// setWebhookSecret(). No manual whsec_... env var is needed or used.
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
  // Free users: 2 analyses/month. Starter: analyze+redact. Pro: all tools.
  PAYWALL_ENFORCEMENT: true,

  // Explicit live-mode confirmation. Set to true only when using test keys.
  STRIPE_TEST_MODE: false,
} as const

export type BillingMode = typeof BILLING_CONFIG.BILLING_MODE
