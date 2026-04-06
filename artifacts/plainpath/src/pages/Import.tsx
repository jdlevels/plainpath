import { useState, useRef, useEffect } from "react"
import { useLocation, useSearch } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadCloud, ArrowRight, Loader2, AlertCircle,
  ClipboardList, GraduationCap, Banknote, CheckCircle2, FileText, Type, File,
  ArrowLeft, Building2, Scale, Heart, FileSignature,
  Mail, HelpCircle, ShieldCheck, AlertTriangle, XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAnalyzeDocument } from "@workspace/api-client-react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { getApiBaseUrl } from "@/lib/api"
import { beforeRunAnalysis, UsageLimitError } from "@/lib/analysisGate"
import { incrementAnalysis, incrementTrustCheck } from "@/lib/usageMeter"
import UpgradeModal from "@/components/UpgradeModal"
import { isNative } from "@/lib/platform"
import { haptic, pickFileNative } from "@/lib/native"

const DEMOS = [
  {
    id: "event-permit",
    title: "Small Business Event Permit Packet",
    meta: "Government Permit · 8 steps · 6 docs · 3 deadlines",
    icon: ClipboardList,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    id: "school-enrollment",
    title: "School Enrollment Packet",
    meta: "School Enrollment · 7 steps · 6 docs · 2 deadlines",
    icon: GraduationCap,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    id: "grant-application",
    title: "Small Business Community Grant Application",
    meta: "Grant Application · 8 steps · 8 docs · 2 deadlines",
    icon: Banknote,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
  },
]

const TRUST_CHECK_DEMOS = [
  {
    id: "fake-utility-shutoff",
    title: "Fake Utility Shutoff Notice",
    meta: "Gift card demand · 48-hr threat · High scam risk",
    icon: AlertTriangle,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
  },
  {
    id: "fake-irs-collection",
    title: "Fake IRS Collection Letter",
    meta: "Arrest threat · Bitcoin demand · High scam risk",
    icon: XCircle,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
  },
  {
    id: "debt-collection-letter",
    title: "Debt Collection Notice",
    meta: "Missing details · Western Union · Suspicious",
    icon: Scale,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
  },
  {
    id: "legitimate-utility-notice",
    title: "Legitimate Utility Notice",
    meta: "Control document · Standard notice · Likely legitimate",
    icon: CheckCircle2,
    color: "text-green-500 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/50",
  },
  {
    id: "auto-loan-contract",
    title: "Auto Loan Contract",
    meta: "Metadata flags · High contract risk · Cannot verify",
    icon: FileText,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
  },
  {
    id: "advance-fee-fraud",
    title: "Inheritance Notification Letter",
    meta: "Advance fee fraud · Gmail sender · High scam risk",
    icon: AlertTriangle,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
  },
]

const FORMATS = [
  { ext: "PDF", icon: FileText, note: "Text-based" },
  { ext: "DOCX", icon: File, note: "Word files" },
  { ext: "TXT", icon: FileText, note: "Plain text" },
  { ext: "Paste", icon: Type, note: "Any format" },
]

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

const EXAMPLES = ["IRS notice", "Lease agreement", "Insurance EOB", "Permit application", "Court summons", "Grant instructions", "HOA violation", "Medicare letter"]

