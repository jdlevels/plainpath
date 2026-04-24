// ─── Document Overview Hub ─────────────────────────────────────────────────────
// Default post-upload surface. Document-first flow:
//   upload → overview → drill down into the right tool.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback,
} from "react"
import { useParams, useLocation } from "wouter"
import { useAuth } from "@clerk/react"
import * as pdfjsLib from "pdfjs-dist"
import {
  Upload, FileText, AlertTriangle, Calendar, Users, BookOpen,
  MessageSquare, ChevronRight, ArrowLeft, Shield, EyeOff, Search,
  FileSearch, GitCompare, Bookmark, CheckCircle2, AlertCircle,
  RotateCcw, Clock, ZoomIn, ZoomOut, Maximize2, Minimize2,
  ChevronLeft, ArrowRight, X,
} from "lucide-react"
import { documentOverviewApi } from "@/lib/documentOverviewApi"
import type {
  DocumentOverviewSession,
  DocumentOverview,
  OverviewRisk,
  OverviewDate,
  OverviewParty,
  OverviewObligation,
  OverviewAction,
} from "@/lib/documentOverviewTypes"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const RENDER_SCALE = 1.5

interface PageRender { dataUrl: string; w: number; h: number }

// ─── PDF renderer hook (identical pattern to AskDocument) ─────────────────────
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
          await page.render({ canvasContext: ctx, viewport: vp } as any).promise
          renders.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), w: vp.width, h: vp.height })
          if (cancelled) return
        }
        setPages(renders)
      } catch {
        // rendering failed — viewer shows a placeholder gracefully
      } finally {
        if (!cancelled) setRendering(false)
      }
    })()

    return () => { cancelled = true }
  }, [buffer])

  return { pages, rendering }
}

// ─── Derived tool info ─────────────────────────────────────────────────────────
const TOOL_INFO: Record<string, { label: string; color: string; iconEl: React.ReactNode }> = {
  "ask-document":   { label: "Ask This Document",  color: "text-violet-400 bg-violet-600/10 border-violet-500/20",  iconEl: <MessageSquare className="w-4 h-4" /> },
  "trust-check":    { label: "Trust Check",         color: "text-amber-400 bg-amber-600/10 border-amber-500/20",     iconEl: <Shield className="w-4 h-4" /> },
  "contract-review":{ label: "Contract Review",     color: "text-blue-400 bg-blue-600/10 border-blue-500/20",        iconEl: <FileSearch className="w-4 h-4" /> },
  "clause-extractor":{ label: "Clause Extractor",  color: "text-emerald-400 bg-emerald-600/10 border-emerald-500/20", iconEl: <Bookmark className="w-4 h-4" /> },
  "compare-versions":{ label: "Compare Versions",  color: "text-sky-400 bg-sky-600/10 border-sky-500/20",            iconEl: <GitCompare className="w-4 h-4" /> },
  "redact":         { label: "Redact Sensitive Info",color: "text-red-400 bg-red-600/10 border-red-500/20",           iconEl: <EyeOff className="w-4 h-4" /> },
  "none":           { label: "Take action",         color: "text-white/35 bg-white/[0.04] border-white/[0.08]",       iconEl: <ArrowRight className="w-4 h-4" /> },
}

