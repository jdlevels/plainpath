// ─── PDF Editor Workspace ──────────────────────────────────────────────────────
// Correction Workflow Completion Pass:
//   T001 — Handoff issue workflow polish (IssuePanel, focusIssue, corrected state)
//   T002 — Save / autosave / unsaved-state system (tightened)
//   T003 — Right-panel issue navigation + editing clarity
//   T004 — Workspace / layout polish
// ──────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react"
import { useLocation, useSearch } from "wouter"
import * as pdfjsLib from "pdfjs-dist"
import {
  ArrowLeft, Loader2, AlertCircle, Lock, Layers,
  MousePointer2, Type, Square, Highlighter,
  Save, CheckCircle2, Download, ListChecks, ChevronRight,
} from "lucide-react"
import { useEntitlements } from "@/hooks/useEntitlements"
import { usePdfEditorApi } from "@/hooks/usePdfEditorApi"
import type { EditOp, ActiveTool, SaveState, SessionDetail } from "@/lib/pdfEditorTypes"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const RENDER_SCALE = 1.5
const MIN_OP_FRAC = 0.01
const DEFAULT_TEXT_W = 0.25
const DEFAULT_TEXT_H = 0.06
const DEFAULT_FONT_SIZE = 16
const AUTOSAVE_MS = 60_000
const TEXT_DEBOUNCE_MS = 800

// Reverse-map handoff highlight colors → severity
const CV_HL_SEVERITY: Record<string, "high" | "medium" | "low"> = {
  "#fca5a5": "high",
  "#fcd34d": "medium",
  "#6ee7b7": "low",
}

const SEV_STYLES = {
  high:   { dot: "bg-red-400",     badge: "text-red-600 dark:text-red-400",     label: "High" },
  medium: { dot: "bg-amber-400",   badge: "text-amber-600 dark:text-amber-400", label: "Medium" },
  low:    { dot: "bg-emerald-400", badge: "text-emerald-600 dark:text-emerald-400", label: "Low" },
} as const

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PageRender {
  dataUrl: string
  w: number
  h: number
}

type DragKind = "draw" | "move" | "resize"

interface DragState {
  kind: DragKind
  pageIndex: number
  pointerId: number
  opId?: string
  handle?: "nw" | "ne" | "sw" | "se"
  startPageFracX: number
  startPageFracY: number
  origX: number
  origY: number
  origW: number
  origH: number
}

interface HandoffIssue {
  op: EditOp
  ordinal: number
  severity: "high" | "medium" | "low"
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
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise
          renders.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.88), w: canvas.width, h: canvas.height })
          page.cleanup()
        }
        if (!cancelled) { setPages(renders); setLoading(false) }
      } catch (err) {
        console.error("[PdfEditor] usePdfRenderer failed:", err)
        if (!cancelled) { setFailed(true); setLoading(false) }
      }
    })()
    return () => { cancelled = true }
  }, [buf])

  return { pages, loading, failed }
}

// ─── SaveIndicator ─────────────────────────────────────────────────────────────

function SaveIndicator({ state, onSave }: { state: SaveState; onSave: () => void }) {
  if (state === "idle" || state === "unsaved") return null
  if (state === "saving") return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
      <Loader2 className="w-3 h-3 animate-spin" /> Saving…
    </div>
  )
  if (state === "saved") return (
    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 select-none">
      <CheckCircle2 className="w-3 h-3" /> Saved
    </div>
  )
  if (state === "error") return (
    <button
      onClick={onSave}
      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
      title="Click to retry"
    >
      <AlertCircle className="w-3 h-3" /> Save failed — retry
    </button>
  )
  return null
}

// ─── ToolButton ────────────────────────────────────────────────────────────────

