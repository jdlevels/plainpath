// ─── Server-Side Authentication and Entitlement Middleware ───────────────────
//
// Enforces two guards on every protected AI route:
//
//   1. Authentication — requires a valid Clerk session (401 if absent).
//   2. Paywall — if BILLING_CONFIG.PAYWALL_ENFORCEMENT is true, resolves the
//      caller's plan and rejects (403) any plan that cannot access the
//      requested tool.
//
// Plan resolution priority (mirrors GET /api/entitlements/status exactly):
//   1. ADMIN_EMAILS      → unconditional "pro" access (admin bypass)
//   2. MANUAL_PRO_EMAILS → "pro" access without a Stripe subscription
//   3. SQLite billing DB → active subscriber plan via clerkUserId or email
//   4. Postgres team DB  → team member inherits team owner's "team" plan
//                          (uses pool + user_id/owner_id, same as /status)
//   5. Default           → "starter"
//
// When PAYWALL_ENFORCEMENT is false every authenticated request is allowed
// through regardless of plan, preserving development and test workflows.
//
// Audit log events:
//   entitlement.check.allowed  — caller has the required entitlement
//   entitlement.check.denied   — plan is insufficient for the requested tool
//   entitlement.check.error    — Clerk lookup failed; request denied
// ─────────────────────────────────────────────────────────────────────────────

import { type Request, type Response, type NextFunction } from "express"
import { getAuth, clerkClient } from "@clerk/express"
import { logger } from "../lib/logger"
import { getSubscriberByClerkUserId, getSubscriberByEmail } from "../lib/billingDb"
import { normalizePlan, canAccessTool, type ToolKey, type PlanKey } from "../lib/planEntitlements"
import { BILLING_CONFIG } from "../lib/billingConfig"
import { pool } from "@workspace/db"

// Build admin and manual-pro sets from env vars at startup.
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

// Resolve the effective plan for a user.
// Mirrors the exact same logic as GET /api/entitlements/status so that the
// two code paths never diverge. Team membership uses Postgres (pool) with
// user_id/owner_id columns — the canonical team schema.
async function resolveUserPlan(userId: string, email: string | null): Promise<PlanKey> {
  if (email && ADMIN_EMAILS.has(email)) return "pro"
  if (email && MANUAL_PRO_EMAILS.has(email)) return "pro"

  const subscriber =
    getSubscriberByClerkUserId(userId) ??
    (email ? getSubscriberByEmail(email) : null)

  if (subscriber && subscriber.status === "active") {
    return normalizePlan(subscriber.plan)
  }

  // Check team membership via Postgres — same query as /api/entitlements/status.
  // Uses user_id and owner_id columns (Postgres team schema).
  try {
    const teamMemberResult = await pool.query(
      `SELECT tm.role, t.id as team_id
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE tm.user_id = $1
       LIMIT 1`,
      [userId]
    )

    if (teamMemberResult.rowCount && teamMemberResult.rowCount > 0) {
      const ownerResult = await pool.query(
        `SELECT t.owner_id FROM teams t WHERE t.id = $1`,
        [teamMemberResult.rows[0].team_id]
      )

      if (ownerResult.rowCount && ownerResult.rowCount > 0) {
        const ownerId = ownerResult.rows[0].owner_id
        const ownerSub = getSubscriberByClerkUserId(ownerId)
        if (ownerSub && ownerSub.plan === "team" && ownerSub.status === "active") {
          return "team"
        }
      }
    }
  } catch {
    // Non-fatal — team lookup failure falls back to default plan
  }

  return "starter"
}

/**
 * Returns Express middleware that:
 *   1. Requires a valid Clerk session (401 if missing).
 *   2. When PAYWALL_ENFORCEMENT is enabled, verifies the caller's plan grants
 *      access to `tool` (403 if not).
 */
export function requireEntitlement(tool: ToolKey) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = getAuth(req)

    if (!auth?.userId) {
      res.status(401).json({
        error: "unauthorized",
        message: "You must be signed in to use this feature.",
      })
      return
    }

    // If paywall enforcement is disabled, any authenticated caller may proceed.
    if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) {
      return next()
    }

    const userId = auth.userId
    let email: string | null = null

    try {
      const user = await clerkClient.users.getUser(userId)
      email = (user.emailAddresses?.[0]?.emailAddress ?? "").trim().toLowerCase() || null
    } catch {
      logger.error(
        { event: "entitlement.check.error", userId, tool, path: req.path },
        "requireEntitlement: failed to resolve user email from Clerk; denying request"
      )
      res.status(403).json({
        error: "access_denied",
        message: "Unable to verify your identity. Please sign out and sign in again.",
      })
      return
    }

    const plan = await resolveUserPlan(userId, email)
    const allowed = canAccessTool(plan, tool)

    if (allowed) {
      logger.info(
        {
          event: "entitlement.check.allowed",
          userId,
          email,
          plan,
          tool,
          path: req.path,
          method: req.method,
        },
        "Entitlement check: access granted"
      )
      return next()
    }

    logger.warn(
      {
        event: "entitlement.check.denied",
        userId,
        email,
        plan,
        tool,
        path: req.path,
        method: req.method,
      },
      "Entitlement check: plan insufficient for requested tool"
    )

    res.status(403).json({
      error: "plan_required",
      message:
        plan === "starter"
          ? "This feature requires a Pro or Team plan. Please upgrade to access it."
          : "Your current plan does not include this feature. Please upgrade to access it.",
    })
  }
}
