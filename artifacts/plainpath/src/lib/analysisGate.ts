import { getStoredSubscriberEmail } from "./subscriberStorage"
import { consumeToolUsage } from "./entitlements"
import { BILLING_CONFIG } from "./billingConfig"
import {
  canRunAnalysis,
  canRunTrustCheck,
  canRunContractDraft,
  canRunContractReview,
  canRunRedact,
  incrementAnalysis,
  incrementTrustCheck,
  incrementContractDraft,
  incrementContractReview,
  incrementRedact,
} from "./usageMeter"

// ─── Usage Limit Error ────────────────────────────────────────────────────────

export class UsageLimitError extends Error {
  public readonly used: number
  public readonly limit: number
  public readonly reason: "analyses" | "trustCheck" | "contractDraft" | "contractReview" | "redact"
  constructor(
    reason: "analyses" | "trustCheck" | "contractDraft" | "contractReview" | "redact",
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
//   1. Always records usage locally (analytics)
//   2. When PAYWALL_ENFORCEMENT is OFF: never blocks — returns immediately
//   3. When PAYWALL_ENFORCEMENT is ON:  validates plan; throws UsageLimitError if blocked
//
// ─────────────────────────────────────────────────────────────────────────────

export async function beforeRunAnalysis() {
  incrementAnalysis()
  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "analyze").catch(() => {})
  }
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
  incrementTrustCheck()
  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "trust-check").catch(() => {})
  }
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  const { allowed, used, limit } = canRunTrustCheck(planKey)
  if (!allowed) throw new UsageLimitError("trustCheck", used, limit)
}

export async function beforeRunContractDraft(planKey?: string | null) {
  incrementContractDraft()
  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "build-contract").catch(() => {})
  }
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  const { allowed, used, limit } = canRunContractDraft(planKey)
  if (!allowed) throw new UsageLimitError("contractDraft", used, limit)
}

export async function beforeRunContractReview(planKey?: string | null) {
  incrementContractReview()
  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "contract-review").catch(() => {})
  }
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  const { allowed, used, limit } = canRunContractReview(planKey)
  if (!allowed) throw new UsageLimitError("contractReview", used, limit)
}

export async function beforeRunRedact(planKey?: string | null) {
  incrementRedact()
  const email = getStoredSubscriberEmail()
  if (email) {
    void consumeToolUsage(email, "redact").catch(() => {})
  }
  if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return

  const { allowed, used, limit } = canRunRedact(planKey)
  if (!allowed) throw new UsageLimitError("redact", used, limit)
}
