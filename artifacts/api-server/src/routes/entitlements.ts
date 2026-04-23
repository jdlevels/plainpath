// ─── PlainPath Identity Model (server-side) ────────────────────────────────────
//
//   role        = internal privilege  ("admin" | "member")
//   accessTier  = product entitlement ("starter" | "pro")
//
//   Admin   → { role: "admin",  accessTier: "pro"     }   (support@plainpathapp.com)
//   Pro     → { role: "member", accessTier: "pro"     }   (yelevels@gmail.com)
//   Starter → { role: "member", accessTier: "starter" }   (future paid accounts)
//
// Sources of truth (in priority order):
//   1. ALLOWED_EMAILS env var — who is permitted to use the app at all
//   2. ADMIN_EMAILS env var   — which of those are admins (admin/pro)
//   3. Clerk publicMetadata   — role + accessTier (written by /bootstrap)
//
// unsafeMetadata is NEVER used for access control.
//
// Audit log events:
//   entitlement.status.granted   — /status returned data
//   entitlement.status.denied    — /status returned unauthorized
//   entitlement.bootstrap.noop   — metadata already set; no-op
//   entitlement.bootstrap.wrote  — metadata written for first time
//   entitlement.bootstrap.denied — caller not in allowlist; denied
//   entitlement.bootstrap.error  — unexpected error during bootstrap
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express"
import { getAuth, clerkClient } from "@clerk/express"
import { logger } from "../lib/logger"
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

// ── Allowlist helpers ─────────────────────────────────────────────────────────
//
// ALLOWED_EMAILS — the set of every email address allowed to use PlainPath.
// Any authenticated user NOT in this set receives 403 on every route.
// This is defense-in-depth on top of the global allowlistEnforcement middleware.
//
// ADMIN_EMAILS — subset of ALLOWED_EMAILS with admin role + pro access.
// All other allowed emails get member role; their accessTier comes from
// their Clerk publicMetadata (written by /bootstrap).

const ALLOWED_EMAILS: Set<string> = new Set(
  (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

const ADMIN_EMAILS: Set<string> = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

function isAllowedEmail(email: string): boolean {
  // If ALLOWED_EMAILS is empty, enforcement is disabled (logged at startup by middleware).
  if (ALLOWED_EMAILS.size === 0) return true
  return ALLOWED_EMAILS.has(email.toLowerCase())
}

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase())
}

// Bootstrap publicMetadata for admin users the first time the entitlements
// endpoint is called with their Clerk userId. Fire-and-forget — never blocks.
// Merge-safe: spreads existing publicMetadata before writing role/accessTier.
async function bootstrapAdminMetadata(clerkUserId: string, email: string) {
  try {
    const user = await clerkClient.users.getUser(clerkUserId)
    const existing = user.publicMetadata as Record<string, unknown>
    if (existing.role === "admin" && existing.accessTier === "pro") return
    await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: { ...existing, role: "admin", accessTier: "pro" },
    })
    logger.info(
      { event: "entitlement.bootstrap.wrote", email, userId: clerkUserId, role: "admin", accessTier: "pro" },
      "Bootstrap: admin metadata written"
    )
  } catch {
    // Non-blocking — metadata bootstrap failure never affects the response.
  }
}

// ─── GET /status ──────────────────────────────────────────────────────────────
// Returns full entitlement data for the requesting user.
//
// Security model:
//   - Allowlist check first: if the resolved email is not in ALLOWED_EMAILS, 403.
//   - clerkUserId is sourced from the Clerk session JWT (via getAuth) when present.
//   - email-only fallback is permitted for the subscription-restore flow ONLY
//     and carries no elevated privilege — admin check still requires ADMIN_EMAILS.

