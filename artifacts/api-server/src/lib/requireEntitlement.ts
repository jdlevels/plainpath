// ─── Server-Side Entitlement Middleware ───────────────────────────────────────
//
// Provides Express middleware that enforces:
//   1. Authentication — user must have a valid Clerk session (always).
//   2. Plan entitlement — user's resolved plan must include the required tool
//      (enforced only when BILLING_CONFIG.PAYWALL_ENFORCEMENT is true).
//
// Plan resolution is delegated to src/lib/resolvePlan.ts, the single source
// of truth shared with routes/entitlements.ts.
//
// Usage:
//   import { requireEntitlement } from "../lib/requireEntitlement";
//   router.post("/my-route", requireEntitlement("trust-check"), handler);
//
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { resolveUserPlan } from "./resolvePlan";
import { canAccessTool, type ToolKey } from "./planEntitlements";
import { BILLING_CONFIG } from "./billingConfig";
import { logger } from "./logger";

/**
 * Express middleware that requires the requesting user to be authenticated
 * and to have a plan that includes the specified tool.
 *
 * Always returns 401 for unauthenticated requests.
 * Returns 403 when PAYWALL_ENFORCEMENT is enabled and the user's plan
 * does not include the required tool.
 */
export function requireEntitlement(tool: ToolKey) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = getAuth(req);

    if (!userId) {
      logger.warn(
        { event: "entitlement.denied.unauthenticated", tool, path: req.path },
        "Entitlement denied: unauthenticated request"
      );
      res.status(401).json({
        error: "unauthorized",
        message: "You must be signed in to use this feature.",
      });
      return;
    }

    if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) {
      next();
      return;
    }

    const resolved = await resolveUserPlan(userId);

    if (!canAccessTool(resolved.plan, tool)) {
      logger.warn(
        {
          event: "entitlement.denied.plan",
          tool,
          userId,
          plan: resolved.plan,
          planSource: resolved.source,
          path: req.path,
        },
        "Entitlement denied: plan does not include tool"
      );
      res.status(403).json({
        error: "plan_required",
        message: "This feature requires a higher-tier plan. Please upgrade to access it.",
        tool,
        currentPlan: resolved.plan,
      });
      return;
    }

    next();
  };
}
