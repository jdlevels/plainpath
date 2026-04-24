// ─── Ask This Document — Type definitions ─────────────────────────────────────

export interface AskDocumentCitation {
  page: number
  section: string | null
  excerpt: string
}

export interface AskDocumentFinding {
  id: number
  title: string
  body: string
  citation: AskDocumentCitation
}

export interface AskDocumentAnswer {
  confidence: "high" | "medium" | "low"
  notFoundInDocument: boolean
  summary: string
  findings: AskDocumentFinding[]
  followUps: string[]
}

export interface AskDocumentExchange {
  id: string
  question: string
  answer: AskDocumentAnswer | null
  status: "pending" | "processing" | "done" | "error"
  errorMessage?: string | null
  createdAt: string
}

export interface AskDocumentSession {
  id: string
  fileName: string
  fileSizeBytes: number
  fileType: "pdf" | "docx" | "txt"
  pageCount: number
  status: "ready" | "extracting" | "error"
  errorMessage?: string | null
  createdAt: string
  exchanges: AskDocumentExchange[]
}

export interface AskDocumentUploadResponse {
  sessionId: string
  fileName: string
  fileType: string
  pageSizeBytes: number
  pageCount: number
  status: string
}
