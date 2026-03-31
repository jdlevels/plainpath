export type PlanKey = "starter" | "pro" | "team";

export type PlanEntitlements = {
  plan: PlanKey;
  analysesPerMonth: number;
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

export const PLAN_ENTITLEMENTS: Record<PlanKey, PlanEntitlements> = {
  starter: {
    plan: "starter",
    analysesPerMonth: 10,
    features: {
      plainEnglish: true,
      sourceSections: false,
      sectionExplainer: false,
      checklist: false,
      requiredDocs: false,
      deadlines: false,
      risks: false,
      whatsMissing: false,
      keyTerms: true,
      actionPack: true,
      savedAnalyses: true,
      exportShare: true,
    },
  },
  pro: {
    plan: "pro",
    analysesPerMonth: 100,
    features: {
      plainEnglish: true,
      sourceSections: true,
      sectionExplainer: true,
      checklist: true,
      requiredDocs: true,
      deadlines: true,
      risks: true,
      whatsMissing: true,
      keyTerms: true,
      actionPack: true,
      savedAnalyses: true,
      exportShare: true,
    },
  },
  team: {
    plan: "team",
    analysesPerMonth: 500,
    features: {
      plainEnglish: true,
      sourceSections: true,
      sectionExplainer: true,
      checklist: true,
      requiredDocs: true,
      deadlines: true,
      risks: true,
      whatsMissing: true,
      keyTerms: true,
      actionPack: true,
      savedAnalyses: true,
      exportShare: true,
    },
  },
};

export function normalizePlan(plan?: string | null): PlanKey {
  if (plan === "pro") return "pro";
  if (plan === "team") return "team";
  return "starter";
}
