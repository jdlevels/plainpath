import { useState, useRef, useEffect } from "react"
import { useLocation, useSearch } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadCloud, ArrowRight, Loader2, AlertCircle,
  ClipboardList, GraduationCap, Banknote, CheckCircle2, FileText, Type, File,
  ArrowLeft, Building2, Scale, Heart, FileSignature,
  Mail, HelpCircle, ShieldCheck, AlertTriangle, XCircle,
  Camera, X as XIcon, Plus, ScanLine, RotateCcw, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { useAnalyzeDocument } from "@workspace/api-client-react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { getApiBaseUrl } from "@/lib/api"
import { beforeRunAnalysis, beforeRunTrustCheck, UsageLimitError } from "@/lib/analysisGate"
import { incrementAnalysis, incrementTrustCheck, getUsage } from "@/lib/usageMeter"
import { useEntitlements } from "@/hooks/useEntitlements"
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

const WHAT_YOU_GET = [
  { label: "Plain-English summary",              icon: FileText,     color: "text-blue-500"    },
  { label: "Key obligations & deadlines",        icon: Clock,        color: "text-blue-500"    },
  { label: "Missing info or required documents", icon: ClipboardList,color: "text-amber-500"   },
  { label: "Risks and confusing language",       icon: AlertTriangle,color: "text-red-500"     },
  { label: "Clear next-step guidance",           icon: CheckCircle2, color: "text-emerald-500" },
]

