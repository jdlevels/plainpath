import React, { useState, useEffect, useMemo } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText, Trash2, Pencil, Check, X, Search, Loader2,
  FolderOpen, FileSignature, ShieldCheck, EyeOff, Scale,
  PenLine, GitCompare, ChevronRight, Plus, Clock,
  AlertTriangle,
} from "lucide-react"
import {
  fetchUserDocuments, deleteUserDocument, renameUserDocument,
  type UserDocument,
} from "@/lib/userDocsApi"
import { useUser } from "@clerk/react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { fetchCloudAnalyses } from "@/lib/cloudHistory"

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

const TOOL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  analyze:          { label: "Analyzed",         icon: FileText,      color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  trust_check:      { label: "Trust Check",       icon: ShieldCheck,   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  redact:           { label: "Redacted",          icon: EyeOff,        color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  signature:        { label: "Sent for Sig.",     icon: FileSignature, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  contract_review:  { label: "Reviewed",          icon: Scale,         color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  contract_builder: { label: "From Builder",      icon: PenLine,       color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  compare:          { label: "Compared",          icon: GitCompare,    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Documents() {
  const [, navigate] = useLocation()
  const { isSignedIn, isLoaded } = useUser()
  const { setAnalysis, setDocumentTypeHint } = useAnalysisContext()

  const [docs, setDocs] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    setError(null)
    try {
      const data = await fetchUserDocuments()
      setDocs(data)
    } catch {
      setError("Couldn't load your documents. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      (d.originalFilename ?? "").toLowerCase().includes(q) ||
      (d.sourceKind ?? "").toLowerCase().includes(q)
    )
  }, [docs, search])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteUserDocument(id)
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch {
      // ignore
    } finally {
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

  // ─── Open in Analyze ────────────────────────────────────────────────────────
  // We load the most-recent linked analysis run and restore it in context
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
    // No saved analysis — navigate to Analyze with doc title pre-set
    try {
      sessionStorage.setItem("pp_doc_open", JSON.stringify({
        id: doc.id,
        title: doc.title,
        extractedText: doc.extractedText ?? null,
      }))
    } catch { /* ignore */ }
    navigate("/analyze")
  }

  // ─── Send for Signature ─────────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────────────────

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
              Documents you've worked with across PlainPath tools.
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

        {/* Search */}
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

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading your documents…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <Button variant="ghost" size="sm" onClick={load} className="ml-auto">Retry</Button>
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No documents yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              When you analyze or work with a document in PlainPath, it'll appear here so you can reuse it across tools without re-uploading.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={() => navigate("/analyze")} className="gap-1.5">
                <FileText className="w-4 h-4" /> Analyze a Document
              </Button>
              <Button variant="outline" onClick={() => navigate("/signature")} className="gap-1.5">
                <FileSignature className="w-4 h-4" /> Send for Signature
              </Button>
            </div>
          </motion.div>
        )}

        {!loading && !error && filtered.length === 0 && docs.length > 0 && (
          <p className="text-center py-12 text-sm text-muted-foreground">
            No documents match "<span className="font-medium">{search}</span>"
          </p>
        )}

        {/* Document List */}
        {!loading && !error && filtered.length > 0 && (
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
                        <span>{formatDate(doc.createdAt)}</span>
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

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => openInAnalyze(doc)}
                        >
                          <FileText className="w-3 h-3" />
                          {doc.toolRuns.some(r => r.tool === "analyze") ? "View Analysis" : "Analyze"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => sendForSignature(doc)}
                        >
                          <FileSignature className="w-3 h-3" />
                          Send for Signature
                        </Button>
                      </div>
                    </div>

                    {/* Card actions (edit/delete) */}
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
                          Remove this document from your library? This won't affect any signature requests or saved analyses.
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
        )}

        {/* Footer hint */}
        {!loading && !error && docs.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            Documents are saved automatically when you work with them across PlainPath tools.{" "}
            <button
              onClick={() => navigate("/builder")}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Looking for Builder documents?
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
