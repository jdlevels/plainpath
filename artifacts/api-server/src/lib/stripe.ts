import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY — add it to your environment secrets before using Stripe routes.")
  }

  _stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" })
  return _stripe
}
