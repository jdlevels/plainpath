import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { fetchEntitlements, type EntitlementStatus } from "../lib/entitlements";
import { getStoredSubscriberEmail } from "../lib/subscriberStorage";

export function useEntitlements() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<EntitlementStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    // Prefer the stored subscriber email (from Stripe checkout), then Clerk user email
    const storedEmail = getStoredSubscriberEmail();
    const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? null;
    const email = storedEmail || clerkEmail;

    if (!email) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await fetchEntitlements(email);
      if (result.found && result.status === "active") {
        setData(result);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    void reload();
  }, [isLoaded, user?.id]);

  return {
    entitlements: data,
    loading: !isLoaded || loading,
    reload,
  };
}
