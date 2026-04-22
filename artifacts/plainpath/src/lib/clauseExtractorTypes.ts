export type ExtractionStatus = "pending" | "processing" | "done" | "error"

export interface ClausePresence {
  present: boolean
  summary: string | null
  snippet: string | null
}

export interface ClauseExtractionResults {
  documentType: string | null
  extractionConfidence: "high" | "medium" | "low"
  keyDates: {
    effectiveDate: string | null
    executionDate: string | null
    expirationDate: string | null
    renewalDate: string | null
    noticeDeadline: string | null
    noticePeriod: string | null
  }
  parties: Array<{
    name: string
    role: string | null
    type: "individual" | "company" | "unknown"
    isSigner: boolean
  }>
  financialTerms: {
    paymentAmount: string | null
    paymentSchedule: string | null
    lateFees: string | null
    refundLanguage: string | null
    otherTerms: string[]
  }
  legalClauses: {
    governingLaw: ClausePresence
    terminationClause: ClausePresence
    autoRenewal: ClausePresence
    liabilityCap: ClausePresence
    indemnity: ClausePresence
    confidentiality: ClausePresence
    assignment: ClausePresence
    disputeResolution: ClausePresence
  }
  obligations: Array<{
    party: string | null
    obligation: string
    deadline: string | null
    consequence: string | null
  }>
  missingFields: string[]
}

export interface ClauseExtractorSessionMeta {
  id: string
  fileName: string
  fileSizeBytes: number
  fileType: string
  status: ExtractionStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface ClauseExtractorSessionDetail extends ClauseExtractorSessionMeta {
  results: ClauseExtractionResults | null
}
