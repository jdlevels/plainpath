// ─── PDF Tools Panel ───────────────────────────────────────────────────────────
// Stateless PDF utilities: Merge, Extract Pages, Page Tools, Compress.
// Used inside PdfEditor.tsx when the user switches to the "PDF Tools" tab.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import {
  Upload, FileText, X, Loader2, Download, AlertCircle,
  CheckCircle2, Layers, Scissors, SlidersHorizontal, Minimize2,
  Trash2, RotateCw, ArrowUpDown, Plus, FileDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePdfUtilitiesApi } from "@/hooks/usePdfEditorApi"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function validatePdf(f: File): string | null {
  if (!f.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are accepted."
  if (f.size > 40 * 1024 * 1024) return "File exceeds the 40 MB limit."
  return null
}

type ToolState = "idle" | "processing" | "done" | "error"

// ─── Shared: ToolCard wrapper ──────────────────────────────────────────────────

function ToolCard({
  icon: Icon,
  title,
  description,
  accentClass,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  accentClass: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-border/50 rounded-2xl p-6 bg-card hover:border-border transition-colors">
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── FileDropZone ─────────────────────────────────────────────────────────────

function FileDropZone({
  file,
  onFile,
  onRemove,
  disabled,
  label,
}: {
  file: File | null
  onFile: (f: File) => void
  onRemove: () => void
  disabled: boolean
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 border border-border/50 rounded-xl px-3 py-2.5 bg-muted/30">
        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{fmtBytes(file.size)}</p>
        </div>
        {!disabled && (
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-border/40 rounded-xl p-5 text-center cursor-pointer hover:border-violet-400/50 hover:bg-violet-50/10 dark:hover:bg-violet-950/10 transition-colors"
    >
      <input
        ref={ref}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = "" }}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
        <Upload className="w-6 h-6 mb-0.5 text-muted-foreground/50" />
        <p className="text-sm font-medium">{label ?? "Drop a PDF here or click to browse"}</p>
        <p className="text-xs">PDF only · max 40 MB</p>
      </div>
    </div>
  )
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({ state, error, extra }: { state: ToolState; error: string; extra?: string }) {
  if (state === "processing") return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Processing…
    </div>
  )
  if (state === "done") return (
    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <CheckCircle2 className="w-4 h-4" /> Downloaded{extra ? ` · ${extra}` : ""}
    </div>
  )
  if (state === "error") return (
    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
    </div>
  )
  return null
}

// ─── Merge Tool ───────────────────────────────────────────────────────────────

function MergeTool() {
  const api = usePdfUtilitiesApi()
  const [files, setFiles] = useState<File[]>([])
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const [state, setState] = useState<ToolState>("idle")
  const [error, setError] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  function addFile(f: File) {
    const err = validatePdf(f)
    if (err) { setFileErrors((e) => [...e, err]); return }
    if (files.length >= 10) { setFileErrors((e) => [...e, "Maximum 10 PDFs at a time"]); return }
    setFiles((prev) => [...prev, f])
    setFileErrors([])
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleMerge() {
    if (files.length < 2 || state === "processing") return
    setState("processing"); setError("")
    try {
      const blob = await api.merge(files)
      downloadBlob(blob, "merged.pdf")
      setState("done")
      setTimeout(() => setState("idle"), 8000)
    } catch (err: any) {
      setError(err?.message ?? "Merge failed — please try again.")
      setState("error")
    }
  }

  return (
    <ToolCard
      icon={Layers}
      title="Merge PDFs"
      description="Combine multiple PDF files into one document in the order you choose."
      accentClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
    >
      <div className="space-y-3">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-xs font-medium text-muted-foreground w-5 text-right">{i + 1}.</span>
            <div className="flex-1 flex items-center gap-2 border border-border/40 rounded-lg px-3 py-2 bg-muted/20 min-w-0">
              <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-sm font-medium">{f.name}</span>
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{fmtBytes(f.size)}</span>
            </div>
            <button
              onClick={() => removeFile(i)}
              disabled={state === "processing"}
              className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {files.length < 10 && (
          <button
            onClick={() => ref.current?.click()}
            disabled={state === "processing"}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border/40 rounded-xl py-3 text-sm text-muted-foreground hover:border-blue-400/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add PDF ({files.length}/10)
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.target.value = "" }}
          disabled={state === "processing"}
        />

        {fileErrors.map((e, i) => (
          <p key={i} className="text-xs text-red-500">{e}</p>
        ))}

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={handleMerge}
            disabled={files.length < 2 || state === "processing"}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {state === "processing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Merge {files.length > 0 ? `${files.length} PDFs` : "PDFs"}
          </Button>
          <ResultRow state={state} error={error} />
        </div>
      </div>
    </ToolCard>
  )
}

// ─── Extract Pages Tool ───────────────────────────────────────────────────────

function ExtractPagesTool() {
  const api = usePdfUtilitiesApi()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [pageRange, setPageRange] = useState("")
  const [state, setState] = useState<ToolState>("idle")
  const [error, setError] = useState("")

  function acceptFile(f: File) {
    const err = validatePdf(f)
    setFileError(err)
    setFile(err ? null : f)
  }

  async function handleExtract() {
    if (!file || !pageRange.trim() || state === "processing") return
    setState("processing"); setError("")
    try {
      const blob = await api.extractPages(file, pageRange.trim())
      const baseName = file.name.replace(/\.pdf$/i, "")
      downloadBlob(blob, `${baseName}-extracted.pdf`)
      setState("done")
      setTimeout(() => setState("idle"), 8000)
    } catch (err: any) {
      setError(err?.message ?? "Extraction failed — check your page range and try again.")
      setState("error")
    }
  }

  return (
    <ToolCard
      icon={Scissors}
      title="Extract Pages"
      description="Pull out specific pages from a PDF into a new document."
      accentClass="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
    >
      <div className="space-y-3">
        <FileDropZone
          file={file}
          onFile={acceptFile}
          onRemove={() => { setFile(null); setFileError(null) }}
          disabled={state === "processing"}
        />
        {fileError && <p className="text-xs text-red-500">{fileError}</p>}

        {file && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Page range
            </label>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="e.g. 1-3, 5, 7-9"
              disabled={state === "processing"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              onKeyDown={(e) => { if (e.key === "Enter") handleExtract() }}
            />
            <p className="text-xs text-muted-foreground">Separate pages with commas: 1, 3-5, 8</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={handleExtract}
            disabled={!file || !pageRange.trim() || state === "processing"}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            size="sm"
          >
            {state === "processing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            Extract Pages
          </Button>
          <ResultRow state={state} error={error} />
        </div>
      </div>
    </ToolCard>
  )
}

// ─── Page Tools (Delete / Rotate / Reorder) ───────────────────────────────────

type PageToolMode = "delete" | "rotate" | "reorder"

function PageToolsCard() {
  const api = usePdfUtilitiesApi()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [mode, setMode] = useState<PageToolMode>("delete")
  const [state, setState] = useState<ToolState>("idle")
  const [error, setError] = useState("")

  // Delete mode
  const [deletePages, setDeletePages] = useState("")
  // Rotate mode
  const [rotatePages, setRotatePages] = useState("")
  const [rotateDeg, setRotateDeg] = useState<90 | 180 | 270>(90)
  // Reorder mode
  const [reorderInput, setReorderInput] = useState("")

  function acceptFile(f: File) {
    const err = validatePdf(f)
    setFileError(err)
    setFile(err ? null : f)
    setDeletePages(""); setRotatePages(""); setReorderInput("")
  }

  async function handleApply() {
    if (!file || state === "processing") return
    setState("processing"); setError("")

    try {
      let ops: any[] = []

      if (mode === "delete") {
        const indexes = parsePageNumbers(deletePages)
        if (!indexes.length) { setError("Enter at least one page number to delete."); setState("error"); return }
        ops = [{ type: "delete", pageIndexes: indexes }]
      } else if (mode === "rotate") {
        const indexes = rotatePages.trim() ? parsePageNumbers(rotatePages) : [] // empty = all pages via server default
        ops = [{ type: "rotate", pageIndexes: indexes.length ? indexes : Array.from({ length: 999 }, (_, i) => i), degrees: rotateDeg }]
      } else if (mode === "reorder") {
        const order = reorderInput.split(",").map((s) => parseInt(s.trim(), 10) - 1).filter((n) => !isNaN(n) && n >= 0)
        if (!order.length) { setError("Enter the new page order as comma-separated numbers."); setState("error"); return }
        ops = [{ type: "reorder", order }]
      }

      const blob = await api.pageOps(file, ops)
      const baseName = file.name.replace(/\.pdf$/i, "")
      downloadBlob(blob, `${baseName}-modified.pdf`)
      setState("done")
      setTimeout(() => setState("idle"), 8000)
    } catch (err: any) {
      setError(err?.message ?? "Operation failed — please check your inputs and try again.")
      setState("error")
    }
  }

  const modeLabels: Record<PageToolMode, string> = { delete: "Delete Pages", rotate: "Rotate Pages", reorder: "Reorder Pages" }
  const modeIcons: Record<PageToolMode, React.ElementType> = { delete: Trash2, rotate: RotateCw, reorder: ArrowUpDown }

  return (
    <ToolCard
      icon={SlidersHorizontal}
      title="Page Tools"
      description="Delete, rotate, or reorder pages inside any PDF."
      accentClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
    >
      <div className="space-y-4">
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["delete", "rotate", "reorder"] as PageToolMode[]).map((m) => {
            const MIcon = modeIcons[m]
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                  mode === m
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <MIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{modeLabels[m]}</span>
                <span className="sm:hidden">{m.charAt(0).toUpperCase() + m.slice(1)}</span>
              </button>
            )
          })}
        </div>

        <FileDropZone
          file={file}
          onFile={acceptFile}
          onRemove={() => { setFile(null); setFileError(null) }}
          disabled={state === "processing"}
        />
        {fileError && <p className="text-xs text-red-500">{fileError}</p>}

        {file && mode === "delete" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pages to delete</label>
            <input
              type="text"
              value={deletePages}
              onChange={(e) => setDeletePages(e.target.value)}
              placeholder="e.g. 2, 5-7, 10"
              disabled={state === "processing"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            />
            <p className="text-xs text-muted-foreground">Page numbers to remove (1-based)</p>
          </div>
        )}

        {file && mode === "rotate" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pages to rotate</label>
              <input
                type="text"
                value={rotatePages}
                onChange={(e) => setRotatePages(e.target.value)}
                placeholder="e.g. 1, 3-5 — leave blank for all pages"
                disabled={state === "processing"}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rotation</label>
              <div className="flex gap-2">
                {([90, 180, 270] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setRotateDeg(d)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      rotateDeg === d
                        ? "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                        : "border-border/50 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {d}° CW
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {file && mode === "reorder" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New page order</label>
            <input
              type="text"
              value={reorderInput}
              onChange={(e) => setReorderInput(e.target.value)}
              placeholder="e.g. 3, 1, 2, 4, 5"
              disabled={state === "processing"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            />
            <p className="text-xs text-muted-foreground">
              Enter page numbers in the desired order — pages not listed will be appended at the end
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={handleApply}
            disabled={!file || state === "processing"}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            size="sm"
          >
            {state === "processing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Apply & Download
          </Button>
          <ResultRow state={state} error={error} />
        </div>
      </div>
    </ToolCard>
  )
}

// ─── Compress Tool ────────────────────────────────────────────────────────────

function CompressTool() {
  const api = usePdfUtilitiesApi()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [state, setState] = useState<ToolState>("idle")
  const [error, setError] = useState("")
  const [savings, setSavings] = useState<string | null>(null)

  function acceptFile(f: File) {
    const err = validatePdf(f)
    setFileError(err)
    setFile(err ? null : f)
    setSavings(null)
  }

  async function handleCompress() {
    if (!file || state === "processing") return
    setState("processing"); setError(""); setSavings(null)
    try {
      const blob = await api.compress(file)
      const baseName = file.name.replace(/\.pdf$/i, "")
      downloadBlob(blob, `${baseName}-compressed.pdf`)
      const saved = file.size - blob.size
      if (saved > 0) {
        setSavings(`Saved ${fmtBytes(saved)} (${Math.round((saved / file.size) * 100)}%)`)
      } else {
        setSavings("Already optimized — no reduction possible")
      }
      setState("done")
      setTimeout(() => setState("idle"), 5000)
    } catch (err: any) {
      setError(err?.message ?? "Compression failed — please try again.")
      setState("error")
    }
  }

  return (
    <ToolCard
      icon={Minimize2}
      title="Compress PDF"
      description="Reduce PDF file size by removing redundant data and optimizing structure."
      accentClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
    >
      <div className="space-y-3">
        <FileDropZone
          file={file}
          onFile={acceptFile}
          onRemove={() => { setFile(null); setFileError(null); setSavings(null) }}
          disabled={state === "processing"}
        />
        {fileError && <p className="text-xs text-red-500">{fileError}</p>}

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={handleCompress}
            disabled={!file || state === "processing"}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            {state === "processing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minimize2 className="w-4 h-4" />}
            Compress & Download
          </Button>
          <ResultRow state={state} error={error} extra={savings ?? undefined} />
        </div>

        <p className="text-xs text-muted-foreground">
          Removes structural redundancy. For PDFs with many embedded images, reduction may be minimal.
        </p>
      </div>
    </ToolCard>
  )
}

// ─── PDF to Text Tool ─────────────────────────────────────────────────────────

function PdfToTextTool() {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [state, setState] = useState<ToolState>("idle")
  const [error, setError] = useState("")
  const [wordCount, setWordCount] = useState<number | null>(null)

  function acceptFile(f: File) {
    const err = validatePdf(f)
    setFileError(err)
    setFile(err ? null : f)
    setWordCount(null)
  }

  async function handleExtract() {
    if (!file || state === "processing") return
    setState("processing"); setError(""); setWordCount(null)
    try {
      const buf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf, verbosity: 0 }).promise
      const parts: string[] = []

      for (let pn = 1; pn <= pdf.numPages; pn++) {
        const page = await pdf.getPage(pn)
        const content = await page.getTextContent()
        const pageText = (content.items as any[]).map((it) => it.str ?? "").join(" ")
        if (pageText.trim()) parts.push(`--- Page ${pn} ---\n${pageText}`)
        page.cleanup()
      }

      if (!parts.length) {
        setError("No text found — this PDF may be scanned or image-based. Use OCR in the editor instead.")
        setState("error")
        return
      }

      const fullText = parts.join("\n\n")
      const words = fullText.split(/\s+/).filter(Boolean).length
      setWordCount(words)
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" })
      const baseName = file.name.replace(/\.pdf$/i, "")
      downloadBlob(blob, `${baseName}.txt`)
      setState("done")
      setTimeout(() => setState("idle"), 8000)
    } catch (err: any) {
      setError("Text extraction failed — the file may be corrupted or password-protected.")
      setState("error")
    }
  }

  return (
    <ToolCard
      icon={FileDown}
      title="PDF to Text"
      description="Extract all text content from a PDF and save as a plain .txt file."
      accentClass="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
    >
      <div className="space-y-3">
        <FileDropZone
          file={file}
          onFile={acceptFile}
          onRemove={() => { setFile(null); setFileError(null); setWordCount(null) }}
          disabled={state === "processing"}
        />
        {fileError && <p className="text-xs text-red-500">{fileError}</p>}
        <p className="text-xs text-muted-foreground">
          Best for text-based PDFs. Scanned PDFs require OCR — use the editor for those.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={handleExtract}
            disabled={!file || state === "processing"}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            size="sm"
          >
            {state === "processing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Extract Text
          </Button>
          <ResultRow
            state={state}
            error={error}
            extra={wordCount ? `${wordCount.toLocaleString()} words` : undefined}
          />
        </div>
      </div>
    </ToolCard>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePageNumbers(input: string): number[] {
  const indexes = new Set<number>()
  input.split(",").forEach((part) => {
    const t = part.trim()
    const range = t.match(/^(\d+)-(\d+)$/)
    if (range) {
      const from = parseInt(range[1], 10); const to = parseInt(range[2], 10)
      for (let p = Math.min(from, to); p <= Math.max(from, to); p++) indexes.add(p - 1)
    } else {
      const n = parseInt(t, 10); if (!isNaN(n) && n >= 1) indexes.add(n - 1)
    }
  })
  return Array.from(indexes).sort((a, b) => a - b)
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="col-span-full pt-2 pb-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PdfToolsPanel() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-6">
        <h2 className="text-base font-semibold">PDF Tools</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload, process, and download — no session needed.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionHeader
          title="Document structure"
          description="Combine, split, and reorganize PDF files."
        />
        <MergeTool />
        <ExtractPagesTool />
        <PageToolsCard />
        <SectionHeader
          title="Content &amp; optimization"
          description="Extract text content or reduce file size."
        />
        <PdfToTextTool />
        <CompressTool />
      </div>
    </div>
  )
}
