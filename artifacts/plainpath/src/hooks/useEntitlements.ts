// ─── useEntitlements ──────────────────────────────────────────────────────────
//
// Identity resolution order (priority high → low):
//
//   1. Clerk publicMetadata.role / publicMetadata.accessTier
//      → Set server-side via Clerk API; authoritative source of truth
//      → Read client-side via useUser() with no extra round-trip
//
//   2. API /entitlements/status response (role, plan, toolAccess)
//      → Used for billing details (period end, usage, etc.)
//      → Provides fallback when publicMetadata not yet set
//
// isAdmin   = role === "admin"  (internal privilege; NOT a billing tier)
// accessTier = product entitlement controlling which tools are accessible
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react"
import { useUser } from "@clerk/react"
import { fetchEntitlements, type EntitlementStatus, type RoleKey, type AccessTier } from "../lib/entitlements"
import { getStoredSubscriberEmail, setStoredSubscriberEmail } from "../lib/subscriberStorage"

export function useEntitlements() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [data, setData] = useState<EntitlementStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // Persist Clerk email to localStorage so entitlements fetch works across page loads.
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

    // ── Read role and accessTier from Clerk publicMetadata ─────────────────
    // publicMetadata is set server-side and is available in useUser() without
    // any additional API call. This is the authoritative source of truth.
    const meta = user?.publicMetadata as { role?: RoleKey; accessTier?: AccessTier } | undefined
    const metaRole = meta?.role
    const metaAccessTier = meta?.accessTier

    if (!email && !clerkUserId) {
      setData(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await fetchEntitlements(email ?? "", clerkUserId)

      // Merge publicMetadata into the API result.
      // publicMetadata takes precedence when present.
      const resolvedRole: RoleKey | undefined =
        metaRole ?? (result.role === "admin" ? "admin" : result.role === "member" ? "member" : undefined)
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

      if (
        resolvedRole === "admin" ||
        (merged.found && merged.status === "active")
      ) {
        setData(merged)
      } else {
        setData(null)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!clerkLoaded) return
    void reload()
  }, [clerkLoaded, reload])

  // role === "admin" → internal privilege; NOT a billing/plan tier
  const isAdmin = data?.role === "admin"

  // accessTier → product entitlement (what tools the user can access)
  const accessTier = data?.accessTier ?? null

  return {
    entitlements: data,
    loading,
    reload,
    isAdmin,
    accessTier,
  }
}
