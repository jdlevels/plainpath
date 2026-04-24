// ─── Ask This Document ────────────────────────────────────────────────────────
// Single-document Q&A with source-backed, citation-linked answers.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react"
import { useParams, useLocation } from "wouter"
import { useAuth } from "@clerk/react"
import * as pdfjsLib from "pdfjs-dist"
import {
  ArrowLeft, Upload, FileText, Send, Sparkles, MessageSquare,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  BookOpen, Calendar, AlertTriangle, ClipboardList, DollarSign, Clock,
  CornerDownRight, CheckCircle2, RefreshCcw, AlertCircle, FileQuestion,
  LocateFixed, Eye, Copy, Download, X,
} from "lucide-react"
import { askDocumentApi } from "@/lib/askDocumentApi"
import type {
  AskDocumentAnswer, AskDocumentFinding, AskDocumentSession,
} from "@/lib/askDocumentTypes"

// ─── pdfjs worker ─────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const RENDER_SCALE = 1.5

interface PageRender { dataUrl: string; w: number; h: number }

// ─── Colour scheme per citation index ────────────────────────────────────────
const CITATION_COLORS = [
  { chip: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40", page: "border-amber-400 bg-amber-50", badge: "bg-amber-200 text-amber-800", ring: "ring-amber-400/60" },
  { chip: "bg-red-400/20 text-red-300 ring-1 ring-red-400/30",       page: "border-red-400 bg-red-50",     badge: "bg-red-200 text-red-800",     ring: "ring-red-400/60" },
  { chip: "bg-blue-400/20 text-blue-300 ring-1 ring-blue-400/30",    page: "border-blue-400 bg-blue-50",   badge: "bg-blue-200 text-blue-800",   ring: "ring-blue-400/60" },
  { chip: "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30", page: "border-emerald-400 bg-emerald-50", badge: "bg-emerald-200 text-emerald-800", ring: "ring-emerald-400/60" },
]

const SUGGESTED_PROMPTS = [
  { icon: BookOpen,       label: "Summarize this document",       q: "Summarize this document in plain English. What type of document is it and what does it cover?" },
  { icon: Calendar,       label: "What are the key dates?",       q: "What are the key dates in this document? List all deadlines, renewal dates, expiration dates, and important milestones." },
  { icon: AlertTriangle,  label: "What are the risks?",           q: "What are the main risks or concerning clauses in this document? What could hurt me if I'm not careful?" },
  { icon: ClipboardList,  label: "What do I need to do?",        q: "What are my obligations and action items in this document? What do I need to do, and by when?" },
  { icon: DollarSign,     label: "What are the fees and costs?",  q: "What are all the fees, payments, costs, and financial obligations in this document?" },
  { icon: Clock,          label: "What are the notice periods?",  q: "What are the notice periods and timing requirements in this document?" },
]

const EXAMPLE_QUESTIONS = [
  "What are my obligations?", "When does this expire?", "What are the payment terms?",
  "What happens if I miss a deadline?", "Who owns the IP?", "What are the termination conditions?",
  "What fees apply?", "What is the renewal process?",
]

type LoadStage = "reading" | "locating" | "generating"
type ActiveTab = "doc" | "ask"

// ─── Hook: render PDF pages ───────────────────────────────────────────────────
function usePdfRenderer(buffer: ArrayBuffer | null) {
  const [pages, setPages] = useState<PageRender[]>([])
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    if (!buffer) { setPages([]); return }
    setRendering(true)
    let cancelled = false

    ;(async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
        const renders: PageRender[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const vp = page.getViewport({ scale: RENDER_SCALE })
          const canvas = document.createElement("canvas")
          canvas.width = vp.width
          canvas.height = vp.height
          const ctx = canvas.getContext("2d")!
          await page.render({ canvasContext: ctx, viewport: vp }).promise
          renders.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), w: vp.width, h: vp.height })
          if (cancelled) return
        }
        setPages(renders)
      } catch {
        // rendering failed — viewer shows error gracefully
      } finally {
        if (!cancelled) setRendering(false)
      }
    })()

    return () => { cancelled = true }
  }, [buffer])

  return { pages, rendering }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CitationChip({
  finding, active, onClick, onHoverChange,
}: {
  finding: AskDocumentFinding
  active: boolean
  onClick: () => void
  onHoverChange: (hovered: boolean) => void
}) {
  const col = CITATION_COLORS[(finding.id - 1) % CITATION_COLORS.length]
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all flex-shrink-0 ${col.chip} ${active ? "scale-105" : ""}`}
    >
      <LocateFixed className="w-2.5 h-2.5" />
      [{finding.id}] {finding.citation.section ?? `p.${finding.citation.page}`} · p.{finding.citation.page}
    </button>
  )
}

function LoadingAnswer({ stage }: { stage: LoadStage }) {
  const stages: { key: LoadStage; icon: React.ComponentType<any>; label: string }[] = [
    { key: "reading",   icon: FileText,  label: "Reading document structure…" },
    { key: "locating",  icon: Eye,       label: "Locating relevant clauses…" },
    { key: "generating", icon: Sparkles, label: "Generating source-backed answer…" },
  ]
  const activeIdx = stages.findIndex((s) => s.key === stage)

  return (
    <div className="flex gap-2.5 mx-4 mt-3">
      <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3.5">
          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3">Reading in progress</p>
          <div className="space-y-2.5">
            {stages.map(({ key, icon: Icon, label }, idx) => (
              <div key={key} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  idx < activeIdx ? "bg-violet-500/30" : idx === activeIdx ? "bg-violet-500/20 animate-pulse" : "bg-slate-700"
                }`}>
                  <Icon className={`w-2.5 h-2.5 ${idx <= activeIdx ? "text-violet-400" : "text-slate-500"}`} />
                </div>
                <span className={`text-[12px] ${idx < activeIdx ? "text-slate-500" : idx === activeIdx ? "text-slate-200 font-medium" : "text-slate-600"}`}>
                  {label}
                </span>
                {idx < activeIdx && <span className="text-[10px] text-violet-500 font-semibold ml-auto">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Layout-stable skeleton */}
        <div className="rounded-xl border border-slate-700/30 bg-slate-800/20 px-4 py-3 space-y-2">
          <div className="h-2.5 w-16 rounded-full bg-slate-700/50 animate-pulse mb-2" />
          {[100, 90, 82].map((w, i) => (
            <div key={i} className="h-2.5 rounded-full bg-slate-700/35 animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-slate-700/20 bg-slate-800/15 px-3.5 py-3 space-y-2">
            <div className="flex justify-between">
              <div className="h-2.5 rounded-full bg-slate-700/35 animate-pulse" style={{ width: `${40 + i * 15}%` }} />
              <div className="h-4 w-20 rounded-full bg-slate-700/25 animate-pulse" />
            </div>
            <div className="h-2 w-full bg-slate-700/25 rounded-full animate-pulse" />
            <div className="h-2 rounded-full bg-slate-700/20 animate-pulse" style={{ width: "80%" }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AskDocument() {
  const params = useParams()
  const [, navigate] = useLocation()
  const { getToken } = useAuth()
  const getTokenCb = useCallback(() => getToken(), [getToken])

  // ── Core state ──────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(params?.id ?? null)
  const [session, setSession] = useState<AskDocumentSession | null>(null)
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [pageCount, setPageCount] = useState<number>(0)

  // Upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Q&A
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<AskDocumentAnswer | null>(null)
  const [answerState, setAnswerState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [loadStage, setLoadStage] = useState<LoadStage>("reading")
  const [askError, setAskError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ question: string; answer: AskDocumentAnswer }[]>([])

  // PDF viewer
  const { pages, rendering } = usePdfRenderer(pdfBuffer)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [activeCitation, setActiveCitation] = useState<{ findingId: number; page: number } | null>(null)
  const [hoveredFindingId, setHoveredFindingId] = useState<number | null>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  // Mobile
  const [activeTab, setActiveTab] = useState<ActiveTab>("ask")
  const [jumpBanner, setJumpBanner] = useState<string | null>(null)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // Input ref
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Load existing session from URL ──────────────────────────────────────────
  useEffect(() => {
    if (!params?.id || session) return
    ;(async () => {
      try {
        const s = await askDocumentApi.getSession(params.id!, getTokenCb)
        setSession(s)
        setFileName(s.fileName)
        setPageCount(s.pageCount)
        setSessionId(s.id)
        if (s.exchanges.length > 0) {
          const last = s.exchanges[s.exchanges.length - 1]
          if (last.answer) {
            setAnswer(last.answer)
            setAnswerState("done")
          }
          setHistory(
            s.exchanges
              .filter((e) => e.answer)
              .map((e) => ({ question: e.question, answer: e.answer! })),
          )
        }
      } catch {
        // Session not found — show empty state
        setSessionId(null)
      }
    })()
  }, [params?.id, getTokenCb, session])

  // ── Scroll to citation page ──────────────────────────────────────────────────
  function jumpToPage(page: number) {
    setCurrentPage(page)
    const ref = pageRefs.current[page - 1]
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function handleCitationClick(finding: AskDocumentFinding) {
    const newActive = { findingId: finding.id, page: finding.citation.page }
    setActiveCitation(newActive)
    if (isMobile) {
      setActiveTab("doc")
      setJumpBanner(`Jumped to ${finding.citation.section ?? "source"} · Page ${finding.citation.page}`)
      setTimeout(() => setJumpBanner(null), 2500)
    } else {
      jumpToPage(finding.citation.page)
    }
  }

  // ── File upload ─────────────────────────────────────────────────────────────
  async function handleFile(file: File) {
    setUploadError(null)
    setUploading(true)
    setAnswerState("idle")
    setAnswer(null)
    setHistory([])
    setActiveCitation(null)

    const buf = await file.arrayBuffer()
    setPdfBuffer(buf)
    setFileName(file.name)

    try {
      const result = await askDocumentApi.uploadDocument(file, getTokenCb)
      setSessionId(result.sessionId)
      setPageCount(result.pageCount)
      navigate(`/ask-document/${result.sessionId}`, { replace: true })
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed. Please try again.")
      setPdfBuffer(null)
    } finally {
      setUploading(false)
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  // ── Ask question ────────────────────────────────────────────────────────────
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  async function submitQuestion(q: string) {
    if (!sessionId || !q.trim() || answerState === "loading") return
    const trimmed = q.trim()
    setQuestion("")
    setAnswerState("loading")
    setAnswer(null)
    setAskError(null)
    setActiveCitation(null)
    setLoadStage("reading")

    // Progress through stages without jumping
    stageTimers.current.forEach(clearTimeout)
    stageTimers.current = [
      setTimeout(() => setLoadStage("locating"), 1200),
      setTimeout(() => setLoadStage("generating"), 2800),
    ]

    try {
      const { answer: a } = await askDocumentApi.ask(sessionId, trimmed, getTokenCb)
      stageTimers.current.forEach(clearTimeout)
      setAnswer(a)
      setAnswerState("done")
      if (a.findings.length > 0) {
        setActiveCitation({ findingId: a.findings[0].id, page: a.findings[0].citation.page })
        jumpToPage(a.findings[0].citation.page)
      }
      setHistory((h) => [...h, { question: trimmed, answer: a }])
    } catch (err: any) {
      stageTimers.current.forEach(clearTimeout)
      setAskError(err.message ?? "Something went wrong. Please try again.")
      setAnswerState("error")
    }
  }

  // ── Zoom helpers ────────────────────────────────────────────────────────────
  const scaledZoom = zoom / 100
  const pageStyle = useMemo(() => ({
    width: `${Math.round(RENDER_SCALE > 0 ? 680 * scaledZoom : 680)}px`,
    maxWidth: "100%",
  }), [scaledZoom])

  // ─────────────────────────────────────────────────────────────────────────────
  // Determine overall UI mode
  // ─────────────────────────────────────────────────────────────────────────────
  const hasDocument = !!sessionId || !!pdfBuffer
  const showViewer = hasDocument && (pages.length > 0 || rendering || !!session)

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col bg-slate-950 text-slate-100 overflow-hidden"
      style={{ height: "calc(100vh - 64px)", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold text-slate-100">Ask This Document</p>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[260px]">
              {fileName || "Source-backed answers · one document at a time"}
            </p>
          </div>
        </div>

        {hasDocument && (
          <button
            onClick={() => {
              setSessionId(null); setPdfBuffer(null); setFileName(""); setAnswer(null)
              setAnswerState("idle"); setHistory([]); setActiveCitation(null)
              navigate("/ask-document", { replace: true })
            }}
            className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> New Document
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {!hasDocument && (
        <div className="flex-1 overflow-y-auto flex flex-col px-8 py-6 max-w-xl mx-auto w-full">
          <div className="mb-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-violet-400" />
              </div>
              <h1 className="text-lg font-bold text-slate-100">Ask This Document</h1>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              Ask about dates, obligations, risks, fees, renewal terms, deadlines, or next steps.
            </p>
          </div>

          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl px-6 py-8 cursor-pointer transition-all mb-5 ${
              dragging
                ? "border-violet-400 bg-violet-500/10"
                : uploading
                  ? "border-violet-500/40 bg-violet-500/5 cursor-default"
                  : "border-slate-700 hover:border-violet-500/40 hover:bg-violet-500/5"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dragging ? "bg-violet-500/25" : "bg-slate-800"}`}>
                {uploading
                  ? <div className="w-5 h-5 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin" />
                  : <Upload className={`w-5 h-5 ${dragging ? "text-violet-400" : "text-slate-500"}`} />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200 mb-0.5">
                  {uploading ? "Reading your document…" : dragging ? "Drop to upload" : "Drop a document here, or click to browse"}
                </p>
                <p className="text-[12px] text-slate-500">PDF, DOCX, or TXT · up to 50 MB</p>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3.5 py-3 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {uploadError}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={onFileInput} />

          {/* Example questions */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-slate-400 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/60 hover:border-slate-600 rounded-full px-2.5 py-1 transition-all leading-none"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
            {[
              { icon: CheckCircle2, text: "Answers grounded in your document only" },
              { icon: CheckCircle2, text: "No fabrication, no world knowledge" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Icon className="w-3 h-3 flex-shrink-0" /> {text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Workspace (document loaded) ── */}
      {hasDocument && (
        <>
          {/* ── Mobile tab bar ── */}
          <div className="md:hidden flex border-b border-slate-800 flex-shrink-0 bg-slate-900/40">
            {[
              { key: "doc" as const, icon: FileText,      label: "Document" },
              { key: "ask" as const, icon: MessageSquare, label: "Ask" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold border-b-2 transition-all ${
                  activeTab === key
                    ? "border-violet-500 text-white bg-violet-500/8"
                    : "border-transparent text-slate-500"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {key === "doc" && activeCitation && activeTab !== "doc" && (
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Jump banner (mobile) */}
          {jumpBanner && (
            <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-violet-600/90 text-white text-[11px] font-semibold flex-shrink-0">
              <LocateFixed className="w-3.5 h-3.5" />
              {jumpBanner}
            </div>
          )}

          <div className="flex flex-1 min-h-0">

            {/* ────────────────── Left: PDF Viewer ────────────────── */}
            <div
              className={`flex-col border-r border-slate-800 ${
                activeTab === "doc" ? "flex" : "hidden md:flex"
              }`}
              style={{ width: "54%" }}
            >
              {/* Viewer toolbar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex-shrink-0">
                {/* Zoom */}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setZoom((z) => Math.max(40, z - 10))} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-500 w-9 text-center font-mono">{zoom}%</span>
                  <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-px h-4 bg-slate-700/70" />

                {/* Page controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); jumpToPage(p) }}
                    disabled={currentPage <= 1}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono w-16 text-center">
                    {currentPage} / {pageCount || pages.length || "?"}
                  </span>
                  <button
                    onClick={() => { const p = Math.min(pageCount || pages.length, currentPage + 1); setCurrentPage(p); jumpToPage(p) }}
                    disabled={currentPage >= (pageCount || pages.length)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-px h-4 bg-slate-700/70" />

                {/* Fit buttons */}
                <button onClick={() => setZoom(75)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors" title="Fit width">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setZoom(100)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors" title="Full size">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1" />

                {/* Active citation indicator */}
                {activeCitation && answer && (() => {
                  const f = answer.findings.find((f) => f.id === activeCitation.findingId)
                  if (!f) return null
                  const col = CITATION_COLORS[(f.id - 1) % CITATION_COLORS.length]
                  return (
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${col.chip}`}>
                      <LocateFixed className="w-3 h-3" />
                      [{f.id}] p.{f.citation.page}
                    </div>
                  )
                })()}

                <FileText className="w-3.5 h-3.5 text-slate-600 ml-1 flex-shrink-0" />
              </div>

              {/* PDF pages */}
              <div className="flex-1 overflow-y-auto bg-slate-950 py-5">
                {rendering && pages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="w-7 h-7 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                    <p className="text-[12px] text-slate-500">Rendering document…</p>
                  </div>
                )}

                {/* Show placeholder when session loaded from history (no local buffer) */}
                {!pdfBuffer && session && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-1">{session.fileName}</p>
                      <p className="text-[12px] text-slate-500 mb-4">
                        To view the document here, upload it again — your answers are saved.
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[12px] font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                        Re-upload to view
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={onFileInput} />
                  </div>
                )}

                {/* Rendered pages */}
                <div className="flex flex-col items-center gap-5 px-4">
                  {pages.map((page, idx) => {
                    const pageNum = idx + 1
                    const isActivePage = activeCitation?.page === pageNum
                    const activeFinding = isActivePage && answer
                      ? answer.findings.find((f) => f.id === activeCitation?.findingId)
                      : null
                    const col = activeFinding ? CITATION_COLORS[(activeFinding.id - 1) % CITATION_COLORS.length] : null

                    return (
                      <div
                        key={idx}
                        ref={(el) => { pageRefs.current[idx] = el }}
                        className={`relative rounded-lg overflow-hidden shadow-xl transition-all ${isActivePage ? `ring-2 ${col?.ring}` : "ring-0"}`}
                        style={pageStyle}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        <img
                          src={page.dataUrl}
                          alt={`Page ${pageNum}`}
                          className="w-full block"
                          draggable={false}
                        />

                        {/* Page number badge */}
                        <div className="absolute bottom-2 right-2 text-[9px] font-semibold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full">
                          {pageNum}
                        </div>

                        {/* Active citation overlay */}
                        {isActivePage && activeFinding && col && (
                          <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 ${col.page} border-b-2`}>
                            <div className="flex items-center gap-1.5">
                              <LocateFixed className="w-3 h-3" />
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${col.badge}`}>
                                [{activeFinding.id}] {activeFinding.citation.section ?? `Page ${pageNum}`}
                              </span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveCitation(null) }}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ────────────────── Right: Q&A Panel ────────────────── */}
            <div
              className={`flex-col ${activeTab === "ask" ? "flex" : "hidden md:flex"}`}
              style={{ width: isMobile ? "100%" : "46%", flex: isMobile ? "1" : undefined }}
            >
              {/* Quick actions */}
              {answerState === "idle" && (
                <div className="px-4 pt-3 pb-2 border-b border-slate-800/50 flex-shrink-0">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Quick questions</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SUGGESTED_PROMPTS.map(({ icon: Icon, label, q }) => (
                      <button
                        key={label}
                        onClick={() => submitQuestion(q)}
                        className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 hover:border-violet-500/30 transition-all group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-slate-700/60 group-hover:bg-violet-500/15 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-3 h-3 text-slate-400 group-hover:text-violet-400 transition-colors" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation / answer area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

                {/* History */}
                {history.slice(0, -1).map(({ question: hq, answer: ha }, idx) => (
                  <div key={idx} className="space-y-2 opacity-60">
                    <div className="flex justify-end">
                      <div className="bg-slate-800/60 rounded-xl px-3.5 py-2 text-[12px] text-slate-300 max-w-[85%] border border-slate-700/40">
                        {hq}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 pl-1 italic line-clamp-2">{ha.summary}</div>
                  </div>
                ))}

                {/* Current question */}
                {answerState !== "idle" && history.length > 0 && (
                  <div className="flex justify-end">
                    <div className="bg-violet-600/20 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 max-w-[85%] border border-violet-500/20 leading-relaxed">
                      {history[history.length - 1]?.question}
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {answerState === "loading" && <LoadingAnswer stage={loadStage} />}

                {/* Error state */}
                {answerState === "error" && (
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                    </div>
                    <div className="flex-1 rounded-xl border border-red-500/25 bg-red-500/6 px-4 py-3.5">
                      <div className="flex items-start gap-2.5 mb-3">
                        <div>
                          <p className="text-[13px] font-semibold text-slate-200 mb-0.5">Something went wrong</p>
                          <p className="text-[12px] text-red-400/80 font-medium">System error — answer could not be generated</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-400 leading-relaxed mb-3">
                        {askError ?? "An unexpected error occurred. Your document is still loaded."}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setAnswerState("idle"); setAskError(null) }}
                          className="flex items-center gap-1.5 text-[12px] font-semibold bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg transition-colors"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" /> Retry
                        </button>
                        <span className="text-[11px] text-slate-500">or try rephrasing your question</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Answer state */}
                {answerState === "done" && answer && (
                  <div className="flex gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      answer.notFoundInDocument ? "bg-amber-500/20" : "bg-violet-500/20"
                    }`}>
                      {answer.notFoundInDocument
                        ? <FileQuestion className="w-3 h-3 text-amber-400" />
                        : <Sparkles className="w-3 h-3 text-violet-400" />
                      }
                    </div>
                    <div className="flex-1 space-y-3">

                      {/* ① SUMMARY — most prominent */}
                      <div className={`rounded-xl border px-4 py-3.5 ${
                        answer.notFoundInDocument
                          ? "border-amber-500/25 bg-amber-500/6"
                          : "border-violet-500/25 bg-violet-500/8"
                      }`}>
                        {answer.notFoundInDocument && (
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Not clearly found in this document</p>
                          </div>
                        )}
                        {!answer.notFoundInDocument && (
                          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">
                            Summary · {answer.confidence === "high" ? "High confidence" : answer.confidence === "medium" ? "Medium confidence" : "Low confidence"}
                          </p>
                        )}
                        <p className="text-[13px] text-slate-200 leading-relaxed font-medium">{answer.summary}</p>
                      </div>

                      {/* ② SOURCE-BACKED FINDINGS */}
                      {answer.findings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest px-0.5">
                            {answer.notFoundInDocument ? "Closest references found" : "Source findings"}
                          </p>
                          {answer.findings.map((f) => {
                            const col = CITATION_COLORS[(f.id - 1) % CITATION_COLORS.length]
                            const isActive = activeCitation?.findingId === f.id
                            const isHovered = hoveredFindingId === f.id

                            return (
                              <div
                                key={f.id}
                                onClick={() => handleCitationClick(f)}
                                className={`rounded-xl px-3.5 py-3 border cursor-pointer transition-all ${
                                  isActive
                                    ? "border-violet-500/30 bg-violet-500/8 shadow-sm"
                                    : "border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600/50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-[12px] font-bold text-slate-200 leading-snug">{f.title}</p>

                                  {/* Citation chip */}
                                  <div className="relative flex-shrink-0">
                                    <CitationChip
                                      finding={f}
                                      active={isActive}
                                      onClick={() => handleCitationClick(f)}
                                      onHoverChange={(h) => setHoveredFindingId(h ? f.id : null)}
                                    />

                                    {/* Source preview popover */}
                                    {isHovered && f.citation.excerpt && (
                                      <div className="absolute right-0 top-7 z-50 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-3 pointer-events-none">
                                        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${col.chip.split(" ")[1]}`}>
                                          {f.citation.section ?? `Page ${f.citation.page}`} · p.{f.citation.page}
                                        </p>
                                        <p className="text-[11px] text-slate-300 italic leading-relaxed line-clamp-3">
                                          "{f.citation.excerpt}"
                                        </p>
                                        <p className="text-[9px] text-slate-500 mt-2">Click to jump to source in document →</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[12px] text-slate-300 leading-relaxed">{f.body}</p>
                                {f.citation.excerpt && (
                                  <p className="text-[11px] text-slate-500 italic mt-1.5 leading-relaxed line-clamp-2">
                                    "{f.citation.excerpt}"
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* ③ FOLLOW-UPS */}
                      {answer.followUps?.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <CornerDownRight className="w-3 h-3" /> Follow-up questions
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {answer.followUps.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => submitQuestion(q)}
                                className="text-left text-[12px] text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-slate-600/50 rounded-lg px-3 py-2 transition-all leading-snug"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-slate-800/50">
                <form
                  onSubmit={(e) => { e.preventDefault(); submitQuestion(question) }}
                  className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5 focus-within:border-violet-500/50 transition-colors"
                >
                  <input
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={answerState === "loading" ? "Generating answer…" : "Ask anything about this document…"}
                    disabled={answerState === "loading" || !sessionId}
                    className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || answerState === "loading" || !sessionId}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-30 enabled:text-violet-400 enabled:hover:bg-violet-500/20 text-slate-600"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-slate-600 text-center mt-1.5">
                  Answers cite exact pages from this document · Always verify critical details
                </p>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
