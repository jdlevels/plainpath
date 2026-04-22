// ─── PDF Editor — Entry Page ───────────────────────────────────────────────────
// PDF Platform hub: Edit PDF (upload + session list) | PDF Tools (utilities)
// Editing workspace lives at /pdf-editor/:id (PdfEditorSession.tsx).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import {
  ArrowLeft, Upload, FileText, X, Loader2, AlertCircle,
  Lock, Zap, CheckCircle2, Pen, FolderOpen, Clock, Trash2,
  Wrench, ScanText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEntitlements } from "@/hooks/useEntitlements"
import { usePdfEditorApi } from "@/hooks/usePdfEditorApi"
import { isPaywallActive } from "@/lib/billingConfig"
import type { SessionMeta, PdfType } from "@/lib/pdfEditorTypes"
import PdfToolsPanel from "@/components/PdfToolsPanel"

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
            Edit PDFs, extract text from scanned documents, merge, split, and more — all in one place.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground w-full max-w-xs">
          {[
            "Add text boxes, masks, and highlights",
            "OCR for scanned / image PDFs",
            "Merge, split, and extract pages",
            "Rotate and reorder pages",
            "Compress PDF file size",
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

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function PdfTypeBadge({ pdfType }: { pdfType?: PdfType }) {
  if (!pdfType || pdfType === "unknown") return null
  const styles: Record<string, string> = {
    text:    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    scanned: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    mixed:   "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  }
  const labels: Record<string, string> = {
    text: "Text PDF", scanned: "Scanned PDF", mixed: "Mixed PDF",
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles[pdfType] ?? ""}`}>
      {pdfType === "scanned" ? <ScanText className="w-2.5 h-2.5" /> : null}
      {labels[pdfType]}
    </span>
  )
}

// ─── Session list ─────────────────────────────────────────────────────────────

function SessionList({
  sessions,
  loading,
  onOpen,
  onDelete,
}: {
  sessions: SessionMeta[]
  loading: boolean
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const api = usePdfEditorApi()

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.deleteSession(id)
      onDelete(id)
    } catch { /* ignore */ } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions…
      </div>
    )
  }
  if (!sessions.length) return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Recent sessions
        </h2>
      </div>
      <div className="flex flex-col items-center gap-2 py-8 text-center border border-dashed border-border/40 rounded-xl">
        <p className="text-sm text-muted-foreground">No sessions yet</p>
        <p className="text-xs text-muted-foreground/60 max-w-xs">
          Upload a PDF above to open it in the editor. Sessions are saved automatically.
        </p>
      </div>
    </div>
  )

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Recent sessions
        </h2>
      </div>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 border border-border/50 rounded-xl px-4 py-3 hover:border-violet-400/40 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{s.fileName}</p>
                  <PdfTypeBadge pdfType={s.pdfType} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <Clock className="w-3 h-3" />
                  <span>{fmtRelative(s.updatedAt)}</span>
                  <span>·</span>
                  <span>{fmtBytes(s.fileSizeBytes)}</span>
                  {s.pageCount != null && (
                    <>
                      <span>·</span>
                      <span>{s.pageCount} page{s.pageCount !== 1 ? "s" : ""}</span>
                    </>
                  )}
                  {(s.opCount ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span>{s.opCount} edit{s.opCount !== 1 ? "s" : ""}</span>
                    </>
                  )}
                  {s.hasOcr && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                      <ScanText className="w-2.5 h-2.5" />OCR
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onOpen(s.id)}
                className="px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-300/60 dark:border-violet-700/40 rounded-lg hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-colors"
              >
                Open
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deletingId === s.id}
                title="Delete session"
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                {deletingId === s.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Upload flow ──────────────────────────────────────────────────────────────

function UploadFlow({
  onOpen,
}: {
  onOpen: (file: File, name: string) => Promise<void>
}) {
  const [, setLocation] = useLocation()
  const [file, setFile] = useState<File | null>(null)
  const [docName, setDocName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function acceptFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are accepted.")
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setUploadError("File exceeds the 20 MB limit.")
      return
    }
    setUploadError(null)
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
    setUploadError(null)
  }

  async function handleOpen() {
    if (!file || uploading) return
    setUploading(true)
    setUploadError(null)
    try {
      await onOpen(file, docName.trim() || file.name.replace(/\.pdf$/i, ""))
    } catch (err: any) {
      setUploadError(
        err?.status === 422
          ? "This file does not appear to be a valid PDF."
          : err?.status === 413
          ? "File exceeds the 20 MB limit."
          : "Upload failed — please try again.",
      )
      setUploading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-base font-semibold mb-1">Open a PDF to edit</h2>
        <p className="text-sm text-muted-foreground">
          Upload any PDF to open it in the split-screen editor. Text PDFs support overlays; scanned PDFs can be processed with OCR.
        </p>
      </div>

      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border/50 rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-violet-400/50 hover:bg-violet-50/20 dark:hover:bg-violet-950/10"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
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

      {file && (
        <div className="border border-violet-300/60 dark:border-violet-700/40 bg-violet-50/50 dark:bg-violet-950/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtBytes(file.size)} · PDF</p>
          </div>
          {!uploading && (
            <button
              onClick={handleRemove}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {file && !uploading && (
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

      {uploadError && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={handleOpen} disabled={!file || uploading} className="gap-2">
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          ) : (
            <><Pen className="w-4 h-4" /> Open in Editor</>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type TabMode = "editor" | "tools"

export default function PdfEditor() {
  const [, setLocation] = useLocation()
  const { entitlements, isAdmin, loading: entLoading } = useEntitlements()
  const api = usePdfEditorApi()

  const [tab, setTab] = useState<TabMode>("editor")
  const [sessions, setSessions] = useState<SessionMeta[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    document.title = "PDF Editor — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  const canUse =
    !isPaywallActive || isAdmin || (entitlements?.toolAccess?.includes("pdf-editor") ?? false)

  useEffect(() => {
    if (entLoading || !canUse) return
    let cancelled = false
    api.listSessions().then((list) => {
      if (!cancelled) setSessions(list)
    }).catch(() => {}).finally(() => {
      if (!cancelled) setSessionsLoading(false)
    })
    return () => { cancelled = true }
  }, [entLoading, canUse])

  if (entLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canUse) return <LockedGate />

  async function handleOpen(file: File, fileName: string) {
    const session = await api.createSession(file, fileName)
    setLocation(`/pdf-editor/${session.id}`)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* ── Header ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-6">
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
              <p className="text-sm text-muted-foreground">
                {tab === "editor"
                  ? "Add text, mask content, highlight sections, and export a clean copy"
                  : "Merge, split, extract, rotate, and compress PDFs"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex border-b border-border/60">
          <button
            onClick={() => setTab("editor")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === "editor"
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Pen className="w-4 h-4" />
            Edit PDF
          </button>
          <button
            onClick={() => setTab("tools")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === "tools"
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wrench className="w-4 h-4" />
            PDF Tools
          </button>
        </div>
      </div>

      {/* ── Editor tab ── */}
      {tab === "editor" && (
        <>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <UploadFlow onOpen={handleOpen} />
          </div>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <SessionList
              sessions={sessions}
              loading={sessionsLoading}
              onOpen={(id) => setLocation(`/pdf-editor/${id}`)}
              onDelete={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
            />
          </div>
        </>
      )}

      {/* ── Tools tab ── */}
      {tab === "tools" && <PdfToolsPanel />}
    </div>
  )
}
