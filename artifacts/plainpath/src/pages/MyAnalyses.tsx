import React, { useState, useEffect, useRef, useMemo } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BookMarked, ArrowRight, Trash2, Pencil, Check, X,
  FileText, Clock, HardDrive, AlertTriangle, Folders, CreditCard,
  Search, SortAsc, SortDesc, ArrowUpDown, ShieldCheck, Loader2,
} from "lucide-react"
import {
  getAll, deleteAnalysis, renameAnalysis,
  estimateSizeKb, type SavedAnalysis,
} from "@/lib/savedAnalyses"
import {
  getAllTrustChecks, deleteTrustCheck, type SavedTrustCheck,
} from "@/lib/savedTrustChecks"
import {
  fetchCloudAnalyses, deleteCloudAnalysis, renameCloudAnalysis,
  fetchCloudTrustChecks, deleteCloudTrustCheck,
} from "@/lib/cloudHistory"
import { useUser } from "@clerk/react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { useEntitlements } from "@/hooks/useEntitlements"
import PlanStatusBanner from "@/components/PlanStatusBanner"
import SubscriptionRestoreCard from "@/components/SubscriptionRestoreCard"

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined })
}

function sourceLabel(kind: SavedAnalysis["sourceKind"]): string {
  return kind === "demo" ? "Demo" : "Your document"
}

