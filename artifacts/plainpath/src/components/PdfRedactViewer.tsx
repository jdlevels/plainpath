// ─── PDF Redact Viewer ────────────────────────────────────────────────────────
// Single-page view with full navigation (prev / next / first / last / jump).
// Memory-safe: only the current page is rendered at a time; rendered pages are
// cached so navigating back is instant.
// Text extraction covers ALL pages so redaction boxes appear on every page.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle } from "lucide-react"

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
const PAD = 1.5
// Hard cap on text extraction to protect against extremely large PDFs
const MAX_TEXT_PAGES = 500

// ─── Module-level helpers (no component state needed) ─────────────────────────

async function renderPageToDataUrl(
  pdf: pdfjsLib.PDFDocumentProxy,
  pn: number,
): Promise<PageRender> {
  const page = await pdf.getPage(pn)
  const viewport = page.getViewport({ scale: SCALE })
  const w = Math.floor(viewport.width)
  const h = Math.floor(viewport.height)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
  page.cleanup()
  return { dataUrl, w, h }
}

async function extractPageTextItems(
  pdf: pdfjsLib.PDFDocumentProxy,
  pn: number,
): Promise<TextItemInfo[]> {
  const page = await pdf.getPage(pn)
  const viewport = page.getViewport({ scale: SCALE })
  const h = Math.floor(viewport.height)
  const tc = await page.getTextContent()
  const result: TextItemInfo[] = []
  for (const raw of tc.items) {
    if (!("str" in raw)) continue
    const itm = raw as { str: string; transform: number[]; width: number; height: number }
    if (!itm.str.trim()) continue
    const t = itm.transform
    const pdfH = itm.height > 0 ? itm.height : Math.abs(t[3]) || 10
    const pdfW = itm.width
    if (pdfW <= 0 || pdfH <= 0) continue
    const cx = t[4] * SCALE
    const cy = h - (t[5] + pdfH) * SCALE
    const cw = pdfW * SCALE
    const ch = pdfH * SCALE
    if (cw > 0 && ch > 0) {
      result.push({ str: itm.str, page: pn, x: cx, y: cy, w: cw, h: ch })
    }
  }
  page.cleanup()
  return result
}

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
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [items, setItems] = useState<TextItemInfo[]>([])
  const [pageCache, setPageCache] = useState<Map<number, PageRender>>(new Map())
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [jumpInput, setJumpInput] = useState("")
  // Track which pages the user has visually confirmed (for the review warning)
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set<number>())
  const cancelRef = useRef(false)
  // Keep a stable ref to pdfDoc for async goToPage without needing it in deps
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  // ── Load PDF, render page 1, then extract text from all pages in background
  useEffect(() => {
    cancelRef.current = false
    setLoading(true)
    setFailed(false)
    setPageCache(new Map())
    setItems([])
    setCurrentPage(1)
    setJumpInput("")
    setVisitedPages(new Set<number>())
    setPdfDoc(null)
    pdfDocRef.current = null

    ;(async () => {
      try {
        const buf = await file.arrayBuffer()
        const pdf = await pdfjsLib
          .getDocument({ data: new Uint8Array(buf), verbosity: 0 })
          .promise

        if (cancelRef.current) { pdf.destroy(); return }

        setNumPages(pdf.numPages)
        setPdfDoc(pdf)
        pdfDocRef.current = pdf

        // Render page 1 immediately so the user sees something fast
        const pg1 = await renderPageToDataUrl(pdf, 1)
        if (cancelRef.current) { pdf.destroy(); return }

        setPageCache(new Map([[1, pg1]]))
        setVisitedPages(new Set<number>([1]))
        setLoading(false)

        // Extract text from all pages in the background (non-blocking)
        ;(async () => {
          const allItems: TextItemInfo[] = []
          const pageCount = Math.min(pdf.numPages, MAX_TEXT_PAGES)
          for (let pn = 1; pn <= pageCount; pn++) {
            if (cancelRef.current) break
            const pageItems = await extractPageTextItems(pdf, pn)
            allItems.push(...pageItems)
          }
          if (!cancelRef.current) {
            setItems(allItems)
          }
        })()
      } catch {
        if (!cancelRef.current) {
          setFailed(true)
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelRef.current = true
    }
  }, [file])

  // ── Navigate to a page — renders on demand, caches the result ─────────────
  const goToPage = useCallback(
    async (pn: number) => {
      const pdf = pdfDocRef.current
      if (!pdf || pn < 1 || pn > numPages) return

      setCurrentPage(pn)
      setVisitedPages(prev => {
        if (prev.has(pn)) return prev
        const next = new Set(prev)
        next.add(pn)
        return next
      })

      // If already cached, nothing more to do
      setPageCache(prev => {
        if (prev.has(pn)) return prev
        // Kick off async render (outside setState)
        return prev
      })

      // Render the page if not already in cache
      setPageCache(prev => {
        if (prev.has(pn)) return prev
        // Trigger async render
        setPageLoading(true)
        renderPageToDataUrl(pdf, pn)
          .then(rendered => {
            if (!cancelRef.current) {
              setPageCache(c => new Map(c).set(pn, rendered))
            }
          })
          .catch(() => { /* page stays in loading state */ })
          .finally(() => {
            if (!cancelRef.current) setPageLoading(false)
          })
        return prev
      })
    },
    [numPages],
  )

  // Reset pageLoading when cache has the current page
  useEffect(() => {
    if (pageCache.has(currentPage)) {
      setPageLoading(false)
    }
  }, [pageCache, currentPage])

  // ── Jump-to-page form handler ──────────────────────────────────────────────
  function handleJump(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(jumpInput, 10)
    if (!isNaN(n) && n >= 1 && n <= numPages) {
      goToPage(n)
      setJumpInput("")
    }
  }

  // ── Compute redaction overlay boxes (all pages, filtered at render time) ───
  const boxes = useMemo((): Box[] => {
    if (!items.length) return []

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

    // Approved first so "black" wins over "amber" for the same item
    addValues(approvedValues, "black")
    addValues(detectedValues, "amber")
    return result
  }, [items, approvedValues, detectedValues])

  // ── Derived values ────────────────────────────────────────────────────────
  const currentRender = pageCache.get(currentPage)
  const pgBoxes = boxes.filter(b => b.page === currentPage)
  const allPagesVisited = numPages > 0 && visitedPages.size >= numPages
  const showReviewWarning = numPages > 1 && !allPagesVisited && approvedValues.length > 0

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Rendering PDF preview…</span>
      </div>
    )
  }

  if (failed || numPages === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 min-h-[220px] rounded-xl border border-border/30 bg-neutral-100 dark:bg-zinc-900 text-center px-6 py-8 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-muted-foreground opacity-40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">PDF preview unavailable</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            The document will still have selected text removed when you download it.
          </p>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col gap-2 ${className}`}>

      {/* ── Page navigation controls (only shown for multi-page PDFs) ────── */}
      {numPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          {/* Prev group */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First page"
              aria-label="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page counter */}
          <span className="text-xs text-muted-foreground font-medium tabular-nums select-none">
            Page {currentPage} of {numPages}
          </span>

          {/* Next group */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === numPages}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => goToPage(numPages)}
              disabled={currentPage === numPages}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last page"
              aria-label="Last page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Jump-to-page (only shown when there are more than 3 pages) ──── */}
      {numPages > 3 && (
        <form
          onSubmit={handleJump}
          className="flex items-center gap-2"
          aria-label="Jump to page"
        >
          <span className="text-[11px] text-muted-foreground shrink-0">Go to page:</span>
          <input
            type="number"
            min={1}
            max={numPages}
            value={jumpInput}
            onChange={e => setJumpInput(e.target.value)}
            className="w-16 text-xs border border-border/50 rounded px-1.5 py-0.5 bg-background text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder={String(currentPage)}
            aria-label={`Page number (1–${numPages})`}
          />
          <button
            type="submit"
            className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
          >
            Go
          </button>
        </form>
      )}

      {/* ── Page canvas ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/30 bg-neutral-100 dark:bg-zinc-900 overflow-hidden min-h-[360px] flex items-center justify-center">
        {pageLoading || !currentRender ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading page {currentPage}…</span>
          </div>
        ) : (
          <div className="relative w-full">
            <img
              src={currentRender.dataUrl}
              alt={`Page ${currentPage} of ${numPages}`}
              className="block w-full"
              style={{ aspectRatio: `${currentRender.w} / ${currentRender.h}` }}
            />
            {/* Redaction overlay */}
            {pgBoxes.length > 0 && (
              <svg
                viewBox={`0 0 ${currentRender.w} ${currentRender.h}`}
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
                    fill={b.kind === "black" ? "#000000" : "rgba(245, 158, 11, 0.35)"}
                    stroke={b.kind === "black" ? "none" : "rgba(245, 158, 11, 0.6)"}
                    strokeWidth={b.kind === "amber" ? 0.8 : 0}
                  />
                ))}
              </svg>
            )}
            {/* Page badge */}
            {numPages > 1 && (
              <div className="absolute top-1.5 right-1.5 text-[9px] bg-black/55 text-white px-1.5 py-0.5 rounded font-mono select-none">
                {currentPage}/{numPages}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Status message and review warning ───────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          {numPages === 1
            ? "All redactions will apply on download."
            : `Previewing page ${currentPage} of ${numPages}. Use page controls to review every page before export.`}
        </p>
        {showReviewWarning && (
          <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 px-2.5 py-2">
            <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-snug">
              You have not reviewed every page. Redactions will still apply to selected matches, but review all pages before sharing.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
