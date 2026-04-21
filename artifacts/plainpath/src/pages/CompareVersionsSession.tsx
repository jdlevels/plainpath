// ─── Compare Versions — Workspace (Slices 4–5) ─────────────────────────────────
// Slice 4: Group zones, hover/selection sync, severity override, notes CRUD.
// Slice 5: AI semantic enrichment — auto-run + retry, ai_category pills,
//          ai_explanation in summary rows, AI status banners.
// ──────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback, useMemo,
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
  Sparkles, Download, ExternalLink, Square, CheckSquare, XCircle, MousePointerClick,
} from "lucide-react"
import { useEntitlements } from "@/hooks/useEntitlements"
import { useCompareVersionsApi } from "@/hooks/useCompareVersionsApi"
import { useAuth } from "@clerk/react"
import type {
  CVSessionDetail, CVManagerNotes,
  CVDiffItem, CVDiffResult, CVDiffSeverity, CVDiffChangeType,
  CVGroupZone, CVFreeformNote, CVWatchlistItem, CVNoteSeverity, CVAiCategory,
} from "@/lib/compareVersionsTypes"
import { computeGroupZones, groupsForItems } from "@/lib/compareVersionsGrouping"

// ─── pdfjs worker ─────────────────────────────────────────────────────────────

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const RENDER_SCALE = 1.5
const POLL_INTERVAL_MS = 2500
const SEV_RANK: Record<CVDiffSeverity, number> = { high: 0, medium: 1, low: 2 }

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
// Fixed-position small popover listing items in a multi-item group.

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

  // Clamp to viewport
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

