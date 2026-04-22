import { Router } from "express"
import { getSubscriberByEmail, getSubscriberByClerkUserId } from "../lib/billingDb"
import { PLAN_ENTITLEMENTS, TOOL_ACCESS, normalizePlan, type PlanKey, type ToolKey } from "../lib/planEntitlements"
import { BILLING_CONFIG } from "../lib/billingConfig"
import {
  getUsageForCurrentMonth,
  incrementUsageForCurrentMonth,
  getAllToolUsageForCurrentMonth,
  incrementToolUsage,
  getCurrentMonthKey,
} from "../lib/usageDb"

const router = Router()

// Admin emails receive unlimited Pro access without a Stripe subscription.
// Set ADMIN_EMAILS as a comma-separated list in the environment.
const ADMIN_EMAILS: Set<string> = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase())
}

// ─── GET /status ──────────────────────────────────────────────────────────────
// Returns full entitlement data for the given email.

router.get("/status", (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase()
    const clerkUserId = String(req.query.clerkUserId || "").trim() || null

    if (!email && !clerkUserId) {
      return res.status(400).json({ error: "Missing email or clerkUserId" })
    }

    // If only clerkUserId provided, resolve to email via DB
    let resolvedEmail = email
    if (!resolvedEmail && clerkUserId) {
      const byClerk = getSubscriberByClerkUserId(clerkUserId)
      if (byClerk) {
        resolvedEmail = byClerk.email
      } else {
        return res.json({ email: null, found: false, status: "inactive", plan: "starter" })
      }
    }

    // Admin bypass: full Pro, unlimited usage — no Stripe subscription required
    if (isAdminEmail(resolvedEmail)) {
      const proEntitlements = PLAN_ENTITLEMENTS["pro"]
      return res.json({
        email,
        role: "admin",
        found: true,
        status: "active",
        plan: "pro",
        monthKey: getCurrentMonthKey(),
        usageCount: 0,
        usageLimit: proEntitlements.analysesPerMonth,
        usageRemaining: proEntitlements.analysesPerMonth,
        toolAccess: TOOL_ACCESS["pro"],
        toolUsage: { analyze: 0, "trust-check": 0, "contract-review": 0, "build-contract": 0, redact: 0, signature: 0 },
        features: proEntitlements.features,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingMode: BILLING_CONFIG.BILLING_MODE,
        paywallEnforcement: BILLING_CONFIG.PAYWALL_ENFORCEMENT,
      })
    }

    const subscriber = getSubscriberByEmail(email)
    const plan = normalizePlan(subscriber?.plan)
    const status = subscriber?.status || "inactive"
    const entitlements = PLAN_ENTITLEMENTS[plan]
    const usageCount = getUsageForCurrentMonth(email)
    const toolUsage = getAllToolUsageForCurrentMonth(email)

    return res.json({
      email,
      found: Boolean(subscriber),
      status,
      plan,
      monthKey: getCurrentMonthKey(),
      usageCount,
      usageLimit: entitlements.analysesPerMonth,
      usageRemaining:
        entitlements.analysesPerMonth === Infinity
          ? Infinity
          : Math.max(entitlements.analysesPerMonth - usageCount, 0),
      toolAccess: TOOL_ACCESS[plan],
      toolUsage,
      features: entitlements.features,
      currentPeriodEnd: subscriber?.currentPeriodEnd || null,
      cancelAtPeriodEnd: Boolean(subscriber?.cancelAtPeriodEnd),
      billingMode: subscriber?.billingMode || BILLING_CONFIG.BILLING_MODE,
      paywallEnforcement: BILLING_CONFIG.PAYWALL_ENFORCEMENT,
    })
  } catch (error) {
    console.error("Entitlements status error:", error)
    return res.status(500).json({ error: "Unable to load entitlements" })
  }
})

// ─── POST /consume ────────────────────────────────────────────────────────────
// Records a tool usage event. When PAYWALL_ENFORCEMENT is true, this also
// validates the subscriber has access to the tool and has not exceeded limits.
// When PAYWALL_ENFORCEMENT is false, usage is recorded but never blocked.

