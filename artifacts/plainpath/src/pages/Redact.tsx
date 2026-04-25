// ─── Redact Sensitive Info — Workspace ────────────────────────────────────────
// Route: /redact (protected by RequireAuth)
//
// Layout: 60% document paper surface / 40% redaction controls
// Mobile: Redactions tab (default) | Document tab
//
// States:
//   empty       — upload or paste input
//   processing  — PII detection in flight
//   workspace   — review & select items on the paper surface
//   error       — detection failed
//
// Entry paths:
//   A) Standalone navigation to /redact
//   B) From another tool via sessionStorage "pii_redact_input"
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from "react"
import { useLocation } from "wouter"
import {
  ShieldCheck, ArrowLeft, UploadCloud, Type, Loader2, AlertCircle,
  X, FileText, EyeOff, ArrowRight, Camera, Link as LinkIcon, Download,
  Save, RefreshCcw, Eye, EyeOff as EyeOffIcon, CheckCircle2, Plus,
  Undo2, Trash2, ChevronRight, User, HeartPulse,
} from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import { BILLING_CONFIG } from "@/lib/billingConfig"
import { saveRecentWork } from "@/lib/recentWork"
import { downloadRedactedPdf } from "@/lib/piiExport"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"

// ─── PII types (mirrors server/piiDetection.ts) ───────────────────────────────

export type PiiType =
  | "NAME" | "ADDRESS" | "EMAIL" | "PHONE" | "SSN" | "TAX_ID" | "DOB"
  | "ACCOUNT_NUMBER" | "ROUTING_NUMBER" | "CREDIT_CARD" | "POLICY_ID"
  | "MEMBER_ID" | "CASE_NUMBER" | "LICENSE_NUMBER" | "IP_ADDRESS" | "OTHER_ID"

export interface PiiSpan {
  id: string
  type: PiiType
  label: string
  value: string
  start: number
  end: number
  confidence: "high" | "medium" | "low"
  source: "regex" | "ai" | "both"
}

// ─── Text segment (for annotated rendering) ───────────────────────────────────

type Seg =
  | { kind: "text"; content: string }
  | { kind: "span"; span: PiiSpan }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build flat segment list: interleave plain-text runs with PII spans. */
function buildSegments(text: string, spans: PiiSpan[]): Seg[] {
  if (!spans.length) return [{ kind: "text", content: text }]
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const segs: Seg[] = []
  let cursor = 0
  for (const span of sorted) {
    if (span.start < cursor) continue // skip overlapping
    if (span.start > cursor) segs.push({ kind: "text", content: text.slice(cursor, span.start) })
    segs.push({ kind: "span", span })
    cursor = span.end
  }
  if (cursor < text.length) segs.push({ kind: "text", content: text.slice(cursor) })
  return segs
}

/** Masked preview — shows partial value for right-panel cards. */
function maskValue(span: PiiSpan): string {
  const v = span.value
  switch (span.type) {
    case "EMAIL": {
      const [user, domain] = v.split("@")
      return `${user.slice(0, 2)}•••@${domain ?? "•••"}`
    }
    case "SSN":
      return "•••-••-" + v.replace(/\D/g, "").slice(-4)
    case "ACCOUNT_NUMBER":
    case "ROUTING_NUMBER":
    case "CREDIT_CARD":
      return "•••• " + v.replace(/\D/g, "").slice(-4)
    case "PHONE":
      return v.slice(0, 3) + " •••-••••"
    case "NAME":
      return v.split(" ").map((w, i) => i === 0 ? w : w[0] + "•••").join(" ")
    case "DOB":
      return "••/••/" + v.replace(/\D/g, "").slice(-4)
    case "TAX_ID":
      return "••-•••" + v.replace(/\D/g, "").slice(-4)
    default:
      return v.length > 12 ? v.slice(0, 6) + "•••" : v.slice(0, 3) + "•••"
  }
}

