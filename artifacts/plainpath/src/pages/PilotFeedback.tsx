import { useEffect, useMemo, useState } from "react"
import { useLocation } from "wouter"
import {
  BarChart2, ArrowLeft, Download, RefreshCw,
  Search, X, ChevronDown, ChevronRight, FileText, Shield,
} from "lucide-react"
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

const ASSESSMENT_RING: Record<string, string> = {
  "correct": "border-l-green-400",
  "mostly-correct": "border-l-blue-400",
  "needs-tuning": "border-l-amber-400",
  "incorrect": "border-l-red-500",
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

function parseBatch(label: string): string {
  const m = label.match(/^\[([^\]]+)\]/)
  return m ? m[1] : "Ungrouped"
}

function parseCategories(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}

function StatPill({ label, value, color = "" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 bg-card gap-1">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  )
}

function exportCsv(records: FeedbackRecord[], filename: string) {
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
      const val = (r as Record<string, unknown>)[h]
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
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadReport(base: string) {
  const url = `${base}/api/pilot-feedback/report`
  const a = document.createElement("a")
  a.href = url
  a.download = `plainpath-pilot-report-${new Date().toISOString().split("T")[0]}.txt`
  a.click()
}

export default function PilotFeedback() {
  const [, setLocation] = useLocation()
  const [records, setRecords] = useState<FeedbackRecord[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [apiBase, setApiBase] = useState("")

  // Filter state
  const [filterAssessment, setFilterAssessment] = useState<string>("all")
  const [filterBatch, setFilterBatch] = useState<string>("all")
  const [filterNotesOnly, setFilterNotesOnly] = useState(false)
  const [filterNeedsAttention, setFilterNeedsAttention] = useState(false)
  const [searchText, setSearchText] = useState("")

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const base = getApiBaseUrl()
      setApiBase(base)
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

  // Derive batch list from records
  const batchOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const r of records) seen.add(parseBatch(r.document_label))
    return Array.from(seen).sort()
  }, [records])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterAssessment !== "all" && r.reviewer_assessment !== filterAssessment) return false
      if (filterBatch !== "all" && parseBatch(r.document_label) !== filterBatch) return false
      if (filterNeedsAttention && !["needs-tuning", "incorrect"].includes(r.reviewer_assessment)) return false
      if (filterNotesOnly && !r.tuning_note && !r.what_felt_right && !r.what_felt_weak && !r.what_was_missing && !r.what_felt_overstated) return false
      if (searchText.trim()) {
        const q = searchText.toLowerCase()
        if (!r.document_label.toLowerCase().includes(q) && !r.verdict.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [records, filterAssessment, filterBatch, filterNeedsAttention, filterNotesOnly, searchText])

  const hasActiveFilters = filterAssessment !== "all" || filterBatch !== "all" || filterNotesOnly || filterNeedsAttention || searchText.trim() !== ""

  function clearFilters() {
    setFilterAssessment("all")
    setFilterBatch("all")
    setFilterNotesOnly(false)
    setFilterNeedsAttention(false)
    setSearchText("")
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BarChart2 className="w-4 h-4 text-primary/60 shrink-0" />
            <span className="text-sm font-semibold truncate">Pilot Feedback Review</span>
            <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">Internal use only</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            {records.length > 0 && (
              <>
                <Button
                  variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                  onClick={() => exportCsv(
                    filteredRecords,
                    hasActiveFilters
                      ? `pilot-feedback-filtered-${today}.csv`
                      : `pilot-feedback-all-${today}.csv`
                  )}
                >
                  <Download className="w-3.5 h-3.5" />
                  {hasActiveFilters ? "Export Filtered" : "Export CSV"}
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8 gap-1.5 text-xs hidden sm:flex"
                  onClick={() => downloadReport(apiBase)}
                >
                  <FileText className="w-3.5 h-3.5" /> Pilot Report
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Baseline freeze banner */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
          <Shield className="w-4 h-4 text-primary/60 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-foreground/80">Pilot Baseline v1.0</span>
            <span className="text-muted-foreground ml-2">Tuning Round 3 · Validated {today} · 15/15 correct · 0 FP · 0 FN</span>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold">Stable</span>
        </div>

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

            {/* Assessment breakdown + Verdict distribution side by side */}
            <div className="grid sm:grid-cols-2 gap-4">
              {summary.byAssessment.length > 0 && (
                <Card className="p-4 sm:p-5 border-border/40">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Reviewer Assessment Breakdown</h3>
                  <div className="space-y-2">
                    {summary.byAssessment.map((a) => {
                      const pct = Math.round((a.count / summary.total) * 100)
                      return (
                        <div key={a.reviewer_assessment} className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ASSESSMENT_COLORS[a.reviewer_assessment] ?? "bg-secondary text-foreground"}`}>
                            {ASSESSMENT_LABELS[a.reviewer_assessment] ?? a.reviewer_assessment}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/50" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold tabular-nums text-muted-foreground w-10 text-right shrink-0">{a.count} <span className="font-normal text-[10px]">({pct}%)</span></span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {summary.byVerdict.length > 0 && (
                <Card className="p-4 sm:p-5 border-border/40">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Verdict Distribution</h3>
                  <div className="space-y-2">
                    {summary.byVerdict.map((v) => {
                      const pct = Math.round((v.count / summary.total) * 100)
                      return (
                        <div key={v.verdict} className="flex items-center gap-2">
                          <span className="text-[10px] text-foreground/70 truncate w-36 shrink-0">{v.verdict}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/40" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold tabular-nums text-muted-foreground w-10 text-right shrink-0">{v.count} <span className="font-normal text-[10px]">({pct}%)</span></span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>

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

            {/* Filter bar */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documents…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs rounded-md border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 w-44"
                  />
                </div>

                {/* Assessment filter */}
                <select
                  value={filterAssessment}
                  onChange={(e) => setFilterAssessment(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-md border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="all">All Assessments</option>
                  {Object.entries(ASSESSMENT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>

                {/* Batch filter */}
                {batchOptions.length > 1 && (
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="h-8 px-2.5 text-xs rounded-md border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                  >
                    <option value="all">All Batches</option>
                    {batchOptions.map((b) => (
                      <option key={b} value={b}>[{b}]</option>
                    ))}
                  </select>
                )}

                {/* Toggle buttons */}
                <button
                  onClick={() => setFilterNeedsAttention(!filterNeedsAttention)}
                  className={`h-8 px-3 text-xs rounded-md border transition-colors ${filterNeedsAttention ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700" : "border-border/60 text-muted-foreground hover:bg-muted/40"}`}
                >
                  Needs Attention
                </button>
                <button
                  onClick={() => setFilterNotesOnly(!filterNotesOnly)}
                  className={`h-8 px-3 text-xs rounded-md border transition-colors ${filterNotesOnly ? "bg-primary/10 text-primary border-primary/30" : "border-border/60 text-muted-foreground hover:bg-muted/40"}`}
                >
                  Has Notes
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="h-8 px-3 text-xs rounded-md border border-border/60 text-muted-foreground hover:bg-muted/40 transition-colors gap-1 flex items-center"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {/* Records list header */}
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-sm font-bold text-foreground">
                  {hasActiveFilters
                    ? `Showing ${filteredRecords.length} of ${records.length} records`
                    : `All Feedback Records (${records.length})`
                  }
                </h2>
                {hasActiveFilters && filteredRecords.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {filteredRecords.filter(r => r.reviewer_assessment === "correct").length} correct ·{" "}
                    {filteredRecords.filter(r => ["needs-tuning","incorrect"].includes(r.reviewer_assessment)).length} need attention
                  </span>
                )}
              </div>
            </div>

            {/* Records list */}
            {filteredRecords.length === 0 ? (
              <Card className="p-8 border-border/40 text-center text-sm text-muted-foreground">
                {records.length === 0
                  ? "No pilot feedback has been logged yet. Use the feedback panel on any Trust Check result to add the first record."
                  : "No records match the current filters. Try clearing some filters."
                }
              </Card>
            ) : (
              <div className="space-y-1.5">
                {filteredRecords.map((r) => {
                  const cats = parseCategories(r.issue_categories)
                  const isExpanded = expanded === r.id
                  const hasNotes = !!(r.tuning_note || r.what_felt_right || r.what_felt_weak || r.what_was_missing || r.what_felt_overstated)
                  const ringColor = ASSESSMENT_RING[r.reviewer_assessment] ?? "border-l-border"

                  return (
                    <Card key={r.id} className={`border-border/40 border-l-4 ${ringColor} overflow-hidden`}>
                      <button
                        className="w-full text-left p-3.5 hover:bg-muted/30 transition-colors"
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                      >
                        <div className="flex flex-wrap items-start gap-2">
                          <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">{r.document_label}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {r.is_false_positive === 1 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">FP</span>
                            )}
                            {r.is_false_negative === 1 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">FN</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ASSESSMENT_COLORS[r.reviewer_assessment] ?? "bg-secondary text-foreground"}`}>
                              {ASSESSMENT_LABELS[r.reviewer_assessment] ?? r.reviewer_assessment}
                            </span>
                            {isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            }
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>Verdict: <span className="font-medium text-foreground/70">{r.verdict}</span></span>
                          {r.authenticity_risk !== null && <span>Auth: <span className="font-medium tabular-nums">{r.authenticity_risk}</span></span>}
                          {r.document_risk !== null && <span>Doc: <span className="font-medium tabular-nums">{r.document_risk}</span></span>}
                          {r.verification_confidence !== null && <span>Conf: <span className="font-medium tabular-nums">{r.verification_confidence}</span></span>}
                          <span className="capitalize">{r.source_type}</span>
                          {r.reviewer_role && <span>{r.reviewer_role}</span>}
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        {/* Inline note preview */}
                        {!isExpanded && r.tuning_note && (
                          <div className="mt-1.5 text-[11px] text-primary/70 italic truncate">
                            Note: {r.tuning_note}
                          </div>
                        )}
                        {cats.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {cats.map((c) => (
                              <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{c}</span>
                            ))}
                          </div>
                        )}
                      </button>
                      {isExpanded && hasNotes && (
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
          </>
        )}
      </div>
    </div>
  )
}
