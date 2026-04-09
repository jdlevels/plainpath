import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Scale, UploadCloud, Loader2, AlertCircle, Copy, Check,
  ChevronDown, ChevronUp, ArrowLeft, RotateCcw, FileText,
  ShieldAlert, AlertTriangle, CheckCircle2, X as XIcon,
  Lock, ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { getApiBaseUrl } from "@/lib/api"
import { useLocation } from "wouter"

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

function ClauseCard({ clause }: { clause: ClauseResult }) {
  const [open, setOpen] = useState(clause.rating !== "fair")
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

function ResultsView({ result, onReset }: { result: ReviewResult; onReset: () => void }) {
  const redFlags = result.clauses.filter(c => c.rating === "red-flag").length
  const watchOuts = result.clauses.filter(c => c.rating === "watch-out").length
  const fair = result.clauses.filter(c => c.rating === "fair").length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Contract Review Results</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Clause-by-clause review — read this before you sign</p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Review Another
        </Button>
      </div>

      {/* Overall score */}
      <div className={`border rounded-2xl p-6 ${scoreBg(result.overallScore)}`}>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center min-w-[80px]">
            <p className={`text-6xl font-bold font-display ${scoreColor(result.overallScore)}`}>{result.overallScore}</p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xl font-bold mb-2 ${scoreColor(result.overallScore)}`}>{result.verdict}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/20 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-600 dark:text-red-400">{redFlags}</span>
            <span className="text-muted-foreground">red flag{redFlags !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-amber-600 dark:text-amber-400">{watchOuts}</span>
            <span className="text-muted-foreground">watch-out{watchOuts !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fair}</span>
            <span className="text-muted-foreground">fair clause{fair !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Not legal advice */}
      <div className="bg-muted/30 border border-border/30 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        This is an AI-assisted contract review for informational purposes only. It is not legal advice. Always consult a qualified attorney before signing any legal agreement.
      </div>

      {/* Clause-by-clause */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Clause-by-Clause Review</h3>
        {result.clauses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No specific clauses were identified for review.</p>
        ) : (
          result.clauses.map(clause => <ClauseCard key={clause.id} clause={clause} />)
        )}
      </div>

      {/* Missing protections */}
      {result.missingProtections && result.missingProtections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Missing Protections</h3>
          <Card className="border-amber-200/60 dark:border-amber-900/40">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                These are standard protections a fair contract of this type should include — but this one doesn't. Consider requesting them before signing.
              </p>
              <ul className="space-y-2.5">
                {result.missingProtections.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pre-signing checklist */}
      {result.preSigningChecklist && result.preSigningChecklist.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Before You Sign</h3>
          <Card className="border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Work through this checklist before you put pen to paper.
              </p>
              <ul className="space-y-2.5">
                {result.preSigningChecklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded border border-blue-300 dark:border-blue-700 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <ClipboardList className="w-3 h-3 text-blue-500" />
                    </div>
                    <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  )
}

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

  if (result) return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <ResultsView result={result} onReset={handleReset} />
      </div>
    </div>
  )

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
                            <button
                              onClick={e => { e.stopPropagation(); setFile(null) }}
                              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
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
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Reviewing contract…</>
                ) : (
                  <><Scale className="w-4 h-4" /> Review This Contract</>
                )}
              </Button>

              {loading && (
                <p className="text-center text-xs text-muted-foreground animate-pulse">
                  Reading every clause… this typically takes 20–40 seconds
                </p>
              )}
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