const DOC_TYPES = [
  { id: "Tax & Government Form",     label: "Tax & Government Form",    icon: Building2,    color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/60"    },
  { id: "Legal / Business Filing",   label: "Legal / Business Filing",  icon: Scale,        color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-950/60" },
  { id: "Healthcare / Insurance",    label: "Healthcare / Insurance",   icon: Heart,        color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/60"      },
  { id: "Contract / Agreement",      label: "Contract / Agreement",     icon: FileSignature, color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/60"  },
  { id: "Bill / Notice / Summons",   label: "Bill / Notice / Summons",  icon: Mail,         color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/60" },
  { id: "Application / Permit",      label: "Application / Permit",     icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/60" },
  { id: "School / Enrollment",       label: "School / Enrollment",      icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/60" },
  { id: "General / Unsure",          label: "General / Unsure",         icon: HelpCircle,   color: "text-slate-500",   bg: "bg-slate-50 dark:bg-slate-900/60"  },
]

type Step = "input" | "doctype" | "analyzing"
type Payload = { kind: "text"; text: string } | { kind: "file"; file: File }

const LOADER_STAGES = [
  { at: 0,  pct: 5,  label: "Preparing document",                  note: "Usually takes 10–30 seconds"     },
  { at: 4,  pct: 18, label: "Reading content",                      note: "Estimated ~25 seconds remaining" },
  { at: 9,  pct: 38, label: "Identifying sections",                  note: "Estimated ~18 seconds remaining" },
  { at: 15, pct: 57, label: "Generating plain-English analysis",     note: "Estimated ~12 seconds remaining" },
  { at: 22, pct: 76, label: "Building tasks, risks & deadlines",     note: "Estimated ~7 seconds remaining"  },
  { at: 29, pct: 88, label: "Finalizing results",                    note: "Almost there…"                  },
  { at: 36, pct: 92, label: "Wrapping up…",                          note: ""                               },
] as const

const HELPER_LINES = [
  "Extracting the parts that matter most",
  "Turning document language into clear actions",
  "Mapping risks, deadlines, and required documents",
  "Preparing structured guidance for review",
  "Identifying what you need to do first",
] as const

function AnalyzingLoader() {
  const [elapsed, setElapsed] = useState(0)
  const [helperIdx, setHelperIdx] = useState(0)

  // Elapsed counter — updates every 200ms, cleans up on unmount
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 200)
    return () => clearInterval(id)
  }, [])

  // Rotate helper line every 4 seconds
  useEffect(() => {
    const id = setInterval(() => setHelperIdx(i => (i + 1) % HELPER_LINES.length), 4000)
    return () => clearInterval(id)
  }, [])

  const stageIdx = LOADER_STAGES.reduce<number>(
    (acc, s, i) => (s.at <= elapsed ? i : acc),
    0
  )
  const stage = LOADER_STAGES[stageIdx]
  const progress = Math.min(stage.pct, 92)

  // Elapsed display: "5s" or "1m 12s"
  const elapsedDisplay = elapsed < 60
    ? `${Math.floor(elapsed)}s`
    : `${Math.floor(elapsed / 60)}m ${Math.floor(elapsed % 60)}s`

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 px-4">
      {/* Pulsing icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-primary/15 scale-125 animate-pulse" />
        <div className="relative w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      </div>

      {/* Active stage label — fades between stages */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stageIdx}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className="font-bold text-foreground text-sm leading-snug">{stage.label}</p>
          {stage.note && (
            <p className="text-xs text-muted-foreground/60 mt-1">{stage.note}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar — widened, with elapsed timer row below */}
      <div className="w-full max-w-xs space-y-2">
        <div className="h-2 bg-secondary/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {/* Elapsed + soft estimate row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/50 px-0.5">
          <span className="font-mono tabular-nums">{elapsedDisplay} elapsed</span>
          <span>Most finish under 30s</span>
        </div>
      </div>

      {/* Rotating reassurance line */}
      <AnimatePresence mode="wait">
        <motion.p
          key={helperIdx}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.4 }}
          className="text-xs text-primary/50 text-center font-medium leading-snug max-w-[14rem]"
        >
          {HELPER_LINES[helperIdx]}
        </motion.p>
      </AnimatePresence>

      {/* Stage dots */}
      <div className="flex items-center gap-1.5">
        {LOADER_STAGES.slice(0, 6).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i < stageIdx
                ? "w-2 h-2 bg-primary"
                : i === stageIdx
                ? "w-2.5 h-2.5 bg-primary/70"
                : "w-1.5 h-1.5 bg-secondary"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

const TRUST_CHECK_HINT = "Document Trust Check — analyze for scam indicators, suspicious demands, pressure tactics, suspicious contact details, verification risks, and authenticity concerns"

export default function Import() {
  const [, setLocation] = useLocation()
  const searchString = useSearch()
  const isTrustCheck = new URLSearchParams(searchString).get("mode") === "trust-check"
  const { setAnalysis, setDocumentTypeHint, setTrustCheckAnalysis } = useAnalysisContext()

  useEffect(() => {
    document.title = isTrustCheck
      ? "Document Trust Check — PlainPath"
      : "Import Your Document — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [isTrustCheck])

  const [mode, setMode] = useState<"paste" | "upload">("paste")
  const [text, setText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>("input")
  const [pending, setPending] = useState<Payload | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; used: number; limit: number }>({ open: false, used: 0, limit: 3 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mutate, isPending } = useAnalyzeDocument()

  const goToDocType = (payload: Payload) => {
    if (isTrustCheck) {
      void handleDocTypeSelect(TRUST_CHECK_HINT, payload)
    } else {
      setPending(payload)
      setStep("doctype")
    }
  }

  const handlePasteStage = () => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 30) return
    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length
    if (wordCount < 15) {
      void haptic("warning")
      setPasteError("Please paste more of the document so PlainPath can identify the requirements, deadlines, and obligations. A sentence or two isn't enough — paste a few paragraphs.")
      return
    }
    void haptic("medium")
    setPasteError(null)
    goToDocType({ kind: "text", text })
  }

  const validateFile = (file: File): string | null => {
    if (file.size === 0) return "This file appears to be empty. Please check the file and try again."
    if (file.size > 20 * 1024 * 1024) return "File is too large. Maximum allowed size is 20 MB."
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    const allowedExts = [".pdf", ".docx", ".txt"]
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      return "Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file."
    }
    return null
  }

  const stageFile = (file: File) => {
    const err = validateFile(file)
    if (err) { setUploadError(err); return }
    setUploadedFile(file)
    setUploadError(null)
    goToDocType({ kind: "file", file })
  }

  // Native-only: open the system file picker via Capacitor plugin
  const handleNativePick = async () => {
    try {
      await haptic("light")
      const picked = await pickFileNative()
      if (!picked) return // user cancelled
      stageFile(picked.file)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not open file picker. Please try again."
      setUploadError(msg)
    }
  }

  // Unified handler: native picker on device, HTML input on web
  const triggerFilePicker = () => {
    if (isNative()) {
      void handleNativePick()
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleDocTypeSelect = async (docTypeLabel: string, payloadOverride?: Payload) => {
    const p = payloadOverride ?? pending
    if (!p) return

    void haptic("medium")

    try {
      await beforeRunAnalysis()
    } catch (err) {
      if (err instanceof UsageLimitError) {
        setUpgradeModal({ open: true, used: err.used, limit: err.limit })
        setStep("input")
        return
      }
      const msg = err instanceof Error ? err.message : "Unable to start analysis."
      if (mode === "upload") {
        setUploadError(msg)
      } else {
        setPasteError(msg)
      }
      setStep("input")
      return
    }

    setDocumentTypeHint(docTypeLabel)
    setIsAnalyzing(true)
    setStep("analyzing")

    // ── Trust Check mode: route to dedicated endpoints ──────────────────────
    if (isTrustCheck) {
      if (p.kind === "text") {
        try {
          const apiBase = getApiBaseUrl()
          const res = await fetch(`${apiBase}/api/documents/trust-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: p.text }),
          })
          let data: any = {}
          try { data = await res.json() } catch { /* non-JSON */ }
          if (!res.ok) {
            const msg = data?.message || (res.status === 503
              ? "The analysis service is temporarily busy. Please wait a moment and try again."
              : res.status === 504
              ? "Analysis is taking too long. Please try again — shorter documents process faster."
              : "Trust check failed. Please try again.")
            setPasteError(msg)
            setIsAnalyzing(false)
            setStep("input")
            return
          }
          await haptic("success")
          incrementTrustCheck()
          setTrustCheckAnalysis(data.analysis)
          setLocation("/trust-check")
        } catch {
          setPasteError("Network error. Please check your connection and try again.")
          setIsAnalyzing(false)
          setStep("input")
        }
      } else {
        const formData = new FormData()
        formData.append("file", p.file)
        try {
          const apiBase = getApiBaseUrl()
          const res = await fetch(`${apiBase}/api/documents/trust-check-upload`, { method: "POST", body: formData })
          let data: any = {}
          try { data = await res.json() } catch { /* non-JSON */ }
          if (!res.ok) {
            const msg = data?.message || (res.status === 413
              ? "File is too large. Maximum allowed size is 20 MB."
              : res.status === 422
              ? "Could not extract text from this file. If it's a scanned PDF, please copy and paste the text instead."
              : res.status === 503
              ? "The analysis service is temporarily busy. Please wait a moment and try again."
              : res.status === 504
              ? "Analysis is taking too long. Please try again — shorter documents process faster."
              : "Upload failed. Please try again. If the problem continues, try pasting the document text instead.")
            setUploadError(msg)
            setUploadedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            setIsAnalyzing(false)
            setStep("input")
            setMode("upload")
            return
          }
          if (!data?.analysis) {
            setUploadError("Trust check returned an unexpected result. Please try again.")
            setUploadedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            setIsAnalyzing(false)
            setStep("input")
            setMode("upload")
            return
          }
          await haptic("success")
          incrementTrustCheck()
          setTrustCheckAnalysis(data.analysis)
          setLocation("/trust-check")
        } catch {
          setUploadError("Network error. Please check your connection and try again.")
          setUploadedFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
          setIsAnalyzing(false)
          setStep("input")
          setMode("upload")
        }
      }
      return
    }

    // ── Standard analyze mode ────────────────────────────────────────────────
    if (p.kind === "text") {
      mutate(
        { data: { text: p.text, documentTypeHint: docTypeLabel } as any },
        {
          onSuccess: (data) => { void haptic("success"); incrementAnalysis(); setAnalysis(data.analysis); setLocation("/analyze") },
          onError: (err: any) => {
            const serverMessage = err?.data?.message
            const status = err?.status ?? 0
            let friendly: string
            if (serverMessage) {
              friendly = serverMessage
            } else if (status === 503) {
              friendly = "The analysis service is temporarily busy. Please wait a moment and try again."
            } else if (status === 504) {
              friendly = "Analysis is taking too long. Please try again — shorter documents process faster."
            } else if (status === 0) {
              friendly = "Network error. Please check your connection and try again."
            } else {
              friendly = "Analysis failed. Please try again. If the problem continues, try pasting a shorter section of your document."
            }
            setPasteError(friendly)
            setIsAnalyzing(false)
            setStep("input")
          },
        }
      )
    } else {
      const formData = new FormData()
      formData.append("file", p.file)
      formData.append("documentTypeHint", docTypeLabel)
      try {
        const apiBase = getApiBaseUrl()
        const res = await fetch(`${apiBase}/api/documents/upload`, { method: "POST", body: formData })
        let data: any = {}
        try { data = await res.json() } catch { /* non-JSON response */ }

        if (!res.ok) {
          const msg = data?.message || (res.status === 413
            ? "File is too large. Maximum allowed size is 20 MB."
            : res.status === 422
            ? "Could not extract text from this file. If it's a scanned PDF, please copy and paste the text instead."
            : res.status === 503
            ? "The analysis service is temporarily busy. Please wait a moment and try again."
            : res.status === 504
            ? "Analysis is taking too long. Please try again — shorter documents process faster."
            : "Upload failed. Please try again. If the problem continues, try pasting the document text instead.")
          setUploadError(msg)
          setUploadedFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
          setIsAnalyzing(false)
          setStep("input")
          setMode("upload")
          return
        }
        if (!data?.analysis) {
          setUploadError("Analysis returned an unexpected result. Please try again.")
          setUploadedFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
          setIsAnalyzing(false)
          setStep("input")
          setMode("upload")
          return
        }
        await haptic("success")
        incrementAnalysis()
        setAnalysis(data.analysis)
        setLocation("/analyze")
      } catch {
        setUploadError("Network error. Please check your connection and try again.")
        setUploadedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        setIsAnalyzing(false)
        setStep("input")
        setMode("upload")
      }
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) stageFile(f)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) stageFile(f)
  }
  const isWorking = isPending || isAnalyzing
  const canAnalyze = !isWorking && text.trim().length >= 50

  return (
    <div className="min-h-screen bg-background pb-safe-bottom" style={{ paddingBottom: "max(7rem, env(safe-area-inset-bottom) + 7rem)" }}>
      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((u) => ({ ...u, open: false }))}
        reason="analyses"
        used={upgradeModal.used}
        limit={upgradeModal.limit}
      />
      <div className="absolute top-0 inset-x-0 h-52 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 pt-4 sm:pt-12 relative">

        {/* ── Header ─────────────────────────────────── */}
        <div className="text-center mb-5 sm:mb-10">
          {isTrustCheck && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20 text-xs font-semibold text-primary mb-3"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Trust &amp; Verification
            </motion.div>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-2"
          >
            {isTrustCheck ? "Document Trust Check" : "Import Your Document"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="text-muted-foreground text-sm sm:text-base"
          >
            {isTrustCheck
              ? "Upload or paste a document to scan for scam indicators, pressure tactics, suspicious contact details, and verification risks."
              : "PlainPath reads the content and returns a structured action plan — not a summary."}
          </motion.p>
        </div>

        {/* ── Format chips ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-5 sm:mb-8"
        >
          {FORMATS.map((f) => (
            <div key={f.ext} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-card border border-border/50 shadow-sm">
              <f.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">{f.ext}</span>
              <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{f.note}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Main card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <Card className="overflow-hidden bg-card shadow-xl shadow-black/[0.07] dark:shadow-black/30 rounded-2xl border-border/40">

            {/* ── DOCTYPE step ─────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === "doctype" || step === "analyzing" ? (
                <motion.div
                  key="doctype"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* doctype header */}
                  <div className="p-4 sm:p-6 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      {step === "doctype" && (
                        <button
                          onClick={() => {
                            setStep("input")
                            setPending(null)
                            setUploadedFile(null)
                            setUploadError(null)
                            setPasteError(null)
                            if (fileInputRef.current) fileInputRef.current.value = ""
                          }}
                          style={{ touchAction: "manipulation" }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary active:bg-secondary transition-colors shrink-0"
                        >
                          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                          {step === "analyzing" ? "Analyzing…" : "Step 2 of 2"}
                        </p>
                        <h2 className="text-base font-bold text-foreground leading-tight">
                          {step === "analyzing" ? "Generating your action plan" : "What type of document is this?"}
                        </h2>
                      </div>
                    </div>
                    {step === "doctype" && (
                      <p className="text-xs text-muted-foreground mt-2 ml-0 sm:ml-12">
                        This helps PlainPath apply the right analysis — your choice doesn't limit what's extracted.
                      </p>
                    )}
                  </div>

                  {/* doctype grid or loading */}
                  <div className="p-4 sm:p-6">
                    {step === "analyzing" ? (
                      <AnalyzingLoader />
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        {DOC_TYPES.map((dt) => (
                          <button
                            key={dt.id}
                            onClick={() => handleDocTypeSelect(dt.id)}
                            style={{ touchAction: "manipulation" }}
                            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border/40 bg-card hover:border-primary/50 hover:bg-secondary/30 active:bg-secondary/50 transition-all text-left group min-h-[64px]"
                          >
                            <div className={`w-8 h-8 rounded-lg ${dt.bg} flex items-center justify-center shrink-0`}>
                              <dt.icon className={`w-4 h-4 ${dt.color}`} />
                            </div>
                            <span className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                              {dt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* ── INPUT step ──────────────────────────── */
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Tab switcher */}
                  <div className="p-2 border-b border-border/30 bg-muted/30">
                    <div className="grid grid-cols-2 rounded-xl bg-secondary/70 p-1 gap-1">
                      {(["paste", "upload"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => { setMode(tab); setUploadError(null); setUploadedFile(null); setPasteError(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                          style={{ touchAction: "manipulation" }}
                          className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all min-h-[48px] ${
                            mode === tab
                              ? "bg-card text-foreground shadow-sm shadow-black/[0.06]"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab === "paste" ? <Type className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                          {tab === "paste" ? "Paste Text" : "Upload File"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 sm:p-7">
                    <AnimatePresence mode="wait">

                      {/* ── PASTE mode ─────────────────────── */}
                      {mode === "paste" && (
                        <motion.div
                          key="paste"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.14 }}
                          className="space-y-4"
                        >
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-xs text-muted-foreground/50 font-medium mr-0.5">e.g.</span>
                            {EXAMPLES.map(ex => (
                              <span key={ex} className="px-2.5 py-1 rounded-full bg-secondary/60 border border-border/40 text-[11px] font-medium text-muted-foreground">{ex}</span>
                            ))}
                          </div>

                          <div className="relative">
                            <textarea
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              placeholder="Paste the full text of your document here..."
                              className="w-full min-h-[140px] sm:min-h-[220px] p-4 rounded-xl border-2 border-border/50 bg-muted/20 focus:border-primary focus:ring-4 focus:ring-primary/8 resize-none transition-all placeholder:text-muted-foreground/35 text-sm leading-relaxed font-mono outline-none"
                              disabled={isWorking}
                            />
                            {text.length > 0 && (
                              <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/40 font-mono select-none">
                                {text.length.toLocaleString()} / 60,000
                              </span>
                            )}
                          </div>

                          {pasteError && (
                            <ErrorBanner message={pasteError} />
                          )}

                          <Button
                            size="lg"
                            onClick={handlePasteStage}
                            disabled={isWorking || text.trim().length < 30}
                            style={{ touchAction: "manipulation" }}
                            className="w-full h-14 text-base rounded-xl"
                          >
                            {isTrustCheck ? "Check Document" : "Generate Action Plan"} <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>

                          <p className="text-[11px] text-center text-muted-foreground/50">
                            For best results, paste the full document text · Your text is processed by AI and not stored by PlainPath
                          </p>
                        </motion.div>
                      )}

                      {/* ── UPLOAD mode ────────────────────── */}
                      {mode === "upload" && (
                        <motion.div
                          key="upload"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.14 }}
                          className="space-y-4"
                        >
                          {/* Mobile: prominent tap-to-upload button above the drop zone */}
                          <button
                            className="sm:hidden w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-primary/50 bg-primary/5 text-primary font-bold text-base active:bg-primary/10 transition-colors"
                            style={{ touchAction: "manipulation", minHeight: "56px" }}
                            onClick={triggerFilePicker}
                          >
                            <UploadCloud className="w-5 h-5" />
                            Choose a file from your device
                          </button>

                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={triggerFilePicker}
                            style={{ touchAction: "manipulation" }}
                            className={`min-h-[180px] sm:min-h-[220px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                              isDragging
                                ? "border-primary bg-primary/5 scale-[1.01]"
                                : uploadedFile && !uploadError
                                ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30"
                                : "border-border/50 hover:border-primary/40 hover:bg-secondary/20 bg-muted/20"
                            }`}
                          >
                            <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onFileChange} />

                            {uploadedFile && !uploadError ? (
                              <div className="text-center space-y-3 p-6 sm:p-8">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto" />
                                <div>
                                  <p className="font-bold text-foreground text-sm">File ready</p>
                                  <p className="text-xs text-muted-foreground mt-1">{uploadedFile.name}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-3 p-6 sm:p-8 pointer-events-none">
                                <div className="w-14 h-14 rounded-2xl bg-card border border-border shadow-md flex items-center justify-center mx-auto">
                                  <UploadCloud className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground hidden sm:block">Drop file here or click to browse</p>
                                  <p className="font-bold text-foreground sm:hidden text-sm">Or drag & drop a file here</p>
                                  <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text (.txt)</p>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  {["PDF", "DOCX", "TXT"].map(fmt => (
                                    <span key={fmt} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-bold text-muted-foreground shadow-sm">{fmt}</span>
                                  ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground/50">Max 20 MB · Text-based PDFs only</p>
                              </div>
                            )}
                          </div>

                          {uploadError && <ErrorBanner message={uploadError} />}

                          {uploadedFile && !uploadError && (
                            <Button
                              size="lg"
                              onClick={() => goToDocType({ kind: "file", file: uploadedFile })}
                              style={{ touchAction: "manipulation" }}
                              className="w-full h-14 text-base rounded-xl"
                            >
                              Continue <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          )}

                          {!uploadError && (
                            <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 p-3.5 flex gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                              <div className="text-xs text-amber-800/80 dark:text-amber-300/90 leading-relaxed">
                                <span className="font-semibold">Scanned or image PDFs</span> cannot be read — the text must be selectable in your PDF viewer. Use Paste Text instead for scanned documents.
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </Card>
        </motion.div>

        {/* ── Demo shortcuts ─────────────────────────── */}
        {step === "input" && (
          <div className="mt-6 sm:mt-10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/50" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Or try a built-in demo</p>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {isTrustCheck ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {TRUST_CHECK_DEMOS.map((demo, i) => (
                  <motion.button
                    key={demo.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 + 0.2 }}
                    whileHover={{ y: -3 }}
                    onClick={() => setLocation(`/trust-check?demo=${demo.id}`)}
                    style={{ touchAction: "manipulation" }}
                    className="text-left group"
                  >
                    <Card className="p-3.5 sm:p-4 h-full border-border/40 hover:border-primary/40 active:border-primary/40 hover:shadow-lg transition-all bg-card rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${demo.bg} flex items-center justify-center shrink-0`}>
                          <demo.icon className={`w-4 h-4 ${demo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm leading-snug group-hover:text-primary transition-colors mb-0.5">{demo.title}</p>
                          <p className="text-[11px] text-muted-foreground">{demo.meta}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      </div>
                    </Card>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {DEMOS.map((demo, i) => (
                  <motion.button
                    key={demo.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 + 0.2 }}
                    whileHover={{ y: -3 }}
                    onClick={() => setLocation(`/analyze?demo=${demo.id}`)}
                    style={{ touchAction: "manipulation" }}
                    className="text-left group"
                  >
                    <Card className="p-3.5 sm:p-4 h-full border-border/40 hover:border-primary/40 active:border-primary/40 hover:shadow-lg transition-all bg-card rounded-xl shadow-sm">
                      <div className="flex sm:block items-center gap-3 sm:gap-0">
                        <div className={`w-9 h-9 rounded-xl ${demo.bg} flex items-center justify-center sm:mb-3 shrink-0`}>
                          <demo.icon className={`w-4 h-4 ${demo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 sm:block">
                          <p className="font-bold text-sm leading-snug group-hover:text-primary transition-colors mb-0.5 sm:mb-1">{demo.title}</p>
                          <p className="text-[11px] text-muted-foreground">{demo.meta}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 sm:hidden shrink-0" />
                      </div>
                      <div className="hidden sm:flex items-center gap-1 mt-2.5 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open instantly <ArrowRight className="w-3 h-3" />
                      </div>
                    </Card>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Sticky mobile CTA (paste mode, input step) ── */}
      <AnimatePresence>
        {mode === "paste" && step === "input" && canAnalyze && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            className="sm:hidden fixed bottom-0 inset-x-0 z-30 p-4 bg-background/95 backdrop-blur-xl border-t border-border/40"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button
              size="lg"
              onClick={handlePasteStage}
              disabled={isWorking}
              style={{ touchAction: "manipulation" }}
              className="w-full h-14 text-base rounded-xl shadow-lg"
            >
              {isTrustCheck ? "Check Document" : "Generate Action Plan"} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-destructive/8 border border-destructive/15 flex items-start gap-2.5 text-destructive">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
