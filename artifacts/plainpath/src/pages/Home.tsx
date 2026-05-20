import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  ArrowRight, Plus,
  FileScan, Scale, List, MessageSquare,
  BookMarked, Clock, ChevronRight, CreditCard,
  Lock, Sparkles, ShieldCheck,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useUser, useAuth } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useEntitlements } from "@/hooks/useEntitlements"
import { getAll as getLocalAnalyses } from "@/lib/savedAnalyses"
import { fetchCloudAnalyses } from "@/lib/cloudHistory"
import type { SavedAnalysis } from "@/lib/savedAnalyses"
import { getRecentWork, type LocalRecentItem } from "@/lib/recentWork"

type RecentItem =
  | { kind: "analysis"; id: string; title: string; savedAt: string }
  | { kind: "local";    id: string; title: string; savedAt: string; tool: LocalRecentItem["tool"] }

// ─── Tool definitions ──────────────────────────────────────────────────────────

const ACTIVE_TOOLS = [
  {
    key: "analyze" as const,
    label: "Analyze a Document",
    desc: "Extract key terms, obligations, and plain-English summaries automatically.",
    icon: Sparkles,
    path: "/analyze",
    ctaText: "Start analysis",
    avgTime: "Avg 45 sec",
    gradientFrom: "#2C4A7C",
    gradientTo: "#4F7CAC",
    headerBg: "linear-gradient(to bottom right, #FAFCFF, #F5F8FF)",
    headerBorder: "rgba(44,74,124,0.08)",
    shadowColor: "rgba(44,74,124,0.35)",
    accentLeft: "#2C4A7C",
    plan: null,
  },
  {
    key: "contract-review" as const,
    label: "Contract Review",
    desc: "Surface clauses worth discussing before you sign, in plain English.",
    icon: ShieldCheck,
    path: "/contract-review",
    ctaText: "Start review",
    avgTime: "Avg 60 sec",
    gradientFrom: "#3D6199",
    gradientTo: "#4F7CAC",
    headerBg: "linear-gradient(to bottom right, #FAFCFF, #F5F9FF)",
    headerBorder: "rgba(79,124,172,0.08)",
    shadowColor: "rgba(79,124,172,0.35)",
    accentLeft: "#4F7CAC",
    plan: "pro" as const,
  },
]

const COMING_SOON_TOOLS = [
  {
    key: "clause-extractor",
    label: "Clause Extractor & Obligations Tracker",
    desc: "Pull every clause, deadline, and obligation into a structured tracker.",
    icon: List,
  },
  {
    key: "ask-document",
    label: "Ask This Document",
    desc: "Ask plain-English questions directly about any document you've uploaded.",
    icon: MessageSquare,
  },
]

// ─── Demo scenarios ────────────────────────────────────────────────────────────

