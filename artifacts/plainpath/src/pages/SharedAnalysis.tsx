import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import { getApiBaseUrl } from "@/lib/api"
import { Loader2, ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DocumentAnalysis } from "@workspace/api-client-react"

interface SharedData {
  analysis: DocumentAnalysis
  title: string | null
  createdAt: string
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground leading-relaxed">{value}</span>
    </div>
  )
}

export default function SharedAnalysis({ token }: { token: string }) {
  const [, setLocation] = useLocation()
  const [data, setData] = useState<SharedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const base = getApiBaseUrl()
        const res = await fetch(`${base}/api/shares/${token}`)
        if (!res.ok) throw new Error(res.status === 404 ? "Share link not found or expired." : "Failed to load shared analysis.")
        const json = await res.json() as SharedData
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-foreground font-semibold">{error ?? "Could not load analysis"}</p>
        <p className="text-sm text-muted-foreground">Share links expire after 30 days.</p>
        <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to PlainPath
        </Button>
      </div>
    )
  }

  const analysis = data.analysis
  const sharedDate = new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> PlainPath
            </Button>
            <Badge variant="secondary" className="text-xs">Shared Analysis · {sharedDate}</Badge>
          </div>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold">{analysis.title || "Shared Document Analysis"}</h1>
          </div>
          {analysis.documentType && (
            <p className="text-sm text-muted-foreground ml-13 pl-0.5">{analysis.documentType}</p>
          )}
        </motion.div>

        {/* Plain English Summary */}
        {analysis.summary && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-5 border-border/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Overview</p>
              <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
            </Card>
          </motion.div>
        )}

        {/* Action Steps */}
        {analysis.actionSteps && analysis.actionSteps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-5 border-border/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Action Steps ({analysis.actionSteps.length})
              </p>
              <div className="space-y-2">
                {analysis.actionSteps.slice(0, 10).map((step, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                    <span className="text-xs font-mono text-muted-foreground/60 w-5 pt-0.5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{step.step || step.title}</p>
                      {step.explanation && <p className="text-xs text-muted-foreground mt-0.5">{step.explanation}</p>}
                    </div>
                  </div>
                ))}
                {analysis.actionSteps.length > 10 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    + {analysis.actionSteps.length - 10} more steps
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Deadlines */}
        {analysis.deadlines && analysis.deadlines.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-5 border-border/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Deadlines ({analysis.deadlines.length})
              </p>
              <div className="space-y-2">
                {analysis.deadlines.map((dl, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${dl.isHard ? "bg-red-50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/30" : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{dl.title}</p>
                      {dl.date && <p className="text-xs text-muted-foreground">{dl.date}</p>}
                      {dl.description && <p className="text-xs text-muted-foreground mt-1">{dl.description}</p>}
                    </div>
                    {dl.isHard && <Badge variant="destructive" className="text-[10px] uppercase shrink-0">Hard</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Required Documents */}
        {analysis.requiredDocuments && analysis.requiredDocuments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-5 border-border/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Required Documents ({analysis.requiredDocuments.length})
              </p>
              <div className="space-y-1.5">
                {analysis.requiredDocuments.map((doc, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span className="text-foreground">{typeof doc === "string" ? doc : (doc as { document?: string }).document ?? ""}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4"
        >
          <p className="text-sm text-muted-foreground mb-3">
            Want to analyze your own documents?
          </p>
          <Button onClick={() => setLocation("/")} className="gap-2">
            Try PlainPath <ArrowLeft className="w-4 h-4 rotate-180" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