function ToolBtn({
  icon: Icon, label, active, onClick,
}: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-300/60 dark:border-violet-700/40"
          : "border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ─── EditOpView ────────────────────────────────────────────────────────────────

function EditOpView({
  op, selected, hoveredFromLeft, activeTool,
  onMoveStart, onResizeStart, onTextChange, onTextBlur,
}: {
  op: EditOp
  selected: boolean
  hoveredFromLeft: boolean
  activeTool: ActiveTool
  onMoveStart: (e: React.PointerEvent) => void
  onResizeStart: (e: React.PointerEvent, handle: "nw" | "ne" | "sw" | "se") => void
  onTextChange: (text: string) => void
  onTextBlur?: () => void
}) {
  const isSelect = activeTool === "select"
  const ptrEvts = isSelect ? "auto" : "none"
  const handles: Array<"nw" | "ne" | "sw" | "se"> = ["nw", "ne", "sw", "se"]

  const base: React.CSSProperties = {
    position: "absolute",
    left: `${op.x * 100}%`,
    top: `${op.y * 100}%`,
    width: `${op.w * 100}%`,
    height: `${op.h * 100}%`,
    boxSizing: "border-box",
    pointerEvents: ptrEvts as any,
    cursor: isSelect ? "move" : "default",
    userSelect: "none",
  }

  const selRing = selected
    ? "2px solid #7c3aed"
    : hoveredFromLeft
    ? "1.5px solid rgba(124,58,237,0.55)"
    : "1.5px dashed rgba(124,58,237,0.25)"

  if (op.kind === "mask") {
    return (
      <div
        style={{
          ...base,
          background: [
            "repeating-linear-gradient(",
            "  45deg,",
            "  rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px,",
            "  transparent 1px, transparent 7px",
            "), white",
          ].join(""),
          outline: isSelect ? selRing : hoveredFromLeft ? selRing : "none",
        }}
        onPointerDown={isSelect ? (e) => { e.stopPropagation(); onMoveStart(e) } : undefined}
      >
        {selected && isSelect && handles.map((h) => (
          <ResizeHandle key={h} handle={h} onStart={(e) => onResizeStart(e, h)} />
        ))}
      </div>
    )
  }

  if (op.kind === "highlight") {
    return (
      <div
        style={{
          ...base,
          backgroundColor: op.highlightColor ?? "#fde68a",
          opacity: op.opacity ?? 0.4,
          outline: isSelect ? selRing : hoveredFromLeft ? selRing : "none",
          ...(op.correctedAt ? { filter: "grayscale(0.6)" } : {}),
        }}
        onPointerDown={isSelect ? (e) => { e.stopPropagation(); onMoveStart(e) } : undefined}
      >
        {selected && isSelect && handles.map((h) => (
          <ResizeHandle key={h} handle={h} onStart={(e) => onResizeStart(e, h)} />
        ))}
        {op.correctedAt && (
          <span style={{
            position: "absolute",
            bottom: 2,
            right: 3,
            fontSize: 8,
            fontWeight: 700,
            background: "rgba(22,163,74,0.85)",
            color: "white",
            borderRadius: 3,
            padding: "1.5px 4px",
            pointerEvents: "none",
            letterSpacing: "0.04em",
          }}>✓ corrected</span>
        )}
      </div>
    )
  }

  // text op
  return (
    <div
      style={{
        ...base,
        outline: isSelect ? selRing : hoveredFromLeft ? selRing : "none",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
      onPointerDown={isSelect ? (e) => { e.stopPropagation(); onMoveStart(e) } : undefined}
    >
      {selected && isSelect ? (
        <textarea
          autoFocus
          value={op.text ?? ""}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={onTextBlur}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Type here…"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: `${op.fontSize ?? DEFAULT_FONT_SIZE}px`,
            color: op.color ?? "#000",
            lineHeight: 1.35,
            padding: "2px 4px",
            fontFamily: "inherit",
          }}
        />
      ) : (
        <div
          style={{
            fontSize: `${op.fontSize ?? DEFAULT_FONT_SIZE}px`,
            color: op.color ?? "#000",
            lineHeight: 1.35,
            padding: "2px 4px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {op.text || (isSelect && (
            <span style={{ opacity: 0.35, fontStyle: "italic" }}>Text</span>
          ))}
        </div>
      )}
      {selected && isSelect && handles.map((h) => (
        <ResizeHandle key={h} handle={h} onStart={(e) => onResizeStart(e, h)} />
      ))}
    </div>
  )
}

function ResizeHandle({
  handle, onStart,
}: { handle: "nw" | "ne" | "sw" | "se"; onStart: (e: React.PointerEvent) => void }) {
  const pos: React.CSSProperties = {
    position: "absolute",
    width: 8, height: 8,
    backgroundColor: "#7c3aed",
    borderRadius: 2,
    cursor: `${handle}-resize`,
    zIndex: 10,
    ...(handle.startsWith("n") ? { top: -4 } : { bottom: -4 }),
    ...(handle.endsWith("w") ? { left: -4 } : { right: -4 }),
  }
  return (
    <div
      style={pos}
      onPointerDown={(e) => { e.stopPropagation(); onStart(e) }}
    />
  )
}

// ─── IssueRow ─────────────────────────────────────────────────────────────────

