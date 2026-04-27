// ─── PDF Redact Viewer ────────────────────────────────────────────────────────
// Renders a PDF file to canvas + overlays real-time redaction boxes.
// Black boxes = approved (will be/are redacted).
// Amber boxes = detected but not yet approved (live preview during selection).
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { Loader2 } from "lucide-react"

// Vite static-analysis pattern — worker file is bundled automatically
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

// ─── Types ────────────────────────────────────────────────────────────────────

interface TextItemInfo {
  str: string
  page: number
  x: number
  y: number
  w: number
  h: number
}

interface PageRender {
  dataUrl: string
  w: number
  h: number
}

interface Box {
  page: number
  x: number
  y: number
  w: number
  h: number
  kind: "black" | "amber"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCALE = 1.5
const MAX_PAGES = 8
const PAD = 1.5

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  file: File
  approvedValues: string[]
  detectedValues?: string[]
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PdfRedactViewer({
  file,
  approvedValues,
  detectedValues = [],
  className = "",
}: Props) {
  const [pages, setPages] = useState<PageRender[]>([])
  const [items, setItems] = useState<TextItemInfo[]>([])
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  // ── Load and render PDF on mount (or when file changes) ──────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setPages([])
    setItems([])

    ;(async () => {
      try {
        const buf = await file.arrayBuffer()
        const pdf = await pdfjsLib
          .getDocument({ data: new Uint8Array(buf), verbosity: 0 })
          .promise

        if (cancelled) return

        setNumPages(pdf.numPages)

        const renders: PageRender[] = []
        const allItems: TextItemInfo[] = []
        const pageCount = Math.min(pdf.numPages, MAX_PAGES)

        for (let pn = 1; pn <= pageCount; pn++) {
          if (cancelled) break

          const page = await pdf.getPage(pn)
          const viewport = page.getViewport({ scale: SCALE })
          const w = Math.floor(viewport.width)
          const h = Math.floor(viewport.height)

          // Render page → canvas → JPEG data URL
          const canvas = document.createElement("canvas")
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext("2d")!
          await page.render({ canvasContext: ctx, viewport }).promise
          renders.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.85), w, h })

          // Extract text items with canvas-space coordinates
          const tc = await page.getTextContent()
          for (const raw of tc.items) {
            if (!("str" in raw)) continue
            const itm = raw as {
              str: string
              transform: number[]
              width: number
              height: number
            }
            if (!itm.str.trim()) continue

            const t = itm.transform
            // Height: prefer item.height, fall back to |transform[3]|
            const pdfH = itm.height > 0 ? itm.height : Math.abs(t[3]) || 10
            const pdfW = itm.width
            if (pdfW <= 0 || pdfH <= 0) continue

            // PDF→canvas coordinate conversion:
            //   canvas x = pdf_x * scale
            //   canvas y = viewport.height - (pdf_y + pdf_height) * scale  (y-flip)
            const cx = t[4] * SCALE
            const cy = h - (t[5] + pdfH) * SCALE
            const cw = pdfW * SCALE
            const ch = pdfH * SCALE

            if (cw > 0 && ch > 0) {
              allItems.push({ str: itm.str, page: pn, x: cx, y: cy, w: cw, h: ch })
            }
          }

          page.cleanup()
        }

        if (!cancelled) {
          setPages(renders)
          setItems(allItems)
          setLoading(false)
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
  }, [file])

