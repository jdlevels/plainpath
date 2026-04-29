import { useState, useRef, useEffect } from "react"
import { FileText, Loader2, ZoomIn, ZoomOut, Maximize2, ChevronDown } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const PDF_SCALE = 1.4
const PDF_BATCH_SIZE = 15   // pages loaded per batch
const PDF_MAX_PAGES = 600   // absolute cap across all tools

const ZOOM_STEPS = [
  { scale: 0.65, label: "65%" },
  { scale: 0.80, label: "80%" },
  { scale: 1.00, label: "100%" },
  { scale: 1.20, label: "120%" },
  { scale: 1.40, label: "140%" },
]
const ZOOM_DEFAULT = 2

// ─── Internal PDF renderer ────────────────────────────────────────────────────
function PdfPageRenderer({
  file,
  cssScale,
  fallbackContent,
  onLoaded,
}: {
  file: File
  cssScale: number
  fallbackContent?: React.ReactNode
  onLoaded?: (rendered: number, total: number) => void
}) {
  const [pages, setPages] = useState<string[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    setLoading(true)
    setFailed(false)
    setPages([])
    setTotalPages(0)
    pdfDocRef.current = null

    ;(async () => {
      try {
        const buf = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf), verbosity: 0 }).promise
        if (cancelRef.current) { pdf.destroy(); return }
        pdfDocRef.current = pdf
        setTotalPages(pdf.numPages)

        const renders: string[] = []
        const count = Math.min(pdf.numPages, PDF_BATCH_SIZE)
        for (let pn = 1; pn <= count; pn++) {
          if (cancelRef.current) break
          const page = await pdf.getPage(pn)
          const viewport = page.getViewport({ scale: PDF_SCALE })
          const canvas = document.createElement("canvas")
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const ctx = canvas.getContext("2d")!
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render as any)({ canvasContext: ctx, viewport }).promise
          renders.push(canvas.toDataURL("image/jpeg", 0.88))
          page.cleanup()
        }
        if (!cancelRef.current) {
          setPages(renders)
          setLoading(false)
          onLoaded?.(renders.length, pdf.numPages)
        }
      } catch {
        if (!cancelRef.current) { setFailed(true); setLoading(false) }
      }
    })()

    return () => {
      cancelRef.current = true
      pdfDocRef.current?.destroy()
      pdfDocRef.current = null
    }
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMore() {
    const pdf = pdfDocRef.current
    if (!pdf || loadingMore) return
    setLoadingMore(true)
    const startPage = pages.length + 1
    const endPage = Math.min(startPage + PDF_BATCH_SIZE - 1, Math.min(pdf.numPages, PDF_MAX_PAGES))
    const renders: string[] = []
    for (let pn = startPage; pn <= endPage; pn++) {
      if (cancelRef.current) break
      const page = await pdf.getPage(pn)
      const viewport = page.getViewport({ scale: PDF_SCALE })
      const canvas = document.createElement("canvas")
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext("2d")!
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (page.render as any)({ canvasContext: ctx, viewport }).promise
      renders.push(canvas.toDataURL("image/jpeg", 0.88))
      page.cleanup()
    }
    if (!cancelRef.current) {
      setPages(prev => {
        const next = [...prev, ...renders]
        onLoaded?.(next.length, pdf.numPages)
        return next
      })
    }
    setLoadingMore(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Rendering PDF…</p>
      </div>
    )
  }

  if (failed || pages.length === 0) {
    if (fallbackContent) {
      return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-amber-100 bg-amber-50">
            <p className="text-[11px] text-amber-700 font-medium">
              PDF preview unavailable — showing extracted text instead
            </p>
          </div>
          <div className="px-7 py-7">{fallbackContent}</div>
        </div>
      )
    }
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 text-center">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">PDF preview unavailable for this file.</p>
        </div>
      </div>
    )
  }

  const imgWidth = `${Math.round(cssScale * 100)}%`
  const cap = Math.min(totalPages, PDF_MAX_PAGES)
  const hasMore = pages.length < cap

  return (
    <div className="space-y-5">
      {pages.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={`Page ${i + 1}`}
          className="block rounded-md shadow-xl mx-auto"
          style={{ width: imgWidth }}
          draggable={false}
        />
      ))}
      {hasMore && (
        <div className="text-center pb-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-1.5 rounded border border-white/10 hover:border-white/20 bg-zinc-800/60 hover:bg-zinc-700/60"
          >
            {loadingMore
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <ChevronDown className="w-3 h-3" />}
            {loadingMore
              ? "Loading…"
              : `Load next ${Math.min(PDF_BATCH_SIZE, cap - pages.length)} pages (${pages.length} of ${cap} shown)`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Exported component ────────────────────────────────────────────────────────
export interface DocumentStageViewerProps {
  fileName: string | null
  documentType?: string | null
  pdfFile?: File | null
  fallbackContent?: React.ReactNode
  scrollTrigger?: number
  contextLabel?: string
}

export function DocumentStageViewer({
  fileName,
  documentType,
  pdfFile,
  fallbackContent,
  scrollTrigger = 0,
  contextLabel,
}: DocumentStageViewerProps) {
  const [zoomIdx, setZoomIdx] = useState(ZOOM_DEFAULT)
  const [pageInfo, setPageInfo] = useState<{ rendered: number; total: number } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  // Scroll stage to top when trigger changes
  useEffect(() => {
    if (!scrollTrigger) return
    stageRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [scrollTrigger])

  const cssScale = ZOOM_STEPS[zoomIdx]?.scale ?? 1

  return (
    <div className="h-full flex flex-col bg-zinc-900 dark:bg-zinc-950">
      {/* Header strip */}
      <div className="shrink-0 flex items-center gap-2.5 px-3 py-2 border-b border-white/10 bg-zinc-800/60">
        <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-zinc-200 truncate leading-tight">
            {fileName ?? "Document"}
          </p>
          {(documentType || pageInfo) && (
            <p className="text-[11px] text-zinc-500 leading-none mt-0.5">
              {documentType}
              {pageInfo && (
                <span className={documentType ? "ml-2 text-zinc-600" : "text-zinc-600"}>
                  {documentType ? "· " : ""}
                  {pageInfo.rendered === pageInfo.total
                    ? `${pageInfo.total} pages`
                    : `${pageInfo.rendered} of ${pageInfo.total} pages`}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Zoom controls — PDF only */}
        {pdfFile && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setZoomIdx(i => Math.max(i - 1, 0))}
              disabled={zoomIdx <= 0}
              title="Zoom out"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-zinc-500 font-mono w-8 text-center select-none">
              {ZOOM_STEPS[zoomIdx]?.label ?? "100%"}
            </span>
            <button
              type="button"
              onClick={() => setZoomIdx(i => Math.min(i + 1, ZOOM_STEPS.length - 1))}
              disabled={zoomIdx >= ZOOM_STEPS.length - 1}
              title="Zoom in"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomIdx(ZOOM_DEFAULT)}
              disabled={zoomIdx === ZOOM_DEFAULT}
              title="Fit width"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-0.5"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {contextLabel && (
          <span className="text-[10px] text-zinc-600 shrink-0 hidden sm:block ml-1">
            {contextLabel}
          </span>
        )}
      </div>

      {/* Dark stage */}
      <div ref={stageRef} className="flex-1 overflow-auto">
        <div className="py-8 px-4 sm:px-8 flex justify-center">
          <div className="w-full" style={{ maxWidth: "800px" }}>
            {pdfFile ? (
              <PdfPageRenderer
                file={pdfFile}
                cssScale={cssScale}
                fallbackContent={fallbackContent}
                onLoaded={(r, t) => setPageInfo({ rendered: r, total: t })}
              />
            ) : fallbackContent ? (
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="px-7 py-7">{fallbackContent}</div>
              </div>
            ) : (
              <div className="bg-zinc-800/60 rounded-xl border border-white/10 px-6 py-12 text-center">
                <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Document preview not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
