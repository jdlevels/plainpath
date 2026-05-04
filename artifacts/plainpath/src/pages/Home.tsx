import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  ArrowRight,
  FileScan, Scale,
  BookMarked, Clock, ChevronRight, CreditCard,
  LayoutGrid,
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

// ─── Tool definitions ─────────────────────────────────────────────────────────

// Launch tools — Analyze a Document and Contract Review
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
  const { user, isLoaded: authLoaded } = useUser()
  const { getToken, userId } = useAuth()
  const { entitlements, isAdmin, loading: entLoading } = useEntitlements()
  const [recentWork, setRecentWork] = useState<RecentItem[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  const firstName = user?.firstName ?? null
  const plan = entitlements?.plan ?? null
  const toolAccess = entitlements?.toolAccess ?? []

  // Load recent work — analyses + Clause Extractor sessions + Compare sessions + builder docs, merged by date
  useEffect(() => {
    if (!authLoaded) return
    let cancelled = false
    async function load() {
      setRecentLoading(true)
      try {
        // Need Bearer token for session APIs
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
              {isAdmin ? "Admin Access" : "PlainPath Pro"}
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
              // Lock when loading is done and the tool isn't accessible.
              // When entLoading=true, we don't show the lock icon yet (avoids flash),
              // but accessible=false so the card is still not clickable.
              // Safe default: missing entitlements after load → locked.
              const locked = !entLoading && !accessible

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
                My Documents <ChevronRight className="w-3.5 h-3.5" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentWork.map((item, i) => (
                <motion.div
                  key={`${item.kind}-${item.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {item.kind === "analysis" ? (
                    <Card
                      className="group border border-border/50 bg-card hover:border-blue-400/30 hover:shadow-md rounded-2xl cursor-pointer transition-all"
                      onClick={() => setLocation("/my-analyses")}
                    >
                      <div className="p-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <FileScan className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">Analyze a Document</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(item.savedAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                        <div className="flex items-center justify-end mt-0.5">
                          <span className="text-[11px] font-semibold text-blue-500 group-hover:underline">View analysis →</span>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    (() => {
                      return null
                    })()
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — QUICK START
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Quick Start</h2>
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
                    {isAdmin ? "Admin Access" : plan ? "PlainPath Pro" : "No active plan"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isAdmin && !plan && (
                    <Button
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
