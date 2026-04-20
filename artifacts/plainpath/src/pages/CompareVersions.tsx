// ─── Compare Versions — List + Intake Page ────────────────────────────────────
// Slice 1: session list, new comparison intake (two PDF slots + manager notes),
// Scan Documents button state machine, session create → navigate to workspace.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useId } from "react"
import { useLocation } from "wouter"
import {
  ScanSearch, ArrowLeft, Upload, FileText, X, Loader2, AlertCircle,
  Lock, Zap, CheckCircle2, Plus, Trash2, FolderOpen, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useEntitlements } from "@/hooks/useEntitlements"
import { useCompareVersionsApi } from "@/hooks/useCompareVersionsApi"
import type { CVSessionListItem, CVWatchlistItem, CVManagerNotes, WatchlistSeverity } from "@/lib/compareVersionsTypes"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const MAX_BYTES = 50 * 1024 * 1024

function validatePdf(file: File): string | null {
  const nameLower = file.name.toLowerCase()
  const mime = file.type.toLowerCase()
  if (nameLower.endsWith(".docx") || mime.includes("wordprocessingml")) {
    return "Word (.docx) files are not supported yet — PDF only. Word support coming soon."
  }
  if (nameLower.endsWith(".txt") || mime === "text/plain") {
    return "Plain text files are not accepted — please upload a PDF."
  }
  if (mime.startsWith("image/")) {
    return "Image files are not accepted — please upload a PDF."
  }
  if (!nameLower.endsWith(".pdf") && mime !== "application/pdf") {
    return "Only PDF files are accepted."
  }
  if (file.size > MAX_BYTES) {
    return "File exceeds the 50 MB limit."
  }
  return null
}

// ─── Locked Gate ──────────────────────────────────────────────────────────────

