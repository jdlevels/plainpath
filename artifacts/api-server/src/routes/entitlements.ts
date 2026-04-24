// ─── PlainPath Identity Model (server-side) ────────────────────────────────────
//
//   role        = internal privilege  ("admin" | "member")
//   accessTier  = product entitlement ("starter" | "pro")
//
//   Admin   → { role: "admin",  accessTier: "pro"     }   (ADMIN_EMAILS)
//   New user→ { role: "member", accessTier: "starter" }   (any new signup)
//   Paid    → { role: "member", accessTier: "pro"     }   (active Stripe subscription)
//
// Sources of truth (in priority order):
//   1. ADMIN_EMAILS env var   — which users are admins (admin/pro, no payment required)
//   2. Stripe subscriber DB   — active subscription → plan tier
//   3. Clerk publicMetadata   — role + accessTier (cached, written by /bootstrap)
//
// unsafeMetadata is NEVER used for access control.
//
// Audit log events:
//   entitlement.status.granted   — /status returned data
//   entitlement.bootstrap.noop   — metadata already set; no-op
//   entitlement.bootstrap.wrote  — metadata written for first time
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
import { pool } from "@workspace/db"

const router = Router()

// ── Admin helpers ──────────────────────────────────────────────────────────────
//
// ADMIN_EMAILS — emails that receive admin role + pro access without needing
//   a Stripe subscription. Set via ADMIN_EMAILS env var (comma-separated).
//   Currently: support@plainpathapp.com
//
// MANUAL_PRO_EMAILS — emails that receive member role + pro access without
//   a Stripe subscription (e.g. manually granted Pro seats, beta testers).
//   Set via MANUAL_PRO_EMAILS env var (comma-separated).

const ADMIN_EMAILS: Set<string> = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

const MANUAL_PRO_EMAILS: Set<string> = new Set(
  (process.env.MANUAL_PRO_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase())
}

