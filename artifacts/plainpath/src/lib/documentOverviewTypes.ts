// ─── Document Overview Hub — Shared Types ─────────────────────────────────────

export interface OverviewRisk {
  level: "high" | "medium" | "low"
  text: string
  page: number
  section?: string
}

export interface OverviewDate {
  label: string
  value: string
  page: number
  section?: string
  isUrgent?: boolean
}

export interface OverviewParty {
  role: string
  name: string
  detail?: string
  page: number
}

export interface OverviewObligation {
  party: string
  text: string
  page: number
  section?: string
}

export interface OverviewAction {
  action: string
  tool: "ask-document" | "trust-check" | "contract-review" | "clause-extractor" | "compare-versions" | "redact" | "none"
  detail: string
  isUrgent: boolean
}

export interface DocumentOverview {
  documentType: string
  confidence: number
  summary: string
  risks: OverviewRisk[]
  keyDates: OverviewDate[]
  keyParties: OverviewParty[]
  keyObligations: OverviewObligation[]
  recommendedActions: OverviewAction[]
  suggestedQuestions: string[]
}

export interface DocumentOverviewSession {
  sessionId: string
  askSessionId: string | null
  fileName: string
  fileSizeBytes: number
  fileType: string
  pageCount: number | null
  status: "extracting" | "analyzing" | "ready" | "partial" | "error"
  overview: DocumentOverview | null
  errorMessage: string | null
  createdAt: string
}
