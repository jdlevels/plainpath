// ─── PDF Signature Workspace ──────────────────────────────────────────────────
// Renders a PDF file page by page and lets the user click to place, drag to
// move, and resize signature-related fields directly on the document.
// Coordinates are stored as fractions (0..1) of page width/height so they
// are resolution-independent and can be converted to PDF points on send.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { Loader2, AlertCircle } from "lucide-react"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType = "signature" | "initials" | "date_signed" | "name" | "title" | "text"

export interface PlacedField {
  id: string
  type: FieldType
  page: number
  x: number        // fraction of page width (0..1) from left
  y: number        // fraction of page height (0..1) from top
  width: number    // fraction of page width
  height: number   // fraction of page height
  label?: string
  required: boolean
}

export interface PageDimension {
  w_pts: number    // page width in PDF points (72 DPI)
  h_pts: number    // page height in PDF points
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RENDER_SCALE = 1.5

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  signature: "Signature",
  initials: "Initials",
  date_signed: "Date Signed",
  name: "Full Name",
  title: "Job Title",
  text: "Text Field",
}

const FIELD_COLORS: Record<FieldType, { border: string; bg: string; text: string }> = {
  signature: { border: "#7c3aed", bg: "rgba(139,92,246,0.10)", text: "#7c3aed" },
  initials: { border: "#2563eb", bg: "rgba(59,130,246,0.10)", text: "#2563eb" },
  date_signed: { border: "#059669", bg: "rgba(16,185,129,0.10)", text: "#059669" },
  name: { border: "#d97706", bg: "rgba(245,158,11,0.10)", text: "#d97706" },
  title: { border: "#ea580c", bg: "rgba(249,115,22,0.10)", text: "#ea580c" },
  text: { border: "#4b5563", bg: "rgba(107,114,128,0.10)", text: "#4b5563" },
}

