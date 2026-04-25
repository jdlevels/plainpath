// ─── Redact QA Preview ───────────────────────────────────────────────────────
// Temporary QA route: /redact-qa?s=1..9
// Shows all 9 implemented states of the Redact Sensitive Info tool.
// NOT auth-protected — for screenshot QA only. Remove after visual approval.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react"
import {
  EmptyState,
  ProcessingState,
  ErrorState,
  Workspace,
} from "./Redact"
import type { PiiSpan } from "./Redact"

// ─── Demo data (all fictional) ────────────────────────────────────────────────

const DEMO_TEXT = `Re: Application Confirmation — Reference Number 2024-48291

Dear Jordan M. Whitfield,

Thank you for submitting your application. We have received your request dated March 14, 2024, and have assigned it case number 2024-48291 for tracking.

To complete your application, please confirm the following information on file:

  Full Name:              Jordan M. Whitfield
  Date of Birth:          August 3, 1985
  Social Security Number: 542-87-1934
  Home Address:           4817 Cedarwood Drive, Apt 3B, Columbus, OH 43215
  Phone Number:           (614) 882-0374
  Email Address:          jordan.whitfield@myemail.com

A representative from our office will contact you within 5 to 7 business days. If you have questions, please call our support line at (800) 555-0192 or email support@agencyoffice.gov and reference your case number.

Sincerely,
Daniel R. Hoffman
Senior Processing Officer
Region 5 Compliance Office`

// Spans are real positions returned by POST /api/documents/detect-pii
const ALL_SPANS: PiiSpan[] = [
  { id: "c67434b2", type: "CASE_NUMBER", label: "Case / Reference Number", value: "Reference Number 2024-48291", start: 31, end: 58, confidence: "medium", source: "regex" },
  { id: "fe8542ff", type: "NAME",        label: "Full Name",               value: "Jordan M. Whitfield",       start: 65, end: 84, confidence: "medium", source: "ai" },
  { id: "b1c86b79", type: "CASE_NUMBER", label: "Case / Reference Number", value: "case number 2024-48291",    start: 203, end: 225, confidence: "medium", source: "regex" },
  { id: "e2a1029e", type: "NAME",        label: "Full Name",               value: "Jordan M. Whitfield",       start: 348, end: 367, confidence: "medium", source: "ai" },
  { id: "4f3d8db6", type: "SSN",         label: "Social Security Number",  value: "542-87-1934",               start: 435, end: 446, confidence: "high",   source: "regex" },
  { id: "b943e092", type: "ADDRESS",     label: "Street Address",          value: "4817 Cedarwood Drive, Apt 3B, Columbus, OH 43215", start: 473, end: 521, confidence: "medium", source: "ai" },
  { id: "c23a7a64", type: "PHONE",       label: "Phone Number",            value: "(614) 882-0374",            start: 548, end: 563, confidence: "high",   source: "regex" },
  { id: "0e47f83e", type: "EMAIL",       label: "Email Address",           value: "jordan.whitfield@myemail.com", start: 589, end: 617, confidence: "high", source: "regex" },
  { id: "7a4a488e", type: "PHONE",       label: "Phone Number",            value: "(800) 555-0192",            start: 753, end: 768, confidence: "high",   source: "regex" },
  { id: "07db4993", type: "EMAIL",       label: "Email Address",           value: "support@agencyoffice.gov",  start: 777, end: 801, confidence: "high",   source: "regex" },
]

// Low-confidence subset (medium only, for state 6)
const LOW_CONF_SPANS: PiiSpan[] = ALL_SPANS.filter(s => s.confidence === "medium")

const noop = () => {}
const noopAsync = async () => {}

// ─── QA Nav ───────────────────────────────────────────────────────────────────

const STATES = [
  { n: 1, label: "Empty State" },
  { n: 2, label: "Processing" },
  { n: 3, label: "Completed Review" },
  { n: 4, label: "Active Item" },
  { n: 5, label: "Preview Mode" },
  { n: 6, label: "Low Confidence" },
  { n: 7, label: "Error State" },
  { n: 8, label: "Mobile — Redactions" },
  { n: 9, label: "Mobile — Document" },
]

export default function RedactQA() {
  const params = new URLSearchParams(window.location.search)
  const defaultState = parseInt(params.get("s") ?? "1", 10) || 1

  const [current, setCurrent] = useState(defaultState)

  function go(n: number) {
    setCurrent(n)
    const url = new URL(window.location.href)
    url.searchParams.set("s", String(n))
    window.history.replaceState(null, "", url.toString())
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f]">
      {/* QA nav strip */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 border-b border-white/10 flex items-center gap-1 px-3 py-1.5 overflow-x-auto backdrop-blur">
        {STATES.map(s => (
          <button
            key={s.n}
            onClick={() => go(s.n)}
            className={`shrink-0 text-xs px-2 py-1 rounded font-medium transition-colors ${
              current === s.n
                ? "bg-violet-600 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {/* Push content below nav strip */}
      <div className="pt-9">
        <StateRenderer state={current} />
      </div>
    </div>
  )
}

function StateRenderer({ state }: { state: number }) {
  switch (state) {
    case 1:
      return (
        <EmptyState
          onText={noop}
          onFile={noopAsync}
          onUrl={noopAsync}
          extracting={false}
          urlLoading={false}
          uploadError={null}
          urlError={null}
          uploadedFile={null}
          setUploadedFile={noop}
        />
      )

    case 2:
      return <ProcessingState fileName="personal-info-letter.txt" />

    case 3:
      return (
        <Workspace
          text={DEMO_TEXT}
          fileName="personal-info-letter.txt"
          spans={ALL_SPANS}
          onReset={noop}
          onExport={noop}
        />
      )

    case 4:
      return (
        <Workspace
          text={DEMO_TEXT}
          fileName="personal-info-letter.txt"
          spans={ALL_SPANS}
          onReset={noop}
          onExport={noop}
          _qaActiveId="4f3d8db6"
        />
      )

    case 5:
      return (
        <Workspace
          text={DEMO_TEXT}
          fileName="personal-info-letter.txt"
          spans={ALL_SPANS}
          onReset={noop}
          onExport={noop}
          _qaViewMode="preview"
        />
      )

    case 6:
      return (
        <Workspace
          text={DEMO_TEXT}
          fileName="scan-document-partial.txt"
          spans={LOW_CONF_SPANS}
          onReset={noop}
          onExport={noop}
        />
      )

    case 7:
      return (
        <ErrorState
          fileName="encrypted-document.pdf"
          onReset={noop}
          onAsk={noop}
        />
      )

    case 8:
      return (
        <Workspace
          text={DEMO_TEXT}
          fileName="personal-info-letter.txt"
          spans={ALL_SPANS}
          onReset={noop}
          onExport={noop}
          _qaMobileTab="redactions"
        />
      )

    case 9:
      return (
        <Workspace
          text={DEMO_TEXT}
          fileName="personal-info-letter.txt"
          spans={ALL_SPANS}
          onReset={noop}
          onExport={noop}
          _qaMobileTab="document"
        />
      )

    default:
      return null
  }
}
