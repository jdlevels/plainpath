import { Router } from "express"
import {
  savePilotFeedback,
  listPilotFeedback,
  getPilotFeedbackSummary,
  type PilotFeedbackInput,
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

router.get("/pilot-feedback", (_req, res) => {
  const records = listPilotFeedback()
  return res.json({ records })
})

router.get("/pilot-feedback/categories", (_req, res) => {
  return res.json({ categories: VALID_CATEGORIES })
})

export default router
