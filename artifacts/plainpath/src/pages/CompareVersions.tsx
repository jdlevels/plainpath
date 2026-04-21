// ─── Compare Versions — List + Intake Page (Slice 6) ──────────────────────────
// T003: session rename, archive (primary removal), soft-delete, 4-tab filter
// T004: polished list — diff counts, severity dots, filter tabs, better metadata
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useId } from "react"
import { useLocation } from "wouter"
import {
  ScanSearch, ArrowLeft, Upload, FileText, X, Loader2, AlertCircle,
  Lock, Zap, CheckCircle2, Plus, Trash2, FolderOpen, Clock,
  ChevronDown, ChevronUp, Archive, ArchiveRestore, Pencil, Check,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useEntitlements } from "@/hooks/useEntitlements"
import { useCompareVersionsApi } from "@/hooks/useCompareVersionsApi"
import { isPaywallActive } from "@/lib/billingConfig"
import type {
  CVSessionListItem, CVWatchlistItem, CVManagerNotes, CVNoteSeverity,
} from "@/lib/compareVersionsTypes"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}

const MAX_BYTES = 50 * 1024 * 1024

function validatePdf(file: File): string | null {
  const nameLower = file.name.toLowerCase()
  const mime = file.type.toLowerCase()
  if (nameLower.endsWith(".docx") || mime.includes("wordprocessingml"))
    return "Word (.docx) files are not supported yet — PDF only."
  if (nameLower.endsWith(".txt") || mime === "text/plain")
    return "Plain text files are not accepted — please upload a PDF."
  if (mime.startsWith("image/"))
    return "Image files are not accepted — please upload a PDF."
  if (!nameLower.endsWith(".pdf") && mime !== "application/pdf")
    return "Only PDF files are accepted."
  if (file.size > MAX_BYTES)
    return "File exceeds the 50 MB limit."
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
            Upload an original PDF and a revised copy. See exactly what changed — side-by-side, with your own audit notes.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground w-full max-w-xs">
          {[
            "Side-by-side PDF workspace",
            "Grouped change zones with severity",
            "Manager notes and watchlist",
            "Sessions saved for reopen",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
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

  const accentColor = isOrig ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"
  const accentBadge = isOrig
    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40"
    : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
  const fileBorder = isOrig
    ? "border-blue-300/60 dark:border-blue-700/40 bg-blue-50/40 dark:bg-blue-950/20"
    : "border-emerald-300/60 dark:border-emerald-700/40 bg-emerald-50/40 dark:bg-emerald-950/20"
  const dragBorder = isOrig ? "border-blue-400 bg-blue-50/30" : "border-emerald-400 bg-emerald-50/30"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accentBadge}`}>
          {isOrig ? "Original" : "Revised"}
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </div>

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
            <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            ref={inputRef} type="file" accept=".pdf,application/pdf"
            className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = "" }}
            disabled={disabled}
          />
          <div
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f) }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !disabled && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none ${
              disabled ? "opacity-50 cursor-not-allowed border-border/30"
              : dragging ? dragBorder
              : "border-border/40 hover:border-primary/40 hover:bg-muted/10"
            }`}
          >
            <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium">{dragging ? "Drop to upload" : "Drag and drop, or click to browse"}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF only · max 50 MB</p>
          </div>
        </>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ─── Manager Notes ─────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS: CVNoteSeverity[] = ["high", "medium", "low"]
const SEVERITY_STYLE: Record<CVNoteSeverity, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
}

