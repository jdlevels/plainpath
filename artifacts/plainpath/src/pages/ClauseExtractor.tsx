import { useState, useRef, useCallback } from "react"
import { useParams, useLocation } from "wouter"
import { useAuth } from "@clerk/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, FileText, ListChecks, Calendar, Users, DollarSign,
  Gavel, AlertTriangle, CheckCircle2, XCircle, Clock, ChevronDown,
  ChevronUp, Trash2, ArrowLeft, Loader2, AlertCircle,
  RefreshCw, Copy, Download, Check, FileType2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { clauseExtractorApi } from "@/lib/clauseExtractorApi"
import type {
  ClauseExtractorSessionDetail,
  ClauseExtractionResults,
  ClausePresence,
} from "@/lib/clauseExtractorTypes"

/* ─── Helpers ─────────────────────────────────────────────── */
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

const CLAUSE_LABELS: Record<string, string> = {
  governingLaw: "Governing Law",
  terminationClause: "Termination",
  autoRenewal: "Auto-Renewal",
  liabilityCap: "Liability Cap",
  indemnity: "Indemnification",
  confidentiality: "Confidentiality",
  assignment: "Assignment",
  disputeResolution: "Dispute Resolution",
}

/* ─── Copy hook ────────────────────────────────────────────── */
function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])
  return { copied, copy }
}

/* ─── Export helpers ────────────────────────────────────────── */
function buildSummaryText(session: ClauseExtractorSessionDetail): string {
  const r = session.results!
  const lines: string[] = [
    `Clause Extractor — ${session.fileName}`,
    `Document type: ${r.documentType ?? "Unknown"}`,
    `Extraction confidence: ${r.extractionConfidence}`,
    "",
  ]

  lines.push("=== KEY DATES ===")
  const kd = r.keyDates
  if (kd.effectiveDate) lines.push(`Effective date: ${kd.effectiveDate}`)
  if (kd.executionDate) lines.push(`Execution date: ${kd.executionDate}`)
  if (kd.expirationDate) lines.push(`Expiration date: ${kd.expirationDate}`)
  if (kd.renewalDate) lines.push(`Renewal date: ${kd.renewalDate}`)
  if (kd.noticeDeadline) lines.push(`Notice deadline: ${kd.noticeDeadline}`)
  if (kd.noticePeriod) lines.push(`Notice period: ${kd.noticePeriod}`)
  lines.push("")

  lines.push("=== PARTIES ===")
  r.parties.forEach(p => {
    lines.push(`${p.name} — ${p.role ?? p.type}${p.isSigner ? " (Signer)" : ""}`)
  })
  lines.push("")

  lines.push("=== FINANCIAL TERMS ===")
  const ft = r.financialTerms
  if (ft.paymentAmount) lines.push(`Payment amount: ${ft.paymentAmount}`)
  if (ft.paymentSchedule) lines.push(`Payment schedule: ${ft.paymentSchedule}`)
  if (ft.lateFees) lines.push(`Late fees: ${ft.lateFees}`)
  if (ft.refundLanguage) lines.push(`Refund language: ${ft.refundLanguage}`)
  ft.otherTerms.forEach(t => lines.push(`Other: ${t}`))
  lines.push("")

  lines.push("=== LEGAL CLAUSES ===")
  Object.entries(r.legalClauses).forEach(([key, clause]) => {
    const label = CLAUSE_LABELS[key] ?? key
    if ((clause as ClausePresence).present) {
      lines.push(`✓ ${label}: ${(clause as ClausePresence).summary ?? ""}`)
    } else {
      lines.push(`✗ ${label}: Not present`)
    }
  })
  lines.push("")

  lines.push("=== OBLIGATIONS ===")
  r.obligations.forEach((ob, i) => {
    lines.push(`${i + 1}. [${ob.party ?? ""}] ${ob.obligation}`)
    if (ob.deadline) lines.push(`   Deadline: ${ob.deadline}`)
    if (ob.consequence) lines.push(`   Consequence: ${ob.consequence}`)
  })
  lines.push("")

  if (r.missingFields.length > 0) {
    lines.push("=== NOT FOUND ===")
    r.missingFields.forEach(f => lines.push(`• ${f}`))
  }

  return lines.join("\n")
}

