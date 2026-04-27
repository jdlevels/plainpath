// ─── Shared Plan Resolution ───────────────────────────────────────────────────
//
// Resolves a Clerk userId to a PlanKey using the canonical priority order:
//   1. ADMIN_EMAILS env var   → "pro"
//   2. MANUAL_PRO_EMAILS env var → "pro"
//   3. Active Stripe subscriber (by clerkUserId or email) → subscriber plan
//   4. Active team member whose owner has a "team" subscription → "team"
//   5. Default → "free" (no paid access without a verified active subscription)
//
// This module is the single source of truth for plan resolution on the server.
// It is used by:
//   - src/lib/requireEntitlement.ts  (middleware entitlement checks)
//   - src/routes/entitlements.ts     (GET /status and POST /consume responses)
//
// When updating plan resolution logic, change ONLY this file.
//
// ─────────────────────────────────────────────────────────────────────────────

import { clerkClient } from "@clerk/express";
import { getSubscriberByClerkUserId, getSubscriberByEmail } from "./billingDb";
import { normalizePlan, type PlanKey } from "./planEntitlements";
import { pool } from "@workspace/db";

// ── Environment-defined privilege sets ────────────────────────────────────────

export const ADMIN_EMAILS: Set<string> = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export const MANUAL_PRO_EMAILS: Set<string> = new Set(
  (process.env.MANUAL_PRO_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export function isManualProEmail(email: string): boolean {
  return MANUAL_PRO_EMAILS.has(email.toLowerCase());
}

// ── Core plan resolution ──────────────────────────────────────────────────────

export interface ResolvedPlan {
  plan: PlanKey;
  email: string | null;
  source: "admin" | "manual_pro" | "stripe" | "team" | "default";
}

/**
 * Resolve a Clerk userId to a plan tier.
 *
 * Always resolves — never throws. Errors from Clerk, the billing DB, or the
 * team table are caught internally and cause the resolver to fall back to the
 * next source. The final fallback is "free" (fail-closed: no paid access
 * without a verified active subscription).
 */
export async function resolveUserPlan(userId: string): Promise<ResolvedPlan> {
  let email: string | null = null;

  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() ?? null;

    if (email && isAdminEmail(email)) {
      return { plan: "pro", email, source: "admin" };
    }

    if (email && isManualProEmail(email)) {
      return { plan: "pro", email, source: "manual_pro" };
    }

    const byClerkId = getSubscriberByClerkUserId(userId);
    const byEmail = !byClerkId && email ? getSubscriberByEmail(email) : null;
    // Only use the email-matched record if it is NOT already bound to a
    // different Clerk user. Once a clerkUserId is set on a row, that row
    // belongs exclusively to that identity — email alone is insufficient.
    const subscriber =
      byClerkId ??
      (byEmail && (!byEmail.clerkUserId || byEmail.clerkUserId === userId)
        ? byEmail
        : null);

    if (subscriber?.status === "active") {
      return { plan: normalizePlan(subscriber.plan), email, source: "stripe" };
    }

    try {
      const teamResult = await pool.query(
        `SELECT tm.role, t.id as team_id
         FROM team_members tm
         JOIN teams t ON t.id = tm.team_id
         WHERE tm.user_id = $1
         LIMIT 1`,
        [userId]
      );

      if (teamResult.rowCount && teamResult.rowCount > 0) {
        const ownerResult = await pool.query(
          `SELECT t.owner_id FROM teams t WHERE t.id = $1`,
          [teamResult.rows[0].team_id]
        );

        if (ownerResult.rowCount && ownerResult.rowCount > 0) {
          const ownerId = ownerResult.rows[0].owner_id;
          const ownerSub = getSubscriberByClerkUserId(ownerId);
          if (ownerSub && ownerSub.plan === "team" && ownerSub.status === "active") {
            return { plan: "team", email, source: "team" };
          }
        }
      }
    } catch {
      // Non-fatal: team lookup failure falls back to direct subscription tier
    }
  } catch {
    // Clerk lookup failure — fall through to default
  }

  return { plan: "free", email, source: "default" };
}
