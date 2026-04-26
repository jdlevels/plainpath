// ─── Compare Versions — Workspace (Slices 4–5 + Premium Reader Pass) ──────────
// Slice 4: Group zones, hover/selection sync, severity override, notes CRUD.
// Slice 5: AI semantic enrichment — auto-run + retry, ai_category pills,
//          ai_explanation in summary rows, AI status banners.
// Premium Reader: resizable split panes, per-pane zoom, density toggle,
//                 diff navigator, summary as right-side drawer.
// ──────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from "react"
import { useLocation } from "wouter"
import * as pdfjsLib from "pdfjs-dist"
import {
  ArrowLeft, Loader2, AlertCircle, Lock,
  FileText, ChevronUp, ChevronDown,
  BarChart2, StickyNote, X, CheckCircle2,
  Clock, ListChecks, RefreshCw, Scan,
  ChevronRight, Plus, Trash2, Link2, Pencil,
  ChevronDown as ChevDown,
  Sparkles, Download, XCircle,
  ZoomIn, ZoomOut,
  AlignJustify, AlignLeft,
} from "lucide-react"
import { useEntitlements } from "@/hooks/useEntitlements"
import { useCompareVersionsApi } from "@/hooks/useCompareVersionsApi"
import { isPaywallActive } from "@/lib/billingConfig"
import type {
  CVSessionDetail, CVManagerNotes,
  CVDiffItem, CVDiffResult, CVDiffSeverity, CVDiffChangeType,
  CVGroupZone, CVFreeformNote, CVWatchlistItem, CVNoteSeverity, CVAiCategory,
} from "@/lib/compareVersionsTypes"
import { computeGroupZones } from "@/lib/compareVersionsGrouping"

// ─── pdfjs worker ─────────────────────────────────────────────────────────────

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const RENDER_SCALE = 1.5
const POLL_INTERVAL_MS = 2500
const SEV_RANK: Record<CVDiffSeverity, number> = { high: 0, medium: 1, low: 2 }

type Density = "compact" | "comfortable"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PageRender { dataUrl: string; w: number; h: number }
interface PopoverState { items: CVDiffItem[]; x: number; y: number }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function severityLabel(item: CVDiffItem): string {
  if (item.signal_type) return humanSignalType(item.signal_type)
  switch (item.change_type) {
    case "visual_change":     return "Layout Change"
    case "added_page":        return "Page Added"
    case "removed_page":      return "Page Removed"
    case "text_added":        return "Text Added"
    case "text_removed":      return "Text Removed"
    case "text_modified":     return "Text Modified"
    case "structural_signal": return "Structural Change"
  }
}