function exportObligationsCSV(session: ClauseExtractorSessionDetail) {
  const r = session.results!
  const header = ["#", "Party", "Obligation", "Deadline", "Consequence"]
  const rows = r.obligations.map((ob, i) => [
    String(i + 1),
    ob.party ?? "",
    `"${ob.obligation.replace(/"/g, '""')}"`,
    ob.deadline ?? "",
    ob.consequence ? `"${ob.consequence.replace(/"/g, '""')}"` : "",
  ])
  const csv = [header, ...rows].map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const baseName = session.fileName.replace(/\.[^.]+$/, "")
  a.download = `${baseName}-obligations.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ─── Sub-components ───────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{label}</h3>
    </div>
  )
}

function DateRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-0 gap-6">
      <span className="text-xs text-muted-foreground shrink-0 pt-px">{label}</span>
      <span className="text-xs font-medium text-foreground text-right leading-relaxed">{value}</span>
    </div>
  )
}

function ClauseCard({ clauseKey, clause }: { clauseKey: string; clause: ClausePresence }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        clause.present
          ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30"
          : "border-border/60 bg-muted/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {clause.present
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            : <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
          <span className={`text-xs font-medium leading-tight ${clause.present ? "text-foreground" : "text-muted-foreground/70"}`}>
            {CLAUSE_LABELS[clauseKey] ?? clauseKey}
          </span>
        </div>
        {clause.present && clause.summary && (
          <button onClick={() => setOpen(o => !o)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && clause.summary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{clause.summary}</p>
            {clause.snippet && (
              <p className="text-[11px] text-muted-foreground/60 mt-2 italic border-l-2 border-emerald-400/60 pl-2.5 leading-relaxed">
                "{clause.snippet}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ObligationCard({ ob, i }: { ob: ClauseExtractionResults["obligations"][number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="rounded-xl border border-border/50 bg-card p-4 flex gap-4"
    >
      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {i + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground leading-relaxed">{ob.obligation}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {ob.party && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium">
              {ob.party}
            </span>
          )}
          {ob.deadline && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />{ob.deadline}
            </span>
          )}
        </div>
        {ob.consequence && (
          <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1.5 leading-relaxed">
            <AlertTriangle className="w-3 h-3 text-amber-500 mt-px shrink-0" />
            {ob.consequence}
          </p>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Results panel ─────────────────────────────────────────── */
function ResultsPanel({
  session,
  onDelete,
}: {
  session: ClauseExtractorSessionDetail
  onDelete: () => void
}) {
  const [, setLocation] = useLocation()
  const { copied, copy } = useCopy()
  const r = session.results!

  const confidenceColor =
    r.extractionConfidence === "high"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : r.extractionConfidence === "medium"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"

  const legalClauses = Object.entries(r.legalClauses) as Array<[string, ClausePresence]>
  const presentCount = legalClauses.filter(([, c]) => c.present).length

  return (
    <div>
      {/* ── Workspace command bar — sticky top-16, sticks below 4rem navbar ── */}
      <div className="sticky top-16 z-20 border-b border-border/70 bg-background/98 backdrop-blur-sm shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
        <div className="max-w-[900px] mx-auto py-2.5 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => setLocation("/clause-extractor")}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Back to Clause Extractor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate leading-tight">{session.fileName}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-medium text-muted-foreground">Clause Extractor</span>
              {r.documentType && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-px h-auto">
                  {r.documentType}
                </Badge>
              )}
              <Badge className={`text-[10px] px-1.5 py-px h-auto ${confidenceColor}`}>
                {r.extractionConfidence} confidence
              </Badge>
              <span className="text-[10px] text-muted-foreground">{fmtBytes(session.fileSizeBytes)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5"
              onClick={() => copy(buildSummaryText(session))}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
            {r.obligations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5"
                onClick={() => exportObligationsCSV(session)}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-5 max-w-[900px] mx-auto">

      {/* Key Dates */}
      {Object.values(r.keyDates).some(Boolean) && (
        <Card className="p-5 rounded-2xl border border-border/50">
          <SectionHeader icon={Calendar} label="Key Dates" color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
          <div className="divide-y divide-border/30">
            <DateRow label="Effective date" value={r.keyDates.effectiveDate} />
            <DateRow label="Execution date" value={r.keyDates.executionDate} />
            <DateRow label="Expiration date" value={r.keyDates.expirationDate} />
            <DateRow label="Renewal date" value={r.keyDates.renewalDate} />
            <DateRow label="Notice deadline" value={r.keyDates.noticeDeadline} />
            <DateRow label="Notice period" value={r.keyDates.noticePeriod} />
          </div>
        </Card>
      )}

      {/* Parties */}
      {r.parties.length > 0 && (
        <Card className="p-5 rounded-2xl border border-border/50">
          <SectionHeader icon={Users} label="Parties" color="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" />
          <div className="space-y-2">
            {r.parties.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-2.5">
                <div>
                  <span className="text-xs font-medium text-foreground">{p.name}</span>
                  {p.role && <span className="text-[11px] text-muted-foreground ml-2">· {p.role}</span>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] capitalize">{p.type}</Badge>
                  {p.isSigner && (
                    <Badge className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">Signer</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Financial Terms */}
      {(r.financialTerms.paymentAmount || r.financialTerms.paymentSchedule || r.financialTerms.lateFees || r.financialTerms.refundLanguage || r.financialTerms.otherTerms.length > 0) && (
        <Card className="p-5 rounded-2xl border border-border/50">
          <SectionHeader icon={DollarSign} label="Financial Terms" color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" />
          <div className="divide-y divide-border/30">
            <DateRow label="Payment amount" value={r.financialTerms.paymentAmount} />
            <DateRow label="Payment schedule" value={r.financialTerms.paymentSchedule} />
            <DateRow label="Late fees" value={r.financialTerms.lateFees} />
            <DateRow label="Refund / deposit" value={r.financialTerms.refundLanguage} />
          </div>
          {r.financialTerms.otherTerms.length > 0 && (
            <ul className="mt-3 space-y-1.5 pt-1">
              {r.financialTerms.otherTerms.map((t, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 shrink-0">·</span>{t}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Legal Clauses */}
      <Card className="p-5 rounded-2xl border border-border/50">
        <div className="flex items-center gap-2.5 justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Gavel className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Legal Clauses</h3>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{presentCount} / {legalClauses.length} present</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {legalClauses.map(([key, clause]) => (
            <ClauseCard key={key} clauseKey={key} clause={clause} />
          ))}
        </div>
      </Card>

      {/* Obligations */}
      {r.obligations.length > 0 && (
        <Card className="p-5 rounded-2xl border border-border/50">
          <SectionHeader icon={ListChecks} label={`Obligations (${r.obligations.length})`} color="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400" />
          <div className="space-y-3">
            {r.obligations.map((ob, i) => (
              <ObligationCard key={i} ob={ob} i={i} />
            ))}
          </div>
        </Card>
      )}

      {/* Missing / Not Found */}
      {r.missingFields.length > 0 && (
        <Card className="p-5 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20">
          <SectionHeader icon={AlertTriangle} label="Missing / Not Found" color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" />
          <div className="flex flex-wrap gap-2">
            {r.missingFields.map((f, i) => (
              <Badge key={i} variant="outline" className="text-[11px] px-2.5 py-0.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                {f}
              </Badge>
            ))}
          </div>
        </Card>
      )}
      </div>
    </div>
  )
}

/* ─── Upload / entry point ──────────────────────────────────── */
type UploadStage = "idle" | "selected" | "uploading"

function UploadView({ onUploaded }: { onUploaded: (s: ClauseExtractorSessionDetail) => void }) {
  const { getToken } = useAuth()
  const [stage, setStage] = useState<UploadStage>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSelect = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!ext || !["pdf", "docx"].includes(ext)) {
      setError("Only PDF and DOCX files are supported.")
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File must be under 25 MB.")
      return
    }
    setError(null)
    setSelectedFile(file)
    setStage("selected")
  }, [])

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return
    setError(null)
    setStage("uploading")
    try {
      const token = await getToken().catch(() => null)
      const session = await clauseExtractorApi.createSession(selectedFile, token)
      onUploaded(session)
    } catch (e: any) {
      setError(e.message || "Upload failed. Please try again.")
      setStage("selected")
    }
  }, [selectedFile, getToken, onUploaded])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setStage("idle")
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }, [validateAndSelect])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-1">Clause Extractor</h1>
        <p className="text-sm text-muted-foreground">
          Upload a contract or agreement — key dates, parties, financial terms, legal clauses, and obligations extracted automatically.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSelect(f) }}
      />

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-purple-400 bg-purple-50/60 dark:bg-purple-950/20"
                : "border-border/60 hover:border-purple-400/60 hover:bg-muted/40"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">
                  Drop a contract here or <span className="text-purple-600 dark:text-purple-400">browse files</span>
                </p>
                <p className="text-xs text-muted-foreground">PDF or DOCX · up to 25 MB</p>
              </div>
            </div>
          </motion.div>
        )}

        {(stage === "selected" || stage === "uploading") && selectedFile && (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* File card */}
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                <FileType2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{fmtBytes(selectedFile.size)} · {selectedFile.name.split(".").pop()?.toUpperCase()}</p>
              </div>
              {stage === "selected" && (
                <button
                  onClick={clearFile}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* CTA */}
            <Button
              className="w-full h-11 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleExtract}
              disabled={stage === "uploading"}
            >
              {stage === "uploading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting clauses…
                </>
              ) : (
                <>
                  <ListChecks className="w-4 h-4" />
                  Extract Clauses
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              OpenAI analyzes the document text — usually 15–30 seconds
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {stage === "idle" && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: "Key Dates", color: "text-blue-500" },
            { icon: Users, label: "Parties", color: "text-violet-500" },
            { icon: DollarSign, label: "Financial Terms", color: "text-emerald-500" },
            { icon: ListChecks, label: "Obligations", color: "text-purple-500" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="rounded-xl border border-border/50 bg-card p-3 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Processing poll view ─────────────────────────────────── */
function ProcessingView({
  sessionId,
  onDone,
  onError,
}: {
  sessionId: string
  onDone: (s: ClauseExtractorSessionDetail) => void
  onError: (msg: string) => void
}) {
  const { getToken } = useAuth()

  useState(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const token = await getToken().catch(() => null)
        while (!cancelled) {
          await new Promise(r => setTimeout(r, 2500))
          const s = await clauseExtractorApi.getSession(sessionId, token)
          if (cancelled) return
          if (s.status === "done") { onDone(s); return }
          if (s.status === "error") { onError(s.errorMessage || "Extraction failed"); return }
        }
      } catch (e: any) {
        if (!cancelled) onError(e.message || "Network error")
      }
    }
    poll()
    return () => { cancelled = true }
  })

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="inline-block mb-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
          <ListChecks className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
      </motion.div>
      <h2 className="text-base font-semibold text-foreground mb-2">Extracting clauses…</h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        OpenAI is reading your contract. Key dates, parties, financial terms, legal clauses, and obligations are being structured. This takes about 15–30 seconds.
      </p>
      <div className="mt-6 flex items-center justify-center gap-1.5">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-purple-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
type PageState =
  | { stage: "upload" }
  | { stage: "processing"; sessionId: string; fileName: string }
  | { stage: "results"; session: ClauseExtractorSessionDetail }
  | { stage: "error"; message: string }

export default function ClauseExtractor() {
  const { id } = useParams<{ id?: string }>()
  const { getToken } = useAuth()
  const [, setLocation] = useLocation()

  const [state, setState] = useState<PageState>(() =>
    id ? { stage: "processing", sessionId: id, fileName: "" } : { stage: "upload" }
  )

  const handleUploaded = (session: ClauseExtractorSessionDetail) => {
    if (session.status === "done" && session.results) {
      setState({ stage: "results", session })
      setLocation(`/clause-extractor/${session.id}`, { replace: true })
    } else if (session.status === "error") {
      setState({ stage: "error", message: session.errorMessage || "Extraction failed" })
    } else {
      setState({ stage: "processing", sessionId: session.id, fileName: session.fileName })
      setLocation(`/clause-extractor/${session.id}`, { replace: true })
    }
  }

  const handleDone = (session: ClauseExtractorSessionDetail) => {
    setState({ stage: "results", session })
  }

  const handleDelete = async () => {
    if (state.stage !== "results") return
    try {
      const token = await getToken().catch(() => null)
      await clauseExtractorApi.deleteSession(state.session.id, token)
    } catch {}
    setState({ stage: "upload" })
    setLocation("/clause-extractor", { replace: true })
  }

  return (
    <div className="min-h-full">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {state.stage === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadView onUploaded={handleUploaded} />
            </motion.div>
          )}

          {state.stage === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProcessingView
                sessionId={state.sessionId}
                onDone={handleDone}
                onError={(msg) => setState({ stage: "error", message: msg })}
              />
            </motion.div>
          )}

          {state.stage === "results" && (
            <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ResultsPanel session={state.session} onDelete={handleDelete} />
            </motion.div>
          )}

          {state.stage === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-md mx-auto text-center py-16">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-base font-semibold text-foreground mb-2">Extraction failed</h2>
                <p className="text-sm text-muted-foreground mb-6">{state.message}</p>
                <Button onClick={() => { setState({ stage: "upload" }); setLocation("/clause-extractor") }}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Try again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
