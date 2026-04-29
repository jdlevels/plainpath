// ─── Redact Page ──────────────────────────────────────────────────────────────
// Standalone route: /redact
//
// TWO ENTRY PATHS:
//   A) From Import.tsx — sessionStorage key "pii_redact_input" contains
//      { text, source: "analyze" | "trust-check", fileName? }
//      After "Analyze this", saves redacted text to "pii_analyze_text"
//      and navigates back to /analyze.
//
//   B) Standalone — user navigates directly to /redact.
//      Shows input step: paste text or upload file.
//      File uploads: uses /api/documents/extract-text to get text first.
//
// PHASE 2 / FUTURE-READY STUBS (not yet built):
//   - Standalone tool card in Home page
//   - "Redact a Document" route in Navbar
//   - Redaction audit log (who redacted what, when)
//   - Document-type templates ("Redact all SSNs for medical records")
//   - Manual box-select redaction on image/PDF
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/react"
import { useLocation } from "wouter"
import {
  ShieldCheck, ArrowLeft, UploadCloud, Type, Loader2, AlertCircle, File, X,
  FileText, Scale, EyeOff, Download, Copy, Check, ArrowRight, Lock,
  User, PenLine as FileContract, HeartPulse, FileDown, Camera, MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { ToolPageHeader } from "@/components/ToolPageHeader"
import { PiiReview } from "@/components/PiiReview"
import { PdfRedactViewer } from "@/components/PdfRedactViewer"
import { getApiBaseUrl } from "@/lib/api"
import { downloadRedactedPdf, downloadRedactedText } from "@/lib/piiExport"
import { saveRecentWork } from "@/lib/recentWork"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import { BILLING_CONFIG } from "@/lib/billingConfig"

// ─── Accepted file types ──────────────────────────────────────────────────────

const ACCEPTED = ".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp,image/gif"

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function isImageFile(name: string, mime?: string): boolean {
  const ext = "." + (name.split(".").pop() ?? "").toLowerCase()
  return IMAGE_EXTS.includes(ext) || IMAGE_MIMES.includes(mime ?? "")
}

function isPdfFile(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf")
}

// ─── Built-in demo documents ──────────────────────────────────────────────────

const REDACT_DEMOS: Array<{
  id: string
  label: string
  meta: string
  fileName: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  text: string
}> = [
  {
    id: "personal-info-letter",
    label: "Personal Info Letter",
    meta: "Name · SSN · address · phone",
    fileName: "personal_info_letter.txt",
    icon: User,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
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
    fileName: "freelance_contract.txt",
    icon: FileContract,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
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
Freelancer agrees to design a brand identity package — including logo, color palette, and typography system — for Client's product launch scheduled for June 2024.

2. COMPENSATION
Client shall pay Freelancer a flat fee of $4,800 USD. A deposit of $1,200 USD is due upon signing. The remaining $3,600 USD is due within 14 days of final delivery.

Payment via bank transfer to:
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
    id: "medical-benefits-form",
    label: "Medical Benefits Form",
    meta: "Patient · DOB · member ID · provider",
    fileName: "medical_benefits_form.txt",
    icon: HeartPulse,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: `PATIENT INFORMATION FORM
Bright Valley Medical Center

Please complete all fields before your appointment.

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
  Subscriber Name:        Christine L. Nguyen

EMERGENCY CONTACT
  Name:                   David K. Nguyen
  Relationship:           Spouse
  Phone:                  (916) 553-0872

PRIMARY CARE PROVIDER
  Name:                   Dr. Anita Ramos
  Provider NPI:           1234567890
  Clinic Phone:           (916) 481-2200
  Clinic Fax:             (916) 481-2201

REFERRING PHYSICIAN
  Dr. James T. Holbrook
  Holbrook Internal Medicine
  751 Oak Park Avenue, Suite 104, Sacramento, CA 95815

By signing below, I authorize Bright Valley Medical Center to use and disclose my health information as needed for treatment, payment, and healthcare operations.

Patient Signature: Christine L. Nguyen
Date: April 10, 2024`,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Redact() {
  const { getToken } = useAuth()
  const [, setLocation] = useLocation()

  // ── Subscription gate ─────────────────────────────────────────────────────
  // Redact Sensitive Info is available to Starter and Pro plans.
  // Free / no-subscription users are shown an upgrade prompt.
  const { entitlements, loading: entitlementsLoading } = useEntitlements()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const canRedact = BILLING_CONFIG.PAYWALL_ENFORCEMENT
    ? (entitlements?.toolAccess?.includes("redact") ?? false)
    : true

  // Show upgrade modal automatically when enforcement is on and user lacks access
  useEffect(() => {
    if (!entitlementsLoading && BILLING_CONFIG.PAYWALL_ENFORCEMENT && !canRedact) {
      setUpgradeOpen(true)
    }
  }, [entitlementsLoading, canRedact])

  // Input state
  const [mode, setMode] = useState<"paste" | "upload" | "scan">("paste")
  const [pastedText, setPastedText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [extractingFile, setExtractingFile] = useState(false)

  // Review state
  const [activeText, setActiveText] = useState<string | null>(null)
  const [activeFileName, setActiveFileName] = useState<string | undefined>()
  const [returnTo, setReturnTo] = useState<"analyze" | "trust-check" | "contract-review" | "none">("none")

  // Post-redaction next-step state (standalone mode only)
  const [nextStepText, setNextStepText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pdfCompletionActive, setPdfCompletionActive] = useState(false)
  const [pdfApprovedValues, setPdfApprovedValues] = useState<string[]>([])
  const [pdfDownloading, setPdfDownloading] = useState(false)
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null)

  // On mount: check if we were launched from another tool's "Redact first" flow
  useEffect(() => {
    document.title = "Redact Sensitive Information — PlainPath"
    try {
      const raw = sessionStorage.getItem("pii_redact_input")
      if (raw) {
        const stored = JSON.parse(raw) as {
          text: string
          source?: "analyze" | "trust-check" | "contract-review"
          fileName?: string
        }
        sessionStorage.removeItem("pii_redact_input")
        if (stored.text && stored.text.trim().length > 10) {
          setActiveText(stored.text)
          setActiveFileName(stored.fileName)
          const src = stored.source
          setReturnTo(
            src === "trust-check" ? "trust-check" :
            src === "contract-review" ? "contract-review" :
            src === "analyze" ? "analyze" : "none"
          )
        }
      }
    } catch {
      // sessionStorage unavailable or parse error — ignore
    }
  }, [])

  // ── File validation ──────────────────────────────────────────────────────
  function validateFile(file: File): string | null {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      ...IMAGE_MIMES,
    ]
    const allowedExts = [".pdf", ".docx", ".txt", ...IMAGE_EXTS]
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase()
    if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
      return "Unsupported file type. Please upload a PDF, DOCX, TXT, or image file (JPG, PNG, WEBP)."
    }
    if (file.size > 20 * 1024 * 1024) {
      return "File is too large. Maximum allowed size is 20 MB."
    }
    return null
  }

  // ── Handle file selection ─────────────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { setUploadError(err); return }
    setUploadedFile(file)
    setUploadError(null)
    e.target.value = ""
  }

  // ── Extract text from uploaded file, then launch review ──────────────────
  async function handleExtractAndRedact() {
    if (!uploadedFile) return
    setExtractingFile(true)
    setUploadError(null)
    try {
      const apiBase = getApiBaseUrl()
      const formData = new FormData()
      formData.append("file", uploadedFile)
      const redactToken = await getToken().catch(() => null)
      const res = await fetch(`${apiBase}/api/documents/extract-text`, {
        method: "POST",
        headers: redactToken ? { Authorization: `Bearer ${redactToken}` } : undefined,
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(
          data.message ??
          (res.status === 422
            ? "Could not extract text from this file. Try pasting the text directly instead."
            : "File extraction failed. Please try again.")
        )
      }
      const data = await res.json() as { text?: string }
      if (!data.text || data.text.trim().length < 20) {
        throw new Error("No readable text found in this file. Try pasting the text directly instead.")
      }
      setActiveText(data.text)
      setActiveFileName(uploadedFile.name)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "File extraction failed.")
    } finally {
      setExtractingFile(false)
    }
  }

  // ── After redaction applied: route back OR show next-step panel ──────────
  function handleAnalyzeRedacted(redactedText: string, approvedValues?: string[]) {
    if (returnTo === "none") {
      setNextStepText(redactedText)
      // PDF source: show PDF completion screen instead of text-only panel
      if (uploadedFile && isPdfFile(uploadedFile.name)) {
        setPdfApprovedValues(approvedValues ?? [])
        setPdfCompletionActive(true)
      }
      return
    }
    try {
      if (returnTo === "contract-review") {
        sessionStorage.setItem("pii_contract_review_text", redactedText)
        setLocation("/contract-review")
      } else if (returnTo === "trust-check") {
        sessionStorage.setItem("pii_analyze_text", redactedText)
        setLocation("/analyze?mode=trust-check")
      } else {
        sessionStorage.setItem("pii_analyze_text", redactedText)
        setLocation("/analyze")
      }
    } catch {
      if (returnTo === "contract-review") setLocation("/contract-review")
      else if (returnTo === "trust-check") setLocation("/analyze?mode=trust-check")
      else setLocation("/analyze")
    }
  }

  // ── From next-step panel: ask questions about the redacted document ────────
  function sendToAsk() {
    if (!nextStepText) return
    try {
      sessionStorage.setItem("pii_analyze_text", nextStepText)
    } catch { /* sessionStorage unavailable */ }
    setLocation("/analyze")
  }

  // ── From next-step panel: send to a specific tool ─────────────────────────
  function sendToTool(dest: "analyze" | "trust-check" | "contract-review") {
    if (!nextStepText) return
    try {
      if (dest === "contract-review") {
        sessionStorage.setItem("pii_contract_review_text", nextStepText)
        setLocation("/contract-review")
      } else if (dest === "trust-check") {
        sessionStorage.setItem("pii_analyze_text", nextStepText)
        setLocation("/analyze?mode=trust-check")
      } else {
        sessionStorage.setItem("pii_analyze_text", nextStepText)
        setLocation("/analyze")
      }
    } catch {
      if (dest === "contract-review") setLocation("/contract-review")
      else if (dest === "trust-check") setLocation("/analyze?mode=trust-check")
      else setLocation("/analyze")
    }
  }

  // ── Next-step panel copy / download ───────────────────────────────────────
  function handleCopyRedacted() {
    if (!nextStepText) return
    navigator.clipboard.writeText(nextStepText).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleDownloadRedacted() {
    if (!nextStepText) return
    const blob = new Blob([nextStepText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = activeFileName
      ? activeFileName.replace(/\.[^.]+$/, "") + "_redacted.txt"
      : "redacted_document.txt"
    a.click()
    URL.revokeObjectURL(url)
    saveRecentWork({
      tool: "redact",
      title: activeFileName ? activeFileName.replace(/\.[^.]+$/, "") : "Redacted Document",
    })
  }

  // ── Cancel: return to the originating tool ────────────────────────────────
  function handleCancel() {
    if (returnTo === "contract-review") setLocation("/contract-review")
    else if (returnTo === "trust-check") setLocation("/analyze?mode=trust-check")
    else if (returnTo === "analyze") setLocation("/analyze")
    else setActiveText(null)
  }

  // ── Label for the "continue" action based on origin ───────────────────────
  const continueLabel =
    returnTo === "contract-review" ? "Review this contract" :
    returnTo === "trust-check" ? "Run Trust Check on this document" :
    returnTo === "analyze" ? "Analyze this document" :
    "Continue with redacted version"

  const canSubmitPaste = pastedText.trim().length >= 30

  // ── PDF download helper (used in PDF completion screen) ──────────────────
  async function handleDownloadRedactedPdfFinal() {
    if (!uploadedFile || pdfDownloading) return
    setPdfDownloading(true)
    setPdfDownloadError(null)
    try {
      const apiBase = getApiBaseUrl()
      await downloadRedactedPdf(uploadedFile, pdfApprovedValues, apiBase)
      saveRecentWork({
        tool: "redact",
        title: uploadedFile.name.replace(/\.[^.]+$/, ""),
      })
    } catch (err) {
      setPdfDownloadError(err instanceof Error ? err.message : "PDF download failed. Please try again.")
    } finally {
      setPdfDownloading(false)
    }
  }

  // ── Reset helper ──────────────────────────────────────────────────────────
  function resetAll() {
    setNextStepText(null)
    setPdfCompletionActive(false)
    setPdfApprovedValues([])
    setPdfDownloadError(null)
    setActiveText(null)
    setPastedText("")
    setUploadedFile(null)
  }

  // ─── SUBSCRIPTION GATE ────────────────────────────────────────────────────
  // Redact requires Starter or Pro. Show upgrade modal for free/no-plan users.
  if (entitlementsLoading && BILLING_CONFIG.PAYWALL_ENFORCEMENT) {
    return (
      <WorkspaceShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </WorkspaceShell>
    )
  }

  if (!canRedact) {
    return (
      <WorkspaceShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center">
            <EyeOff className="w-7 h-7 text-violet-500 dark:text-violet-400" />
          </div>
          <div className="max-w-xs">
            <h2 className="text-lg font-bold mb-1">Redact Sensitive Info</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatic PII detection and redaction is available on the Starter plan and above.
            </p>
          </div>
          <Button onClick={() => setUpgradeOpen(true)} className="gap-2 mt-1">
            View plans &amp; pricing
            <ArrowRight className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to tools
          </button>
        </div>
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          reason="redact"
        />
      </WorkspaceShell>
    )
  }

  // ─── PDF COMPLETION SCREEN ───────────────────────────────────────────────
  // Shown when source was a PDF and returnTo === "none"
  if (nextStepText !== null && pdfCompletionActive && uploadedFile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1440px] mx-auto py-6 px-4 space-y-4">

          {/* Header with back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setNextStepText(null); setPdfCompletionActive(false); setActiveText(null) }}
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
              aria-label="Back to review"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Redacted PDF ready</h1>
              <p className="text-xs text-muted-foreground">
                {pdfApprovedValues.length} value{pdfApprovedValues.length !== 1 ? "s" : ""} permanently blacked out
                {uploadedFile.name && <span className="font-mono ml-1">· {uploadedFile.name}</span>}
              </p>
            </div>
          </div>

          {/* Two-column: preview + actions */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">

            {/* LEFT: PDF preview */}
            <div className="w-full lg:w-[60%] lg:sticky lg:top-20 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Redacted PDF Preview</p>
                <span className="text-[9px] text-muted-foreground/50">black boxes = permanently hidden</span>
              </div>
              <PdfRedactViewer file={uploadedFile} approvedValues={pdfApprovedValues} />
            </div>

            {/* RIGHT: Actions */}
            <div className="flex-1 space-y-4">

              {/* Primary: download PDF */}
              <div className="space-y-1.5">
                <Button
                  size="lg"
                  className="w-full h-12 text-sm rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleDownloadRedactedPdfFinal}
                  disabled={pdfDownloading}
                >
                  {pdfDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  {pdfDownloading ? "Building redacted PDF…" : "Download Redacted PDF"}
                </Button>
                {pdfDownloadError && <p className="text-xs text-destructive text-center">{pdfDownloadError}</p>}
                <p className="text-[10px] text-center text-muted-foreground/40">
                  Solid black boxes · original file unchanged · content unrecoverable
                </p>
              </div>

              {/* Send to another PlainPath tool */}
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Continue with redacted text</p>
                <div className="space-y-2">
                  <button onClick={() => sendToTool("analyze")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-950/20 hover:bg-blue-100/80 dark:hover:bg-blue-950/40 transition-colors group text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Analyze this document</p>
                      <p className="text-xs text-muted-foreground">Get an action plan from the redacted version</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  <button onClick={() => sendToTool("trust-check")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200/60 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-950/40 transition-colors group text-left">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">Run Trust Check</p>
                      <p className="text-xs text-muted-foreground">Verify legitimacy on the redacted document</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  <button onClick={() => sendToTool("contract-review")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-950/40 transition-colors group text-left">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Review this contract</p>
                      <p className="text-xs text-muted-foreground">Clause-by-clause review of the redacted version</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  <button onClick={sendToAsk} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/80 dark:bg-indigo-950/20 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/40 transition-colors group text-left">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Ask This Document</p>
                      <p className="text-xs text-muted-foreground">Ask plain-English questions about the redacted document</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </div>
              </div>

              {/* Secondary: .txt export */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-lg" onClick={handleCopyRedacted}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy text"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-lg" onClick={handleDownloadRedacted}>
                  <Download className="w-3.5 h-3.5" />
                  Download .txt
                </Button>
              </div>

              {/* Start over */}
              <div className="flex justify-center pt-1">
                <button onClick={resetAll} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  Redact another document
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    )
  }

  // ─── TEXT NEXT-STEP PANEL (non-PDF standalone post-redaction) ────────────
  if (nextStepText !== null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto py-8 px-4 space-y-6">

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNextStepText(null)}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                aria-label="Back to review"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight">Redaction complete</h1>
                  <p className="text-xs text-muted-foreground">Your redacted document is ready</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export options */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Save or export</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2 rounded-lg"
                onClick={handleCopyRedacted}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy text"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2 rounded-lg"
                onClick={handleDownloadRedacted}
              >
                <Download className="w-3.5 h-3.5" />
                Download .txt
              </Button>
            </div>
          </div>

          {/* Send to another tool */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Send to a PlainPath tool</p>
            <div className="space-y-2">
              <button
                onClick={() => sendToTool("analyze")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-950/20 hover:bg-blue-100/80 dark:hover:bg-blue-950/40 transition-colors group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Analyze this document</p>
                  <p className="text-xs text-muted-foreground">Get an action plan from the redacted version</p>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => sendToTool("trust-check")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200/60 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-950/40 transition-colors group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">Run Trust Check</p>
                  <p className="text-xs text-muted-foreground">Verify legitimacy on the redacted document</p>
                </div>
                <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => sendToTool("contract-review")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-950/40 transition-colors group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Review this contract</p>
                  <p className="text-xs text-muted-foreground">Clause-by-clause review of the redacted version</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              <button
                onClick={sendToAsk}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/80 dark:bg-indigo-950/20 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/40 transition-colors group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Ask This Document</p>
                  <p className="text-xs text-muted-foreground">Ask plain-English questions about the redacted document</p>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>
          </div>

          {/* Start over */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setNextStepText(null)
                setActiveText(null)
                setPastedText("")
                setUploadedFile(null)
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Redact another document
            </button>
          </div>

        </div>
      </div>
    )
  }

  // ─── REVIEW PHASE ────────────────────────────────────────────────────────
  if (activeText !== null) {
    return (
      <div className="bg-background flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
        {/* Compact sticky workspace header */}
        <div className="sticky top-16 z-20 flex items-center gap-3 px-4 sm:px-6 py-2.5 border-b border-border/40 bg-background/95 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors flex-shrink-0"
            aria-label="Back to document input"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
          <h1 className="text-sm font-bold">Review &amp; Redact</h1>
          {activeFileName && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px] sm:max-w-[260px]">{activeFileName}</span>
          )}
          {returnTo !== "none" && (
            <span className="ml-auto text-[10px] text-muted-foreground hidden sm:block">
              ← Will return to {returnTo === "contract-review" ? "Contract Review" : returnTo === "trust-check" ? "Trust Check" : "Analysis"}
            </span>
          )}
        </div>

        {/* PiiReview workspace */}
        <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-4">
          <PiiReview
            text={activeText}
            fileName={activeFileName}
            continueLabel={continueLabel}
            onAnalyzeRedacted={handleAnalyzeRedacted}
            onCancel={handleCancel}
            sourcePdfFile={uploadedFile && isPdfFile(uploadedFile.name) ? uploadedFile : null}
            sourceImageFile={uploadedFile && isImageFile(uploadedFile.name, uploadedFile.type) ? uploadedFile : null}
          />
        </div>
      </div>
    )
  }

  // ─── INPUT PHASE (standalone) ────────────────────────────────────────────
  return (
    <WorkspaceShell>
      <ToolPageHeader
        toolName="Redact Sensitive Info"
        toolIcon={EyeOff}
        toolIconBg="bg-rose-100 dark:bg-rose-900/40"
        toolIconColor="text-rose-600 dark:text-rose-400"
        subtitle="Automatically detect and remove personal information before sharing."
        backTo="/"
      />
      <div className="max-w-xl mx-auto py-6 px-4 space-y-6">

        {/* Mode tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          {([
            { id: "paste", icon: Type, label: "Paste Text" },
            { id: "upload", icon: UploadCloud, label: "Upload File" },
            { id: "scan", icon: Camera, label: "Take Photo" },
          ] as const).map(({ id: m, icon: Icon, label }) => (
            <button
              key={m}
              onClick={() => { setMode(m); setUploadError(null); setUploadedFile(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{m === "paste" ? "Text" : m === "upload" ? "Upload" : "Photo"}</span>
            </button>
          ))}
        </div>

        {/* Paste mode */}
        {mode === "paste" && (
          <div className="space-y-4">
            <textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Paste your document text here…"
              className="w-full min-h-[220px] resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 leading-relaxed"
            />
            <Button
              size="lg"
              disabled={!canSubmitPaste}
              className="w-full h-12 rounded-xl gap-2"
              onClick={() => { setActiveText(pastedText); setReturnTo("none") }}
            >
              <ShieldCheck className="w-4 h-4" />
              Scan for Sensitive Information
            </Button>
          </div>
        )}

        {/* Upload mode */}
        {mode === "upload" && (
          <div className="space-y-4">
            {!uploadedFile ? (
              <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 bg-muted/20 hover:bg-muted/30 cursor-pointer transition-all p-10 text-center">
                <UploadCloud className="w-9 h-9 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-foreground">Click to upload a file</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, or image (JPG, PNG, WEBP) · up to 20 MB</p>
                </div>
                <input
                  type="file"
                  accept={ACCEPTED}
                  className="sr-only"
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="rounded-xl border border-border/50 bg-background p-4 flex items-center gap-3">
                <File className="w-8 h-8 text-primary/70 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/15 flex gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {uploadError}
              </div>
            )}

            {uploadedFile && (
              <Button
                size="lg"
                disabled={extractingFile}
                className="w-full h-12 rounded-xl gap-2"
                onClick={handleExtractAndRedact}
              >
                {extractingFile ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Extracting text…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Scan for Sensitive Information</>
                )}
              </Button>
            )}

            <p className="text-[11px] text-muted-foreground/50 text-center">
              Uploaded PDF/DOCX files are converted to text for redaction. PlainPath exports a clean redacted text version. The original uploaded file is not modified.
            </p>
          </div>
        )}

        {/* Camera / Scan mode */}
        {mode === "scan" && (
          <div className="space-y-4">
            {/* Camera card */}
            <div className="rounded-xl border border-border/50 bg-gradient-to-b from-violet-50/50 to-background dark:from-violet-950/10 dark:to-background p-6 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Camera className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Take a photo or scan a document</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Photograph a printed document, letter, form, or ID.
                  PlainPath uses AI to read all visible text, then scans it for sensitive information.
                </p>
              </div>

              {!uploadedFile ? (
                <label className="block cursor-pointer">
                  <Button size="lg" className="w-full gap-2 rounded-xl pointer-events-none bg-violet-600 hover:bg-violet-700 text-white" asChild>
                    <span>
                      <Camera className="w-4 h-4" />
                      <span className="sm:hidden">Open Camera or Choose Photo</span>
                      <span className="hidden sm:inline">Select Photo or Image File</span>
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  {/* Thumbnail preview */}
                  <div className="rounded-xl border border-border/30 overflow-hidden bg-muted/10">
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt={uploadedFile.name}
                      className="w-full object-contain max-h-[220px]"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/50">
                    <Camera className="w-4 h-4 text-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground" aria-label="Remove photo">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/15 flex gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {uploadError}
              </div>
            )}

            {uploadedFile && (
              <Button
                size="lg"
                disabled={extractingFile}
                className="w-full h-12 rounded-xl gap-2"
                onClick={handleExtractAndRedact}
              >
                {extractingFile ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Extracting text from image…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Scan for Sensitive Information</>
                )}
              </Button>
            )}

            {/* Mobile note */}
            <div className="flex items-start gap-2 rounded-lg bg-muted/30 border border-border/30 px-3 py-2.5">
              <Camera className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground/70 space-y-1">
                <p className="font-medium text-muted-foreground">On your phone?</p>
                <p>Tap "Open Camera" above to photograph a document directly. Hold your phone steady and make sure all text is visible and in focus.</p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/50 text-center">
              Scanned text is processed with AI. Pixel-level image redaction is not available — PlainPath exports a clean redacted text version.
            </p>
          </div>
        )}

        {/* What gets detected */}
        <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What gets detected</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              "Full names", "Street addresses", "Phone numbers", "Email addresses",
              "Social Security Numbers", "Tax IDs / EINs", "Dates of birth", "Account numbers",
              "Routing numbers", "Credit card numbers", "Policy / member IDs", "Case numbers",
              "License numbers", "Personal identifiers",
            ].map(item => (
              <div key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Try a sample document */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/40" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Try a sample document</p>
            <div className="flex-1 h-px bg-border/40" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {REDACT_DEMOS.map((demo) => {
              const Icon = demo.icon
              return (
                <button
                  key={demo.id}
                  onClick={() => {
                    setActiveText(demo.text)
                    setActiveFileName(demo.fileName)
                    setReturnTo("none")
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 hover:border-violet-400/50 hover:bg-violet-50/40 dark:hover:bg-violet-950/10 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg ${demo.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${demo.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">{demo.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{demo.meta}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
