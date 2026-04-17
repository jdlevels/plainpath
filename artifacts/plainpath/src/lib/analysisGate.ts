import { getStoredSubscriberEmail } from "./subscriberStorage"
import { consumeToolUsage } from "./entitlements"
import { BILLING_CONFIG } from "./billingConfig"
import {
  canRunAnalysis,
  canRunTrustCheck,
  canRunContractDraft,
  canRunContractReview,
  incrementAnalysis,
  incrementTrustCheck,
  incrementContractDraft,
  incrementContractReview,
} from "./usageMeter"

// ─── Usage Limit Error ────────────────────────────────────────────────────────

export class UsageLimitError extends Error {
  public readonly used: number
  public readonly limit: number
  public readonly reason: "analyses" | "trustCheck" | "contractDraft" | "contractReview"
  constructor(
    reason: "analyses" | "trustCheck" | "contractDraft" | "contractReview",
    used: number,
    limit: number
  ) {
    super(`Usage limit reached for ${reason}: ${used}/${limit}`)
    this.name = "UsageLimitError"
    this.reason = reason
    this.used = used
    this.limit = limit
  }
}

// ─── Gate Functions ───────────────────────────────────────────────────────────
//
// Each gate function:
//   1. Always records usage locally (for analytics / future enforcement)
//   2. When enforcement is OFF: never blocks — returns immediately
//   3. When enforcement is ON:  validates plan and blocks if over limit
//
// To activate enforcement: set PAYWALL_ENFORCEMENT = true in billingConfig.ts
//
// ─────────────────────────────────────────────────────────────────────────────

export async function beforeRunAnalysis() {
  // Always track usage (for future enforcement and analytics)
  incrementAnalysis()

  const email = getStoredSubscriberEmail()
  if (email) {
    // Fire-and-forget: record server-side usage (non-blocking)
    void consumeToolUsage(email, "analyze").catch(() => {})
  }

  // TODO: When PAYWALL_ENFORCEMENT = true, the block below enforces limits.
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  if (!email) {
    const { allowed, used, limit } = canRunAnalysis(null)
    if (!allowed) throw new UsageLimitError("analyses", used, limit)
    return
  }

  const { allowed, used, limit } = canRunAnalysis(null)
  if (!allowed) throw new UsageLimitError("analyses", used, limit)
}

export async function beforeRunTrustCheck(planKey?: string | null) {
  // Always track usage
  incrementTrustCheck()

  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "trust-check").catch(() => {})
  }

  // TODO: When PAYWALL_ENFORCEMENT = true, the block below enforces plan limits.
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  const { allowed, used, limit } = canRunTrustCheck(planKey)
  if (!allowed) throw new UsageLimitError("trustCheck", used, limit)
}

export async function beforeRunContractDraft(planKey?: string | null) {
  // Always track usage
  incrementContractDraft()

  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "build-contract").catch(() => {})
  }

  // TODO: When PAYWALL_ENFORCEMENT = true, the block below enforces plan limits.
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  const { allowed, used, limit } = canRunContractDraft(planKey)
  if (!allowed) throw new UsageLimitError("contractDraft", used, limit)
}

export async function beforeRunContractReview(planKey?: string | null) {
  // Always track usage
  incrementContractReview()

  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "contract-review").catch(() => {})
  }

  // TODO: When PAYWALL_ENFORCEMENT = true, the block below enforces plan limits.
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  const { allowed, used, limit } = canRunContractReview(planKey)
  if (!allowed) throw new UsageLimitError("contractReview", used, limit)
}
