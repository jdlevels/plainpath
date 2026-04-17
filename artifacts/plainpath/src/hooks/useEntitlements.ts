import { useEffect, useState } from "react";
import { fetchEntitlements, type EntitlementStatus } from "../lib/entitlements";
import { getStoredSubscriberEmail } from "../lib/subscriberStorage";

export function useEntitlements() {
  const [data, setData] = useState<EntitlementStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const email = getStoredSubscriberEmail();

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
    void reload();
  }, []);

  return {
    entitlements: data,
    loading,
    reload,
  };
}
