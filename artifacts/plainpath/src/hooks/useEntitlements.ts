// ─── useEntitlements ──────────────────────────────────────────────────────────
//
// Identity resolution (priority high → low):
//
//   1. API /entitlements/status response
//      Used for billing truth: found + status = "active" means confirmed active
//      subscription (Stripe or RevenueCat-verified).
//
//   2. Clerk publicMetadata.role / publicMetadata.accessTier
//      Set server-side; used for role detection (admin) only.
//      NOT used to grant tool access without confirmed active billing.
//
// Bootstrap:
//   On first sign-in, if publicMetadata is missing, POST /api/entitlements/bootstrap
//   is called. The server writes { role, accessTier } to Clerk, then user.reload()
//   is called so the client immediately picks up the fresh metadata.
//
// Access rules (launch model):
//   Admin     → always granted; role === "admin"
//   Pro       → active billing confirmed (Stripe or RC) → full Pro access
//   Lapsed    → billing inactive → null state (locked; user sees paywall)
//   No sub    → null state (locked; user sees paywall)
//
// isAdmin   = role === "admin"   (internal privilege; NOT a billing/plan tier)
// accessTier = product entitlement controlling which tools are gated
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from "react"
import { useUser, useAuth } from "@clerk/react"
import { fetchEntitlements, type EntitlementStatus, type RoleKey, type AccessTier, type ToolKey } from "../lib/entitlements"
import { getApiBaseUrl } from "../lib/api"
import { getStoredSubscriberEmail, setStoredSubscriberEmail } from "../lib/subscriberStorage"

// ── getToken with timeout ─────────────────────────────────────────────────────
// clerkLoaded(isomorphicClerk) in @clerk/react's createGetToken() waits for the
// "ready" event on Clerk's private internal event bus. In some environments
// (Playwright E2E tests, certain SSR hydration scenarios) this event may never
// fire, causing getToken() to hang indefinitely and blocking entitlements fetch.
//
// Safety net: race getToken() against a timeout. In production Clerk always
// resolves in <1 s, so the 10 s timeout is never reached. In E2E tests the
// __PLAYWRIGHT_E2E__ flag enables a 100 ms timeout and returns the mock token.
export function makeGetTokenWithTimeout(getToken: (opts?: Record<string, unknown>) => Promise<string | null>) {
  return (opts?: Record<string, unknown>): Promise<string | null> => {
    const w = typeof window !== "undefined" ? (window as Record<string, unknown>) : {}
    const isE2E   = Boolean(w.__PLAYWRIGHT_E2E__)
    const timeout = isE2E ? 100 : 10_000
    const fallback = isE2E ? (w.__PLAYWRIGHT_TOKEN__ as string | null ?? null) : null
    return Promise.race([
      getToken(opts).catch(() => null),
      new Promise<string | null>(resolve => setTimeout(() => resolve(fallback), timeout)),
    ])
  }
}