export const FIELD_DEFAULTS: Record<FieldType, { w: number; h: number }> = {
  signature: { w: 0.28, h: 0.052 },
  initials:  { w: 0.10, h: 0.052 },
  date_signed: { w: 0.20, h: 0.036 },
  name:      { w: 0.26, h: 0.036 },
  title:     { w: 0.20, h: 0.036 },
  text:      { w: 0.28, h: 0.036 },
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface PageRender {
  dataUrl: string
  w_canvas: number
  h_canvas: number
  w_pts: number
  h_pts: number
}

type DragMode =
  | "move"
  | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se"

interface DragState {
  fieldId: string
  mode: DragMode
  startClientX: number
  startClientY: number
  startField: PlacedField
  overlayW: number
  overlayH: number
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  pdfFile: File
  fields: PlacedField[]
  activeFieldType: FieldType | null
  selectedFieldId: string | null
  onFieldsChange: (fields: PlacedField[]) => void
  onFieldSelect: (id: string | null) => void
  onPageDimensionsLoaded: (dims: PageDimension[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PdfSignatureWorkspace({
  pdfFile,
  fields,
  activeFieldType,
  selectedFieldId,
  onFieldsChange,
  onFieldSelect,
  onPageDimensionsLoaded,
}: Props) {
  const [pages, setPages] = useState<PageRender[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  // Stable refs so drag callbacks don't need to be recreated on every render
  const fieldsRef = useRef(fields)
  const onFieldsChangeRef = useRef(onFieldsChange)
  const onFieldSelectRef = useRef(onFieldSelect)
  useEffect(() => { fieldsRef.current = fields }, [fields])
  useEffect(() => { onFieldsChangeRef.current = onFieldsChange }, [onFieldsChange])
  useEffect(() => { onFieldSelectRef.current = onFieldSelect }, [onFieldSelect])

  const dragRef = useRef<DragState | null>(null)

  // ── Load and render all PDF pages ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setPages([])

    ;(async () => {
      try {
        const buf = await pdfFile.arrayBuffer()
        const pdf = await pdfjsLib
          .getDocument({ data: new Uint8Array(buf), verbosity: 0 })
          .promise

        if (cancelled) return

        const renders: PageRender[] = []
        const dims: PageDimension[] = []

        for (let pn = 1; pn <= pdf.numPages; pn++) {
          if (cancelled) break
          const page = await pdf.getPage(pn)

          const vp1 = page.getViewport({ scale: 1 })
          dims.push({ w_pts: vp1.width, h_pts: vp1.height })

          const vp = page.getViewport({ scale: RENDER_SCALE })
          const canvas = document.createElement("canvas")
          canvas.width = Math.floor(vp.width)
          canvas.height = Math.floor(vp.height)
          const ctx = canvas.getContext("2d")!
          await page.render({ canvasContext: ctx, viewport: vp }).promise
          renders.push({
            dataUrl: canvas.toDataURL("image/jpeg", 0.88),
            w_canvas: canvas.width,
            h_canvas: canvas.height,
            w_pts: vp1.width,
            h_pts: vp1.height,
          })
          page.cleanup()
        }

        if (!cancelled) {
          setPages(renders)
          onPageDimensionsLoaded(dims)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
          setLoading(false)
        }
      }
    })()

    return () => { cancelled = true }
  }, [pdfFile]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global mouse move / up for drag ───────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current
    if (!drag) return

    const dx = (e.clientX - drag.startClientX) / drag.overlayW
    const dy = (e.clientY - drag.startClientY) / drag.overlayH
    const sf = drag.startField

    let nx = sf.x, ny = sf.y, nw = sf.width, nh = sf.height
    const MIN_W = 0.04, MIN_H = 0.02

    if (drag.mode === "move") {
      nx = Math.max(0, Math.min(1 - sf.width, sf.x + dx))
      ny = Math.max(0, Math.min(1 - sf.height, sf.y + dy))
    } else if (drag.mode === "resize-se") {
      nw = Math.max(MIN_W, Math.min(1 - sf.x, sf.width + dx))
      nh = Math.max(MIN_H, Math.min(1 - sf.y, sf.height + dy))
    } else if (drag.mode === "resize-sw") {
      const rawX = sf.x + dx
      nw = Math.max(MIN_W, sf.x + sf.width - Math.max(0, rawX))
      nx = sf.x + sf.width - nw
      nh = Math.max(MIN_H, Math.min(1 - sf.y, sf.height + dy))
    } else if (drag.mode === "resize-ne") {
      nw = Math.max(MIN_W, Math.min(1 - sf.x, sf.width + dx))
      const rawY = sf.y + dy
      nh = Math.max(MIN_H, sf.y + sf.height - Math.max(0, rawY))
      ny = sf.y + sf.height - nh
    } else if (drag.mode === "resize-nw") {
      const rawX = sf.x + dx
      nw = Math.max(MIN_W, sf.x + sf.width - Math.max(0, rawX))
      nx = sf.x + sf.width - nw
      const rawY = sf.y + dy
      nh = Math.max(MIN_H, sf.y + sf.height - Math.max(0, rawY))
      ny = sf.y + sf.height - nh
    }

    const updated = fieldsRef.current.map(f =>
      f.id === drag.fieldId ? { ...f, x: nx, y: ny, width: nw, height: nh } : f
    )
    onFieldsChangeRef.current(updated)
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // ── Click to place ─────────────────────────────────────────────────────────
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>, pageIndex: number) {
    if (!activeFieldType) return
    const rect = e.currentTarget.getBoundingClientRect()
    const rx = (e.clientX - rect.left) / rect.width
    const ry = (e.clientY - rect.top) / rect.height
    const { w: defW, h: defH } = FIELD_DEFAULTS[activeFieldType]

    const newField: PlacedField = {
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: activeFieldType,
      page: pageIndex + 1,
      x: Math.max(0, Math.min(1 - defW, rx - defW / 2)),
      y: Math.max(0, Math.min(1 - defH, ry - defH / 2)),
      width: defW,
      height: defH,
      required: true,
    }
    const next = [...fieldsRef.current, newField]
    onFieldsChangeRef.current(next)
    onFieldSelectRef.current(newField.id)
  }

  // ── Start drag ────────────────────────────────────────────────────────────
  function startDrag(
    e: React.MouseEvent,
    fieldId: string,
    mode: DragMode,
    overlayEl: Element,
  ) {
    e.stopPropagation()
    e.preventDefault()
    const field = fieldsRef.current.find(f => f.id === fieldId)
    if (!field) return
    const rect = overlayEl.getBoundingClientRect()
    dragRef.current = {
      fieldId,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startField: { ...field },
      overlayW: rect.width,
      overlayH: rect.height,
    }
    onFieldSelectRef.current(fieldId)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Rendering PDF…</span>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-red-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        Failed to load PDF. Please try a different file.
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {pages.map((pg, pageIndex) => {
        const pageNum = pageIndex + 1
        const pageFields = fields.filter(f => f.page === pageNum)

        return (
          <div
            key={pageIndex}
            className="relative rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white"
          >
            <img
              src={pg.dataUrl}
              alt={`Page ${pageNum}`}
              className="block w-full select-none pointer-events-none"
              draggable={false}
              style={{ aspectRatio: `${pg.w_canvas} / ${pg.h_canvas}` }}
            />

            {/* Interaction overlay — same dimensions as the page image */}
            <div
              data-page-overlay="true"
              className="absolute inset-0"
              style={{ cursor: activeFieldType ? "crosshair" : "default" }}
              onClick={(e) => handleOverlayClick(e, pageIndex)}
              onMouseDown={() => { if (!activeFieldType) onFieldSelect(null) }}
            >
              {pageFields.map((field) => {
                const isSelected = field.id === selectedFieldId
                const color = FIELD_COLORS[field.type]
                const label = FIELD_TYPE_LABELS[field.type]

                return (
                  <div
                    key={field.id}
                    className="absolute select-none"
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      width: `${field.width * 100}%`,
                      height: `${field.height * 100}%`,
                      border: `2px solid ${color.border}`,
                      backgroundColor: color.bg,
                      borderRadius: 4,
                      boxShadow: isSelected
                        ? `0 0 0 2px white, 0 0 0 4px ${color.border}`
                        : undefined,
                      cursor: "move",
                      zIndex: isSelected ? 20 : 10,
                    }}
                    onClick={(e) => { e.stopPropagation(); onFieldSelect(field.id) }}
                    onMouseDown={(e) => {
                      const overlay = (e.currentTarget as HTMLElement)
                        .closest("[data-page-overlay]")!
                      startDrag(e, field.id, "move", overlay)
                    }}
                  >
                    {/* Field label */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider truncate px-1"
                        style={{ color: color.text, opacity: 0.75 }}
                      >
                        {field.label || label}
                      </span>
                    </div>

                    {/* Resize handles — only shown when selected */}
                    {isSelected && (
                      <>
                        {(
                          [
                            { mode: "resize-nw" as DragMode, style: { top: -5, left: -5, cursor: "nw-resize" } },
                            { mode: "resize-ne" as DragMode, style: { top: -5, right: -5, cursor: "ne-resize" } },
                            { mode: "resize-sw" as DragMode, style: { bottom: -5, left: -5, cursor: "sw-resize" } },
                            { mode: "resize-se" as DragMode, style: { bottom: -5, right: -5, cursor: "se-resize" } },
                          ] as { mode: DragMode; style: React.CSSProperties }[]
                        ).map(({ mode, style }) => (
                          <div
                            key={mode}
                            className="absolute w-3 h-3 rounded-sm border-2"
                            style={{
                              ...style,
                              backgroundColor: "white",
                              borderColor: color.border,
                              zIndex: 30,
                            }}
                            onMouseDown={(e) => {
                              const overlay = (e.currentTarget as HTMLElement)
                                .closest("[data-page-overlay]")!
                              startDrag(e, field.id, mode, overlay)
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Page number badge */}
            {pages.length > 1 && (
              <div className="absolute top-2 right-2 pointer-events-none">
                <span className="text-[9px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded">
                  {pageNum} / {pages.length}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
