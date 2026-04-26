import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle, UploadCloud, Type,
  ArrowLeft, X, AlertCircle, ChevronRight, FileText, Loader2,
  ZoomIn, ZoomOut, Maximize2,
} from "lucide-react"
import { useLocation } from "wouter"
import * as pdfjsLib from "pdfjs-dist"
import { Button } from "@/components/ui/button"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { DocumentChat } from "@/components/DocumentChat"
import type { SourceMatch } from "@/components/DocumentChat"
import { DocumentScanScreen } from "@/components/DocumentScanScreen"
import { getApiBaseUrl } from "@/lib/api"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocumentAnalysis = any

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const PDF_SCALE = 1.4
const PDF_MAX_PAGES = 15

const ZOOM_STEPS = [
  { scale: 0.65, label: "65%" },
  { scale: 0.80, label: "80%" },
  { scale: 1.00, label: "100%" },
  { scale: 1.20, label: "120%" },
  { scale: 1.40, label: "140%" },
]
const ZOOM_DEFAULT = 2 // index into ZOOM_STEPS (1.00 = 100%)

type SectionItem = { id: string; title?: string; content: string }

// ─── Read-only PDF viewer ─────────────────────────────────────────────────────
// Renders on a dark stage — images float as white paper pages
function PdfReadViewer({
  file,
  fallbackContent,
  cssScale = 1,
  onLoaded,
}: {
  file: File
  fallbackContent: React.ReactNode
  cssScale?: number
  onLoaded?: (rendered: number, total: number) => void
}) {
  const [pages, setPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setPages([])

    ;(async () => {
      try {
        const buf = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf), verbosity: 0 }).promise
        if (cancelled) return

        const renders: string[] = []
        const count = Math.min(pdf.numPages, PDF_MAX_PAGES)

        for (let pn = 1; pn <= count; pn++) {
          if (cancelled) break
          const page = await pdf.getPage(pn)
          const viewport = page.getViewport({ scale: PDF_SCALE })
          const canvas = document.createElement("canvas")
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const ctx = canvas.getContext("2d")!
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render as any)({ canvasContext: ctx, viewport }).promise
          renders.push(canvas.toDataURL("image/jpeg", 0.88))
          page.cleanup()
        }

        if (!cancelled) {
          setPages(renders)
          setLoading(false)
          onLoaded?.(renders.length, pdf.numPages)
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Rendering PDF…</p>
      </div>
    )
  }

  if (failed || pages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-amber-100 bg-amber-50">
          <p className="text-[11px] text-amber-700 font-medium">
            PDF preview unavailable — showing extracted text instead
          </p>
        </div>
        <div className="px-7 py-7">{fallbackContent}</div>
      </div>
    )
  }

  const imgWidth = `${Math.round(cssScale * 100)}%`

  return (
    <div className="space-y-5">
      {pages.map((dataUrl, i) => (
        <img
          key={i}
          src={dataUrl}
          alt={`Page ${i + 1}`}
          className="block rounded-md shadow-xl mx-auto"
          style={{ width: imgWidth }}
          draggable={false}
        />
      ))}
      {pages.length === PDF_MAX_PAGES && (
        <p className="text-[11px] text-zinc-500 text-center pb-2">
          Showing first {PDF_MAX_PAGES} pages
        </p>
      )}
    </div>
  )
}

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

