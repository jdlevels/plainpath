// ─── PII Types, Labels, and Colors ───────────────────────────────────────────
// Shared type definitions for the PII redaction feature.
// Used by PiiReview component and piiExport utilities.

export type PiiType =
  | "NAME"
  | "ADDRESS"
  | "EMAIL"
  | "PHONE"
  | "SSN"
  | "TAX_ID"
  | "DOB"
  | "ACCOUNT_NUMBER"
  | "ROUTING_NUMBER"
  | "CREDIT_CARD"
  | "POLICY_ID"
  | "MEMBER_ID"
  | "CASE_NUMBER"
  | "LICENSE_NUMBER"
  | "IP_ADDRESS"
  | "OTHER_ID"

export type PiiConfidence = "high" | "medium" | "low"

export type PiiSpan = {
  id: string
  type: PiiType
  label: string
  value: string
  start: number
  end: number
  confidence: PiiConfidence
  source: "regex" | "ai" | "both"
}

export type PiiSpanWithStatus = PiiSpan & {
  approved: boolean
}

// ─── Type Metadata ─────────────────────────────────────────────────────────
// Human-readable labels and Tailwind color classes for each PII type.

export type PiiTypeMeta = {
  label: string
  category: string
  badgeBg: string
  badgeText: string
  highlightBg: string
  redactLabel: string
}

export const PII_TYPE_META: Record<PiiType, PiiTypeMeta> = {
  NAME: {
    label: "Full Name",
    category: "Identity",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50",
    badgeText: "text-purple-700 dark:text-purple-300",
    highlightBg: "bg-purple-100/70 dark:bg-purple-900/40",
    redactLabel: "REDACTED · NAME",
  },
  ADDRESS: {
    label: "Street Address",
    category: "Location",
    badgeBg: "bg-blue-100 dark:bg-blue-900/50",
    badgeText: "text-blue-700 dark:text-blue-300",
    highlightBg: "bg-blue-100/70 dark:bg-blue-900/40",
    redactLabel: "REDACTED · ADDRESS",
  },
  EMAIL: {
    label: "Email Address",
    category: "Contact",
    badgeBg: "bg-sky-100 dark:bg-sky-900/50",
    badgeText: "text-sky-700 dark:text-sky-300",
    highlightBg: "bg-sky-100/70 dark:bg-sky-900/40",
    redactLabel: "REDACTED · EMAIL",
  },
  PHONE: {
    label: "Phone Number",
    category: "Contact",
    badgeBg: "bg-teal-100 dark:bg-teal-900/50",
    badgeText: "text-teal-700 dark:text-teal-300",
    highlightBg: "bg-teal-100/70 dark:bg-teal-900/40",
    redactLabel: "REDACTED · PHONE",
  },
  SSN: {
    label: "Social Security Number",
    category: "Government ID",
    badgeBg: "bg-red-100 dark:bg-red-900/50",
    badgeText: "text-red-700 dark:text-red-300",
    highlightBg: "bg-red-100/70 dark:bg-red-900/40",
    redactLabel: "REDACTED · SSN",
  },
  TAX_ID: {
    label: "Tax ID / EIN",
    category: "Government ID",
    badgeBg: "bg-red-100 dark:bg-red-900/50",
    badgeText: "text-red-700 dark:text-red-300",
    highlightBg: "bg-red-100/70 dark:bg-red-900/40",
    redactLabel: "REDACTED · TAX ID",
  },
  DOB: {
    label: "Date of Birth",
    category: "Identity",
    badgeBg: "bg-orange-100 dark:bg-orange-900/50",
    badgeText: "text-orange-700 dark:text-orange-300",
    highlightBg: "bg-orange-100/70 dark:bg-orange-900/40",
    redactLabel: "REDACTED · DATE OF BIRTH",
  },
  ACCOUNT_NUMBER: {
    label: "Account Number",
    category: "Financial",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    highlightBg: "bg-amber-100/70 dark:bg-amber-900/40",
    redactLabel: "REDACTED · ACCOUNT NUMBER",
  },
  ROUTING_NUMBER: {
    label: "Routing Number",
    category: "Financial",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    highlightBg: "bg-amber-100/70 dark:bg-amber-900/40",
    redactLabel: "REDACTED · ROUTING NUMBER",
  },
  CREDIT_CARD: {
    label: "Credit Card Number",
    category: "Financial",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    highlightBg: "bg-amber-100/70 dark:bg-amber-900/40",
    redactLabel: "REDACTED · CARD NUMBER",
  },
  POLICY_ID: {
    label: "Policy / Member ID",
    category: "Healthcare & Insurance",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/50",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    highlightBg: "bg-emerald-100/70 dark:bg-emerald-900/40",
    redactLabel: "REDACTED · POLICY ID",
  },
  MEMBER_ID: {
    label: "Member / Subscriber ID",
    category: "Healthcare & Insurance",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/50",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    highlightBg: "bg-emerald-100/70 dark:bg-emerald-900/40",
    redactLabel: "REDACTED · MEMBER ID",
  },
  CASE_NUMBER: {
    label: "Case / Reference Number",
    category: "Legal",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/50",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    highlightBg: "bg-indigo-100/70 dark:bg-indigo-900/40",
    redactLabel: "REDACTED · CASE NUMBER",
  },
  LICENSE_NUMBER: {
    label: "License Number",
    category: "Government ID",
    badgeBg: "bg-violet-100 dark:bg-violet-900/50",
    badgeText: "text-violet-700 dark:text-violet-300",
    highlightBg: "bg-violet-100/70 dark:bg-violet-900/40",
    redactLabel: "REDACTED · LICENSE NUMBER",
  },
  IP_ADDRESS: {
    label: "IP Address",
    category: "Technical",
    badgeBg: "bg-slate-100 dark:bg-slate-700/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    highlightBg: "bg-slate-100/70 dark:bg-slate-700/40",
    redactLabel: "REDACTED · IP ADDRESS",
  },
  OTHER_ID: {
    label: "Personal Identifier",
    category: "Other",
    badgeBg: "bg-slate-100 dark:bg-slate-700/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    highlightBg: "bg-slate-100/70 dark:bg-slate-700/40",
    redactLabel: "REDACTED · ID",
  },
}

// ─── Category order for display ────────────────────────────────────────────

export const CATEGORY_ORDER = [
  "Identity",
  "Government ID",
  "Contact",
  "Financial",
  "Location",
  "Healthcare & Insurance",
  "Legal",
  "Technical",
  "Other",
]
