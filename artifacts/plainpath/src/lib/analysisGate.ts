import { getStoredSubscriberEmail } from "../lib/subscriberStorage";
import { consumeAnalysis } from "../lib/entitlements";

export async function beforeRunAnalysis() {
  const email = getStoredSubscriberEmail();

  // No stored email means no active subscription.
  // Allow the analysis to proceed — quota is only enforced for known subscribers.
  if (!email) return;

  // Subscriber found: enforce quota via the server.
  // consumeAnalysis throws if the subscriber is over their limit.
  await consumeAnalysis(email);
}