// ─── Document stage viewer ────────────────────────────────────────────────────
// Dark workspace with centered, constrained paper — similar feel to Review & Redact
function DocumentViewer({
  analysis,
  fileName,
  rawText,
  pdfFile,
  sourceMatch,
  zoomIdx = ZOOM_DEFAULT,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  scrollTrigger = 0,
}: {
  analysis: DocumentAnalysis
  fileName: string | null
  rawText?: string
  pdfFile?: File | null
  sourceMatch?: SourceMatch | null
  zoomIdx?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomFit?: () => void
  scrollTrigger?: number
}) {
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const stageRef = useRef<HTMLDivElement>(null)
  const [pdfPageInfo, setPdfPageInfo] = useState<{ rendered: number; total: number } | null>(null)
  const sections = (analysis.sections ?? []) as SectionItem[]
  const plainEnglish = analysis.plainEnglish as Record<string, string> | undefined

  const validSections = sections.filter(s => s.content?.trim().length > 0)
  const hasSections = validSections.length > 0
  const hasRawText = (rawText ?? "").trim().length > 0
  const hasPlainEnglish =
    !!plainEnglish &&
    Object.values(plainEnglish).some(v => typeof v === "string" && v.trim().length > 0)
  const hasSummary = (analysis.summary ?? "").trim().length > 0

  const showSections = hasSections
  const showRawText = !hasSections && hasRawText
  const showPlainEnglish = !hasSections && !hasRawText && hasPlainEnglish
  const showSummary = !hasSections && !hasRawText && !hasPlainEnglish && hasSummary
  const showEmpty = !hasSections && !hasRawText && !hasPlainEnglish && !hasSummary

  // Auto-scroll to highlighted section when sourceMatch changes (new answer)
  useEffect(() => {
    if (!sourceMatch?.id) return
    const el = sectionRefs.current.get(sourceMatch.id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [sourceMatch])

  // Manual scroll when user clicks source card (scrollTrigger increments)
  useEffect(() => {
    if (!scrollTrigger) return
    if (sourceMatch?.id) {
      const el = sectionRefs.current.get(sourceMatch.id)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" })
        return
      }
    }
    // PDF view or unmatched — scroll stage to top
    stageRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [scrollTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  // Text content — zinc colors since it always renders on a white card
  const textContent = (
    <div className="space-y-5">
      {showSections &&
        validSections.map(section => {
          const isHighlighted = sourceMatch?.id === section.id
          return (
            <div
              key={section.id}
              ref={el => {
                if (el) sectionRefs.current.set(section.id, el)
                else sectionRefs.current.delete(section.id)
              }}
              className={`space-y-2 transition-all duration-300 rounded-lg ${
                isHighlighted
                  ? "bg-indigo-50 border border-indigo-200 px-3 py-2 -mx-1"
                  : ""
              }`}
            >
              {section.title?.trim() && (
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {section.title}
                </h3>
              )}
              <p className="text-sm text-zinc-800 leading-[1.75] whitespace-pre-wrap">
                {section.content}
              </p>
            </div>
          )
        })}

      {showRawText && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Document text
          </h3>
          <p className="text-sm text-zinc-800 leading-[1.75] whitespace-pre-wrap">{rawText}</p>
        </div>
      )}

      {showPlainEnglish &&
        plainEnglish &&
        PE_FIELDS.filter(({ key }) => plainEnglish[key]?.trim()).map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {label}
            </h3>
            <p className="text-sm text-zinc-800 leading-[1.75]">{plainEnglish[key]}</p>
          </div>
        ))}

      {showSummary && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Summary
          </h3>
          <p className="text-sm text-zinc-800 leading-[1.75]">{analysis.summary}</p>
        </div>
      )}

      {showEmpty && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
          <p className="text-sm text-zinc-500">
            No readable text was extracted from this document. Try another PDF, DOCX, or paste the
            text manually.
          </p>
        </div>
      )}
    </div>
  )

  const cssScale = ZOOM_STEPS[zoomIdx]?.scale ?? 1

  return (
    <div className="h-full flex flex-col bg-zinc-900 dark:bg-zinc-950">
      {/* Compact dark header strip */}
      <div className="shrink-0 flex items-center gap-2.5 px-3 py-2 border-b border-white/10 bg-zinc-800/60">
        <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-zinc-200 truncate leading-tight">
            {fileName ?? (analysis as any).title ?? "Document"}
          </p>
          {(analysis as any).documentType && (
            <p className="text-[11px] text-zinc-500 leading-none mt-0.5">
              {(analysis as any).documentType}
              {pdfPageInfo && (
                <span className="ml-2 text-zinc-600">
                  · {pdfPageInfo.rendered === pdfPageInfo.total
                    ? `${pdfPageInfo.total} pages`
                    : `${pdfPageInfo.rendered} of ${pdfPageInfo.total} pages`}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Zoom controls — only for PDF */}
        {pdfFile && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoomIdx <= 0}
              title="Zoom out"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-zinc-500 font-mono w-8 text-center select-none">
              {ZOOM_STEPS[zoomIdx]?.label ?? "100%"}
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoomIdx >= ZOOM_STEPS.length - 1}
              title="Zoom in"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onZoomFit}
              disabled={zoomIdx === ZOOM_DEFAULT}
              title="Fit width (100%)"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-0.5"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Dark stage — scrollable both axes, paper centered */}
      <div ref={stageRef} className="flex-1 overflow-auto">
        <div className="py-8 px-4 sm:px-8 flex justify-center">
          <div className="w-full" style={{ maxWidth: "800px" }}>
            {pdfFile ? (
              <PdfReadViewer
                file={pdfFile}
                fallbackContent={textContent}
                cssScale={cssScale}
                onLoaded={(rendered, total) => setPdfPageInfo({ rendered, total })}
              />
            ) : (
              /* Text / DOCX: white paper card on dark stage */
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="px-7 py-7">{textContent}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AskDocument() {
  const [, setLocation] = useLocation()
  const [phase, setPhase] = useState<Phase>("upload")
  const [mobileTab, setMobileTab] = useState<MobileTab>("ask")
  const [fileName, setFileName] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [rawText, setRawText] = useState<string | undefined>(undefined)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // undefined = no answer yet; null = answer, no source; object = source matched
  const [sourceMatch, setSourceMatch] = useState<SourceMatch | null | undefined>(undefined)
  const [zoomIdx, setZoomIdx] = useState(ZOOM_DEFAULT)
  const [scrollTrigger, setScrollTrigger] = useState(0)
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
    if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      setPdfFile(file)
    } else {
      setPdfFile(null)
    }
    setError(null)
    setSourceMatch(undefined)
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
      if (!res.ok)
        throw new Error(
          (data?.message as string) ?? "Could not read this document. Please try again."
        )
      setAnalysis(data.analysis as DocumentAnalysis)
      setMobileTab("ask")
      setPhase("ready")
    } catch (err: unknown) {
      setPdfFile(null)
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
    setPdfFile(null)
    setRawText(trimmed)
    setError(null)
    setSourceMatch(undefined)
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
      if (!res.ok)
        throw new Error(
          (data?.message as string) ?? "Could not analyze this text. Please try again."
        )
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setPdfFile(null)
    setAnalysis(null)
    setError(null)
    setMobileTab("ask")
    setSourceMatch(undefined)
    setZoomIdx(ZOOM_DEFAULT)
    setScrollTrigger(0)
  }

  const sections = (analysis?.sections ?? []) as SectionItem[]

  return (
    <WorkspaceShell>
      <div className="h-screen flex flex-col">

        {/* ── Top nav header ─────────────────────────────────────────── */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            type="button"
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
            <h1 className="text-sm font-semibold text-foreground leading-none">
              Ask This Document
            </h1>
            {fileName && phase === "ready" && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{fileName}</p>
            )}
          </div>
          {phase === "ready" && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
            >
              <X className="w-3 h-3" />
              Start over
            </button>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            phase === "ready" ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          <AnimatePresence mode="wait">

            {/* Upload / Paste */}
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
                      Upload a document and ask plain-English questions about clauses, obligations,
                      deadlines, risks, and confusing language.
                    </p>
                  </div>
                </div>

                {/* Example questions */}
                <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-950/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
                    What you can ask
                  </p>
                  <ul className="space-y-2">
                    {EXAMPLE_QUESTIONS.map(q => (
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
                      onDragOver={e => {
                        e.preventDefault()
                        setIsDragging(true)
                      }}
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
                      <p className="text-sm font-semibold text-foreground">
                        Drop your document here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF or Word (.docx) · or click to browse
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase("paste")
                        setError(null)
                      }}
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
                      onChange={e => setText(e.target.value)}
                      placeholder="Paste your document text here…"
                      autoFocus
                      className="w-full h-48 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/60 transition-all"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPhase("upload")
                          setError(null)
                        }}
                        className="flex-1 rounded-xl"
                      >
                        Upload a file
                      </Button>
                      <Button
                        type="button"
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

            {/* Processing */}
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

            {/* Ready — split workspace */}
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
                    type="button"
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
                    type="button"
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

                {/* Mobile panels — both stay mounted (absolute overlay), CSS toggled */}
                <div className="md:hidden flex-1 min-h-0 relative overflow-hidden">
                  <div
                    className={`absolute inset-0 ${
                      mobileTab === "document" ? "flex flex-col" : "hidden"
                    }`}
                  >
                    <DocumentViewer
                      analysis={analysis}
                      fileName={fileName}
                      rawText={rawText}
                      pdfFile={pdfFile}
                      sourceMatch={sourceMatch}
                      zoomIdx={zoomIdx}
                      onZoomIn={() => setZoomIdx(i => Math.min(i + 1, ZOOM_STEPS.length - 1))}
                      onZoomOut={() => setZoomIdx(i => Math.max(i - 1, 0))}
                      onZoomFit={() => setZoomIdx(ZOOM_DEFAULT)}
                      scrollTrigger={scrollTrigger}
                    />
                  </div>
                  <div
                    className={`absolute inset-0 ${
                      mobileTab === "ask" ? "flex flex-col" : "hidden"
                    }`}
                  >
                    <DocumentChat
                      analysis={analysis}
                      sections={sections}
                      onHighlightSection={setSourceMatch}
                      onMessageSent={() => setSourceMatch(undefined)}
                      onScrollToSource={() => setScrollTrigger(t => t + 1)}
                      fullHeight
                    />
                  </div>
                </div>

                {/* Desktop two-column workspace */}
                <div className="hidden md:flex flex-1 min-h-0">
                  {/* Left: dark document stage (~60%) */}
                  <div className="w-[60%] flex flex-col overflow-hidden border-r border-white/10">
                    <DocumentViewer
                      analysis={analysis}
                      fileName={fileName}
                      rawText={rawText}
                      pdfFile={pdfFile}
                      sourceMatch={sourceMatch}
                      zoomIdx={zoomIdx}
                      onZoomIn={() => setZoomIdx(i => Math.min(i + 1, ZOOM_STEPS.length - 1))}
                      onZoomOut={() => setZoomIdx(i => Math.max(i - 1, 0))}
                      onZoomFit={() => setZoomIdx(ZOOM_DEFAULT)}
                      scrollTrigger={scrollTrigger}
                    />
                  </div>
                  {/* Right: Q&A panel (~40%) */}
                  <div className="w-[40%] flex flex-col overflow-hidden">
                    <DocumentChat
                      analysis={analysis}
                      sections={sections}
                      onHighlightSection={setSourceMatch}
                      onMessageSent={() => setSourceMatch(undefined)}
                      onScrollToSource={() => setScrollTrigger(t => t + 1)}
                      fullHeight
                    />
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