const DEMOS = [
  {
    id: "event-permit",
    tool: "Analyze",
    title: "Small Business Event Permit",
    icon: FileScan,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    path: "/analyze?demo=event-permit",
  },
  {
    id: "contract-review-employment",
    tool: "Contract Review",
    title: "Employment Offer — One-Sided",
    icon: Scale,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    path: "/contract-review",
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation()
  const { user, isLoaded: authLoaded } = useUser()
  const { getToken, userId } = useAuth()
  const { entitlements, isAdmin, loading: entLoading } = useEntitlements()
  const [recentWork, setRecentWork] = useState<RecentItem[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  const firstName = user?.firstName ?? null
  const plan = entitlements?.plan ?? null
  const toolAccess = entitlements?.toolAccess ?? []

  // Load recent work — analyses + local sessions, merged by date
  useEffect(() => {
    if (!authLoaded) return
    let cancelled = false
    async function load() {
      setRecentLoading(true)
      try {
        const token = await getToken().catch(() => null)

        const [cloudAnalyses] = await Promise.allSettled([
          fetchCloudAnalyses(token),
        ])

        const analyses: RecentItem[] =
          cloudAnalyses.status === "fulfilled"
            ? cloudAnalyses.value.map((a: SavedAnalysis) => ({
                kind: "analysis" as const,
                id: a.id,
                title: a.title,
                savedAt: a.savedAt,
              }))
            : userId
              ? []
              : getLocalAnalyses().map((a: SavedAnalysis) => ({
                  kind: "analysis" as const,
                  id: a.id,
                  title: a.title,
                  savedAt: a.savedAt,
                }))

        const localWork: RecentItem[] = getRecentWork()
          .filter(lw => lw.tool === "analyze" || lw.tool === "contract-review" || lw.tool === "import")
          .map((lw) => ({
            kind: "local" as const,
            id: lw.id,
            title: lw.title,
            savedAt: lw.savedAt,
            tool: lw.tool,
          }))

        const merged = [...analyses, ...localWork]
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
          .slice(0, 6)

        if (!cancelled) setRecentWork(merged)
      } catch {
        if (!userId) {
          const local = getLocalAnalyses().slice(0, 4).map((a: SavedAnalysis) => ({
            kind: "analysis" as const,
            id: a.id,
            title: a.title,
            savedAt: a.savedAt,
          }))
          if (!cancelled) setRecentWork(local)
        } else {
          if (!cancelled) setRecentWork([])
        }
      } finally {
        if (!cancelled) setRecentLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [authLoaded, userId])

  function canAccessTool(toolKey: string): boolean {
    if (isAdmin) return true
    return toolAccess.includes(toolKey as never)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* Subtle ambient gradient */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/4 blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl -translate-x-1/4 translate-y-1/4" />
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ══════════════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                <span className="inline-block w-4 h-px bg-border" />
                Document Intelligence Workspace
              </p>
              <h1
                className="text-[22px] sm:text-[26px] font-extrabold leading-tight text-foreground"
                style={{ letterSpacing: "-0.5px" }}
              >
                {firstName ? `Welcome back, ${firstName}.` : "Your document workspace."}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <span className="text-sm text-muted-foreground">{todayLabel()}</span>
                {(plan || isAdmin) && (
                  <button
                    onClick={() => setLocation("/billing")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-amber-400" : "bg-primary"}`} />
                    {isAdmin ? "Admin Access" : "PlainPath Pro"}
                    <CreditCard className="w-3 h-3 opacity-60" />
                  </button>
                )}
              </div>
            </div>

            {/* Primary CTA */}
            <Button
              variant="gradient"
              onClick={() => setLocation("/analyze")}
              className="shrink-0 flex items-center gap-2 rounded-xl font-bold h-11 px-5 text-sm"
            >
              <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              </div>
              New Analysis
            </Button>
          </div>

          <div className="mt-5 h-px bg-border/60" />
        </motion.div>

        {/* ══════════════════════════════════════════════
            SECTION 2 — FOUR-TOOL GRID
        ══════════════════════════════════════════════ */}
        <section className="mb-9">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Tools</h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ── Active tools ── */}
            {ACTIVE_TOOLS.map((tool, i) => {
              const accessible = canAccessTool(tool.key)
              const locked = !entLoading && !accessible
              const Icon = tool.icon

              return (
                <motion.div
                  key={tool.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div
                    className={`rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col transition-all duration-200 ${
                      accessible
                        ? "cursor-pointer hover:shadow-xl hover:-translate-y-0.5 group"
                        : "opacity-60 cursor-default"
                    }`}
                    style={{
                      boxShadow: "0 2px 12px rgba(44,74,124,0.07)",
                      borderLeft: `3px solid ${tool.accentLeft}`,
                    }}
                    onClick={() => accessible && setLocation(tool.path)}
                  >
                    {/* Header band */}
                    <div
                      className="px-5 pt-5 pb-4 flex items-start gap-4"
                      style={{
                        borderBottom: `1px solid ${tool.headerBorder}`,
                        background: tool.headerBg,
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                        style={{
                          background: `linear-gradient(135deg, ${tool.gradientFrom} 0%, ${tool.gradientTo} 100%)`,
                          boxShadow: `0 4px 14px ${tool.shadowColor}`,
                        }}
                      >
                        <Icon className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[14px] text-foreground group-hover:text-primary transition-colors tracking-tight">
                            {tool.label}
                          </h3>
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0"
                            style={{ background: "#EBF1FF", color: "#2C4A7C", borderColor: "#C7D8F5" }}
                          >
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                      </div>
                    </div>

                    {/* CTA footer */}
                    <div className="px-5 py-3 flex items-center justify-between">
                      {locked ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLocation("/upgrade") }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Upgrade to unlock →
                        </button>
                      ) : (
                        <span className="text-primary text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                          {tool.ctaText} <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" /> {tool.avgTime}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* ── Coming Soon tools ── */}
            {COMING_SOON_TOOLS.map((tool, i) => {
              const Icon = tool.icon
              return (
                <motion.div
                  key={tool.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (ACTIVE_TOOLS.length + i) * 0.06 }}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden flex gap-4 p-5 border border-border/60 cursor-default"
                    style={{ background: "#FAFAF8", opacity: 0.65 }}
                  >
                    {/* Coming Soon badge */}
                    <div
                      className="absolute top-3 right-3.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border border-border"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
                    >
                      <Lock className="w-2 h-2 text-muted-foreground" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Coming Soon</span>
                    </div>
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border"
                      style={{ background: "#F0EDE8" }}
                    >
                      <Icon className="w-[18px] h-[18px] text-muted-foreground/50" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0 pr-20">
                      <h3 className="font-semibold text-sm mb-0.5 text-muted-foreground">{tool.label}</h3>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">{tool.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}

          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 3 — RECENT ANALYSES
        ══════════════════════════════════════════════ */}
        <section className="mb-9">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Recent Analyses</h2>
            <div className="flex-1 h-px bg-border/60" />
            {recentWork.length > 0 && (
              <button
                onClick={() => setLocation("/documents")}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {recentLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[62px] rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : recentWork.length === 0 ? (
            <Card className="border border-dashed border-border/40 bg-card/60 rounded-2xl">
              <div className="p-8 text-center">
                <BookMarked className="w-7 h-7 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground mb-1">No saved work yet</p>
                <p className="text-xs text-muted-foreground/60 mb-4 max-w-xs mx-auto">
                  Saved analyses and Contract Review sessions will appear here once you start working.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => setLocation("/analyze")} className="rounded-xl text-xs">
                    <FileScan className="w-3 h-3 mr-1" /> Analyze a Document
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLocation("/contract-review")} className="rounded-xl text-xs">
                    <Scale className="w-3 h-3 mr-1" /> Contract Review
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div
              className="bg-card rounded-2xl border border-border/50 overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(44,74,124,0.06)" }}
            >
              {recentWork.map((item, i) => {
                if (item.kind !== "analysis") return null
                return (
                  <motion.div
                    key={`${item.kind}-${item.id}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div
                      className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-muted/25 transition-colors group ${
                        i > 0 ? "border-t border-border/40" : ""
                      }`}
                      onClick={() => setLocation("/my-analyses")}
                    >
                      {/* Left accent stripe */}
                      <div className="w-[3px] h-8 rounded-full shrink-0" style={{ background: "#2C4A7C" }} />
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "#EBF1FF", border: "1px solid #C7D8F5" }}
                      >
                        <FileScan className="w-[14px] h-[14px]" style={{ color: "#2C4A7C" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-snug">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest px-1.5 rounded"
                            style={{ background: "#EBF1FF", color: "#2C4A7C" }}
                          >
                            Analyze
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {timeAgo(item.savedAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — QUICK START
        ══════════════════════════════════════════════ */}
        <section className="mb-9">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Quick Start</h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Jump into a tool with a real-world scenario — no setup needed.
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
            SECTION 5 — PLAN & SUPPORT
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Your Plan</p>
                  <p className="font-bold text-foreground">
                    {isAdmin ? "Admin Access" : plan ? "PlainPath Pro" : "No active plan"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isAdmin && !plan && (
                    <Button
                      variant="gradient"
                      size="sm"
                      className="rounded-xl text-xs h-8"
                      onClick={(e) => { e.stopPropagation(); setLocation("/subscribe") }}
                    >
                      Get Pro
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
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Help &amp; Support</p>
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
