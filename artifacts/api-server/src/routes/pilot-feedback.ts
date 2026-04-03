import { Router } from "express"
import {
  savePilotFeedback,
  listPilotFeedback,
  getPilotFeedbackSummary,
  type PilotFeedbackInput,
  type PilotFeedbackRecord,
} from "../lib/pilotFeedbackDb.js"

const router = Router()

const VALID_ASSESSMENTS = ["correct", "mostly-correct", "needs-tuning", "incorrect"]
const VALID_SOURCE_TYPES = ["demo", "upload", "paste"]
const VALID_CATEGORIES = [
  "Verdict too harsh",
  "Verdict too soft",
  "Authenticity Risk too high",
  "Authenticity Risk too low",
  "Document Risk too high",
  "Document Risk too low",
  "Verification Confidence too high",
  "Verification Confidence too low",
  "Scam indicators weak",
  "Scam indicators repetitive",
  "Structural findings weak",
  "Metadata findings weak",
  "Safe next steps weak",
  "Contact verification guidance weak",
  "Deadline/pressure extraction issue",
  "UI readability issue",
  "Other",
]

router.post("/pilot-feedback", (req, res) => {
  const body = req.body as Partial<PilotFeedbackInput>

  if (!body.document_label?.trim()) {
    return res.status(400).json({ error: "document_label is required" })
  }
  if (!body.verdict?.trim()) {
    return res.status(400).json({ error: "verdict is required" })
  }
  if (!VALID_ASSESSMENTS.includes(body.reviewer_assessment ?? "")) {
    return res.status(400).json({ error: `reviewer_assessment must be one of: ${VALID_ASSESSMENTS.join(", ")}` })
  }
  if (!VALID_SOURCE_TYPES.includes(body.source_type ?? "")) {
    return res.status(400).json({ error: `source_type must be one of: ${VALID_SOURCE_TYPES.join(", ")}` })
  }

  const categories = Array.isArray(body.issue_categories)
    ? body.issue_categories.filter((c: string) => VALID_CATEGORIES.includes(c))
    : []

  const id = savePilotFeedback({
    document_label: body.document_label,
    document_type: body.document_type,
    source_type: body.source_type!,
    verdict: body.verdict,
    authenticity_risk: typeof body.authenticity_risk === "number" ? body.authenticity_risk : undefined,
    document_risk: typeof body.document_risk === "number" ? body.document_risk : undefined,
    verification_confidence: typeof body.verification_confidence === "number" ? body.verification_confidence : undefined,
    reviewer_assessment: body.reviewer_assessment!,
    is_false_positive: body.is_false_positive === true,
    is_false_negative: body.is_false_negative === true,
    issue_categories: categories,
    what_felt_right: body.what_felt_right,
    what_felt_weak: body.what_felt_weak,
    what_was_missing: body.what_was_missing,
    what_felt_overstated: body.what_felt_overstated,
    tuning_note: body.tuning_note,
    reviewer_role: body.reviewer_role,
  })

  return res.status(201).json({ success: true, id })
})

router.get("/pilot-feedback/summary", (_req, res) => {
  const summary = getPilotFeedbackSummary()
  return res.json(summary)
})

