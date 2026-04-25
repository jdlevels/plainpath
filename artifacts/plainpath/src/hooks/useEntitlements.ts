// ─── useEntitlements ──────────────────────────────────────────────────────────
//
// Identity resolution (priority high → low):
//
//   1. Clerk publicMetadata.role / publicMetadata.accessTier
//      Set server-side; authoritative source of truth.
//      Available client-side via useUser() with no extra round-trip.
//
//   2. API /entitlements/status response
//      Used for billing details (period end, usage, cancel status).
//
// Bootstrap:
//   On first sign-in, if publicMetadata is missing, POST /api/entitlements/bootstrap
//   is called. The server writes { role, accessTier } to Clerk, then user.reload()
//   is called so the client immediately picks up the fresh metadata before
//   rendering any gated tool.
//
// Access rules:
//   Admin     → always granted; role === "admin"
//   Starter   → metadata alone grants Starter tools (analyze + redact); no billing required
//   Pro       → metadata + active Stripe subscription grants all 8 tools
//   Pro (no billing) → graceful downgrade to Starter tool set
//   No metadata → null state (locked; safe default)
//
// isAdmin   = role === "admin"   (internal privilege; NOT a billing/plan tier)
// accessTier = product entitlement controlling which tools are gated
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react"
import { useUser } from "@clerk/react"
import { fetchEntitlements, type EntitlementStatus, type RoleKey, type AccessTier, type ToolKey } from "../lib/entitlements"
import { getStoredSubscriberEmail, setStoredSubscriberEmail } from "../lib/subscriberStorage"

// Starter tools — used for graceful Pro→Starter downgrade when billing lapses.
const STARTER_TOOLS: ToolKey[] = ["analyze", "redact"]

export function useEntitlements() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [data, setData] = useState<EntitlementStatus | null>(null)
  const [loading, setLoading] = useState(true)
  // True only when the API confirms an active Stripe subscription record exists.
  // This is the raw billing truth BEFORE any client-side overrides (e.g. the
  // starter/graceful-downgrade paths that set status="active" even without billing).
  const [hasPaidSubscription, setHasPaidSubscription] = useState(false)

  // Persist Clerk email to localStorage so entitlements fetch works across reloads.
  useEffect(() => {
    if (!clerkLoaded) return
    const clerkEmail = user?.emailAddresses?.[0]?.emailAddress
    if (clerkEmail) {
      const stored = getStoredSubscriberEmail()
      if (!stored || stored === clerkEmail.trim().toLowerCase()) {
        setStoredSubscriberEmail(clerkEmail)
      }
    }
  }, [clerkLoaded, user])

  const reload = useCallback(async () => {
    const storedEmail = getStoredSubscriberEmail()
    const clerkEmail = user?.emailAddresses?.[0]?.emailAddress ?? null
    const email = storedEmail || clerkEmail
    const clerkUserId = user?.id ?? null

    // Read role and accessTier from Clerk publicMetadata (authoritative source).
    const meta = user?.publicMetadata as { role?: RoleKey; accessTier?: AccessTier } | undefined
    const metaRole = meta?.role
    const metaAccessTier = meta?.accessTier

    if (!email && !clerkUserId) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)

    // ── Bootstrap: write metadata for brand-new users ──────────────────────
    // Fires when a signed-in user has no publicMetadata.role or accessTier.
    // The server determines the correct values (member/starter or admin/pro)
    // and writes them to Clerk. We then call user.reload() so the client
    // immediately sees the updated metadata before proceeding.
    // loading stays true while we wait — the next reload() cycle completes it.
    if (user && (!metaRole || !metaAccessTier)) {
      try {
        const res = await fetch("/api/entitlements/bootstrap", { method: "POST" })
        if (res.ok) {
          const bootstrapResult = await res.json()
          if (bootstrapResult.bootstrapped) {
            // Metadata was just written. Refresh the Clerk session so
            // user.publicMetadata reflects the new values immediately.
            let reloaded = false
            try {
              await user.reload()
              reloaded = true
            } catch {
              // user.reload() failed — fall through to normal fetch below
            }
            if (reloaded) {
              // The useEffect dependency on `user` will re-trigger reload()
              // with fresh metadata. Keep loading=true during the transition.
              return
            }
          }
          // bootstrapped=false: metadata already set; continue with current values.
        }
      } catch {
        // Bootstrap network error — proceed with whatever metadata we have.
      }
    }

    // ── Fetch billing details from API ────────────────────────────────────
    try {
      const result = await fetchEntitlements(email ?? "", clerkUserId)

      // Resolve role: publicMetadata wins over API response.
      const resolvedRole: RoleKey | undefined =
        metaRole ??
        (result.role === "admin" ? "admin" : result.role === "member" ? "member" : undefined)

      // Resolve accessTier: publicMetadata wins over API response.
      const resolvedAccessTier: AccessTier | undefined =
        metaAccessTier ?? result.accessTier ?? result.plan

      const merged: EntitlementStatus = {
        ...result,
        role: resolvedRole,
        accessTier: resolvedAccessTier,
      }

      // Admin: auto-persist email for subsequent loads
      if (resolvedRole === "admin" && !storedEmail && email) {
        setStoredSubscriberEmail(email)
      }

      // ── Billing truth: raw API response before any client-side overrides ──
      // hasPaidSubscription is true when EITHER:
      //   a) The Stripe DB confirms an active subscription record, OR
      //   b) The user has Pro publicMetadata (manually granted Pro access).
      //      This covers accounts like yelevels@gmail.com that were given Pro
      //      access before Stripe was wired up, without blocking them at the gate.
      // Admin role is handled separately in PlanGate and never reaches this gate.
      const hasActiveBilling = Boolean(merged.found && merged.status === "active")
      const hasManualProGrant = resolvedAccessTier === "pro"
      setHasPaidSubscription(hasActiveBilling || hasManualProGrant)

      // ── Access decision: metadata-first, billing-verified for Pro ─────────
      //
      // SAFE DEFAULT: missing metadata → null (locked). Never grant access to
      // an unknown state — the permissive fallback was the source of the 3-tool
      // access bug.

      if (resolvedRole === "admin") {
        // Admin: full access regardless of billing.
        setData(merged)
      } else if (resolvedAccessTier === "starter") {
        // Starter: publicMetadata grants Starter tools without billing.
        // Override found/status so tool cards render correctly.
        setData({ ...merged, found: true, status: "active" })
      } else if (resolvedAccessTier === "pro" && merged.found && merged.status === "active") {
        // Pro subscriber: active billing confirmed → full Pro access.
        setData(merged)
      } else if (resolvedAccessTier === "pro") {
        // Pro metadata but no active billing (e.g. subscription lapsed):
        // gracefully downgrade to Starter tools until billing is restored.
        setData({
          ...merged,
          found: true,
          status: "active",
          plan: "starter",
          toolAccess: STARTER_TOOLS,
          accessTier: "starter",
        })
      } else {
        // No valid metadata — locked state. Do NOT grant partial access.
        setData(null)
      }
    } catch {
      setData(null)
      setHasPaidSubscription(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!clerkLoaded) return
    void reload()
  }, [clerkLoaded, reload])

  // role === "admin" → internal privilege; never a billing tier
  const isAdmin = data?.role === "admin"

  // accessTier → product entitlement controlling which tools are accessible
  const accessTier = data?.accessTier ?? null

  return {
    entitlements: data,
    loading,
    reload,
    isAdmin,
    accessTier,
    hasPaidSubscription,
  }
}
