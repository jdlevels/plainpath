/**
 * completionStorage.ts
 *
 * Persists per-analysis completion progress to localStorage.
 *
 * Stores only completion object IDs and booleans.
 * Does not store document text, source quotes, or uploaded file content.
 */

const KEY_PREFIX = "plainpath_completion_"

function storageKey(analysisId: string): string {
  return `${KEY_PREFIX}${analysisId}`
}

/**
 * Returns true if localStorage is readable and writable on this device.
 * Some browsers block localStorage in private mode or inside iframes.
 */
export function isStorageAvailable(): boolean {
  try {
    const probe = "__plainpath_storage_probe__"
    localStorage.setItem(probe, "1")
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/**
 * Reads stored completionStatus for the given analysis.
 * Only returns entries whose IDs still exist in knownIds — stale keys are discarded.
 * Returns an empty record on any error or if nothing is stored.
 */
export function loadCompletionStatus(
  analysisId: string,
  knownIds: string[],
): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(storageKey(analysisId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const result: Record<string, boolean> = {}
    for (const id of knownIds) {
      if (typeof parsed[id] === "boolean") {
        result[id] = parsed[id] as boolean
      }
    }
    return result
  } catch {
    return {}
  }
}

/**
 * Persists completionStatus for the given analysis.
 * Only writes entries whose IDs exist in knownIds — no stale or unrelated data.
 * Returns true on success, false if storage is unavailable.
 */
export function saveCompletionStatus(
  analysisId: string,
  status: Record<string, boolean>,
  knownIds: string[],
): boolean {
  try {
    const clean: Record<string, boolean> = {}
    for (const id of knownIds) {
      if (typeof status[id] === "boolean") {
        clean[id] = status[id]
      }
    }
    localStorage.setItem(storageKey(analysisId), JSON.stringify(clean))
    return true
  } catch {
    return false
  }
}

/**
 * Removes the stored completion record for the given analysis.
 * Used by the "Reset progress" action.
 */
export function clearCompletionStatus(analysisId: string): void {
  try {
    localStorage.removeItem(storageKey(analysisId))
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
