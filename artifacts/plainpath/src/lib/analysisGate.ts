import { getStoredSubscriberEmail } from "../lib/subscriberStorage";
import { consumeAnalysis } from "../lib/entitlements";

export async function beforeRunAnalysis() {
  const email = getStoredSubscriberEmail();

  if (!email) {
    throw new Error(
      "Please restore your subscription email before running a paid analysis."
    );
  }

  await consumeAnalysis(email);
}
