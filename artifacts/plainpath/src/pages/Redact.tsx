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
import { useLocation } from "wouter"
import {
  ShieldCheck, ArrowLeft, UploadCloud, Type, Loader2, AlertCircle, File, X,
  FileText, Scale, EyeOff, Download, Copy, Check, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { PiiReview } from "@/components/PiiReview"
import { getApiBaseUrl } from "@/lib/api"

// ─── Accepted file types ──────────────────────────────────────────────────────

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

// ─── Component ────────────────────────────────────────────────────────────────

export default function Redact() {
  const [, setLocation] = useLocation()

  // Input state
  const [mode, setMode] = useState<"paste" | "upload">("paste")
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
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
    const allowedExts = [".pdf", ".docx", ".txt"]
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase()
    if (!allowed.includes(file.type) && !allowedExts.includes(ext)) {
      return "Unsupported file type. Please upload a PDF, DOCX, or TXT file."
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
      const res = await fetch(`${apiBase}/api/documents/extract-text`, {
        method: "POST",
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
  function handleAnalyzeRedacted(redactedText: string) {
    if (returnTo === "none") {
      // Standalone mode — show multi-destination next-step panel
      setNextStepText(redactedText)
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

  // ─── NEXT-STEP PANEL (standalone post-redaction) ─────────────────────────
  if (nextStepText !== null) {
    return (
      <WorkspaceShell>
        <div className="max-w-xl mx-auto py-8 px-4 space-y-6">

          {/* Header */}
          <div className="space-y-1">
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
      </WorkspaceShell>
    )
  }

  // ─── REVIEW PHASE ────────────────────────────────────────────────────────
  if (activeText !== null) {
    return (
      <WorkspaceShell>
        <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">Review & Redact</h1>
            </div>
          </div>

          <PiiReview
            text={activeText}
            fileName={activeFileName}
            continueLabel={continueLabel}
            onAnalyzeRedacted={handleAnalyzeRedacted}
            onCancel={handleCancel}
          />
        </div>
      </WorkspaceShell>
    )
  }

  // ─── INPUT PHASE (standalone) ────────────────────────────────────────────
  return (
    <WorkspaceShell>
      <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Redact Sensitive Information</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Automatically detect and permanently remove personal information from a document before sharing, analyzing, or exporting it.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          {(["paste", "upload"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setUploadError(null); setUploadedFile(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "paste" ? <Type className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {m === "paste" ? "Paste Text" : "Upload File"}
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
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT · up to 20 MB</p>
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
      </div>
    </WorkspaceShell>
  )
}
