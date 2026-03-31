export type EntitlementStatus = {
  email: string;
  found: boolean;
  status: string;
  plan: "starter" | "pro" | "team";
  monthKey: string;
  usageCount: number;
  usageLimit: number;
  usageRemaining: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  features: {
    plainEnglish: boolean;
    sourceSections: boolean;
    sectionExplainer: boolean;
    checklist: boolean;
    requiredDocs: boolean;
    deadlines: boolean;
    risks: boolean;
    whatsMissing: boolean;
    keyTerms: boolean;
    actionPack: boolean;
    savedAnalyses: boolean;
    exportShare: boolean;
  };
};

export async function fetchEntitlements(email: string) {
  const response = await fetch(
    `/api/entitlements/status?email=${encodeURIComponent(email)}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Unable to load entitlements");
  }

  return data as EntitlementStatus;
}

export async function consumeAnalysis(email: string) {
  const response = await fetch("/api/entitlements/consume-analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Unable to record analysis usage");
  }

  return data as {
    ok: true;
    plan: "starter" | "pro" | "team";
    usageCount: number;
    usageLimit: number;
    usageRemaining: number;
  };
}