function IssueRow({
  issue, isSelected, onFocus, onToggleCorrected,
}: {
  issue: HandoffIssue
  isSelected: boolean
  onFocus: () => void
  onToggleCorrected: () => void
}) {
  const sev = SEV_STYLES[issue.severity]
  const corrected = !!issue.op.correctedAt

  return (
    <button
      type="button"
      onClick={onFocus}
      className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/50 border-b border-border/25 last:border-b-0 ${
        isSelected
          ? "bg-violet-50 dark:bg-violet-950/30"
          : corrected
          ? "opacity-55"
          : ""
      }`}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sev.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-foreground">Issue {issue.ordinal}</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            p.{issue.op.pageIndex + 1}
          </span>
        </div>
        <div className={`text-[10px] font-medium mt-0.5 ${sev.badge}`}>{sev.label} severity</div>
        {corrected && (
          <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 mt-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Corrected
          </div>
        )}
      </div>
      <div
        role="button"
        tabIndex={-1}
        title={corrected ? "Mark as open" : "Mark as corrected"}
        onClick={(e) => { e.stopPropagation(); onToggleCorrected() }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onToggleCorrected() } }}
        className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors mt-0.5 ${
          corrected
            ? "text-green-600 hover:text-muted-foreground"
            : "text-muted-foreground/30 hover:text-green-600"
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
      </div>
    </button>
  )
}

// ─── IssuePanel ───────────────────────────────────────────────────────────────

function IssuePanel({
  issues, selectedId, onFocus, onToggleCorrected,
}: {
  issues: HandoffIssue[]
  selectedId: string | null
  onFocus: (opId: string, pageIndex: number) => void
  onToggleCorrected: (opId: string) => void
}) {
  const openCount = issues.filter((i) => !i.op.correctedAt).length
  const doneCount = issues.filter((i) => !!i.op.correctedAt).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-neutral-200/80 dark:bg-zinc-800/80 flex-shrink-0">
        <ListChecks className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issues</span>
        <div className="ml-auto flex items-center gap-1.5">
          {openCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              {openCount} open
            </span>
          )}
          {doneCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              {doneCount} done
            </span>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="px-3 py-2 bg-teal-50/60 dark:bg-teal-950/20 border-b border-teal-200/40 dark:border-teal-800/30 flex-shrink-0">
        <p className="text-[10px] text-teal-700 dark:text-teal-300 leading-relaxed">
          Click an issue to navigate to its location. Use the editing tools to correct it, then mark it done.
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-xs text-muted-foreground px-4 text-center">
            No issue zones loaded.
          </div>
        ) : (
          <div>
            {issues.map((issue) => (
              <IssueRow
                key={issue.op.id}
                issue={issue}
                isSelected={selectedId === issue.op.id}
                onFocus={() => onFocus(issue.op.id, issue.op.pageIndex)}
                onToggleCorrected={() => onToggleCorrected(issue.op.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-3 px-3 py-2 border-t border-border/30 flex-shrink-0">
        {(["high", "medium", "low"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${SEV_STYLES[s].dot}`} />
            <span className="text-[9px] text-muted-foreground">{SEV_STYLES[s].label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EditingCanvas — right pane page overlay ───────────────────────────────────

function EditingCanvas({
  pageIndex, ops, selectedId, hoveredFromLeftIds, activeTool, draftRect,
  pageRef,
  onOverlayPointerDown,
  onMoveStart, onResizeStart, onTextChange, onTextBlur,
}: {
  pageIndex: number
  ops: EditOp[]
  selectedId: string | null
  hoveredFromLeftIds: ReadonlySet<string>
  activeTool: ActiveTool
  draftRect: { x: number; y: number; w: number; h: number; pageIndex: number } | null
  pageRef: (el: HTMLDivElement | null) => void
  onOverlayPointerDown: (e: React.PointerEvent, pi: number) => void
  onMoveStart: (e: React.PointerEvent, op: EditOp) => void
  onResizeStart: (e: React.PointerEvent, op: EditOp, handle: "nw" | "ne" | "sw" | "se") => void
  onTextChange: (opId: string, text: string) => void
  onTextBlur?: () => void
}) {
  const pageOps = ops.filter((o) => o.pageIndex === pageIndex)
  const cursorMap: Record<ActiveTool, string> = {
    select: "default",
    text: "text",
    mask: "crosshair",
    highlight: "crosshair",
  }

  return (
    <div
      ref={pageRef}
      className="absolute inset-0"
      style={{ cursor: cursorMap[activeTool] }}
      onPointerDown={(e) => onOverlayPointerDown(e, pageIndex)}
    >
      {pageOps.map((op) => (
        <EditOpView
          key={op.id}
          op={op}
          selected={selectedId === op.id}
          hoveredFromLeft={hoveredFromLeftIds.has(op.id)}
          activeTool={activeTool}
          onMoveStart={(e) => onMoveStart(e, op)}
          onResizeStart={(e, h) => onResizeStart(e, op, h)}
          onTextChange={(text) => onTextChange(op.id, text)}
          onTextBlur={onTextBlur}
        />
      ))}

      {draftRect && draftRect.pageIndex === pageIndex && (
        <div
          style={{
            position: "absolute",
            left: `${draftRect.x * 100}%`,
            top: `${draftRect.y * 100}%`,
            width: `${draftRect.w * 100}%`,
            height: `${draftRect.h * 100}%`,
            pointerEvents: "none",
            ...(activeTool === "mask"
              ? { backgroundColor: "white", outline: "2px dashed #7c3aed" }
              : { backgroundColor: "#fde68a", opacity: 0.5, outline: "2px dashed #7c3aed" }),
          }}
        />
      )}
    </div>
  )
}

// ─── ChangeIndicatorOverlay helpers ───────────────────────────────────────────

interface IndicatorRect {
  x: number; y: number; w: number; h: number
}

interface IndicatorGroup {
  ops: EditOp[]
  rect: IndicatorRect
}

function rectsOverlap(a: IndicatorRect, b: IndicatorRect): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x ||
           a.y + a.h <= b.y || b.y + b.h <= a.y)
}

function unionRect(a: IndicatorRect, b: IndicatorRect): IndicatorRect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x, y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y,
  }
}

function groupOpsForPage(pageOps: EditOp[]): IndicatorGroup[] {
  let groups: IndicatorGroup[] = pageOps.map((op) => ({
    ops: [op],
    rect: { x: op.x, y: op.y, w: op.w, h: op.h },
  }))

  let merged = true
  while (merged) {
    merged = false
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (rectsOverlap(groups[i].rect, groups[j].rect)) {
          groups[i] = {
            ops: [...groups[i].ops, ...groups[j].ops],
            rect: unionRect(groups[i].rect, groups[j].rect),
          }
          groups.splice(j, 1)
          merged = true
          break outer
        }
      }
    }
  }
  return groups
}

function groupStyle(group: IndicatorGroup): React.CSSProperties {
  const hasMask = group.ops.some((o) => o.kind === "mask")
  const hasText = group.ops.some((o) => o.kind === "text")

  if (hasMask) {
    return {
      backgroundColor: "rgba(50,50,50,0.14)",
      border: "1.5px dashed rgba(50,50,50,0.4)",
    }
  }
  if (hasText) {
    return {
      backgroundColor: "rgba(99,102,241,0.14)",
      border: "1.5px dashed rgba(99,102,241,0.5)",
    }
  }
  return {
    backgroundColor: "rgba(253,230,138,0.45)",
    border: "1.5px dashed rgba(180,150,30,0.5)",
  }
}

// ─── ChangeIndicatorOverlay ────────────────────────────────────────────────────