function LockedGate() {
  const [, setLocation] = useLocation()
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <Lock className="w-7 h-7 text-teal-500 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Compare Versions</h1>
          <p className="text-muted-foreground leading-relaxed">
            Upload an original PDF and a revised copy. See exactly what changed — side-by-side, with your own audit notes and watchlist.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground w-full max-w-xs">
          {[
            "Side-by-side PDF workspace",
            "Grouped change zones with severity",
            "Manager notes and watchlist",
            "Deterministic, not AI-guessed",
            "Sessions saved for reopen",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
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

// ─── PDF File Slot ─────────────────────────────────────────────────────────────

interface FileSlotProps {
  label: string
  side: "original" | "revised"
  file: File | null
  error: string | null
  onFile: (file: File) => void
  onRemove: () => void
  disabled?: boolean
}

function FileSlot({ label, side, file, error, onFile, onRemove, disabled }: FileSlotProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOrig = side === "original"
  const accentColor = isOrig
    ? "text-blue-600 dark:text-blue-400"
    : "text-emerald-600 dark:text-emerald-400"
  const accentBadge = isOrig
    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40"
    : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
  const fileBorder = isOrig
    ? "border-blue-300/60 dark:border-blue-700/40 bg-blue-50/40 dark:bg-blue-950/20"
    : "border-emerald-300/60 dark:border-emerald-700/40 bg-emerald-50/40 dark:bg-emerald-950/20"
  const dragBorder = isOrig
    ? "border-blue-400 bg-blue-50/30 dark:bg-blue-950/10"
    : "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10"

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accentBadge}`}>
          {isOrig ? "Original" : "Revised"}
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {/* File loaded card */}
      {file ? (
        <div className={`flex items-start gap-3 border rounded-xl p-4 ${fileBorder}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isOrig ? "bg-blue-100 dark:bg-blue-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"
          }`}>
            <FileText className={`w-5 h-5 ${accentColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtBytes(file.size)} · PDF</p>
          </div>
          {!disabled && (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label={`Remove ${label}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleChange}
            disabled={disabled}
          />
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !disabled && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none ${
              disabled
                ? "opacity-50 cursor-not-allowed border-border/30"
                : dragging
                ? dragBorder
                : "border-border/40 hover:border-primary/40 hover:bg-muted/10"
            }`}
          >
            <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              {dragging ? "Drop to upload" : "Drag and drop, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF only · max 50 MB</p>
          </div>
        </div>
      )}

      {/* File error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ─── Manager Notes / Watchlist ─────────────────────────────────────────────────

const SEVERITY_OPTIONS: WatchlistSeverity[] = ["High", "Medium", "Low"]

const SEVERITY_STYLE: Record<WatchlistSeverity, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Low: "bg-muted text-muted-foreground",
}

interface ManagerNotesEditorProps {
  notes: CVManagerNotes
  onChange: (notes: CVManagerNotes) => void
  disabled?: boolean
}

function ManagerNotesEditor({ notes, onChange, disabled }: ManagerNotesEditorProps) {
  const [open, setOpen] = useState(false)
  const newItemId = useId()

  function updateFreeform(v: string) {
    onChange({ ...notes, freeform: v })
  }

  function addWatchlistItem() {
    const item: CVWatchlistItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: "",
      severity: "Medium",
      resolved: false,
    }
    onChange({ ...notes, watchlist: [...notes.watchlist, item] })
  }

  function updateItem(id: string, patch: Partial<CVWatchlistItem>) {
    onChange({
      ...notes,
      watchlist: notes.watchlist.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    })
  }

  function removeItem(id: string) {
    onChange({ ...notes, watchlist: notes.watchlist.filter((w) => w.id !== id) })
  }

  const hasContent = notes.freeform.trim().length > 0 || notes.watchlist.length > 0

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      {/* Collapse toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Manager Notes &amp; Watchlist</span>
          {hasContent && !open && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              {[notes.freeform.trim() ? 1 : 0, notes.watchlist.length].reduce((a, b) => a + b, 0)} item{(notes.watchlist.length + (notes.freeform.trim() ? 1 : 0)) !== 1 ? "s" : ""}
            </span>
          )}
          {!hasContent && !open && (
            <span className="text-xs text-muted-foreground">optional — collapsed</span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/30">
          {/* Freeform notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Freeform Notes
            </label>
            <Textarea
              value={notes.freeform}
              onChange={(e) => updateFreeform(e.target.value)}
              placeholder="Any general notes about this comparison…"
              className="h-24 text-sm resize-none bg-muted/20 border-border/50 focus-visible:ring-teal-500/30"
              disabled={disabled}
            />
          </div>

          {/* Watchlist items */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Watchlist Items
            </label>

            {notes.watchlist.length === 0 && (
              <p className="text-xs text-muted-foreground/70 italic">No watchlist items yet.</p>
            )}

            {notes.watchlist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 bg-muted/20 border border-border/40 rounded-lg p-3"
              >
                {/* Resolved toggle */}
                <button
                  onClick={() => updateItem(item.id, { resolved: !item.resolved })}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.resolved
                      ? "border-teal-500 bg-teal-500"
                      : "border-border hover:border-teal-400"
                  }`}
                  title={item.resolved ? "Mark unresolved" : "Mark resolved"}
                  disabled={disabled}
                >
                  {item.resolved && <CheckCircle2 className="w-3 h-3 text-white" />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItem(item.id, { text: e.target.value })}
                  placeholder="Describe the watchlist item…"
                  className={`flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 ${
                    item.resolved ? "line-through text-muted-foreground" : ""
                  }`}
                  disabled={disabled}
                />

                {/* Severity selector */}
                <select
                  value={item.severity}
                  onChange={(e) => updateItem(item.id, { severity: e.target.value as WatchlistSeverity })}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer outline-none ${SEVERITY_STYLE[item.severity]}`}
                  disabled={disabled}
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  disabled={disabled}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={addWatchlistItem}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add watchlist item
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Intake Form ──────────────────────────────────────────────────────────────

interface IntakeFormProps {
  onCreated: (id: string) => void
  onCancel: () => void
}

function IntakeForm({ onCreated, onCancel }: IntakeFormProps) {
  const api = useCompareVersionsApi()

  const [origFile, setOrigFile] = useState<File | null>(null)
  const [origError, setOrigError] = useState<string | null>(null)
  const [revFile, setRevFile] = useState<File | null>(null)
  const [revError, setRevError] = useState<string | null>(null)

  const [notes, setNotes] = useState<CVManagerNotes>({ freeform: "", watchlist: [] })
  const [scanning, setScanning] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleOrigFile(file: File) {
    const err = validatePdf(file)
    setOrigError(err)
    setOrigFile(err ? null : file)
  }

  function handleRevFile(file: File) {
    const err = validatePdf(file)
    setRevError(err)
    setRevFile(err ? null : file)
  }

  const canScan = origFile !== null && revFile !== null && !scanning

  async function handleScan() {
    if (!canScan) return
    setScanning(true)
    setSubmitError(null)
    try {
      const title = `${origFile.name} vs ${revFile.name}`
      const session = await api.createSession(origFile, revFile, title, notes)
      onCreated(session.id)
    } catch (err: any) {
      const msg =
        err?.status === 413
          ? "One or both files exceed the 50 MB limit."
          : err?.status === 422
          ? (err.message || "One or both files are not valid PDFs.")
          : err?.message || "Something went wrong. Please try again."
      setSubmitError(msg)
      setScanning(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          disabled={scanning}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <ScanSearch className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">New Comparison</h1>
            <p className="text-sm text-muted-foreground">Upload the original and revised PDFs to audit</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Two-column file slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FileSlot
            label="Original / Baseline"
            side="original"
            file={origFile}
            error={origError}
            onFile={handleOrigFile}
            onRemove={() => { setOrigFile(null); setOrigError(null) }}
            disabled={scanning}
          />
          <FileSlot
            label="Revised Version"
            side="revised"
            file={revFile}
            error={revError}
            onFile={handleRevFile}
            onRemove={() => { setRevFile(null); setRevError(null) }}
            disabled={scanning}
          />
        </div>

        {/* Progress hint when one file loaded */}
        {(!!origFile !== !!revFile) && !scanning && (
          <p className="text-center text-xs text-muted-foreground/70">
            {origFile
              ? "Original loaded — now upload the revised version."
              : "Revised loaded — now upload the original / baseline."}
          </p>
        )}

        {/* Manager notes */}
        <ManagerNotesEditor notes={notes} onChange={setNotes} disabled={scanning} />

        {/* Submit error */}
        {submitError && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Scan button */}
        <div className="flex items-center gap-4 pt-1">
          <Button
            size="lg"
            onClick={handleScan}
            disabled={!canScan}
            className={`gap-2 transition-all ${
              canScan
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading documents…
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                Scan Documents
              </>
            )}
          </Button>
          {!canScan && !scanning && (
            <p className="text-xs text-muted-foreground">
              {!origFile && !revFile
                ? "Upload both PDFs to enable scanning."
                : !origFile
                ? "Upload the original PDF."
                : "Upload the revised PDF."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Session List ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  scanning: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  error:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

function SessionList({
  sessions,
  loading,
  onOpen,
  onNew,
}: {
  sessions: CVSessionListItem[]
  loading: boolean
  onOpen: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <ScanSearch className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Compare Versions</h1>
            <p className="text-sm text-muted-foreground">Upload two PDFs to see what changed between versions</p>
          </div>
        </div>
        <Button onClick={onNew} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
          <Plus className="w-4 h-4" />
          New Comparison
        </Button>
      </div>

      {/* Sessions */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading comparisons…
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <FolderOpen className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground mb-1">No comparisons yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Start a new comparison to audit what changed between your original and revised PDFs.
            </p>
          </div>
          <Button onClick={onNew} variant="outline" className="gap-2 mt-1">
            <Plus className="w-4 h-4" /> New Comparison
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              My Comparisons
            </h2>
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 border border-border/50 rounded-xl px-4 py-3.5 hover:border-teal-400/40 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                    <ScanSearch className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <Clock className="w-3 h-3" />
                      <span>{fmtRelative(s.createdAt)}</span>
                      <span>·</span>
                      <span className="truncate max-w-[120px]">{s.originalFileName}</span>
                      <span>vs</span>
                      <span className="truncate max-w-[120px]">{s.revisedFileName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] ?? STATUS_BADGE.pending}`}>
                    {s.status}
                  </span>
                  <button
                    onClick={() => onOpen(s.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 border border-teal-300/60 dark:border-teal-700/40 rounded-lg hover:bg-teal-100/50 dark:hover:bg-teal-900/30 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CompareVersions() {
  const [, setLocation] = useLocation()
  const { entitlements, isAdmin, loading: entLoading } = useEntitlements()
  const api = useCompareVersionsApi()

  const [view, setView] = useState<"list" | "new">("list")
  const [sessions, setSessions] = useState<CVSessionListItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  const canUse =
    isAdmin || (entitlements?.toolAccess?.includes("compare-versions") ?? false)

  useEffect(() => {
    document.title = "Compare Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

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

  if (view === "new") {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <IntakeForm
          onCreated={(id) => setLocation(`/compare-versions/${id}`)}
          onCancel={() => setView("list")}
        />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <SessionList
        sessions={sessions}
        loading={sessionsLoading}
        onOpen={(id) => setLocation(`/compare-versions/${id}`)}
        onNew={() => setView("new")}
      />
    </div>
  )
}
