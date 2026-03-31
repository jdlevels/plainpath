import { Router } from "express"
import { getSubscriberByEmail } from "../lib/billingDb"
import {
  PLAN_ENTITLEMENTS,
  normalizePlan,
} from "../lib/planEntitlements"
import {
  getUsageForCurrentMonth,
  incrementUsageForCurrentMonth,
  getCurrentMonthKey,
} from "../lib/usageDb"

const router = Router()

router.get("/status", (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ error: "Missing email" })
    }

    const subscriber = getSubscriberByEmail(email)
    const plan = normalizePlan(subscriber?.plan)
    const status = subscriber?.status || "inactive"
    const entitlements = PLAN_ENTITLEMENTS[plan]
    const usageCount = getUsageForCurrentMonth(email)

    return res.json({
      email,
      found: Boolean(subscriber),
      status,
      plan,
      monthKey: getCurrentMonthKey(),
      usageCount,
      usageLimit: entitlements.analysesPerMonth,
      usageRemaining: Math.max(entitlements.analysesPerMonth - usageCount, 0),
      features: entitlements.features,
      currentPeriodEnd: subscriber?.currentPeriodEnd || null,
      cancelAtPeriodEnd: Boolean(subscriber?.cancelAtPeriodEnd),
    })
  } catch (error) {
    console.error("Entitlements status error:", error)
    return res.status(500).json({ error: "Unable to load entitlements" })
  }
})

router.post("/consume-analysis", (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ error: "Missing email" })
    }

    const subscriber = getSubscriberByEmail(email)

    if (!subscriber || subscriber.status !== "active") {
      return res.status(403).json({
        error: "No active subscription found for this email.",
      })
    }

    const plan = normalizePlan(subscriber.plan)
    const entitlements = PLAN_ENTITLEMENTS[plan]
    const currentCount = getUsageForCurrentMonth(email)

    if (currentCount >= entitlements.analysesPerMonth) {
      return res.status(403).json({
        error: "Monthly analysis limit reached for this plan.",
        usageCount: currentCount,
        usageLimit: entitlements.analysesPerMonth,
      })
    }

    incrementUsageForCurrentMonth(email)

    const updatedCount = getUsageForCurrentMonth(email)

    return res.json({
      ok: true,
      plan,
      usageCount: updatedCount,
      usageLimit: entitlements.analysesPerMonth,
      usageRemaining: Math.max(entitlements.analysesPerMonth - updatedCount, 0),
    })
  } catch (error) {
    console.error("Consume analysis error:", error)
    return res.status(500).json({ error: "Unable to consume analysis usage" })
  }
})

export default router