function isManualProEmail(email: string): boolean {
  return MANUAL_PRO_EMAILS.has(email.toLowerCase())
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
// Returns entitlement data for the requesting user.
//
// Security model:
//   - Requires a valid Clerk session JWT. Unauthenticated requests receive 401.
//   - Admin check and metadata bootstrap are ALWAYS based on the authenticated
//     session user's Clerk email — never on a caller-supplied query email.
//     This prevents privilege escalation via cross-email admin probing.
//   - An email query param is accepted ONLY for the subscription-restore flow
//     (when a subscription email differs from the Clerk sign-in email). For
//     cross-email queries, only minimal subscriber state is returned (found +
//     status); full entitlement details require querying one's own email.

router.get("/status", async (req, res) => {
  try {
    const sessionUserId = getAuth(req)?.userId ?? null

    // Require a valid Clerk session — unauthenticated email-only probes are rejected.
    if (!sessionUserId) {
      return res.status(401).json({ error: "Authentication required." })
    }

    // Resolve the session user's verified email from Clerk — this is the
    // authoritative identity used for admin checks and metadata bootstrap.
    const clerkUser = await clerkClient.users.getUser(sessionUserId)
    const sessionEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() ?? null

    // The query email is an optional hint for the subscription-restore flow.
    const queryEmail = String(req.query.email || "").trim().toLowerCase()

    // Determine which email to look up subscriber state for.
    let resolvedEmail: string | null = queryEmail || sessionEmail

    if (!resolvedEmail && sessionUserId) {
      const byClerk = getSubscriberByClerkUserId(sessionUserId)
      if (byClerk) {
        resolvedEmail = byClerk.email
      } else {
        return res.json({ email: null, found: false, status: "inactive", plan: "starter" })
      }
    }

    if (!resolvedEmail) {
      return res.status(400).json({ error: "Unable to resolve identity." })
    }

    // ── Admin bypass ───────────────────────────────────────────────────────
    // Admin eligibility is determined solely from the authenticated Clerk
    // session email. A cross-email query can NEVER grant or expose admin status.
    if (sessionEmail && isAdminEmail(sessionEmail)) {
      const proEntitlements = PLAN_ENTITLEMENTS["pro"]
      void bootstrapAdminMetadata(sessionUserId, sessionEmail)
      logger.info(
        {
          event: "entitlement.status.granted",
          email: sessionEmail,
          userId: sessionUserId,
          role: "admin",
          accessTier: "pro",
        },
        "Entitlement status granted: admin"
      )
      return res.json({
        email: sessionEmail,
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

    // ── Manual Pro grant bypass ────────────────────────────────────────────
    // MANUAL_PRO_EMAILS are member-role users granted Pro without Stripe.
    // Usage is tracked normally; all Pro tools and limits apply.
    if (sessionEmail && isManualProEmail(sessionEmail)) {
      const proEntitlements = PLAN_ENTITLEMENTS["pro"]
      const usageCount = getUsageForCurrentMonth(sessionEmail)
      const toolUsage = getAllToolUsageForCurrentMonth(sessionEmail)
      logger.info(
        {
          event: "entitlement.status.granted",
          email: sessionEmail,
          userId: sessionUserId,
          role: "member",
          accessTier: "pro",
          grantType: "manual",
        },
        "Entitlement status granted: manual pro"
      )
      return res.json({
        email: sessionEmail,
        role: "member",
        accessTier: "pro",
        found: true,
        status: "active",
        plan: "pro",
        monthKey: getCurrentMonthKey(),
        usageCount,
        usageLimit: proEntitlements.analysesPerMonth,
        usageRemaining:
          proEntitlements.analysesPerMonth === Infinity
            ? Infinity
            : Math.max(proEntitlements.analysesPerMonth - usageCount, 0),
        toolAccess: TOOL_ACCESS["pro"],
        toolUsage,
        features: proEntitlements.features,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingMode: BILLING_CONFIG.BILLING_MODE,
        paywallEnforcement: BILLING_CONFIG.PAYWALL_ENFORCEMENT,
      })
    }

    // ── Own-account query — full response ──────────────────────────────────
    // Cross-email queries are not permitted. Only the authenticated user's own
    // subscriber record (matched by Clerk user ID or session email) is returned.
    // This prevents subscription state enumeration for arbitrary email addresses.
    const subscriber =
      getSubscriberByClerkUserId(sessionUserId) ??
      (sessionEmail ? getSubscriberByEmail(sessionEmail) : null)

    // Use the subscriber's canonical email (or session email) for usage tracking —
    // never the caller-supplied query email.
    const accountEmail = subscriber?.email ?? sessionEmail ?? resolvedEmail

    let plan = normalizePlan(subscriber?.plan)
    let status = subscriber?.status || "inactive"

    // If no active direct subscription, check PostgreSQL team membership
    if (status !== "active" && sessionUserId) {
      try {
        const teamMemberResult = await pool.query(
          `SELECT tm.role, t.id as team_id
           FROM team_members tm
           JOIN teams t ON t.id = tm.team_id
           WHERE tm.user_id = $1
           LIMIT 1`,
          [sessionUserId]
        )
        if (teamMemberResult.rowCount && teamMemberResult.rowCount > 0) {
          // User is a team member — check if the team owner has an active team subscription
          const ownerResult = await pool.query(
            `SELECT t.owner_id FROM teams t WHERE t.id = $1`,
            [teamMemberResult.rows[0].team_id]
          )
          if (ownerResult.rowCount && ownerResult.rowCount > 0) {
            const ownerId = ownerResult.rows[0].owner_id
            const ownerSub = getSubscriberByClerkUserId(ownerId)
            if (ownerSub && ownerSub.plan === "team" && ownerSub.status === "active") {
              plan = "team"
              status = "active"
            }
          }
        }
      } catch {
        // Non-fatal: team lookup failed, fall back to direct subscription
      }
    }

    const entitlements = PLAN_ENTITLEMENTS[plan]
    const usageCount = getUsageForCurrentMonth(accountEmail)
    const toolUsage = getAllToolUsageForCurrentMonth(accountEmail)

    logger.info(
      {
        event: "entitlement.status.granted",
        email: accountEmail,
        userId: sessionUserId,
        role: "member",
        accessTier: plan,
        billingStatus: status,
      },
      "Entitlement status granted: member"
    )

    return res.json({
      email: accountEmail,
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
//   ADMIN_EMAILS  → { role: "admin",  accessTier: "pro"     }
//   Everyone else → { role: "member", accessTier: "starter" }
//
// Starter users can upgrade to Pro via Stripe checkout.
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

    // ── Determine role + tier ─────────────────────────────────────────────
    // Admins (ADMIN_EMAILS) get Pro access immediately.
    // Manual pro grant (MANUAL_PRO_EMAILS) get member/pro without Stripe.
    // Everyone else starts as a Starter member and upgrades via Stripe.
    const newMeta: { role: string; accessTier: string } = isAdminEmail(email)
      ? { role: "admin", accessTier: "pro" }
      : isManualProEmail(email)
      ? { role: "member", accessTier: "pro" }
      : { role: "member", accessTier: "starter" }

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
