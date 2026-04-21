import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  ArrowRight, ShieldCheck, FileSignature,
  PenLine, FileScan, Scale, EyeOff,
  BookMarked, Clock, ChevronRight, CreditCard,
  LayoutGrid, GitCompare, FileEdit, LayoutTemplate,
} from "lucide-react"
import { BUILDER_ENABLED, CATEGORY_LABELS } from "@/lib/builderConfig"
import { useState, useEffect, type ElementType } from "react"
import { useUser, useAuth } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useEntitlements } from "@/hooks/useEntitlements"
import { getAll as getLocalAnalyses } from "@/lib/savedAnalyses"
import { fetchCloudAnalyses } from "@/lib/cloudHistory"
import type { SavedAnalysis } from "@/lib/savedAnalyses"
import { listSignatureRequests, STATUS_LABELS, STATUS_COLORS, type SignatureListItem } from "@/lib/signatureApi"
import type { SignatureStatus } from "@/lib/signatureApi"
import { getRecentWork, type LocalRecentItem } from "@/lib/recentWork"
import { pdfEditorApi } from "@/lib/pdfEditorApi"
import type { SessionMeta } from "@/lib/pdfEditorTypes"
import { compareVersionsApi } from "@/lib/compareVersionsApi"
import type { CVSessionListItem } from "@/lib/compareVersionsTypes"
import { builderApi } from "@/lib/builderApi"
import type { BuilderDocumentMeta } from "@/lib/builderTypes"

type RecentItem =
  | { kind: "analysis";      id: string; title: string; savedAt: string }
  | { kind: "signature";     id: string; title: string; savedAt: string; status: SignatureStatus; signerName: string }
  | { kind: "local";         id: string; title: string; savedAt: string; tool: LocalRecentItem["tool"] }
  | { kind: "pdf-editor";    id: string; title: string; savedAt: string; pageCount?: number; pdfType?: string }
  | { kind: "compare";       id: string; title: string; savedAt: string; status: string; diffTotal?: number; diffHigh?: number; originalFileName?: string; revisedFileName?: string }
  | { kind: "builder";       id: string; title: string; savedAt: string; category?: string; sectionCount?: number }

// ─── Tool definitions ─────────────────────────────────────────────────────────

// First-class 8 tools — canonical order and routes
const TOOLS = [
  {
    key: "analyze" as const,
    label: "Analyze a Document",
    desc: "Understand any paperwork in plain English — deadlines, action steps, risks.",
    icon: FileScan,
    path: "/analyze",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    ring: "hover:border-blue-400/50 hover:shadow-blue-500/10",
    plan: null,
  },
  {
    key: "trust-check" as const,
    label: "Document Trust Check",
    desc: "Detect scams, forgeries, and high-risk patterns before you act.",
    icon: ShieldCheck,
    path: "/import?mode=trust-check",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    ring: "hover:border-red-400/50 hover:shadow-red-500/10",
    plan: "pro" as const,
  },
  {
    key: "build-contract" as const,
    label: "Build a Contract",
    desc: "Answer a few questions and get a complete, ready-to-sign contract.",
    icon: PenLine,
    path: "/build-contract",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    ring: "hover:border-emerald-400/50 hover:shadow-emerald-500/10",
    plan: "pro" as const,
  },
  {
    key: "contract-review" as const,
    label: "Contract Review",
    desc: "Clause-by-clause review of any agreement before you sign.",
    icon: Scale,
    path: "/contract-review",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    ring: "hover:border-amber-400/50 hover:shadow-amber-500/10",
    plan: "pro" as const,
  },
  {
    key: "redact" as const,
    label: "Redact Sensitive Info",
    desc: "Remove personal and private data before sharing any document.",
    icon: EyeOff,
    path: "/redact",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    ring: "hover:border-violet-400/50 hover:shadow-violet-500/10",
    plan: null,
  },
  {
    key: "signature" as const,
    label: "Digital Signature",
    desc: "Send legally binding e-signature requests and track signing status.",
    icon: FileSignature,
    path: "/signature",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    ring: "hover:border-violet-400/50 hover:shadow-violet-500/10",
    plan: "pro" as const,
  },
  {
    key: "pdf-editor" as const,
    label: "PDF Editor",
    desc: "Open any PDF, add text overlays, mask content, reorder pages, and export a clean modified copy.",
    icon: FileEdit,
    path: "/pdf-editor",
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    ring: "hover:border-purple-400/50 hover:shadow-purple-500/10",
    plan: "pro" as const,
  },
  {
    key: "compare-versions" as const,
    label: "Compare Versions",
    desc: "Spot every change between two versions of a document — additions, deletions, and risk shifts.",
    icon: GitCompare,
    path: "/compare-versions",
    color: "text-teal-500 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/50",
    ring: "hover:border-teal-400/50 hover:shadow-teal-500/10",
    plan: "pro" as const,
  },
]

