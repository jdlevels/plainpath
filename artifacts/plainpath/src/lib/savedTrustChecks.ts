import type { TrustCheckAnalysis } from "@/lib/trustCheckTypes"

const STORAGE_KEY = "plainpath-saved-trust-checks"

export interface SavedTrustCheck {
  id: string
  savedAt: string
  title: string
  analysis: TrustCheckAnalysis
}

function load(): SavedTrustCheck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedTrustCheck[]) : []
  } catch {
    return []
  }
}

function persist(items: SavedTrustCheck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getAllTrustChecks(): SavedTrustCheck[] {
  return load().sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
}

export function saveTrustCheck(item: Omit<SavedTrustCheck, "id" | "savedAt">): SavedTrustCheck {
  const items = load()
  const newItem: SavedTrustCheck = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...item,
  }
  persist([newItem, ...items])
  return newItem
}

export function deleteTrustCheck(id: string): boolean {
  const items = load()
  const filtered = items.filter((a) => a.id !== id)
  if (filtered.length === items.length) return false
  persist(filtered)
  return true
}

export function estimateTrustCheckSizeKb(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? ""
    return Math.round(raw.length / 1024)
  } catch {
    return 0
  }
}
