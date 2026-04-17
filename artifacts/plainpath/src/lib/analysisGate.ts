import { getStoredSubscriberEmail } from "../lib/subscriberStorage";
import { consumeAnalysis } from "../lib/entitlements";
import { canRunAnalysis, canRunTrustCheck, canRunContractDraft, canRunContractReview } from "../lib/usageMeter";

// ─── Payment enforcement flag ──────────────────────────────────────────────
//
// TODO: Set PAYMENT_ENFORCEMENT_ENABLED = true once Stripe is fully
// implemented and live in production. This gates:
//   • Free-tier analysis limit (2/month)
//   • Trust Check, Contract Builder, Contract Review (Starter = blocked, Pro = allowed)
//
// Pricing tiers when enforcement is re-enabled:
//   • Free    — 2 document analyses, no other tools
//   • Starter — $4.99/month — unlimited analyses, no Pro tools
//   • Pro     — $19.99/month — all four tools, unlimited
//
// Until Stripe is live, all usage gates are bypassed so testing
// and development are never blocked by a fake paywall.
//
const PAYMENT_ENFORCEMENT_ENABLED = false
// ──────────────────────────────────────────────────────────────────────────

export class UsageLimitError extends Error {
  public readonly used: number
  public readonly limit: number
  public readonly reason: "analyses" | "trustCheck" | "contractDraft" | "contractReview"
  constructor(reason: "analyses" | "trustCheck" | "contractDraft" | "contractReview", used: number, limit: number) {
    super(`You've used ${used} of ${limit} free ${reason} this month.`)
    this.name = "UsageLimitError"
    this.reason = reason
    this.used = used
    this.limit = limit
  }
}

export async function beforeRunAnalysis() {
  if (!PAYMENT_ENFORCEMENT_ENABLED) return

  const email = getStoredSubscriberEmail();

  if (!email) {
    const { allowed, used, limit } = canRunAnalysis(null)
    if (!allowed) throw new UsageLimitError("analyses", used, limit)
    return;
  }

  await consumeAnalysis(email);
}

export function beforeRunTrustCheck(planKey?: string | null) {
  if (!PAYMENT_ENFORCEMENT_ENABLED) return

  const { allowed, used, limit } = canRunTrustCheck(planKey)
  if (!allowed) throw new UsageLimitError("trustCheck", used, limit)
}

export function beforeRunContractDraft(planKey?: string | null) {
  if (!PAYMENT_ENFORCEMENT_ENABLED) return

  const { allowed, used, limit } = canRunContractDraft(planKey)
  if (!allowed) throw new UsageLimitError("contractDraft", used, limit)
}

export function beforeRunContractReview(planKey?: string | null) {
  if (!PAYMENT_ENFORCEMENT_ENABLED) return

  const { allowed, used, limit } = canRunContractReview(planKey)
  if (!allowed) throw new UsageLimitError("contractReview", used, limit)
}
