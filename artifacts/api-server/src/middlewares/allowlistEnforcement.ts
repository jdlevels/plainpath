// ─── Allowlist Enforcement Middleware ────────────────────────────────────────
//
// Defense-in-depth layer that runs AFTER clerkMiddleware() on every authenticated
// API route. Any signed-in user whose email is not in ALLOWED_EMAILS receives a
// 403 immediately — no tool access, no entitlement check, no data read.
//
// Unauthenticated requests (no Clerk session) pass through untouched; individual
// route handlers are responsible for requiring auth where needed.
//
// ALLOWED_EMAILS — comma-separated env var. Must include every email address that
// is permitted to use the application. Currently:
//   support@plainpathapp.com  (admin / pro)
//   yelevels@gmail.com        (member / pro)
//
// Any other email reaching the server is treated as unauthorized even if Clerk
// accepted it — this is defense-in-depth on top of Clerk's own allowlist.
//
// Audit log fields emitted on every decision:
//   event      — "allowlist.granted" | "allowlist.denied"
//   email      — resolved email from Clerk session
//   userId     — Clerk userId
//   allowed    — boolean
//   path       — request path (query stripped)
//   method     — HTTP method
// ─────────────────────────────────────────────────────────────────────────────

import { type Request, type Response, type NextFunction } from "express"
import { getAuth, clerkClient } from "@clerk/express"
import { logger } from "../lib/logger"

// Build the allowlist from the ALLOWED_EMAILS env var at startup.
// Normalise to lowercase and strip whitespace so comparisons are safe.
const ALLOWED_EMAILS: Set<string> = new Set(
  (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

if (ALLOWED_EMAILS.size === 0) {
  // Warn loudly at startup — an empty allowlist means every user passes.
  // This prevents a misconfigured env from silently granting open access.
  logger.warn(
    "ALLOWED_EMAILS is empty — allowlist enforcement is effectively disabled. " +
    "Set ALLOWED_EMAILS=<comma-separated emails> to restrict access."
  )
}

export function allowlistEnforcement() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = getAuth(req)

    // No session → unauthenticated request; let the route handler decide.
    if (!auth?.userId) {
      return next()
    }

    const userId = auth.userId
    let email: string | null = null

    try {
      const user = await clerkClient.users.getUser(userId)
      email = (user.emailAddresses?.[0]?.emailAddress ?? "").trim().toLowerCase()
    } catch {
      // If we cannot resolve the email we must fail closed — deny the request.
      logger.error(
        { event: "allowlist.error", userId, path: req.path },
        "Failed to resolve user email for allowlist check; denying request"
      )
      res.status(403).json({
        error: "access_denied",
        message: "Unable to verify your identity. Please sign out and sign in again.",
      })
      return
    }

    // Empty allowlist → enforcement is disabled (warn already logged at startup).
    // Explicit allow so the app doesn't break when env var is not yet configured.
    if (ALLOWED_EMAILS.size === 0) {
      return next()
    }

    const allowed = ALLOWED_EMAILS.has(email)

    if (allowed) {
      logger.info(
        {
          event: "allowlist.granted",
          email,
          userId,
          path: req.path,
          method: req.method,
          allowed: true,
        },
        "Allowlist: access granted"
      )
      return next()
    }

    // Not in the allowlist — deny access and log the attempt.
    logger.warn(
      {
        event: "allowlist.denied",
        email,
        userId,
        path: req.path,
        method: req.method,
        allowed: false,
      },
      "Allowlist: access DENIED — unauthorized email"
    )

    res.status(403).json({
      error: "unauthorized_user",
      message: "This application is invite-only. Your account is not authorized to access PlainPath.",
    })
  }
}