function humanSignalType(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function severityBadgeClass(sev: CVDiffSeverity): string {
  switch (sev) {
    case "high":   return "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300/60 dark:border-red-800/40"
    case "medium": return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/40"
    case "low":    return "bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border border-neutral-300/50 dark:border-neutral-700/40"
  }
}

function normalizeNotes(mn: any): CVManagerNotes {
  return {
    freeform: mn?.freeform ?? "",
    notes: (mn?.notes ?? []).map((n: any): CVFreeformNote => ({
      id: n.id ?? crypto.randomUUID(),
      type: "freeform",
      text: n.text ?? "",
      resolved: n.resolved ?? false,
      created_at: n.created_at ?? new Date().toISOString(),
      linked_diff_id: n.linked_diff_id ?? null,
    })),
    watchlist: (mn?.watchlist ?? []).map((w: any): CVWatchlistItem => ({
      id: w.id ?? crypto.randomUUID(),
      type: "watchlist",
      text: w.text ?? "",
      severity: ((w.severity ?? "low") as string).toLowerCase() as CVNoteSeverity,
      resolved: w.resolved ?? false,
      created_at: w.created_at ?? new Date().toISOString(),
      linked_diff_id: w.linked_diff_id ?? null,
    })),
  }
}

// ─── AI Category helpers (Slice 5) ────────────────────────────────────────────

function aiCategoryColor(cat: CVAiCategory): string {
  switch (cat) {
    case "financial_value":
    case "date_deadline":
    case "safety_threshold":
      return "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50"
    case "legal_language":
    case "policy_change":
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50"
    case "meaning_change":
      return "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200/50"
    case "rewrite_equivalent":
      return "bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 border border-blue-200/50"
    default:
      return "bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 border border-neutral-200/40"
  }
}

function aiCategoryLabel(cat: CVAiCategory): string {
  return cat.replace(/_/g, " ")
}

function recomputeStats(items: CVDiffItem[], base: CVDiffResult): CVDiffResult {
  const pages = new Set<number>()
  let high = 0, medium = 0, low = 0
  for (const item of items) {
    if (item.severity === "high") high++
    else if (item.severity === "medium") medium++
    else low++
    if (item.page_original != null) pages.add(item.page_original)
    if (item.page_revised != null) pages.add(item.page_revised)
  }
  return { ...base, items, stats: { total: items.length, high, medium, low, pagesWithDiffs: pages.size } }
}

// ─── Group zone visual helpers ─────────────────────────────────────────────────

function groupZoneBase(zone: CVGroupZone, selected: boolean, hovered: boolean): string {
  const isAdded = zone.containsAdded && !zone.containsRemoved
  let bg = ""
  let border = ""
  if (isAdded) {
    bg = hovered ? "bg-blue-400/30" : "bg-blue-400/[0.18]"
    border = "border-blue-500/80 border-dashed"
  } else {
    switch (zone.highestSeverity) {
      case "high":
        bg = hovered ? "bg-red-400/30" : "bg-red-400/[0.18]"
        border = "border-red-500/80 border-dashed"
        break
      case "medium":
        bg = hovered ? "bg-amber-400/30" : "bg-amber-400/[0.18]"
        border = "border-amber-500/80 border-dashed"
        break
      case "low":
        bg = hovered ? "bg-neutral-400/20" : "bg-neutral-400/[0.12]"
        border = "border-neutral-400/70 border-dashed"
        break
    }
  }
  const ring = selected ? " ring-2 ring-violet-500 ring-offset-1" : ""
  return `absolute border-2 cursor-pointer transition-all duration-100 pointer-events-auto rounded ${bg} ${border}${ring}`
}

// ─── usePdfRenderer ────────────────────────────────────────────────────────────

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

// ─── MiniPopover ───────────────────────────────────────────────────────────────

function MiniPopover({
  state, items, onSelect, onClose,
}: {
  state: PopoverState
  items: CVDiffItem[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", keyHandler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", keyHandler)
    }
  }, [onClose])

  const left = Math.min(state.x, window.innerWidth - 260)
  const top = Math.min(state.y, window.innerHeight - 280)

  return (
    <div
      ref={ref}
      className="fixed z-[200] bg-background border border-border/60 rounded-xl shadow-xl p-2 min-w-[220px] max-w-[280px] max-h-[260px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
      style={{ left, top }}
    >
      <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-border/30">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {state.items.length} changes in zone
        </span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted text-muted-foreground">
          <X className="w-3 h-3" />
        </button>
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => { onSelect(item.id); onClose() }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-muted/60 transition-colors"
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            item.severity === "high" ? "bg-red-500" :
            item.severity === "medium" ? "bg-amber-500" : "bg-neutral-400"
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{severityLabel(item)}</p>
            {(item.original_text || item.revised_text) && (
              <p className="text-[10px] text-muted-foreground truncate">
                {(item.revised_text ?? item.original_text ?? "").slice(0, 50)}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── PdfPane ───────────────────────────────────────────────────────────────────
// Manages its own zoom state. Exposes fit-width (default) and percentage zoom.
// Wrapped in React.memo with a custom comparator so parent state changes that
// don't affect viewer content (summaryOpen, density, diffNavIdx…) don't
// cause the expensive page image list to re-render and flash.

type ZoomMode = "fit-width" | "fit-page" | "custom"

const PdfPane = memo(function PdfPane({
  label, fileName, pages, loading, failed, errorMsg,
  accentClass, groups,
  selectedDiffId, hoveredItemIds,
  jumpPage,
  onGroupClick, onGroupHover, onGroupLeave,
}: {
  label: string
  fileName: string | null | undefined
  pages: PageRender[]
  loading: boolean
  failed: boolean
  errorMsg?: string | null
  accentClass: string
  groups: CVGroupZone[]
  selectedDiffId: string | null
  hoveredItemIds: string[]
  jumpPage: number | null
  onGroupClick: (zone: CVGroupZone, clientX: number, clientY: number) => void
  onGroupHover: (zone: CVGroupZone) => void
  onGroupLeave: () => void
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit-width")
  const [zoomPct, setZoomPct] = useState(100)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const hoveredSet = useMemo(() => new Set(hoveredItemIds), [hoveredItemIds])

  function applyZoom(mode: ZoomMode, pct?: number) {
    setZoomMode(mode)
    if (pct !== undefined) setZoomPct(pct)
  }

  function zoomIn() {
    const steps = [50, 75, 100, 125, 150, 175, 200, 250, 300]
    const cur = zoomMode === "fit-width" ? 100 : zoomPct
    const next = steps.find((s) => s > cur) ?? 300
    applyZoom("custom", next)
  }

  function zoomOut() {
    const steps = [300, 250, 200, 175, 150, 125, 100, 75, 50]
    const cur = zoomMode === "fit-width" ? 100 : zoomPct
    const next = steps.find((s) => s < cur) ?? 50
    applyZoom("custom", next)
  }

  function fitWidth() { applyZoom("fit-width") }

  const pageWidthStyle: React.CSSProperties =
    zoomMode === "fit-width" ? { width: "100%" } : { width: `${zoomPct}%` }

  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, pages.length)
  }, [pages.length])

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

  useEffect(() => {
    if (jumpPage == null || jumpPage < 1) return
    const idx = jumpPage - 1
    if (idx >= pages.length) return
    const el = pageRefs.current[idx]
    if (el && scrollRef.current) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setCurrentPage(idx) }
  }, [jumpPage])

  function scrollToPage(idx: number) {
    const el = pageRefs.current[idx]
    if (el && scrollRef.current) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  function prevPage() { const t = Math.max(0, currentPage - 1); setCurrentPage(t); scrollToPage(t) }
  function nextPage() { const t = Math.min(pages.length - 1, currentPage + 1); setCurrentPage(t); scrollToPage(t) }

  function groupsForPage(pageNum: number): CVGroupZone[] {
    return groups.filter((g) => g.page === pageNum)
  }

  const zoomLabel = zoomMode === "fit-width" ? "Fit" : `${zoomPct}%`
  const canZoomOut = zoomMode === "fit-width" ? false : zoomPct > 50
  const canZoomIn  = zoomMode === "custom" ? zoomPct < 300 : true

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Pane header ── */}
      <div className="sticky top-0 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100/95 dark:bg-zinc-800/95 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0 ${accentClass}`}>
          {label}
        </span>
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">{fileName ?? "—"}</span>
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums mr-0.5">
            {loading ? "…" : failed || errorMsg ? "—" : `${pages.length > 0 ? currentPage + 1 : 0}/${pages.length}`}
          </span>
          <button onClick={prevPage} disabled={currentPage <= 0 || loading || failed || !!errorMsg}
            className="p-0.5 rounded hover:bg-muted/70 disabled:opacity-30 transition-colors" title="Previous page">
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={nextPage} disabled={currentPage >= pages.length - 1 || loading || failed || !!errorMsg}
            className="p-0.5 rounded hover:bg-muted/70 disabled:opacity-30 transition-colors" title="Next page">
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-0 border border-border/50 rounded-md overflow-hidden flex-shrink-0">
          <button onClick={zoomOut} disabled={!canZoomOut}
            className="px-1 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 transition-colors" title="Zoom out">
            <ZoomOut className="w-3 h-3" />
          </button>
          <button onClick={fitWidth}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold transition-colors border-x border-border/40 ${
              zoomMode === "fit-width" ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
            title="Fit to pane width"
          >
            {zoomLabel}
          </button>
          <button onClick={zoomIn} disabled={!canZoomIn}
            className="px-1 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 transition-colors" title="Zoom in">
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Page scroll area ── */}
      <div
        ref={scrollRef}
        className={`flex-1 bg-neutral-200/60 dark:bg-zinc-900/70 ${zoomMode === "custom" && zoomPct > 100 ? "overflow-auto" : "overflow-y-auto overflow-x-hidden"}`}
      >
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
          <div className="space-y-4 p-4">
            {pages.map((pg, i) => {
              const pageNum = i + 1
              const pageGroups = groupsForPage(pageNum)
              return (
                <div
                  key={i}
                  ref={(el) => { pageRefs.current[i] = el }}
                  className="relative rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white select-none mx-auto"
                  style={{ ...pageWidthStyle, aspectRatio: `${pg.w} / ${pg.h}` }}
                >
                  <img src={pg.dataUrl} alt={`Page ${pageNum}`} className="block w-full pointer-events-none" draggable={false} />
                  {pages.length > 1 && (
                    <span className="absolute top-2 right-2 text-[9px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded pointer-events-none z-10">
                      {pageNum} / {pages.length}
                    </span>
                  )}
                  {pageGroups.map((zone) => {
                    const { rect } = zone
                    const isSelected = selectedDiffId != null && zone.itemIds.includes(selectedDiffId)
                    const isHovered = zone.itemIds.some((id) => hoveredSet.has(id))
                    return (
                      <div
                        key={zone.id}
                        className={groupZoneBase(zone, isSelected, isHovered)}
                        style={{
                          left: `${rect.x * 100}%`,
                          top: `${rect.y * 100}%`,
                          width: `${Math.max(rect.w * 100, 2)}%`,
                          height: `${Math.max(rect.h * 100, 0.5)}%`,
                          minHeight: "4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onGroupClick(zone, e.clientX, e.clientY + 12)
                        }}
                        onMouseEnter={() => onGroupHover(zone)}
                        onMouseLeave={() => onGroupLeave()}
                        title={zone.itemIds.length > 1 ? `${zone.itemIds.length} changes in this zone` : severityLabel(
                          { change_type: "visual_change", signal_type: null, severity: zone.highestSeverity } as any
                        )}
                      >
                        {zone.itemIds.length > 1 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold bg-violet-600 text-white shadow z-10 pointer-events-none">
                            {zone.itemIds.length}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}, (prev, next) => {
  // Only re-render if viewer-relevant props changed.
  // Comparator returns true = equal = skip re-render.
  if (prev.pages       !== next.pages)       return false
  if (prev.loading     !== next.loading)     return false
  if (prev.failed      !== next.failed)      return false
  if (prev.errorMsg    !== next.errorMsg)    return false
  if (prev.groups      !== next.groups)      return false
  if (prev.jumpPage    !== next.jumpPage)    return false
  if (prev.selectedDiffId !== next.selectedDiffId) return false
  // Callback identity — stable when wrapped in useCallback
  if (prev.onGroupClick !== next.onGroupClick) return false
  if (prev.onGroupHover !== next.onGroupHover) return false
  if (prev.onGroupLeave !== next.onGroupLeave) return false
  // Compare hoveredItemIds by content, not reference
  if (prev.hoveredItemIds.length !== next.hoveredItemIds.length) return false
  for (let i = 0; i < prev.hoveredItemIds.length; i++) {
    if (prev.hoveredItemIds[i] !== next.hoveredItemIds[i]) return false
  }
  return true
})

// ─── SummaryPanel ──────────────────────────────────────────────────────────────
// Permanent right column on desktop; full-width on mobile "Changes" tab.

type CVChangeFilter = "all" | "added" | "removed" | "modified" | "high_impact" | "dates" | "money" | "obligations" | "legal"

function changeTypeLabel(item: CVDiffItem): string {
  if (item.change_type === "text_added" || item.change_type === "added_page") return "Added"
  if (item.change_type === "text_removed" || item.change_type === "removed_page") return "Removed"
  return "Modified"
}

function changeTypeBadge(item: CVDiffItem): string {
  const t = item.change_type
  if (t === "text_added" || t === "added_page")
    return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
  if (t === "text_removed" || t === "removed_page")
    return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300"
  return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
}

function matchesCVFilter(item: CVDiffItem, filter: CVChangeFilter): boolean {
  switch (filter) {
    case "all": return true
    case "added": return item.change_type === "text_added" || item.change_type === "added_page"
    case "removed": return item.change_type === "text_removed" || item.change_type === "removed_page"
    case "modified": return item.change_type === "text_modified" || item.change_type === "visual_change" || item.change_type === "structural_signal"
    case "high_impact": return item.severity === "high" || item.ai_category === "financial_value" || item.ai_category === "date_deadline" || item.ai_category === "safety_threshold"
    case "dates": return item.ai_category === "date_deadline"
    case "money": return item.ai_category === "financial_value"
    case "obligations": return item.ai_category === "policy_change" || item.ai_category === "meaning_change"
    case "legal": return item.ai_category === "legal_language"
  }
}

const CV_FILTER_CHIPS: { key: CVChangeFilter; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "added",       label: "Added" },
  { key: "removed",     label: "Removed" },
  { key: "modified",    label: "Modified" },
  { key: "high_impact", label: "High Impact" },
  { key: "dates",       label: "Dates" },
  { key: "money",       label: "Money" },
  { key: "obligations", label: "Obligations" },
  { key: "legal",       label: "Legal" },
]

function SummaryPanel({
  diffItems, selectedDiffId,
  onSelectItem, onHoverItem, onLeaveItem,
  onSeverityChange,
  linkedNoteIds,
  onRejectToggle,
  density,
}: {
  diffItems: CVDiffItem[]
  selectedDiffId: string | null
  onSelectItem: (id: string) => void
  onHoverItem: (ids: string[]) => void
  onLeaveItem: () => void
  onSeverityChange: (itemId: string, sev: CVDiffSeverity) => void
  linkedNoteIds: Set<string>
  onRejectToggle: (id: string) => void
  density: Density
}) {
  const [cvFilter, setCvFilter] = useState<CVChangeFilter>("all")
  const [pageFilter, setPageFilter] = useState<number | null>(null)
  const [showPageDrop, setShowPageDrop] = useState(false)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pageDropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPageDrop) return
    function handler(e: MouseEvent) {
      if (pageDropRef.current && !pageDropRef.current.contains(e.target as Node)) setShowPageDrop(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showPageDrop])

  useEffect(() => {
    if (!selectedDiffId) return
    const el = itemRefs.current[selectedDiffId]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedDiffId])

  useEffect(() => { setPageFilter(null) }, [cvFilter])

  const cvFiltered = useMemo(() => diffItems.filter((i) => matchesCVFilter(i, cvFilter)), [diffItems, cvFilter])

  const pagesWithItems = useMemo(() => {
    const pSet = new Set<number>()
    for (const item of cvFiltered) {
      if (item.page_original != null) pSet.add(item.page_original)
      if (item.page_revised != null) pSet.add(item.page_revised)
    }
    return [...pSet].sort((a, b) => a - b)
  }, [cvFiltered])

  const visibleItems = useMemo(() => {
    const list = pageFilter == null ? cvFiltered : cvFiltered.filter((i) =>
      i.page_original === pageFilter || i.page_revised === pageFilter
    )
    return [...list].sort((a, b) => {
      const sd = SEV_RANK[a.severity] - SEV_RANK[b.severity]
      if (sd !== 0) return sd
      const pa = a.page_original ?? a.page_revised ?? 9999
      const pb = b.page_original ?? b.page_revised ?? 9999
      return pa - pb
    })
  }, [cvFiltered, pageFilter])

  const stats = useMemo(() => {
    const added    = diffItems.filter((i) => matchesCVFilter(i, "added")).length
    const removed  = diffItems.filter((i) => matchesCVFilter(i, "removed")).length
    const modified = diffItems.filter((i) => matchesCVFilter(i, "modified")).length
    const high     = diffItems.filter((i) => i.severity === "high").length
    const dates    = diffItems.filter((i) => i.ai_category === "date_deadline").length
    const money    = diffItems.filter((i) => i.ai_category === "financial_value").length
    const withPage = diffItems.filter((i) => i.page_original != null || i.page_revised != null).length
    return { total: diffItems.length, added, removed, modified, high, dates, money, withPage }
  }, [diffItems])

  const rejectedCount = diffItems.filter((i) => i.review_status === "rejected").length
  const rowPy = density === "compact" ? "py-2" : "py-3"

  const chipActive = (key: CVChangeFilter) =>
    key === cvFilter
      ? "bg-teal-600 text-white border-teal-600"
      : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/80"

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Change Intelligence</span>
          {stats.total > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">{stats.total}</span>
          )}
          {rejectedCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
              {rejectedCount} rejected
            </span>
          )}
        </div>
        {pagesWithItems.length > 1 && (
          <div ref={pageDropRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowPageDrop((o) => !o)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium transition-colors ${
                pageFilter != null
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300/60"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {pageFilter != null ? `p.${pageFilter}` : "Page"}
              <ChevDown className="w-3 h-3" />
            </button>
            {showPageDrop && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border/60 rounded-lg shadow-xl py-1 min-w-[90px]">
                <button type="button"
                  onClick={() => { setPageFilter(null); setShowPageDrop(false) }}
                  className={`w-full text-left px-3 py-1 text-xs hover:bg-muted/60 transition-colors ${pageFilter == null ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >All pages</button>
                {pagesWithItems.map((pg) => (
                  <button type="button" key={pg}
                    onClick={() => { setPageFilter(pg); setShowPageDrop(false) }}
                    className={`w-full text-left px-3 py-1 text-xs hover:bg-muted/60 transition-colors ${pageFilter === pg ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >Page {pg}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stat chips */}
      {diffItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-border/30 flex-shrink-0">
          <button type="button" onClick={() => setCvFilter("all")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${chipActive("all")}`}>
            Total <span className="opacity-80">{stats.total}</span>
          </button>
          {stats.added > 0 && (
            <button type="button" onClick={() => setCvFilter("added")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${chipActive("added")}`}>
              + Added <span className="opacity-80">{stats.added}</span>
            </button>
          )}
          {stats.removed > 0 && (
            <button type="button" onClick={() => setCvFilter("removed")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${chipActive("removed")}`}>
              − Removed <span className="opacity-80">{stats.removed}</span>
            </button>
          )}
          {stats.modified > 0 && (
            <button type="button" onClick={() => setCvFilter("modified")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${chipActive("modified")}`}>
              ~ Modified <span className="opacity-80">{stats.modified}</span>
            </button>
          )}
          {stats.high > 0 && (
            <button type="button" onClick={() => setCvFilter("high_impact")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${cvFilter === "high_impact" ? "bg-red-600 text-white border-red-600" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/60 hover:bg-red-100"}`}>
              ⚑ High Impact <span className="opacity-80">{stats.high}</span>
            </button>
          )}
          {stats.dates > 0 && (
            <button type="button" onClick={() => setCvFilter("dates")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${chipActive("dates")}`}>
              Dates <span className="opacity-80">{stats.dates}</span>
            </button>
          )}
          {stats.money > 0 && (
            <button type="button" onClick={() => setCvFilter("money")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${chipActive("money")}`}>
              Money <span className="opacity-80">{stats.money}</span>
            </button>
          )}
        </div>
      )}

      {/* Filter chips row */}
      {diffItems.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/20 flex-shrink-0 overflow-x-auto hide-scrollbar">
          {CV_FILTER_CHIPS.map(({ key, label }) => (
            <button type="button" key={key}
              onClick={() => setCvFilter(key)}
              className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${chipActive(key)}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {diffItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-muted-foreground opacity-40" />
            </div>
            <p className="text-sm text-muted-foreground">No differences found.</p>
            <p className="text-xs text-muted-foreground/60">Upload a revised document to see changes.</p>
          </div>
        )}

        {diffItems.length > 0 && visibleItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
            <p className="text-sm text-muted-foreground">No {cvFilter !== "all" ? cvFilter.replace("_", " ") + " " : ""}changes{pageFilter != null ? ` on page ${pageFilter}` : ""}.</p>
          </div>
        )}

        {visibleItems.length > 0 && (
          <div className="divide-y divide-border/20">
            {visibleItems.map((item) => {
              const isSelected = selectedDiffId === item.id
              const pageLabel =
                item.page_original != null && item.page_revised != null
                  ? `p.${item.page_original} → p.${item.page_revised}`
                  : item.page_original != null ? `p.${item.page_original} baseline`
                  : item.page_revised != null  ? `p.${item.page_revised} revised`
                  : null
              const hasLinkedNote = linkedNoteIds.has(item.id)
              const isRejected = item.review_status === "rejected"
              const hasSource = item.page_original != null || item.page_revised != null

              return (
                <div
                  key={item.id}
                  ref={(el) => { itemRefs.current[item.id] = el as HTMLDivElement | null }}
                  className={`flex items-stretch gap-0 transition-colors ${
                    isRejected ? "bg-red-50/60 dark:bg-red-950/20"
                    : isSelected ? "bg-violet-50 dark:bg-violet-950/30"
                    : "hover:bg-muted/30"
                  }`}
                  onMouseEnter={() => onHoverItem([item.id])}
                  onMouseLeave={() => onLeaveItem()}
                >
                  <div className={`w-0.5 flex-shrink-0 rounded-l ${
                    isRejected ? "bg-red-400" : isSelected ? "bg-violet-500" : "bg-transparent"
                  }`} />

                  <div className={`flex-1 min-w-0 px-2.5 ${rowPy}`}>
                    {/* Top row: change type + severity + page */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${changeTypeBadge(item)}`}>
                        {changeTypeLabel(item)}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${severityBadgeClass(item.severity)}`}>
                        {item.severity}
                      </span>
                      {pageLabel && (
                        <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{pageLabel}</span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-0.5 text-[9px] text-red-600 dark:text-red-400 font-semibold flex-shrink-0">
                          <XCircle className="w-2.5 h-2.5" /> rejected
                        </span>
                      )}
                      {item.severity_overridden && (
                        <span className="flex items-center gap-0.5 text-[9px] text-violet-600 dark:text-violet-400 font-semibold flex-shrink-0">
                          <Pencil className="w-2.5 h-2.5" /> overridden
                        </span>
                      )}
                      {hasLinkedNote && (
                        <span className="flex items-center gap-0.5 text-[9px] text-teal-600 dark:text-teal-400 font-semibold flex-shrink-0">
                          <Link2 className="w-2.5 h-2.5" /> note
                        </span>
                      )}
                      {item.ai_category && (
                        <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-px rounded font-semibold flex-shrink-0 ${aiCategoryColor(item.ai_category)}`}>
                          <Sparkles className="w-2 h-2" />
                          {aiCategoryLabel(item.ai_category)}
                        </span>
                      )}
                    </div>

                    {/* Change title */}
                    <button
                      type="button"
                      onClick={() => onSelectItem(item.id)}
                      className={`w-full text-left text-xs font-medium leading-snug mb-1.5 ${isRejected ? "text-muted-foreground line-through" : "text-foreground hover:text-teal-700 dark:hover:text-teal-300"}`}
                    >
                      {severityLabel(item)}
                    </button>

                    {/* AI plain-English impact */}
                    {item.ai_explanation && (
                      <p className="text-[11px] text-violet-600/80 dark:text-violet-400/80 leading-snug mb-1.5 line-clamp-2">
                        {item.ai_explanation}
                      </p>
                    )}

                    {/* Before / After snippets */}
                    {density !== "compact" && (
                      <>
                        {item.original_text && (
                          <div className="mt-1 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30 px-2 py-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-0.5">Before</p>
                            <p className="text-[11px] text-red-800 dark:text-red-300 leading-snug line-clamp-2">{item.original_text}</p>
                          </div>
                        )}
                        {item.revised_text && (
                          <div className="mt-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">After</p>
                            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug line-clamp-2">{item.revised_text}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Source banner (only when selected) */}
                    {isSelected && (
                      <div className={`mt-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
                        hasSource
                          ? "bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/30 text-teal-700 dark:text-teal-300"
                          : "bg-muted/50 border border-border/30 text-muted-foreground"
                      }`}>
                        {hasSource ? (
                          <>
                            Source: {item.page_original != null ? `p.${item.page_original} (Baseline)` : ""}
                            {item.page_original != null && item.page_revised != null ? " → " : ""}
                            {item.page_revised != null ? `p.${item.page_revised} (Revised)` : ""}
                          </>
                        ) : "No exact source location found"}
                      </div>
                    )}

                    {/* Review action row */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button type="button"
                        onClick={() => onSelectItem(item.id)}
                        className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Review in document →
                      </button>
                      <div className="flex-1" />
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); onRejectToggle(item.id) }}
                        title={isRejected ? "Un-reject" : "Reject"}
                        className={`flex items-center gap-0.5 text-[9px] font-semibold transition-colors ${
                          isRejected ? "text-red-500 hover:text-muted-foreground" : "text-muted-foreground/50 hover:text-red-500"
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        {isRejected ? "Un-reject" : "Reject"}
                      </button>
                      <select
                        value={item.severity}
                        onChange={(e) => { e.stopPropagation(); onSeverityChange(item.id, e.target.value as CVDiffSeverity) }}
                        onClick={(e) => e.stopPropagation()}
                        title="Override severity"
                        className="text-[10px] font-semibold rounded border border-border/50 bg-muted/40 px-1 py-0.5 cursor-pointer focus:outline-none appearance-none text-center"
                        style={{ minWidth: "48px" }}
                      >
                        <option value="high">High</option>
                        <option value="medium">Med</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── NotesRail ─────────────────────────────────────────────────────────────────

function NotesRail({
  open, onClose, session, selectedDiffId, onSaved,
}: {
  open: boolean
  onClose: () => void
  session: CVSessionDetail | null
  selectedDiffId: string | null
  onSaved: (notes: CVManagerNotes) => void
}) {
  const api = useCompareVersionsApi()
  const [notes, setNotes] = useState<CVManagerNotes>({ freeform: "", notes: [], watchlist: [] })
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const [addingWatch, setAddingWatch] = useState(false)
  const [newNoteText, setNewNoteText] = useState("")
  const [newWatchText, setNewWatchText] = useState("")
  const [newWatchSev, setNewWatchSev] = useState<CVNoteSeverity>("medium")

  useEffect(() => {
    if (session?.managerNotes) setNotes(normalizeNotes(session.managerNotes))
  }, [session?.id, open])

  async function persistNotes(next: CVManagerNotes) {
    if (!session) return
    setNotes(next)
    setSaving(true); setSaveErr(false)
    try {
      await api.updateNotes(session.id, next)
      onSaved(next)
    } catch {
      setSaveErr(true)
      setTimeout(() => setSaveErr(false), 3000)
    } finally { setSaving(false) }
  }

  function addNote() {
    if (!newNoteText.trim()) return
    const note: CVFreeformNote = {
      id: crypto.randomUUID(), type: "freeform", text: newNoteText.trim(),
      resolved: false, created_at: new Date().toISOString(), linked_diff_id: null,
    }
    persistNotes({ ...notes, notes: [note, ...(notes.notes ?? [])] })
    setNewNoteText(""); setAddingNote(false)
  }

  function deleteNote(id: string) {
    persistNotes({ ...notes, notes: (notes.notes ?? []).filter((n) => n.id !== id) })
  }

  function toggleNoteResolved(id: string) {
    persistNotes({ ...notes, notes: (notes.notes ?? []).map((n) => n.id === id ? { ...n, resolved: !n.resolved } : n) })
  }

  function linkNoteToSelected(id: string) {
    if (!selectedDiffId) return
    persistNotes({
      ...notes,
      notes: (notes.notes ?? []).map((n) => n.id === id ? { ...n, linked_diff_id: n.linked_diff_id === selectedDiffId ? null : selectedDiffId } : n),
    })
  }

  function addWatchlistItem() {
    if (!newWatchText.trim()) return
    const item: CVWatchlistItem = {
      id: crypto.randomUUID(), type: "watchlist", text: newWatchText.trim(),
      severity: newWatchSev, resolved: false, created_at: new Date().toISOString(), linked_diff_id: null,
    }
    persistNotes({ ...notes, watchlist: [item, ...notes.watchlist] })
    setNewWatchText(""); setAddingWatch(false)
  }

  function deleteWatchlistItem(id: string) {
    persistNotes({ ...notes, watchlist: notes.watchlist.filter((w) => w.id !== id) })
  }

  function toggleWatchResolved(id: string) {
    persistNotes({ ...notes, watchlist: notes.watchlist.map((w) => w.id === id ? { ...w, resolved: !w.resolved } : w) })
  }

  function linkWatchToSelected(id: string) {
    if (!selectedDiffId) return
    persistNotes({
      ...notes,
      watchlist: notes.watchlist.map((w) => w.id === id ? { ...w, linked_diff_id: w.linked_diff_id === selectedDiffId ? null : selectedDiffId } : w),
    })
  }

  function saveFreeform() { persistNotes(notes) }

  if (!open) return null

  const sortedNotes = [...(notes.notes ?? [])].sort((a, b) =>
    Number(a.resolved) - Number(b.resolved) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const sortedWatch = [...notes.watchlist].sort((a, b) =>
    Number(a.resolved) - Number(b.resolved) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const SEV_CLS: Record<CVNoteSeverity, string> = {
    high:   "text-red-600 dark:text-red-400",
    medium: "text-amber-600 dark:text-amber-400",
    low:    "text-sky-600 dark:text-sky-400",
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex flex-col w-80 max-w-[92vw] bg-background border-l border-border/60 shadow-xl animate-in slide-in-from-right-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Manager Notes</span>
          {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          {saveErr && <span className="text-[10px] text-red-500">Save failed</span>}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Context Notes
          </label>
          <textarea
            value={notes.freeform ?? ""}
            onChange={(e) => setNotes((n) => ({ ...n, freeform: e.target.value }))}
            onBlur={saveFreeform}
            placeholder="Add general review context…"
            rows={3}
            className="w-full text-sm rounded-lg border border-border/60 bg-muted/30 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/40 placeholder:text-muted-foreground/50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <StickyNote className="w-3 h-3" /> Notes ({sortedNotes.length})
            </label>
            <button onClick={() => { setAddingNote(true); setAddingWatch(false) }}
              className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:opacity-80 transition-opacity">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {addingNote && (
            <div className="mb-2 p-2 rounded-lg border border-teal-300/50 bg-teal-50 dark:bg-teal-950/30 space-y-2">
              <textarea
                autoFocus value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Note text…" rows={2}
                className="w-full text-xs rounded border border-border/60 bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <div className="flex gap-1.5">
                <button onClick={addNote} disabled={!newNoteText.trim()} className="flex-1 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-40">Add</button>
                <button onClick={() => { setAddingNote(false); setNewNoteText("") }} className="flex-1 py-1 rounded bg-muted text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}

          {sortedNotes.length === 0 && !addingNote && (
            <p className="text-[11px] text-muted-foreground/60 italic py-1">No notes yet.</p>
          )}

          <div className="space-y-2">
            {sortedNotes.map((note) => (
              <div key={note.id} className={`rounded-lg border border-border/50 p-2.5 ${note.resolved ? "opacity-50" : ""}`}>
                <p className={`text-xs leading-snug ${note.resolved ? "line-through" : ""}`}>{note.text}</p>
                {note.linked_diff_id && (
                  <p className="text-[9px] text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-0.5">
                    <Link2 className="w-2.5 h-2.5" /> Linked to change
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <button onClick={() => toggleNoteResolved(note.id)} title={note.resolved ? "Mark unresolved" : "Mark resolved"}
                    className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${note.resolved ? "text-teal-500" : ""}`} />
                  </button>
                  <button onClick={() => linkNoteToSelected(note.id)} disabled={!selectedDiffId}
                    title={note.linked_diff_id === selectedDiffId ? "Unlink" : "Link to selected"}
                    className={`p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-30 ${note.linked_diff_id ? "text-teal-500" : "text-muted-foreground"}`}>
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" /> Watchlist ({sortedWatch.length})
            </label>
            <button onClick={() => { setAddingWatch(true); setAddingNote(false) }}
              className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:opacity-80">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {addingWatch && (
            <div className="mb-2 p-2 rounded-lg border border-teal-300/50 bg-teal-50 dark:bg-teal-950/30 space-y-2">
              <textarea
                autoFocus value={newWatchText} onChange={(e) => setNewWatchText(e.target.value)}
                placeholder="Item to watch…" rows={2}
                className="w-full text-xs rounded border border-border/60 bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <div className="flex items-center gap-1.5">
                <select value={newWatchSev} onChange={(e) => setNewWatchSev(e.target.value as CVNoteSeverity)}
                  className="text-xs rounded border border-border/60 bg-background px-1 py-1">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex gap-1.5">
                <button onClick={addWatchlistItem} disabled={!newWatchText.trim()} className="flex-1 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-40">Add</button>
                <button onClick={() => { setAddingWatch(false); setNewWatchText("") }} className="flex-1 py-1 rounded bg-muted text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}

          {sortedWatch.length === 0 && !addingWatch && (
            <p className="text-[11px] text-muted-foreground/60 italic py-1">No items yet.</p>
          )}

          <div className="space-y-2">
            {sortedWatch.map((item) => (
              <div key={item.id} className={`rounded-lg border border-border/50 p-2.5 ${item.resolved ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-[9px] font-bold uppercase flex-shrink-0 mt-0.5 ${SEV_CLS[item.severity]}`}>{item.severity}</span>
                  <p className={`text-xs leading-snug flex-1 ${item.resolved ? "line-through" : ""}`}>{item.text}</p>
                </div>
                {item.linked_diff_id && (
                  <p className="text-[9px] text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-0.5">
                    <Link2 className="w-2.5 h-2.5" /> Linked to change
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <button onClick={() => toggleWatchResolved(item.id)} className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${item.resolved ? "text-teal-500" : ""}`} />
                  </button>
                  <button onClick={() => linkWatchToSelected(item.id)} disabled={!selectedDiffId}
                    className={`p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-30 ${item.linked_diff_id ? "text-teal-500" : "text-muted-foreground"}`}>
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteWatchlistItem(item.id)} className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CompareVersionsSession ─────────────────────────────────────────────────────

export default function CompareVersionsSession({ sessionId }: { sessionId: string }) {
  const [, navigate] = useLocation()
  const { isAdmin, entitlements, loading: entLoading } = useEntitlements()
  const api = useCompareVersionsApi()

  // ── Core state ──────────────────────────────────────────────────────────────
  const [session, setSession] = useState<CVSessionDetail | null>(null)
  const [diffItems, setDiffItems] = useState<CVDiffItem[]>([])
  const [diffResultBase, setDiffResultBase] = useState<CVDiffResult | null>(null)
  const [selectedDiffId, setSelectedDiffId] = useState<string | null>(null)
  const [hoveredItemIds, setHoveredItemIds] = useState<string[]>([])
  const [popover, setPopover] = useState<PopoverState | null>(null)

  const [originalBuf, setOriginalBuf] = useState<ArrayBuffer | null>(null)
  const [revisedBuf, setRevisedBuf] = useState<ArrayBuffer | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [originalError, setOriginalError] = useState<string | null>(null)
  const [revisedError, setRevisedError] = useState<string | null>(null)
  const [rescanning, setRescanning] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [activeTab, setActiveTab] = useState<"summary" | "original" | "revised">("original")
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(false)

  const [jumpOrigPage, setJumpOrigPage] = useState<number | null>(null)
  const [jumpRevPage, setJumpRevPage] = useState<number | null>(null)

  // ── Premium reader state ────────────────────────────────────────────────────
  const [splitPct, setSplitPct] = useState(50)
  const [density, setDensity] = useState<Density>("comfortable")
  const [diffNavIdx, setDiffNavIdx] = useState<number>(-1)
  const paneContainerRef = useRef<HTMLDivElement>(null)
  const reviewSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { pages: origPages, loading: origLoading, failed: origFailed } = usePdfRenderer(originalBuf)
  const { pages: revPages,  loading: revLoading,  failed: revFailed  } = usePdfRenderer(revisedBuf)

  const canUse = !isPaywallActive || isAdmin || (entitlements?.toolAccess?.includes("compare-versions") ?? false)

  // ── Group zones ──────────────────────────────────────────────────────────────
  const origGroups = useMemo(() => computeGroupZones(diffItems, "original"), [diffItems])
  const revGroups  = useMemo(() => computeGroupZones(diffItems, "revised"),  [diffItems])

  // ── Linked note IDs ──────────────────────────────────────────────────────────
  const linkedNoteIds = useMemo((): Set<string> => {
    const s = new Set<string>()
    const mn = session?.managerNotes
    if (!mn) return s
    ;(mn.notes ?? []).forEach((n) => { if (n.linked_diff_id) s.add(n.linked_diff_id) })
    mn.watchlist.forEach((w) => { if (w.linked_diff_id) s.add(w.linked_diff_id) })
    return s
  }, [session?.managerNotes])

  // ── Diff navigator (sorted by page, by severity within page) ─────────────────
  const sortedByPage = useMemo(() =>
    [...diffItems].sort((a, b) => {
      const pa = a.page_original ?? a.page_revised ?? 9999
      const pb = b.page_original ?? b.page_revised ?? 9999
      if (pa !== pb) return pa - pb
      return SEV_RANK[a.severity] - SEV_RANK[b.severity]
    }),
    [diffItems]
  )

  // ── Resizable split pane ─────────────────────────────────────────────────────
  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startSplit = splitPct
    const container = paneContainerRef.current
    if (!container) return
    const totalW = container.getBoundingClientRect().width

    function onMove(me: PointerEvent) {
      const dx = me.clientX - startX
      const newSplit = Math.max(22, Math.min(78, startSplit + (dx / totalW) * 100))
      setSplitPct(newSplit)
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (entLoading) return
    let cancelled = false
    setLoadError(null); setOriginalError(null); setRevisedError(null)

    async function load() {
      try {
        const sess = await api.getSession(sessionId)
        if (cancelled) return
        setSession(sess)
        setDiffItems(sess.diffResult?.items ?? [])
        setDiffResultBase(sess.diffResult)

        const [origResult, revResult] = await Promise.allSettled([
          api.getOriginalPdf(sessionId),
          api.getRevisedPdf(sessionId),
        ])
        if (cancelled) return
        if (origResult.status === "fulfilled") setOriginalBuf(origResult.value)
        else setOriginalError((origResult.reason as any)?.message ?? "Failed to load original PDF")
        if (revResult.status === "fulfilled") setRevisedBuf(revResult.value)
        else setRevisedError((revResult.reason as any)?.message ?? "Failed to load revised PDF")
      } catch (err: any) {
        if (cancelled) return
        setLoadError(err?.status === 404 ? "Session not found." : "Failed to load session.")
      }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId, entLoading])

  // ── Scan polling ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status !== "scanning") return
    let cancelled = false
    const interval = setInterval(async () => {
      if (cancelled) return
      try {
        const updated = await api.getSession(sessionId)
        if (cancelled) return
        setSession(updated)
        if (updated.status === "complete") {
          setDiffItems(updated.diffResult?.items ?? [])
          setDiffResultBase(updated.diffResult)
          setSummaryOpen(true)
          setActiveTab("summary")
        }
      } catch { /* ignore poll errors */ }
    }, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session?.status, sessionId])

  // ── AI enrichment polling ────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.aiStatus !== "running") return
    let cancelled = false
    const interval = setInterval(async () => {
      if (cancelled) return
      try {
        const updated = await api.getSession(sessionId)
        if (cancelled) return
        setSession(updated)
        if (updated.aiStatus !== "running") {
          setDiffItems(updated.diffResult?.items ?? diffItems)
          setDiffResultBase(updated.diffResult)
        }
      } catch { /* ignore poll errors */ }
    }, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session?.aiStatus, sessionId])

  // ── Page title ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = session?.title ? `${session.title} — Compare Versions` : "Compare Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [session?.title])

  // ── Rescan ───────────────────────────────────────────────────────────────────
  async function handleRescan() {
    if (!session || rescanning) return
    setRescanning(true)
    try {
      await api.rescanSession(session.id)
      setSession((s) => s ? { ...s, status: "scanning", diffResult: null } : s)
      setDiffItems([])
      setSummaryOpen(false)
    } catch (err: any) {
      console.error("[CompareVersions] rescan failed:", err)
    } finally { setRescanning(false) }
  }

  // ── AI Enrich ────────────────────────────────────────────────────────────────
  async function handleEnrich(forceAll = false) {
    if (!session || enriching || session.aiStatus === "running") return
    setEnriching(true)
    try {
      await api.enrichSession(session.id, forceAll)
      setSession((s) => s ? { ...s, aiStatus: "running" } : s)
    } catch (err: any) {
      console.error("[CompareVersions] enrich failed:", err)
    } finally { setEnriching(false) }
  }

  // ── Reject toggle ────────────────────────────────────────────────────────────
  function handleRejectToggle(itemId: string) {
    const nextItems = diffItems.map((item) => {
      if (item.id !== itemId) return item
      return { ...item, review_status: item.review_status === "rejected" ? null : ("rejected" as const) }
    })
    setDiffItems(nextItems)
    if (session) {
      const base = diffResultBase ?? session.diffResult
      if (base) {
        const updated = recomputeStats(nextItems, base)
        api.patchReview(session.id, updated).catch((err) =>
          console.error("[CompareVersions] reject toggle save failed:", err),
        )
      }
    }
  }

  // ── Export report ─────────────────────────────────────────────────────────────
  function handleExport() {
    if (!session) return
    const url = api.exportReportUrl(session.id)
    const a = document.createElement("a")
    a.href = url
    a.download = `compare-audit-${session.id.slice(0, 8)}.pdf`
    a.click()
  }

  // ── Jump-to-page ──────────────────────────────────────────────────────────────
  // Stable — only uses setState setters (always stable refs).
  const handleSummaryJump = useCallback((origPage: number | null, revPage: number | null) => {
    setJumpOrigPage(null); setJumpRevPage(null)
    setTimeout(() => {
      setJumpOrigPage(origPage)
      setJumpRevPage(revPage)
    }, 30)
    if (origPage != null) setActiveTab("original")
    else if (revPage != null) setActiveTab("revised")
  }, [])

  // ── Selection ─────────────────────────────────────────────────────────────────
  const selectDiffItem = useCallback((id: string) => {
    setSelectedDiffId(id)
    setPopover(null)
    const item = diffItems.find((i) => i.id === id)
    if (item) handleSummaryJump(item.page_original, item.page_revised)
    const idx = sortedByPage.findIndex((i) => i.id === id)
    if (idx >= 0) setDiffNavIdx(idx)
  }, [diffItems, sortedByPage, handleSummaryJump])

  // ── Group click ───────────────────────────────────────────────────────────────
  const handleGroupClick = useCallback((zone: CVGroupZone, clientX: number, clientY: number) => {
    if (zone.itemIds.length === 1) {
      selectDiffItem(zone.itemIds[0])
    } else {
      const items = zone.itemIds
        .map((id) => diffItems.find((i) => i.id === id))
        .filter((x): x is CVDiffItem => x != null)
      setPopover({ items, x: clientX, y: clientY })
    }
  }, [diffItems, selectDiffItem])

  // ── Hover sync — stable; setState setters are always stable refs ─────────────
  const handleGroupHover = useCallback((zone: CVGroupZone) => setHoveredItemIds(zone.itemIds), [])
  const handleGroupLeave = useCallback(() => setHoveredItemIds([]), [])

  // ── Severity override ─────────────────────────────────────────────────────────
  // Reads session/diffResultBase via closure — include in deps so it's fresh.
  const handleSeverityChange = useCallback((itemId: string, newSev: CVDiffSeverity) => {
    setDiffItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== itemId) return item
        const originalSeverity = item.severity_overridden
          ? (item.meta?.originalSeverity ?? item.severity)
          : item.severity
        return { ...item, severity: newSev, severity_overridden: true, meta: { ...item.meta, originalSeverity } }
      })
      if (reviewSaveTimerRef.current) clearTimeout(reviewSaveTimerRef.current)
      reviewSaveTimerRef.current = setTimeout(() => {
        if (!session) return
        const base = diffResultBase ?? session.diffResult
        if (!base) return
        const updated = recomputeStats(next, base)
        api.patchReview(session.id, updated).catch((err) =>
          console.error("[CompareVersions] severity override save failed:", err),
        )
      }, 800)
      return next
    })
  }, [session, diffResultBase])

  // ── Diff navigator ────────────────────────────────────────────────────────────
  function jumpToPrevDiff() {
    if (sortedByPage.length === 0) return
    const newIdx = diffNavIdx <= 0 ? 0 : diffNavIdx - 1
    const item = sortedByPage[newIdx]
    if (!item) return
    setDiffNavIdx(newIdx)
    selectDiffItem(item.id)
    setSummaryOpen(true)
    if (notesOpen) setNotesOpen(false)
  }

  function jumpToNextDiff() {
    if (sortedByPage.length === 0) return
    const newIdx = diffNavIdx < 0 ? 0 : Math.min(sortedByPage.length - 1, diffNavIdx + 1)
    const item = sortedByPage[newIdx]
    if (!item) return
    setDiffNavIdx(newIdx)
    selectDiffItem(item.id)
    setSummaryOpen(true)
    if (notesOpen) setNotesOpen(false)
  }

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (entLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (!canUse) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 max-w-sm mx-auto text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
        <Lock className="w-7 h-7 text-teal-500 dark:text-teal-400" />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-1">Pro plan required</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Compare Versions is available on the Pro plan. Upgrade to open this comparison.
        </p>
      </div>
      <button
        onClick={() => navigate("/upgrade")}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        View plans &amp; pricing
      </button>
      <button onClick={() => navigate("/compare-versions")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to Compare Versions
      </button>
    </div>
  )

  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
      <AlertCircle className="w-8 h-8 text-destructive" />
      <p className="font-medium">{loadError}</p>
      <button onClick={() => navigate("/compare-versions")} className="text-sm text-muted-foreground underline">← My Comparisons</button>
    </div>
  )

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )

  const highCount  = diffItems.filter((i) => i.severity === "high").length
  const totalCount = diffItems.length
  const navLabel   = sortedByPage.length > 0
    ? (diffNavIdx >= 0 ? `${diffNavIdx + 1}/${sortedByPage.length}` : `${sortedByPage.length} diff${sortedByPage.length !== 1 ? "s" : ""}`)
    : null

  // ── Lock body scroll so the fixed-height workspace never scrolls away ─────────
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // ── Workspace ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {popover && (
        <MiniPopover
          state={popover}
          items={popover.items}
          onSelect={selectDiffItem}
          onClose={() => setPopover(null)}
        />
      )}

      {/* ── Workspace command bar — stationary (body overflow locked) ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/70 bg-background/98 shadow-sm flex-shrink-0 gap-2 backdrop-blur-sm">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate("/compare-versions")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Back to My Comparisons"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 leading-none">
            <p className="text-sm font-bold truncate max-w-[130px] sm:max-w-[240px] lg:max-w-[400px] leading-tight text-foreground">
              {session.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[11px] text-muted-foreground leading-none font-medium">Compare Versions</p>
              {totalCount > 0 && (
                <span className="text-[11px] font-mono text-muted-foreground leading-none">· {totalCount} changes</span>
              )}
              {highCount > 0 && (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 leading-none">· {highCount} high</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">

          {/* Diff navigator */}
          {sortedByPage.length > 0 && (
            <div className="flex items-center gap-0 border border-border/50 rounded-md overflow-hidden flex-shrink-0">
              <button
                onClick={jumpToPrevDiff}
                disabled={diffNavIdx <= 0 && diffNavIdx !== -1 || (diffNavIdx === -1 && sortedByPage.length === 0)}
                className="px-1 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 transition-colors"
                title="Previous diff"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <span className="px-1.5 text-[10px] font-mono text-muted-foreground border-x border-border/40 select-none whitespace-nowrap py-0.5">
                {navLabel}
              </span>
              <button
                onClick={jumpToNextDiff}
                disabled={diffNavIdx >= sortedByPage.length - 1 && diffNavIdx !== -1}
                className="px-1 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 transition-colors"
                title="Next diff"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Density toggle */}
          <button
            onClick={() => setDensity((d) => d === "compact" ? "comfortable" : "compact")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
              density === "compact"
                ? "bg-muted/80 border-border/60 text-foreground"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            title={density === "compact" ? "Switch to comfortable density" : "Switch to compact density"}
          >
            {density === "compact" ? <AlignLeft className="w-3 h-3" /> : <AlignJustify className="w-3 h-3" />}
            <span className="hidden sm:inline">{density === "compact" ? "Compact" : "Comfy"}</span>
          </button>

          {session.status !== "scanning" && (
            <button
              onClick={handleRescan} disabled={rescanning}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              title="Re-run comparison scan"
            >
              {rescanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              <span className="hidden sm:inline">Rescan</span>
            </button>
          )}

          {session.status === "complete" && session.aiStatus !== "running" && (
            <button
              onClick={() => handleEnrich(session.aiStatus === "complete")}
              disabled={enriching}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors disabled:opacity-50 ${
                session.aiStatus === "error"
                  ? "border-amber-300/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50/60"
                  : session.aiStatus === "complete"
                  ? "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  : "border-violet-300/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50/60"
              }`}
              title={session.aiStatus === "error" ? "Retry AI review" : session.aiStatus === "complete" ? "Re-run AI review" : "Run AI review"}
            >
              {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span className="hidden sm:inline">
                {session.aiStatus === "error" ? "Retry AI" : session.aiStatus === "complete" ? "Re-run AI" : "AI Review"}
              </span>
            </button>
          )}

          {session.status === "complete" && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Download PDF audit report"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}

          <button
            onClick={() => { setSummaryOpen((o) => !o); if (notesOpen) setNotesOpen(false) }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
              summaryOpen
                ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300/60"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            title="Comparison Summary"
          >
            <BarChart2 className="w-3 h-3" />
            {highCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
            <span className="hidden sm:inline">Summary</span>
          </button>

          <button
            onClick={() => { setNotesOpen((o) => !o); if (summaryOpen) setSummaryOpen(false) }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
              notesOpen
                ? "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-300/60"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            title="Manager Notes"
          >
            <StickyNote className="w-3 h-3" />
            <span className="hidden sm:inline">Notes</span>
          </button>
        </div>
      </div>

      {/* ── Status banners ── */}
      {session.status === "scanning" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200/50 text-blue-700 dark:text-blue-300 text-xs flex-shrink-0">
          <Scan className="w-3.5 h-3.5 animate-pulse" />
          <span>Analyzing documents — detecting changes across all pages…</span>
          <Loader2 className="w-3 h-3 animate-spin ml-auto" />
        </div>
      )}
      {session.status === "error" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-950/40 border-b border-red-200/50 text-red-700 dark:text-red-300 text-xs flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Analysis failed.</span>
          <button onClick={handleRescan} disabled={rescanning} className="ml-1 underline font-semibold disabled:opacity-50">
            {rescanning ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}
      {session.status === "complete" && session.aiStatus === "running" && (
        <div className="flex items-center gap-2 px-4 py-1 bg-violet-50 dark:bg-violet-950/30 border-b border-violet-200/40 text-violet-700 dark:text-violet-300 text-xs flex-shrink-0">
          <Sparkles className="w-3 h-3 animate-pulse flex-shrink-0" />
          <span>AI review running — enriching change items…</span>
          <Loader2 className="w-3 h-3 animate-spin ml-auto flex-shrink-0" />
        </div>
      )}
      {session.status === "complete" && session.aiStatus === "error" && (
        <div className="flex items-center gap-2 px-4 py-1 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/40 text-amber-700 dark:text-amber-300 text-xs flex-shrink-0">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>AI review unavailable. Deterministic comparison still available.</span>
          <button onClick={() => handleEnrich(false)} disabled={enriching} className="ml-auto underline font-semibold disabled:opacity-50 flex-shrink-0">
            {enriching ? "Retrying…" : "Retry AI"}
          </button>
        </div>
      )}

      {/* ── Mobile tab switcher ── */}
      <div className="flex md:hidden border-b border-border/40 flex-shrink-0 bg-background">
        {(["summary", "original", "revised"] as const).map((tab) => (
          <button type="button" key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab ? "text-teal-600 dark:text-teal-400 border-teal-500" : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab === "summary" ? "Changes" : tab === "original" ? "Baseline" : "Revised"}
          </button>
        ))}
      </div>

      {/* ── Pane area with right drawers ── */}
      <div ref={paneContainerRef} className="flex flex-1 overflow-hidden relative">

        {/* Left — Baseline (original) */}
        <div
          className={`flex-col h-full overflow-hidden flex-shrink-0 ${
            activeTab === "original" ? "flex w-full md:w-auto" : "hidden md:flex"
          }`}
          style={{ width: window.innerWidth >= 768 ? `${splitPct}%` : undefined }}
        >
          <PdfPane
            label="Baseline · Read only"
            fileName={session.originalFileName}
            pages={origPages}
            loading={origLoading}
            failed={origFailed}
            errorMsg={originalError}
            accentClass="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
            groups={origGroups}
            selectedDiffId={selectedDiffId}
            hoveredItemIds={hoveredItemIds}
            jumpPage={jumpOrigPage}
            onGroupClick={handleGroupClick}
            onGroupHover={handleGroupHover}
            onGroupLeave={handleGroupLeave}
          />
        </div>

        {/* Resizable drag handle */}
        <div
          className="hidden md:flex items-center justify-center w-2 flex-shrink-0 cursor-col-resize bg-border/40 hover:bg-teal-400/50 active:bg-teal-500/60 transition-colors group select-none"
          onPointerDown={startResize}
          title="Drag to resize"
        >
          <div className="w-0.5 h-8 rounded-full bg-border/80 group-hover:bg-teal-500/70 transition-colors" />
        </div>

        {/* Right — Revised */}
        <div className={`flex-col h-full overflow-hidden flex-1 ${
          activeTab === "revised" ? "flex w-full" : "hidden md:flex"
        }`}>
          <PdfPane
            label="Revised · Read only"
            fileName={session.revisedFileName}
            pages={revPages}
            loading={revLoading}
            failed={revFailed}
            errorMsg={revisedError}
            accentClass="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            groups={revGroups}
            selectedDiffId={selectedDiffId}
            hoveredItemIds={hoveredItemIds}
            jumpPage={jumpRevPage}
            onGroupClick={handleGroupClick}
            onGroupHover={handleGroupHover}
            onGroupLeave={handleGroupLeave}
          />
        </div>

        {/* Right: Change Intelligence panel — permanent column on desktop, full-width on mobile "Changes" tab */}
        <div className={`flex-col overflow-hidden border-l border-border/60 flex-shrink-0 ${
          activeTab === "summary" ? "flex flex-1" : "hidden"
        } ${summaryOpen ? "md:flex md:flex-none md:w-[360px]" : "md:hidden"}`}>
          <SummaryPanel
            diffItems={diffItems}
            selectedDiffId={selectedDiffId}
            onSelectItem={(id) => selectDiffItem(id)}
            onHoverItem={setHoveredItemIds}
            onLeaveItem={() => setHoveredItemIds([])}
            onSeverityChange={handleSeverityChange}
            linkedNoteIds={linkedNoteIds}
            onRejectToggle={handleRejectToggle}
            density={density}
          />
        </div>

        <NotesRail
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          session={session}
          selectedDiffId={selectedDiffId}
          onSaved={(mn) => setSession((s) => s ? { ...s, managerNotes: mn } : s)}
        />
      </div>
    </div>
  )
}