export default function MyAnalyses() {
  const [, setLocation] = useLocation()
  const { setAnalysis, setDocumentTypeHint, setTrustCheckAnalysis } = useAnalysisContext()
  const { entitlements, reload: reloadEntitlements } = useEntitlements()
  const { isSignedIn, isLoaded: authLoaded } = useUser()
  const [items, setItems] = useState<SavedAnalysis[]>([])
  const [cloudLoading, setCloudLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showSubscription, setShowSubscription] = useState(false)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az">("newest")
  const [trustChecks, setTrustChecks] = useState<SavedTrustCheck[]>([])
  const [showTrustChecks, setShowTrustChecks] = useState(false)
  const [confirmDeleteTrustCheckId, setConfirmDeleteTrustCheckId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    let result = [...items]
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        (a.analysis.documentType ?? "").toLowerCase().includes(q) ||
        (a.documentTypeHint ?? "").toLowerCase().includes(q) ||
        (a.analysis.overview ?? "").toLowerCase().includes(q)
      )
    }
    if (sortBy === "newest") result.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    if (sortBy === "oldest") result.sort((a, b) => a.savedAt.localeCompare(b.savedAt))
    if (sortBy === "az") result.sort((a, b) => a.title.localeCompare(b.title))
    return result
  }, [items, search, sortBy])

  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = "My Analyses — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    if (!authLoaded) return
    if (isSignedIn) {
      setCloudLoading(true)
      Promise.all([fetchCloudAnalyses(), fetchCloudTrustChecks()])
        .then(([analyses, checks]) => {
          setItems(analyses)
          setTrustChecks(checks)
        })
        .catch(() => {
          setItems(getAll())
          setTrustChecks(getAllTrustChecks())
        })
        .finally(() => setCloudLoading(false))
    } else {
      setItems(getAll())
      setTrustChecks(getAllTrustChecks())
    }
  }, [isSignedIn, authLoaded])

  const handleOpenTrustCheck = (tc: SavedTrustCheck) => {
    setTrustCheckAnalysis(tc.analysis)
    setLocation("/trust-check")
  }

  const handleDeleteTrustCheck = (id: string) => {
    if (isSignedIn) {
      deleteCloudTrustCheck(id).catch(() => {})
    } else {
      deleteTrustCheck(id)
    }
    setTrustChecks(prev => prev.filter(tc => tc.id !== id))
    setConfirmDeleteTrustCheckId(null)
  }

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleOpen = (saved: SavedAnalysis) => {
    setAnalysis(saved.analysis)
    setDocumentTypeHint(saved.documentTypeHint)
    setLocation("/results")
  }

  const startRename = (saved: SavedAnalysis) => {
    setEditingId(saved.id)
    setEditValue(saved.title)
    setConfirmDeleteId(null)
  }

  const commitRename = (id: string) => {
    const trimmed = editValue.trim()
    if (trimmed) {
      if (isSignedIn) {
        renameCloudAnalysis(id, trimmed).catch(() => {})
      } else {
        renameAnalysis(id, trimmed)
      }
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, title: trimmed, savedAt: new Date().toISOString() } : a))
      )
    }
    setEditingId(null)
  }

  const cancelRename = () => setEditingId(null)

  const handleDelete = (id: string) => {
    if (isSignedIn) {
      deleteCloudAnalysis(id).catch(() => {})
    } else {
      deleteAnalysis(id)
    }
    setItems((prev) => prev.filter((a) => a.id !== id))
    setConfirmDeleteId(null)
  }

  const sizeKb = estimateSizeKb()

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="bg-primary/10 p-2 rounded-xl">
                <BookMarked className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">My Analyses</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "Save an analysis to review it anytime — without reprocessing."
                : `${items.length} saved ${items.length === 1 ? "analysis" : "analyses"}`}
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 rounded-xl gap-1.5 shadow-sm"
            onClick={() => setLocation("/analyze")}
            style={{ touchAction: "manipulation" }}
          >
            <span className="hidden sm:inline">Analyze a document</span>
            <span className="sm:hidden">New</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* ── Cloud sync banner for signed-out users with local data ── */}
        {authLoaded && !isSignedIn && items.length > 0 && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Folders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Your history is saved on this device only</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Sign in to sync your analyses across all your devices.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
              onClick={() => setLocation("/sign-in")}
            >
              Sign in
            </Button>
          </div>
        )}

        {/* ── Cloud loading state ── */}
        {cloudLoading && (
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your history…
          </div>
        )}

        {/* ── Subscription section ── */}
        <div className="mb-6">
          <button
            onClick={() => setShowSubscription(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3 w-full text-left"
            style={{ touchAction: "manipulation" }}
          >
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <span>Subscription</span>
            {entitlements && (
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                {entitlements.plan}
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground/50">{showSubscription ? "Hide" : "Show"}</span>
          </button>
          {showSubscription && (
            <div className="space-y-3">
              <PlanStatusBanner entitlements={entitlements} />
              <SubscriptionRestoreCard onLoaded={() => void reloadEntitlements()} />
            </div>
          )}
        </div>

        {/* ── Trust Checks section ── */}
        <div className="mb-6">
          <button
            onClick={() => setShowTrustChecks(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3 w-full text-left"
            style={{ touchAction: "manipulation" }}
          >
            <div className="bg-red-500/10 p-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-red-500" />
            </div>
            <span>Saved Trust Checks</span>
            {trustChecks.length > 0 && (
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500">
                {trustChecks.length}
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground/50">{showTrustChecks ? "Hide" : "Show"}</span>
          </button>
          {showTrustChecks && (
            <div className="space-y-3">
              {trustChecks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 bg-card border border-border/50 rounded-2xl">
                  No saved trust checks yet. Run a Document Trust Check and tap the bookmark icon to save it.
                </p>
              ) : (
                trustChecks.map((tc) => (
                  <div key={tc.id} className="bg-card border border-red-200/50 dark:border-red-900/40 rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5 bg-red-500/10 rounded-xl p-2">
                        <ShieldCheck className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5 truncate pr-2">
                          {tc.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDate(tc.savedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="h-8 text-xs rounded-lg gap-1.5 shadow-none bg-red-600 hover:bg-red-700 text-white border-0"
                            onClick={() => handleOpenTrustCheck(tc)}
                            style={{ touchAction: "manipulation" }}
                          >
                            Open <ArrowRight className="w-3 h-3" />
                          </Button>
                          {confirmDeleteTrustCheckId === tc.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-destructive font-medium">Delete?</span>
                              <button
                                onClick={() => handleDeleteTrustCheck(tc.id)}
                                className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                                style={{ touchAction: "manipulation" }}
                              >
                                Yes, delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteTrustCheckId(null)}
                                className="h-8 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                                style={{ touchAction: "manipulation" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteTrustCheckId(tc.id)}
                              className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                              title="Delete"
                              style={{ touchAction: "manipulation" }}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Privacy notice ── */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border/50 mb-6 text-xs text-muted-foreground">
          <HardDrive className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
          <span>
            {isSignedIn
              ? <>Analyses are <strong className="text-foreground font-semibold">synced to your account</strong> and accessible on all your devices.</>
              : <>Analyses are saved on <strong className="text-foreground font-semibold">this device only</strong>. Sign in to sync across devices.{sizeKb > 0 && <span className="ml-1 opacity-60">({sizeKb} KB used)</span>}</>
            }
          </span>
        </div>

        {/* ── Empty state ── */}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="bg-card border border-border/50 rounded-2xl p-8 max-w-sm shadow-sm">
              <div className="bg-secondary rounded-xl p-4 w-fit mx-auto mb-5">
                <Folders className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Nothing saved yet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Analyze a document, then tap <strong>Save</strong> on the results page to keep it here for later.
              </p>
              <Button className="w-full rounded-xl gap-1.5" onClick={() => setLocation("/import")}>
                Analyze a document <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Search & Sort ── */}
        {items.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search analyses…"
                className="pl-8 h-9 text-sm rounded-xl bg-card border-border/60"
              />
            </div>
            <div className="flex gap-1 shrink-0">
              {([
                { key: "newest", icon: <SortDesc className="w-3.5 h-3.5" />, label: "Newest" },
                { key: "oldest", icon: <SortAsc className="w-3.5 h-3.5" />, label: "Oldest" },
                { key: "az", icon: <ArrowUpDown className="w-3.5 h-3.5" />, label: "A–Z" },
              ] as const).map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  title={label}
                  className={`h-9 px-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    sortBy === key
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border bg-card"
                  }`}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── No search results ── */}
        {items.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No analyses match "{search}"</p>
            <button onClick={() => setSearch("")} className="text-xs text-primary mt-1 hover:underline">Clear search</button>
          </div>
        )}

        {/* ── Saved analyses list ── */}
        {items.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredItems.map((saved) => (
                <motion.div
                  key={saved.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5 bg-primary/8 rounded-xl p-2">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      {editingId === saved.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(saved.id)
                              if (e.key === "Escape") cancelRename()
                            }}
                            onBlur={() => commitRename(saved.id)}
                            className="flex-1 text-sm font-semibold bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <button
                            onClick={() => commitRename(saved.id)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelRename}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-border transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5 truncate pr-2">
                          {saved.title}
                        </h3>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/40">
                          {saved.analysis.documentType}
                        </span>
                        {saved.documentTypeHint && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/8 text-primary/70 border border-primary/15">
                            {saved.documentTypeHint}
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground/70 border border-border/40">
                          {sourceLabel(saved.sourceKind)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(saved.savedAt)}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground mb-3.5">
                        <span>{saved.analysis.actionSteps.length} steps</span>
                        <span>{saved.analysis.requiredDocuments.length} docs</span>
                        <span>{saved.analysis.deadlines.length} deadlines</span>
                        {(saved.analysis.keyTerms?.length ?? 0) > 0 && (
                          <span>{saved.analysis.keyTerms!.length} key terms</span>
                        )}
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          className="h-8 text-xs rounded-lg gap-1.5 shadow-none"
                          onClick={() => handleOpen(saved)}
                          style={{ touchAction: "manipulation" }}
                        >
                          Open analysis
                          <ArrowRight className="w-3 h-3" />
                        </Button>

                        {editingId !== saved.id && (
                          <button
                            onClick={() => startRename(saved)}
                            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Rename"
                            style={{ touchAction: "manipulation" }}
                          >
                            <Pencil className="w-3 h-3" />
                            <span className="hidden sm:inline">Rename</span>
                          </button>
                        )}

                        {confirmDeleteId === saved.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-destructive font-medium">Delete?</span>
                            <button
                              onClick={() => handleDelete(saved.id)}
                              className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                              style={{ touchAction: "manipulation" }}
                            >
                              Yes, delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-8 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                              style={{ touchAction: "manipulation" }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(saved.id)}
                            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                            title="Delete"
                            style={{ touchAction: "manipulation" }}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Footer storage notice */}
            <div className="flex items-center justify-center gap-1.5 pt-4 pb-2 text-xs text-muted-foreground/40">
              <AlertTriangle className="w-3 h-3" />
              <span>Saved analyses are stored only in this browser. Clearing browser data will remove them.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
