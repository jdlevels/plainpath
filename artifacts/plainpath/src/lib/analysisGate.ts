import { getStoredSubscriberEmail } from "../lib/subscriberStorage";
import { consumeAnalysis } from "../lib/entitlements";
import { canRunAnalysis } from "../lib/usageMeter";

export class UsageLimitError extends Error {
  public readonly used: number
  public readonly limit: number
  constructor(used: number, limit: number) {
    super(`You've used ${used} of ${limit} free analyses this month.`)
    this.name = "UsageLimitError"
    this.used = used
    this.limit = limit
  }
}

export async function beforeRunAnalysis() {
  const email = getStoredSubscriberEmail();

  if (!email) {
    // Non-subscriber: enforce local quota
    const { allowed, used, limit } = canRunAnalysis(null)
    if (!allowed) {
      throw new UsageLimitError(used, limit)
    }
    return;
  }

  // Subscriber found: enforce quota via the server.
  // consumeAnalysis throws if the subscriber is over their limit.
  await consumeAnalysis(email);
}
