const STORAGE_KEY = "plainpath-usage-v1"

type UsageRecord = {
  month: string
  analyses: number
  trustChecks: number
  contractDrafts: number
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
  return { month: getCurrentMonth(), analyses: 0, trustChecks: 0, contractDrafts: 0 }
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

export function getUsage(): UsageRecord {
  return getRecord()
}

const LIMITS: Record<string, { analyses: number; trustChecks: number; contractDrafts: number }> = {
  free:    { analyses: 3,        trustChecks: 0,        contractDrafts: 0 },
  starter: { analyses: 10,       trustChecks: 0,        contractDrafts: 0 },
  pro:     { analyses: 100,      trustChecks: 30,       contractDrafts: 10 },
  team:    { analyses: Infinity, trustChecks: Infinity, contractDrafts: Infinity },
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
