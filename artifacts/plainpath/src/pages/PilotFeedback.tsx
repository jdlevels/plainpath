import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { BarChart2, ArrowLeft, Download, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getApiBaseUrl } from "@/lib/api"

const ASSESSMENT_LABELS: Record<string, string> = {
  "correct": "Correct",
  "mostly-correct": "Mostly Correct",
  "needs-tuning": "Needs Tuning",
  "incorrect": "Incorrect",
}

const ASSESSMENT_COLORS: Record<string, string> = {
  "correct": "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  "mostly-correct": "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  "needs-tuning": "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  "incorrect": "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
}

interface FeedbackRecord {
  id: number
  document_label: string
  document_type: string | null
  source_type: string
  verdict: string
  authenticity_risk: number | null
  document_risk: number | null
  verification_confidence: number | null
  reviewer_assessment: string
  is_false_positive: number
  is_false_negative: number
  issue_categories: string
  what_felt_right: string | null
  what_felt_weak: string | null
  what_was_missing: string | null
  what_felt_overstated: string | null
  tuning_note: string | null
  reviewer_role: string | null
  created_at: string
}

interface Summary {
  total: number
  byAssessment: { reviewer_assessment: string; count: number }[]
  byVerdict: { verdict: string; count: number }[]
  falsePosCount: number
  falseNegCount: number
  topCategories: { category: string; count: number }[]
}

function StatPill({ label, value, color = "" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 bg-card gap-1">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  )
}

function exportCsv(records: FeedbackRecord[]) {
  const headers = [
    "id", "document_label", "source_type", "verdict",
    "authenticity_risk", "document_risk", "verification_confidence",
    "reviewer_assessment", "is_false_positive", "is_false_negative",
    "issue_categories", "what_felt_right", "what_felt_weak",
    "what_was_missing", "what_felt_overstated", "tuning_note",
    "reviewer_role", "created_at",
  ]
  const rows = records.map((r) =>
    headers.map((h) => {
      const val = (r as any)[h]
      if (val === null || val === undefined) return ""
      const s = String(val)
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }).join(",")
  )
  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `pilot-feedback-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PilotFeedback() {
  const [, setLocation] = useLocation()
  const [records, setRecords] = useState<FeedbackRecord[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const base = getApiBaseUrl()
      const [recRes, sumRes] = await Promise.all([
        fetch(`${base}/api/pilot-feedback`),
        fetch(`${base}/api/pilot-feedback/summary`),
      ])
      if (!recRes.ok || !sumRes.ok) throw new Error("Failed to load")
      const { records: recs } = await recRes.json()
      const sum = await sumRes.json()
      setRecords(recs)
      setSummary(sum)
    } catch {
      setError("Could not load pilot feedback data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <BarChart2 className="w-4 h-4 text-primary/60" />
            <span className="text-sm font-semibold">Pilot Feedback Review</span>
            <span className="text-xs text-muted-foreground ml-1">Internal use only</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            {records.length > 0 && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => exportCsv(records)}>
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {loading && (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading feedback records…</div>
        )}
        {error && (
          <Card className="p-5 border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm">{error}</Card>
        )}

        {!loading && !error && summary && (
          <>
            {/* Summary stats */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatPill label="Total Records" value={summary.total} />
                <StatPill label="False Positives" value={summary.falsePosCount} color={summary.falsePosCount > 0 ? "text-amber-600" : ""} />
                <StatPill label="False Negatives" value={summary.falseNegCount} color={summary.falseNegCount > 0 ? "text-red-600" : ""} />
                <StatPill
                  label="Need Tuning / Incorrect"
                  value={summary.byAssessment.filter(a => ["needs-tuning","incorrect"].includes(a.reviewer_assessment)).reduce((s,a) => s+a.count, 0)}
                  color="text-amber-600"
                />
              </div>
            </div>

            {/* Assessment breakdown */}
            {summary.byAssessment.length > 0 && (
              <Card className="p-4 sm:p-5 border-border/40">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Reviewer Assessment Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.byAssessment.map((a) => (
                    <div key={a.reviewer_assessment} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${ASSESSMENT_COLORS[a.reviewer_assessment] ?? "bg-secondary text-foreground"}`}>
                      <span>{ASSESSMENT_LABELS[a.reviewer_assessment] ?? a.reviewer_assessment}</span>
                      <span className="font-bold tabular-nums">{a.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Top issue categories */}
            {summary.topCategories.length > 0 && (
              <Card className="p-4 sm:p-5 border-border/40">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Most Reported Issue Categories</h3>
                <div className="space-y-2">
                  {summary.topCategories.map(({ category, count }) => (
                    <div key={category} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-foreground/80 truncate">{category}</div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${Math.round((count / (summary.topCategories[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-muted-foreground w-6 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Records table */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">All Feedback Records ({records.length})</h2>
              {records.length === 0 ? (
                <Card className="p-8 border-border/40 text-center text-sm text-muted-foreground">
                  No pilot feedback has been logged yet. Use the feedback panel on any Trust Check result to add the first record.
                </Card>
              ) : (
                <div className="space-y-2">
                  {records.map((r) => {
                    const cats: string[] = (() => { try { return JSON.parse(r.issue_categories) } catch { return [] } })()
                    const isExpanded = expanded === r.id
                    return (
                      <Card key={r.id} className="border-border/40 overflow-hidden">
                        <button
                          className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                          onClick={() => setExpanded(isExpanded ? null : r.id)}
                        >
                          <div className="flex flex-wrap items-start gap-2">
                            <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">{r.document_label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.is_false_positive === 1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">FP</span>
                              )}
                              {r.is_false_negative === 1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">FN</span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ASSESSMENT_COLORS[r.reviewer_assessment] ?? "bg-secondary text-foreground"}`}>
                                {ASSESSMENT_LABELS[r.reviewer_assessment] ?? r.reviewer_assessment}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                            <span>Verdict: <span className="font-medium text-foreground/70">{r.verdict}</span></span>
                            {r.authenticity_risk !== null && <span>Auth: <span className="font-medium tabular-nums">{r.authenticity_risk}</span></span>}
                            {r.document_risk !== null && <span>Doc: <span className="font-medium tabular-nums">{r.document_risk}</span></span>}
                            {r.verification_confidence !== null && <span>Conf: <span className="font-medium tabular-nums">{r.verification_confidence}</span></span>}
                            <span className="capitalize">{r.source_type}</span>
                            {r.reviewer_role && <span>{r.reviewer_role}</span>}
                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          {cats.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {cats.map((c) => (
                                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{c}</span>
                              ))}
                            </div>
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-2 text-sm">
                            {r.what_felt_right && (
                              <div>
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">What felt right: </span>
                                <span className="text-foreground/80">{r.what_felt_right}</span>
                              </div>
                            )}
                            {r.what_felt_weak && (
                              <div>
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">What felt weak: </span>
                                <span className="text-foreground/80">{r.what_felt_weak}</span>
                              </div>
                            )}
                            {r.what_was_missing && (
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground">What was missing: </span>
                                <span className="text-foreground/80">{r.what_was_missing}</span>
                              </div>
                            )}
                            {r.what_felt_overstated && (
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground">What felt overstated: </span>
                                <span className="text-foreground/80">{r.what_felt_overstated}</span>
                              </div>
                            )}
                            {r.tuning_note && (
                              <div>
                                <span className="text-xs font-semibold text-primary/70">Tuning note: </span>
                                <span className="text-foreground/80">{r.tuning_note}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