export function useEntitlements() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const { getToken: rawGetToken } = useAuth()
  const getToken = makeGetTokenWithTimeout(rawGetToken as (opts?: Record<string, unknown>) => Promise<string | null>)
  const [data, setData] = useState<EntitlementStatus | null>(null)
  const [loading, setLoading] = useState(true)
  // True only when the API confirms an active billing record exists (Stripe or RC-verified).
  // Lapsed Pro, starter metadata, and unauthenticated users all resolve to false.
  const [hasPaidSubscription, setHasPaidSubscription] = useState(false)
  // Tracks whether the very first load has completed. After that, re-fetches
  // (triggered by Clerk's ~60-second session token refresh) run silently in the
  // background without setting loading=true, preventing PlanGate from replacing
  // the workspace children with a spinner and resetting the user's document state.
  const loadedOnceRef = useRef(false)

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

    // Read role from Clerk publicMetadata — used only for admin detection.
    const meta = user?.publicMetadata as { role?: RoleKey; accessTier?: AccessTier } | undefined
    const metaRole = meta?.role
    const metaAccessTier = meta?.accessTier

    if (!email && !clerkUserId) {
      setData(null)
      setLoading(false)
      loadedOnceRef.current = true
      return
    }

    // Only block the UI with a spinner on the very first entitlements fetch.
    if (!loadedOnceRef.current) {
      setLoading(true)
    }

    // ── Bootstrap: write metadata for brand-new users ──────────────────────
    // Fires when a signed-in user has no publicMetadata.role or accessTier.
    // The server determines the correct values (member/free or admin/pro)
    // and writes them to Clerk. We then call user.reload() so the client
    // immediately sees the updated metadata before proceeding.
    if (user && (!metaRole || !metaAccessTier)) {
      try {
        // WKWebView race: retry getToken once before sending bootstrap request.
        let bootstrapToken = await getToken().catch(() => null)
        if (!bootstrapToken) {
          await new Promise<void>(r => setTimeout(r, 2000))
          bootstrapToken = await getToken().catch(() => null)
        }
        const res = await fetch(`${getApiBaseUrl()}/api/entitlements/bootstrap`, {
          method: "POST",
          headers: bootstrapToken ? { Authorization: `Bearer ${bootstrapToken}` } : undefined,
        })
        if (res.ok) {
          const bootstrapResult = await res.json()
          if (bootstrapResult.bootstrapped) {
            let reloaded = false
            try {
              await user.reload()
              reloaded = true
            } catch {
              // user.reload() failed — fall through to normal fetch below
            }
            if (reloaded) {
              return
            }
          }
        }
      } catch {
        // Bootstrap network error — proceed with whatever metadata we have.
      }
    }

    // ── Fetch billing details from API ────────────────────────────────────
    try {
      let entToken = await getToken().catch(() => null)
      // WKWebView race: session token may not be cached immediately after sign-in.
      // Retry up to two more times with increasing delays before giving up.
      if (!entToken) {
        await new Promise<void>(r => setTimeout(r, 2000))
        entToken = await getToken().catch(() => null)
      }
      if (!entToken) {
        await new Promise<void>(r => setTimeout(r, 3000))
        entToken = await getToken().catch(() => null)
      }
      const result = await fetchEntitlements(email ?? "", clerkUserId, entToken)

      // Resolve role: publicMetadata wins over API response.
      const resolvedRole: RoleKey | undefined =
        metaRole ??
        (result.role === "admin" ? "admin" : result.role === "member" ? "member" : undefined)

      // Resolve accessTier from API response (billing is the authority, not metadata).
      const resolvedAccessTier: AccessTier | undefined =
        result.accessTier ?? result.plan

      const merged: EntitlementStatus = {
        ...result,
        role: resolvedRole,
        accessTier: resolvedAccessTier,
      }

      // Admin: auto-persist email for subsequent loads
      if (resolvedRole === "admin" && !storedEmail && email) {
        setStoredSubscriberEmail(email)
      }

      // ── Billing truth: only confirmed active billing unlocks the gate ──────
      // hasPaidSubscription is true ONLY when the API confirms an active
      // subscription record (Stripe or RevenueCat-verified).
      // Stale Clerk metadata (e.g. lapsed Pro accessTier) is NOT sufficient.
      const hasActiveBilling = Boolean(merged.found && merged.status === "active")
      setHasPaidSubscription(hasActiveBilling)

      // ── Access decision ───────────────────────────────────────────────────
      //
      // SAFE DEFAULT: any state without confirmed active billing → null (locked).
      // Lapsed Pro users see the paywall, not partial dashboard access.

      if (resolvedRole === "admin") {
        // Admin: full access regardless of billing.
        setData(merged)
      } else if (hasActiveBilling) {
        // Active billing confirmed → grant tool access for their plan.
        setData(merged)
      } else {
        // No confirmed active billing — locked state.
        // Covers: new users, lapsed Pro, cancelled, starter metadata, etc.
        setData(null)
      }
    } catch {
      // ── Metadata fallback ────────────────────────────────────────────────
      // If the API call fails (e.g. WKWebView token race → 401) but Clerk
      // publicMetadata already records this user as admin or pro — meaning the
      // server previously wrote that metadata via /bootstrap — use it as an
      // offline fallback so the user is not stuck on the paywall while the
      // session token is still initialising.
      //
      // Security: metadata is server-written (never user-controlled) and is
      // only trusted here when the network call itself fails, not as an
      // override of a successful 200 response.
      //
      // Note: usageCount/usageRemaining are best-effort (0) in this fallback;
      // they are corrected on the next successful API call (e.g. next reload
      // triggered by Clerk's ~60 s token refresh).
      if (metaRole === "admin" || metaAccessTier === "pro") {
        const allProTools: import("../lib/entitlements").ToolKey[] = [
          "analyze", "trust-check", "contract-review", "build-contract",
          "redact", "compare", "clause-extractor", "compare-versions",
        ]
        const fallbackData: import("../lib/entitlements").EntitlementStatus = {
          email: email ?? "",
          role: metaRole,
          accessTier: (metaRole === "admin" ? "pro" : metaAccessTier) as import("../lib/entitlements").AccessTier | undefined,
          found: true,
          status: "active",
          plan: "pro",
          grantType: "metadata_fallback",
          monthKey: new Date().toISOString().slice(0, 7),
          usageCount: 0,
          usageLimit: 50,
          usageRemaining: 50,
          toolAccess: allProTools,
          toolUsage: {
            analyze: 0, "trust-check": 0, "contract-review": 0,
            "build-contract": 0, redact: 0, compare: 0,
            "clause-extractor": 0, "compare-versions": 0,
          },
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          billingMode: "live",
          paywallEnforcement: false,
          features: {
            plainEnglish: true, sourceSections: true, sectionExplainer: true,
            checklist: true, requiredDocs: true, deadlines: true, risks: true,
            whatsMissing: true, keyTerms: true, actionPack: true,
            savedAnalyses: true, exportShare: true,
          },
        }
        setData(fallbackData)
        setHasPaidSubscription(true)
      } else {
        setData(null)
        setHasPaidSubscription(false)
      }
    } finally {
      setLoading(false)
      loadedOnceRef.current = true
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