router.post("/consume", (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase()
    const tool = String(req.body?.tool || "") as ToolKey

    const validTools: ToolKey[] = ["analyze", "trust-check", "contract-review", "build-contract", "redact", "signature"]

    if (!email) {
      return res.status(400).json({ error: "Missing email" })
    }
    if (!validTools.includes(tool)) {
      return res.status(400).json({ error: `Invalid tool. Must be one of: ${validTools.join(", ")}` })
    }

    // Admin bypass: never consume quota
    if (isAdminEmail(email)) {
      incrementToolUsage(email, tool)
      return res.json({
        ok: true,
        plan: "pro",
        tool,
        usageCount: 1,
        enforced: false,
      })
    }

    const subscriber = getSubscriberByEmail(email)
    const plan = normalizePlan(subscriber?.plan)

    // When enforcement is off, always allow — just track
    if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) {
      incrementToolUsage(email, tool)
      if (tool === "analyze") {
        incrementUsageForCurrentMonth(email)
      }
      const toolUsage = getAllToolUsageForCurrentMonth(email)
      return res.json({
        ok: true,
        plan,
        tool,
        toolUsage,
        enforced: false,
        // TODO: When PAYWALL_ENFORCEMENT = true, this endpoint will block
        // access for subscribers missing the required plan.
      })
    }

    // ── Enforcement is ON ─────────────────────────────────────────────────────
    if (!subscriber || subscriber.status !== "active") {
      return res.status(403).json({
        error: "No active subscription found. Please subscribe to continue.",
        code: "NO_SUBSCRIPTION",
      })
    }

    const allowedTools = TOOL_ACCESS[plan] ?? []
    if (!allowedTools.includes(tool)) {
      return res.status(403).json({
        error: `Your ${plan} plan does not include ${tool}. Upgrade to Pro for full access.`,
        code: "TOOL_NOT_IN_PLAN",
        plan,
        tool,
        requiredPlan: "pro",
      })
    }

    incrementToolUsage(email, tool)
    if (tool === "analyze") {
      incrementUsageForCurrentMonth(email)
    }

    const toolUsage = getAllToolUsageForCurrentMonth(email)

    return res.json({
      ok: true,
      plan,
      tool,
      toolUsage,
      enforced: true,
    })
  } catch (error) {
    console.error("Consume tool usage error:", error)
    return res.status(500).json({ error: "Unable to record usage" })
  }
})

// ─── POST /consume-analysis (legacy endpoint, kept for backwards compat) ──────

router.post("/consume-analysis", (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ error: "Missing email" })
    }

    if (isAdminEmail(email)) {
      return res.json({
        ok: true,
        plan: "pro",
        usageCount: 0,
        usageLimit: PLAN_ENTITLEMENTS["pro"].analysesPerMonth,
        usageRemaining: PLAN_ENTITLEMENTS["pro"].analysesPerMonth,
      })
    }

    const subscriber = getSubscriberByEmail(email)

    if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) {
      incrementUsageForCurrentMonth(email)
      const usageCount = getUsageForCurrentMonth(email)
      const plan = normalizePlan(subscriber?.plan)
      return res.json({
        ok: true,
        plan,
        usageCount,
        usageLimit: PLAN_ENTITLEMENTS[plan].analysesPerMonth,
        usageRemaining: PLAN_ENTITLEMENTS[plan].analysesPerMonth,
      })
    }

    if (!subscriber || subscriber.status !== "active") {
      return res.status(403).json({
        error: "No active subscription found for this email.",
      })
    }

    const plan = normalizePlan(subscriber.plan)
    const entitlements = PLAN_ENTITLEMENTS[plan]
    const currentCount = getUsageForCurrentMonth(email)

    if (
      entitlements.analysesPerMonth !== Infinity &&
      currentCount >= entitlements.analysesPerMonth
    ) {
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
      usageRemaining:
        entitlements.analysesPerMonth === Infinity
          ? Infinity
          : Math.max(entitlements.analysesPerMonth - updatedCount, 0),
    })
  } catch (error) {
    console.error("Consume analysis error:", error)
    return res.status(500).json({ error: "Unable to consume analysis usage" })
  }
})

export default router
