import { pool } from "@workspace/db"

const initPromise = pool.query(`
  CREATE TABLE IF NOT EXISTS pilot_feedback (
    id SERIAL PRIMARY KEY,
    document_label TEXT NOT NULL,
    document_type TEXT,
    source_type TEXT NOT NULL,
    verdict TEXT NOT NULL,
    authenticity_risk INTEGER,
    document_risk INTEGER,
    verification_confidence INTEGER,
    reviewer_assessment TEXT NOT NULL,
    is_false_positive INTEGER NOT NULL DEFAULT 0,
    is_false_negative INTEGER NOT NULL DEFAULT 0,
    issue_categories TEXT NOT NULL DEFAULT '[]',
    what_felt_right TEXT,
    what_felt_weak TEXT,
    what_was_missing TEXT,
    what_felt_overstated TEXT,
    tuning_note TEXT,
    reviewer_role TEXT,
    created_at TEXT NOT NULL
  )
`)

export async function ensureTable() {
  await initPromise
}

export interface PilotFeedbackRecord {
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

export interface PilotFeedbackInput {
  document_label: string
  document_type?: string
  source_type: string
  verdict: string
  authenticity_risk?: number
  document_risk?: number
  verification_confidence?: number
  reviewer_assessment: string
  is_false_positive: boolean
  is_false_negative: boolean
  issue_categories: string[]
  what_felt_right?: string
  what_felt_weak?: string
  what_was_missing?: string
  what_felt_overstated?: string
  tuning_note?: string
  reviewer_role?: string
}

export async function savePilotFeedback(input: PilotFeedbackInput): Promise<number> {
  await initPromise
  const res = await pool.query<{ id: number }>(
    `INSERT INTO pilot_feedback (
      document_label, document_type, source_type, verdict,
      authenticity_risk, document_risk, verification_confidence,
      reviewer_assessment, is_false_positive, is_false_negative,
      issue_categories, what_felt_right, what_felt_weak,
      what_was_missing, what_felt_overstated, tuning_note,
      reviewer_role, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING id`,
    [
      input.document_label.trim(),
      input.document_type ?? null,
      input.source_type,
      input.verdict,
      input.authenticity_risk ?? null,
      input.document_risk ?? null,
      input.verification_confidence ?? null,
      input.reviewer_assessment,
      input.is_false_positive ? 1 : 0,
      input.is_false_negative ? 1 : 0,
      JSON.stringify(input.issue_categories ?? []),
      input.what_felt_right?.trim() || null,
      input.what_felt_weak?.trim() || null,
      input.what_was_missing?.trim() || null,
      input.what_felt_overstated?.trim() || null,
      input.tuning_note?.trim() || null,
      input.reviewer_role?.trim() || null,
      new Date().toISOString(),
    ],
  )
  return res.rows[0].id
}

export async function listPilotFeedback(): Promise<PilotFeedbackRecord[]> {
  await initPromise
  const res = await pool.query<PilotFeedbackRecord>(
    `SELECT * FROM pilot_feedback ORDER BY created_at DESC`,
  )
  return res.rows
}

export async function getPilotFeedbackSummary() {
  await initPromise

  const totalRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM pilot_feedback`,
  )
  const total = parseInt(totalRes.rows[0].count, 10)

  const byAssessmentRes = await pool.query<{ reviewer_assessment: string; count: string }>(
    `SELECT reviewer_assessment, COUNT(*) as count FROM pilot_feedback
     GROUP BY reviewer_assessment ORDER BY count DESC`,
  )
  const byAssessment = byAssessmentRes.rows.map((r) => ({
    reviewer_assessment: r.reviewer_assessment,
    count: parseInt(r.count, 10),
  }))

  const byVerdictRes = await pool.query<{ verdict: string; count: string }>(
    `SELECT verdict, COUNT(*) as count FROM pilot_feedback
     GROUP BY verdict ORDER BY count DESC`,
  )
  const byVerdict = byVerdictRes.rows.map((r) => ({
    verdict: r.verdict,
    count: parseInt(r.count, 10),
  }))

  const fpRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM pilot_feedback WHERE is_false_positive = 1`,
  )
  const falsePosCount = parseInt(fpRes.rows[0].count, 10)

  const fnRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM pilot_feedback WHERE is_false_negative = 1`,
  )
  const falseNegCount = parseInt(fnRes.rows[0].count, 10)

  const catRes = await pool.query<{ issue_categories: string }>(
    `SELECT issue_categories FROM pilot_feedback WHERE issue_categories != '[]'`,
  )
  const allCategories = catRes.rows.flatMap((row) => {
    try {
      return JSON.parse(row.issue_categories) as string[]
    } catch {
      return []
    }
  })

  const categoryCounts: Record<string, number> = {}
  for (const cat of allCategories) {
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([category, count]) => ({ category, count }))

  return { total, byAssessment, byVerdict, falsePosCount, falseNegCount, topCategories }
}