router.get("/status", (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase()

    const sessionUserId = getAuth(req)?.userId ?? null
    const clerkUserId = sessionUserId ?? (String(req.query.clerkUserId || "").trim() || null)

    if (!email && !clerkUserId) {
      return res.status(400).json({ error: "Missing email or clerkUserId" })
    }

    let resolvedEmail = email
    if (!resolvedEmail && clerkUserId) {
      const byClerk = getSubscriberByClerkUserId(clerkUserId)
      if (byClerk) {
        resolvedEmail = byClerk.email
      } else {
        return res.json({ email: null, found: false, status: "inactive", plan: "starter" })
      }
    }

    // ── Allowlist check (defense-in-depth at route level) ──────────────────
    // The allowlistEnforcement middleware already blocks non-allowlisted
    // authenticated sessions. This check also covers the email-only flow.
    if (resolvedEmail && !isAllowedEmail(resolvedEmail)) {
      logger.warn(
        {
          event: "entitlement.status.denied",
          email: resolvedEmail,
          userId: clerkUserId,
          allowlistMatch: false,
          accessGranted: false,
        },
        "Entitlement status denied: email not in allowlist"
      )
      return res.status(403).json({
        error: "unauthorized_user",
        message: "This application is invite-only. Your account is not authorized.",
      })
    }

    // ── Admin bypass ───────────────────────────────────────────────────────
    if (isAdminEmail(resolvedEmail)) {
      const proEntitlements = PLAN_ENTITLEMENTS["pro"]
      if (clerkUserId) {
        void bootstrapAdminMetadata(clerkUserId, resolvedEmail)
      }
      logger.info(
        {
          event: "entitlement.status.granted",
          email: resolvedEmail,
          userId: clerkUserId,
          role: "admin",
          accessTier: "pro",
          allowlistMatch: true,
          accessGranted: true,
        },
        "Entitlement status granted: admin"
      )
      return res.json({
        email: resolvedEmail,
        role: "admin",
        accessTier: "pro",
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

    const subscriber = getSubscriberByEmail(resolvedEmail)
    const plan = normalizePlan(subscriber?.plan)
    const status = subscriber?.status || "inactive"
    const entitlements = PLAN_ENTITLEMENTS[plan]
    const usageCount = getUsageForCurrentMonth(resolvedEmail)
    const toolUsage = getAllToolUsageForCurrentMonth(resolvedEmail)

    logger.info(
      {
        event: "entitlement.status.granted",
        email: resolvedEmail,
        userId: clerkUserId,
        role: "member",
        accessTier: plan,
        allowlistMatch: true,
        accessGranted: true,
        billingStatus: status,
      },
      "Entitlement status granted: member"
    )

    return res.json({
      email: resolvedEmail,
      role: "member",
      accessTier: plan,
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

// ─── POST /bootstrap ──────────────────────────────────────────────────────────
// Called once by the frontend when a newly signed-in user has no publicMetadata.
// Writes role + accessTier to Clerk publicMetadata (merge-safe).
//
// Identity rules:
//   ADMIN_EMAILS           → { role: "admin",  accessTier: "pro" }
//   ALLOWED_EMAILS (other) → { role: "member", accessTier: "pro" }
//     ↑ All currently-allowed non-admin accounts are Pro members.
//       If future accounts should be Starter, this logic can be updated.
//
// NOT in ALLOWED_EMAILS → 403 unauthorized (defense-in-depth)
//
// Already bootstrapped → returns current values without writing (no-op).
// Requires a valid Clerk session JWT. Returns 401 if unauthenticated.

router.post("/bootstrap", async (req, res) => {
  const auth = getAuth(req)
  if (!auth?.userId) {
    return res.status(401).json({ error: "unauthorized" })
  }

  const userId = auth.userId

  try {
    const clerkUser = await clerkClient.users.getUser(userId)
    const email = (clerkUser.emailAddresses?.[0]?.emailAddress ?? "").trim().toLowerCase()
    const existing = clerkUser.publicMetadata as Record<string, unknown>

    // ── Allowlist check — defense-in-depth at bootstrap ───────────────────
    // The allowlistEnforcement middleware runs first, but this provides a
    // second hard stop in the route itself in case the middleware config
    // changes or ALLOWED_EMAILS is populated differently at route level.
    if (ALLOWED_EMAILS.size > 0 && !isAllowedEmail(email)) {
      logger.warn(
        {
          event: "entitlement.bootstrap.denied",
          email,
          userId,
          allowlistMatch: false,
          accessGranted: false,
        },
        "Bootstrap denied: email not in allowlist"
      )
      return res.status(403).json({
        error: "unauthorized_user",
        message: "This application is invite-only. Your account is not authorized.",
      })
    }

    // ── No-op if metadata already set ────────────────────────────────────
    if (existing.role && existing.accessTier) {
      logger.info(
        {
          event: "entitlement.bootstrap.noop",
          email,
          userId,
          role: existing.role,
          accessTier: existing.accessTier,
          allowlistMatch: true,
          accessGranted: true,
        },
        "Bootstrap: metadata already set; no-op"
      )
      return res.json({
        role: existing.role,
        accessTier: existing.accessTier,
        bootstrapped: false,
      })
    }

    // ── Determine correct identity ─────────────────────────────────────────
    //   Admin email (ADMIN_EMAILS)  → admin + pro
    //   Any other allowed email     → member + pro
    //     (all currently-allowed non-admin accounts are Pro members;
    //      change to "starter" here if future free accounts are added)
    const newMeta = isAdminEmail(email)
      ? { role: "admin", accessTier: "pro" }
      : { role: "member", accessTier: "pro" }

    // Merge-safe: spread existing keys so no other metadata is overwritten.
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { ...existing, ...newMeta },
    })

    logger.info(
      {
        event: "entitlement.bootstrap.wrote",
        email,
        userId,
        role: newMeta.role,
        accessTier: newMeta.accessTier,
        allowlistMatch: true,
        accessGranted: true,
      },
      "Bootstrap: metadata written for first time"
    )

    return res.json({ ...newMeta, bootstrapped: true })
  } catch (err) {
    logger.error(
      { event: "entitlement.bootstrap.error", userId, err: String(err) },
      "Bootstrap error"
    )
    return res.status(500).json({ error: "Bootstrap failed" })
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
      incrementToolUsage(email, tool as Parameters<typeof incrementToolUsage>[1])
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
      incrementToolUsage(email, tool as Parameters<typeof incrementToolUsage>[1])
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

    incrementToolUsage(email, tool as Parameters<typeof incrementToolUsage>[1])
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
