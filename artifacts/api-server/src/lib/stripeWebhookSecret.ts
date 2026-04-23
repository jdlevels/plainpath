// In-memory holder for the Stripe webhook signing secret.
//
// This secret is NOT sourced from an environment variable (STRIPE_WEBHOOK_SECRET
// is not required and not used). Instead, on server startup initStripe() in
// index.ts calls stripe-replit-sync's findOrCreateManagedWebhook(), which
// registers the /api/stripe/webhook endpoint with Stripe and stores the returned
// signing secret in stripe._managed_webhooks. That row is then read and passed
// to setWebhookSecret() below. If the DB row is missing, webhooks are safely
// rejected with a 400 ("Webhook not configured") until the next startup.

let _secret: string | null = null

export function setWebhookSecret(secret: string): void {
  _secret = secret
}

export function getWebhookSecret(): string | null {
  return _secret
}
