import type { EntitlementStatus } from "../lib/entitlements";

type Props = {
  entitlements: EntitlementStatus | null;
};

export default function PlanStatusBanner({ entitlements }: Props) {
  if (!entitlements) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        No active subscription loaded on this device yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
      <div>
        <strong>Plan:</strong> {entitlements.plan.toUpperCase()}
      </div>
      <div>
        <strong>Usage:</strong> {entitlements.usageCount} /{" "}
        {entitlements.usageLimit} analyses this month
      </div>
      <div>
        <strong>Remaining:</strong> {entitlements.usageRemaining}
      </div>
    </div>
  );
}
