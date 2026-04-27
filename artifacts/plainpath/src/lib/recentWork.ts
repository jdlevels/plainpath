const KEY = "pp_recent_work_v1"
const MAX = 8

export type LocalRecentItem = {
  id: string
  tool: "redact" | "contract-builder" | "compare"
  title: string
  savedAt: string
}

function load(): LocalRecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

export function saveRecentWork(item: Omit<LocalRecentItem, "id" | "savedAt">) {
  try {
    const existing = load()
    const newItem: LocalRecentItem = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
      ...item,
    }
    const deduped = existing.filter(
      (e) => !(e.tool === newItem.tool && e.title === newItem.title)
    )
    const updated = [newItem, ...deduped].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    /* non-critical — fail silently */
  }
}

export function getRecentWork(): LocalRecentItem[] {
  return load()
}

export function clearRecentWork(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* non-critical — fail silently */
  }
}