/** Color chip for PII type. */
function typeChip(type: PiiType): { label: string; cls: string } {
  switch (type) {
    case "SSN": case "CREDIT_CARD":
      return { label: "High-risk ID", cls: "text-red-400 bg-red-500/10 border-red-500/20" }
    case "ACCOUNT_NUMBER": case "ROUTING_NUMBER": case "TAX_ID":
      return { label: "Financial", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
    case "EMAIL": case "PHONE":
      return { label: "Contact", cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" }
    case "NAME":
      return { label: "Name", cls: "text-white/50 bg-white/[0.05] border-white/10" }
    case "ADDRESS":
      return { label: "Address", cls: "text-white/50 bg-white/[0.05] border-white/10" }
    case "DOB":
      return { label: "Date of birth", cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" }
    case "POLICY_ID": case "MEMBER_ID":
      return { label: "Policy / ID", cls: "text-teal-400 bg-teal-500/10 border-teal-500/20" }
    case "CASE_NUMBER":
      return { label: "Case number", cls: "text-white/50 bg-white/[0.05] border-white/10" }
    default:
      return { label: "Identifier", cls: "text-white/40 bg-white/[0.04] border-white/[0.08]" }
  }
}

const confCls = (c: string) =>
  c === "high" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-amber-400 bg-amber-500/10 border-amber-500/25"

// ─── Demo documents ───────────────────────────────────────────────────────────

const DEMOS = [
  {
    id: "personal-info",
    label: "Personal Info Letter",
    meta: "Name · SSN · address · phone",
    icon: User,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    fileName: "personal_info_letter.txt",
    text: `Re: Application Confirmation — Reference Number 2024-48291

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

Please note that this correspondence contains personal information. Do not share this letter with anyone other than the intended recipient.

Sincerely,
Daniel R. Hoffman
Senior Processing Officer
Region 5 Compliance Office`,
  },
  {
    id: "freelance-contract",
    label: "Freelance Contract",
    meta: "Names · bank details · tax ID",
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    fileName: "freelance_contract.txt",
    text: `FREELANCE SERVICES AGREEMENT

This Agreement is entered into as of April 1, 2024, between:

CLIENT
Name:    Marcella V. Torres (trading as Horizon Creative Studio)
Address: 88 Lakeview Boulevard, Suite 210, Austin, TX 78701
Email:   marcella.torres@horizoncreative.com
Phone:   (512) 448-0093

FREELANCER
Name:    Samuel A. Park
Address: 1204 Birchwood Lane, Portland, OR 97202
Email:   sam.park@freelancedesign.io
Phone:   (503) 774-2281
Tax ID (EIN): 47-3826104

1. SCOPE OF WORK
Freelancer agrees to design a brand identity package for Client's product launch scheduled for June 2024.

2. COMPENSATION
Client shall pay Freelancer a flat fee of $4,800 USD. Payment via bank transfer to:
  Account Name:   Samuel A. Park
  Account Number: 7820134567
  Routing Number: 021000021

3. INTELLECTUAL PROPERTY
All work product transfers to Client upon receipt of full payment.

4. CONFIDENTIALITY
Both parties agree to keep the terms of this Agreement and all shared materials confidential.

Signed,
Marcella V. Torres — Client
Samuel A. Park — Freelancer`,
  },
  {
    id: "medical",
    label: "Medical Benefits Form",
    meta: "Patient · DOB · member ID · provider",
    icon: HeartPulse,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    fileName: "medical_benefits_form.txt",
    text: `PATIENT INFORMATION FORM
Bright Valley Medical Center

PATIENT DETAILS
  Patient Name:           Christine L. Nguyen
  Date of Birth:          February 12, 1979
  Social Security Number: 318-55-7092
  Member ID:              BVC-449821-K
  Home Address:           2930 Maple Run Drive, Sacramento, CA 95814
  Phone:                  (916) 553-4401
  Email:                  c.nguyen79@gmail.com

INSURANCE INFORMATION
  Insurance Provider:     Pacific Health Group
  Policy Number:          PHG-00827-CA
  Group Number:           3318-B

EMERGENCY CONTACT
  Name:                   David K. Nguyen
  Relationship:           Spouse
  Phone:                  (916) 553-0872

PRIMARY CARE PROVIDER
  Name:                   Dr. Anita Ramos
  Provider NPI:           1234567890
  Clinic Phone:           (916) 481-2200

Patient Signature: Christine L. Nguyen
Date: April 10, 2024`,
  },
]

// ─── Annotated Document ───────────────────────────────────────────────────────
// Renders document text on a white paper surface with inline PII highlights.
// Segments are rendered as plain text or as highlighted/redacted spans.

interface AnnotatedDocumentProps {
  text: string
  spans: PiiSpan[]
  selected: Set<string>
  activeId: string | null
  viewMode: "original" | "preview"
  onActivate: (id: string) => void
  spanRefs: React.MutableRefObject<Map<string, HTMLElement>>
  fileName: string
}

const AnnotatedDocument = memo(function AnnotatedDocument({
  text, spans, selected, activeId, viewMode, onActivate, spanRefs, fileName,
}: AnnotatedDocumentProps) {
  const segments = useMemo(() => buildSegments(text, spans), [text, spans])

  // Render a single PII span inline
  const renderSpan = useCallback((span: PiiSpan) => {
    const isActive = span.id === activeId
    const isSel = selected.has(span.id)

    const refCallback = (el: HTMLElement | null) => {
      if (el) spanRefs.current.set(span.id, el)
      else spanRefs.current.delete(span.id)
    }

    if (viewMode === "preview" && isSel) {
      // Black redaction bar
      return (
        <span
          key={span.id}
          ref={refCallback as React.RefCallback<HTMLSpanElement>}
          onClick={() => onActivate(span.id)}
          className={`inline-block bg-black align-middle cursor-pointer mx-0.5 rounded-sm select-none transition-shadow ${isActive ? "ring-2 ring-violet-500" : "hover:ring-1 hover:ring-white/20"}`}
          style={{ minWidth: `${Math.max(span.value.length * 7, 32)}px`, height: "1em" }}
          aria-label={`Redacted: ${span.label}`}
        />
      )
    }

    // Original view: amber highlight (or violet if active)
    let hlCls = ""
    if (isActive) {
      hlCls = "bg-amber-200 border-2 border-violet-500 rounded ring-2 ring-violet-400/30 text-gray-900 font-medium cursor-pointer"
    } else if (isSel) {
      hlCls = "bg-amber-200/80 border border-amber-400 rounded text-gray-800 font-medium cursor-pointer hover:bg-amber-200"
    } else {
      hlCls = "bg-amber-100 border border-amber-300/70 rounded text-gray-700 cursor-pointer hover:bg-amber-200/60"
    }

    return (
      <span
        key={span.id}
        ref={refCallback as React.RefCallback<HTMLSpanElement>}
        onClick={() => onActivate(span.id)}
        className={`px-0.5 mx-0.5 transition-all ${hlCls}`}
        title={span.label}
      >
        {span.value}
      </span>
    )
  }, [activeId, selected, viewMode, onActivate, spanRefs])

  // Build rendered output: iterate segments, split on newlines for paragraph rendering
  const lines: React.ReactNode[] = []
  let lineNodes: React.ReactNode[] = []

  const flushLine = () => {
    lines.push(
      <p key={lines.length} className="mb-4 last:mb-0 text-gray-700 leading-7">
        {lineNodes.length ? lineNodes : <br />}
      </p>
    )
    lineNodes = []
  }

  for (const seg of segments) {
    if (seg.kind === "text") {
      const parts = seg.content.split("\n")
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) { flushLine() }
        if (parts[i]) lineNodes.push(parts[i])
      }
    } else {
      lineNodes.push(renderSpan(seg.span))
    }
  }
  if (lineNodes.length) flushLine()

  return (
    <div className="bg-white rounded-lg shadow-2xl shadow-black/50 mx-auto max-w-[640px] overflow-hidden">
      {/* Paper header */}
      <div className="px-8 pt-7 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700 text-xs uppercase tracking-wider truncate max-w-[70%]">{fileName}</span>
          <span className="text-xs text-gray-400">PlainPath Review</span>
        </div>
      </div>

      {/* Paper body */}
      <div className="px-8 py-7 font-serif text-[13.5px]">
        {lines}
      </div>

      {/* Paper footer */}
      <div className="px-8 py-4 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-400">{fileName}</span>
        <span className="text-xs text-gray-400">{spans.length} items detected</span>
      </div>
    </div>
  )
})

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onText: (text: string, fileName: string) => void
  onFile: (file: File) => Promise<void>
  onUrl: (url: string) => Promise<void>
  extracting: boolean
  urlLoading: boolean
  uploadError: string | null
  urlError: string | null
  uploadedFile: File | null
  setUploadedFile: (f: File | null) => void
}

