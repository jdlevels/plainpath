import { Router } from "express"
import Stripe from "stripe"
import { stripe } from "../lib/stripe"
import {
  getSubscriberByCustomerId,
  getSubscriberByEmail,
  getSubscriberBySubscriptionId,
  upsertSubscriber,
} from "../lib/billingDb"
import { BILLING_CONFIG } from "../lib/billingConfig"

const router = Router()

const APP_BASE_URL = process.env.APP_BASE_URL || "https://plainpathapp.com/app"
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

type PlanKey = "starter" | "pro"

// ─── Plan → Stripe product config ────────────────────────────────────────────
// These create inline products in Stripe checkout.
// NOTE: Pro is $19.99/month (1999 cents). Starter is $4.99/month (499 cents).
const PLAN_CONFIG: Record<PlanKey, { name: string; amount: number; description: string }> = {
  starter: {
    name: "PlainPath Starter",
    amount: 499,
    description: "Unlimited document analyses — plain English breakdowns, any time.",
  },
  pro: {
    name: "PlainPath Pro",
    amount: 1999, // $19.99/month
    description: "All six tools: Analyze, Trust Check, Contract Builder, Fair Deal Check, Redact Sensitive Info, and Digital Signature.",
  },
}

function isPlanKey(value: unknown): value is PlanKey {
  return value === "starter" || value === "pro"
}

function toIsoFromUnix(unixSeconds?: number | null): string | null {
  if (!unixSeconds) return null
  return new Date(unixSeconds * 1000).toISOString()
}

/** Returns true only when a live Stripe key is present. */
function isStripeReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

// ─── Create Checkout Session ──────────────────────────────────────────────────