const ALL_TOOLS = [
  { key: "ask-document",    icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-violet-400 bg-violet-600/10 border-violet-500/20",   desc: "Ask anything, get cited answers" },
  { key: "trust-check",     icon: <Shield className="w-3.5 h-3.5" />,        color: "text-amber-400 bg-amber-600/10 border-amber-500/20",       desc: "Verify signatures & authenticity" },
  { key: "contract-review", icon: <FileSearch className="w-3.5 h-3.5" />,    color: "text-blue-400 bg-blue-600/10 border-blue-500/20",           desc: "Full legal risk analysis" },
  { key: "clause-extractor",icon: <Bookmark className="w-3.5 h-3.5" />,      color: "text-emerald-400 bg-emerald-600/10 border-emerald-500/20", desc: "Pull any specific clause" },
  { key: "compare-versions",icon: <GitCompare className="w-3.5 h-3.5" />,    color: "text-sky-400 bg-sky-600/10 border-sky-500/20",             desc: "Diff against another draft" },
  { key: "redact",          icon: <EyeOff className="w-3.5 h-3.5" />,        color: "text-red-400 bg-red-600/10 border-red-500/20",              desc: "Remove PII before sharing" },
]

function toolRoute(tool: string, askSessionId: string | null): string {
  switch (tool) {
    case "ask-document":   return askSessionId ? `/ask-document/${askSessionId}` : "/ask-document"
    case "trust-check":    return "/import?mode=trust-check"
    case "contract-review":return "/contract-review"
    case "clause-extractor":return "/clause-extractor"
    case "compare-versions":return "/compare-versions"
    case "redact":         return "/redact"
    default:               return "/"
  }
}

// ─── Processing stages ─────────────────────────────────────────────────────────
const STAGES = [
  "Parsing document structure",
  "Extracting entities, dates, and parties",
  "Identifying risks and obligations",
  "Generating your overview",
]

// ─── Citation chip ─────────────────────────────────────────────────────────────
function CitationChip({
  page, section, active, onClick,
}: {
  page: number; section?: string | null; active?: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded text-[10px] font-medium transition-all ${
        active
          ? "bg-violet-500/30 border border-violet-400/50 text-violet-200 ring-1 ring-violet-500/30 scale-105"
          : "bg-violet-600/15 border border-violet-500/20 text-violet-300 hover:bg-violet-500/25 hover:border-violet-400/40"
      }`}
    >
      p.{page}{section ? ` · ${section}` : ""}
    </button>
  )
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      {icon && <span className="text-white/35">{icon}</span>}
      <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">{children}</p>
    </div>
  )
}

// ─── Status badge for recent docs ─────────────────────────────────────────────
function StatusBadge({ status }: { status: DocumentOverviewSession["status"] }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    ready:      { label: "Ready",     cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", icon: <CheckCircle2 className="w-2.5 h-2.5" /> },
    partial:    { label: "Partial",   cls: "bg-amber-500/10 border-amber-500/20 text-amber-300",       icon: <AlertTriangle className="w-2.5 h-2.5" /> },
    analyzing:  { label: "Analyzing", cls: "bg-violet-500/10 border-violet-500/20 text-violet-300",    icon: <Clock className="w-2.5 h-2.5 animate-spin" /> },
    extracting: { label: "Loading",   cls: "bg-white/[0.05] border-white/10 text-white/35",            icon: null },
    error:      { label: "Error",     cls: "bg-red-500/10 border-red-500/20 text-red-300",             icon: <AlertCircle className="w-2.5 h-2.5" /> },
  }
  const { label, cls, icon } = map[status] ?? map.error
  return (
    <div className={`h-5 px-2 rounded-full border flex items-center gap-1 shrink-0 ${cls}`}>
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({
  fileName, status, onBack,
}: {
  fileName?: string; status?: DocumentOverviewSession["status"]; onBack?: () => void
}) {
  return (
    <div className="h-12 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-background">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors mr-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-foreground text-sm font-semibold">Document Overview</span>
      </div>
      {fileName && (
        <>
          <div className="w-px h-4 bg-border" />
          <span className="text-muted-foreground text-xs truncate max-w-[280px]">{fileName}</span>
        </>
      )}
      {status === "ready" && (
        <div className="ml-auto h-6 px-2.5 rounded-full bg-emerald-600/10 border border-emerald-500/20 flex items-center gap-1.5">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-emerald-400 text-[10px] font-medium">Ready</span>
        </div>
      )}
      {status === "partial" && (
        <div className="ml-auto h-6 px-2.5 rounded-full bg-amber-600/10 border border-amber-500/20 flex items-center gap-1.5">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
          <span className="text-amber-400 text-[10px] font-medium">Partial extraction</span>
        </div>
      )}
    </div>
  )
}

// ─── Left: PDF viewer ─────────────────────────────────────────────────────────
function PdfViewer({
  pages, rendering, fileName, pageCount,
  activePage, onClearActive,
}: {
  pages: PageRender[]
  rendering: boolean
  fileName: string
  pageCount: number | null
  activePage: number | null
  onClearActive: () => void
}) {
  const [zoom, setZoom] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Jump to activePage
  useEffect(() => {
    if (activePage == null) return
    setCurrentPage(activePage)
    const el = pageRefs.current[activePage - 1]
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [activePage])

  const total = pageCount ?? pages.length

  return (
    <div className={`flex flex-col bg-[hsl(var(--background))] border-r border-border ${fullscreen ? "fixed inset-0 z-50" : "h-full"}`}>
      {/* Viewer toolbar */}
      <div className="h-10 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <FileText className="w-3.5 h-3.5 text-violet-400/70 shrink-0" />
        <span className="text-muted-foreground text-xs truncate flex-1">{fileName}</span>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-muted-foreground text-[10px] w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={() => setFullscreen(f => !f)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Active citation banner */}
      {activePage != null && (
        <div className="mx-3 mt-2 mb-1 rounded-lg border border-violet-500/25 bg-violet-500/[0.07] px-3 py-1.5 flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 animate-pulse" />
          <p className="text-violet-300/80 text-[10px] flex-1">Viewing source — page {activePage}</p>
          <button onClick={onClearActive} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Pages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {rendering && pages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-muted-foreground text-xs">Rendering pages…</p>
          </div>
        )}
        {pages.length === 0 && !rendering && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-xs">PDF preview unavailable</p>
          </div>
        )}
        {pages.map((page, idx) => {
          const pg = idx + 1
          const isActive = activePage === pg
          return (
            <div
              key={pg}
              ref={el => { pageRefs.current[idx] = el }}
              className={`rounded-lg overflow-hidden transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-violet-500/60 shadow-lg shadow-violet-500/10"
                  : "ring-1 ring-border/50"
              }`}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              {isActive && (
                <div className="bg-violet-600/10 border-b border-violet-500/25 px-3 py-1.5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-violet-300/80 text-[10px] font-medium">Referenced page</span>
                </div>
              )}
              <img
                src={page.dataUrl}
                alt={`Page ${pg}`}
                className="w-full h-auto block"
                style={{ maxWidth: page.w / RENDER_SCALE }}
              />
              <div className="bg-background/80 border-t border-border/50 px-3 py-1 flex items-center justify-between">
                <span className="text-muted-foreground/50 text-[9px]">Page {pg}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Page navigation */}
      {total > 1 && (
        <div className="h-9 border-t border-border flex items-center justify-between px-4 shrink-0">
          <span className="text-muted-foreground text-xs tabular-nums">Page {currentPage} of {total}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); pageRefs.current[p-1]?.scrollIntoView({ behavior: "smooth", block: "center" }) }}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { const p = Math.min(total, currentPage + 1); setCurrentPage(p); pageRefs.current[p-1]?.scrollIntoView({ behavior: "smooth", block: "center" }) }}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
              disabled={currentPage >= total}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Right: Intelligence panel ────────────────────────────────────────────────
function IntelligencePanel({
  session, onCitationClick, activePage, onNavigate,
}: {
  session: DocumentOverviewSession
  onCitationClick: (page: number) => void
  activePage: number | null
  onNavigate: (path: string) => void
}) {
  const ov = session.overview!
  const isPartial = session.status === "partial"
  const urgentActionCount = ov.recommendedActions?.filter(a => a.isUrgent).length ?? 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 flex flex-col gap-4 max-w-2xl">

        {/* Doc header */}
        <div className="flex items-start gap-3 pt-1">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-foreground text-sm font-semibold truncate">{session.fileName}</h1>
              {ov.documentType && (
                <div className="h-5 px-2 rounded-full border border-border bg-accent shrink-0">
                  <span className="text-muted-foreground text-[10px]">{ov.documentType}</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">
              {session.pageCount ? `${session.pageCount} pages` : ""}{" "}
              {session.pageCount && ov.keyParties?.length ? "·" : ""}{" "}
              {ov.keyParties?.map(p => p.name).slice(0, 2).join(" · ")}
            </p>
          </div>
        </div>

        {/* Partial extraction warning */}
        {isPartial && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-600/[0.06] p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200/90 text-sm font-medium mb-0.5">Partial extraction</p>
              <p className="text-amber-300/55 text-xs leading-relaxed">
                This document may be a scanned image or have limited text. The overview is based on what could be read. Confidence: {Math.round((ov.confidence ?? 0.5) * 100)}%.
              </p>
            </div>
          </div>
        )}

        {/* 1. Summary */}
        <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.04] p-4">
          <SectionLabel>Plain-English Summary</SectionLabel>
          <p className="text-foreground/70 text-sm leading-relaxed">{ov.summary}</p>
        </div>

        {/* 2. Risks */}
        {ov.risks && ov.risks.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <SectionLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}>
              Risks &amp; Watchouts
            </SectionLabel>
            <div className="flex flex-col gap-2">
              {ov.risks.map((r, i) => (
                <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 border ${
                  r.level === "high"   ? "border-red-500/20 bg-red-500/[0.04]" :
                  r.level === "medium" ? "border-amber-500/15 bg-amber-500/[0.03]" :
                  "border-border bg-transparent"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    r.level === "high" ? "bg-red-400" : r.level === "medium" ? "bg-amber-400" : "bg-muted-foreground/40"
                  }`} />
                  <p className="text-foreground/65 text-xs leading-relaxed flex-1">{r.text}</p>
                  <CitationChip
                    page={r.page} section={r.section}
                    active={activePage === r.page}
                    onClick={() => onCitationClick(r.page)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3a. Key dates + 3b. Key parties — side by side when content exists */}
        {(ov.keyDates?.length > 0 || ov.keyParties?.length > 0) && (
          <div className={`grid gap-3 ${ov.keyDates?.length > 0 && ov.keyParties?.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
            {ov.keyDates && ov.keyDates.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-3.5">
                <SectionLabel icon={<Calendar className="w-3.5 h-3.5 text-sky-400" />}>Key Dates</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  {ov.keyDates.map((d, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground text-[10px]">{d.label}</p>
                        <p className={`text-xs font-medium leading-tight ${d.isUrgent ? "text-amber-400" : "text-foreground/75"}`}>
                          {d.value}
                          {d.isUrgent && <span className="ml-1 text-[9px] text-amber-400/70">⚠</span>}
                        </p>
                      </div>
                      <CitationChip
                        page={d.page} section={d.section}
                        active={activePage === d.page}
                        onClick={() => onCitationClick(d.page)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ov.keyParties && ov.keyParties.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-3.5">
                <SectionLabel icon={<Users className="w-3.5 h-3.5 text-emerald-400" />}>Key Parties</SectionLabel>
                <div className="flex flex-col gap-3">
                  {ov.keyParties.map((p, i) => (
                    <div key={i}>
                      <p className="text-muted-foreground text-[10px] mb-0.5">{p.role}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-foreground/75 text-xs font-medium flex-1 truncate">{p.name}</p>
                        <CitationChip
                          page={p.page}
                          active={activePage === p.page}
                          onClick={() => onCitationClick(p.page)}
                        />
                      </div>
                      {p.detail && <p className="text-muted-foreground text-[10px]">{p.detail}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3c. Key obligations */}
        {ov.keyObligations && ov.keyObligations.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-3.5">
            <SectionLabel icon={<BookOpen className="w-3.5 h-3.5 text-blue-400" />}>Key Obligations</SectionLabel>
            <div className="flex flex-col gap-2">
              {ov.keyObligations.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`h-4 px-1.5 rounded text-[9px] font-medium shrink-0 flex items-center border ${
                    i % 2 === 0
                      ? "bg-blue-600/10 text-blue-300 border-blue-500/20"
                      : "bg-emerald-600/10 text-emerald-300 border-emerald-500/20"
                  }`}>
                    {o.party}
                  </div>
                  <p className="text-foreground/55 text-xs leading-relaxed flex-1">{o.text}</p>
                  <CitationChip
                    page={o.page} section={o.section}
                    active={activePage === o.page}
                    onClick={() => onCitationClick(o.page)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Recommended next actions — hero */}
        {ov.recommendedActions && ov.recommendedActions.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-border" style={{
            background: "linear-gradient(135deg, hsl(var(--violet-muted, 263 70% 10%)) 0%, transparent 70%)",
          }}>
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-violet-400" />
                </div>
                <p className="text-foreground/90 text-sm font-semibold">Recommended Next Actions</p>
                {urgentActionCount > 0 && (
                  <div className="ml-auto h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="text-red-300/90 text-[9px] font-medium">{urgentActionCount} urgent</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-1 ml-7">Based on what PlainPath found in this document.</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {ov.recommendedActions.map((a, i) => {
                const info = TOOL_INFO[a.tool] ?? TOOL_INFO["none"]
                const route = toolRoute(a.tool, session.askSessionId)
                return (
                  <button
                    key={i}
                    onClick={() => onNavigate(route)}
                    className={`flex items-start gap-3 rounded-lg px-3.5 py-2.5 border text-left transition-all hover:bg-accent group ${
                      a.isUrgent ? "border-border bg-card/50" : "border-border/60 bg-transparent"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${info.color}`}>
                      {info.iconEl}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-medium ${a.isUrgent ? "text-foreground/90" : "text-foreground/65"}`}>{a.action}</p>
                        {a.isUrgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{a.detail}</p>
                    </div>
                    {a.tool !== "none" && (
                      <div className={`shrink-0 h-6 px-2 rounded border text-[10px] flex items-center self-center transition-colors ${info.color}`}>
                        {info.label}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 5. Suggested questions */}
        {ov.suggestedQuestions && ov.suggestedQuestions.length > 0 && (
          <div>
            <SectionLabel icon={<MessageSquare className="w-3.5 h-3.5 text-violet-400/60" />}>
              Suggested Follow-up Questions
            </SectionLabel>
            <div className="flex flex-col gap-1.5">
              {ov.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(toolRoute("ask-document", session.askSessionId))}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/50 hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all text-left group"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400/50 group-hover:text-violet-400 shrink-0 transition-colors" />
                  <span className="text-muted-foreground text-xs group-hover:text-foreground/70 transition-colors flex-1">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-violet-400/50 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. All tools */}
        <div>
          <SectionLabel>All Tools</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {ALL_TOOLS.map((tool) => (
              <button
                key={tool.key}
                onClick={() => onNavigate(toolRoute(tool.key, session.askSessionId))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-accent hover:border-border transition-all text-left group"
              >
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${tool.color}`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground/70 text-xs font-medium leading-none mb-0.5">{TOOL_INFO[tool.key]?.label ?? tool.key}</p>
                  <p className="text-muted-foreground text-[10px] leading-none truncate">{tool.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground/40 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  onFile, recent, loadingRecent,
}: {
  onFile: (f: File) => void
  recent: DocumentOverviewSession[]
  loadingRecent: boolean
}) {
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-10">
      {/* Upload zone */}
      <div className="w-full max-w-lg">
        <div
          ref={dropRef}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-10 flex flex-col items-center text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? "border-violet-500/60 bg-violet-500/[0.04]"
              : "border-border hover:border-violet-500/40 hover:bg-violet-500/[0.02]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
          />
          <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-foreground text-base font-semibold mb-1.5">Drop your document here</h2>
          <p className="text-muted-foreground text-sm mb-5 max-w-xs leading-relaxed">
            PlainPath reads it, surfaces risks, dates, and obligations, and guides you to the right next action.
          </p>
          <div className="h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Choose file
          </div>
          <p className="text-muted-foreground/50 text-xs mt-3">PDF, DOCX, TXT · Up to 50 MB</p>
        </div>
      </div>

      {/* Recent overviews */}
      {(recent.length > 0 || loadingRecent) && (
        <div className="w-full max-w-lg mt-10">
          <p className="text-muted-foreground/50 text-[10px] uppercase tracking-widest font-semibold mb-3">Recent documents</p>
          {loadingRecent ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-border border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {recent.map((s) => (
                <a key={s.sessionId} href={`/document-overview/${s.sessionId}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent border border-border flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-foreground/75 text-sm truncate font-medium group-hover:text-foreground transition-colors">{s.fileName}</p>
                      {s.overview?.documentType && (
                        <div className="h-4 px-1.5 rounded bg-accent border border-border shrink-0">
                          <span className="text-muted-foreground text-[9px]">{s.overview.documentType}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground/50 text-[10px]">
                      {s.pageCount ? `${s.pageCount} pages` : ""}{s.pageCount && " · "}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={s.status} />
                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Processing state ─────────────────────────────────────────────────────────
function ProcessingState({ fileName, stageIndex }: { fileName: string; stageIndex: number }) {
  return (
    <div className="flex-1 flex items-center justify-center px-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-foreground/80 text-sm font-medium">{fileName}</p>
            <p className="text-muted-foreground text-xs">Analyzing with GPT-4o…</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {STAGES.map((stage, i) => {
            const done = i < stageIndex
            const active = i === stageIndex
            const pending = i > stageIndex
            return (
              <div key={i} className={`flex items-center gap-3 transition-all ${pending ? "opacity-30" : ""}`}>
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : active ? (
                    <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border" />
                  )}
                </div>
                <span className={`text-sm ${done ? "text-muted-foreground" : active ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                  {stage}
                </span>
              </div>
            )
          })}
        </div>

        <div className="h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-700"
            style={{ width: `${Math.round((stageIndex / (STAGES.length - 1)) * 100)}%` }}
          />
        </div>
        <p className="text-muted-foreground/40 text-xs text-center mt-3">This usually takes 10–20 seconds.</p>
      </div>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-8">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-foreground text-base font-semibold mb-2">Analysis failed</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DocumentOverview() {
  const params = useParams<{ id?: string }>()
  const [, navigate] = useLocation()
  const { getToken } = useAuth()

  // View states
  const [view, setView] = useState<"empty" | "uploading" | "overview" | "error">("empty")
  const [session, setSession] = useState<DocumentOverviewSession | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [stageIndex, setStageIndex] = useState(0)
  const [fileName, setFileName] = useState("")
  const [recent, setRecent] = useState<DocumentOverviewSession[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)

  // Document viewer
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null)
  const { pages, rendering } = usePdfRenderer(pdfBuffer)
  const [activePage, setActivePage] = useState<number | null>(null)

  // Mobile tab (for responsive layout)
  const [mobileTab, setMobileTab] = useState<"overview" | "document">("overview")

  // Stage timer
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startStageTimer() {
    stageTimerRef.current = setInterval(() => {
      setStageIndex(prev => {
        if (prev >= STAGES.length - 1) {
          // Stay at last stage — waiting for API
          return prev
        }
        return prev + 1
      })
    }, 3000)
  }

  function stopStageTimer() {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current)
      stageTimerRef.current = null
    }
  }

  // Load existing session by ID
  useEffect(() => {
    if (!params.id) return
    ;(async () => {
      try {
        const s = await documentOverviewApi.getSession(params.id!, getToken)
        setSession(s)
        setFileName(s.fileName)
        if (s.status === "error") {
          setErrorMsg(s.errorMessage ?? "Analysis failed.")
          setView("error")
        } else {
          setView("overview")
        }
      } catch (e: any) {
        setErrorMsg(e.message ?? "Could not load session.")
        setView("error")
      }
    })()
  }, [params.id])

  // Load recent sessions for empty state
  useEffect(() => {
    if (params.id) return
    setLoadingRecent(true)
    documentOverviewApi.listSessions(getToken).then(list => {
      setRecent(list.filter(s => s.status === "ready" || s.status === "partial"))
      setLoadingRecent(false)
    }).catch(() => setLoadingRecent(false))
  }, [params.id])

  // Handle file drop/select → upload
  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setView("uploading")
    setStageIndex(0)
    setPdfBuffer(null)
    setActivePage(null)
    startStageTimer()

    // Read file for client-side PDF rendering in parallel
    const reader = new FileReader()
    reader.onload = e => {
      if (e.target?.result instanceof ArrayBuffer) {
        setPdfBuffer(e.target.result)
      }
    }
    reader.readAsArrayBuffer(file)

    try {
      const s = await documentOverviewApi.createSession(file, getToken)
      stopStageTimer()
      setStageIndex(STAGES.length - 1)
      // Short delay so final stage shows as complete
      await new Promise(r => setTimeout(r, 400))
      setSession(s)
      setFileName(s.fileName)
      if (s.status === "error") {
        setErrorMsg(s.errorMessage ?? "Analysis failed.")
        setView("error")
      } else {
        navigate(`/document-overview/${s.sessionId}`, { replace: true })
        setView("overview")
      }
    } catch (e: any) {
      stopStageTimer()
      setErrorMsg(e.message ?? "Upload failed. Please try again.")
      setView("error")
    }
  }, [getToken, navigate])

  useEffect(() => () => stopStageTimer(), [])

  function handleCitationClick(page: number) {
    setActivePage(page)
    if (window.innerWidth < 768) setMobileTab("document")
  }

  function handleNavigate(path: string) {
    navigate(path)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        fileName={session?.fileName ?? (view === "uploading" ? fileName : undefined)}
        status={session?.status}
        onBack={view !== "empty" ? () => { setView("empty"); setSession(null); navigate("/document-overview", { replace: true }) } : undefined}
      />

      {/* Empty */}
      {view === "empty" && (
        <EmptyState onFile={handleFile} recent={recent} loadingRecent={loadingRecent} />
      )}

      {/* Uploading / processing */}
      {view === "uploading" && (
        <ProcessingState fileName={fileName} stageIndex={stageIndex} />
      )}

      {/* Error */}
      {view === "error" && (
        <ErrorState
          message={errorMsg}
          onRetry={() => { setView("empty"); setSession(null); navigate("/document-overview", { replace: true }) }}
        />
      )}

      {/* Overview — desktop split / mobile tabs */}
      {view === "overview" && session?.overview && (
        <>
          {/* Desktop: side-by-side */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <div className="w-[42%] min-w-0 overflow-hidden">
              <PdfViewer
                pages={pages}
                rendering={rendering}
                fileName={session.fileName}
                pageCount={session.pageCount}
                activePage={activePage}
                onClearActive={() => setActivePage(null)}
              />
            </div>
            <IntelligencePanel
              session={session}
              onCitationClick={handleCitationClick}
              activePage={activePage}
              onNavigate={handleNavigate}
            />
          </div>

          {/* Mobile: tabs */}
          <div className="flex md:hidden flex-col flex-1 overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center gap-1 p-2 border-b border-border shrink-0">
              <button
                onClick={() => setMobileTab("overview")}
                className={`flex-1 h-8 rounded-lg text-xs font-medium transition-colors ${mobileTab === "overview" ? "bg-violet-600 text-white" : "text-muted-foreground"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setMobileTab("document")}
                className={`flex-1 h-8 rounded-lg text-xs font-medium transition-colors ${mobileTab === "document" ? "bg-violet-600 text-white" : "text-muted-foreground"}`}
              >
                Document
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {mobileTab === "overview" ? (
                <div className="h-full overflow-y-auto">
                  {activePage != null && (
                    <button
                      onClick={() => setMobileTab("document")}
                      className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500/25 bg-violet-600/[0.06] w-[calc(100%-2rem)]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-300/80 text-xs flex-1">Viewing source — page {activePage}</span>
                      <span className="text-violet-300/60 text-[10px]">Tap to view →</span>
                    </button>
                  )}
                  <IntelligencePanel
                    session={session}
                    onCitationClick={handleCitationClick}
                    activePage={activePage}
                    onNavigate={handleNavigate}
                  />
                </div>
              ) : (
                <>
                  {activePage != null && (
                    <button
                      onClick={() => { setMobileTab("overview"); }}
                      className="mx-3 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-violet-500/25 bg-violet-600/[0.06] w-[calc(100%-1.5rem)] shrink-0"
                    >
                      <ArrowLeft className="w-3 h-3 text-violet-400" />
                      <span className="text-violet-300/80 text-xs">Back to Overview</span>
                    </button>
                  )}
                  <PdfViewer
                    pages={pages}
                    rendering={rendering}
                    fileName={session.fileName}
                    pageCount={session.pageCount}
                    activePage={activePage}
                    onClearActive={() => { setActivePage(null) }}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
