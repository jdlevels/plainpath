const STORAGE_KEY = "plainpath-usage-v1"

type UsageRecord = {
  month: string
  analyses: number
  trustChecks: number
  contractDrafts: number
  contractReviews: number
  redacts: number
}

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getRecord(): UsageRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as UsageRecord
      if (parsed.month === getCurrentMonth()) return parsed
    }
  } catch {}
  return { month: getCurrentMonth(), analyses: 0, trustChecks: 0, contractDrafts: 0, contractReviews: 0, redacts: 0 }
}

function saveRecord(record: UsageRecord): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)) } catch {}
}

export function incrementAnalysis(): void {
  const r = getRecord(); r.analyses += 1; saveRecord(r)
}
export function incrementTrustCheck(): void {
  const r = getRecord(); r.trustChecks += 1; saveRecord(r)
}
export function incrementContractDraft(): void {
  const r = getRecord(); r.contractDrafts += 1; saveRecord(r)
}
export function incrementContractReview(): void {
  const r = getRecord(); r.contractReviews += 1; saveRecord(r)
}
export function incrementRedact(): void {
  const r = getRecord(); r.redacts += 1; saveRecord(r)
}

export function getUsage(): UsageRecord {
  return getRecord()
}

// ─── Per-plan limits ──────────────────────────────────────────────────────────
// free    = no subscription (2 free analyses only; all other tools blocked)
// starter = $4.99/mo (Analyze + Redact; Trust Check / Contract tools locked)
// pro     = $19.99/mo (all 5 live tools)

const LIMITS: Record<string, {
  analyses: number
  trustChecks: number
  contractDrafts: number
  contractReviews: number
  redacts: number
}> = {
  free:    { analyses: 2,        trustChecks: 0,        contractDrafts: 0,        contractReviews: 0,        redacts: 0        },
  starter: { analyses: Infinity, trustChecks: 0,        contractDrafts: 0,        contractReviews: 0,        redacts: Infinity },
  pro:     { analyses: Infinity, trustChecks: Infinity, contractDrafts: Infinity, contractReviews: Infinity, redacts: Infinity },
}

function planLimits(planKey: string | null | undefined) {
  return LIMITS[planKey ?? "free"] ?? LIMITS.free
}

export function canRunAnalysis(planKey?: string | null): { allowed: boolean; used: number; limit: number } {
  const lim = planLimits(planKey)
  const used = getRecord().analyses
  return { allowed: used < lim.analyses, used, limit: lim.analyses }
}

export function canRunTrustCheck(planKey?: string | null): { allowed: boolean; used: number; limit: number } {
  const lim = planLimits(planKey)
  const used = getRecord().trustChecks
  return { allowed: used < lim.trustChecks, used, limit: lim.trustChecks }
}

export function canRunContractDraft(planKey?: string | null): { allowed: boolean; used: number; limit: number } {
  const lim = planLimits(planKey)
  const used = getRecord().contractDrafts
  return { allowed: used < lim.contractDrafts, used, limit: lim.contractDrafts }
}

export function canRunContractReview(planKey?: string | null): { allowed: boolean; used: number; limit: number } {
  const lim = planLimits(planKey)
  const used = getRecord().contractReviews
  return { allowed: used < lim.contractReviews, used, limit: lim.contractReviews }
}

export function canRunRedact(planKey?: string | null): { allowed: boolean; used: number; limit: number } {
  const lim = planLimits(planKey)
  const used = getRecord().redacts
  return { allowed: used < lim.redacts, used, limit: lim.redacts }
}