  // ── Compute overlay boxes from value lists ────────────────────────────────
  const boxes = useMemo((): Box[] => {
    if (!items.length) return []

    // Build two flat-text indexes to maximise match coverage:
    // "Spaced": items separated by a synthetic space (handles adjacent items)
    // "Dense": no separator (handles values that span items which already carry whitespace)
    let flatSpaced = ""
    const spacedOffsets: { s: number; e: number; i: number }[] = []
    let flatDense = ""
    const denseOffsets: { s: number; e: number; i: number }[] = []

    for (let i = 0; i < items.length; i++) {
      const ss = flatSpaced.length
      flatSpaced += items[i].str
      spacedOffsets.push({ s: ss, e: flatSpaced.length, i })
      flatSpaced += " "

      const ds = flatDense.length
      flatDense += items[i].str
      denseOffsets.push({ s: ds, e: flatDense.length, i })
    }

    const result: Box[] = []
    const seen = new Set<string>()

    function scanFlat(
      flat: string,
      offsets: { s: number; e: number; i: number }[],
      v: string,
      kind: "black" | "amber",
    ) {
      let pos = 0
      while (true) {
        const found = flat.indexOf(v, pos)
        if (found === -1) break
        const fe = found + v.length
        for (const o of offsets) {
          if (o.s < fe && o.e > found) {
            const it = items[o.i]
            const k = `${it.page}:${Math.round(it.x)}:${Math.round(it.y)}`
            if (!seen.has(k)) {
              seen.add(k)
              result.push({
                page: it.page,
                x: it.x - PAD,
                y: it.y - PAD,
                w: it.w + PAD * 2,
                h: it.h + PAD * 2,
                kind,
              })
            }
          }
        }
        pos = found + 1
      }
    }

    function addValues(vals: string[], kind: "black" | "amber") {
      for (const raw of vals) {
        const v = raw.trim()
        if (v.length < 2) continue
        scanFlat(flatSpaced, spacedOffsets, v, kind)
        scanFlat(flatDense, denseOffsets, v, kind)
      }
    }

    // Approved first so "black" wins over "amber" for same item
    addValues(approvedValues, "black")
    addValues(detectedValues, "amber")

    return result
  }, [items, approvedValues, detectedValues])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Rendering PDF preview…</span>
      </div>
    )
  }

  if (failed || pages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 min-h-[220px] rounded-xl border border-border/30 bg-neutral-100 dark:bg-zinc-900 text-center px-6 py-8 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-muted-foreground opacity-40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">PDF preview unavailable</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">The document will still have selected text removed when you download it.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`space-y-3 min-h-[500px] max-h-[calc(100vh-220px)] overflow-y-auto rounded-xl border border-border/30 bg-neutral-100 dark:bg-zinc-900 p-3 ${className}`}
    >
      {pages.map((pg, idx) => {
        const pn = idx + 1
        const pgBoxes = boxes.filter(b => b.page === pn)
        return (
          <div
            key={idx}
            className="relative rounded-lg overflow-hidden border border-border/20 shadow-sm"
          >
            <img
              src={pg.dataUrl}
              alt={`Page ${pn}`}
              className="block w-full"
              style={{ aspectRatio: `${pg.w} / ${pg.h}` }}
            />
            {pgBoxes.length > 0 && (
              <svg
                viewBox={`0 0 ${pg.w} ${pg.h}`}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
                preserveAspectRatio="none"
              >
                {pgBoxes.map((b, i) => (
                  <rect
                    key={i}
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill={
                      b.kind === "black" ? "#000000" : "rgba(245, 158, 11, 0.35)"
                    }
                    stroke={
                      b.kind === "black" ? "none" : "rgba(245, 158, 11, 0.6)"
                    }
                    strokeWidth={b.kind === "amber" ? 0.8 : 0}
                  />
                ))}
              </svg>
            )}
            {numPages > 1 && (
              <div className="absolute top-1.5 right-1.5 text-[9px] bg-black/55 text-white px-1.5 py-0.5 rounded font-mono">
                {pn}/{numPages > MAX_PAGES ? `${MAX_PAGES}+` : numPages}
              </div>
            )}
          </div>
        )
      })}
      {numPages > MAX_PAGES && (
        <p className="text-[10px] text-muted-foreground/40 text-center pb-1">
          Showing first {MAX_PAGES} of {numPages} pages — all pages redacted on download
        </p>
      )}
    </div>
  )
}
