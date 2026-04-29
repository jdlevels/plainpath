import { Router } from "express"
import Stripe from "stripe"
import { getAuth, clerkClient } from "@clerk/express"
import { getStripeClient, isStripeAvailable } from "../lib/stripe"
import { getWebhookSecret } from "../lib/stripeWebhookSecret"
import {
  getSubscriberByClerkUserId,
  getSubscriberByCustomerId,
  getSubscriberByEmail,
  getSubscriberBySubscriptionId,
  hasProcessedEvent,
  isSubscriptionCanceled,
  markEventProcessed,
  markSubscriptionCanceled,
  upsertSubscriber,
} from "../lib/billingDb"
import { BILLING_CONFIG } from "../lib/billingConfig"

const router = Router()

const APP_BASE_URL = process.env.APP_BASE_URL || "https://plainpathapp.com/app"

type PlanKey = "starter" | "pro" | "team"
type BillingPeriod = "monthly" | "annual"

const PLAN_CONFIG: Record<PlanKey, {
  name: string
  amount: number        // monthly, cents
  annualAmount: number  // yearly, cents
  description: string
  annualDescription: string
  seats?: number
}> = {
  starter: {
    name: "PlainPath Starter",
    amount: 499,
    annualAmount: 4900,
    description: "Unlimited document analyses — plain English breakdowns, any time.",
    annualDescription: "Unlimited document analyses — plain English breakdowns. Billed annually.",
  },
  pro: {
    name: "PlainPath Pro",
    amount: 1999,
    annualAmount: 19900,
    description: "All tools: Analyze, Trust Check, Contract Builder, Contract Review, Redact, Compare Versions, and Clause Extractor.",
    annualDescription: "All tools included. Billed annually — save 17% vs. monthly.",
  },
  team: {
    name: "PlainPath Team",
    amount: 2999,
    annualAmount: 28900,
    description: "All Pro tools for up to 3 users under one subscription.",
    annualDescription: "All Pro tools for up to 3 users. Billed annually — save 20% vs. monthly.",
    seats: 3,
  },
}

function isPlanKey(value: unknown): value is PlanKey {
  return value === "starter" || value === "pro" || value === "team"
}

// ─── Billing Status ───────────────────────────────────────────────────────────
// Frontend checks this on Subscribe page load. Returns { available: true } when
// the live Stripe connector is configured, { available: false } when not.

router.get("/billing-status", async (_req, res) => {
  const available = await isStripeAvailable()
  return res.json({ available })
})

function toIsoFromUnix(unixSeconds?: number | null): string | null {
  if (!unixSeconds) return null
  return new Date(unixSeconds * 1000).toISOString()
}

// ─── Create Checkout Session ──────────────────────────────────────────────────
// Requires a valid Clerk session. Identity (email + clerkUserId) is sourced
// exclusively from the authenticated session — never from the request body.

