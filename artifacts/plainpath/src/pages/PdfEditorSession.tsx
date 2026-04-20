// ─── PDF Editor Workspace ──────────────────────────────────────────────────────
// Slice 2: text overlays, mask, highlight, select/move/resize/delete,
//          save system (immediate + debounce + autosave), undo/redo.
// Left pane = original read-only. Right pane = editable working copy.
// ──────────────────────────────────────────────────────────────────────────────

import {
  useState, useEffect, useRef, useCallback,
} from "react"
import { useLocation } from "wouter"
import * as pdfjsLib from "pdfjs-dist"
import {
  ArrowLeft, Loader2, AlertCircle, Lock, Layers,
  MousePointer2, Type, Square, Highlighter,
  Save, CheckCircle2, RefreshCw,
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
        // Slice the buffer before passing to pdfjs — the worker may transfer
        // (neuter) the underlying ArrayBuffer. Slicing ensures each call has
        // its own copy, which is critical in React Strict Mode (double-invoke).
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
  if (state === "idle") return null
  if (state === "saving") return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 className="w-3 h-3 animate-spin" /> Saving…
    </div>
  )
  if (state === "saved") return (
    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
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
// Renders a single edit op. Handles selection outline + resize handles + text edit.

function EditOpView({
  op, selected, activeTool, onMoveStart, onResizeStart, onTextChange, onTextBlur,
}: {
  op: EditOp
  selected: boolean
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
    : "1.5px dashed rgba(124,58,237,0.25)"

  if (op.kind === "mask") {
    return (
      <div
        style={{ ...base, backgroundColor: "white", outline: isSelect ? selRing : "none" }}
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
          outline: isSelect ? selRing : "none",
        }}
        onPointerDown={isSelect ? (e) => { e.stopPropagation(); onMoveStart(e) } : undefined}
      >
        {selected && isSelect && handles.map((h) => (
          <ResizeHandle key={h} handle={h} onStart={(e) => onResizeStart(e, h)} />
        ))}
      </div>
    )
  }

  // text op
  return (
    <div
      style={{
        ...base,
        outline: isSelect ? selRing : "none",
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

// ─── EditingCanvas — right pane page overlay ───────────────────────────────────

function EditingCanvas({
  pageIndex, ops, selectedId, activeTool, draftRect,
  pageRef,
  onOverlayPointerDown,
  onMoveStart, onResizeStart, onTextChange, onTextBlur,
}: {
  pageIndex: number
  ops: EditOp[]
  selectedId: string | null
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

// ─── OriginalPane ──────────────────────────────────────────────────────────────

function OriginalPane({ pages, loading, failed }: { pages: PageRender[]; loading: boolean; failed: boolean }) {
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
    <div className="space-y-6 p-6">
      {pages.map((pg, i) => (
        <div key={i} className="relative rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white">
          <img
            src={pg.dataUrl}
            alt={`Page ${i + 1}`}
            className="block w-full select-none pointer-events-none"
            draggable={false}
            style={{ aspectRatio: `${pg.w} / ${pg.h}` }}
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

  // Mobile tab
  const [activeTab, setActiveTab] = useState<"original" | "copy">("original")

  // Refs (stable, no re-render needed)
  const liveOpsRef = useRef<EditOp[]>([])          // always current ops
  const draftRectRef = useRef(draftRect)             // always current draftRect
  const dragStateRef = useRef<DragState | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const historyRef = useRef<EditOp[][]>([[]])
  const histIdxRef = useRef(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeToolRef = useRef(activeTool)
  const selectedIdRef = useRef(selectedId)
  const saveStateRef = useRef(saveState)

  // Keep refs in sync
  useEffect(() => { liveOpsRef.current = ops }, [ops])
  useEffect(() => { draftRectRef.current = draftRect }, [draftRect])
  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  useEffect(() => { saveStateRef.current = saveState }, [saveState])

  // PDF renderer (adapts from Slice 1 hook)
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

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (meta && (e.key === "Z" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return }
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

      // move or resize: ops already live-updated during pointermove
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
  }, []) // empty — reads from refs

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
      // Place text op immediately at click point, then switch to Select so
      // the textarea becomes active (textarea only renders when isSelect=true).
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
      setActiveTool("select")       // show textarea immediately
      activeToolRef.current = "select"
      commitOps(newOps, 0)          // immediate save on place
      return
    }

    // mask or highlight: begin draw
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

  // Immediate save when the text textarea loses focus — ensures typed content
  // persists even if the user clicks away before the 800ms debounce fires.
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
            <p className="text-sm font-semibold truncate max-w-[140px] sm:max-w-[240px] lg:max-w-[380px]">
              {sessionMeta.fileName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {pageLabel}
              {editCount > 0 && ` · ${editCount} edit${editCount !== 1 ? "s" : ""}`}
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

        {/* Right: save */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <SaveIndicator state={saveState} onSave={() => saveNow(liveOpsRef.current)} />
          <button
            onClick={() => saveNow(liveOpsRef.current)}
            disabled={saveState === "saving"}
            title="Save"
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
                <span className="hidden xs:inline">Save</span>
              </>
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

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
      </div>

      {/* ── Pane area ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Left — Original (read-only) */}
        <div className={`flex-col w-full md:w-[45%] md:flex-shrink-0 overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70 ${activeTab === "original" ? "flex" : "hidden md:flex"}`}>
          <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2 bg-neutral-200/80 dark:bg-zinc-800/80 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Original · Read only
            </span>
          </div>
          <OriginalPane pages={pages} loading={pdfLoading} failed={pdfFailed} />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border/50 flex-shrink-0" />

        {/* Right — Working Copy (editable) */}
        <div className={`flex-col flex-1 overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70 ${activeTab === "copy" ? "flex" : "hidden md:flex"}`}>
          <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2 bg-neutral-200/80 dark:bg-zinc-800/80 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Working Copy · {editCount} edit{editCount !== 1 ? "s" : ""}
            </span>
          </div>

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
            <div className="space-y-6 p-6">
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
      </div>
    </div>
  )
}
