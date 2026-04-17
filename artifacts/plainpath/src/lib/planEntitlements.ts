// ─── Client-side Plan Definitions ────────────────────────────────────────────
//
// Single source of truth for plan-level feature access on the frontend.
// Plans: starter ($4.99/mo) | pro ($19.99/mo)
//
// Server-side mirror: artifacts/api-server/src/lib/planEntitlements.ts
// ─────────────────────────────────────────────────────────────────────────────

export type PlanKey = "starter" | "pro"

export type PlanEntitlements = {
  plan: PlanKey
  analysesPerMonth: number
  features: {
    plainEnglish: boolean
    sourceSections: boolean
    sectionExplainer: boolean
    checklist: boolean
    requiredDocs: boolean
    deadlines: boolean
    risks: boolean
    whatsMissing: boolean
    keyTerms: boolean
    actionPack: boolean
    savedAnalyses: boolean
    exportShare: boolean
  }
}

export const PLAN_ENTITLEMENTS: Record<PlanKey, PlanEntitlements> = {
  starter: {
    plan: "starter",
    analysesPerMonth: Infinity,
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
    analysesPerMonth: Infinity,
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
}

/** Normalize any incoming plan string to a valid PlanKey. Defaults to starter. */
export function normalizePlan(plan?: string | null): PlanKey {
  if (plan === "pro") return "pro"
  return "starter"
}