router.post("/create-checkout-session", async (req, res) => {
  // TODO: remove this guard when STRIPE_SECRET_KEY is added for go-live
  if (!isStripeReady()) {
    return res.status(503).json({ error: "Stripe is not configured. Billing is in test mode — no real charges possible." })
  }

  try {
    const { plan, email } = req.body as { plan?: string; email?: string }

    if (!isPlanKey(plan)) {
      return res.status(400).json({ error: "Invalid plan. Must be 'starter' or 'pro'." })
    }

    const selectedPlan = PLAN_CONFIG[plan]
    const billingMode = BILLING_CONFIG.BILLING_MODE

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${APP_BASE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/subscribe/cancel`,
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount,
          },
        },
      ],
      metadata: { plan, billingMode },
      subscription_data: { metadata: { plan, billingMode } },
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return res.status(500).json({ error: "No checkout URL returned from Stripe" })
    }

    return res.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout session error:", error)
    return res.status(500).json({ error: "Unable to create checkout session" })
  }
})

// ─── Checkout Session Status ──────────────────────────────────────────────────

router.get("/checkout-session-status", async (req, res) => {
  // TODO: remove this guard when STRIPE_SECRET_KEY is added for go-live
  if (!isStripeReady()) {
    return res.status(503).json({ error: "Stripe is not configured." })
  }
  try {
    const sessionId = req.query.session_id
    if (typeof sessionId !== "string") {
      return res.status(400).json({ error: "Missing session_id" })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    })

    return res.json({
      id: session.id,
      customer_email: session.customer_details?.email || null,
      payment_status: session.payment_status,
      status: session.status,
      metadata: session.metadata,
    })
  } catch (error) {
    console.error("Stripe checkout session status error:", error)
    return res.status(500).json({ error: "Unable to retrieve session" })
  }
})

// ─── Billing Portal ───────────────────────────────────────────────────────────

router.post("/billing-portal", async (req, res) => {
  // TODO: remove this guard when STRIPE_SECRET_KEY is added for go-live
  if (!isStripeReady()) {
    return res.status(503).json({ error: "Stripe is not configured. Billing is in test mode." })
  }
  try {
    const { email } = req.body as { email?: string }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Missing email" })
    }

    const subscriber = getSubscriberByEmail(email.toLowerCase().trim())

    if (!subscriber?.stripeCustomerId) {
      return res.status(404).json({
        error: "No Stripe customer found for this email. Please subscribe first.",
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscriber.stripeCustomerId,
      return_url: `${APP_BASE_URL}/billing`,
    })

    return res.json({ url: session.url })
  } catch (error) {
    console.error("Stripe billing portal error:", error)
    return res.status(500).json({ error: "Unable to open billing portal" })
  }
})

// ─── Subscriber Status (quick lookup, no entitlement details) ─────────────────

router.get("/subscriber-status", (req, res) => {
  try {
    const email = req.query.email
    if (typeof email !== "string") {
      return res.status(400).json({ error: "Missing email" })
    }

    const subscriber = getSubscriberByEmail(email.toLowerCase().trim())

    if (!subscriber) {
      return res.json({ found: false, plan: null, status: "inactive" })
    }

    return res.json({
      found: true,
      email: subscriber.email,
      plan: subscriber.plan,
      status: subscriber.status,
      currentPeriodEnd: subscriber.currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(subscriber.cancelAtPeriodEnd),
      billingMode: subscriber.billingMode,
      billingProvider: subscriber.billingProvider,
    })
  } catch (error) {
    console.error("Subscriber status error:", error)
    return res.status(500).json({ error: "Unable to read subscriber status" })
  }
})

// ─── Webhook ──────────────────────────────────────────────────────────────────
// Handles all Stripe events and keeps the local billing DB in sync.
// Raw body parsing is required for signature verification (configured in app.ts).

router.post("/webhook", async (req: any, res) => {
  try {
    // TODO: Remove this guard when STRIPE_WEBHOOK_SECRET is added for go-live
    if (!WEBHOOK_SECRET) {
      console.warn("STRIPE_WEBHOOK_SECRET not set — webhook rejected (test mode)")
      return res.status(400).send("Webhook not configured")
    }

    const signature = req.headers["stripe-signature"]
    if (!signature || typeof signature !== "string") {
      return res.status(400).send("Missing Stripe signature")
    }

    const event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET)
    const billingMode = BILLING_CONFIG.BILLING_MODE

    switch (event.type) {
      // ── Checkout completed: initial subscription creation ─────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const email =
          session.customer_details?.email?.toLowerCase().trim() ||
          session.customer_email?.toLowerCase().trim()

        const plan = session.metadata?.plan || "starter"
        const sessionBillingMode = session.metadata?.billingMode || billingMode

        if (email && isPlanKey(plan)) {
          upsertSubscriber({
            email,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            stripeCheckoutSessionId: session.id,
            plan,
            status: "active",
            billingMode: sessionBillingMode,
            billingProvider: "stripe",
          })
        }
        break
      }

      // ── Subscription created or updated ───────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null

        let subscriber = customerId
          ? getSubscriberByCustomerId(customerId)
          : undefined

        let email = subscriber?.email ?? null

        if (!email && customerId) {
          const customer = await stripe.customers.retrieve(customerId)
          if (!("deleted" in customer)) {
            email = customer.email?.toLowerCase().trim() || null
          }
        }

        const plan =
          subscription.metadata?.plan ||
          subscription.items.data[0]?.price?.nickname?.toLowerCase() ||
          "starter"

        const subBillingMode = subscription.metadata?.billingMode || billingMode

        if (email) {
          upsertSubscriber({
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            plan: isPlanKey(plan) ? plan : "starter",
            status: subscription.status,
            currentPeriodStart: toIsoFromUnix(
              (subscription as any).current_period_start
            ),
            currentPeriodEnd: toIsoFromUnix(
              (subscription as any).current_period_end
            ),
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            billingMode: subBillingMode,
            billingProvider: "stripe",
          })
        }
        break
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const existing = getSubscriberBySubscriptionId(subscription.id)

        if (existing) {
          upsertSubscriber({
            email: existing.email,
            stripeCustomerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : existing.stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            plan: existing.plan,
            status: "canceled",
            currentPeriodEnd: toIsoFromUnix(
              (subscription as any).current_period_end
            ),
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            billingMode: existing.billingMode,
            billingProvider: "stripe",
          })
        }
        break
      }

      // ── Invoice paid: subscription renewed ───────────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice

        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : null
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : null

        let subscriber =
          customerId ? getSubscriberByCustomerId(customerId) : undefined

        if (!subscriber && subscriptionId) {
          subscriber = getSubscriberBySubscriptionId(subscriptionId)
        }

        if (subscriber) {
          // Re-activate in case of past_due → paid recovery
          upsertSubscriber({
            email: subscriber.email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: subscriber.plan,
            status: "active",
            billingMode: subscriber.billingMode,
            billingProvider: "stripe",
          })
        }
        break
      }

      // ── Invoice payment failed: mark past_due ─────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : null
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : null

        let subscriber =
          customerId ? getSubscriberByCustomerId(customerId) : undefined

        if (!subscriber && subscriptionId) {
          subscriber = getSubscriberBySubscriptionId(subscriptionId)
        }

        if (subscriber) {
          upsertSubscriber({
            email: subscriber.email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: subscriber.plan,
            status: "past_due",
            billingMode: subscriber.billingMode,
            billingProvider: "stripe",
          })
          console.warn(`Payment failed for subscriber: ${subscriber.email}`)
        }
        break
      }

      default:
        break
    }

    return res.json({ received: true })
  } catch (error: any) {
    console.error("Stripe webhook error:", error?.message || error)
    return res.status(400).send(`Webhook Error: ${error?.message || "Unknown error"}`)
  }
})

export default router
