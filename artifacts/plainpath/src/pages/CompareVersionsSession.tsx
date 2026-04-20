// ─── Compare Versions — Workspace (Slice 2) ────────────────────────────────────
// Dual-pane PDF workspace: Baseline (original) on the left,
// Revised on the right. Both panes render real pdfjs pages, scroll
// independently, and show per-pane page navigation.
//
// Slice 2 scope: render + workspace shell only.
// No diff engine, no overlays, no AI, no scan trigger.
// ──────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef,
} from "react"
import { useLocation } from "wouter"
import * as pdfjsLib from "pdfjs-dist"
import {
  ArrowLeft, Loader2, AlertCircle, Lock,
  FileText, ChevronUp, ChevronDown,
  BarChart2, StickyNote, X, CheckCircle2,
  Clock, ListChecks,
} from "lucide-react"
import { useEntitlements } from "@/hooks/useEntitlements"
import { useCompareVersionsApi } from "@/hooks/useCompareVersionsApi"
import type { CVSessionDetail, CVManagerNotes } from "@/lib/compareVersionsTypes"

// ─── pdfjs worker ─────────────────────────────────────────────────────────────

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const RENDER_SCALE = 1.5

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PageRender {
  dataUrl: string
  w: number
  h: number
}

// ─── usePdfRenderer ────────────────────────────────────────────────────────────
// Identical approach to PDF Editor — renders all pages to JPEG dataUrls via
// pdfjs. Slices the ArrayBuffer before passing to the worker (Strict Mode safe).

function usePdfRenderer(buf: ArrayBuffer | null) {
  const [pages, setPages] = useState<PageRender[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!buf) { setPages([]); setLoading(false); setFailed(false); return }
    let cancelled = false
    setLoading(true); setFailed(false); setPages([])
    ;(async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: buf.slice(0), verbosity: 0 }).promise
        if (cancelled) return
        const renders: PageRender[] = []
        for (let pn = 1; pn <= pdf.numPages; pn++) {
          if (cancelled) break
          const page = await pdf.getPage(pn)
          const vp = page.getViewport({ scale: RENDER_SCALE })
          const canvas = document.createElement("canvas")
          canvas.width = Math.floor(vp.width)
          canvas.height = Math.floor(vp.height)
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp } as any).promise
          renders.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.88), w: canvas.width, h: canvas.height })
          page.cleanup()
        }
        if (!cancelled) { setPages(renders); setLoading(false) }
      } catch (err) {
        console.error("[CompareVersions] usePdfRenderer failed:", err)
        if (!cancelled) { setFailed(true); setLoading(false) }
      }
    })()
    return () => { cancelled = true }
  }, [buf])

  return { pages, loading, failed }
}

// ─── PdfPane ───────────────────────────────────────────────────────────────────
// Scrollable pane that renders PDF pages with a sticky header showing
// the label, filename, page counter and prev / next navigation.