const TRUST_CHECK_FEATURES = [
  { label: "Scam indicators identified",  icon: ShieldCheck,   color: "text-red-500"     },
  { label: "Pressure tactics flagged",    icon: AlertTriangle, color: "text-amber-500"   },
  { label: "Contact details verified",    icon: CheckCircle2,  color: "text-emerald-500" },
  { label: "Risk level assessment",       icon: Scale,         color: "text-blue-500"    },
]

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
      : "Analyze a Document — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [isTrustCheck])

  // Check if we're returning from the redaction flow with a pre-redacted text
  useEffect(() => {
    try {
      const redactedText = sessionStorage.getItem("pii_analyze_text")
      if (redactedText) {
        sessionStorage.removeItem("pii_analyze_text")
        setText(redactedText)
        setRedactedNotice(true)
      }
    } catch {
      // sessionStorage unavailable — ignore
    }
  }, [])

  const [mode, setMode] = useState<"paste" | "upload" | "camera">("paste")
  const [text, setText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>("input")
  const [pending, setPending] = useState<Payload | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: "analyses" | "trustCheck" | "contractDraft"; used: number; limit: number }>({ open: false, reason: "analyses", used: 0, limit: 2 })
  const [showNudge, setShowNudge] = useState(() => {
    try { return !localStorage.getItem("plainpath-visited") } catch { return false }
  })
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [redactedNotice, setRedactedNotice] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const { mutate, isPending } = useAnalyzeDocument()
  const { entitlements } = useEntitlements()

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

  // Camera: convert the chosen image file to a base64 data URL and add to capturedImages
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setCameraError("Only image files are supported for scanning.")
      e.target.value = ""
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setCameraError("Photo is too large. Please try a lower-resolution photo.")
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCapturedImages(prev => [...prev, reader.result as string])
      setCameraError(null)
    }
    reader.onerror = () => setCameraError("Could not read the photo. Please try again.")
    reader.readAsDataURL(file)
    e.target.value = "" // reset so the same image can be retaken
  }

  const triggerCamera = () => cameraInputRef.current?.click()

  // Send all captured images to the API, extract text, then run through analysis
  const handleScanImages = async (docTypeLabel: string, imagesToScan?: string[]) => {
    const imgs = imagesToScan ?? capturedImages
    if (imgs.length === 0) return

    void haptic("medium")

    try {
      if (isTrustCheck) {
        beforeRunTrustCheck(entitlements?.plan ?? null)
      } else {
        await beforeRunAnalysis()
      }
    } catch (err) {
      if (err instanceof UsageLimitError) {
        setUpgradeModal({ open: true, reason: err.reason, used: err.used, limit: err.limit })
        setStep("input")
        return
      }
      setCameraError(err instanceof Error ? err.message : "Unable to start analysis.")
      setStep("input")
      return
    }

    setDocumentTypeHint(docTypeLabel)
    setIsAnalyzing(true)
    setStep("analyzing")

    try {
      const apiBase = getApiBaseUrl()
      const endpoint = isTrustCheck ? "/api/documents/scan-images-trust" : "/api/documents/scan-images"
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: imgs, documentTypeHint: docTypeLabel }),
      })
      let data: any = {}
      try { data = await res.json() } catch { /* non-JSON */ }

      if (!res.ok) {
        const msg = data?.message || (
          res.status === 422 ? "Could not extract text from the photo(s). Please retake with a clearer, well-lit photo taken straight-on." :
          res.status === 503 ? "The analysis service is temporarily busy. Please wait a moment and try again." :
          res.status === 504 ? "Analysis is taking too long. Please try again with fewer pages." :
          res.status === 413 ? "A photo is too large. Please try a lower-resolution image." :
          "Scan failed. Please try again with a clearer photo."
        )
        setCameraError(msg)
        setIsAnalyzing(false)
        setStep("input")
        setMode("camera")
        return
      }

      if (!data?.analysis) {
        setCameraError("Scan returned an unexpected result. Please try again.")
        setIsAnalyzing(false)
        setStep("input")
        setMode("camera")
        return
      }

      await haptic("success")
      if (isTrustCheck) {
        incrementTrustCheck()
        setTrustCheckAnalysis(data.analysis)
        setLocation("/trust-check")
      } else {
        incrementAnalysis()
        setAnalysis(data.analysis)
        setLocation("/results")
      }
    } catch {
      setCameraError("Network error. Please check your connection and try again.")
      setIsAnalyzing(false)
      setStep("input")
      setMode("camera")
    }
  }

  // When camera mode is picked from the doctype step, route to scan handler
  const goToDocTypeCamera = () => {
    if (capturedImages.length === 0) return
    if (isTrustCheck) {
      void handleScanImages(TRUST_CHECK_HINT, capturedImages)
    } else {
      setPending(null) // camera flow doesn't use Payload
      setStep("doctype")
      setCameraError(null)
    }
  }

  const handleDocTypeSelect = async (docTypeLabel: string, payloadOverride?: Payload) => {
    const p = payloadOverride ?? pending

    // Camera mode: no Payload — route to image scan handler instead
    if (!p) {
      if (capturedImages.length > 0) {
        void handleScanImages(docTypeLabel, capturedImages)
      }
      return
    }

    void haptic("medium")

    try {
      if (isTrustCheck) {
        beforeRunTrustCheck(entitlements?.plan ?? null)
      } else {
        await beforeRunAnalysis()
      }
    } catch (err) {
      if (err instanceof UsageLimitError) {
        setUpgradeModal({ open: true, reason: err.reason, used: err.used, limit: err.limit })
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
          onSuccess: (data) => { void haptic("success"); incrementAnalysis(); setAnalysis(data.analysis); setLocation("/results") },
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
        setLocation("/results")
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
      {/* Hidden camera input — always mounted so cameraInputRef is available */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((u) => ({ ...u, open: false }))}
        reason={upgradeModal.reason}
        used={upgradeModal.used}
        limit={upgradeModal.limit}
      />
      <div className="absolute top-0 inset-x-0 h-52 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 pt-4 sm:pt-12 relative">

        {/* ── Header ─────────────────────────────────── */}
        {isTrustCheck ? (
          <div className="text-center mb-6 sm:mb-10 space-y-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/40 mb-1"
            >
              <ShieldCheck className="w-7 h-7 text-red-600 dark:text-red-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-display font-bold tracking-tight"
            >
              Document Trust Check
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
            >
              Upload or paste a document to scan for scam indicators, pressure tactics, suspicious contact details, and verification risks.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap pt-1"
            >
              {TRUST_CHECK_FEATURES.map(({ label, icon: Icon, color }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />{label}
                </span>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="text-center mb-6 sm:mb-8 space-y-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mb-1"
            >
              <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-display font-bold tracking-tight"
            >
              Analyze a Document
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
            >
              Upload, paste, or scan a document to get a plain-English action plan. PlainPath highlights key obligations, deadlines, red flags, and what to do next.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap pt-1"
            >
              {WHAT_YOU_GET.map(({ label, icon: Icon, color }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />{label}
                </span>
              ))}
            </motion.div>
          </div>
        )}

        {/* ── First-run nudge ────────────────────────── */}
        <AnimatePresence>
          {showNudge && step === "input" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/6 border border-primary/20 text-sm">
                <span className="text-base">👋</span>
                <span className="flex-1 text-foreground/80">
                  <span className="font-semibold text-foreground">New here?</span> Try a sample document below — no upload needed.
                </span>
                <button
                  onClick={() => {
                    setShowNudge(false)
                    try { localStorage.setItem("plainpath-visited", "1") } catch {}
                  }}
                  style={{ touchAction: "manipulation" }}
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0 p-0.5"
                  aria-label="Dismiss"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Usage indicator (free plan) ─────────────── */}
        {(() => {
          const plan = entitlements?.plan ?? null
          const isFree = !plan || plan === "free"
          const used = getUsage().analyses
          if (!isFree || isTrustCheck || used === 0 || step !== "input") return null
          const remaining = Math.max(0, 2 - used)
          return (
            <div className="flex justify-center mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{
                  background: remaining === 0 ? "rgba(239,68,68,0.07)" : "rgba(245,158,11,0.07)",
                  borderColor: remaining === 0 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                  color: remaining === 0 ? "#dc2626" : "#92400e",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: remaining === 0 ? "#dc2626" : "#f59e0b" }}
                />
                {remaining === 0
                  ? "Free limit reached — Starter ($4.99/mo) unlocks unlimited analyses"
                  : `${used} of 2 free ${used === 1 ? "analysis" : "analyses"} used this month`}
              </span>
            </div>
          )
        })()}

        {/* ── Main card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <WorkspaceShell>

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
                    <div className="grid grid-cols-3 rounded-xl bg-secondary/70 p-1 gap-1">
                      {(["paste", "upload"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => { setMode(tab); setUploadError(null); setUploadedFile(null); setPasteError(null); setCameraError(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                          style={{ touchAction: "manipulation" }}
                          className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-lg transition-all min-h-[56px] ${
                            mode === tab
                              ? "bg-card text-foreground shadow-sm shadow-black/[0.06]"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-sm font-semibold">
                            {tab === "paste" ? <Type className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                            <span>{tab === "paste" ? "Paste Text" : "Upload File"}</span>
                          </div>
                          <span className="text-[10px] font-normal opacity-55">
                            {tab === "paste" ? "Copy & paste" : "PDF, DOCX, TXT"}
                          </span>
                        </button>
                      ))}
                      {/* Camera / Scan tab */}
                      <button
                        onClick={() => { setMode("camera"); setUploadError(null); setUploadedFile(null); setPasteError(null); setCameraError(null); }}
                        style={{ touchAction: "manipulation" }}
                        className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-lg transition-all min-h-[56px] ${
                          mode === "camera"
                            ? "bg-card text-foreground shadow-sm shadow-black/[0.06]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          <Camera className="w-4 h-4" />
                          <span>Scan Photo</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-55">Camera or image</span>
                      </button>
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
                          {redactedNotice && (
                            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 px-3.5 py-3 flex items-center gap-2.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Using redacted document</p>
                                <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/60 mt-0.5">Sensitive information has been removed. Ready to analyze.</p>
                              </div>
                              <button
                                onClick={() => { setRedactedNotice(false); setText("") }}
                                className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600/50"
                              >
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="text-[11px] font-medium text-muted-foreground/55">Works with any document — common examples:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {EXAMPLES.map(ex => (
                                <span key={ex} className="px-2.5 py-1 rounded-full bg-secondary/70 border border-border/40 text-[11px] font-semibold text-muted-foreground/80">{ex}</span>
                              ))}
                            </div>
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
                            variant={isTrustCheck ? "destructive" : "default"}
                            onClick={handlePasteStage}
                            disabled={isWorking || text.trim().length < 30}
                            style={{ touchAction: "manipulation" }}
                            className="w-full h-14 text-base rounded-xl"
                          >
                            {isTrustCheck ? "Check Document" : "Generate Action Plan"} <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>

                          {text.trim().length >= 30 && (
                            <button
                              type="button"
                              style={{ touchAction: "manipulation" }}
                              onClick={() => {
                                try {
                                  sessionStorage.setItem(
                                    "pii_redact_input",
                                    JSON.stringify({ text, source: isTrustCheck ? "trust-check" : "analyze" })
                                  )
                                } catch { /* sessionStorage unavailable */ }
                                setLocation("/redact")
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-300/50 dark:border-amber-700/40 hover:border-amber-400/70 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm font-medium transition-all"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Redact sensitive info first
                            </button>
                          )}

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

                          {/* ── Dropbox import ── */}
                          <div className="flex items-center gap-3 my-1">
                            <div className="flex-1 h-px bg-border/40" />
                            <span className="text-xs text-muted-foreground/60 font-medium">or</span>
                            <div className="flex-1 h-px bg-border/40" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const options = {
                                success: async (files: { link: string; name: string; bytes: number }[]) => {
                                  const file = files[0]
                                  if (!file) return
                                  try {
                                    const res = await fetch(file.link.replace("dl=0", "dl=1"))
                                    const blob = await res.blob()
                                    const f = new File([blob], file.name, { type: blob.type })
                                    onFileChange({ target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>)
                                  } catch {
                                    // ignore
                                  }
                                },
                                linkType: "direct",
                                multiselect: false,
                                extensions: [".pdf", ".docx", ".txt"],
                              }
                              if ((window as any).Dropbox) {
                                (window as any).Dropbox.choose(options)
                              } else {
                                const script = document.createElement("script")
                                script.src = "https://www.dropbox.com/static/api/2/dropins.js"
                                script.setAttribute("data-app-key", "placeholder")
                                script.onload = () => (window as any).Dropbox.choose(options)
                                document.body.appendChild(script)
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border/60 bg-card hover:bg-secondary/50 transition-colors text-sm font-medium text-muted-foreground"
                          >
                            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 3L0 8.5L8 14L16 8.5L8 3Z" fill="#0061FF"/>
                              <path d="M24 3L16 8.5L24 14L32 8.5L24 3Z" fill="#0061FF"/>
                              <path d="M0 19.5L8 25L16 19.5L8 14L0 19.5Z" fill="#0061FF"/>
                              <path d="M32 19.5L24 25L16 19.5L24 14L32 19.5Z" fill="#0061FF"/>
                              <path d="M16 21.5L8 27L0 21.5V27L8 32L16 27V21.5Z" fill="#0061FF"/>
                            </svg>
                            Import from Dropbox
                          </button>

                          {uploadError && <ErrorBanner message={uploadError} />}

                          {uploadedFile && !uploadError && (
                            <div className="space-y-2">
                              <Button
                                size="lg"
                                onClick={() => goToDocType({ kind: "file", file: uploadedFile })}
                                style={{ touchAction: "manipulation" }}
                                className="w-full h-14 text-base rounded-xl"
                              >
                                Continue <ArrowRight className="ml-2 w-4 h-4" />
                              </Button>
                              <button
                                type="button"
                                style={{ touchAction: "manipulation" }}
                                onClick={() => {
                                  try {
                                    sessionStorage.setItem(
                                      "pii_redact_file_name",
                                      uploadedFile.name
                                    )
                                  } catch { /* sessionStorage unavailable */ }
                                  setLocation("/redact")
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/40 hover:border-border/60 bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground text-sm transition-all"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-primary/50" />
                                Redact sensitive info first
                              </button>
                            </div>
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

                      {/* ── CAMERA / SCAN mode ─────────────── */}
                      {mode === "camera" && (
                        <motion.div
                          key="camera"
                          initial={{ opacity: 0, x: 14 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -14 }}
                          transition={{ duration: 0.14 }}
                          className="space-y-4"
                        >
                          {/* Instruction tip */}
                          <div className="rounded-xl bg-primary/5 border border-primary/15 p-3.5 flex gap-2.5 items-start">
                            <ScanLine className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-foreground/70 leading-relaxed">
                              Take one photo per page. Hold your phone flat above the document for the sharpest scan. Tap <strong>Add Another Page</strong> for multi-page documents.
                            </p>
                          </div>

                          {/* Thumbnail strip — shows captured pages */}
                          {capturedImages.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                {capturedImages.length} page{capturedImages.length !== 1 ? "s" : ""} captured
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {capturedImages.map((src, idx) => (
                                  <div key={idx} className="relative group">
                                    <img
                                      src={src}
                                      alt={`Page ${idx + 1}`}
                                      className="w-16 h-20 object-cover rounded-lg border-2 border-border/50 shadow-sm"
                                    />
                                    <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow">
                                      {idx + 1}
                                    </div>
                                    <button
                                      onClick={() => setCapturedImages(prev => prev.filter((_, i) => i !== idx))}
                                      style={{ touchAction: "manipulation" }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity shadow"
                                      aria-label={`Remove page ${idx + 1}`}
                                    >
                                      <XIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Primary CTA: take first photo or add another */}
                          <button
                            onClick={triggerCamera}
                            disabled={isWorking}
                            style={{ touchAction: "manipulation" }}
                            className="w-full flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary font-bold text-base active:bg-primary/10 transition-colors disabled:opacity-50"
                          >
                            {capturedImages.length === 0 ? (
                              <>
                                <Camera className="w-6 h-6" />
                                Take a Photo
                              </>
                            ) : (
                              <>
                                <Plus className="w-5 h-5" />
                                Add Another Page
                              </>
                            )}
                          </button>

                          {/* Start over */}
                          {capturedImages.length > 0 && (
                            <button
                              onClick={() => { setCapturedImages([]); setCameraError(null) }}
                              style={{ touchAction: "manipulation" }}
                              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Start over
                            </button>
                          )}

                          {cameraError && <ErrorBanner message={cameraError} />}

                          {/* Analyze button — only enabled when images are captured */}
                          {capturedImages.length > 0 && (
                            <Button
                              size="lg"
                              variant={isTrustCheck ? "destructive" : "default"}
                              onClick={goToDocTypeCamera}
                              disabled={isWorking}
                              style={{ touchAction: "manipulation" }}
                              className="w-full h-14 text-base rounded-xl"
                            >
                              {isTrustCheck ? "Check Document" : "Analyze"} {capturedImages.length} Page{capturedImages.length !== 1 ? "s" : ""}
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          )}

                          <p className="text-[11px] text-center text-muted-foreground/50">
                            Up to 10 pages · Photos are processed by AI and not stored by PlainPath
                          </p>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>

                  {/* ── Try a sample ── inside shell ── */}
                  <div className="px-4 sm:px-7 pb-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border/40" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Try a sample {isTrustCheck ? "document" : "document"}
                      </p>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>
                    {isTrustCheck ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {TRUST_CHECK_DEMOS.map((demo) => (
                          <button
                            key={demo.id}
                            onClick={() => setLocation(`/trust-check?demo=${demo.id}`)}
                            style={{ touchAction: "manipulation" }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 hover:border-red-400/50 hover:bg-red-50/40 dark:hover:bg-red-950/10 transition-all text-left group"
                          >
                            <div className={`w-8 h-8 rounded-lg ${demo.bg} flex items-center justify-center shrink-0`}>
                              <demo.icon className={`w-4 h-4 ${demo.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-tight group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">{demo.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{demo.meta}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {DEMOS.map((demo) => (
                          <button
                            key={demo.id}
                            onClick={() => setLocation(`/results?demo=${demo.id}`)}
                            style={{ touchAction: "manipulation" }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 hover:border-blue-400/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition-all text-left group"
                          >
                            <div className={`w-8 h-8 rounded-lg ${demo.bg} flex items-center justify-center shrink-0`}>
                              <demo.icon className={`w-4 h-4 ${demo.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{demo.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{demo.meta}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </WorkspaceShell>
        </motion.div>



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
              variant={isTrustCheck ? "destructive" : "default"}
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
