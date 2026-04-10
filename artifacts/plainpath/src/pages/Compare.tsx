import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitCompare, Loader2, AlertCircle, ArrowRight, ArrowLeft, Check, X, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApiBaseUrl } from "@/lib/api"
import { useLocation } from "wouter"

interface ChangeItem {
  type: "added" | "removed" | "modified" | "risk-increased" | "risk-decreased"
  clause: string
  original: string | null
  revised: string | null
  significance: "high" | "medium" | "low"
  explanation: string
}

interface CompareResult {
  summary: string
  overallRiskChange: "increased" | "decreased" | "unchanged"
  changesCount: number
  highSignificanceCount: number
  changes: ChangeItem[]
  recommendation: string
  analyzedAt: string
}

const CHANGE_CONFIG: Record<ChangeItem["type"], { label: string; color: string; icon: React.ElementType; bg: string; border: string }> = {
  "added": { label: "Added", color: "text-blue-600 dark:text-blue-400", icon: Check, bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200/60 dark:border-blue-900/40" },
  "removed": { label: "Removed", color: "text-red-600 dark:text-red-400", icon: X, bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200/60 dark:border-red-900/40" },
  "modified": { label: "Modified", color: "text-amber-600 dark:text-amber-400", icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200/60 dark:border-amber-900/40" },
  "risk-increased": { label: "Risk ↑", color: "text-red-600 dark:text-red-400", icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200/60 dark:border-red-900/40" },
  "risk-decreased": { label: "Risk ↓", color: "text-emerald-600 dark:text-emerald-400", icon: Check, bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200/60 dark:border-emerald-900/40" },
}

const SIG_COLORS = { high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", low: "bg-muted text-muted-foreground" }

function ChangeCard({ change }: { change: ChangeItem }) {
  const [open, setOpen] = useState(change.significance === "high")
  const cfg = CHANGE_CONFIG[change.type]
  const Icon = cfg.icon
  return (
    <Card className={`border ${cfg.border} transition-all`}>
      <CardContent className="p-0">
        <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl">
          <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
          <span className="flex-1 text-sm font-medium leading-snug">{change.clause}</span>
          <Badge className={`text-[10px] border-0 ${SIG_COLORS[change.significance]}`}>{change.significance}</Badge>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                <p className="text-sm text-foreground/85 leading-relaxed">{change.explanation}</p>
                {(change.original || change.revised) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {change.original && (
                      <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200/40 rounded-lg p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1.5">Original</p>
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">{change.original}</p>
                      </div>
                    )}
                    {change.revised && (
                      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/40 rounded-lg p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1.5">Revised</p>
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">{change.revised}</p>
                      </div>
                    )}
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

export default function Compare() {
  const [, setLocation] = useLocation()
  const [original, setOriginal] = useState("")
  const [revised, setRevised] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompareResult | null>(null)

  useEffect(() => {
    document.title = "Compare Document Versions — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  async function handleCompare() {
    if (original.trim().length < 50 || revised.trim().length < 50) {
      setError("Please paste at least 50 characters in both documents.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/documents/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: original.trim(), revised: revised.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Comparison failed. Please try again.")
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const riskBadge = result?.overallRiskChange === "increased"
    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    : result?.overallRiskChange === "decreased"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    : "bg-muted text-muted-foreground"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-xl transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
            <GitCompare className="w-4.5 h-4.5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">New tool</p>
            <h1 className="text-base font-bold text-foreground">Document Version Comparison</h1>
          </div>
          {result && (
            <Button variant="outline" size="sm" onClick={() => { setResult(null); setOriginal(""); setRevised("") }} className="gap-1.5 text-xs">
              Compare again
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">Compare two versions of a document</h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
                  Paste the original and revised versions of a contract or agreement. PlainPath will identify every change, flag what got riskier, and explain what each change means.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Original version</label>
                  <Textarea
                    value={original}
                    onChange={e => setOriginal(e.target.value)}
                    placeholder="Paste the original document text here…"
                    className="h-72 text-sm resize-none font-mono bg-muted/20 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{original.length > 0 ? `${original.length.toLocaleString()} characters` : "e.g. the contract you received first"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Revised version</label>
                  <Textarea
                    value={revised}
                    onChange={e => setRevised(e.target.value)}
                    placeholder="Paste the revised document text here…"
                    className="h-72 text-sm resize-none font-mono bg-muted/20 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{revised.length > 0 ? `${revised.length.toLocaleString()} characters` : "e.g. after you requested changes"}</p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/8 border border-destructive/15 text-destructive mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleCompare}
                  disabled={loading || original.trim().length < 50 || revised.trim().length < 50}
                  className="gap-2 px-8"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Comparing…</> : <>Compare versions <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Summary card */}
              <div className="border rounded-2xl p-6 bg-card shadow-sm">
                <div className="flex items-start gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">Overall risk change</p>
                    <Badge className={`text-sm font-bold px-3 py-1 border-0 ${riskBadge}`}>
                      {result.overallRiskChange === "increased" ? "Risk increased ↑" : result.overallRiskChange === "decreased" ? "Risk decreased ↓" : "Risk unchanged"}
                    </Badge>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div className="text-center">
                      <p className="text-2xl font-bold font-display">{result.changesCount}</p>
                      <p className="text-xs text-muted-foreground">total changes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold font-display text-red-500">{result.highSignificanceCount}</p>
                      <p className="text-xs text-muted-foreground">high significance</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mt-4">{result.summary}</p>
              </div>

              {/* Recommendation */}
              <div className="flex items-start gap-3 bg-background border border-border/50 rounded-xl px-4 py-3.5 shadow-sm">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Changes */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Changes ({result.changes.length})</h3>
                {result.changes.map((c, i) => (
                  <ChangeCard key={i} change={c} />
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                AI-assisted comparison for informational purposes only. Not legal advice.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
