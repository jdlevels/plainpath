// ─── PDF Editor ────────────────────────────────────────────────────────────────
// Slice 1: upload flow + split-screen workspace shell.
// No editing tools, no DB, no API, no persistence.
// Left pane = Original (read-only). Right pane = Working Copy baseline.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import * as pdfjsLib from "pdfjs-dist"
import {
  ArrowLeft, Upload, FileText, X, Loader2, AlertCircle,
  Lock, Zap, CheckCircle2, Pen, Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEntitlements } from "@/hooks/useEntitlements"

// ─── pdfjs worker ─────────────────────────────────────────────────────────────

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const RENDER_SCALE = 1.5

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageRender {
  dataUrl: string
  wCanvas: number
  hCanvas: number
}

// ─── PDF renderer hook ────────────────────────────────────────────────────────
// Renders the PDF once; both panes share the same output array.

function usePdfRenderer(file: File | null) {
  const [pages, setPages] = useState<PageRender[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!file) {
      setPages([])
      setLoading(false)
      setFailed(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setFailed(false)
    setPages([])

    ;(async () => {
      try {
        const buf = await file.arrayBuffer()
        const pdf = await pdfjsLib
          .getDocument({ data: new Uint8Array(buf), verbosity: 0 })
          .promise

        if (cancelled) return

        const renders: PageRender[] = []

        for (let pn = 1; pn <= pdf.numPages; pn++) {
          if (cancelled) break
          const page = await pdf.getPage(pn)
          const vp = page.getViewport({ scale: RENDER_SCALE })
          const canvas = document.createElement("canvas")
          canvas.width = Math.floor(vp.width)
          canvas.height = Math.floor(vp.height)
          const ctx = canvas.getContext("2d")!
          await page.render({ canvasContext: ctx, viewport: vp }).promise
          renders.push({
            dataUrl: canvas.toDataURL("image/jpeg", 0.88),
            wCanvas: canvas.width,
            hCanvas: canvas.height,
          })
          page.cleanup()
        }

        if (!cancelled) {
          setPages(renders)
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
  }, [file])

  return { pages, loading, failed }
}

// ─── Locked gate ──────────────────────────────────────────────────────────────

function LockedGate() {
  const [, setLocation] = useLocation()
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Lock className="w-7 h-7 text-violet-500 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">PDF Editor</h1>
          <p className="text-muted-foreground leading-relaxed">
            Open any PDF, apply text overlays, mask sensitive content, reorder pages, and export a clean modified copy — all without touching the original.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground w-full max-w-xs">
          {[
            "Add text boxes over any page",
            "Mask or white-out content",
            "Delete and reorder pages",
            "Highlight sections",
            "Export modified PDF",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className="border border-border/60 bg-muted/30 rounded-xl px-4 py-3 text-sm w-full">
          <p className="font-semibold mb-0.5">Available on Pro</p>
          <p className="text-muted-foreground text-xs">$19.99/month — all tools included</p>
        </div>
        <Button onClick={() => setLocation("/upgrade")} className="w-full">
          <Zap className="w-4 h-4 mr-2" /> Upgrade to Pro
        </Button>
        <button
          onClick={() => setLocation("/")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  )
}

// ─── Upload flow ──────────────────────────────────────────────────────────────

function UploadFlow({ onOpen }: { onOpen: (file: File, name: string) => void }) {
  const [, setLocation] = useLocation()
  const [file, setFile] = useState<File | null>(null)
  const [docName, setDocName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function acceptFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".pdf")) return
    setFile(f)
    setDocName(f.name.replace(/\.pdf$/i, ""))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) acceptFile(f)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) acceptFile(f)
  }

  function handleRemove() {
    setFile(null)
    setDocName("")
  }

  function handleOpen() {
    if (!file) return
    onOpen(file, docName.trim() || file.name.replace(/\.pdf$/i, ""))
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setLocation("/")}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Pen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">PDF Editor</h1>
            <p className="text-sm text-muted-foreground">Open a PDF to view and edit</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl space-y-5">
        <div>
          <h2 className="text-base font-semibold mb-1">Select a PDF</h2>
          <p className="text-sm text-muted-foreground">
            Upload any PDF to open it in the split-screen editor. The original is never modified.
          </p>
        </div>

        {/* Drop zone */}
        {!file && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border/50 rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-border hover:bg-muted/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="w-8 h-8 mb-1 text-muted-foreground/50" />
              <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
              <p className="text-xs">PDF only — max 20 MB</p>
            </div>
          </div>
        )}

        {/* Selected file card */}
        {file && (
          <div className="border border-violet-300/60 dark:border-violet-700/40 bg-violet-50/50 dark:bg-violet-950/20 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(file.size / 1024).toFixed(0)} KB · PDF
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Document title override */}
        {file && (
          <div className="space-y-1.5">
            <Label htmlFor="docTitle" className="text-sm">
              Document title <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="docTitle"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Contract Draft — April 2026"
              onKeyDown={(e) => { if (e.key === "Enter") handleOpen() }}
            />
          </div>
        )}

        {/* Confirm button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleOpen} disabled={!file} className="gap-2">
            <Pen className="w-4 h-4" />
            Open in PDF Editor
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── PDF pane content ─────────────────────────────────────────────────────────

function PdfPaneContent({
  pages,
  loading,
  failed,
}: {
  pages: PageRender[]
  loading: boolean
  failed: boolean
}) {
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
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <p className="text-sm text-red-500 font-medium">Failed to load PDF</p>
        <p className="text-xs text-muted-foreground">
          This file could not be rendered. Try a different PDF or check that the file is not encrypted.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
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
            style={{ aspectRatio: `${pg.wCanvas} / ${pg.hCanvas}` }}
          />
          {pages.length > 1 && (
            <div className="absolute top-2 right-2 pointer-events-none">
              <span className="text-[9px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded">
                {i + 1} / {pages.length}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Workspace shell ──────────────────────────────────────────────────────────

function WorkspaceShell({
  pdfFile,
  docName,
  onBack,
}: {
  pdfFile: File
  docName: string
  onBack: () => void
}) {
  const { pages, loading, failed } = usePdfRenderer(pdfFile)
  const [activeTab, setActiveTab] = useState<"original" | "copy">("original")

  const pageLabel = loading
    ? "Loading…"
    : failed
    ? "Error"
    : `${pages.length} page${pages.length !== 1 ? "s" : ""}`

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* Sticky toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/95 flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
              <Pen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate max-w-[180px] sm:max-w-[280px] lg:max-w-[420px]">
                {docName}
              </p>
              <p className="text-[10px] text-muted-foreground">{pageLabel}</p>
            </div>
          </div>
        </div>

        {/* Placeholder tool buttons — disabled, Slice 1 */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          {["Text", "Mask", "Highlight"].map((tool) => (
            <button
              key={tool}
              disabled
              title="Coming in a future release"
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 text-muted-foreground/40 bg-background cursor-not-allowed"
            >
              {tool}
            </button>
          ))}
          <div className="w-px h-5 bg-border/60 mx-1" />
          <button
            disabled
            title="Coming in a future release"
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 text-muted-foreground/40 bg-background cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Mobile tab switcher — below md only */}
      <div className="flex md:hidden border-b border-border/40 flex-shrink-0 bg-background">
        <button
          onClick={() => setActiveTab("original")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === "original"
              ? "text-violet-600 dark:text-violet-400 border-violet-500"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setActiveTab("copy")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === "copy"
              ? "text-violet-600 dark:text-violet-400 border-violet-500"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Working Copy
        </button>
      </div>

      {/* Pane area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Left pane — Original (read-only) */}
        <div
          className={`flex-col w-full md:w-[55%] md:flex-shrink-0 overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70 ${
            activeTab === "original" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Pane badge */}
          <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2 bg-neutral-200/80 dark:bg-zinc-800/80 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Original · Read only
            </span>
          </div>
          <PdfPaneContent pages={pages} loading={loading} failed={failed} />
        </div>

        {/* Vertical divider — desktop only */}
        <div className="hidden md:block w-px bg-border/50 flex-shrink-0" />

        {/* Right pane — Working Copy baseline */}
        <div
          className={`flex-col flex-1 overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70 ${
            activeTab === "copy" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Pane badge */}
          <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2 bg-neutral-200/80 dark:bg-zinc-800/80 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Working Copy · 0 edits
            </span>
          </div>
          <PdfPaneContent pages={pages} loading={loading} failed={failed} />
        </div>

      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type View = "upload" | "workspace"

export default function PdfEditor() {
  const { entitlements, isAdmin, loading } = useEntitlements()
  const [view, setView] = useState<View>("upload")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [docName, setDocName] = useState("")

  const canUse =
    isAdmin ||
    (entitlements?.toolAccess?.includes("pdf-editor") ?? false)

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center pt-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canUse) {
    return <LockedGate />
  }

  function handleOpen(file: File, name: string) {
    setPdfFile(file)
    setDocName(name)
    setView("workspace")
  }

  function handleBack() {
    setPdfFile(null)
    setDocName("")
    setView("upload")
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {view === "upload" && (
        <UploadFlow onOpen={handleOpen} />
      )}
      {view === "workspace" && pdfFile && (
        <WorkspaceShell
          pdfFile={pdfFile}
          docName={docName}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