function PdfPane({
  label,
  fileName,
  pages,
  loading,
  failed,
  errorMsg,
  accentClass,
}: {
  label: string
  fileName: string | null | undefined
  pages: PageRender[]
  loading: boolean
  failed: boolean
  errorMsg?: string | null
  accentClass: string
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, pages.length)
  }, [pages.length])

  // Track which page is most visible in the scroll container
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!pages.length) return
    const map = new Map<Element, number>()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = map.get(e.target)
          if (idx !== undefined && e.isIntersecting) setCurrentPage(idx)
        })
      },
      { root: scrollRef.current, threshold: 0.3 },
    )
    pageRefs.current.forEach((el, i) => {
      if (el) { map.set(el, i); observerRef.current!.observe(el) }
    })
    return () => observerRef.current?.disconnect()
  }, [pages.length])

  function scrollToPage(idx: number) {
    const el = pageRefs.current[idx]
    if (el && scrollRef.current) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  function prevPage() {
    const t = Math.max(0, currentPage - 1); setCurrentPage(t); scrollToPage(t)
  }
  function nextPage() {
    const t = Math.min(pages.length - 1, currentPage + 1); setCurrentPage(t); scrollToPage(t)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Sticky pane header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 bg-neutral-200/90 dark:bg-zinc-800/90 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${accentClass}`}>
          {label}
        </span>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{fileName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono mr-1 tabular-nums">
            {loading ? "…" : failed || errorMsg ? "—" : `${pages.length > 0 ? currentPage + 1 : 0} / ${pages.length}`}
          </span>
          <button
            onClick={prevPage}
            disabled={currentPage <= 0 || loading || failed || !!errorMsg}
            title="Previous page"
            className="p-0.5 rounded hover:bg-muted/60 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage >= pages.length - 1 || loading || failed || !!errorMsg}
            title="Next page"
            className="p-0.5 rounded hover:bg-muted/60 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Scrollable page list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70">
        {errorMsg && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-red-500 font-medium">PDF unavailable</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
          </div>
        )}

        {!errorMsg && loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Rendering PDF…</span>
          </div>
        )}

        {!errorMsg && failed && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-red-500 font-medium">Failed to render PDF</p>
            <p className="text-xs text-muted-foreground">The file may be corrupted or in an unsupported format.</p>
          </div>
        )}

        {!errorMsg && !loading && !failed && pages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <FileText className="w-8 h-8 opacity-30" />
            <span className="text-sm">No pages to display</span>
          </div>
        )}

        {!errorMsg && !loading && !failed && pages.length > 0 && (
          <div className="space-y-5 p-5">
            {pages.map((pg, i) => (
              <div
                key={i}
                ref={(el) => { pageRefs.current[i] = el }}
                className="relative rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white select-none"
                style={{ aspectRatio: `${pg.w} / ${pg.h}` }}
              >
                <img
                  src={pg.dataUrl}
                  alt={`Page ${i + 1}`}
                  className="block w-full pointer-events-none"
                  draggable={false}
                />
                {pages.length > 1 && (
                  <span className="absolute top-2 right-2 text-[9px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded pointer-events-none">
                    {i + 1} / {pages.length}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SummaryDrawer ─────────────────────────────────────────────────────────────
// Collapsible bottom drawer — Slice 2 skeleton (no diff results yet).

function SummaryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="flex-shrink-0 border-t border-border/60 bg-background animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Comparison Summary</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="Close summary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-muted-foreground opacity-40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No comparison results yet</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm leading-relaxed">
          Detected changes will appear here once the comparison engine is available.
          Review both documents side-by-side in the panes above in the meantime.
        </p>
      </div>
    </div>
  )
}

// ─── NotesRail ─────────────────────────────────────────────────────────────────
// Right-side overlay rail showing and editing manager_notes.
// Does not shrink the document panes (absolute positioning).

function NotesRail({
  open,
  onClose,
  session,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  session: CVSessionDetail | null
  onSaved: (notes: CVManagerNotes) => void
}) {
  const api = useCompareVersionsApi()
  const [notes, setNotes] = useState<CVManagerNotes>({ freeform: "", watchlist: [] })
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveErr, setSaveErr] = useState(false)

  useEffect(() => {
    if (session?.managerNotes) setNotes(session.managerNotes)
  }, [session?.id, open])

  async function handleSave() {
    if (!session) return
    setSaving(true); setSaveOk(false); setSaveErr(false)
    try {
      await api.updateNotes(session.id, notes)
      setSaveOk(true)
      onSaved(notes)
      setTimeout(() => setSaveOk(false), 2500)
    } catch {
      setSaveErr(true)
      setTimeout(() => setSaveErr(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const watchlist = notes.watchlist ?? []
  const SEV: Record<string, string> = {
    high: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    low: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex flex-col w-80 max-w-[90vw] bg-background border-l border-border/60 shadow-xl animate-in slide-in-from-right-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Manager Notes</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="Close notes"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Freeform notes editor */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Notes
          </label>
          <textarea
            value={notes.freeform ?? ""}
            onChange={(e) => setNotes((n) => ({ ...n, freeform: e.target.value }))}
            placeholder="Add review notes, context, or observations…"
            rows={5}
            className="w-full text-sm rounded-lg border border-border/60 bg-muted/30 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/40 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Watchlist (read-only display — editing watchlist is Slice 4) */}
        {watchlist.length > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" /> Watchlist ({watchlist.length})
            </label>
            <div className="space-y-2">
              {watchlist.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${SEV[item.severity] ?? SEV.low}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug ${item.resolved ? "line-through opacity-50" : ""}`}>
                      {item.text || <em className="opacity-50">No description</em>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold uppercase opacity-70">{item.severity}</span>
                      {item.resolved && <span className="text-[9px] font-bold uppercase opacity-70">· Resolved</span>}
                    </div>
                  </div>
                  {item.resolved && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 opacity-60 mt-0.5" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {watchlist.length === 0 && !notes.freeform && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <StickyNote className="w-7 h-7 text-muted-foreground opacity-25" />
            <p className="text-xs text-muted-foreground opacity-60 leading-relaxed">
              No notes were added during intake.<br />Add notes above to save them.
            </p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border/40 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving || !session}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            saveErr
              ? "bg-red-600 hover:bg-red-700 text-white"
              : saveOk
              ? "bg-teal-600 text-white"
              : saving
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700 text-white"
          }`}
        >
          {saving ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
          ) : saveOk ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
          ) : saveErr ? (
            "Save failed — retry"
          ) : (
            "Save Notes"
          )}
        </button>
      </div>
    </div>
  )
}

// ─── CompareVersionsSession ─────────────────────────────────────────────────────

export default function CompareVersionsSession({ sessionId }: { sessionId: string }) {
  const [, navigate] = useLocation()
  const { isAdmin, entitlements, loading: entLoading } = useEntitlements()
  const api = useCompareVersionsApi()

  const [session, setSession] = useState<CVSessionDetail | null>(null)
  const [originalBuf, setOriginalBuf] = useState<ArrayBuffer | null>(null)
  const [revisedBuf, setRevisedBuf] = useState<ArrayBuffer | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [originalError, setOriginalError] = useState<string | null>(null)
  const [revisedError, setRevisedError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"original" | "revised">("original")
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  const { pages: origPages, loading: origLoading, failed: origFailed } = usePdfRenderer(originalBuf)
  const { pages: revPages, loading: revLoading, failed: revFailed } = usePdfRenderer(revisedBuf)

  const canUse = isAdmin || (entitlements?.toolAccess?.includes("compare-versions") ?? false)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (entLoading) return
    let cancelled = false
    setLoadError(null); setOriginalError(null); setRevisedError(null)

    async function load() {
      try {
        const sess = await api.getSession(sessionId)
        if (cancelled) return
        setSession(sess)

        const [origResult, revResult] = await Promise.allSettled([
          api.getOriginalPdf(sessionId),
          api.getRevisedPdf(sessionId),
        ])
        if (cancelled) return

        if (origResult.status === "fulfilled") {
          setOriginalBuf(origResult.value)
        } else {
          setOriginalError((origResult.reason as any)?.message ?? "Failed to load original PDF")
        }
        if (revResult.status === "fulfilled") {
          setRevisedBuf(revResult.value)
        } else {
          setRevisedError((revResult.reason as any)?.message ?? "Failed to load revised PDF")
        }
      } catch (err: any) {
        if (cancelled) return
        setLoadError(err?.status === 404 ? "Session not found." : "Failed to load session.")
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionId, entLoading])

  useEffect(() => {
    document.title = session?.title
      ? `${session.title} — Compare Versions`
      : "Compare Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [session?.title])

  // ── Guards ────────────────────────────────────────────────────────────────

  if (entLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canUse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Compare Versions requires a Pro plan.</p>
        <button onClick={() => navigate("/upgrade")} className="text-sm text-primary underline">
          Upgrade →
        </button>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="font-medium">{loadError}</p>
        <button
          onClick={() => navigate("/compare-versions")}
          className="text-sm text-muted-foreground underline"
        >
          ← My Comparisons
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Workspace ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* ── Top toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-background/95 backdrop-blur-sm flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate("/compare-versions")}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Back to My Comparisons"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate max-w-[140px] sm:max-w-[280px] lg:max-w-[440px]">
              {session.title}
            </p>
            <p className="text-[10px] text-muted-foreground">Compare Versions · Read only</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => { setSummaryOpen((o) => !o); setNotesOpen(false) }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              summaryOpen
                ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300/60 dark:border-violet-700/40"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            title="Comparison Summary"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Summary</span>
          </button>
          <button
            onClick={() => { setNotesOpen((o) => !o); setSummaryOpen(false) }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              notesOpen
                ? "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-300/60 dark:border-teal-700/40"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            title="Manager Notes"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>
        </div>
      </div>

      {/* ── Mobile tab switcher ── */}
      <div className="flex md:hidden border-b border-border/40 flex-shrink-0 bg-background">
        {(["original", "revised"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? "text-teal-600 dark:text-teal-400 border-teal-500"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab === "original" ? "Baseline" : "Revised"}
          </button>
        ))}
      </div>

      {/* ── Pane area + Notes rail overlay ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left — Baseline (original) */}
        <div
          className={`flex-col h-full overflow-hidden md:w-[48%] md:flex-shrink-0 ${
            activeTab === "original" ? "flex w-full" : "hidden md:flex"
          }`}
        >
          <PdfPane
            label="Baseline · Read only"
            fileName={session.originalFileName}
            pages={origPages}
            loading={origLoading}
            failed={origFailed}
            errorMsg={originalError}
            accentClass="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
          />
        </div>

        {/* Gutter */}
        <div className="hidden md:block w-px bg-border/50 flex-shrink-0" />

        {/* Right — Revised */}
        <div
          className={`flex-col h-full overflow-hidden flex-1 ${
            activeTab === "revised" ? "flex w-full" : "hidden md:flex"
          }`}
        >
          <PdfPane
            label="Revised · Read only"
            fileName={session.revisedFileName}
            pages={revPages}
            loading={revLoading}
            failed={revFailed}
            errorMsg={revisedError}
            accentClass="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
          />
        </div>

        {/* Notes rail — absolute overlay, does not shrink panes */}
        <NotesRail
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          session={session}
          onSaved={(notes) =>
            setSession((s) => (s ? { ...s, managerNotes: notes } : s))
          }
        />
      </div>

      {/* Summary drawer — bottom collapsible */}
      <SummaryDrawer open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </div>
  )
}
