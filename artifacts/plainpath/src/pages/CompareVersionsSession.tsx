// ─── Compare Versions — Session Detail Placeholder (Slice 1) ──────────────────
// Shows session metadata, status, and manager notes summary.
// Document rendering begins in Slice 2.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import {
  ArrowLeft, ScanSearch, FileText, Loader2, AlertCircle,
  Clock, CheckCircle2, AlertTriangle,
} from "lucide-react"
import { useCompareVersionsApi } from "@/hooks/useCompareVersionsApi"
import type { CVSessionDetail, WatchlistSeverity } from "@/lib/compareVersionsTypes"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  scanning: { label: "Scanning", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  complete: { label: "Complete", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  error:    { label: "Error",    cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
}

const SEVERITY_STYLE: Record<WatchlistSeverity, string> = {
  High:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Low:    "bg-muted text-muted-foreground",
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  sessionId: string
}

export default function CompareVersionsSession({ sessionId }: Props) {
  const [, setLocation] = useLocation()
  const api = useCompareVersionsApi()

  const [session, setSession] = useState<CVSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "Audit Document Revisions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.getSession(sessionId).then((s) => {
      if (!cancelled) setSession(s)
    }).catch((err) => {
      if (!cancelled) setError(
        err?.status === 404
          ? "This comparison session was not found."
          : "Failed to load session. Please try again."
      )
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-4 min-h-[40vh] justify-center text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-base font-semibold">{error ?? "Session not found."}</p>
          <button
            onClick={() => setLocation("/compare-versions")}
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            ← Back to My Comparisons
          </button>
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_BADGE[session.status] ?? STATUS_BADGE.pending
  const notes = session.managerNotes ?? { freeform: "", watchlist: [] }
  const hasNotes = notes.freeform.trim().length > 0 || notes.watchlist.length > 0

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link + header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setLocation("/compare-versions")}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <ScanSearch className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate max-w-[480px]">{session.title}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{fmtRelative(session.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Document cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Original */}
          <div className="border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                Original
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm font-medium truncate">{session.originalFileName}</p>
            </div>
            {session.originalPageCount != null && (
              <p className="text-xs text-muted-foreground mt-1 pl-6">{session.originalPageCount} page{session.originalPageCount !== 1 ? "s" : ""}</p>
            )}
          </div>

          {/* Revised */}
          <div className="border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                Revised
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm font-medium truncate">{session.revisedFileName}</p>
            </div>
            {session.revisedPageCount != null && (
              <p className="text-xs text-muted-foreground mt-1 pl-6">{session.revisedPageCount} page{session.revisedPageCount !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>

        {/* Slice 2 placeholder notice */}
        <div className="border border-border/40 bg-muted/20 rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Document workspace — coming in Slice 2
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The dual-pane PDF viewer, synchronized navigation, and change zone overlay will be built in Slice 2.
                Both documents are stored and this session will automatically upgrade when the workspace is ready.
              </p>
            </div>
          </div>
        </div>

        {/* Manager notes summary (read-only) */}
        {hasNotes && (
          <div className="border border-teal-200/60 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
              Manager Notes
            </h2>

            {notes.freeform.trim() && (
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {notes.freeform}
              </p>
            )}

            {notes.watchlist.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Watchlist — {notes.watchlist.length} item{notes.watchlist.length !== 1 ? "s" : ""}
                </p>
                {notes.watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 bg-background/60 border border-border/40 rounded-lg px-3 py-2.5"
                  >
                    {item.resolved ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${item.resolved ? "line-through text-muted-foreground" : ""}`}>
                      {item.text || <em className="text-muted-foreground/50">No description</em>}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${SEVERITY_STYLE[item.severity]}`}>
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <button
          onClick={() => setLocation("/compare-versions")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Comparisons
        </button>
      </div>
    </div>
  )
}
