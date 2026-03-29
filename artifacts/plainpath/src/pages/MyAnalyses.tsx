import React, { useState, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  BookMarked, ArrowRight, Trash2, Pencil, Check, X,
  FileText, Clock, HardDrive, AlertTriangle, Folders
} from "lucide-react"
import {
  getAll, deleteAnalysis, renameAnalysis,
  estimateSizeKb, type SavedAnalysis,
} from "@/lib/savedAnalyses"
import { useAnalysisContext } from "@/context/AnalysisContext"

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
  const { setAnalysis, setDocumentTypeHint } = useAnalysisContext()
  const [items, setItems] = useState<SavedAnalysis[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = "My Analyses — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    setItems(getAll())
  }, [])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleOpen = (saved: SavedAnalysis) => {
    setAnalysis(saved.analysis)
    setDocumentTypeHint(saved.documentTypeHint)
    setLocation("/analyze")
  }

  const startRename = (saved: SavedAnalysis) => {
    setEditingId(saved.id)
    setEditValue(saved.title)
    setConfirmDeleteId(null)
  }

  const commitRename = (id: string) => {
    const trimmed = editValue.trim()
    if (trimmed) {
      renameAnalysis(id, trimmed)
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, title: trimmed, savedAt: new Date().toISOString() } : a))
      )
    }
    setEditingId(null)
  }

  const cancelRename = () => setEditingId(null)

  const handleDelete = (id: string) => {
    deleteAnalysis(id)
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
            onClick={() => setLocation("/import")}
            style={{ touchAction: "manipulation" }}
          >
            <span className="hidden sm:inline">Analyze a document</span>
            <span className="sm:hidden">New</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* ── Privacy notice ── */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border/50 mb-6 text-xs text-muted-foreground">
          <HardDrive className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
          <span>
            Analyses are saved on <strong className="text-foreground font-semibold">this device only</strong> using your browser's local storage.
            Nothing is uploaded to or stored by PlainPath.
            {sizeKb > 0 && <span className="ml-1 opacity-60">({sizeKb} KB used)</span>}
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

        {/* ── Saved analyses list ── */}
        {items.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((saved) => (
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
