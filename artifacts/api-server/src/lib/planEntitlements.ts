// ─── Plan Definitions — Single Source of Truth ────────────────────────────────
//
// Launch model (as of App Store submission):
//   ONE paid plan: PlainPath Pro — $19.99/month
//   TWO launch tools: Analyze a Document + Contract Review
//
// Plans:
//   free    — $0/month    — No paid tools; must subscribe to access any feature
//   starter — DISCONTINUED — Legacy plan; no tool access at launch
//   pro     — $19.99/month — Analyze a Document + Contract Review
//   team    — NOT AT LAUNCH — No tool access
//
// Identity model (see routes/entitlements.ts for full spec):
//   role        = internal privilege  ("admin" | "member")
//   accessTier  = product entitlement ("free" | "starter" | "pro")
//
//   Admin   → role:"admin"  + accessTier:"pro"    — internal + full product access
//   Free    → role:"member" + accessTier:"free"   — no paid tools; upgrade required
//   Pro     → role:"member" + accessTier:"pro"    — all launch tools; NOT admin
//
// Never duplicate plan or feature logic in pages, routes, or components.
// All gating must reference TOOL_ACCESS and PLAN_ENTITLEMENTS from here.
//
// ─────────────────────────────────────────────────────────────────────────────

export type PlanKey = "free" | "starter" | "pro" | "team"

// ─── Tool Access Map ──────────────────────────────────────────────────────────

export type ToolKey =
  | "analyze"
  | "contract-review"

/** Which tools each plan can access. This is the canonical feature gate. */
export const TOOL_ACCESS: Record<PlanKey, ToolKey[]> = {
  free:    [],
  starter: [],   // Discontinued — no longer purchasable; no tool access at launch
  pro:     ["analyze", "contract-review"],
  team:    [],   // Not available at launch
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
  free: {
    plan: "free",
    displayName: "Free",
    priceMonthly: 0,
    analysesPerMonth: 0,
    features: {
      plainEnglish: false,
      sourceSections: false,
      sectionExplainer: false,
      checklist: false,
      requiredDocs: false,
      deadlines: false,
      risks: false,
      whatsMissing: false,
      keyTerms: false,
      actionPack: false,
      savedAnalyses: false,
      exportShare: false,
    },
  },
  starter: {
    plan: "starter",
    displayName: "Starter (Legacy)",
    priceMonthly: 0,   // Discontinued — no new purchases
    analysesPerMonth: 0,
    features: {
      plainEnglish: false,
      sourceSections: false,
      sectionExplainer: false,
      checklist: false,
      requiredDocs: false,
      deadlines: false,
      risks: false,
      whatsMissing: false,
      keyTerms: false,
      actionPack: false,
      savedAnalyses: false,
      exportShare: false,
    },
  },
  team: {
    plan: "team",
    displayName: "Team (Not at launch)",
    priceMonthly: 0,   // Not available at launch
    analysesPerMonth: 0,
    features: {
      plainEnglish: false,
      sourceSections: false,
      sectionExplainer: false,
      checklist: false,
      requiredDocs: false,
      deadlines: false,
      risks: false,
      whatsMissing: false,
      keyTerms: false,
      actionPack: false,
      savedAnalyses: false,
      exportShare: false,
    },
  },
  pro: {
    plan: "pro",
    displayName: "PlainPath Pro",
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

/** Normalize any incoming plan string to a valid PlanKey. Defaults to free. */
export function normalizePlan(plan?: string | null): PlanKey {
  if (plan === "pro") return "pro"
  if (plan === "team") return "team"
  if (plan === "starter") return "starter"
  return "free"
}
