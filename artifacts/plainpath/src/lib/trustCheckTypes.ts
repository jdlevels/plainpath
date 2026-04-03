export type TrustCheckVerdict =
  | "Likely legitimate"
  | "Suspicious — verify before acting"
  | "High scam risk"
  | "Cannot verify authenticity"

export interface TrustCheckContactDetail {
  type: "phone" | "email" | "url" | "address"
  value: string
  suspicious: boolean
  note?: string
}

export interface TrustCheckDeadlineItem {
  text: string
  type: "explicit_date" | "relative" | "threat" | "escalation"
  note?: string
}

export interface TrustCheckScamIndicator {
  indicator: string
  severity: "high" | "medium" | "low"
  sourceEvidence?: string
}

export interface TrustCheckAnalysis {
  id: string
  processedAt: string
  riskScore: number
  verdict: TrustCheckVerdict
  verdictExplanation: string
  whatItClaims: string
  demandedAction: string
  scamIndicators: TrustCheckScamIndicator[]
  contactDetails: TrustCheckContactDetail[]
  deadlines: TrustCheckDeadlineItem[]
  whatToVerify: string[]
  safeNextSteps: string[]
  contractRiskNotes?: string
  contractTermsFound?: string[]
}

export function verdictColor(verdict: TrustCheckVerdict): {
  bg: string; border: string; text: string; badge: string; bar: string
} {
  switch (verdict) {
    case "High scam risk":
      return {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-400",
        badge: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
        bar: "bg-red-500",
      }
    case "Suspicious — verify before acting":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
        bar: "bg-amber-500",
      }
    case "Cannot verify authenticity":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-400",
        badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
        bar: "bg-blue-500",
      }
    case "Likely legitimate":
    default:
      return {
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-700 dark:text-green-400",
        badge: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
        bar: "bg-green-500",
      }
  }
}

export function severityColor(severity: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high": return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
    case "medium": return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
    case "low": return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
  }
}
