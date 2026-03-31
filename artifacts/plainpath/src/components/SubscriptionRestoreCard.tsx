import { useState } from "react";
import {
  getStoredSubscriberEmail,
  setStoredSubscriberEmail,
  clearStoredSubscriberEmail,
} from "../lib/subscriberStorage";
import { fetchEntitlements, type EntitlementStatus } from "../lib/entitlements";

type Props = {
  onLoaded: (value: EntitlementStatus | null) => void;
};

export default function SubscriptionRestoreCard({ onLoaded }: Props) {
  const [email, setEmail] = useState(getStoredSubscriberEmail() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRestore() {
    try {
      setLoading(true);
      setError("");

      const normalized = email.trim().toLowerCase();
      const data = await fetchEntitlements(normalized);

      if (!data.found || data.status !== "active") {
        setError("No active subscription was found for this email.");
        return;
      }

      setStoredSubscriberEmail(normalized);
      onLoaded(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to restore subscription"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    clearStoredSubscriberEmail();
    setEmail("");
    setError("");
    onLoaded(null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Restore your subscription
      </h3>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Enter the email used during Stripe checkout to load your PlainPath plan
        on this device/browser.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />

        <button
          type="button"
          onClick={() => void handleRestore()}
          disabled={loading || !email.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Checking..." : "Restore Access"}
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          Clear
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}
