import type { TrustCheckAnalysis } from "@/lib/trustCheckTypes"

const BASE_STORAGE_KEY = "plainpath-saved-trust-checks"

function storageKey(userId?: string | null): string {
  return userId ? `${BASE_STORAGE_KEY}-${userId}` : BASE_STORAGE_KEY
}

export interface SavedTrustCheck {
  id: string
  savedAt: string
  title: string
  analysis: TrustCheckAnalysis
}

function load(userId?: string | null): SavedTrustCheck[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? (JSON.parse(raw) as SavedTrustCheck[]) : []
  } catch {
    return []
  }
}

function persist(items: SavedTrustCheck[], userId?: string | null): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(items))
}

export function getAllTrustChecks(userId?: string | null): SavedTrustCheck[] {
  return load(userId).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
}

export function saveTrustCheck(item: Omit<SavedTrustCheck, "id" | "savedAt">, userId?: string | null): SavedTrustCheck {
  const items = load(userId)
  const newItem: SavedTrustCheck = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...item,
  }
  persist([newItem, ...items], userId)
  return newItem
}

export function deleteTrustCheck(id: string, userId?: string | null): boolean {
  const items = load(userId)
  const filtered = items.filter((a) => a.id !== id)
  if (filtered.length === items.length) return false
  persist(filtered, userId)
  return true
}

export function estimateTrustCheckSizeKb(userId?: string | null): number {
  try {
    const raw = localStorage.getItem(storageKey(userId)) ?? ""
    return Math.round(raw.length / 1024)
  } catch {
    return 0
  }
}

export function clearUserTrustChecks(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // Ignore
  }
}
