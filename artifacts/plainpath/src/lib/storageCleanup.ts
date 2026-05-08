const LEGACY_KEYS = [
  "plainpath-saved-analyses",
  "plainpath-saved-trust-checks",
  "plainpath-contract-draft-latest",
]

const MIGRATION_FLAG = "plainpath-legacy-storage-purged-v1"

export function purgeLegacyGlobalKeys(): void {
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(key)
    }
    localStorage.setItem(MIGRATION_FLAG, "1")
  } catch {
    // Non-critical — fail silently
  }
}

export function purgeUserScopedKeys(userId: string): void {
  try {
    localStorage.removeItem(`plainpath-saved-analyses-${userId}`)
    localStorage.removeItem(`plainpath-saved-trust-checks-${userId}`)
    localStorage.removeItem(`plainpath-contract-draft-latest-${userId}`)
  } catch {
    // Non-critical — fail silently
  }
}

const SESSION_DOCUMENT_KEYS = [
  "pii_redact_input",
  "pii_analyze_text",
  "pii_contract_review_text",
  "pii_redact_file_name",
]

export function purgeSessionDocumentBuffers(): void {
  try {
    for (const key of SESSION_DOCUMENT_KEYS) {
      sessionStorage.removeItem(key)
    }
  } catch {
    // Non-critical — fail silently
  }
}
