import React, { useState, useEffect, useMemo } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText, Trash2, Pencil, Check, X, Search, Loader2,
  FolderOpen, FileSignature, ShieldCheck, EyeOff, Scale,
  PenLine, GitCompare, ChevronRight, Plus, Clock,
  AlertTriangle, FileEdit, ExternalLink, ArrowRight,
  LayoutTemplate,
} from "lucide-react"
import {
  fetchUserDocuments, deleteUserDocument, renameUserDocument,
  type UserDocument,
} from "@/lib/userDocsApi"
import { useUser, useAuth } from "@clerk/react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { fetchCloudAnalyses } from "@/lib/cloudHistory"
import { pdfEditorApi } from "@/lib/pdfEditorApi"
import type { SessionMeta } from "@/lib/pdfEditorTypes"
import { compareVersionsApi } from "@/lib/compareVersionsApi"
import type { CVSessionListItem } from "@/lib/compareVersionsTypes"
import { builderApi } from "@/lib/builderApi"
import type { BuilderDocumentMeta } from "@/lib/builderTypes"
import { BUILDER_ENABLED, CATEGORY_LABELS } from "@/lib/builderConfig"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TOOL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  analyze:          { label: "Analyze",           icon: FileText,      color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  trust_check:      { label: "Trust Check",        icon: ShieldCheck,   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  redact:           { label: "Redacted",           icon: EyeOff,        color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  signature:        { label: "Signature",          icon: FileSignature, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  contract_review:  { label: "Contract Review",    icon: Scale,         color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  contract_builder: { label: "Build a Contract",   icon: PenLine,       color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  compare:          { label: "Compare Versions",   icon: GitCompare,    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
}

function ToolBadge({ tool }: { tool: string }) {
  const cfg = TOOL_CONFIG[tool]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, count, colorClass }: {
  icon: React.ElementType
  label: string
  count?: number
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-8 first:mt-0">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Documents() {
  const [, navigate] = useLocation()
  const { isSignedIn, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { setAnalysis, setDocumentTypeHint } = useAnalysisContext()

  // UserDocuments state
  const [docs, setDocs] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // PDF Editor sessions state
  const [pdfSessions, setPdfSessions] = useState<SessionMeta[]>([])
  const [pdfLoading, setPdfLoading] = useState(false)
  const [confirmDeletePdfId, setConfirmDeletePdfId] = useState<string | null>(null)
  const [deletingPdf, setDeletingPdf] = useState(false)

  // Compare sessions state
  const [compareSessions, setCompareSessions] = useState<CVSessionListItem[]>([])
  const [compareLoading, setCompareLoading] = useState(false)
  const [confirmDeleteCompareId, setConfirmDeleteCompareId] = useState<string | null>(null)
  const [deletingCompare, setDeletingCompare] = useState(false)

  // Document Builder drafts state
  const [builderDocs, setBuilderDocs] = useState<BuilderDocumentMeta[]>([])
  const [builderLoading, setBuilderLoading] = useState(false)
  const [confirmArchiveBuilderById, setConfirmArchiveBuilderById] = useState<string | null>(null)
  const [archivingBuilder, setArchivingBuilder] = useState(false)

  useEffect(() => {
    document.title = "My Documents — PlainPath"
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { navigate("/sign-in"); return }
    load()
  }, [isLoaded, isSignedIn])

  async function load() {
    setLoading(true)
    setPdfLoading(true)
    setCompareLoading(true)
    if (BUILDER_ENABLED) setBuilderLoading(true)
    setError(null)

    // Fetch Clerk token for session APIs
    const token = await getToken().catch(() => null)

    // Parallel fetch all data sources
    const [docsResult, pdfResult, compareResult, builderResult] = await Promise.allSettled([
      fetchUserDocuments(),
      pdfEditorApi.listSessions(token),
      compareVersionsApi.listSessions(token, { archived: false }),
      BUILDER_ENABLED ? builderApi.listDocuments(token) : Promise.resolve([]),
    ])

    if (docsResult.status === "fulfilled") {
      setDocs(docsResult.value)
    } else {
      setError("Couldn't load your documents. Please try again.")
    }

    if (pdfResult.status === "fulfilled") {
      const sorted = [...pdfResult.value].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      )
      setPdfSessions(sorted)
    }

    if (compareResult.status === "fulfilled") {
      const sorted = [...compareResult.value].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      )
      setCompareSessions(sorted)
    }

    if (BUILDER_ENABLED && builderResult.status === "fulfilled") {
      // Already returned sorted by updatedAt desc from the API
      setBuilderDocs(builderResult.value)
    }

    setLoading(false)
    setPdfLoading(false)
    setCompareLoading(false)
    if (BUILDER_ENABLED) setBuilderLoading(false)
  }

  // ─── UserDocument filtering ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      (d.originalFilename ?? "").toLowerCase().includes(q) ||
      (d.sourceKind ?? "").toLowerCase().includes(q)
    )
  }, [docs, search])

  // ─── UserDocument actions ─────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteUserDocument(id)
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch { /* ignore */ }
    finally {
      setDeleting(false)
      setConfirmDeleteId(null)
    }
  }

  function startEdit(doc: UserDocument) {
    setEditingId(doc.id)
    setEditValue(doc.title)
  }

  async function commitEdit(id: string) {
    const title = editValue.trim()
    if (!title) return
    try {
      await renameUserDocument(id, title)
      setDocs(prev => prev.map(d => d.id === id ? { ...d, title } : d))
    } catch { /* ignore */ }
    setEditingId(null)
  }

  async function openInAnalyze(doc: UserDocument) {
    const analyzeRun = doc.toolRuns.find(r => r.tool === "analyze" && r.outputRef)
    if (analyzeRun?.outputRef) {
      try {
        const all = await fetchCloudAnalyses()
        const saved = all.find(a => a.id === analyzeRun.outputRef)
        if (saved) {
          setAnalysis(saved.analysis)
          setDocumentTypeHint(saved.documentTypeHint ?? null)
          navigate("/results")
          return
        }
      } catch { /* fall through */ }
    }
    try {
      sessionStorage.setItem("pp_doc_open", JSON.stringify({
        id: doc.id,
        title: doc.title,
        extractedText: doc.extractedText ?? null,
      }))
    } catch { /* ignore */ }
    navigate("/analyze")
  }

  function sendForSignature(doc: UserDocument) {
    try {
      sessionStorage.setItem("pp_sig_doc", JSON.stringify({
        id: doc.id,
        title: doc.title,
        extractedText: doc.extractedText ?? null,
        originalFilename: doc.originalFilename ?? null,
        mimeType: doc.mimeType ?? null,
      }))
    } catch { /* ignore */ }
    navigate("/signature")
  }

  // ─── PDF Editor session actions ───────────────────────────────────────────

  async function handleDeletePdf(id: string) {
    setDeletingPdf(true)
    try {
      const token = await getToken().catch(() => null)
      await pdfEditorApi.deleteSession(id, token)
      setPdfSessions(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
    finally {
      setDeletingPdf(false)
      setConfirmDeletePdfId(null)
    }
  }

  // ─── Compare session actions ──────────────────────────────────────────────

  async function handleDeleteCompare(id: string) {
    setDeletingCompare(true)
    try {
      const token = await getToken().catch(() => null)
      await compareVersionsApi.deleteSession(id, token)
      setCompareSessions(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
    finally {
      setDeletingCompare(false)
      setConfirmDeleteCompareId(null)
    }
  }

  // ─── Builder draft archive ────────────────────────────────────────────────

  async function handleArchiveBuilder(id: string) {
    setArchivingBuilder(true)
    try {
      const token = await getToken().catch(() => null)
      await builderApi.archiveDocument(id, token)
      setBuilderDocs(prev => prev.filter(d => d.id !== id))
    } catch { /* ignore */ }
    finally {
      setArchivingBuilder(false)
      setConfirmArchiveBuilderById(null)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const hasAnyContent =
    docs.length > 0 || pdfSessions.length > 0 || compareSessions.length > 0 ||
    (BUILDER_ENABLED && builderDocs.length > 0)

  const totalItemCount =
    docs.length + pdfSessions.length + compareSessions.length +
    (BUILDER_ENABLED ? builderDocs.length : 0)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-primary" />
              My Documents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {hasAnyContent
                ? `${totalItemCount} saved item${totalItemCount !== 1 ? "s" : ""} across all tools`
                : "Your saved documents and sessions across PlainPath tools."}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/analyze")}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Document
          </Button>
        </div>

        {/* Global search — shown when there are documents */}
        {docs.length > 3 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search documents…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading your documents…</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-center gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <Button variant="ghost" size="sm" onClick={load} className="ml-auto">Retry</Button>
          </div>
        )}

        {/* Full empty state — nothing at all */}
        {!loading && !error && !hasAnyContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No saved work yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              When you analyze, edit, or compare documents in PlainPath, they'll appear here so you can pick up right where you left off.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={() => navigate("/analyze")} className="gap-1.5">
                <FileText className="w-4 h-4" /> Analyze a Document
              </Button>
              <Button variant="outline" onClick={() => navigate("/pdf-editor")} className="gap-1.5">
                <FileEdit className="w-4 h-4" /> Open PDF Editor
              </Button>
              <Button variant="outline" onClick={() => navigate("/compare-versions")} className="gap-1.5">
                <GitCompare className="w-4 h-4" /> Compare Versions
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── SECTION: Uploaded Documents ──────────────────────────────────── */}
        {!loading && !error && docs.length > 0 && (
          <>
            <SectionHeader
              icon={FileText}
              label="Uploaded Documents"
              count={docs.length}
              colorClass="bg-primary/10 text-primary"
            />

            {/* No search results */}
            {filtered.length === 0 && search && (
              <p className="text-center py-12 text-sm text-muted-foreground">
                No documents match "<span className="font-medium">{search}</span>"
              </p>
            )}

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {filtered.map(doc => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="group relative rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mt-0.5">
                        <FileText className="w-4.5 h-4.5 text-primary" />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        {editingId === doc.id ? (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Input
                              className="h-7 text-sm font-medium"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") commitEdit(doc.id)
                                if (e.key === "Escape") setEditingId(null)
                              }}
                              autoFocus
                            />
                            <button onClick={() => commitEdit(doc.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md dark:hover:bg-emerald-900/30">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-secondary rounded-md">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-sm text-foreground leading-tight mb-1 truncate pr-16">
                            {doc.title}
                          </h3>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(doc.updatedAt || doc.createdAt)}</span>
                          {doc.originalFilename && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[160px]">{doc.originalFilename}</span>
                            </>
                          )}
                        </div>

                        {/* Tool run badges */}
                        {doc.toolRuns.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {[...new Set(doc.toolRuns.map(r => r.tool))].map(tool => (
                              <ToolBadge key={tool} tool={tool} />
                            ))}
                          </div>
                        )}

                        {/* Action buttons — contextual per toolRuns */}
                        <div className="flex flex-wrap gap-2">
                          {doc.toolRuns.some(r => r.tool === "analyze") ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => openInAnalyze(doc)}
                            >
                              <FileText className="w-3 h-3" />
                              Open Analysis
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => openInAnalyze(doc)}
                            >
                              <FileText className="w-3 h-3" />
                              Analyze
                            </Button>
                          )}
                          {doc.toolRuns.some(r => r.tool === "contract_review") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => navigate("/contract-review")}
                            >
                              <Scale className="w-3 h-3" />
                              View Review
                            </Button>
                          )}
                          {doc.toolRuns.some(r => r.tool === "trust_check") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => navigate("/trust-check")}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              View Trust Check
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-muted-foreground"
                            onClick={() => sendForSignature(doc)}
                          >
                            <FileSignature className="w-3 h-3" />
                            Send for Signature
                          </Button>
                        </div>
                      </div>

                      {/* Card actions (rename / delete) */}
                      <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(doc)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Delete confirm */}
                    <AnimatePresence>
                      {confirmDeleteId === doc.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-destructive/20"
                        >
                          <p className="text-xs text-muted-foreground mb-2">
                            Remove this document from your library? Saved analyses and session history won't be affected.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              disabled={deleting}
                              onClick={() => handleDelete(doc.id)}
                            >
                              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Remove"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ── SECTION: PDF Editor Sessions ─────────────────────────────────── */}
        {!loading && (
          <>
            {(pdfSessions.length > 0 || pdfLoading) && (
              <SectionHeader
                icon={FileEdit}
                label="PDF Editor"
                count={pdfSessions.length}
                colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
              />
            )}

            {pdfLoading && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading PDF sessions…
              </div>
            )}

            {!pdfLoading && pdfSessions.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {pdfSessions.map(session => (
                    <motion.div
                      key={session.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="group relative rounded-xl border border-border/60 bg-card hover:border-purple-300/60 dark:hover:border-purple-700/40 hover:shadow-sm transition-all p-4"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mt-0.5">
                          <FileEdit className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground leading-tight mb-1 truncate pr-12">
                            {session.fileName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(session.updatedAt)}</span>
                            {session.pageCount != null && (
                              <>
                                <span>·</span>
                                <span>{session.pageCount} page{session.pageCount !== 1 ? "s" : ""}</span>
                              </>
                            )}
                            {session.fileSizeBytes > 0 && (
                              <>
                                <span>·</span>
                                <span>{formatBytes(session.fileSizeBytes)}</span>
                              </>
                            )}
                            {session.pdfType && session.pdfType !== "unknown" && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 capitalize">
                                {session.pdfType}
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-none"
                            onClick={() => navigate(`/pdf-editor/${session.id}`)}
                          >
                            <FileEdit className="w-3 h-3" />
                            Continue editing
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Delete action */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfirmDeletePdfId(session.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* PDF delete confirm */}
                      <AnimatePresence>
                        {confirmDeletePdfId === session.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-destructive/20"
                          >
                            <p className="text-xs text-muted-foreground mb-2">
                              Permanently delete this PDF Editor session? The original PDF and all edits will be removed.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                disabled={deletingPdf}
                                onClick={() => handleDeletePdf(session.id)}
                              >
                                {deletingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete permanently"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setConfirmDeletePdfId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* ── SECTION: Compare Versions Sessions ───────────────────────────── */}
        {!loading && (
          <>
            {(compareSessions.length > 0 || compareLoading) && (
              <SectionHeader
                icon={GitCompare}
                label="Compare Versions"
                count={compareSessions.length}
                colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400"
              />
            )}

            {compareLoading && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading compare sessions…
              </div>
            )}

            {!compareLoading && compareSessions.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {compareSessions.map(session => (
                    <motion.div
                      key={session.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="group relative rounded-xl border border-border/60 bg-card hover:border-teal-300/60 dark:hover:border-teal-700/40 hover:shadow-sm transition-all p-4"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mt-0.5">
                          <GitCompare className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground leading-tight mb-0.5 truncate pr-12">
                            {session.title}
                          </h3>
                          {/* File names */}
                          <p className="text-[11px] text-muted-foreground truncate mb-1">
                            {session.originalFileName} → {session.revisedFileName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(session.updatedAt)}</span>
                            {session.diffTotal != null && (
                              <>
                                <span>·</span>
                                <span>
                                  {session.diffTotal} diff{session.diffTotal !== 1 ? "s" : ""}
                                  {session.diffHigh != null && session.diffHigh > 0 && (
                                    <span className="ml-1 text-red-500 font-medium">
                                      ({session.diffHigh} high)
                                    </span>
                                  )}
                                </span>
                              </>
                            )}
                            {session.status === "scanning" && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                Scanning…
                              </span>
                            )}
                            {session.status === "complete" && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                                Complete
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-none"
                            onClick={() => navigate(`/compare-versions/${session.id}`)}
                          >
                            <GitCompare className="w-3 h-3" />
                            Open comparison
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Delete action */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfirmDeleteCompareId(session.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Compare delete confirm */}
                      <AnimatePresence>
                        {confirmDeleteCompareId === session.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-destructive/20"
                          >
                            <p className="text-xs text-muted-foreground mb-2">
                              Permanently delete this Compare session? All diffs, notes, and history will be removed.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                disabled={deletingCompare}
                                onClick={() => handleDeleteCompare(session.id)}
                              >
                                {deletingCompare ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete permanently"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setConfirmDeleteCompareId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* ── SECTION: Document Builder Drafts ─────────────────────────────── */}
        {BUILDER_ENABLED && !loading && (
          <>
            {(builderDocs.length > 0 || builderLoading) && (
              <SectionHeader
                icon={LayoutTemplate}
                label="Document Builder"
                count={builderDocs.length}
                colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
              />
            )}

            {builderLoading && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading builder drafts…
              </div>
            )}

            {!builderLoading && builderDocs.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {builderDocs.map(draft => (
                    <motion.div
                      key={draft.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="group relative rounded-xl border border-border/60 bg-card hover:border-indigo-300/60 dark:hover:border-indigo-700/40 hover:shadow-sm transition-all p-4"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mt-0.5">
                          <LayoutTemplate className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-foreground leading-tight truncate pr-10">
                              {draft.title || "Untitled document"}
                            </h3>
                            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-secondary text-muted-foreground border border-border/60">
                              Draft
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(draft.updatedAt)}</span>
                            {draft.category && (
                              <>
                                <span>·</span>
                                <span>{CATEGORY_LABELS[draft.category] ?? draft.category}</span>
                              </>
                            )}
                            {draft.sectionCount > 0 && (
                              <>
                                <span>·</span>
                                <span>{draft.sectionCount} section{draft.sectionCount !== 1 ? "s" : ""}</span>
                              </>
                            )}
                            {draft.blockCount > 0 && (
                              <>
                                <span>·</span>
                                <span>{draft.blockCount} block{draft.blockCount !== 1 ? "s" : ""}</span>
                              </>
                            )}
                          </div>

                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-none"
                            onClick={() => navigate(`/builder/${draft.id}`)}
                          >
                            <LayoutTemplate className="w-3 h-3" />
                            Continue building
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Archive action */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfirmArchiveBuilderById(draft.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Archive draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Archive confirm */}
                      <AnimatePresence>
                        {confirmArchiveBuilderById === draft.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-destructive/20"
                          >
                            <p className="text-xs text-muted-foreground mb-2">
                              Archive this draft? It will be removed from your active list. You can still start a new document from the Builder.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                disabled={archivingBuilder}
                                onClick={() => handleArchiveBuilder(draft.id)}
                              >
                                {archivingBuilder ? <Loader2 className="w-3 h-3 animate-spin" /> : "Archive"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setConfirmArchiveBuilderById(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="flex justify-end">
                  <button
                    onClick={() => navigate("/builder/new")}
                    className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 transition-colors font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    Start a new document
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        {!loading && !error && hasAnyContent && (
          <div className="mt-10 pt-6 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Documents are saved automatically when you work with them.
            </p>
            <button
              onClick={() => navigate("/builder")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-500 transition-colors" />
              Open Document Builder
              <ExternalLink className="w-3 h-3 opacity-40" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
