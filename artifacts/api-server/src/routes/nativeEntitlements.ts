// ─── Native Entitlement Verification Route ────────────────────────────────────
//
// Called by the Capacitor native apps AFTER a RevenueCat purchase completes.
// The client passes the RevenueCat userId (or app user ID) and active entitlements.
// The server verifies with RevenueCat's REST API and syncs to the billing DB.
//
// ACTIVATION STEPS:
//   1. Set REVENUECAT_API_KEY_IOS and REVENUECAT_API_KEY_ANDROID in environment
//   2. In billingProvider.ts: set storekit.active = true / play_billing.active = true
//   3. Wire client nativeBilling.ts → POST /api/entitlements/native-verify after purchase
//   4. Remove the NOT_YET_ACTIVATED guard below
//
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express"
import { getAuth, clerkClient } from "@clerk/express"
import { upsertSubscriber } from "../lib/billingDb"
import { normalizePlan } from "../lib/planEntitlements"
import {
  resolvePlanFromRCEntitlements,
  getRevenueCatApiKey,
  RC_ENTITLEMENT_IDS,
} from "../lib/nativeBillingConfig"
import { BILLING_CONFIG } from "../lib/billingConfig"

const router = Router()

// ─── POST /api/entitlements/native-verify ────────────────────────────────────
// Body: { platform: "ios" | "android", rcUserId, activeEntitlements: string[] }
// Verifies native subscription via RevenueCat REST API and syncs to billing DB.
// Requires authentication — the email is resolved from the signed-in Clerk user
// and cannot be supplied by the caller.

router.post("/native-verify", async (req, res) => {
  // TODO: ACTIVATE — Remove this guard when RevenueCat keys are configured
  if (!process.env.REVENUECAT_API_KEY_IOS && !process.env.REVENUECAT_API_KEY_ANDROID) {
    return res.status(503).json({
      error: "Native billing not yet configured. RevenueCat keys not set.",
    })
  }

  // ── Require an authenticated Clerk session ────────────────────────────────
  const auth = getAuth(req)
  if (!auth?.userId) {
    return res.status(401).json({ error: "Authentication required" })
  }

  // Resolve the caller's verified primary email from Clerk — do not trust any
  // email value supplied in the request body.
  let email: string
  try {
    const user = await clerkClient.users.getUser(auth.userId)
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )
    if (!primary?.emailAddress || primary.verification?.status !== "verified") {
      return res.status(401).json({ error: "Verified email address not found on account" })
    }
    email = primary.emailAddress.toLowerCase().trim()
  } catch {
    return res.status(500).json({ error: "Unable to resolve account email" })
  }

  try {
    const { platform, rcUserId, activeEntitlements } = req.body as {
      platform?: string
      rcUserId?: string
      activeEntitlements?: string[]
    }

    if (platform !== "ios" && platform !== "android") {
      return res.status(400).json({ error: "platform must be 'ios' or 'android'" })
    }
    if (!rcUserId || typeof rcUserId !== "string") {
      return res.status(400).json({ error: "Missing rcUserId" })
    }

    // ── Enforce identity-to-purchase binding ─────────────────────────────────
    // The RevenueCat app user ID must match the authenticated Clerk user ID.
    // This app configures RevenueCat to use the Clerk user ID as the app user
    // ID (the standard integration pattern), so any mismatch means the caller
    // is trying to claim a subscription purchased by a different account.
    // Rejecting here prevents cross-account replay: an attacker cannot submit
    // their active rcUserId while logged in as a different Clerk user.
    if (rcUserId !== auth.userId) {
      return res.status(403).json({
        error: "rcUserId_mismatch",
        message: "The RevenueCat user ID does not match the authenticated account.",
      })
    }

    const apiKey = getRevenueCatApiKey(platform)
    if (!apiKey) {
      return res.status(503).json({ error: `RevenueCat API key not set for ${platform}` })
    }

    // ── Verify with RevenueCat REST API ──────────────────────────────────────
    // RevenueCat REST v1: GET /subscribers/{app_user_id}
    // Docs: https://www.revenuecat.com/docs/api-v1#tag/customers/operation/subscribers

    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(rcUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!rcResponse.ok) {
      const errorBody = await rcResponse.text()
      console.error("RevenueCat verify failed:", rcResponse.status, errorBody)
      return res.status(502).json({ error: "RevenueCat verification failed" })
    }

    const rcData = (await rcResponse.json()) as {
      subscriber: {
        entitlements: Record<string, { expires_date: string | null; product_identifier: string }>
        subscriptions: Record<string, { period_type: string; expires_date: string | null }>
      }
    }

    const activeRCEntitlements = Object.entries(rcData.subscriber.entitlements)
      .filter(([, v]) => {
        if (!v.expires_date) return true // lifetime
        return new Date(v.expires_date) > new Date()
      })
      .map(([key]) => key)

    const plan = resolvePlanFromRCEntitlements(activeRCEntitlements)
    const billingProvider = platform === "ios" ? "storekit" : "play_billing"

    // Get expiry from the pro entitlement (only paid plan at launch)
    const proEnt = rcData.subscriber.entitlements[RC_ENTITLEMENT_IDS.pro]
    const expiresAt = proEnt?.expires_date ?? null

    // ── Sync to billing DB ───────────────────────────────────────────────────
    // Bind both the verified email and the Clerk user ID so the row is
    // permanently anchored to the authenticated identity, not just an email.
    upsertSubscriber({
      email,
      clerkUserId: auth.userId,
      plan: normalizePlan(plan),
      status: activeRCEntitlements.length > 0 ? "active" : "inactive",
      billingMode: BILLING_CONFIG.BILLING_MODE,
      billingProvider,
      currentPeriodEnd: expiresAt,
    })

    return res.json({
      ok: true,
      plan,
      provider: billingProvider,
      activeEntitlements: activeRCEntitlements,
      expiresAt,
    })
  } catch (error) {
    console.error("Native entitlement verify error:", error)
    return res.status(500).json({ error: "Unable to verify native entitlement" })
  }
})

export default router
