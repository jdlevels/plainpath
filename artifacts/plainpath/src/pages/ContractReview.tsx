import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Scale, UploadCloud, Loader2, AlertCircle, Copy, Check,
  ChevronDown, ChevronUp, ArrowLeft, RotateCcw, FileText,
  ShieldAlert, AlertTriangle, CheckCircle2, X as XIcon,
  Lock, ClipboardList, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApiBaseUrl } from "@/lib/api"
import { useLocation } from "wouter"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClauseResult {
  id: string
  text: string
  rating: "fair" | "watch-out" | "red-flag"
  explanation: string
  whyUnfair: string | null
  negotiationLanguage: string | null
  exitGuidance: string | null
}

interface ReviewResult {
  overallScore: number
  verdict: string
  summary: string
  clauses: ClauseResult[]
  missingProtections: string[]
  preSigningChecklist: string[]
  reviewedAt: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const RATING_CONFIG = {
  "fair": {
    label: "Fair",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    border: "border-emerald-200/50 dark:border-emerald-900/40",
  },
  "watch-out": {
    label: "Watch Out",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    border: "border-amber-200/50 dark:border-amber-900/40",
  },
  "red-flag": {
    label: "Red Flag",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    icon: ShieldAlert,
    iconColor: "text-red-500",
    border: "border-red-200/50 dark:border-red-900/40",
  },
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-blue-600 dark:text-blue-400"
  if (score >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40"
  if (score >= 60) return "bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40"
  if (score >= 40) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40"
  return "bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-900/40"
}

function primaryRecommendation(result: ReviewResult): string {
  const redFlags = result.clauses.filter(c => c.rating === "red-flag").length
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out").length
  const missing = result.missingProtections?.length ?? 0
  if (redFlags >= 3) return `This contract has ${redFlags} red flags — do not sign until these are negotiated or removed.`
  if (redFlags >= 1) return `${redFlags} clause${redFlags > 1 ? "s" : ""} should be revised before you sign. Use the suggested language below to push back.`
  if (watchOuts >= 3) return `${watchOuts} clauses deserve attention. Review each watch-out and confirm you understand what you're agreeing to.`
  if (missing >= 2) return `The contract is missing ${missing} standard protections. Request these additions before signing.`
  if (result.overallScore >= 80) return "This contract looks fair. Review the before-you-sign checklist and confirm the key terms match your expectations."
  return "Review the sections below carefully and address any concerns before signing."
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

// ─── ClauseCard ───────────────────────────────────────────────────────────────

function ClauseCard({ clause, defaultOpen = false }: { clause: ClauseResult; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const config = RATING_CONFIG[clause.rating]
  const Icon = config.icon

  return (
    <Card className={`border ${config.border} transition-all`}>
      <CardContent className="p-0">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
          <span className="flex-1 text-sm font-medium leading-snug">{clause.text}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
            {config.label}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">What it means</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">{clause.explanation}</p>
                </div>

                {clause.whyUnfair && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Why this is a problem</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{clause.whyUnfair}</p>
                  </div>
                )}

                {clause.negotiationLanguage && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Suggested revision — copy and send</p>
                      <CopyButton text={clause.negotiationLanguage} />
                    </div>
                    <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed font-mono bg-blue-100/50 dark:bg-blue-900/30 rounded p-2 mt-1 whitespace-pre-wrap">{clause.negotiationLanguage}</p>
                  </div>
                )}

                {clause.exitGuidance && (
                  <div className="bg-muted/40 border border-border/30 rounded-lg p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Already signed?</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{clause.exitGuidance}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "Reading every clause…",
  "Evaluating fairness and risk…",
  "Drafting negotiation language…",
  "Identifying missing protections…",
  "Building your review…",
]

function ContractReviewLoadingScreen() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* sticky header skeleton */}
      <div className="bg-background/95 border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-28 rounded-full bg-secondary animate-pulse" />
            <div className="h-4 w-52 rounded-full bg-secondary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* Progress message */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-full px-5 py-2.5">
            <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin flex-shrink-0" />
            <AnimatePresence mode="wait">
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-medium text-amber-700 dark:text-amber-300"
              >
                {LOADING_STEPS[step]}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="text-xs text-muted-foreground mt-3">This typically takes 20–40 seconds for a complete contract.</p>
        </div>

        {/* Score card skeleton */}
        <div className="border rounded-2xl p-6 bg-muted/20 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="w-16 h-14 rounded-xl bg-secondary mx-auto mb-1" />
              <div className="h-2 w-12 rounded-full bg-secondary mx-auto" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-36 rounded-lg bg-secondary" />
              <div className="h-3 w-full rounded-full bg-secondary/70" />
              <div className="h-3 w-4/5 rounded-full bg-secondary/60" />
            </div>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-border/20">
            {[80, 100, 90].map((w, i) => (
              <div key={i} className="h-5 rounded-full bg-secondary/70" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Section nav skeleton */}
        <div className="flex gap-2 flex-wrap">
          {[100, 90, 130, 110, 120].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-secondary animate-pulse" style={{ width: w }} />
          ))}
        </div>

        {/* Clause card skeletons */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
          {[1, 2].map(i => (
            <div key={i} className="border border-red-200/40 rounded-xl p-4 animate-pulse bg-red-50/20 dark:bg-red-950/10">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-200 dark:bg-red-800/40" />
                <div className="flex-1 h-3 rounded-full bg-secondary" />
                <div className="h-5 w-16 rounded-full bg-red-200/60 dark:bg-red-800/40" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-amber-200/40 rounded-xl p-4 animate-pulse bg-amber-50/20 dark:bg-amber-950/10">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800/40" />
                <div className="flex-1 h-3 rounded-full bg-secondary" />
                <div className="h-5 w-20 rounded-full bg-amber-200/60 dark:bg-amber-800/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section nav ─────────────────────────────────────────────────────────────

interface NavSection { id: string; label: string; count: number; color: string }

function SectionNav({ sections }: { sections: NavSection[] }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {sections.filter(s => s.count > 0).map(s => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm ${s.color}`}
        >
          {s.label}
          <span className="opacity-75">({s.count})</span>
          <ChevronRight className="w-3 h-3 opacity-50" />
        </button>
      ))}
    </div>
  )
}

// ─── Section Block ────────────────────────────────────────────────────────────

const SECTION_COLORS = {
  red:    { border: "border-red-200 dark:border-red-900/50",       bg: "bg-red-50/40 dark:bg-red-950/10",       heading: "text-red-700 dark:text-red-400"     },
  amber:  { border: "border-amber-200 dark:border-amber-900/50",   bg: "bg-amber-50/40 dark:bg-amber-950/10",   heading: "text-amber-700 dark:text-amber-400" },
  emerald:{ border: "border-emerald-200 dark:border-emerald-900/50", bg: "bg-emerald-50/30 dark:bg-emerald-950/10", heading: "text-emerald-700 dark:text-emerald-400" },
  violet: { border: "border-violet-200 dark:border-violet-900/50", bg: "bg-violet-50/30 dark:bg-violet-950/10", heading: "text-violet-700 dark:text-violet-400" },
  blue:   { border: "border-blue-200 dark:border-blue-900/50",     bg: "bg-blue-50/30 dark:bg-blue-950/10",     heading: "text-blue-700 dark:text-blue-400"   },
}

function SectionBlock({ id, title, badge, children, collapsible = false, defaultCollapsed = false, color }: {
  id: string
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  color?: keyof typeof SECTION_COLORS
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const colors = color ? SECTION_COLORS[color] : null

  const headerInner = (
    <>
      <h3 className={`text-sm font-bold uppercase tracking-widest ${colors ? colors.heading : "text-muted-foreground"}`}>{title}</h3>
      {badge}
      {collapsible && (
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          {collapsed ? "Show" : "Hide"}
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </span>
      )}
    </>
  )

  return (
    <div
      id={id}
      className={`scroll-mt-24 rounded-2xl border p-5 space-y-4 ${colors ? `${colors.border} ${colors.bg}` : "border-border/40 bg-card"}`}
    >
      {collapsible ? (
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 w-full text-left cursor-pointer"
        >
          {headerInner}
        </button>
      ) : (
        <div className="flex items-center gap-2">{headerInner}</div>
      )}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Results View ─────────────────────────────────────────────────────────────

function buildReviewText(result: ReviewResult): string {
  const lines: string[] = [
    "PLAINPATH — CONTRACT REVIEW",
    `Score: ${result.overallScore}/100 — ${result.verdict}`,
    "",
    result.summary,
    "",
  ]
  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  if (redFlags.length) {
    lines.push("─── RED FLAGS ───")
    redFlags.forEach(c => lines.push(`• ${c.text}`, `  ${c.explanation}`, ""))
  }
  if (watchOuts.length) {
    lines.push("─── WATCH OUTS ───")
    watchOuts.forEach(c => lines.push(`• ${c.text}`, `  ${c.explanation}`, ""))
  }
  if (result.missingProtections.length) {
    lines.push("─── MISSING PROTECTIONS ───")
    result.missingProtections.forEach(p => lines.push(`• ${p}`))
    lines.push("")
  }
  if (result.preSigningChecklist.length) {
    lines.push("─── BEFORE YOU SIGN ───")
    result.preSigningChecklist.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
  }
  return lines.join("\n")
}

function ResultsView({ result, onReset }: { result: ReviewResult; onReset: () => void }) {
  const [copied, setCopied] = useState(false)
  const redFlags = result.clauses.filter(c => c.rating === "red-flag")
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out")
  const fair = result.clauses.filter(c => c.rating === "fair")
  const missingCount = result.missingProtections?.length ?? 0
  const checklistCount = result.preSigningChecklist?.length ?? 0
  const recommendation = primaryRecommendation(result)

  const navSections: NavSection[] = [
    { id: "red-flags",          label: "Red Flags",           count: redFlags.length,  color: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300" },
    { id: "watch-outs",         label: "Watch Outs",          count: watchOuts.length, color: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300" },
    { id: "fair-clauses",       label: "Fair Clauses",        count: fair.length,      color: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" },
    { id: "missing-protections",label: "Missing Protections", count: missingCount,     color: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300" },
    { id: "before-you-sign",    label: "Before You Sign",     count: checklistCount,   color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Contract Review Results</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Clause-by-clause — read this before you sign</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              navigator.clipboard.writeText(buildReviewText(result)).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              })
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border/60 bg-card hover:bg-secondary rounded-xl px-3 py-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy results"}</span>
          </button>
          <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Review Another
          </Button>
        </div>
      </div>

      {/* ── Score summary ── */}
      <div className={`border rounded-2xl p-6 ${scoreBg(result.overallScore)}`}>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="text-center min-w-[72px]">
            <p className={`text-6xl font-bold font-display leading-none ${scoreColor(result.overallScore)}`}>{result.overallScore}</p>
            <p className="text-xs text-muted-foreground mt-1.5">out of 100</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xl font-bold mb-1.5 ${scoreColor(result.overallScore)}`}>{result.verdict}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
          </div>
        </div>

        {/* Count pills */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-border/20">
          <div className="flex items-center gap-1.5 text-sm">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="font-bold text-red-600 dark:text-red-400">{redFlags.length}</span>
            <span className="text-muted-foreground">red flag{redFlags.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-amber-600 dark:text-amber-400">{watchOuts.length}</span>
            <span className="text-muted-foreground">watch-out{watchOuts.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{fair.length}</span>
            <span className="text-muted-foreground">fair clause{fair.length !== 1 ? "s" : ""}</span>
          </div>
          {missingCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <Lock className="w-4 h-4 text-violet-500" />
              <span className="font-bold text-violet-600 dark:text-violet-400">{missingCount}</span>
              <span className="text-muted-foreground">missing protection{missingCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Primary recommendation ── */}
      <div className="flex items-start gap-3 bg-background border border-border/50 rounded-xl px-4 py-3.5 shadow-sm">
        <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium leading-relaxed">{recommendation}</p>
      </div>

      {/* ── Section nav ── */}
      <SectionNav sections={navSections} />

      {/* ── Legal disclaimer ── */}
      <div className="bg-muted/30 border border-border/30 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        AI-assisted contract review for informational purposes only. Not legal advice. Always consult a qualified attorney before signing any legal agreement.
      </div>

      {/* ── Red Flags ── */}
      {redFlags.length > 0 && (
        <SectionBlock
          id="red-flags"
          title="Red Flags"
          color="red"
          badge={<Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0 text-[10px]">{redFlags.length}</Badge>}
        >
          <p className="text-xs text-muted-foreground mb-3">These clauses are harmful, exploitative, or potentially unenforceable. Each should be negotiated or removed before you sign.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {redFlags.map((c, i) => (
              <div key={c.id} className={redFlags.length % 2 !== 0 && i === redFlags.length - 1 ? "md:col-span-2" : ""}>
                <ClauseCard clause={c} defaultOpen={true} />
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Watch Outs ── */}
      {watchOuts.length > 0 && (
        <SectionBlock
          id="watch-outs"
          title="Watch Outs"
          color="amber"
          badge={<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 text-[10px]">{watchOuts.length}</Badge>}
        >
          <p className="text-xs text-muted-foreground mb-3">These clauses are vague, one-sided, or unusual. You can still sign — but you should understand what you're agreeing to and consider pushing back.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {watchOuts.map((c, i) => (
              <div key={c.id} className={watchOuts.length % 2 !== 0 && i === watchOuts.length - 1 ? "md:col-span-2" : ""}>
                <ClauseCard clause={c} defaultOpen={true} />
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Fair Clauses (collapsible) ── */}
      {fair.length > 0 && (
        <SectionBlock
          id="fair-clauses"
          title="Fair Clauses"
          color="emerald"
          badge={<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px]">{fair.length}</Badge>}
          collapsible={true}
          defaultCollapsed={true}
        >
          <p className="text-xs text-muted-foreground mb-3">These clauses appear balanced and reasonable. Expand each to see what it means in plain English.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {fair.map((c, i) => (
              <div key={c.id} className={fair.length % 2 !== 0 && i === fair.length - 1 ? "md:col-span-2" : ""}>
                <ClauseCard clause={c} defaultOpen={false} />
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ── Missing Protections ── */}
      {result.missingProtections && result.missingProtections.length > 0 && (
        <SectionBlock
          id="missing-protections"
          title="Missing Protections"
          color="violet"
          badge={<Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0 text-[10px]">{result.missingProtections.length}</Badge>}
        >
          <Card className="border-violet-200/60 dark:border-violet-900/40">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Standard protections a balanced contract of this type should include — but this one doesn't. Consider requesting these additions before signing.
              </p>
              <ul className="space-y-3">
                {result.missingProtections.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </SectionBlock>
      )}

      {/* ── Before You Sign ── */}
      {result.preSigningChecklist && result.preSigningChecklist.length > 0 && (
        <SectionBlock
          id="before-you-sign"
          title="Before You Sign"
          color="blue"
          badge={<Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-[10px]">{result.preSigningChecklist.length}</Badge>}
        >
          <Card className="border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Work through each of these before signing. These are specific to the contract you uploaded.
              </p>
              <ul className="space-y-3">
                {result.preSigningChecklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </SectionBlock>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractReview() {
  const [, setLocation] = useLocation()

  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReviewResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleReview() {
    setError(null)
    setLoading(true)
    try {
      const base = getApiBaseUrl()
      let response: Response

      if (activeTab === "upload" && file) {
        const fd = new FormData()
        fd.append("file", file)
        response = await fetch(`${base}/api/contracts/review`, { method: "POST", body: fd })
      } else {
        if (!text.trim() || text.trim().length < 50) {
          setError("Please paste at least 50 characters of contract text.")
          setLoading(false)
          return
        }
        response = await fetch(`${base}/api/contracts/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        })
      }

      const data = await response.json() as ReviewResult & { message?: string }
      if (!response.ok) {
        setError(data.message ?? "Review failed. Please try again.")
        setLoading(false)
        return
      }

      setResult(data)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setText("")
    setFile(null)
    setError(null)
    setActiveTab("paste")
  }

  // Full-page loading skeleton
  if (loading) return <ContractReviewLoadingScreen />

  // Results view
  if (result) return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom) + 6rem)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ResultsView result={result} onReset={handleReset} />
      </div>
    </div>
  )

  // Input form
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-7"
        >
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 mb-1">
              <Scale className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl font-display font-bold">Contract Review</h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
              Review a contract you didn't write. Spot unfair clauses, missing protections, negotiation points, and high-risk terms before you sign.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Red flags surfaced</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Watch-outs explained</span>
              <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5 text-blue-500" /> Negotiation language ready to copy</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-violet-500" /> Missing protections identified</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
                {(["paste", "upload"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setError(null) }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      activeTab === tab
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "paste" ? "Paste Text" : "Upload File"}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "paste" ? (
                  <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Textarea
                      placeholder="Paste the full contract text here…"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      rows={12}
                      className="resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 text-right">{text.length.toLocaleString()} characters</p>
                  </motion.div>
                ) : (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0] ?? null
                        setFile(f)
                        setError(null)
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border/50 rounded-xl p-10 text-center hover:border-amber-400/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-all group"
                    >
                      {file ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="w-5 h-5 text-amber-600" />
                            <span className="text-sm font-medium text-foreground">{file.name}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={e => { e.stopPropagation(); setFile(null) }}
                              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setFile(null) } }}
                              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB — click to change</p>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-amber-500 mx-auto mb-2 transition-colors" />
                          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Drop a file or click to browse</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, Word (.docx), or plain text · Max 20 MB</p>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleReview}
                disabled={loading || (activeTab === "paste" ? text.trim().length < 50 : !file)}
                className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
              >
                <Scale className="w-4 h-4" /> Review This Contract
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