export function EmptyState({
  onText, onFile, onUrl, extracting, urlLoading,
  uploadError, urlError, uploadedFile, setUploadedFile,
}: EmptyStateProps) {
  const [inputMode, setInputMode] = useState<"paste" | "upload" | "url">("paste")
  const [pastedText, setPastedText] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED = ".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      setUploadedFile(null)
      return
    }
    setUploadedFile(file)
    e.target.value = ""
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/80">Redact Sensitive Info</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
          {/* Title */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Redact Sensitive Info</h1>
            <p className="text-sm text-white/50 leading-relaxed max-w-md mx-auto">
              Automatically detect and redact personal information — names, SSNs, financial details, and more — before sharing or archiving a document.
            </p>
          </div>

          {/* Input modes */}
          <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-white/[0.07]">
              {([
                { id: "paste", label: "Paste Text", icon: Type },
                { id: "upload", label: "Upload File", icon: UploadCloud },
                { id: "url", label: "Import Link", icon: LinkIcon },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setInputMode(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${inputMode === tab.id ? "text-white bg-white/[0.05] border-b-2 border-violet-500" : "text-white/40 hover:text-white/70"}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Paste */}
              {inputMode === "paste" && (
                <div className="space-y-3">
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Paste your document text here — contracts, letters, forms, medical records…"
                    rows={8}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all font-mono leading-relaxed"
                  />
                  <button
                    disabled={pastedText.trim().length < 30}
                    onClick={() => onText(pastedText.trim(), "Pasted document")}
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Scan for Sensitive Information
                  </button>
                  {pastedText.trim().length < 30 && pastedText.length > 0 && (
                    <p className="text-xs text-white/30 text-center">Paste at least 30 characters to continue</p>
                  )}
                </div>
              )}

              {/* Upload */}
              {inputMode === "upload" && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all group"
                  >
                    <UploadCloud className="w-8 h-8 text-white/25 mx-auto mb-3 group-hover:text-violet-400 transition-colors" />
                    <p className="text-sm font-medium text-white/70 mb-1">Drop a file or click to browse</p>
                    <p className="text-xs text-white/30">PDF, DOCX, TXT, JPG, PNG — up to 20 MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileChange} />

                  {/* Camera option */}
                  <button
                    onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.capture = "environment"; fileInputRef.current.click() } }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/[0.08] text-xs text-white/50 hover:text-white/80 hover:border-white/15 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Open Camera (photo a document)
                  </button>

                  {uploadedFile && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03]">
                      <FileText className="w-5 h-5 text-violet-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/80 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-white/35 mt-0.5">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => setUploadedFile(null)} className="text-white/30 hover:text-white/70 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {uploadError}
                    </div>
                  )}

                  <button
                    disabled={!uploadedFile || extracting}
                    onClick={() => uploadedFile && void onFile(uploadedFile)}
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {extracting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting text…</>
                      : <><ShieldCheck className="w-4 h-4" /> Scan for Sensitive Information</>
                    }
                  </button>
                </div>
              )}

              {/* URL */}
              {inputMode === "url" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/50 mb-2 leading-relaxed">
                      Share a file from Google Drive or Dropbox — PlainPath will fetch and extract the text, then scan it for sensitive information.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input
                          type="url"
                          value={urlInput}
                          onChange={e => setUrlInput(e.target.value)}
                          placeholder="https://drive.google.com/… or https://dropbox.com/…"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                          onKeyDown={e => { if (e.key === "Enter" && urlInput.trim()) void onUrl(urlInput.trim()) }}
                        />
                      </div>
                      <button
                        disabled={urlLoading || !urlInput.trim()}
                        onClick={() => void onUrl(urlInput.trim())}
                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-sm font-medium transition-colors"
                      >
                        {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                      </button>
                    </div>
                    {urlError && (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mt-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {urlError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* What gets detected */}
          <div className="border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/52 uppercase tracking-widest mb-3">What gets detected</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                "Full names", "Street addresses", "Phone numbers", "Email addresses",
                "Social Security Numbers", "Tax IDs / EINs", "Dates of birth", "Account numbers",
                "Routing numbers", "Credit card numbers", "Policy / member IDs", "Case numbers",
                "License numbers", "Personal identifiers",
              ].map(item => (
                <div key={item} className="text-xs text-white/50 flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-violet-400/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Try sample */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 whitespace-nowrap">Try a sample</p>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMOS.map(demo => {
                const Icon = demo.icon
                return (
                  <button
                    key={demo.id}
                    onClick={() => onText(demo.text, demo.fileName)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.07] hover:border-violet-500/40 hover:bg-violet-500/[0.04] transition-all text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${demo.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${demo.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/80 group-hover:text-violet-300 transition-colors leading-tight">{demo.label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{demo.meta}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-white/20 text-center">Original document is never modified. Redactions create a separate copy.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────

export function ErrorState({
  fileName, onReset, onAsk,
}: { fileName: string; onReset: () => void; onAsk: () => void }) {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/80">Redact Sensitive Info</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>

        <h2 className="text-xl font-semibold mb-2">Sensitive information scan could not be completed.</h2>
        <p className="text-sm text-white/45 mb-8 leading-relaxed">
          The document could not be processed. This may be due to encryption, an unsupported format, or a network error.
        </p>

        <div className="w-full border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] text-left">
            <span className="text-xs text-white/52 uppercase tracking-widest">File attempted</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-medium text-white/80 truncate">{fileName}</div>
              <div className="text-xs text-red-400 mt-0.5">Could not extract or process — please try again</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full mb-6">
          <button
            onClick={onReset}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload different file
          </button>
        </div>

        <div className="w-full border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] text-left">
            <span className="text-xs text-white/52 uppercase tracking-widest">What you can try instead</span>
          </div>
          {[
            { icon: "💬", label: "Ask This Document", sub: "Ask specific questions about the document you can open.", action: onAsk },
            { icon: "🔍", label: "Analyze a Document", sub: "Extract key terms and clauses from a single document.", action: onReset },
            { icon: "📋", label: "Use a text-based PDF", sub: "A digital PDF (not a scanned image) processes more reliably.", action: onReset },
            { icon: "✏️", label: "Paste the text directly", sub: "Copy the document text and paste it into the paste tab.", action: onReset },
          ].map(a => (
            <button
              key={a.label}
              onClick={a.action}
              className="w-full flex items-start gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-colors"
            >
              <span className="text-lg mt-0.5">{a.icon}</span>
              <div>
                <div className="text-sm font-medium text-white/80">{a.label}</div>
                <div className="text-xs text-white/35 mt-0.5 leading-relaxed">{a.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface WorkspaceProps {
  text: string
  fileName: string
  spans: PiiSpan[]
  onReset: () => void
  onExport: (selected: Set<string>) => void
  /** Original File object — present when input was a PDF upload */
  uploadedFile?: File | null
  /** True when the input source was a PDF file (not pasted text or non-PDF) */
  isPdfInput?: boolean
  /** QA-only: set the initial view mode */
  _qaViewMode?: "original" | "preview"
  /** QA-only: set an initially-active span id */
  _qaActiveId?: string | null
  /** QA-only: set the initial mobile tab */
  _qaMobileTab?: "redactions" | "document"
}

export function Workspace({ text, fileName, spans, onReset, onExport, uploadedFile, isPdfInput, _qaViewMode, _qaActiveId, _qaMobileTab }: WorkspaceProps) {
  const [selected, setSelected] = useState<Set<string>>(
    // Default: pre-select all high-confidence items
    () => new Set(spans.filter(s => s.confidence === "high").map(s => s.id))
  )
  const [activeId, setActiveId] = useState<string | null>(_qaActiveId ?? null)
  const [viewMode, setViewMode] = useState<"original" | "preview">(_qaViewMode ?? "original")
  const [unsaved, setUnsaved] = useState(false)
  const [mobileTab, setMobileTab] = useState<"redactions" | "document">(_qaMobileTab ?? "redactions")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [manualCount, setManualCount] = useState(0)

  // ── PDF export state ────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportMissed, setExportMissed] = useState(0)
  const [exportSuccess, setExportSuccess] = useState(false)

  const canExportPdf = !!(isPdfInput && uploadedFile)

  const handleExportClick = useCallback(async () => {
    if (canExportPdf) {
      setIsExporting(true)
      setExportError(null)
      setExportMissed(0)
      setExportSuccess(false)
      try {
        const approvedValues = spans.filter(s => selected.has(s.id)).map(s => s.value)
        const result = await downloadRedactedPdf(uploadedFile!, approvedValues, getApiBaseUrl())
        setExportMissed(result.missed)
        setExportSuccess(true)
        saveRecentWork({ tool: "redact", title: fileName.replace(/\.[^.]+$/, "") })
        setTimeout(() => setExportSuccess(false), 5000)
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "Export failed. Please try again.")
      } finally {
        setIsExporting(false)
      }
    } else {
      onExport(selected)
    }
  }, [canExportPdf, uploadedFile, spans, selected, onExport, fileName])

  const docScrollRef = useRef<HTMLDivElement>(null)
  const spanRefs = useRef<Map<string, HTMLElement>>(new Map())

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    setUnsaved(true)
  }, [])

  const activate = useCallback((id: string) => {
    setActiveId(prev => prev === id ? null : id)
    // Scroll document to span
    setTimeout(() => {
      const el = spanRefs.current.get(id)
      if (el && docScrollRef.current) {
        const container = docScrollRef.current
        const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
        container.scrollTo({ top: top - 200, behavior: "smooth" })
      }
    }, 50)
    if (window.innerWidth < 1024) setMobileTab("document")
  }, [])

  // Categories
  const CATS = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of spans) {
      const cat = typeChip(s.type).label
      map.set(cat, (map.get(cat) ?? 0) + 1)
    }
    return [["All", spans.length], ...Array.from(map.entries())] as [string, number][]
  }, [spans])

  const filteredSpans = useMemo(() =>
    categoryFilter === "all" ? spans : spans.filter(s => typeChip(s.type).label === categoryFilter),
    [spans, categoryFilter]
  )

  const selectedCount = selected.size
  const highPriority = spans.filter(s => s.type === "SSN" || s.type === "CREDIT_CARD").length

  // ── Right panel sections ──────────────────────────────────────────────────

  const rightPanel = (
    <div className="overflow-y-auto h-full">
      <div className="p-4 space-y-4">

        {/* A. Summary */}
        <section className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xs text-white/52 uppercase tracking-widest mb-3">A. Redaction Summary</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-red-400">{spans.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{spans.length} possible sensitive items found</p>
              <p className="text-xs text-white/35">{CATS.length - 1} categories detected</p>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed mb-2">
            Review each detected item on the document surface. Toggle between Original and Redaction Preview to see how the exported copy will look.
          </p>
          <p className="text-xs text-amber-400/80">Original document is unchanged. Redactions create a separate copy.</p>
        </section>

        {/* B. Detection strip */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-white/52 uppercase tracking-widest mb-2">B. Detection Strip</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-1 rounded-full text-xs border border-white/10 text-white/50">{spans.length} items found</span>
            <span className="px-2 py-1 rounded-full text-xs border border-emerald-500/25 text-emerald-400">{spans.filter(s => s.confidence === "high").length} high-confidence</span>
            {highPriority > 0 && <span className="px-2 py-1 rounded-full text-xs border border-red-500/25 text-red-400">{highPriority} high-priority</span>}
            <span className="px-2 py-1 rounded-full text-xs border border-violet-500/25 text-violet-400">{selectedCount} selected</span>
          </div>
        </section>

        {/* C. Suggested Redactions */}
        <section>
          <p className="text-xs text-white/52 uppercase tracking-widest mb-2">C. Suggested Redactions</p>
          <div className="space-y-2">
            {filteredSpans.map(span => {
              const chip = typeChip(span.type)
              const isSel = selected.has(span.id)
              const isAct = span.id === activeId
              return (
                <div
                  key={span.id}
                  onClick={() => activate(span.id)}
                  className={`rounded-xl p-3 border cursor-pointer transition-all ${isAct ? "border-violet-500/50 bg-violet-500/[0.07]" : isSel ? "border-emerald-500/35 bg-emerald-500/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/12"}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggle(span.id)}
                      className="mt-0.5 accent-emerald-500 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs border ${chip.cls}`}>{chip.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs border ${confCls(span.confidence)}`}>{span.confidence}</span>
                        {(span.type === "SSN" || span.type === "CREDIT_CARD") && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" title="High priority" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-1">
                        <div className="w-3 h-2 bg-white/15 rounded-sm shrink-0" />
                        <span className="text-xs text-white/60 font-mono truncate">{maskValue(span)}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform ${isAct ? "text-violet-400 rotate-90" : "text-white/20"}`} />
                  </div>

                  {/* Active expanded evidence */}
                  {isAct && (
                    <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                      <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                        <span className="text-xs text-white/52 mt-0.5 shrink-0">In document:</span>
                        <span className="text-xs text-amber-300 font-medium leading-relaxed">{span.value}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-black/30 border border-white/[0.07] px-3 py-2">
                        <span className="text-xs text-white/52 shrink-0">Redacted as:</span>
                        <span className="bg-black border border-white/20 rounded-sm text-transparent select-none inline-block" style={{ minWidth: "60px", height: "1em" }} />
                        <span className="text-xs text-white/25">[REDACTED]</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {!isSel && (
                          <button
                            onClick={e => { e.stopPropagation(); toggle(span.id) }}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium transition-colors"
                          >
                            ✓ Include in redaction
                          </button>
                        )}
                        {isSel && (
                          <button
                            onClick={e => { e.stopPropagation(); toggle(span.id) }}
                            className="flex-1 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white/50 hover:text-white/80 transition-colors"
                          >
                            Remove from redaction
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* D. Categories */}
        <section>
          <p className="text-xs text-white/52 uppercase tracking-widest mb-2">D. Redaction Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat === "All" ? "all" : cat)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${(cat === "All" && categoryFilter === "all") || cat === categoryFilter ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/[0.07] text-white/40 hover:border-white/15"}`}
              >
                {cat} ({count})
              </button>
            ))}
          </div>
        </section>

        {/* E. Review Queue */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/52 uppercase tracking-widest mb-3">E. Review Queue</p>
          <div className="space-y-2">
            {[
              ["Selected for redaction", selectedCount.toString(), "text-emerald-400"],
              ["Needs confirmation", spans.filter(s => s.confidence !== "high" && !selected.has(s.id)).length.toString(), "text-amber-400"],
              ["Left visible", (spans.length - selectedCount).toString(), "text-white/30"],
              ["Manually added", manualCount.toString(), "text-white/30"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="flex items-center justify-between text-xs">
                <span className="text-white/45">{l as string}</span>
                <span className={`font-semibold ${c as string}`}>{v as string}</span>
              </div>
            ))}
          </div>
        </section>

        {/* F. Manual Redaction Tools */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/52 uppercase tracking-widest mb-3">F. Manual Redaction Tools</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Plus, label: "Add manual item", action: () => setManualCount(c => c + 1) },
              { icon: Undo2, label: "Undo last", action: () => {} },
              { icon: Trash2, label: "Clear manual", action: () => setManualCount(0) },
              { icon: EyeOffIcon, label: "Select all", action: () => { setSelected(new Set(spans.map(s => s.id))); setUnsaved(true) } },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={action} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-white/45 hover:border-white/15 hover:text-white/70 transition-colors">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* G. Save / Export */}
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => { void handleExportClick() }}
            disabled={isExporting}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating redacted PDF…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {canExportPdf ? "Export Redacted PDF" : "Export Redacted Copy"}
              </>
            )}
          </button>

          {/* Export success */}
          {exportSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Redacted PDF downloaded.</span>
            </div>
          )}

          {/* Missed-values warning */}
          {exportMissed > 0 && !exportError && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{exportMissed} selected item{exportMissed > 1 ? "s" : ""} could not be matched in the PDF text layer. Review the exported file before sharing.</span>
            </div>
          )}

          {/* Export error */}
          {exportError && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Non-PDF note */}
          {!canExportPdf && (
            <p className="text-xs text-white/42 text-center">PDF redaction export is available for PDF uploads.</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setUnsaved(false) }}
              className={`py-2 rounded-lg border text-xs transition-colors flex items-center justify-center gap-1.5 ${unsaved ? "border-amber-500/40 text-amber-400 bg-amber-500/[0.04]" : "border-white/[0.07] text-white/40"}`}
            >
              <Save className="w-3.5 h-3.5" />
              {unsaved ? "Save changes" : "Saved"}
            </button>
            <button
              onClick={() => setViewMode(v => v === "original" ? "preview" : "original")}
              className="py-2 rounded-lg border border-white/[0.07] text-xs text-white/40 hover:text-white/70 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              {viewMode === "original" ? "Preview redacted" : "Original view"}
            </button>
          </div>
          <p className="text-xs text-white/38 text-center">PlainPath creates a flattened redacted PDF copy. The original file is unchanged.</p>
        </section>

        {/* H. Source Traceability */}
        {activeId && (
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-xs text-white/52 uppercase tracking-widest mb-2">H. Source Traceability</p>
            {(() => {
              const span = spans.find(s => s.id === activeId)
              if (!span) return null
              const chip = typeChip(span.type)
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/30">Type:</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs border ${chip.cls}`}>{chip.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/30">Detected via:</span>
                    <span className="text-white/50">{span.source === "regex" ? "Pattern match" : span.source === "ai" ? "AI detection" : "Pattern + AI"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/30">Confidence:</span>
                    <span className={confCls(span.confidence).split(" ")[0]}>{span.confidence}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/30">Position:</span>
                    <span className="text-white/40 font-mono">chars {span.start}–{span.end}</span>
                  </div>
                </div>
              )
            })()}
          </section>
        )}

      </div>
    </div>
  )

  // ── Document side ───────────────────────────────────────────────────────────

  const docPanel = useMemo(() => (
    <div ref={docScrollRef} className="overflow-y-auto h-full bg-[#111115] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-white/35">
          <FileText className="w-3.5 h-3.5" />
          <span className="truncate max-w-[180px]">{fileName}</span>
        </div>
        <div>
          {viewMode === "preview"
            ? <span className="text-xs text-violet-400">{selectedCount} items redacted in preview</span>
            : <span className="text-xs text-amber-400">{spans.length} items detected</span>}
        </div>
      </div>

      <AnnotatedDocument
        text={text}
        spans={spans}
        selected={selected}
        activeId={activeId}
        viewMode={viewMode}
        onActivate={activate}
        spanRefs={spanRefs}
        fileName={fileName}
      />

      {viewMode === "original" && (
        <p className="text-center text-xs text-white/20 mt-4">Click a highlighted item to inspect · Original document unchanged</p>
      )}
      {viewMode === "preview" && (
        <p className="text-center text-xs text-violet-400/50 mt-4">Redaction preview — black bars replace {selectedCount} selected items in the export</p>
      )}
    </div>
  ), [text, spans, selected, selectedCount, activeId, viewMode, activate, fileName])

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
      {/* Nav */}
      <header className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 lg:gap-3 shrink-0">
        <button onClick={onReset} className="text-white/40 hover:text-white/80 transition-colors p-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white/80 hidden sm:block">Redact Sensitive Info</span>
        <span className="text-white/20 text-xs hidden sm:block">/</span>
        <span className="text-sm text-white/50 truncate max-w-[140px]">{fileName}</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Unsaved indicator */}
          {unsaved && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved
            </span>
          )}
          {/* View toggle */}
          <div className="flex items-center border border-white/[0.08] rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => setViewMode("original")}
              className={`px-2.5 lg:px-3 py-1.5 transition-colors ${viewMode === "original" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"}`}
            >
              <span className="hidden lg:inline">Original</span>
              <Eye className="w-3.5 h-3.5 lg:hidden" />
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 lg:px-3 py-1.5 transition-colors ${viewMode === "preview" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              <span className="hidden lg:inline">Redaction Preview</span>
              <EyeOffIcon className="w-3.5 h-3.5 lg:hidden" />
            </button>
          </div>
          {/* Save */}
          <button
            type="button"
            onClick={() => setUnsaved(false)}
            className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${unsaved ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "border-white/[0.08] text-white/40"}`}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          {/* Export */}
          <button
            type="button"
            onClick={() => { void handleExportClick() }}
            disabled={isExporting}
            className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors"
          >
            {isExporting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />
            }
            <span className="hidden lg:inline">
              {isExporting ? "Generating…" : canExportPdf ? "Export Redacted PDF" : "Export Redacted"}
            </span>
          </button>
        </div>
      </header>

      {/* Active item banner (shows when an item is selected) */}
      {activeId && (() => {
        const span = spans.find(s => s.id === activeId)
        if (!span) return null
        return (
          <div className="border-b border-white/[0.06] bg-[#0e0e12] px-4 py-2.5 flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              <span className="text-xs text-violet-300 font-medium truncate">Active: {span.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1">
                <span className="text-xs text-white/30 shrink-0">In doc:</span>
                <span className="text-xs text-amber-300 font-medium">{span.value}</span>
              </div>
              <span className="text-white/20 text-xs">→</span>
              <span className="bg-black border border-white/20 rounded-sm text-transparent select-none inline-block" style={{ minWidth: "48px", height: "1em" }} />
            </div>
            <button onClick={() => setActiveId(null)} className="ml-auto text-white/25 hover:text-white/60 shrink-0 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })()}

      {/* Preview banner */}
      {viewMode === "preview" && (
        <div className="border-b border-violet-500/20 bg-violet-500/[0.04] px-4 py-1.5 flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span className="text-xs text-violet-300">Redaction preview — {selectedCount} items will appear as black bars in the export</span>
        </div>
      )}

      {/* ── DESKTOP: side-by-side panels ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="w-[60%] border-r border-white/[0.06] overflow-hidden flex flex-col">
          {docPanel}
        </div>
        <div className="w-[40%] overflow-hidden flex flex-col">
          {rightPanel}
        </div>
      </div>

      {/* ── MOBILE: tabbed layout ── */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setMobileTab("redactions")}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${mobileTab === "redactions" ? "border-violet-500 text-violet-300 bg-violet-500/[0.04]" : "border-transparent text-white/35"}`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <EyeOffIcon className="w-3.5 h-3.5" />
              Redactions {selectedCount > 0 && <span className="bg-violet-500/30 text-violet-300 rounded-full px-1.5 text-xs">{selectedCount}</span>}
            </div>
          </button>
          <button
            onClick={() => setMobileTab("document")}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${mobileTab === "document" ? "border-violet-500 text-violet-300 bg-violet-500/[0.04]" : "border-transparent text-white/35"}`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Document
            </div>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {mobileTab === "redactions" ? rightPanel : docPanel}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageState = "empty" | "processing" | "workspace" | "error"

export default function Redact() {
  const [, setLocation] = useLocation()

  const { entitlements, loading: entitlementsLoading } = useEntitlements()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const canRedact = BILLING_CONFIG.PAYWALL_ENFORCEMENT
    ? (entitlements?.toolAccess?.includes("redact") ?? false)
    : true

  useEffect(() => {
    if (!entitlementsLoading && BILLING_CONFIG.PAYWALL_ENFORCEMENT && !canRedact) {
      setUpgradeOpen(true)
    }
  }, [entitlementsLoading, canRedact])

  // Page state
  const [pageState, setPageState] = useState<PageState>("empty")
  const [docText, setDocText] = useState("")
  const [fileName, setFileName] = useState("")
  const [spans, setSpans] = useState<PiiSpan[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [returnTo, setReturnTo] = useState<"analyze" | "trust-check" | "contract-review" | "none">("none")

  useEffect(() => {
    document.title = "Redact Sensitive Info — PlainPath"
    try {
      const raw = sessionStorage.getItem("pii_redact_input")
      if (raw) {
        const stored = JSON.parse(raw) as { text: string; source?: string; fileName?: string }
        sessionStorage.removeItem("pii_redact_input")
        if (stored.text && stored.text.trim().length > 10) {
          const src = stored.source
          setReturnTo(src === "trust-check" ? "trust-check" : src === "contract-review" ? "contract-review" : src === "analyze" ? "analyze" : "none")
          void handleTextInput(stored.text.trim(), stored.fileName ?? "Imported document")
        }
      }
    } catch { /* ignore */ }
  }, [])

  async function runDetection(text: string): Promise<PiiSpan[]> {
    const apiBase = getApiBaseUrl()
    const res = await fetch(`${apiBase}/api/documents/detect-pii`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error("Detection failed")
    const data = await res.json() as { spans: PiiSpan[] }
    return data.spans ?? []
  }

  async function handleTextInput(text: string, name: string) {
    setDocText(text)
    setFileName(name)
    setPageState("processing")
    try {
      const detected = await runDetection(text)
      setSpans(detected)
      setPageState("workspace")
    } catch {
      setPageState("error")
    }
  }

  async function handleFileUpload(file: File) {
    setExtracting(true)
    setUploadError(null)
    try {
      const apiBase = getApiBaseUrl()
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`${apiBase}/api/documents/extract-text`, { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(data.message ?? "File extraction failed. Please try again.")
      }
      const data = await res.json() as { text?: string }
      if (!data.text || data.text.trim().length < 20) throw new Error("No readable text found. Try pasting the text directly.")
      setExtracting(false)
      await handleTextInput(data.text, file.name)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "File extraction failed.")
      setExtracting(false)
    }
  }

  async function handleUrlImport(url: string) {
    setUrlLoading(true)
    setUrlError(null)
    try {
      const apiBase = getApiBaseUrl()
      const res = await fetch(`${apiBase}/api/documents/import-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json() as { text?: string; message?: string }
      if (!res.ok) { setUrlError(data.message ?? "Failed to import. Check the link and try again."); return }
      if (!data.text || data.text.length < 30) { setUrlError("Could not extract readable text. Try downloading and uploading the file directly."); return }
      await handleTextInput(data.text, url.split("/").pop() ?? "Imported document")
    } catch {
      setUrlError("Network error — check your connection and try again.")
    } finally {
      setUrlLoading(false)
    }
  }

  function handleExport(selected: Set<string>) {
    if (returnTo !== "none") {
      // Return-to flow: strip selected spans from text and navigate back
      let out = docText
      const selSpans = spans.filter(s => selected.has(s.id)).sort((a, b) => b.start - a.start)
      for (const span of selSpans) {
        out = out.slice(0, span.start) + "[REDACTED]" + out.slice(span.end)
      }
      try {
        if (returnTo === "contract-review") sessionStorage.setItem("pii_contract_review_text", out)
        else sessionStorage.setItem("pii_analyze_text", out)
      } catch { /* ignore */ }
      const dest = returnTo === "contract-review" ? "/contract-review" : returnTo === "trust-check" ? "/analyze?mode=trust-check" : "/analyze"
      setLocation(dest)
      return
    }

    // Standalone: download redacted text
    let out = docText
    const selSpans = spans.filter(s => selected.has(s.id)).sort((a, b) => b.start - a.start)
    for (const span of selSpans) {
      out = out.slice(0, span.start) + "[REDACTED]" + out.slice(span.end)
    }
    const blob = new Blob([out], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName.replace(/\.[^.]+$/, "") + "_redacted.txt"
    a.click()
    URL.revokeObjectURL(url)
    saveRecentWork({ tool: "redact", title: fileName.replace(/\.[^.]+$/, "") })
  }

  function handleReset() {
    setPageState("empty")
    setDocText("")
    setFileName("")
    setSpans([])
    setUploadedFile(null)
    setUploadError(null)
    setUrlError(null)
  }

  // ── Subscription gate ──────────────────────────────────────────────────────
  if (entitlementsLoading && BILLING_CONFIG.PAYWALL_ENFORCEMENT) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    )
  }

  if (!canRedact) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col items-center justify-center px-4 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <EyeOff className="w-7 h-7 text-violet-400" />
        </div>
        <div className="max-w-xs">
          <h2 className="text-lg font-bold mb-1">Redact Sensitive Info</h2>
          <p className="text-sm text-white/40 leading-relaxed">
            Automatic PII detection and redaction is available on the Starter plan and above.
          </p>
        </div>
        <button onClick={() => setUpgradeOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors">
          View plans &amp; pricing
          <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={() => setLocation("/")} className="text-sm text-white/30 hover:text-white/60 transition-colors">
          Back to tools
        </button>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="redact" />
      </div>
    )
  }

  // ── State routing ──────────────────────────────────────────────────────────
  if (pageState === "processing") return <DocumentScanScreen mode="redact" fileName={fileName} />

  if (pageState === "error") {
    return (
      <ErrorState
        fileName={fileName}
        onReset={handleReset}
        onAsk={() => setLocation("/ask")}
      />
    )
  }

  if (pageState === "workspace") {
    const isPdfInput = !!(uploadedFile && uploadedFile.name.toLowerCase().endsWith(".pdf"))
    return (
      <Workspace
        text={docText}
        fileName={fileName}
        spans={spans}
        onReset={handleReset}
        onExport={handleExport}
        uploadedFile={uploadedFile}
        isPdfInput={isPdfInput}
      />
    )
  }

  return (
    <EmptyState
      onText={handleTextInput}
      onFile={handleFileUpload}
      onUrl={handleUrlImport}
      extracting={extracting}
      urlLoading={urlLoading}
      uploadError={uploadError}
      urlError={urlError}
      uploadedFile={uploadedFile}
      setUploadedFile={setUploadedFile}
    />
  )
}