function ManagerNotesEditor({ notes, onChange, disabled }: {
  notes: CVManagerNotes; onChange: (n: CVManagerNotes) => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const hasContent = notes.freeform.trim().length > 0 || notes.watchlist.length > 0

  function addItem() {
    const item: CVWatchlistItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "watchlist", text: "", severity: "medium", resolved: false,
      created_at: new Date().toISOString(), linked_diff_id: null,
    }
    onChange({ ...notes, watchlist: [...notes.watchlist, item] })
  }

  function updateItem(id: string, patch: Partial<CVWatchlistItem>) {
    onChange({ ...notes, watchlist: notes.watchlist.map((w) => w.id === id ? { ...w, ...patch } : w) })
  }

  function removeItem(id: string) {
    onChange({ ...notes, watchlist: notes.watchlist.filter((w) => w.id !== id) })
  }

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)} disabled={disabled}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Manager Notes &amp; Watchlist</span>
          {!open && hasContent && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              saved
            </span>
          )}
          {!open && !hasContent && <span className="text-xs text-muted-foreground">optional</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/30">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Freeform Notes</label>
            <Textarea
              value={notes.freeform} onChange={(e) => onChange({ ...notes, freeform: e.target.value })}
              placeholder="Any general notes about this comparison…"
              className="h-24 text-sm resize-none bg-muted/20 border-border/50"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Watchlist</label>
            {notes.watchlist.length === 0 && <p className="text-xs text-muted-foreground/70 italic">No items yet.</p>}
            {notes.watchlist.map((item) => (
              <div key={item.id} className="flex items-start gap-2 bg-muted/20 border border-border/40 rounded-lg p-3">
                <button
                  onClick={() => updateItem(item.id, { resolved: !item.resolved })} disabled={disabled}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.resolved ? "border-teal-500 bg-teal-500" : "border-border hover:border-teal-400"
                  }`}
                >
                  {item.resolved && <CheckCircle2 className="w-3 h-3 text-white" />}
                </button>
                <input
                  type="text" value={item.text}
                  onChange={(e) => updateItem(item.id, { text: e.target.value })}
                  placeholder="Describe the item…"
                  className={`flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 ${item.resolved ? "line-through text-muted-foreground" : ""}`}
                  disabled={disabled}
                />
                <select
                  value={item.severity}
                  onChange={(e) => updateItem(item.id, { severity: e.target.value as CVNoteSeverity })}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer outline-none ${SEVERITY_STYLE[item.severity]}`}
                  disabled={disabled}
                >
                  {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => removeItem(item.id)} disabled={disabled}
                  className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addItem} disabled={disabled}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 disabled:opacity-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add watchlist item
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Intake Form ──────────────────────────────────────────────────────────────

function IntakeForm({ onCreated, onCancel }: { onCreated: (id: string) => void; onCancel: () => void }) {
  const api = useCompareVersionsApi()
  const [origFile, setOrigFile] = useState<File | null>(null)
  const [origError, setOrigError] = useState<string | null>(null)
  const [revFile, setRevFile] = useState<File | null>(null)
  const [revError, setRevError] = useState<string | null>(null)
  const [notes, setNotes] = useState<CVManagerNotes>({ freeform: "", watchlist: [], notes: [] })
  const [scanning, setScanning] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const canScan = origFile !== null && revFile !== null && !scanning

  async function handleScan() {
    if (!canScan) return
    setScanning(true); setSubmitError(null)
    try {
      const title = `${origFile.name} vs ${revFile.name}`
      const session = await api.createSession(origFile, revFile, title, notes)
      onCreated(session.id)
    } catch (err: any) {
      const msg = err?.status === 413 ? "One or both files exceed the 50 MB limit."
        : err?.status === 422 ? (err.message || "One or both files are not valid PDFs.")
        : err?.message || "Something went wrong. Please try again."
      setSubmitError(msg); setScanning(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onCancel} disabled={scanning}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FileSlot label="Original / Baseline" side="original" file={origFile} error={origError}
            onFile={(f) => { const e = validatePdf(f); setOrigError(e); setOrigFile(e ? null : f) }}
            onRemove={() => { setOrigFile(null); setOrigError(null) }} disabled={scanning} />
          <FileSlot label="Revised Version" side="revised" file={revFile} error={revError}
            onFile={(f) => { const e = validatePdf(f); setRevError(e); setRevFile(e ? null : f) }}
            onRemove={() => { setRevFile(null); setRevError(null) }} disabled={scanning} />
        </div>

        <p className="text-xs text-muted-foreground/70">
          PlainPath will compare both PDFs and show every addition, deletion, and text change — grouped by severity and mapped to the original pages.
        </p>

        <ManagerNotesEditor notes={notes} onChange={setNotes} disabled={scanning} />

        {submitError && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{submitError}</span>
          </div>
        )}

        <div className="flex items-center gap-4 pt-1">
          <Button size="lg" onClick={handleScan} disabled={!canScan}
            className={`gap-2 ${canScan ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><ScanSearch className="w-4 h-4" /> Compare Documents</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  scanning: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  error:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const STATUS_LABEL: Record<string, string> = {
  pending:  "Pending",
  scanning: "Scanning…",
  complete: "Complete",
  error:    "Error",
}

// ─── Session Row ───────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: CVSessionListItem
  isArchivedTab: boolean
  onOpen: (id: string) => void
  onRename: (id: string, title: string) => Promise<void>
  onArchive: (id: string, archived: boolean) => Promise<void>
  onSoftDelete: (id: string) => Promise<void>
}

function SessionRow({ session: s, isArchivedTab, onOpen, onRename, onArchive, onSoftDelete }: SessionRowProps) {
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(s.title)
  const [renameBusy, setRenameBusy] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function startRename() { setRenameVal(s.title); setRenaming(true); setTimeout(() => renameRef.current?.select(), 30) }

  async function commitRename() {
    const trimmed = renameVal.trim()
    if (!trimmed || trimmed === s.title) { setRenaming(false); return }
    setRenameBusy(true)
    try { await onRename(s.id, trimmed) } finally { setRenameBusy(false); setRenaming(false) }
  }

  async function handleArchiveToggle() {
    setArchiveBusy(true)
    try { await onArchive(s.id, !isArchivedTab) } finally { setArchiveBusy(false) }
  }

  async function handleSoftDelete() {
    setDeleteBusy(true)
    try { await onSoftDelete(s.id) } finally { setDeleteBusy(false); setConfirmDelete(false) }
  }

  const high   = s.diffHigh   ?? 0
  const medium = s.diffMedium ?? 0
  const low    = s.diffLow    ?? 0
  const total  = s.diffTotal  ?? 0
  const hasDiffs = s.status === "complete" && total > 0

  return (
    <div className="group flex items-center gap-3 border border-border/50 rounded-xl px-4 py-3.5 hover:border-teal-400/40 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
        {s.status === "error"
          ? <AlertTriangle className="w-4 h-4 text-red-500" />
          : <ScanSearch className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
      </div>

      <div className="flex-1 min-w-0">
        {renaming ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={renameRef} value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(false) }}
              className="flex-1 text-sm font-medium bg-background border border-teal-400/50 rounded-md px-2 py-0.5 outline-none focus:ring-1 focus:ring-teal-500/40 min-w-0"
              disabled={renameBusy}
            />
            <button onClick={commitRename} disabled={renameBusy}
              className="p-1 rounded text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors">
              {renameBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setRenaming(false)} className="p-1 rounded text-muted-foreground hover:bg-muted/60 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-medium truncate">{s.title}</p>
            <button onClick={startRename}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground"
              title="Rename">
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{fmtDate(s.updatedAt)}</span>
          <span>·</span>
          <span className="truncate max-w-[90px]">{s.originalFileName}</span>
          <span className="text-muted-foreground/50">vs</span>
          <span className="truncate max-w-[90px]">{s.revisedFileName}</span>

          {hasDiffs && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                {high > 0 && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-red-600 dark:text-red-400 font-medium">{high}</span>
                  </span>
                )}
                {medium > 0 && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium">{medium}</span>
                  </span>
                )}
                {low > 0 && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="font-medium">{low}</span>
                  </span>
                )}
                <span className="text-muted-foreground/60">({total})</span>
              </span>
            </>
          )}
          {s.status === "complete" && total === 0 && <><span>·</span><span>No changes detected</span></>}
          {isArchivedTab && s.archivedAt && (
            <><span>·</span><span className="italic">Archived {fmtDate(s.archivedAt)}</span></>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] ?? STATUS_BADGE.pending}`}>
          {STATUS_LABEL[s.status] ?? s.status}
        </span>

        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Permanently delete?</span>
            <button onClick={handleSoftDelete} disabled={deleteBusy}
              className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50">
              {deleteBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs font-medium border border-border/50 rounded-md hover:bg-muted/60 transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <>
            {/* Archive tab: show restore + delete. Other tabs: show archive only */}
            {isArchivedTab ? (
              <>
                <button onClick={handleArchiveToggle} disabled={archiveBusy}
                  title="Restore to active"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-50">
                  {archiveBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setConfirmDelete(true)}
                  title="Delete permanently"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button onClick={handleArchiveToggle} disabled={archiveBusy}
                title="Archive (move out of active list)"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-50">
                {archiveBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              </button>
            )}
            <button onClick={() => onOpen(s.id)}
              className="px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 border border-teal-300/60 dark:border-teal-700/40 rounded-lg hover:bg-teal-100/50 dark:hover:bg-teal-900/30 transition-colors">
              {s.status === "complete" ? "Open" : "View"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Session List ─────────────────────────────────────────────────────────────
//
// Filter tabs:
//   Active     — non-archived sessions with status IN (pending, scanning)
//   Completed  — non-archived sessions with status = complete
//   Error      — non-archived sessions with status = error
//   Archived   — sessions with archived_at IS NOT NULL (any status)
//
// Archive is the non-destructive removal path (moves to Archived tab).
// Delete (soft) is only accessible from the Archived tab, with explicit confirm.

type ListFilter = "active" | "completed" | "error" | "archived"

const FILTER_LABELS: Record<ListFilter, string> = {
  active: "Active", completed: "Completed", error: "Error", archived: "Archived",
}

function SessionList({
  sessions,
  archivedSessions,
  loading,
  onOpen,
  onNew,
  onRename,
  onArchive,
  onSoftDelete,
}: {
  sessions: CVSessionListItem[]
  archivedSessions: CVSessionListItem[]
  loading: boolean
  onOpen: (id: string) => void
  onNew: () => void
  onRename: (id: string, title: string) => Promise<void>
  onArchive: (id: string, archived: boolean) => Promise<void>
  onSoftDelete: (id: string) => Promise<void>
}) {
  const [filter, setFilter] = useState<ListFilter>("active")

  // Client-side split by status
  const activeSessions    = sessions.filter((s) => s.status === "pending" || s.status === "scanning")
  const completedSessions = sessions.filter((s) => s.status === "complete")
  const errorSessions     = sessions.filter((s) => s.status === "error")

  const tabCounts: Record<ListFilter, number> = {
    active:    activeSessions.length,
    completed: completedSessions.length,
    error:     errorSessions.length,
    archived:  archivedSessions.length,
  }

  const visibleSessions = filter === "archived" ? archivedSessions
    : filter === "completed" ? completedSessions
    : filter === "error" ? errorSessions
    : activeSessions

  const totalNonArchived = sessions.length

  const TAB_BADGE: Record<ListFilter, string> = {
    active:    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    error:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    archived:  "bg-muted text-muted-foreground",
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
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
          <Plus className="w-4 h-4" /> New Comparison
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading comparisons…
        </div>
      ) : totalNonArchived === 0 && archivedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <FolderOpen className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-base font-semibold mb-1">No comparisons yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">Start a new comparison to audit what changed between your PDFs.</p>
          </div>
          <Button onClick={onNew} variant="outline" className="gap-2 mt-1">
            <Plus className="w-4 h-4" /> New Comparison
          </Button>
        </div>
      ) : (
        <>
          {/* 4 filter tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-border/40 overflow-x-auto">
            {(["active", "completed", "error", "archived"] as ListFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap ${
                  filter === f
                    ? "border-teal-500 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {FILTER_LABELS[f]}
                {tabCounts[f] > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    filter === f ? TAB_BADGE[f] : "bg-muted text-muted-foreground"
                  }`}>
                    {tabCounts[f]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {visibleSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              {filter === "error"
                ? <AlertTriangle className="w-8 h-8 text-red-400/60" />
                : filter === "archived"
                ? <Archive className="w-8 h-8 text-muted-foreground/40" />
                : <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />}
              <p className="text-sm text-muted-foreground">
                {filter === "active"     ? "No comparisons in progress." :
                 filter === "completed"  ? "No completed comparisons yet." :
                 filter === "error"      ? "No failed comparisons." :
                                           "No archived comparisons."}
              </p>
              {filter === "archived" && (
                <p className="text-xs text-muted-foreground/70 max-w-xs">
                  Archive a comparison to move it here. Archived sessions are read-only but preserved.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {visibleSessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  isArchivedTab={filter === "archived"}
                  onOpen={onOpen}
                  onRename={onRename}
                  onArchive={onArchive}
                  onSoftDelete={onSoftDelete}
                />
              ))}
            </div>
          )}

          {filter !== "archived" && (
            <p className="text-xs text-muted-foreground/60 mt-6">
              Archive a session to remove it from the active views without deleting audit history.
            </p>
          )}
        </>
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
  const [archivedSessions, setArchivedSessions] = useState<CVSessionListItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  const canUse = !isPaywallActive || isAdmin || (entitlements?.toolAccess?.includes("compare-versions") ?? false)

  useEffect(() => {
    document.title = "Compare Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  async function loadSessions() {
    const [active, archived] = await Promise.all([
      api.listSessions({ archived: false }),
      api.listSessions({ archived: true }),
    ])
    setSessions(active)
    setArchivedSessions(archived)
  }

  useEffect(() => {
    if (entLoading || !canUse) return
    let cancelled = false
    loadSessions().catch(() => {}).finally(() => { if (!cancelled) setSessionsLoading(false) })
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

  async function handleRename(id: string, title: string) {
    await api.renameSession(id, title)
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title } : s))
    setArchivedSessions((prev) => prev.map((s) => s.id === id ? { ...s, title } : s))
  }

  async function handleArchive(id: string, archived: boolean) {
    await api.archiveSession(id, archived)
    if (archived) {
      setSessions((prev) => {
        const s = prev.find((x) => x.id === id)
        if (s) setArchivedSessions((a) => [{ ...s, archivedAt: new Date().toISOString() }, ...a])
        return prev.filter((x) => x.id !== id)
      })
    } else {
      setArchivedSessions((prev) => {
        const s = prev.find((x) => x.id === id)
        if (s) setSessions((a) => [{ ...s, archivedAt: null }, ...a])
        return prev.filter((x) => x.id !== id)
      })
    }
  }

  async function handleSoftDelete(id: string) {
    await api.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setArchivedSessions((prev) => prev.filter((s) => s.id !== id))
  }

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
        archivedSessions={archivedSessions}
        loading={sessionsLoading}
        onOpen={(id) => setLocation(`/compare-versions/${id}`)}
        onNew={() => setView("new")}
        onRename={handleRename}
        onArchive={handleArchive}
        onSoftDelete={handleSoftDelete}
      />
    </div>
  )
}
