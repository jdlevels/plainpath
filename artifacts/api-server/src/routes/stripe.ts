import { Router } from "express"
import Stripe from "stripe"
import { stripe } from "../lib/stripe"
import {
  getSubscriberByCustomerId,
  getSubscriberByEmail,
  getSubscriberBySubscriptionId,
  upsertSubscriber,
} from "../lib/billingDb"

const router = Router()

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000"
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

type PlanKey = "starter" | "pro" | "team"

const PLAN_CONFIG: Record<
  PlanKey,
  {
    name: string
    amount: number
    description: string
  }
> = {
  starter: {
    name: "PlainPath Starter",
    amount: 499,
    description: "Unlimited document analyses",
  },
  pro: {
    name: "PlainPath Pro",
    amount: 2499,
    description: "Unlimited analyses, trust checks, and contract drafts",
  },
  team: {
    name: "PlainPath Team",
    amount: 3999,
    description: "Higher-volume shared workflows",
  },
}

function isPlanKey(value: unknown): value is PlanKey {
  return value === "starter" || value === "pro" || value === "team"
}

function toIsoFromUnix(unixSeconds?: number | null) {
  if (!unixSeconds) return null
  return new Date(unixSeconds * 1000).toISOString()
}

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { plan, email } = req.body as { plan?: string; email?: string }

    if (!isPlanKey(plan)) {
      return res.status(400).json({ error: "Invalid plan" })
    }

    const selectedPlan = PLAN_CONFIG[plan]

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
            recurring: {
              interval: "month",
            },
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount,
          },
        },
      ],
      metadata: {
        plan,
      },
      subscription_data: {
        metadata: {
          plan,
        },
      },
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return res.status(500).json({ error: "No checkout URL returned" })
    }

    return res.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout session error:", error)
    return res.status(500).json({ error: "Unable to create checkout session" })
  }
})

router.get("/checkout-session-status", async (req, res) => {
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

router.post("/billing-portal", async (req, res) => {
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
      return_url: `${APP_BASE_URL}/my-analyses`,
    })

    return res.json({ url: session.url })
  } catch (error) {
    console.error("Stripe billing portal error:", error)
    return res.status(500).json({ error: "Unable to open billing portal" })
  }
})

router.get("/subscriber-status", (req, res) => {
  try {
    const email = req.query.email
    if (typeof email !== "string") {
      return res.status(400).json({ error: "Missing email" })
    }

    const subscriber = getSubscriberByEmail(email.toLowerCase().trim())

    if (!subscriber) {
      return res.json({
        found: false,
        plan: null,
        status: "inactive",
      })
    }

    return res.json({
      found: true,
      email: subscriber.email,
      plan: subscriber.plan,
      status: subscriber.status,
      currentPeriodEnd: subscriber.currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(subscriber.cancelAtPeriodEnd),
    })
  } catch (error) {
    console.error("Subscriber status error:", error)
    return res.status(500).json({ error: "Unable to read subscriber status" })
  }
})

router.post("/webhook", async (req: any, res) => {
  try {
    if (!WEBHOOK_SECRET) {
      return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET")
    }

    const signature = req.headers["stripe-signature"]
    if (!signature || typeof signature !== "string") {
      return res.status(400).send("Missing Stripe signature")
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      WEBHOOK_SECRET
    )

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const email =
          session.customer_details?.email?.toLowerCase().trim() ||
          session.customer_email?.toLowerCase().trim()

        const plan = session.metadata?.plan || "starter"

        if (email) {
          upsertSubscriber({
            email,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            stripeCheckoutSessionId: session.id,
            plan,
            status: "active",
          })
        }

        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : null

        let subscriber =
          customerId ? getSubscriberByCustomerId(customerId) : undefined

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

        if (email) {
          upsertSubscriber({
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            plan,
            status: subscription.status,
            currentPeriodEnd: toIsoFromUnix(
              (subscription as any).current_period_end
            ),
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          })
        }

        break
      }

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
          })
        }

        break
      }

      default:
        break
    }

    return res.json({ received: true })
  } catch (error: any) {
    console.error("Stripe webhook error:", error?.message || error)
    return res
      .status(400)
      .send(`Webhook Error: ${error?.message || "Unknown error"}`)
  }
})

export default router
