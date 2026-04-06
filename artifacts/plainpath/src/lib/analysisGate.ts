import { getStoredSubscriberEmail } from "../lib/subscriberStorage";
import { consumeAnalysis } from "../lib/entitlements";
import { canRunAnalysis, canRunTrustCheck, canRunContractDraft } from "../lib/usageMeter";

export class UsageLimitError extends Error {
  public readonly used: number
  public readonly limit: number
  public readonly reason: "analyses" | "trustCheck" | "contractDraft"
  constructor(reason: "analyses" | "trustCheck" | "contractDraft", used: number, limit: number) {
    super(`You've used ${used} of ${limit} free ${reason} this month.`)
    this.name = "UsageLimitError"
    this.reason = reason
    this.used = used
    this.limit = limit
  }
}

export async function beforeRunAnalysis() {
  const email = getStoredSubscriberEmail();

  if (!email) {
    const { allowed, used, limit } = canRunAnalysis(null)
    if (!allowed) throw new UsageLimitError("analyses", used, limit)
    return;
  }

  await consumeAnalysis(email);
}

export function beforeRunTrustCheck(planKey?: string | null) {
  const { allowed, used, limit } = canRunTrustCheck(planKey)
  if (!allowed) throw new UsageLimitError("trustCheck", used, limit)
}

export function beforeRunContractDraft(planKey?: string | null) {
  const { allowed, used, limit } = canRunContractDraft(planKey)
  if (!allowed) throw new UsageLimitError("contractDraft", used, limit)
}
