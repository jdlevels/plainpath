import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle, UploadCloud, Type,
  ArrowLeft, X, AlertCircle, ChevronRight, FileText,
} from "lucide-react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { DocumentChat } from "@/components/DocumentChat"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"
import { getApiBaseUrl } from "@/lib/api"
import type { DocumentAnalysis } from "@workspace/api-client-react"

const EXAMPLE_QUESTIONS = [
  "What does this document require me to do?",
  "What deadlines are listed?",
  "What sections should I review first?",
  "Are there payment terms?",
  "What looks unclear?",
]

type Phase = "upload" | "paste" | "processing" | "ready"
type MobileTab = "document" | "ask"

const PE_FIELDS: { key: string; label: string }[] = [
  { key: "whatItIs",       label: "What it is" },
  { key: "whatItSays",     label: "What it says" },
  { key: "whatItAsks",     label: "What it asks of you" },
  { key: "obligations",    label: "Your obligations" },
  { key: "payAttentionTo", label: "Pay attention to" },
  { key: "nextSteps",      label: "Next steps" },
]

function DocumentViewer({
  analysis,
  fileName,
  rawText,
}: {
  analysis: DocumentAnalysis
  fileName: string | null
  rawText?: string
}) {
  const sections = (analysis.sections ?? []) as Array<{ id: string; title?: string; content: string }>
  const plainEnglish = analysis.plainEnglish as Record<string, string> | undefined

  // Filter to sections that have real content (not empty strings)
  const validSections = sections.filter((s) => s.content?.trim().length > 0)
  const hasSections = validSections.length > 0

  const hasRawText = (rawText ?? "").trim().length > 0

  const hasPlainEnglish =
    !!plainEnglish &&
    Object.values(plainEnglish).some((v) => typeof v === "string" && v.trim().length > 0)

  const hasSummary = (analysis.summary ?? "").trim().length > 0

  // Determine what to render
  const showSections = hasSections
  const showRawText = !hasSections && hasRawText
  const showPlainEnglish = !hasSections && !hasRawText && hasPlainEnglish
  const showSummary = !hasSections && !hasRawText && !hasPlainEnglish && hasSummary
  const showEmpty = !hasSections && !hasRawText && !hasPlainEnglish && !hasSummary

  return (
    <div className="p-4 sm:p-6">
      {/* Paper surface */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">

        {/* Document header strip */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40 bg-muted/20">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {fileName ?? analysis.title ?? "Document"}
            </p>
            {analysis.documentType && (
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{analysis.documentType}</p>
            )}
          </div>
        </div>

        {/* Document body */}
        <div className="px-6 py-6 space-y-5">

          {/* Sections from extracted text */}
          {showSections && (
            <div className="space-y-5">
              {validSections.map((section) => (
                <div key={section.id} className="space-y-2">
                  {section.title?.trim() && (
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {section.title}
                    </h3>
                  )}
                  <p className="text-sm text-foreground/90 leading-[1.75] whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Fallback 1: raw pasted text */}
          {showRawText && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Document text
              </h3>
              <p className="text-sm text-foreground/90 leading-[1.75] whitespace-pre-wrap">
                {rawText}
              </p>
            </div>
          )}

          {/* Fallback 2: plain-English breakdown */}
          {showPlainEnglish && plainEnglish && (
            <div className="space-y-5">
              {PE_FIELDS.filter(({ key }) => plainEnglish[key]?.trim()).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {label}
                  </h3>
                  <p className="text-sm text-foreground/90 leading-[1.75]">{plainEnglish[key]}</p>
                </div>
              ))}
            </div>
          )}

          {/* Fallback 3: summary */}
          {showSummary && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Summary
              </h3>
              <p className="text-sm text-foreground/90 leading-[1.75]">{analysis.summary}</p>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="rounded-xl border border-border/40 bg-muted/20 px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No readable text was extracted from this document. Try another PDF, DOCX, or paste
                the text manually.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AskDocument() {
  const [, setLocation] = useLocation()
  const [phase, setPhase] = useState<Phase>("upload")
  const [mobileTab, setMobileTab] = useState<MobileTab>("ask")
  const [fileName, setFileName] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [rawText, setRawText] = useState<string | undefined>(undefined)
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function safeParseJson(res: Response): Promise<Record<string, unknown>> {
    const ct = res.headers.get("content-type") ?? ""
    if (!ct.includes("application/json")) {
      throw new Error("Could not process this document. Please try again.")
    }
    return res.json() as Promise<Record<string, unknown>>
  }

  async function analyzeFile(file: File) {
    setFileName(file.name)
    setError(null)
    setPhase("processing")
    try {
      const apiBase = getApiBaseUrl()
      const form = new FormData()
      form.append("file", file)
      form.append("documentTypeHint", "")
      const res = await fetch(`${apiBase}/api/documents/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      })
      const data = await safeParseJson(res)
      if (!res.ok) throw new Error((data?.message as string) ?? "Could not read this document. Please try again.")
      setAnalysis(data.analysis as DocumentAnalysis)
      setMobileTab("ask")
      setPhase("ready")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setPhase("upload")
    }
  }

  async function analyzeText() {
    const trimmed = text.trim()
    if (trimmed.length < 20) {
      setError("Please paste at least a few sentences of document text.")
      return
    }
    setFileName("Pasted text")
    setRawText(trimmed)
    setError(null)
    setPhase("processing")
    try {
      const apiBase = getApiBaseUrl()
      const res = await fetch(`${apiBase}/api/documents/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, documentTypeHint: "" }),
        credentials: "include",
      })
      const data = await safeParseJson(res)
      if (!res.ok) throw new Error((data?.message as string) ?? "Could not analyze this text. Please try again.")
      setAnalysis(data.analysis as DocumentAnalysis)
      setMobileTab("ask")
      setPhase("ready")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setPhase("paste")
    }
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void analyzeFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void analyzeFile(file)
    e.target.value = ""
  }

  function reset() {
    setPhase("upload")
    setFileName(null)
    setText("")
    setRawText(undefined)
    setAnalysis(null)
    setError(null)
    setMobileTab("ask")
  }

  return (
    <WorkspaceShell>
      <div className="h-screen flex flex-col">

        {/* ── Header ─────────────────────────────────── */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground leading-none">Ask This Document</h1>
            {fileName && phase === "ready" && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{fileName}</p>
            )}
          </div>
          {phase === "ready" && (
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
            >
              <X className="w-3 h-3" />
              Start over
            </button>
          )}
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className={`flex-1 flex flex-col ${phase === "ready" ? "overflow-hidden" : "overflow-auto"}`}>
          <AnimatePresence mode="wait">

            {/* Upload / Paste phase */}
            {(phase === "upload" || phase === "paste") && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-lg mx-auto px-4 py-10 space-y-7 w-full"
              >
                {/* Icon + title */}
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Ask This Document</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Upload a document and ask plain-English questions about clauses,
                      obligations, deadlines, risks, and confusing language.
                    </p>
                  </div>
                </div>

                {/* Example questions */}
                <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-950/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
                    What you can ask
                  </p>
                  <ul className="space-y-2">
                    {EXAMPLE_QUESTIONS.map((q) => (
                      <li key={q} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground/80">"{q}"</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Upload drop-zone */}
                {phase === "upload" && (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-150 ${
                        isDragging
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.01]"
                          : "border-border hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-muted/40"
                      }`}
                    >
                      <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">Drop your document here</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF or Word (.docx) · or click to browse</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <button
                      onClick={() => { setPhase("paste"); setError(null) }}
                      className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      <Type className="w-4 h-4" />
                      Paste text instead
                    </button>
                  </div>
                )}

                {/* Paste text */}
                {phase === "paste" && (
                  <div className="space-y-3">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your document text here…"
                      autoFocus
                      className="w-full h-48 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/60 transition-all"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => { setPhase("upload"); setError(null) }}
                        className="flex-1 rounded-xl"
                      >
                        Upload a file
                      </Button>
                      <Button
                        onClick={() => void analyzeText()}
                        disabled={text.trim().length < 20}
                        className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Start Asking
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Processing phase — standard scan animation */}
            {phase === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1"
              >
                <DocumentScanScreen mode="ask-document" fileName={fileName ?? undefined} />
              </motion.div>
            )}

            {/* Ready — two-panel workspace */}
            {phase === "ready" && analysis && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Mobile tab bar */}
                <div className="md:hidden flex shrink-0 border-b border-border/40 bg-background">
                  <button
                    onClick={() => setMobileTab("document")}
                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                      mobileTab === "document"
                        ? "text-foreground border-foreground"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Document
                  </button>
                  <button
                    onClick={() => setMobileTab("ask")}
                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                      mobileTab === "ask"
                        ? "text-indigo-600 dark:text-indigo-400 border-indigo-500"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Ask
                  </button>
                </div>

                {/* Mobile panels */}
                <div className="md:hidden flex-1 min-h-0 overflow-hidden">
                  {mobileTab === "document" ? (
                    <div className="h-full overflow-y-auto">
                      <DocumentViewer analysis={analysis} fileName={fileName} rawText={rawText} />
                    </div>
                  ) : (
                    <div className="h-full overflow-hidden">
                      <DocumentChat analysis={analysis} />
                    </div>
                  )}
                </div>

                {/* Desktop two-column */}
                <div className="hidden md:flex flex-1 min-h-0">
                  <div className="w-[58%] overflow-y-auto border-r border-border/40">
                    <DocumentViewer analysis={analysis} fileName={fileName} rawText={rawText} />
                  </div>
                  <div className="w-[42%] overflow-y-auto">
                    <DocumentChat analysis={analysis} />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </WorkspaceShell>
  )
}