router.post("/create-checkout-session", async (req, res) => {
  const auth = getAuth(req)
  if (!auth?.userId) {
    return res.status(401).json({ error: "Authentication required to start checkout." })
  }

  let stripe: Stripe
  try {
    stripe = await getStripeClient()
  } catch {
    return res.status(503).json({ error: "Stripe is not configured. Billing is unavailable." })
  }

  try {
    const { plan, billingPeriod = "monthly" } = req.body as { plan?: string; billingPeriod?: string }

    if (!isPlanKey(plan)) {
      return res.status(400).json({ error: "Invalid plan. Must be 'starter', 'pro', or 'team'." })
    }

    const isAnnual = billingPeriod === "annual"

    // Resolve email from the authenticated Clerk session — never trust the request body.
    const clerkUser = await clerkClient.users.getUser(auth.userId)
    const verifiedEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || undefined

    const selectedPlan = PLAN_CONFIG[plan]
    const billingMode = BILLING_CONFIG.BILLING_MODE
    const unitAmount = isAnnual ? selectedPlan.annualAmount : selectedPlan.amount
    const interval = isAnnual ? "year" : "month"
    const productDescription = isAnnual ? selectedPlan.annualDescription : selectedPlan.description

    const sharedMetadata: Record<string, string> = {
      plan,
      billingMode,
      billingPeriod: isAnnual ? "annual" : "monthly",
      clerkUserId: auth.userId,
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${APP_BASE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/subscribe/cancel`,
      customer_email: verifiedEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            recurring: { interval },
            product_data: {
              name: selectedPlan.name,
              description: productDescription,
            },
            unit_amount: unitAmount,
          },
        },
      ],
      metadata: sharedMetadata,
      subscription_data: { metadata: sharedMetadata },
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
  const auth = getAuth(req)
  if (!auth?.userId) {
    return res.status(401).json({ error: "Authentication required." })
  }

  let stripe: Stripe
  try {
    stripe = await getStripeClient()
  } catch {
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

    // Verify that this checkout session belongs to the authenticated user.
    // The clerkUserId was written server-side during checkout creation and is trusted.
    if (session.metadata?.clerkUserId !== auth.userId) {
      return res.status(403).json({ error: "Access denied." })
    }

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
// Requires a valid Clerk session. Ownership is verified: the subscriber record
// must be linked to the authenticated user's Clerk ID or email.

router.post("/billing-portal", async (req, res) => {
  const auth = getAuth(req)
  if (!auth?.userId) {
    return res.status(401).json({ error: "Authentication required to access the billing portal." })
  }

  let stripe: Stripe
  try {
    stripe = await getStripeClient()
  } catch {
    return res.status(503).json({ error: "Stripe is not configured. Billing is unavailable." })
  }

  try {
    // Resolve the authenticated user's verified email from Clerk.
    const clerkUser = await clerkClient.users.getUser(auth.userId)
    const sessionEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() ?? null

    // Optional email hint from body (for the subscription-restore flow where the
    // subscription email differs from the Clerk sign-in email). Only accepted when
    // the caller is authenticated; ownership is verified before it is used.
    const hintEmail = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : null

    // Look up the subscriber by Clerk user ID first (immutable identity), then
    // fall back to session email only when no clerkUserId-bound record exists.
    const byClerkId = getSubscriberByClerkUserId(auth.userId)
    const byEmail = !byClerkId && sessionEmail ? getSubscriberByEmail(sessionEmail) : null
    // Only accept the email-matched record when it is not already bound to a
    // different Clerk user — prevents email-reassignment privilege escalation.
    let subscriber =
      byClerkId ??
      (byEmail && (!byEmail.clerkUserId || byEmail.clerkUserId === auth.userId)
        ? byEmail
        : null)

    // If not found via authenticated identity, try the hint email only after
    // verifying that the resulting record actually belongs to this user.
    if (!subscriber?.stripeCustomerId && hintEmail) {
      const hintSubscriber = getSubscriberByEmail(hintEmail)
      if (
        hintSubscriber?.stripeCustomerId &&
        hintSubscriber.clerkUserId === auth.userId
      ) {
        subscriber = hintSubscriber
      }
    }

    // Use the same generic error for both "not found" and "not owned" cases so
    // callers cannot distinguish paying subscribers from non-subscribers.
    if (!subscriber?.stripeCustomerId) {
      return res.status(404).json({
        error: "No Stripe customer found. Please subscribe first.",
      })
    }

    // Ownership check: when a clerkUserId is recorded on the subscriber row,
    // it MUST match the authenticated user. Email alone is not sufficient once
    // the record has been bound to a specific Clerk identity.
    const ownsRecord = subscriber.clerkUserId
      ? subscriber.clerkUserId === auth.userId
      : subscriber.email === sessionEmail

    if (!ownsRecord) {
      // Return the same 404 as "not found" — never reveal that a different
      // subscriber exists at the requested email address.
      return res.status(404).json({ error: "No Stripe customer found. Please subscribe first." })
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

// ─── Subscriber Status ────────────────────────────────────────────────────────
// Requires a valid Clerk session. Only returns data for the authenticated user's
// own subscriber record.

router.get("/subscriber-status", async (req, res) => {
  const auth = getAuth(req)
  if (!auth?.userId) {
    return res.status(401).json({ error: "Authentication required." })
  }

  try {
    // Resolve session user's email from Clerk — never trust a caller-supplied email.
    const clerkUser = await clerkClient.users.getUser(auth.userId)
    const sessionEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() ?? null

    // Find subscriber by Clerk user ID first (immutable identity), then fall
    // back to email only when the record is not already bound to a different user.
    const byClerkId = getSubscriberByClerkUserId(auth.userId)
    const byEmail = !byClerkId && sessionEmail ? getSubscriberByEmail(sessionEmail) : null
    const subscriber =
      byClerkId ??
      (byEmail && (!byEmail.clerkUserId || byEmail.clerkUserId === auth.userId)
        ? byEmail
        : null)

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

router.post("/webhook", async (req: any, res) => {
  try {
    const webhookSecret = getWebhookSecret()
    if (!webhookSecret) {
      console.warn("Stripe webhook secret not yet initialized — webhook rejected")
      return res.status(400).send("Webhook not configured")
    }

    let stripe: Stripe
    try {
      stripe = await getStripeClient()
    } catch {
      return res.status(503).send("Stripe not configured")
    }

    const signature = req.headers["stripe-signature"]
    if (!signature || typeof signature !== "string") {
      return res.status(400).send("Missing Stripe signature")
    }

    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
    const billingMode = BILLING_CONFIG.BILLING_MODE

    // ── Deduplication ───────────────────────────────────────────────────────
    // Reject events that have already been successfully processed. This prevents
    // replayed or retried webhook deliveries from mutating billing state.
    if (hasProcessedEvent(event.id)) {
      console.log(`Stripe webhook: duplicate event ${event.id} (${event.type}) — skipped`)
      return res.json({ received: true })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const plan = session.metadata?.plan || "starter"
        const sessionBillingMode = session.metadata?.billingMode || billingMode
        // clerkUserId in metadata was set server-side during checkout creation
        // (after authenticating the Clerk session) — it is therefore trusted.
        const clerkUserId = session.metadata?.clerkUserId || null

        // Derive the authoritative email from Clerk using the trusted clerkUserId.
        // This prevents subscription rebinding when the Stripe checkout email
        // differs from the authenticated user's Clerk email.
        // If Clerk identity cannot be resolved, the upsert is skipped rather than
        // falling back to the potentially attacker-influenced Stripe email.
        let email: string | null = null
        if (clerkUserId) {
          try {
            const clerkUser = await clerkClient.users.getUser(clerkUserId)
            email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || null
          } catch (err) {
            // Clerk lookup failed — skip write rather than trusting unverified Stripe email.
            console.error(`checkout.session.completed: Clerk lookup failed for clerkUserId ${clerkUserId}; skipping upsert`, err)
            break
          }
        } else {
          // No clerkUserId — this session was not created via the authenticated checkout
          // path. Skip the write to avoid trusting an unverified Stripe email.
          console.warn("checkout.session.completed: no clerkUserId in metadata; skipping upsert")
          break
        }

        if (email && isPlanKey(plan)) {
          const checkoutCustomerId =
            typeof session.customer === "string" ? session.customer : null
          const checkoutSubscriptionId =
            typeof session.subscription === "string" ? session.subscription : null

          // Guard against out-of-order delivery reactivating a canceled row.
          // Two signals are checked:
          //   1. The local subscriber row already shows "canceled" (prior
          //      cancellation was persisted before this activation event arrived).
          //   2. A subscription-ID tombstone exists (customer.subscription.deleted
          //      fired first but could not create a subscriber row at that time).
          // In either case, verify the subscription's live state at Stripe before
          // writing "active" to avoid restoring access to a canceled subscription.
          let checkoutStatus = "active"
          const existingSubscriber = getSubscriberByClerkUserId(clerkUserId)
          const hasCanceledRow = existingSubscriber?.status === "canceled"
          const hasTombstone = checkoutSubscriptionId
            ? isSubscriptionCanceled(checkoutSubscriptionId)
            : false

          if (hasCanceledRow || hasTombstone) {
            const subIdToCheck = checkoutSubscriptionId
            if (subIdToCheck) {
              try {
                const freshSub = await stripe.subscriptions.retrieve(subIdToCheck)
                checkoutStatus = freshSub.status
                if (checkoutStatus !== "active") {
                  console.log(
                    `checkout.session.completed: subscription ${subIdToCheck} is ${checkoutStatus} at Stripe — ` +
                    `refusing to activate${hasTombstone && !hasCanceledRow ? " (tombstone)" : " canceled local row"} for ${email}`
                  )
                }
              } catch (err) {
                console.warn(
                  `checkout.session.completed: could not retrieve subscription ${subIdToCheck} from Stripe — ` +
                  `preserving canceled state for ${email}`,
                  err
                )
                checkoutStatus = "canceled"
              }
            } else {
              // No subscription ID available yet — treat conservatively and
              // do not overwrite the canceled state.
              console.warn(
                `checkout.session.completed: cancellation detected and no subscription ID available — ` +
                `preserving canceled state for ${email}`
              )
              checkoutStatus = "canceled"
            }
          }

          upsertSubscriber({
            email,
            clerkUserId,
            stripeCustomerId: checkoutCustomerId,
            stripeCheckoutSessionId: session.id,
            plan,
            status: checkoutStatus,
            billingMode: sessionBillingMode,
            billingProvider: "stripe",
          })
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null

        // clerkUserId is stored in subscription metadata by the checkout
        // creation route (subscription_data.metadata). Using it here means
        // identity binding is driven by the authenticated session that started
        // checkout rather than by the email address on the Stripe customer,
        // which the buyer could have changed during the hosted checkout flow.
        const metadataClerkUserId = subscription.metadata?.clerkUserId || null

        // Look up the existing subscriber by Stripe customer ID first
        // (immutable once the subscription exists). Fall back to Clerk user ID
        // lookup so a subscription event arriving before
        // checkout.session.completed can still be matched to the right row.
        let subscriber = customerId
          ? getSubscriberByCustomerId(customerId)
          : undefined

        if (!subscriber && metadataClerkUserId) {
          subscriber = getSubscriberByClerkUserId(metadataClerkUserId) ?? undefined
        }

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

        // Guard: only write when we can anchor the update to a trusted identity.
        // - If we found an existing row by stripeCustomerId or clerkUserId, the
        //   binding is already established — the update is safe.
        // - If no existing row exists but we have a clerkUserId from metadata,
        //   we can create/update with a trusted identity anchor.
        // - If neither applies we have only a Stripe email which the buyer may
        //   have tampered with — skip rather than risking rebinding.
        const hasKnownBinding = !!subscriber
        const hasClerkAnchor = !!metadataClerkUserId

        if (email && (hasKnownBinding || hasClerkAnchor)) {
          // Guard against out-of-order event delivery reactivating a canceled
          // subscription. Two signals trigger a live Stripe verification:
          //   1. The local subscriber row is already "canceled" but this event
          //      carries "active" (i.e., the event predates the deletion).
          //   2. A subscription-ID tombstone exists — customer.subscription.deleted
          //      fired first but couldn't persist a subscriber row at that time.
          // In either case, verify the subscription's current state at Stripe.
          let authorizedStatus: string = subscription.status
          const hasCanceledSubRow = subscriber?.status === "canceled"
          const hasSubTombstone = isSubscriptionCanceled(subscription.id)
          if ((hasCanceledSubRow || hasSubTombstone) && subscription.status === "active") {
            try {
              const freshSub = await stripe.subscriptions.retrieve(subscription.id)
              authorizedStatus = freshSub.status
              if (authorizedStatus !== "active") {
                console.log(
                  `${event.type}: subscription ${subscription.id} is ${authorizedStatus} at Stripe — ` +
                  `refusing to activate${hasSubTombstone && !hasCanceledSubRow ? " (tombstone)" : " canceled local row"} for ${email}`
                )
              }
            } catch (err) {
              // If the subscription is gone entirely, treat it as canceled.
              console.warn(
                `${event.type}: could not retrieve subscription ${subscription.id} from Stripe to verify status — ` +
                `preserving canceled state for ${email}`,
                err
              )
              authorizedStatus = "canceled"
            }
          }

          upsertSubscriber({
            email,
            clerkUserId: metadataClerkUserId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            plan: isPlanKey(plan) ? plan : "starter",
            status: authorizedStatus,
            currentPeriodStart: toIsoFromUnix(
              (subscription as any).current_period_start,
            ),
            currentPeriodEnd: toIsoFromUnix(
              (subscription as any).current_period_end,
            ),
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            billingMode: subBillingMode,
            billingProvider: "stripe",
          })
        } else if (email) {
          console.warn(
            `${event.type}: no trusted identity anchor for customer ${customerId} — skipping upsert to prevent email-based rebinding`
          )
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Record the tombstone immediately — before any identity resolution —
        // so activation handlers can detect this cancellation even if the
        // subscriber row lookup below fails entirely (e.g. no email, no
        // clerkUserId resolvable at deletion time).
        markSubscriptionCanceled(subscription.id)

        const deletedCustomerId =
          typeof subscription.customer === "string" ? subscription.customer : null

        // clerkUserId stored in subscription metadata during checkout creation.
        const deletedMetaClerkUserId = subscription.metadata?.clerkUserId || null

        // Look up by subscription ID first (most specific), then by customer ID,
        // then by clerkUserId from metadata — ensures cancellation is applied
        // even when earlier events haven't yet stored the subscription ID or
        // customer ID on the local row.
        let existing =
          getSubscriberBySubscriptionId(subscription.id) ??
          (deletedCustomerId ? getSubscriberByCustomerId(deletedCustomerId) : undefined)

        if (!existing && deletedMetaClerkUserId) {
          existing = getSubscriberByClerkUserId(deletedMetaClerkUserId) ?? undefined
        }

        if (existing) {
          upsertSubscriber({
            email: existing.email,
            clerkUserId: existing.clerkUserId ?? undefined,
            stripeCustomerId: deletedCustomerId ?? existing.stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            plan: existing.plan,
            status: "canceled",
            currentPeriodEnd: toIsoFromUnix(
              (subscription as any).current_period_end,
            ),
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            billingMode: existing.billingMode,
            billingProvider: "stripe",
          })
        } else {
          // No local row found yet — the deletion event arrived before any
          // activation event (checkout.session.completed or
          // customer.subscription.created) had a chance to create the row.
          // Persist a "canceled" stub so that those later out-of-order events
          // find it and refuse to reactivate paid access.
          let stubEmail: string | null = null

          if (deletedMetaClerkUserId) {
            try {
              const clerkUser = await clerkClient.users.getUser(deletedMetaClerkUserId)
              stubEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || null
            } catch (err) {
              console.warn(
                `customer.subscription.deleted: Clerk lookup failed for clerkUserId ${deletedMetaClerkUserId}`,
                err
              )
            }
          }

          if (!stubEmail && deletedCustomerId) {
            try {
              const customer = await stripe.customers.retrieve(deletedCustomerId)
              if (!("deleted" in customer)) {
                stubEmail = customer.email?.toLowerCase().trim() || null
              }
            } catch (err) {
              console.warn(
                `customer.subscription.deleted: Stripe customer lookup failed for ${deletedCustomerId}`,
                err
              )
            }
          }

          if (stubEmail) {
            const stubPlan =
              subscription.metadata?.plan && isPlanKey(subscription.metadata.plan)
                ? subscription.metadata.plan
                : "starter"
            console.log(
              `customer.subscription.deleted: no local row found — persisting canceled stub ` +
              `for subscription ${subscription.id} to block future out-of-order reactivation`
            )
            upsertSubscriber({
              email: stubEmail,
              clerkUserId: deletedMetaClerkUserId ?? undefined,
              stripeCustomerId: deletedCustomerId ?? undefined,
              stripeSubscriptionId: subscription.id,
              plan: stubPlan,
              status: "canceled",
              currentPeriodEnd: toIsoFromUnix((subscription as any).current_period_end),
              cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
              billingMode: subscription.metadata?.billingMode || billingMode,
              billingProvider: "stripe",
            })
          } else {
            console.warn(
              `customer.subscription.deleted: could not resolve identity for subscription ` +
              `${subscription.id} / customer ${deletedCustomerId} — no canceled stub created; ` +
              `out-of-order reactivation may be possible if activation events arrive later`
            )
          }
        }
        break
      }

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
          // Do not resurrect a locally-canceled subscription via an invoice.paid
          // event. This prevents a delayed or replayed payment event from restoring
          // paid access after a cancellation has already been applied. When the
          // local row says "canceled", verify the subscription's live status at
          // Stripe before allowing reactivation.
          let invoicePaidStatus = "active"
          if (subscriber.status === "canceled" && subscriptionId) {
            try {
              const freshSub = await stripe.subscriptions.retrieve(subscriptionId)
              invoicePaidStatus = freshSub.status
              if (invoicePaidStatus !== "active") {
                console.log(
                  `invoice.paid: subscription ${subscriptionId} is ${invoicePaidStatus} at Stripe — ` +
                  `refusing to re-activate canceled local row for ${subscriber.email}`
                )
              }
            } catch (err) {
              console.warn(
                `invoice.paid: could not retrieve subscription ${subscriptionId} from Stripe — ` +
                `preserving canceled state for ${subscriber.email}`,
                err
              )
              invoicePaidStatus = "canceled"
            }
          }

          upsertSubscriber({
            email: subscriber.email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: subscriber.plan,
            status: invoicePaidStatus,
            billingMode: subscriber.billingMode,
            billingProvider: "stripe",
          })
        }
        break
      }

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

    // Record that this event has been handled to guard against replay attacks
    // and duplicate deliveries. Stored after the switch so only successfully
    // parsed events are marked; parse/signature failures remain reprocessable.
    markEventProcessed(event.id)

    return res.json({ received: true })
  } catch (error: any) {
    console.error("Stripe webhook error:", error?.message || error)
    return res.status(400).send(`Webhook Error: ${error?.message || "Unknown error"}`)
  }
})

export default router