router.get("/pilot-feedback/report", (_req, res) => {
  const records = listPilotFeedback()
  const summary = getPilotFeedbackSummary()
  const now = new Date().toISOString().split("T")[0]

  const parseBatch = (label: string) => {
    const m = label.match(/^\[([^\]]+)\]/)
    return m ? m[1] : "Ungrouped"
  }

  const batches: Record<string, PilotFeedbackRecord[]> = {}
  for (const r of records) {
    const b = parseBatch(r.document_label)
    if (!batches[b]) batches[b] = []
    batches[b].push(r)
  }

  const pct = (n: number) => summary.total > 0 ? `${Math.round((n / summary.total) * 100)}%` : "0%"

  const assessmentCounts: Record<string, number> = {}
  for (const a of summary.byAssessment) assessmentCounts[a.reviewer_assessment] = a.count

  const lines: string[] = []
  lines.push("PlainPath — Document Trust Check Pilot Session Report")
  lines.push("=".repeat(55))
  lines.push(`Generated:  ${now}`)
  lines.push(`Baseline:   Tuning Round 3 (validated ${now})`)
  lines.push(`Status:     BASELINE STABLE — pilot operations mode`)
  lines.push("")

  lines.push("OVERALL RESULTS")
  lines.push("-".repeat(40))
  lines.push(`Total records:     ${summary.total}`)
  lines.push(`Correct:           ${assessmentCounts["correct"] ?? 0} (${pct(assessmentCounts["correct"] ?? 0)})`)
  lines.push(`Mostly Correct:    ${assessmentCounts["mostly-correct"] ?? 0} (${pct(assessmentCounts["mostly-correct"] ?? 0)})`)
  lines.push(`Needs Tuning:      ${assessmentCounts["needs-tuning"] ?? 0} (${pct(assessmentCounts["needs-tuning"] ?? 0)})`)
  lines.push(`Incorrect:         ${assessmentCounts["incorrect"] ?? 0} (${pct(assessmentCounts["incorrect"] ?? 0)})`)
  lines.push(`False Positives:   ${summary.falsePosCount}`)
  lines.push(`False Negatives:   ${summary.falseNegCount}`)
  lines.push("")

  lines.push("VERDICT DISTRIBUTION")
  lines.push("-".repeat(40))
  for (const v of summary.byVerdict) {
    lines.push(`  ${v.verdict.padEnd(35)} ${v.count}`)
  }
  lines.push("")

  lines.push("BATCH BREAKDOWN")
  lines.push("-".repeat(40))
  const batchKeys = Object.keys(batches).sort()
  for (const bKey of batchKeys) {
    const br = batches[bKey]
    const bCorrect = br.filter(r => r.reviewer_assessment === "correct").length
    const bMostly = br.filter(r => r.reviewer_assessment === "mostly-correct").length
    const bTuning = br.filter(r => r.reviewer_assessment === "needs-tuning").length
    const bWrong = br.filter(r => r.reviewer_assessment === "incorrect").length
    const bFP = br.filter(r => r.is_false_positive === 1).length
    const bFN = br.filter(r => r.is_false_negative === 1).length
    lines.push(`[${bKey}] — ${br.length} records`)
    lines.push(`  Correct: ${bCorrect}  Mostly: ${bMostly}  Tuning: ${bTuning}  Wrong: ${bWrong}  FP: ${bFP}  FN: ${bFN}`)
  }
  lines.push("")

  lines.push("TOP ISSUE CATEGORIES")
  lines.push("-".repeat(40))
  for (const { category, count } of summary.topCategories) {
    lines.push(`  ${String(count).padStart(3)}x  ${category}`)
  }
  lines.push("")

  const needAttention = records.filter(r => ["needs-tuning", "incorrect"].includes(r.reviewer_assessment))
  if (needAttention.length > 0) {
    lines.push("RECORDS NEEDING ATTENTION")
    lines.push("-".repeat(40))
    for (const r of needAttention) {
      const cats: string[] = (() => { try { return JSON.parse(r.issue_categories) } catch { return [] } })()
      lines.push(`• ${r.document_label}`)
      lines.push(`  Assessment: ${r.reviewer_assessment}  |  Verdict: ${r.verdict}`)
      if (r.authenticity_risk !== null) lines.push(`  Scores — Auth:${r.authenticity_risk}  DocRisk:${r.document_risk ?? "—"}  Conf:${r.verification_confidence ?? "—"}`)
      if (cats.length > 0) lines.push(`  Issues: ${cats.join(", ")}`)
      if (r.tuning_note) lines.push(`  Note: ${r.tuning_note}`)
      if (r.what_felt_weak) lines.push(`  Weak: ${r.what_felt_weak}`)
      if (r.what_was_missing) lines.push(`  Missing: ${r.what_was_missing}`)
      lines.push("")
    }
  }

  const withNotes = records.filter(r =>
    r.tuning_note || r.what_felt_right || r.what_felt_weak || r.what_was_missing || r.what_felt_overstated
  )
  if (withNotes.length > 0) {
    lines.push("REVIEWER NOTES")
    lines.push("-".repeat(40))
    for (const r of withNotes) {
      lines.push(`• ${r.document_label}  [${r.reviewer_assessment}]`)
      if (r.what_felt_right) lines.push(`  Felt right: ${r.what_felt_right}`)
      if (r.what_felt_weak) lines.push(`  Felt weak: ${r.what_felt_weak}`)
      if (r.what_was_missing) lines.push(`  Missing: ${r.what_was_missing}`)
      if (r.what_felt_overstated) lines.push(`  Overstated: ${r.what_felt_overstated}`)
      if (r.tuning_note) lines.push(`  Note: ${r.tuning_note}`)
      lines.push("")
    }
  }

  lines.push("=".repeat(55))
  lines.push("END OF REPORT")

  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.setHeader("Content-Disposition", `attachment; filename="plainpath-pilot-report-${now}.txt"`)
  return res.send(lines.join("\n"))
})

router.get("/pilot-feedback", (_req, res) => {
  const records = listPilotFeedback()
  return res.json({ records })
})

router.get("/pilot-feedback/categories", (_req, res) => {
  return res.json({ categories: VALID_CATEGORIES })
})

export default router