function ChangeIndicatorOverlay({
  pageIndex,
  ops,
  selectedId,
  hoveredGroupIds,
  onGroupHover,
  onGroupLeave,
}: {
  pageIndex: number
  ops: EditOp[]
  selectedId: string | null
  hoveredGroupIds: ReadonlySet<string>
  onGroupHover: (ids: string[]) => void
  onGroupLeave: () => void
}) {
  const pageOps = ops.filter((o) => (o.pageIndex ?? 0) === pageIndex)
  if (pageOps.length === 0) return null

  const groups = groupOpsForPage(pageOps)

  return (
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      {groups.map((group, gi) => {
        const { rect } = group
        const groupOpIds = group.ops.map((o) => o.id)

        const activeFromRight = selectedId !== null && groupOpIds.includes(selectedId)
        const activeFromLeft = groupOpIds.some((id) => hoveredGroupIds.has(id))
        const isActive = activeFromRight || activeFromLeft

        const baseStyle = groupStyle(group)

        return (
          <div
            key={gi}
            style={{
              position: "absolute",
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
              boxSizing: "border-box",
              borderRadius: 3,
              transition: "opacity 0.15s, border-color 0.15s",
              ...baseStyle,
              ...(isActive
                ? {
                    border: "2px solid rgba(124,58,237,0.75)",
                    backgroundColor: "rgba(124,58,237,0.12)",
                  }
                : {}),
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "auto",
                cursor: "default",
              }}
              onMouseEnter={() => onGroupHover(groupOpIds)}
              onMouseLeave={onGroupLeave}
            />

            {(group.ops.length > 1 || isActive) && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 3,
                  fontSize: 8,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "0.04em",
                  background: isActive
                    ? "rgba(124,58,237,0.85)"
                    : "rgba(0,0,0,0.45)",
                  color: "white",
                  borderRadius: 3,
                  padding: "1.5px 3.5px",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {group.ops.length === 1 ? "1 edit" : `${group.ops.length} edits`}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── OriginalPane ──────────────────────────────────────────────────────────────

function OriginalPane({
  pages, loading, failed,
  ops, selectedId, hoveredGroupIds,
  onGroupHover, onGroupLeave,
}: {
  pages: PageRender[]
  loading: boolean
  failed: boolean
  ops: EditOp[]
  selectedId: string | null
  hoveredGroupIds: ReadonlySet<string>
  onGroupHover: (ids: string[]) => void
  onGroupLeave: () => void
}) {
  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Rendering PDF…</span>
    </div>
  )
  if (failed) return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
      <AlertCircle className="w-6 h-6 text-red-500" />
      <p className="text-sm text-red-500 font-medium">Failed to render PDF</p>
    </div>
  )
  return (
    <div className="space-y-6 p-4 md:p-6">
      {pages.map((pg, i) => (
        <div
          key={i}
          className="relative rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white"
        >
          <img
            src={pg.dataUrl}
            alt={`Page ${i + 1}`}
            className="block w-full select-none pointer-events-none"
            draggable={false}
            style={{ aspectRatio: `${pg.w} / ${pg.h}` }}
          />
          <ChangeIndicatorOverlay
            pageIndex={i}
            ops={ops}
            selectedId={selectedId}
            hoveredGroupIds={hoveredGroupIds}
            onGroupHover={onGroupHover}
            onGroupLeave={onGroupLeave}
          />
          {pages.length > 1 && (
            <span className="absolute top-2 right-2 text-[9px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded pointer-events-none">
              {i + 1} / {pages.length}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── PdfEditorSession ──────────────────────────────────────────────────────────

export default function PdfEditorSession({ sessionId }: { sessionId: string }) {
  const [, navigate] = useLocation()
  const search = useSearch()
  const fromCompare = new URLSearchParams(search).get("fromCompare") === "1"
  const { isAdmin, entitlements, loading: entLoading } = useEntitlements()
  const api = usePdfEditorApi()

  // Session + PDF load state
  const [sessionMeta, setSessionMeta] = useState<SessionDetail | null>(null)
  const [pdfBuf, setPdfBuf] = useState<ArrayBuffer | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Editing state
  const [activeTool, setActiveTool] = useState<ActiveTool>("select")
  const [ops, setOps] = useState<EditOp[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftRect, setDraftRect] = useState<{ x: number; y: number; w: number; h: number; pageIndex: number } | null>(null)

  // Save state
  const [saveState, setSaveState] = useState<SaveState>("idle")

  // Export state
  const [exportState, setExportState] = useState<"idle" | "exporting" | "error">("idle")

  // Mobile tab
  const [activeTab, setActiveTab] = useState<"original" | "copy">("copy")

  // Issue panel (shown when fromCompare)
  const [showIssuePanel, setShowIssuePanel] = useState(fromCompare)

  // Left-pane hover sync: set of op IDs in the currently-hovered indicator group
  const [hoveredFromLeft, setHoveredFromLeft] = useState<ReadonlySet<string>>(new Set())

  const handleGroupHover = useCallback((ids: string[]) => {
    setHoveredFromLeft(new Set(ids))
  }, [])

  const handleGroupLeave = useCallback(() => {
    setHoveredFromLeft(new Set())
  }, [])

  // Refs (stable, no re-render needed)
  const liveOpsRef = useRef<EditOp[]>([])
  const draftRectRef = useRef(draftRect)
  const dragStateRef = useRef<DragState | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const historyRef = useRef<EditOp[][]>([[]])
  const histIdxRef = useRef(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeToolRef = useRef(activeTool)
  const selectedIdRef = useRef(selectedId)
  const saveStateRef = useRef(saveState)
  const workingCopyScrollRef = useRef<HTMLDivElement>(null)

  // Keep refs in sync
  useEffect(() => { liveOpsRef.current = ops }, [ops])
  useEffect(() => { draftRectRef.current = draftRect }, [draftRect])
  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  useEffect(() => { saveStateRef.current = saveState }, [saveState])

  // Handoff issues: ops that originated from Compare Versions (id = "cv-...")
  const handoffIssues = useMemo<HandoffIssue[]>(() => {
    const cvOps = ops.filter((op) => op.id.startsWith("cv-"))
    return cvOps.map((op, i) => ({
      op,
      ordinal: i + 1,
      severity: CV_HL_SEVERITY[op.highlightColor ?? ""] ?? "medium",
    }))
  }, [ops])

  // PDF renderer
  const { pages, loading: pdfLoading, failed: pdfFailed } = usePdfRenderer(pdfBuf)

  // ── Load session + PDF ──────────────────────────────────────────────────────

  useEffect(() => {
    if (entLoading) return
    let cancelled = false
    setLoadError(null)

    async function load() {
      try {
        const [session, buf] = await Promise.all([
          api.getSession(sessionId),
          api.getPdf(sessionId),
        ])
        if (cancelled) return
        setSessionMeta(session)
        setOps(session.ops)
        liveOpsRef.current = session.ops
        historyRef.current = [session.ops]
        histIdxRef.current = 0
        setPdfBuf(buf)
      } catch (err: any) {
        if (cancelled) return
        setLoadError(err?.status === 404 ? "Session not found." : "Failed to load session.")
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionId, entLoading])

  // ── Set page count once after render ───────────────────────────────────────

  useEffect(() => {
    if (!pages.length || !sessionMeta || sessionMeta.pageCount != null) return
    api.setPageCount(sessionId, pages.length).catch(() => {})
  }, [pages.length, sessionMeta])

  // ── Document title ─────────────────────────────────────────────────────────

  useEffect(() => {
    const name = sessionMeta?.fileName ?? "PDF Editor"
    document.title = `${name} — PDF Editor — PlainPath`
    return () => { document.title = "PlainPath" }
  }, [sessionMeta?.fileName])

  // ── Save functions ─────────────────────────────────────────────────────────

  const saveNow = useCallback(async (opsToSave: EditOp[]) => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
    setSaveState("saving")
    try {
      await api.saveOps(sessionId, opsToSave)
      setSaveState("saved")
      setTimeout(() => setSaveState((prev) => prev === "saved" ? "idle" : prev), 3000)
    } catch {
      setSaveState("error")
    }
  }, [api.saveOps, sessionId])

  const saveNowRef = useRef(saveNow)
  useEffect(() => { saveNowRef.current = saveNow }, [saveNow])

  function scheduleSave(opsToSave: EditOp[], delayMs = 0) {
    setSaveState("unsaved")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (delayMs === 0) {
      saveNow(opsToSave)
    } else {
      saveTimerRef.current = setTimeout(() => saveNow(opsToSave), delayMs)
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (exportState === "exporting") return
    await saveNow(liveOpsRef.current)
    setExportState("exporting")
    try {
      const blob = await api.exportSession(sessionId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const baseName = (sessionMeta?.fileName ?? "document").replace(/\.pdf$/i, "")
      a.download = `${baseName}-edited.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportState("idle")
    } catch {
      setExportState("error")
      setTimeout(() => setExportState("idle"), 4000)
    }
  }, [exportState, saveNow, api.exportSession, sessionId, sessionMeta?.fileName])

  // Autosave every 60s if unsaved
  useEffect(() => {
    autosaveTimerRef.current = setInterval(() => {
      if (saveStateRef.current === "unsaved") {
        saveNowRef.current(liveOpsRef.current)
      }
    }, AUTOSAVE_MS)
    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current)
    }
  }, [])

  // ── History (undo/redo) ────────────────────────────────────────────────────

  function pushHistory(newOps: EditOp[]) {
    const truncated = historyRef.current.slice(0, histIdxRef.current + 1)
    truncated.push(newOps)
    if (truncated.length > 50) truncated.shift()
    historyRef.current = truncated
    histIdxRef.current = truncated.length - 1
  }

  function commitOps(newOps: EditOp[], saveDelay = 0) {
    setOps(newOps)
    liveOpsRef.current = newOps
    pushHistory(newOps)
    scheduleSave(newOps, saveDelay)
  }

  function undo() {
    if (histIdxRef.current > 0) {
      histIdxRef.current--
      const prev = historyRef.current[histIdxRef.current]
      setOps(prev)
      liveOpsRef.current = prev
      saveNow(prev)
    }
  }

  function redo() {
    if (histIdxRef.current < historyRef.current.length - 1) {
      histIdxRef.current++
      const next = historyRef.current[histIdxRef.current]
      setOps(next)
      liveOpsRef.current = next
      saveNow(next)
    }
  }

  function deleteSelected() {
    const id = selectedIdRef.current
    if (!id) return
    const newOps = liveOpsRef.current.filter((o) => o.id !== id)
    setSelectedId(null)
    commitOps(newOps)
  }

  // ── Issue navigation (handoff) ─────────────────────────────────────────────

  const focusIssue = useCallback((opId: string, pageIndex: number) => {
    setSelectedId(opId)
    setActiveTab("copy")
    // Slight delay to let mobile tab switch render before scrolling
    setTimeout(() => {
      const el = pageRefs.current.get(pageIndex)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 60)
  }, [])

  const toggleCorrected = useCallback((opId: string) => {
    const now = new Date().toISOString()
    const newOps = liveOpsRef.current.map((o) =>
      o.id === opId
        ? { ...o, correctedAt: o.correctedAt ? undefined : now }
        : o
    )
    setOps(newOps)
    liveOpsRef.current = newOps
    scheduleSave(newOps, 0)
  }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (meta && (e.key === "Z" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return }
      if (meta && e.key === "s") { e.preventDefault(); saveNowRef.current(liveOpsRef.current); return }
      if (e.key === "Escape") { setSelectedId(null); return }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIdRef.current) {
        const tag = (document.activeElement as HTMLElement)?.tagName
        const ce = (document.activeElement as HTMLElement)?.getAttribute("contenteditable")
        if (tag === "TEXTAREA" || tag === "INPUT" || ce === "true") return
        e.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── Global pointer move + up (for drag/draw) ───────────────────────────────

  useEffect(() => {
    function getPageFrac(e: PointerEvent, pageIndex: number) {
      const el = pageRefs.current.get(pageIndex)
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      }
    }

    function onMove(e: PointerEvent) {
      const ds = dragStateRef.current
      if (!ds || e.pointerId !== ds.pointerId) return
      const { x: fx, y: fy } = getPageFrac(e, ds.pageIndex)

      if (ds.kind === "draw") {
        const x = Math.min(ds.startPageFracX, fx)
        const y = Math.min(ds.startPageFracY, fy)
        const w = Math.abs(fx - ds.startPageFracX)
        const h = Math.abs(fy - ds.startPageFracY)
        const dr = { x, y, w, h, pageIndex: ds.pageIndex }
        draftRectRef.current = dr
        setDraftRect(dr)
        return
      }

      const dx = fx - ds.startPageFracX
      const dy = fy - ds.startPageFracY

      if (ds.kind === "move") {
        const nx = clamp(ds.origX + dx, 0, 1 - ds.origW)
        const ny = clamp(ds.origY + dy, 0, 1 - ds.origH)
        const newOps = liveOpsRef.current.map((o) =>
          o.id === ds.opId ? { ...o, x: nx, y: ny } : o
        )
        liveOpsRef.current = newOps
        setOps(newOps)
        return
      }

      if (ds.kind === "resize") {
        let { origX: ox, origY: oy, origW: ow, origH: oh } = ds
        let nx = ox, ny = oy, nw = ow, nh = oh
        const MIN = MIN_OP_FRAC
        if (ds.handle === "nw") {
          nx = clamp(ox + dx, 0, ox + ow - MIN); nw = ow - (nx - ox)
          ny = clamp(oy + dy, 0, oy + oh - MIN); nh = oh - (ny - oy)
        } else if (ds.handle === "ne") {
          ny = clamp(oy + dy, 0, oy + oh - MIN); nh = oh - (ny - oy)
          nw = clamp(ow + dx, MIN, 1 - ox)
        } else if (ds.handle === "sw") {
          nx = clamp(ox + dx, 0, ox + ow - MIN); nw = ow - (nx - ox)
          nh = clamp(oh + dy, MIN, 1 - oy)
        } else if (ds.handle === "se") {
          nw = clamp(ow + dx, MIN, 1 - ox)
          nh = clamp(oh + dy, MIN, 1 - oy)
        }
        const newOps = liveOpsRef.current.map((o) =>
          o.id === ds.opId ? { ...o, x: nx, y: ny, w: nw, h: nh } : o
        )
        liveOpsRef.current = newOps
        setOps(newOps)
      }
    }

    function onUp(e: PointerEvent) {
      const ds = dragStateRef.current
      if (!ds || e.pointerId !== ds.pointerId) return
      dragStateRef.current = null

      if (ds.kind === "draw") {
        const dr = draftRectRef.current
        setDraftRect(null)
        draftRectRef.current = null
        if (!dr || dr.w < MIN_OP_FRAC || dr.h < MIN_OP_FRAC) return
        const tool = activeToolRef.current
        const newOp: EditOp = {
          id: crypto.randomUUID(),
          kind: tool === "mask" ? "mask" : "highlight",
          pageIndex: ds.pageIndex,
          x: dr.x, y: dr.y, w: dr.w, h: dr.h,
          ...(tool === "highlight" ? { highlightColor: "#fde68a", opacity: 0.4 } : {}),
        }
        const newOps = [...liveOpsRef.current, newOp]
        setSelectedId(newOp.id)
        commitOps(newOps, 0)
        return
      }

      const final = liveOpsRef.current
      pushHistory(final)
      saveNowRef.current(final)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [])

  // ── Pointer handlers (per-page overlay) ───────────────────────────────────

  function handleOverlayPointerDown(e: React.PointerEvent, pageIndex: number) {
    if (e.button !== 0) return
    const tool = activeToolRef.current
    const el = pageRefs.current.get(pageIndex)
    if (!el) return
    const r = el.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width
    const fy = (e.clientY - r.top) / r.height

    if (tool === "select") {
      setSelectedId(null)
      return
    }

    if (tool === "text") {
      const w = DEFAULT_TEXT_W
      const h = DEFAULT_TEXT_H
      const x = clamp(fx - w / 2, 0, 1 - w)
      const y = clamp(fy - h / 2, 0, 1 - h)
      const newOp: EditOp = {
        id: crypto.randomUUID(),
        kind: "text",
        pageIndex,
        x, y, w, h,
        text: "",
        fontSize: DEFAULT_FONT_SIZE,
        color: "#000000",
      }
      const newOps = [...liveOpsRef.current, newOp]
      setSelectedId(newOp.id)
      setActiveTool("select")
      activeToolRef.current = "select"
      commitOps(newOps, 0)
      return
    }

    dragStateRef.current = {
      kind: "draw",
      pageIndex,
      pointerId: e.pointerId,
      startPageFracX: fx,
      startPageFracY: fy,
      origX: fx, origY: fy, origW: 0, origH: 0,
    }
  }

  function handleMoveStart(e: React.PointerEvent, op: EditOp) {
    if (e.button !== 0) return
    if (activeToolRef.current !== "select") return
    const el = pageRefs.current.get(op.pageIndex)
    if (!el) return
    const r = el.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width
    const fy = (e.clientY - r.top) / r.height
    setSelectedId(op.id)
    dragStateRef.current = {
      kind: "move",
      pageIndex: op.pageIndex,
      pointerId: e.pointerId,
      opId: op.id,
      startPageFracX: fx,
      startPageFracY: fy,
      origX: op.x, origY: op.y, origW: op.w, origH: op.h,
    }
  }

  function handleResizeStart(e: React.PointerEvent, op: EditOp, handle: "nw" | "ne" | "sw" | "se") {
    if (e.button !== 0) return
    const el = pageRefs.current.get(op.pageIndex)
    if (!el) return
    const r = el.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width
    const fy = (e.clientY - r.top) / r.height
    dragStateRef.current = {
      kind: "resize",
      pageIndex: op.pageIndex,
      pointerId: e.pointerId,
      opId: op.id,
      handle,
      startPageFracX: fx,
      startPageFracY: fy,
      origX: op.x, origY: op.y, origW: op.w, origH: op.h,
    }
  }

  function handleTextChange(opId: string, text: string) {
    const newOps = liveOpsRef.current.map((o) => o.id === opId ? { ...o, text } : o)
    setOps(newOps)
    liveOpsRef.current = newOps
    scheduleSave(newOps, TEXT_DEBOUNCE_MS)
  }

  function handleTextBlur() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    saveNowRef.current(liveOpsRef.current)
  }

  // ── Entitlement gate ───────────────────────────────────────────────────────

  const canUse = isAdmin || (entitlements?.toolAccess?.includes("pdf-editor") ?? false)

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
        <p className="text-sm text-muted-foreground">PDF Editor requires a Pro plan.</p>
        <button onClick={() => navigate("/upgrade")} className="text-sm text-primary underline">Upgrade →</button>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="font-medium">{loadError}</p>
        <button onClick={() => navigate("/pdf-editor")} className="text-sm text-muted-foreground underline">← Back</button>
      </div>
    )
  }

  if (!sessionMeta || !pdfBuf) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pageLabel = pdfLoading ? "Loading…" : pdfFailed ? "Error" : `${pages.length} page${pages.length !== 1 ? "s" : ""}`
  const editCount = ops.length
  const issueCount = handoffIssues.length
  const correctedCount = handoffIssues.filter((i) => !!i.op.correctedAt).length

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-background/95 backdrop-blur-sm flex-shrink-0 gap-2">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate("/pdf-editor")}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Back to PDF Editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[200px] lg:max-w-[340px]">
              {sessionMeta.fileName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {pageLabel}
              {editCount > 0 && ` · ${editCount} edit${editCount !== 1 ? "s" : ""}`}
              {fromCompare && issueCount > 0 && ` · ${correctedCount}/${issueCount} issues done`}
            </p>
          </div>
        </div>

        {/* Centre: tools */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <ToolBtn icon={MousePointer2} label="Select" active={activeTool === "select"} onClick={() => setActiveTool("select")} />
          <ToolBtn icon={Type} label="Text" active={activeTool === "text"} onClick={() => setActiveTool("text")} />
          <ToolBtn icon={Square} label="Mask" active={activeTool === "mask"} onClick={() => setActiveTool("mask")} />
          <ToolBtn icon={Highlighter} label="Highlight" active={activeTool === "highlight"} onClick={() => setActiveTool("highlight")} />
        </div>

        {/* Right: save indicator + save + export */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <SaveIndicator state={saveState} onSave={() => saveNow(liveOpsRef.current)} />

          {/* Save button — amber pulse when unsaved */}
          <button
            onClick={() => saveNow(liveOpsRef.current)}
            disabled={saveState === "saving"}
            title="Save (⌘S)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              saveState === "unsaved"
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 animate-pulse"
                : saveState === "saving"
                ? "border-border/50 text-muted-foreground cursor-not-allowed"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {saveState === "saving" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveState === "unsaved" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>

          {/* Download / Export button */}
          <button
            onClick={handleExport}
            disabled={exportState === "exporting"}
            title={exportState === "error" ? "Export failed — retry" : "Download edited PDF"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              exportState === "error"
                ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                : exportState === "exporting"
                ? "border-border/50 text-muted-foreground cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 border-violet-600 hover:border-violet-700 text-white"
            }`}
          >
            {exportState === "exporting" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : exportState === "error" ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {exportState === "exporting" ? "Exporting…" : exportState === "error" ? "Failed" : "Download"}
            </span>
          </button>
        </div>
      </div>

      {/* ── From-compare context banner ── */}
      {fromCompare && (
        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-950/40 border-b border-teal-200 dark:border-teal-800/40 text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 min-w-0">
            <span className="font-semibold flex-shrink-0">Opened from Compare Versions.</span>
            {issueCount > 0 ? (
              <span className="text-teal-600/80 dark:text-teal-400/80 hidden sm:inline">
                {issueCount} issue zone{issueCount !== 1 ? "s" : ""} pre-loaded.
                Use the <strong className="font-semibold">Issues panel</strong> on the right to navigate and mark corrections.
              </span>
            ) : (
              <span className="text-teal-600/80 dark:text-teal-400/80 hidden sm:inline">
                Edits here won&rsquo;t affect the original comparison session.
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {fromCompare && issueCount > 0 && (
              <button
                onClick={() => setShowIssuePanel((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors border ${
                  showIssuePanel
                    ? "bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                    : "border-teal-300/60 dark:border-teal-700/40 text-teal-600 dark:text-teal-400 hover:bg-teal-100/50"
                }`}
              >
                <ListChecks className="w-3 h-3" />
                {showIssuePanel ? "Hide issues" : `Show ${issueCount} issues`}
              </button>
            )}
            <button
              onClick={() => window.history.back()}
              className="flex-shrink-0 text-xs underline font-medium text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Mobile tools bar */}
      <div className="flex sm:hidden items-center gap-1 px-3 py-1.5 border-b border-border/40 bg-background flex-shrink-0 overflow-x-auto">
        <ToolBtn icon={MousePointer2} label="Select" active={activeTool === "select"} onClick={() => setActiveTool("select")} />
        <ToolBtn icon={Type} label="Text" active={activeTool === "text"} onClick={() => setActiveTool("text")} />
        <ToolBtn icon={Square} label="Mask" active={activeTool === "mask"} onClick={() => setActiveTool("mask")} />
        <ToolBtn icon={Highlighter} label="Highlight" active={activeTool === "highlight"} onClick={() => setActiveTool("highlight")} />
      </div>

      {/* Mobile tab switcher */}
      <div className="flex md:hidden border-b border-border/40 flex-shrink-0 bg-background">
        {(["original", "copy"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? "text-violet-600 dark:text-violet-400 border-violet-500"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab === "original" ? "Original" : "Working Copy"}
          </button>
        ))}
        {fromCompare && issueCount > 0 && (
          <button
            onClick={() => setActiveTab("copy")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
              false
                ? "text-violet-600 dark:text-violet-400 border-violet-500"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Issues ({issueCount})
          </button>
        )}
      </div>

      {/* ── Pane area ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Left — Original (read-only) */}
        <div className={`flex-col w-full md:w-[42%] md:flex-shrink-0 overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70 ${activeTab === "original" ? "flex" : "hidden md:flex"}`}>
          <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2 bg-neutral-200/80 dark:bg-zinc-800/80 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Original · Read only
            </span>
          </div>
          <OriginalPane
            pages={pages}
            loading={pdfLoading}
            failed={pdfFailed}
            ops={ops}
            selectedId={selectedId}
            hoveredGroupIds={hoveredFromLeft}
            onGroupHover={handleGroupHover}
            onGroupLeave={handleGroupLeave}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border/50 flex-shrink-0" />

        {/* Right — Working Copy + optional Issue Panel */}
        <div className={`flex-col flex-1 overflow-hidden bg-neutral-100 dark:bg-zinc-900/70 ${activeTab === "copy" ? "flex" : "hidden md:flex"}`}>

          {/* Right pane header */}
          <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2 bg-neutral-200/80 dark:bg-zinc-800/80 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Working Copy · {editCount} edit{editCount !== 1 ? "s" : ""}
            </span>
            {/* Issue panel toggle button (desktop only) */}
            {fromCompare && issueCount > 0 && (
              <button
                onClick={() => setShowIssuePanel((v) => !v)}
                title={showIssuePanel ? "Hide issue panel" : "Show issue panel"}
                className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  showIssuePanel
                    ? "text-violet-700 dark:text-violet-300 bg-violet-100/60 dark:bg-violet-900/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <ListChecks className="w-3 h-3" />
                <span>{issueCount} issue{issueCount !== 1 ? "s" : ""}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${showIssuePanel ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* Content row: document canvas + issue sidebar */}
          <div className="flex flex-1 overflow-hidden">

            {/* Document canvas — scrollable */}
            <div ref={workingCopyScrollRef} className="flex-1 overflow-y-auto">
              {pdfLoading && (
                <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Rendering PDF…</span>
                </div>
              )}
              {pdfFailed && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <p className="text-sm text-red-500 font-medium">Failed to render PDF</p>
                  <button onClick={() => navigate("/pdf-editor")} className="text-xs text-muted-foreground underline">← Back</button>
                </div>
              )}
              {!pdfLoading && !pdfFailed && (
                <div className="space-y-6 p-4 md:p-6">
                  {pages.map((pg, i) => (
                    <div
                      key={i}
                      className="relative rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white select-none"
                      style={{ aspectRatio: `${pg.w} / ${pg.h}` }}
                    >
                      <img
                        src={pg.dataUrl}
                        alt={`Page ${i + 1}`}
                        className="block w-full pointer-events-none"
                        draggable={false}
                      />
                      <EditingCanvas
                        pageIndex={i}
                        ops={ops}
                        selectedId={selectedId}
                        hoveredFromLeftIds={hoveredFromLeft}
                        activeTool={activeTool}
                        draftRect={draftRect}
                        pageRef={(el) => {
                          if (el) pageRefs.current.set(i, el)
                          else pageRefs.current.delete(i)
                        }}
                        onOverlayPointerDown={handleOverlayPointerDown}
                        onMoveStart={handleMoveStart}
                        onResizeStart={handleResizeStart}
                        onTextChange={handleTextChange}
                        onTextBlur={handleTextBlur}
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

            {/* Issue panel sidebar — desktop only, shown when fromCompare + issueCount > 0 + showIssuePanel */}
            {fromCompare && issueCount > 0 && showIssuePanel && (
              <div className="hidden md:flex flex-col w-60 xl:w-64 flex-shrink-0 border-l border-border/40 bg-background overflow-hidden">
                <IssuePanel
                  issues={handoffIssues}
                  selectedId={selectedId}
                  onFocus={focusIssue}
                  onToggleCorrected={toggleCorrected}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
