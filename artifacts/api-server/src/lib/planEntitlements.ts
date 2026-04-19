// ─── Plan Definitions — Single Source of Truth ────────────────────────────────
//
// Plans:
//   starter — $4.99/month  — Analyze a Document + Redact Sensitive Info
//   pro     — $19.99/month — All tools (Analyze, Trust Check, Contract Builder,
//                            Contract Review, Redact, Digital Signature)
//
// Never duplicate plan or feature logic in pages, routes, or components.
// All gating must reference TOOL_ACCESS and PLAN_ENTITLEMENTS from here.
//
// ─────────────────────────────────────────────────────────────────────────────

export type PlanKey = "starter" | "pro"

// ─── Tool Access Map ──────────────────────────────────────────────────────────

export type ToolKey =
  | "analyze"
  | "trust-check"
  | "contract-review"
  | "build-contract"
  | "redact"
  | "signature"
  | "compare"

/** Which tools each plan can access. This is the canonical feature gate. */
export const TOOL_ACCESS: Record<PlanKey, ToolKey[]> = {
  starter: ["analyze", "redact"],
  pro: ["analyze", "trust-check", "contract-review", "build-contract", "redact", "signature", "compare"],
}

/** True if the given plan can access the given tool. */
export function canAccessTool(plan: PlanKey, tool: ToolKey): boolean {
  return TOOL_ACCESS[plan]?.includes(tool) ?? false
}

// ─── Full Entitlements ────────────────────────────────────────────────────────

export type PlanEntitlements = {
  plan: PlanKey
  displayName: string
  /** Monthly price in cents */
  priceMonthly: number
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
    displayName: "Starter",
    priceMonthly: 499,
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
    displayName: "Pro",
    priceMonthly: 1999,
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
