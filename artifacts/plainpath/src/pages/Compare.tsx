import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  GitCompare, Loader2, AlertCircle, ArrowRight, Check, X, AlertTriangle, Info,
  UploadCloud, Type, CheckCircle2, FileText, Plus, Minus, TrendingUp,
  CalendarClock, ClipboardCheck, RotateCcw, Camera, Link as LinkIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"
import { Badge } from "@/components/ui/badge"
import { getApiBaseUrl } from "@/lib/api"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { saveRecentWork } from "@/lib/recentWork"
import { useEntitlements } from "@/hooks/useEntitlements"
import UpgradeModal from "@/components/UpgradeModal"
import { BILLING_CONFIG } from "@/lib/billingConfig"

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ChangeItem {
  type: "added" | "removed" | "modified" | "risk-increased" | "risk-decreased"
  clause: string
  original: string | null
  revised: string | null
  significance: "high" | "medium" | "low"
  explanation: string
}

interface CompareResult {
  summary: string
  overallRiskChange: "increased" | "decreased" | "unchanged"
  changesCount: number
  highSignificanceCount: number
  changes: ChangeItem[]
  recommendation: string
  analyzedAt: string
}

/* ─── Config ─────────────────────────────────────────────────────────────── */

const CHANGE_CONFIG: Record<ChangeItem["type"], {
  label: string; color: string; icon: React.ElementType; bg: string; border: string
}> = {
  added:          { label: "Added",    color: "text-blue-600 dark:text-blue-400",    icon: Check,         bg: "bg-blue-50 dark:bg-blue-950/20",    border: "border-blue-200/60 dark:border-blue-900/40"    },
  removed:        { label: "Removed",  color: "text-red-600 dark:text-red-400",      icon: X,             bg: "bg-red-50 dark:bg-red-950/20",      border: "border-red-200/60 dark:border-red-900/40"      },
  modified:       { label: "Modified", color: "text-amber-600 dark:text-amber-400",  icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/20",  border: "border-amber-200/60 dark:border-amber-900/40"  },
  "risk-increased": { label: "Risk ↑", color: "text-red-600 dark:text-red-400",      icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-950/20",      border: "border-red-200/60 dark:border-red-900/40"      },
  "risk-decreased": { label: "Risk ↓", color: "text-emerald-600 dark:text-emerald-400", icon: Check,     bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200/60 dark:border-emerald-900/40" },
}

const SIG_COLORS = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  low:    "bg-muted text-muted-foreground",
}

const OUTPUT_ITEMS = [
  { icon: Plus,          label: "Added clauses",                   color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-100 dark:border-blue-900/40"    },
  { icon: Minus,         label: "Removed clauses",                 color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/30",      border: "border-red-100 dark:border-red-900/40"      },
  { icon: TrendingUp,    label: "Risk-level changes",              color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",  border: "border-amber-100 dark:border-amber-900/40"  },
  { icon: FileText,      label: "Wording & obligation changes",    color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/30",border: "border-violet-100 dark:border-violet-900/40"},
  { icon: CalendarClock, label: "Payment & deadline impacts",      color: "text-primary",     bg: "bg-primary/5",                      border: "border-primary/15"                          },
  { icon: ClipboardCheck,label: "What to review before signing",  color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30",border: "border-emerald-100 dark:border-emerald-900/40"},
]

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

/* ─── ChangeCard ─────────────────────────────────────────────────────────── */

function ChangeCard({ change }: { change: ChangeItem }) {
  const [open, setOpen] = useState(change.significance === "high")
  const cfg = CHANGE_CONFIG[change.type]
  const Icon = cfg.icon
  return (
    <Card className={`border ${cfg.border} transition-all`}>
      <CardContent className="p-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
          <span className="flex-1 text-sm font-medium leading-snug">{change.clause}</span>
          <Badge className={`text-[10px] border-0 ${SIG_COLORS[change.significance]}`}>{change.significance}</Badge>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                <p className="text-sm text-foreground/85 leading-relaxed">{change.explanation}</p>
                {(change.original || change.revised) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {change.original && (
                      <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200/40 rounded-lg p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1.5">Original</p>
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">{change.original}</p>
                      </div>
                    )}
                    {change.revised && (
                      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/40 rounded-lg p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1.5">Revised</p>
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">{change.revised}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

/* ─── DocumentInput ──────────────────────────────────────────────────────── */

interface DocumentInputProps {
  label: string
  helperText: string
  value: string
  onChange: (text: string) => void
  side: "original" | "revised"
}

function DocumentInput({ label, helperText, value, onChange, side }: DocumentInputProps) {
  const [tab, setTab] = useState<"paste" | "upload" | "scan" | "url">("paste")
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [scanFile, setScanFile] = useState<File | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const isOriginal = side === "original"
  const accentBadge = isOriginal
    ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40"
    : "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
  const dragBorder = isOriginal
    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/10"
    : "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10"
  const successBorder = isOriginal
    ? "border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20"
    : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20"
  const successIcon = isOriginal ? "text-blue-500" : "text-emerald-500"

  async function extractFromFile(file: File) {
    setFileError(null)
    setFileName(file.name)

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        if (!text.trim()) {
          setFileError("This file appears to be empty.")
          setFileName(null)
        } else {
          onChange(text)
        }
      }
      reader.onerror = () => {
        setFileError("Could not read this file. Please paste the text instead.")
        setFileName(null)
      }
      reader.readAsText(file)
      return
    }

    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/extract-text`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setFileError(data.message ?? "Could not read this file. Please paste the text instead.")
        setFileName(null)
      } else {
        onChange(data.text)
      }
    } catch {
      setFileError("Upload failed. Check your connection and try again.")
      setFileName(null)
    } finally {
      setExtracting(false)
    }
  }

  async function handleScanExtract() {
    if (!scanFile) return
    setScanError(null)
    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append("file", scanFile)
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/extract-text`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setScanError(data.message ?? "Could not read the photo. Please try again.")
      } else if (!data.text || data.text.trim().length < 20) {
        setScanError("No readable text found in this photo. Try a clearer, better-lit shot.")
      } else {
        onChange(data.text)
        setTab("paste")
      }
    } catch {
      setScanError("Upload failed. Check your connection and try again.")
    } finally {
      setExtracting(false)
    }
  }

  async function handleUrlImport() {
    const url = urlInput.trim()
    if (!url) return
    setUrlLoading(true)
    setUrlError(null)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/import-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUrlError(data?.message ?? "Failed to import document. Check the link and try again.")
        return
      }
      const extracted: string = data.text ?? ""
      if (!extracted || extracted.length < 30) {
        setUrlError("Could not extract readable text from this link. Try downloading the file and uploading it directly.")
        return
      }
      onChange(extracted)
      setTab("paste")
    } catch {
      setUrlError("Network error — please check your connection and try again.")
    } finally {
      setUrlLoading(false)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void extractFromFile(file)
  }

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setScanError("Only image files are supported."); return }
    setScanFile(file)
    setScanError(null)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void extractFromFile(file)
  }

  function clearFile() {
    setFileName(null)
    setFileError(null)
    onChange("")
    if (fileRef.current) fileRef.current.value = ""
  }

  function switchTab(next: typeof tab) {
    setTab(next)
    if (next !== "upload") { setFileName(null); setFileError(null) }
    if (next !== "scan") { setScanFile(null); setScanError(null) }
    if (next !== "url") { setUrlError(null) }
  }

  const TABS = [
    { id: "paste" as const, icon: Type, label: "Paste Text", sub: "Copy & paste" },
    { id: "upload" as const, icon: UploadCloud, label: "Upload File", sub: "PDF, DOCX, TXT" },
    { id: "scan" as const, icon: Camera, label: "Scan Photo", sub: "Camera or image" },
    { id: "url" as const, icon: LinkIcon, label: "Import Link", sub: "Drive or Dropbox" },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${accentBadge}`}>
            {isOriginal ? "Original" : "Revised"}
          </span>
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </div>
        {value && !extracting && (
          <span className="text-xs text-muted-foreground shrink-0">{value.length.toLocaleString()} chars</span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-4 gap-0.5 bg-muted/50 rounded-xl p-0.5">
        {TABS.map(({ id: t, icon: Icon, label, sub }) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            style={{ touchAction: "manipulation" }}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-all min-h-[44px] ${
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-semibold">
              <Icon className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </div>
            <span className="text-[9px] opacity-50 hidden sm:block">{sub}</span>
            <span className="sm:hidden text-[10px] font-medium">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Paste mode */}
      {tab === "paste" && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Paste the ${isOriginal ? "original" : "revised"} document text here…`}
          className="h-52 text-sm resize-none font-mono bg-muted/20 border-border/50 focus-visible:ring-primary/30 leading-relaxed"
        />
      )}

      {/* Upload mode */}
      {tab === "upload" && (
        <div>
          <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileInputChange} />
          {extracting ? (
            <div className="h-52 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 bg-muted/10">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Extracting text from {fileName}…</p>
            </div>
          ) : fileName && value && !fileError ? (
            <div className={`h-52 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 ${successBorder}`}>
              <CheckCircle2 className={`w-8 h-8 ${successIcon}`} />
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{fileName}</p>
                <p className="text-xs text-muted-foreground mt-1">{value.length.toLocaleString()} characters loaded</p>
              </div>
              <button onClick={clearFile} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-3 py-1 rounded-lg hover:bg-muted/60">
                <RotateCcw className="w-3 h-3" /> Replace file
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`h-52 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isDragging ? dragBorder : "border-border/50 hover:border-primary/40 hover:bg-muted/20"}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-primary/10" : "bg-muted/60"}`}>
                <UploadCloud className={`w-7 h-7 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-medium text-foreground">{isDragging ? "Drop to upload" : "Drag and drop, or click to browse"}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT · max 20 MB</p>
              </div>
            </div>
          )}
          {fileError && (
            <div className="flex items-start gap-2 mt-2.5 text-destructive">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="text-xs leading-snug">{fileError}</p>
            </div>
          )}
        </div>
      )}

      {/* Scan Photo mode */}
      {tab === "scan" && (
        <div className="space-y-3">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraChange} />
          {!scanFile ? (
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full h-44 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-muted/20 transition-all cursor-pointer"
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Take a photo or choose from gallery</p>
                <p className="text-xs text-muted-foreground mt-1">AI will extract the text automatically</p>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/10">
                <img src={URL.createObjectURL(scanFile)} alt="Scanned document" className="w-full object-contain max-h-40" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/40">
                <Camera className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <p className="text-sm text-muted-foreground flex-1 truncate">{scanFile.name}</p>
                <button onClick={() => { setScanFile(null); setScanError(null) }} className="p-1 rounded hover:bg-muted/60 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <Button
                size="sm"
                onClick={() => void handleScanExtract()}
                disabled={extracting}
                className="w-full gap-2"
              >
                {extracting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting…</> : <><Camera className="w-3.5 h-3.5" /> Extract Text from Photo</>}
              </Button>
            </div>
          )}
          {scanError && (
            <div className="flex items-start gap-2 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {scanError}
            </div>
          )}
        </div>
      )}

      {/* Import Link mode */}
      {tab === "url" && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold mb-1">Paste a Google Drive or Dropbox link</p>
            <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
              PlainPath will fetch and extract the text automatically.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://dropbox.com/..."
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setUrlError(null) }}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  onKeyDown={e => { if (e.key === "Enter" && urlInput.trim()) void handleUrlImport() }}
                />
              </div>
              <Button
                size="sm"
                onClick={() => void handleUrlImport()}
                disabled={urlLoading || !urlInput.trim()}
                style={{ touchAction: "manipulation" }}
                className="shrink-0 rounded-xl"
              >
                {urlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Import"}
              </Button>
            </div>
            {urlError && (
              <div className="flex items-start gap-2 text-destructive text-xs mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {urlError}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground/70">Google Drive: right-click → Share → "Anyone with the link" → copy link</p>
            <p className="font-semibold text-foreground/70">Dropbox: click Share on the file → copy shared link</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function Compare() {
  const [original, setOriginal] = useState("")
  const [revised, setRevised] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const { entitlements, loading: entitlementsLoading } = useEntitlements()
  const canCompareAccess = BILLING_CONFIG.PAYWALL_ENFORCEMENT
    ? (entitlements?.toolAccess?.includes("compare") ?? false)
    : true

  useEffect(() => {
    document.title = "Compare Document Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    if (!entitlementsLoading && BILLING_CONFIG.PAYWALL_ENFORCEMENT && !canCompareAccess) {
      setUpgradeOpen(true)
    }
  }, [entitlementsLoading, canCompareAccess])

  async function handleCompare() {
    if (original.trim().length < 50 || revised.trim().length < 50) {
      setError("Both versions need at least 50 characters. Upload or paste the full document text to get accurate results.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: original.trim(), revised: revised.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Comparison failed. Please try again.")
      setResult(data)
      saveRecentWork({ tool: "compare", title: "Document Comparison" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const riskBadge =
    result?.overallRiskChange === "increased"
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      : result?.overallRiskChange === "decreased"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : "bg-muted text-muted-foreground"

  const canCompare = original.trim().length >= 50 && revised.trim().length >= 50

  if (loading) return <DocumentScanScreen mode="compare" />

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">

          {/* ─── Input view ─────────────────────────────────────────── */}
          {!result && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero */}
              <div className="text-center mb-8 sm:mb-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-4 shadow-sm">
                  <GitCompare className="w-6 h-6 text-violet-500" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-3 text-foreground">
                  Compare Document Versions
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                  Compare an original document against a revised version. See exactly what changed, what was added or removed, and what may now carry more risk.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2.5">
                  Designed for contracts, leases, agreements, and revised paperwork before signing.
                </p>
              </div>

              {/* What you'll get */}
              <div className="mb-8 sm:mb-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 text-center mb-4">
                  What you'll get back
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {OUTPUT_ITEMS.map(({ icon: Icon, label, color, bg, border }) => (
                    <div
                      key={label}
                      className={`${bg} border ${border} rounded-xl p-3.5 flex items-start gap-2.5`}
                    >
                      <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                      <p className="text-xs font-medium text-foreground leading-snug">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <WorkspaceShell>
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Input panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <DocumentInput
                      label="Original Version"
                      helperText="Upload or paste the version you received first"
                      value={original}
                      onChange={setOriginal}
                      side="original"
                    />
                    <DocumentInput
                      label="Revised Version"
                      helperText="Upload or paste the edited or revised version for comparison"
                      value={revised}
                      onChange={setRevised}
                      side="revised"
                    />
                  </div>

                  {/* Hint when empty */}
                  {!original && !revised && (
                    <p className="text-center text-xs text-muted-foreground/60">
                      Add both versions above to begin — you can upload files or paste text directly.
                    </p>
                  )}

                  {/* Progress hint */}
                  {(!!original !== !!revised) && (
                    <p className="text-center text-xs text-muted-foreground/70">
                      {original
                        ? "Original version loaded. Add the revised version to compare."
                        : "Revised version loaded. Add the original version to compare."}
                    </p>
                  )}
                </div>

                {/* Footer CTA */}
                <div className="px-6 sm:px-8 py-4 border-t border-border/[0.15] bg-muted/20">
                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/8 border border-destructive/15 text-destructive mb-4">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-sm leading-snug">{error}</p>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={() => {
                        if (!canCompareAccess) { setUpgradeOpen(true); return }
                        handleCompare()
                      }}
                      disabled={loading || !canCompare}
                      className="gap-2.5 px-10 rounded-full shadow-md hover:shadow-lg transition-shadow"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing changes…
                        </>
                      ) : (
                        <>
                          <GitCompare className="w-4 h-4" />
                          Compare Changes
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </WorkspaceShell>
            </motion.div>
          )}

          {/* ─── Result view ─────────────────────────────────────────── */}
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Result header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                    <GitCompare className="w-4.5 h-4.5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Comparison complete</p>
                    <h2 className="text-base font-bold text-foreground">Document Version Comparison</h2>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setResult(null); setOriginal(""); setRevised("") }}
                  className="gap-1.5 text-xs rounded-full"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Compare again
                </Button>
              </div>

              {/* Summary card */}
              <div className="border border-border/50 rounded-2xl p-5 sm:p-6 bg-card shadow-sm">
                <div className="flex items-start gap-5 flex-wrap mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">Overall risk change</p>
                    <Badge className={`text-sm font-bold px-3 py-1 border-0 ${riskBadge}`}>
                      {result.overallRiskChange === "increased"
                        ? "Risk increased ↑"
                        : result.overallRiskChange === "decreased"
                        ? "Risk decreased ↓"
                        : "Risk unchanged"}
                    </Badge>
                  </div>
                  <div className="flex gap-6 flex-wrap">
                    <div className="text-center">
                      <p className="text-3xl font-bold font-display">{result.changesCount}</p>
                      <p className="text-xs text-muted-foreground">total changes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold font-display text-red-500">{result.highSignificanceCount}</p>
                      <p className="text-xs text-muted-foreground">high significance</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
              </div>

              {/* Recommendation */}
              <div className="flex items-start gap-3 bg-background border border-border/50 rounded-xl px-4 py-3.5 shadow-sm">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Changes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Changes ({result.changes.length})
                </h3>
                {result.changes.map((c, i) => (
                  <ChangeCard key={i} change={c} />
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center pt-2">
                AI-assisted comparison for informational purposes only. Not legal advice.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="compare"
      />
    </div>
  )
}
