import { useEffect, useState, useCallback } from "react"
import { useUser } from "@clerk/react"
import { fetchEntitlements, type EntitlementStatus } from "../lib/entitlements"
import { getStoredSubscriberEmail, setStoredSubscriberEmail } from "../lib/subscriberStorage"

export function useEntitlements() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [data, setData] = useState<EntitlementStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    // Priority: stored subscriber email → Clerk signed-in email
    const storedEmail = getStoredSubscriberEmail()
    const clerkEmail = user?.emailAddresses?.[0]?.emailAddress ?? null
    const email = storedEmail || clerkEmail

    if (!email) {
      setData(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await fetchEntitlements(email)

      // Admin: server returns role="admin", found=true, status="active", plan="pro"
      // Auto-store email so subsequent page loads don't require Clerk fallback
      if (result.role === "admin" && !storedEmail) {
        setStoredSubscriberEmail(email)
      }

      if (result.found && result.status === "active") {
        setData(result)
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
    // Wait for Clerk to finish loading before attempting fetch
    if (!clerkLoaded) return
    void reload()
  }, [clerkLoaded, reload])

  const isAdmin = data?.role === "admin"

  return {
    entitlements: data,
    loading,
    reload,
    isAdmin,
  }
}