function PdfPane({
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
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const hoveredSet = useMemo(() => new Set(hoveredItemIds), [hoveredItemIds])

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
          <button onClick={prevPage} disabled={currentPage <= 0 || loading || failed || !!errorMsg} title="Previous page"
            className="p-0.5 rounded hover:bg-muted/60 disabled:opacity-30 transition-colors">
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={nextPage} disabled={currentPage >= pages.length - 1 || loading || failed || !!errorMsg} title="Next page"
            className="p-0.5 rounded hover:bg-muted/60 disabled:opacity-30 transition-colors">
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

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
            {pages.map((pg, i) => {
              const pageNum = i + 1
              const pageGroups = groupsForPage(pageNum)
              return (
                <div
                  key={i}
                  ref={(el) => { pageRefs.current[i] = el }}
                  className="relative rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white select-none"
                  style={{ aspectRatio: `${pg.w} / ${pg.h}` }}
                >
                  <img src={pg.dataUrl} alt={`Page ${pageNum}`} className="block w-full pointer-events-none" draggable={false} />
                  {pages.length > 1 && (
                    <span className="absolute top-2 right-2 text-[9px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded pointer-events-none z-10">
                      {pageNum} / {pages.length}
                    </span>
                  )}
                  {/* Group zone overlays */}
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
                        {/* Count badge for multi-item groups */}
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
}

// ─── SummaryPanel ──────────────────────────────────────────────────────────────

type SevFilter = "all" | "high" | "medium" | "low"

function SummaryPanel({
  open, onClose,
  diffItems, selectedDiffId,
  onSelectItem, onHoverItem, onLeaveItem,
  onSeverityChange,
  linkedNoteIds,
  handoffSelectedIds,
  onToggleHandoffSelect,
  onRejectToggle,
}: {
  open: boolean
  onClose: () => void
  diffItems: CVDiffItem[]
  selectedDiffId: string | null
  onSelectItem: (id: string) => void
  onHoverItem: (ids: string[]) => void
  onLeaveItem: () => void
  onSeverityChange: (itemId: string, sev: CVDiffSeverity) => void
  linkedNoteIds: Set<string>
  handoffSelectedIds: Set<string>
  onToggleHandoffSelect: (id: string) => void
  onRejectToggle: (id: string) => void
}) {
  const [sevFilter, setSevFilter] = useState<SevFilter>("all")
  const [pageFilter, setPageFilter] = useState<number | null>(null)
  const [showPageDrop, setShowPageDrop] = useState(false)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pageDropRef = useRef<HTMLDivElement>(null)

  // Close page dropdown on outside click
  useEffect(() => {
    if (!showPageDrop) return
    function handler(e: MouseEvent) {
      if (pageDropRef.current && !pageDropRef.current.contains(e.target as Node)) setShowPageDrop(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showPageDrop])

  // Scroll selected item into view
  useEffect(() => {
    if (!selectedDiffId) return
    const el = itemRefs.current[selectedDiffId]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedDiffId])

  // Reset page filter when severity filter changes
  useEffect(() => { setPageFilter(null) }, [sevFilter])

  if (!open) return null

  // Severity-filtered items
  const sevFiltered = sevFilter === "all" ? diffItems : diffItems.filter((i) => i.severity === sevFilter)

  // Pages with items (in sevFiltered)
  const pagesWithItems = useMemo(() => {
    const pSet = new Set<number>()
    for (const item of sevFiltered) {
      if (item.page_original != null) pSet.add(item.page_original)
      if (item.page_revised != null) pSet.add(item.page_revised)
    }
    return [...pSet].sort((a, b) => a - b)
  }, [sevFiltered])

  // Page-filtered + sorted items
  const visibleItems = useMemo(() => {
    let list = pageFilter == null ? sevFiltered : sevFiltered.filter((i) =>
      i.page_original === pageFilter || i.page_revised === pageFilter
    )
    return [...list].sort((a, b) => {
      const sd = SEV_RANK[a.severity] - SEV_RANK[b.severity]
      if (sd !== 0) return sd
      const pa = a.page_original ?? a.page_revised ?? 9999
      const pb = b.page_original ?? b.page_revised ?? 9999
      return pa - pb
    })
  }, [sevFiltered, pageFilter])

  const stats = useMemo(() => {
    let high = 0, medium = 0, low = 0
    for (const i of diffItems) {
      if (i.severity === "high") high++
      else if (i.severity === "medium") medium++
      else low++
    }
    return { total: diffItems.length, high, medium, low }
  }, [diffItems])

  const TAB_LABELS: { key: SevFilter; label: string; count: number }[] = [
    { key: "all",    label: "All",  count: stats.total },
    { key: "high",   label: "High", count: stats.high },
    { key: "medium", label: "Med",  count: stats.medium },
    { key: "low",    label: "Low",  count: stats.low },
  ]

  return (
    <div
      className="flex-shrink-0 border-t border-border/60 bg-background animate-in slide-in-from-bottom-2 duration-200"
      style={{ height: "290px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Summary</span>
          {stats.total > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono hidden sm:block">
              · {stats.total} change{stats.total !== 1 ? "s" : ""}
            </span>
          )}
          {/* Live selected / rejected counts */}
          {handoffSelectedIds.size > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              {handoffSelectedIds.size} selected
            </span>
          )}
          {diffItems.filter((i) => i.review_status === "rejected").length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
              {diffItems.filter((i) => i.review_status === "rejected").length} rejected
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Page filter */}
          {pagesWithItems.length > 1 && (
            <div ref={pageDropRef} className="relative">
              <button
                onClick={() => setShowPageDrop((o) => !o)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium transition-colors ${
                  pageFilter != null
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300/60"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {pageFilter != null ? `Page ${pageFilter}` : "Page"}
                <ChevDown className="w-3 h-3" />
              </button>
              {showPageDrop && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border/60 rounded-lg shadow-xl py-1 min-w-[100px]">
                  <button
                    onClick={() => { setPageFilter(null); setShowPageDrop(false) }}
                    className={`w-full text-left px-3 py-1 text-xs hover:bg-muted/60 transition-colors ${pageFilter == null ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    All pages
                  </button>
                  {pagesWithItems.map((pg) => (
                    <button
                      key={pg}
                      onClick={() => { setPageFilter(pg); setShowPageDrop(false) }}
                      className={`w-full text-left px-3 py-1 text-xs hover:bg-muted/60 transition-colors ${pageFilter === pg ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                    >
                      Page {pg}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Severity filter tabs */}
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
            {TAB_LABELS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setSevFilter(key)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                  sevFilter === key
                    ? key === "high"   ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                    : key === "medium" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                    : key === "low"    ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    :                   "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Close summary">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto" style={{ height: "calc(290px - 46px)" }}>
        {/* Column legend — only shown when there are items */}
        {diffItems.length > 0 && (
          <div className="flex items-center gap-0 px-2 py-1 bg-muted/20 border-b border-border/20 sticky top-0 z-10">
            <div className="w-7 flex-shrink-0 flex items-center justify-center" title="Check to include in handoff">
              <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">☑</span>
            </div>
            <span className="flex-1 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider pl-2">Change</span>
            <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider pr-1" title="Click ✕ to reject">✕ reject</span>
            <div style={{ minWidth: "60px" }} />
          </div>
        )}
        {diffItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-muted-foreground opacity-40" />
            </div>
            <p className="text-sm text-muted-foreground">No differences found.</p>
          </div>
        )}

        {diffItems.length > 0 && visibleItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No {sevFilter !== "all" ? sevFilter + " severity " : ""}changes
              {pageFilter != null ? ` on page ${pageFilter}` : ""}.
            </p>
          </div>
        )}

        {visibleItems.length > 0 && (
          <div className="divide-y divide-border/30">
            {visibleItems.map((item) => {
              const isSelected = selectedDiffId === item.id
              const pageLabel =
                item.page_original != null && item.page_revised != null
                  ? `p.${item.page_original}→${item.page_revised}`
                  : item.page_original != null ? `p.${item.page_original} orig`
                  : item.page_revised != null  ? `p.${item.page_revised} rev`
                  : "—"
              const preview = (item.revised_text ?? item.original_text ?? "").slice(0, 80)
              const hasLinkedNote = linkedNoteIds.has(item.id)

              const isHandoffChecked = handoffSelectedIds.has(item.id)
              const isRejected = item.review_status === "rejected"

              return (
                <div
                  key={item.id}
                  ref={(el) => { itemRefs.current[item.id] = el }}
                  className={`flex items-stretch gap-0 transition-colors ${
                    isRejected
                      ? "bg-red-50/60 dark:bg-red-950/20"
                      : isSelected
                      ? "bg-violet-50 dark:bg-violet-950/30"
                      : "hover:bg-muted/30"
                  }`}
                  onMouseEnter={() => onHoverItem([item.id])}
                  onMouseLeave={() => onLeaveItem()}
                >
                  {/* Left accent bar: rejected=red, selected=violet, default=transparent */}
                  <div className={`w-0.5 flex-shrink-0 rounded-l ${
                    isRejected ? "bg-red-400" : isSelected ? "bg-violet-500" : "bg-transparent"
                  }`} />

                  {/* Handoff checkbox — transient selection for one-time handoff */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleHandoffSelect(item.id) }}
                    title={isHandoffChecked ? "Remove from handoff selection" : "Add to handoff selection"}
                    className="flex items-center px-2 text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 flex-shrink-0 transition-colors"
                  >
                    {isHandoffChecked
                      ? <CheckSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      : <Square className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onSelectItem(item.id)}
                    className="flex-1 flex items-start gap-3 pr-3 py-2.5 text-left"
                  >
                    {/* Severity badge */}
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${severityBadgeClass(item.severity)}`}>
                      {item.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium truncate ${isRejected ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {severityLabel(item)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{pageLabel}</span>
                        {/* Rejected badge */}
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
                      {preview && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{preview}</p>
                      )}
                      {item.ai_explanation && (
                        <p className="text-[10px] text-violet-600/80 dark:text-violet-400/80 mt-0.5 leading-snug line-clamp-2">
                          {item.ai_explanation}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                  </button>

                  {/* Reject toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRejectToggle(item.id) }}
                    title={isRejected ? "Un-reject this change" : "Mark as rejected (needs action in PDF Editor)"}
                    className={`flex items-center px-1.5 flex-shrink-0 transition-colors ${
                      isRejected
                        ? "text-red-500 hover:text-muted-foreground"
                        : "text-muted-foreground/40 hover:text-red-500"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>

                  {/* Severity override dropdown */}
                  <div className="flex items-center pr-2 flex-shrink-0">
                    <select
                      value={item.severity}
                      onChange={(e) => {
                        e.stopPropagation()
                        onSeverityChange(item.id, e.target.value as CVDiffSeverity)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Override severity"
                      className="text-[10px] font-semibold rounded border border-border/50 bg-muted/40 px-1 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-400/50 appearance-none text-center"
                      style={{ minWidth: "56px" }}
                    >
                      <option value="high">High</option>
                      <option value="medium">Med</option>
                      <option value="low">Low</option>
                    </select>
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
// Full CRUD: structured freeform notes + watchlist items, with diff linking + resolved toggle.

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
      id: crypto.randomUUID(),
      type: "freeform",
      text: newNoteText.trim(),
      resolved: false,
      created_at: new Date().toISOString(),
      linked_diff_id: null,
    }
    const next = { ...notes, notes: [note, ...(notes.notes ?? [])] }
    setNewNoteText(""); setAddingNote(false)
    persistNotes(next)
  }

  function deleteNote(id: string) {
    persistNotes({ ...notes, notes: (notes.notes ?? []).filter((n) => n.id !== id) })
  }

  function toggleNoteResolved(id: string) {
    persistNotes({
      ...notes,
      notes: (notes.notes ?? []).map((n) => n.id === id ? { ...n, resolved: !n.resolved } : n),
    })
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
      id: crypto.randomUUID(),
      type: "watchlist",
      text: newWatchText.trim(),
      severity: newWatchSev,
      resolved: false,
      created_at: new Date().toISOString(),
      linked_diff_id: null,
    }
    const next = { ...notes, watchlist: [item, ...notes.watchlist] }
    setNewWatchText(""); setAddingWatch(false)
    persistNotes(next)
  }

  function deleteWatchlistItem(id: string) {
    persistNotes({ ...notes, watchlist: notes.watchlist.filter((w) => w.id !== id) })
  }

  function toggleWatchResolved(id: string) {
    persistNotes({
      ...notes,
      watchlist: notes.watchlist.map((w) => w.id === id ? { ...w, resolved: !w.resolved } : w),
    })
  }

  function linkWatchToSelected(id: string) {
    if (!selectedDiffId) return
    persistNotes({
      ...notes,
      watchlist: notes.watchlist.map((w) => w.id === id ? { ...w, linked_diff_id: w.linked_diff_id === selectedDiffId ? null : selectedDiffId } : w),
    })
  }

  function saveFreeform() {
    persistNotes(notes)
  }

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
      {/* Header */}
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

        {/* ── Legacy freeform text ── */}
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

        {/* ── Structured notes ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <StickyNote className="w-3 h-3" /> Notes ({sortedNotes.length})
            </label>
            <button
              onClick={() => { setAddingNote(true); setAddingWatch(false) }}
              className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:opacity-80 transition-opacity"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {addingNote && (
            <div className="mb-2 p-2 rounded-lg border border-teal-300/50 bg-teal-50 dark:bg-teal-950/30 space-y-2">
              <textarea
                autoFocus
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Note text…"
                rows={2}
                className="w-full text-xs rounded border border-border/60 bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <div className="flex gap-1.5">
                <button onClick={addNote} disabled={!newNoteText.trim()} className="flex-1 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors">
                  Add
                </button>
                <button onClick={() => { setAddingNote(false); setNewNoteText("") }} className="flex-1 py-1 rounded bg-muted hover:bg-muted/70 text-muted-foreground text-xs font-medium transition-colors">
                  Cancel
                </button>
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
                  <button
                    onClick={() => toggleNoteResolved(note.id)}
                    title={note.resolved ? "Mark unresolved" : "Mark resolved"}
                    className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${note.resolved ? "text-teal-500" : ""}`} />
                  </button>
                  <button
                    onClick={() => linkNoteToSelected(note.id)}
                    disabled={!selectedDiffId}
                    title={note.linked_diff_id === selectedDiffId ? "Unlink" : "Link to selected change"}
                    className={`p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-30 ${note.linked_diff_id ? "text-teal-500" : "text-muted-foreground"}`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteNote(note.id)} title="Delete note" className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Watchlist ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" /> Watchlist ({sortedWatch.length})
            </label>
            <button
              onClick={() => { setAddingWatch(true); setAddingNote(false) }}
              className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:opacity-80 transition-opacity"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {addingWatch && (
            <div className="mb-2 p-2 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 space-y-2">
              <textarea
                autoFocus
                value={newWatchText}
                onChange={(e) => setNewWatchText(e.target.value)}
                placeholder="Watchlist item…"
                rows={2}
                className="w-full text-xs rounded border border-border/60 bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <select
                value={newWatchSev}
                onChange={(e) => setNewWatchSev(e.target.value as CVNoteSeverity)}
                className="w-full text-xs rounded border border-border/60 bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="flex gap-1.5">
                <button onClick={addWatchlistItem} disabled={!newWatchText.trim()} className="flex-1 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors">
                  Add
                </button>
                <button onClick={() => { setAddingWatch(false); setNewWatchText("") }} className="flex-1 py-1 rounded bg-muted hover:bg-muted/70 text-muted-foreground text-xs font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {sortedWatch.length === 0 && !addingWatch && (
            <p className="text-[11px] text-muted-foreground/60 italic py-1">No watchlist items yet.</p>
          )}

          <div className="space-y-2">
            {sortedWatch.map((item) => (
              <div key={item.id} className={`rounded-lg border border-border/50 p-2.5 ${item.resolved ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-1.5">
                  <span className={`text-[9px] font-bold uppercase mt-0.5 flex-shrink-0 ${SEV_CLS[item.severity] ?? SEV_CLS.low}`}>
                    {item.severity}
                  </span>
                  <p className={`text-xs leading-snug flex-1 ${item.resolved ? "line-through" : ""}`}>{item.text}</p>
                </div>
                {item.linked_diff_id && (
                  <p className="text-[9px] text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-0.5">
                    <Link2 className="w-2.5 h-2.5" /> Linked to change
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    onClick={() => toggleWatchResolved(item.id)}
                    title={item.resolved ? "Mark unresolved" : "Mark resolved"}
                    className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${item.resolved ? "text-teal-500" : ""}`} />
                  </button>
                  <button
                    onClick={() => linkWatchToSelected(item.id)}
                    disabled={!selectedDiffId}
                    title={item.linked_diff_id === selectedDiffId ? "Unlink" : "Link to selected change"}
                    className={`p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-30 ${item.linked_diff_id ? "text-teal-500" : "text-muted-foreground"}`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteWatchlistItem(item.id)} title="Delete" className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500 ml-auto">
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
  const [diffResultBase, setDiffResultBase] = useState<CVDiffResult | null>(null) // for stats recompute
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
  const [handoffLoading, setHandoffLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<"original" | "revised">("original")
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  // ── Handoff multi-select (transient — not persisted) ──────────────────────
  // Set of diff IDs the user has checked for selective handoff.
  const [handoffSelectedIds, setHandoffSelectedIds] = useState<Set<string>>(new Set())

  const [jumpOrigPage, setJumpOrigPage] = useState<number | null>(null)
  const [jumpRevPage, setJumpRevPage] = useState<number | null>(null)

  const reviewSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { pages: origPages, loading: origLoading, failed: origFailed } = usePdfRenderer(originalBuf)
  const { pages: revPages,  loading: revLoading,  failed: revFailed  } = usePdfRenderer(revisedBuf)

  const canUse = isAdmin || (entitlements?.toolAccess?.includes("compare-versions") ?? false)

  // ── Group zones (memoized) ─────────────────────────────────────────────────
  const origGroups = useMemo(() => computeGroupZones(diffItems, "original"), [diffItems])
  const revGroups  = useMemo(() => computeGroupZones(diffItems, "revised"),  [diffItems])

  // ── Linked note IDs (memoized from session notes) ──────────────────────────
  const linkedNoteIds = useMemo((): Set<string> => {
    const s = new Set<string>()
    const mn = session?.managerNotes
    if (!mn) return s
    ;(mn.notes ?? []).forEach((n) => { if (n.linked_diff_id) s.add(n.linked_diff_id) })
    mn.watchlist.forEach((w) => { if (w.linked_diff_id) s.add(w.linked_diff_id) })
    return s
  }, [session?.managerNotes])

  // ── Initial load ──────────────────────────────────────────────────────────

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

  // ── Polling ────────────────────────────────────────────────────────────────

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
        }
      } catch { /* ignore poll errors */ }
    }, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session?.status, sessionId])

  // ── AI enrichment polling (Slice 5) ────────────────────────────────────────
  // Runs when ai_status is 'running'. Picks up newly enriched diff items.

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
          // Enrichment finished — refresh diff items with AI-enriched data
          setDiffItems(updated.diffResult?.items ?? diffItems)
          setDiffResultBase(updated.diffResult)
        }
      } catch { /* ignore poll errors */ }
    }, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session?.aiStatus, sessionId])

  // ── Page title ─────────────────────────────────────────────────────────────

  useEffect(() => {
    document.title = session?.title ? `${session.title} — Compare Versions` : "Compare Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [session?.title])

  // ── Rescan ─────────────────────────────────────────────────────────────────

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

  // ── AI Enrich (Slice 5) ────────────────────────────────────────────────────

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

  // ── Handoff to PDF Editor ──────────────────────────────────────────────────
  //
  // Three modes:
  //   handleHandoff()                        → mode "all" (pass undefined)
  //   handleHandoff([...selectedIds])        → mode "selected" — user-checked diffs
  //   handleHandoff([...rejectedIds])        → mode "selected" — review_status==="rejected" diffs
  //
  // The backend uses mode:"all" when diffIds is undefined, mode:"selected" when provided.

  async function handleHandoff(diffIds?: string[]) {
    if (!session || handoffLoading || session.status !== "complete") return
    setHandoffLoading(true)
    try {
      const result = await api.createHandoff(session.id, diffIds)
      navigate(`/pdf-editor/${result.pdfEditorSessionId}?fromCompare=1&handoffId=${result.handoffId}`)
    } catch (err: any) {
      console.error("[CompareVersions] handoff failed:", err)
    } finally {
      setHandoffLoading(false)
    }
  }

  // ── Handoff multi-select toggle ────────────────────────────────────────────

  function toggleHandoffSelect(id: string) {
    setHandoffSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Reject toggle ──────────────────────────────────────────────────────────
  //
  // REJECTED DIFF RULE:
  //   A diff item is "rejected" when item.review_status === "rejected".
  //   This is stored as part of diff_result.items[] and persisted to the DB
  //   via the existing PATCH /sessions/:id/review endpoint (JSONB passthrough).
  //   Reject is toggled: "rejected" → null → "rejected".
  //   It is independent of severity and multi-select.
  //
  //   When the manager clicks "Open rejected in PDF Editor", all items with
  //   review_status === "rejected" are extracted from the current (in-memory) diffItems
  //   and passed as diffIds to createHandoff({ mode: "selected", diffIds: [...] }).
  //   Because diffItems is always kept in sync with the persisted diff_result (loaded
  //   on mount, updated by polling, saved by handleRejectToggle debounce), this
  //   correctly reflects the current persisted review state.

  function handleRejectToggle(itemId: string) {
    setDiffItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          review_status: item.review_status === "rejected" ? null : ("rejected" as const),
        }
      })
      // Debounce persist — share the same timer as severity overrides
      if (reviewSaveTimerRef.current) clearTimeout(reviewSaveTimerRef.current)
      reviewSaveTimerRef.current = setTimeout(() => {
        if (!session) return
        const base = diffResultBase ?? session.diffResult
        if (!base) return
        const updated = recomputeStats(next, base)
        api.patchReview(session.id, updated).catch((err) =>
          console.error("[CompareVersions] reject toggle save failed:", err),
        )
      }, 800)
      return next
    })
  }

  // ── Export report ──────────────────────────────────────────────────────────

  function handleExport() {
    if (!session) return
    const url = api.exportReportUrl(session.id)
    const a = document.createElement("a")
    a.href = url
    a.download = `compare-audit-${session.id.slice(0, 8)}.pdf`
    a.click()
  }

  // ── Jump-to-page ──────────────────────────────────────────────────────────

  function handleSummaryJump(origPage: number | null, revPage: number | null) {
    setJumpOrigPage(null); setJumpRevPage(null)
    setTimeout(() => {
      setJumpOrigPage(origPage)
      setJumpRevPage(revPage)
    }, 30)
    if (origPage != null) setActiveTab("original")
    else if (revPage != null) setActiveTab("revised")
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  function selectDiffItem(id: string) {
    setSelectedDiffId(id)
    setPopover(null)
    const item = diffItems.find((i) => i.id === id)
    if (item) handleSummaryJump(item.page_original, item.page_revised)
  }

  // ── Group click (from pane) ────────────────────────────────────────────────

  function handleGroupClick(zone: CVGroupZone, clientX: number, clientY: number) {
    if (zone.itemIds.length === 1) {
      selectDiffItem(zone.itemIds[0])
    } else {
      const items = zone.itemIds
        .map((id) => diffItems.find((i) => i.id === id))
        .filter((x): x is CVDiffItem => x != null)
      setPopover({ items, x: clientX, y: clientY })
    }
  }

  // ── Hover sync ────────────────────────────────────────────────────────────

  function handleGroupHover(zone: CVGroupZone) {
    setHoveredItemIds(zone.itemIds)
  }
  function handleGroupLeave() { setHoveredItemIds([]) }

  // ── Severity override ─────────────────────────────────────────────────────

  function handleSeverityChange(itemId: string, newSev: CVDiffSeverity) {
    setDiffItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== itemId) return item
        const originalSeverity = item.severity_overridden
          ? (item.meta?.originalSeverity ?? item.severity)
          : item.severity
        return {
          ...item,
          severity: newSev,
          severity_overridden: true,
          meta: { ...item.meta, originalSeverity },
        }
      })
      // Debounce backend persist
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
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  if (entLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (!canUse) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Lock className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Compare Versions requires a Pro plan.</p>
      <button onClick={() => navigate("/upgrade")} className="text-sm text-primary underline">Upgrade →</button>
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

  // Current diff stats from local (possibly overridden) items
  const highCount    = diffItems.filter((i) => i.severity === "high").length
  const totalCount   = diffItems.length
  // Rejected diff IDs — derived from persisted review_status field in current diffItems
  const rejectedDiffIds = diffItems.filter((i) => i.review_status === "rejected").map((i) => i.id)
  const rejectedCount   = rejectedDiffIds.length
  const selectedCount   = handoffSelectedIds.size

  // ── Workspace ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* MiniPopover (fixed, rendered at root of workspace) */}
      {popover && (
        <MiniPopover
          state={popover}
          items={popover.items}
          onSelect={selectDiffItem}
          onClose={() => setPopover(null)}
        />
      )}

      {/* ── Toolbar ── */}
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
            <p className="text-sm font-semibold truncate max-w-[140px] sm:max-w-[260px] lg:max-w-[420px]">
              {session.title}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-muted-foreground">Compare Versions</p>
              {totalCount > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground">· {totalCount} changes</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {session.status !== "scanning" && (
            <button
              onClick={handleRescan}
              disabled={rescanning}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              title="Re-run comparison scan"
            >
              {rescanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Rescan</span>
            </button>
          )}

          {/* AI Review button (Slice 5) — visible when scan is complete and AI isn't running */}
          {session.status === "complete" && session.aiStatus !== "running" && (
            <button
              onClick={() => handleEnrich(session.aiStatus === "complete")}
              disabled={enriching}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                session.aiStatus === "error"
                  ? "border-amber-300/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30"
                  : session.aiStatus === "complete"
                  ? "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  : "border-violet-300/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50/60 dark:hover:bg-violet-950/30"
              }`}
              title={
                session.aiStatus === "error"
                  ? "Retry AI review"
                  : session.aiStatus === "complete"
                  ? "Re-run AI review"
                  : "Run AI review"
              }
            >
              {enriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {session.aiStatus === "error" ? "Retry AI" : session.aiStatus === "complete" ? "Re-run AI" : "AI Review"}
              </span>
            </button>
          )}

          {/* Slice 6: Download Audit Report */}
          {session.status === "complete" && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Download PDF audit report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Report</span>
            </button>
          )}

          {/* Slice 6: PDF Editor handoff group — All / Selected / Rejected */}
          {session.status === "complete" && (
            <div className="flex items-center gap-1 border border-teal-300/50 dark:border-teal-700/40 rounded-lg overflow-hidden">
              {/* Open selected diffs — enabled only when checkboxes checked */}
              <button
                onClick={() => handleHandoff([...handoffSelectedIds])}
                disabled={handoffLoading || selectedCount === 0}
                title={
                  selectedCount === 0
                    ? "Check diffs in the Summary panel to enable"
                    : `Open ${selectedCount} selected diff${selectedCount === 1 ? "" : "s"} in PDF Editor`
                }
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MousePointerClick className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {selectedCount > 0 ? `${selectedCount} selected` : "Selected"}
                </span>
              </button>

              <div className="w-px h-5 bg-teal-200/60 dark:bg-teal-700/40 flex-shrink-0" />

              {/* Open rejected diffs — enabled only when items are rejected */}
              <button
                onClick={() => handleHandoff(rejectedDiffIds)}
                disabled={handoffLoading || rejectedCount === 0}
                title={
                  rejectedCount === 0
                    ? "Mark diffs as rejected in the Summary panel to enable"
                    : `Open ${rejectedCount} rejected diff${rejectedCount === 1 ? "" : "s"} in PDF Editor`
                }
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {rejectedCount > 0 ? `${rejectedCount} rejected` : "Rejected"}
                </span>
              </button>

              <div className="w-px h-5 bg-teal-200/60 dark:bg-teal-700/40 flex-shrink-0" />

              {/* Open all diffs — always available */}
              <button
                onClick={() => handleHandoff()}
                disabled={handoffLoading}
                title="Open all diffs in PDF Editor (all highlights)"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-colors disabled:opacity-50"
              >
                {handoffLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">All</span>
              </button>
            </div>
          )}

          <button
            onClick={() => { setSummaryOpen((o) => !o); if (notesOpen) setNotesOpen(false) }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              summaryOpen
                ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300/60 dark:border-violet-700/40"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            title="Comparison Summary"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            {highCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
            <span className="hidden sm:inline">Summary</span>
          </button>

          <button
            onClick={() => { setNotesOpen((o) => !o); if (summaryOpen) setSummaryOpen(false) }}
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

      {/* ── Status banners ── */}
      {session.status === "scanning" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200/50 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs flex-shrink-0">
          <Scan className="w-3.5 h-3.5 animate-pulse" />
          <span>Analyzing documents — detecting changes across all pages…</span>
          <Loader2 className="w-3 h-3 animate-spin ml-auto" />
        </div>
      )}
      {session.status === "error" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/40 border-b border-red-200/50 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Analysis failed.</span>
          <button onClick={handleRescan} disabled={rescanning} className="ml-1 underline font-semibold disabled:opacity-50">
            {rescanning ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}

      {/* AI enrichment banners (Slice 5) */}
      {session.status === "complete" && session.aiStatus === "running" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-violet-50 dark:bg-violet-950/30 border-b border-violet-200/40 dark:border-violet-800/30 text-violet-700 dark:text-violet-300 text-xs flex-shrink-0">
          <Sparkles className="w-3 h-3 animate-pulse flex-shrink-0" />
          <span>AI review running — enriching change items with context and category…</span>
          <Loader2 className="w-3 h-3 animate-spin ml-auto flex-shrink-0" />
        </div>
      )}
      {session.status === "complete" && session.aiStatus === "error" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/40 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 text-xs flex-shrink-0">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>AI review unavailable. Deterministic comparison is still available.</span>
          <button
            onClick={() => handleEnrich(false)}
            disabled={enriching}
            className="ml-auto underline font-semibold disabled:opacity-50 flex-shrink-0"
          >
            {enriching ? "Retrying…" : "Retry AI"}
          </button>
        </div>
      )}

      {/* ── Mobile tab switcher ── */}
      <div className="flex md:hidden border-b border-border/40 flex-shrink-0 bg-background">
        {(["original", "revised"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab ? "text-teal-600 dark:text-teal-400 border-teal-500" : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab === "original" ? "Baseline" : "Revised"}
          </button>
        ))}
      </div>

      {/* ── Pane area + Notes rail ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left — Baseline (original) */}
        <div className={`flex-col h-full overflow-hidden md:w-[48%] md:flex-shrink-0 ${
          activeTab === "original" ? "flex w-full" : "hidden md:flex"
        }`}>
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

        {/* Gutter */}
        <div className="hidden md:block w-px bg-border/50 flex-shrink-0" />

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

        {/* Notes rail */}
        <NotesRail
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          session={session}
          selectedDiffId={selectedDiffId}
          onSaved={(mn) => setSession((s) => s ? { ...s, managerNotes: mn } : s)}
        />
      </div>

      {/* Summary panel */}
      <SummaryPanel
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        diffItems={diffItems}
        selectedDiffId={selectedDiffId}
        onSelectItem={(id) => {
          selectDiffItem(id)
          setSummaryOpen(true) // keep open
        }}
        onHoverItem={setHoveredItemIds}
        onLeaveItem={() => setHoveredItemIds([])}
        onSeverityChange={handleSeverityChange}
        linkedNoteIds={linkedNoteIds}
        handoffSelectedIds={handoffSelectedIds}
        onToggleHandoffSelect={toggleHandoffSelect}
        onRejectToggle={handleRejectToggle}
      />
    </div>
  )
}