// ─── Demo scenarios ───────────────────────────────────────────────────────────

const DEMOS = [
  {
    id: "event-permit",
    tool: "Analyze",
    title: "Small Business Event Permit",
    icon: FileScan,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    path: "/analyze?demo=event-permit",
  },
  {
    id: "trust-check-irs",
    tool: "Trust Check",
    title: "Fake IRS Collection Letter",
    icon: ShieldCheck,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    path: "/import?mode=trust-check",
  },
  {
    id: "contract-builder-freelance",
    tool: "Build a Contract",
    title: "Freelance Services Agreement",
    icon: PenLine,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    path: "/build-contract",
  },
  {
    id: "contract-review-employment",
    tool: "Contract Review",
    title: "Employment Offer — One-Sided",
    icon: Scale,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    path: "/contract-review",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation()
  const { user } = useUser()
  const { getToken } = useAuth()
  const { entitlements, isAdmin } = useEntitlements()
  const [recentWork, setRecentWork] = useState<RecentItem[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  const firstName = user?.firstName ?? null
  const plan = entitlements?.plan ?? null
  const toolAccess = entitlements?.toolAccess ?? []

  // Load recent work — analyses + signatures + PDF Editor sessions + Compare sessions + local, merged by date
  useEffect(() => {
    let cancelled = false
    async function load() {
      setRecentLoading(true)
      try {
        // Need Bearer token for session APIs
        const token = await getToken().catch(() => null)

        const [cloudAnalyses, cloudSigs, pdfSessions, compareSessions, builderDocs] = await Promise.allSettled([
          fetchCloudAnalyses(),
          listSignatureRequests(),
          pdfEditorApi.listSessions(token),
          compareVersionsApi.listSessions(token, { archived: false }),
          BUILDER_ENABLED ? builderApi.listDocuments(token) : Promise.resolve([]),
        ])

        const analyses: RecentItem[] =
          cloudAnalyses.status === "fulfilled"
            ? cloudAnalyses.value.map((a: SavedAnalysis) => ({
                kind: "analysis" as const,
                id: a.id,
                title: a.title,
                savedAt: a.savedAt,
              }))
            : getLocalAnalyses().map((a: SavedAnalysis) => ({
                kind: "analysis" as const,
                id: a.id,
                title: a.title,
                savedAt: a.savedAt,
              }))

        const sigs: RecentItem[] =
          cloudSigs.status === "fulfilled"
            ? cloudSigs.value.map((s: SignatureListItem) => ({
                kind: "signature" as const,
                id: s.id,
                title: s.documentName,
                savedAt: s.createdAt,
                status: s.status,
                signerName: s.signerName,
              }))
            : []

        const pdfs: RecentItem[] =
          pdfSessions.status === "fulfilled"
            ? pdfSessions.value.map((s: SessionMeta) => ({
                kind: "pdf-editor" as const,
                id: s.id,
                title: s.fileName,
                savedAt: s.updatedAt,
                pageCount: s.pageCount ?? undefined,
                pdfType: s.pdfType !== "unknown" ? s.pdfType : undefined,
              }))
            : []

        const compares: RecentItem[] =
          compareSessions.status === "fulfilled"
            ? compareSessions.value.map((s: CVSessionListItem) => ({
                kind: "compare" as const,
                id: s.id,
                title: s.title,
                savedAt: s.updatedAt,
                status: s.status,
                diffTotal: s.diffTotal ?? undefined,
                diffHigh: s.diffHigh ?? undefined,
                originalFileName: s.originalFileName,
                revisedFileName: s.revisedFileName,
              }))
            : []

        const builders: RecentItem[] =
          BUILDER_ENABLED && builderDocs.status === "fulfilled"
            ? (builderDocs.value as BuilderDocumentMeta[]).map((d) => ({
                kind: "builder" as const,
                id: d.id,
                title: d.title || "Untitled document",
                savedAt: d.updatedAt,
                category: d.category,
                sectionCount: d.sectionCount,
              }))
            : []

        // Local items — keep "redact" and "contract-builder" (ContractBuilder AI wizard at /build-contract)
        // Skip local "compare" items when real Compare sessions exist (superseded)
        const hasRealCompareSessions = compares.length > 0
        const localWork: RecentItem[] = getRecentWork()
          .filter(lw => !(hasRealCompareSessions && lw.tool === "compare"))
          .map((lw) => ({
            kind: "local" as const,
            id: lw.id,
            title: lw.title,
            savedAt: lw.savedAt,
            tool: lw.tool,
          }))

        const merged = [...pdfs, ...compares, ...builders, ...analyses, ...sigs, ...localWork]
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
          .slice(0, 6)

        if (!cancelled) setRecentWork(merged)
      } catch {
        const local = getLocalAnalyses().slice(0, 4).map((a: SavedAnalysis) => ({
          kind: "analysis" as const,
          id: a.id,
          title: a.title,
          savedAt: a.savedAt,
        }))
        if (!cancelled) setRecentWork(local)
      } finally {
        if (!cancelled) setRecentLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  function canAccessTool(toolKey: string): boolean {
    if (isAdmin) return true
    return toolAccess.includes(toolKey as never)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* subtle gradient bg */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/4 blur-3xl -translate-x-1/4 translate-y-1/4" />
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ══════════════════════════════════════════════
            SECTION 1 — COMPACT HERO
        ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
              {firstName ? `Welcome back, ${firstName}.` : "Your document dashboard."}
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
              Choose a tool below to get started, or pick up where you left off.
            </p>
          </div>

          {/* Plan badge */}
          {(plan || isAdmin) && (
            <button
              onClick={() => setLocation("/billing")}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card hover:bg-secondary transition-colors text-xs font-semibold text-muted-foreground"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-amber-400" : plan === "pro" ? "bg-emerald-400" : "bg-blue-400"}`} />
              {isAdmin ? "Admin — All tools" : plan === "pro" ? "Pro Plan" : plan === "starter" ? "Starter Plan" : "Free"}
              <CreditCard className="w-3.5 h-3.5 ml-0.5 opacity-60" />
            </button>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════
            SECTION 2 — TOOL LAUNCHER GRID
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Tools</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool, i) => {
              const accessible = canAccessTool(tool.key)
              const locked = !accessible && !!entitlements

              return (
                <motion.div
                  key={tool.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card
                    className={`group h-full border border-border/60 bg-card rounded-2xl shadow-sm transition-all duration-200 overflow-hidden ${
                      accessible
                        ? `cursor-pointer hover:shadow-lg ${tool.ring}`
                        : "opacity-60 cursor-default"
                    }`}
                    onClick={() => accessible && setLocation(tool.path)}
                  >
                    <div className="p-5 flex flex-col h-full gap-3">
                      <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center`}>
                          <tool.icon className={`w-5 h-5 ${tool.color}`} />
                        </div>
                        {tool.plan === "pro" && !accessible && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 border border-border/50 rounded-full px-2 py-0.5">
                            Pro
                          </span>
                        )}
                        {accessible && (
                          <ArrowRight className={`w-4 h-4 ${tool.color} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm mb-1">{tool.label}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                      </div>

                      {locked && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLocation("/upgrade") }}
                          className="text-xs font-semibold text-primary hover:underline text-left"
                        >
                          Upgrade to unlock →
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Document Builder — separate utility workspace (not a first-class analysis tool) */}
          {BUILDER_ENABLED && (
            <div className="mt-6 pt-5 border-t border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workspace</span>
              </div>
              <Card
                className="group border border-border/50 bg-card rounded-2xl cursor-pointer hover:border-indigo-400/50 hover:shadow-md hover:shadow-indigo-500/10 transition-all"
                onClick={() => setLocation("/builder")}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                    <LayoutTemplate className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">Document Builder</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Create structured documents from scratch or a template, then route them into any PlainPath tool.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </div>
              </Card>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 3 — RECENT WORK
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent Work</h2>
            </div>
            {recentWork.length > 0 && (
              <button
                onClick={() => setLocation("/documents")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : recentWork.length === 0 ? (
            <Card className="border border-dashed border-border/40 bg-card/60 rounded-2xl">
              <div className="p-8 text-center">
                <BookMarked className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">No saved work yet</p>
                <p className="text-xs text-muted-foreground/60 mb-4 max-w-xs mx-auto">
                  Your saved work will appear here once you run your first tool — analyze a document, edit a PDF, or compare two versions.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => setLocation("/analyze")} className="rounded-xl text-xs">
                    <FileScan className="w-3 h-3 mr-1" /> Analyze a Document
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLocation("/pdf-editor")} className="rounded-xl text-xs">
                    <FileEdit className="w-3 h-3 mr-1" /> PDF Editor
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLocation("/compare-versions")} className="rounded-xl text-xs">
                    <GitCompare className="w-3 h-3 mr-1" /> Compare Versions
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentWork.map((item, i) => (
                <motion.div
                  key={`${item.kind}-${item.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {item.kind === "pdf-editor" ? (
                    <Card
                      className="group border border-border/50 bg-card hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 rounded-2xl cursor-pointer transition-all"
                      onClick={() => setLocation(`/pdf-editor/${item.id}`)}
                    >
                      <div className="p-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <FileEdit className="w-3 h-3 text-purple-500 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500/80">PDF Editor</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(item.savedAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[11px] text-muted-foreground">
                            {item.pageCount != null ? `${item.pageCount} page${item.pageCount !== 1 ? "s" : ""}` : "PDF"}
                            {item.pdfType ? ` · ${item.pdfType}` : ""}
                          </p>
                          <span className="text-[11px] font-semibold text-purple-500 group-hover:underline">Continue editing →</span>
                        </div>
                      </div>
                    </Card>
                  ) : item.kind === "compare" ? (
                    <Card
                      className="group border border-border/50 bg-card hover:border-teal-400/40 hover:shadow-md hover:shadow-teal-500/5 rounded-2xl cursor-pointer transition-all"
                      onClick={() => setLocation(`/compare-versions/${item.id}`)}
                    >
                      <div className="p-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <GitCompare className="w-3 h-3 text-teal-500 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-500/80">Compare Versions</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(item.savedAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[11px] text-muted-foreground">
                            {item.diffTotal != null ? (
                              <>
                                {item.diffTotal} diff{item.diffTotal !== 1 ? "s" : ""}
                                {item.diffHigh != null && item.diffHigh > 0 && (
                                  <span className="text-red-500 font-medium"> · {item.diffHigh} high</span>
                                )}
                              </>
                            ) : item.status === "scanning" ? "Scanning…" : "Complete"}
                          </p>
                          <span className="text-[11px] font-semibold text-teal-600 group-hover:underline">Open comparison →</span>
                        </div>
                      </div>
                    </Card>
                  ) : item.kind === "builder" ? (
                    <Card
                      className="group border border-border/50 bg-card hover:border-indigo-400/40 hover:shadow-md hover:shadow-indigo-500/5 rounded-2xl cursor-pointer transition-all"
                      onClick={() => setLocation(`/builder/${item.id}`)}
                    >
                      <div className="p-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <LayoutTemplate className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80">Document Builder</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(item.savedAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[11px] text-muted-foreground">
                            {item.category ? CATEGORY_LABELS[item.category] ?? item.category : "Draft"}
                            {item.sectionCount != null && item.sectionCount > 0 && (
                              <> · {item.sectionCount} section{item.sectionCount !== 1 ? "s" : ""}</>
                            )}
                          </p>
                          <span className="text-[11px] font-semibold text-indigo-500 group-hover:underline">Continue building →</span>
                        </div>
                      </div>
                    </Card>
                  ) : item.kind === "analysis" ? (
                    <Card
                      className="group border border-border/50 bg-card hover:border-blue-400/30 hover:shadow-md rounded-2xl cursor-pointer transition-all"
                      onClick={() => setLocation("/my-analyses")}
                    >
                      <div className="p-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <FileScan className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">Analyze</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(item.savedAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                        <div className="flex items-center justify-end mt-0.5">
                          <span className="text-[11px] font-semibold text-blue-500 group-hover:underline">View analysis →</span>
                        </div>
                      </div>
                    </Card>
                  ) : item.kind === "signature" ? (
                    <Card
                      className="group border border-border/50 bg-card hover:border-violet-400/40 hover:shadow-md rounded-2xl cursor-pointer transition-all"
                      onClick={() => setLocation("/signature")}
                    >
                      <div className="p-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <FileSignature className="w-3 h-3 text-violet-500 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500/80">Signature</span>
                          <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider border rounded-full px-1.5 py-0.5 ${STATUS_COLORS[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">→ {item.signerName}</p>
                      </div>
                    </Card>
                  ) : (
                    (() => {
                      const localMeta: Record<string, { icon: ElementType; color: string; href: string; toolLabel: string; cta: string }> = {
                        "redact":           { icon: EyeOff,     color: "text-violet-400",  href: "/redact",         toolLabel: "Redact",          cta: "Open tool →" },
                        "contract-builder": { icon: PenLine,    color: "text-emerald-400", href: "/build-contract", toolLabel: "Contract Builder", cta: "Continue building →" },
                        "compare":          { icon: GitCompare, color: "text-teal-400",    href: "/compare-versions", toolLabel: "Compare",       cta: "Open tool →" },
                      }
                      const meta = localMeta[item.tool] ?? localMeta["redact"]
                      const Icon = meta.icon
                      return (
                        <Card
                          className="group border border-border/50 bg-card hover:border-border hover:shadow-md rounded-2xl cursor-pointer transition-all"
                          onClick={() => setLocation(meta.href)}
                        >
                          <div className="p-4 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Icon className={`w-3 h-3 ${meta.color} shrink-0`} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color} opacity-80`}>{meta.toolLabel}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(item.savedAt)}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                            <div className="flex items-center justify-end mt-0.5">
                              <span className={`text-[11px] font-semibold ${meta.color} group-hover:underline`}>{meta.cta}</span>
                            </div>
                          </div>
                        </Card>
                      )
                    })()
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — TRY A DEMO
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Try a Demo</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Pre-loaded real-world scenarios — click any to run it through the tool.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {DEMOS.map((demo, i) => (
              <motion.button
                key={demo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setLocation(demo.path)}
                className="group text-left"
              >
                <Card className="h-full border border-border/50 bg-card hover:border-border hover:shadow-md rounded-2xl transition-all p-4">
                  <div className={`w-8 h-8 rounded-lg ${demo.bg} flex items-center justify-center mb-3`}>
                    <demo.icon className={`w-4 h-4 ${demo.color}`} />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${demo.color}`}>{demo.tool}</p>
                  <p className="text-xs font-semibold text-foreground leading-snug group-hover:text-foreground/80 transition-colors">
                    {demo.title}
                  </p>
                </Card>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 5 — PLAN STATUS / HELP
        ══════════════════════════════════════════════ */}
        <section className="pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Plan card */}
            <Card
              className="border border-border/50 bg-card rounded-2xl cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
              onClick={() => setLocation("/billing")}
            >
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your Plan</p>
                  <p className="font-bold text-foreground">
                    {isAdmin ? "Admin — Full Access" : plan === "pro" ? "Pro — All 6 tools" : plan === "starter" ? "Starter — Analyze + Redact" : "Free"}
                  </p>
                  {!plan && !isAdmin && (
                    <p className="text-xs text-muted-foreground mt-0.5">2 free analyses included</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isAdmin && plan !== "pro" && (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs h-8"
                      onClick={(e) => { e.stopPropagation(); setLocation("/upgrade") }}
                    >
                      Upgrade
                    </Button>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </div>
            </Card>

            {/* Support card */}
            <Card
              className="border border-border/50 bg-card rounded-2xl cursor-pointer hover:border-border hover:shadow-md transition-all"
              onClick={() => setLocation("/support")}
            >
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Help & Support</p>
                <p className="font-semibold text-foreground text-sm">Questions or billing issues?</p>
                <p className="text-xs text-muted-foreground mt-0.5">support@plainpathapp.com</p>
              </div>
            </Card>

          </div>
        </section>

      </main>
    </div>
  )
}
