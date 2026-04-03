import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const dataDir = path.resolve(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "plainpath-pilot-feedback.sqlite")
export const pilotFeedbackDb = new Database(dbPath)

pilotFeedbackDb.exec(`
  CREATE TABLE IF NOT EXISTS pilot_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  );
`)

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

export function savePilotFeedback(input: PilotFeedbackInput): number {
  const result = pilotFeedbackDb
    .prepare(`
      INSERT INTO pilot_feedback (
        document_label, document_type, source_type, verdict,
        authenticity_risk, document_risk, verification_confidence,
        reviewer_assessment, is_false_positive, is_false_negative,
        issue_categories, what_felt_right, what_felt_weak,
        what_was_missing, what_felt_overstated, tuning_note,
        reviewer_role, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
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
    )
  return result.lastInsertRowid as number
}

export function listPilotFeedback(): PilotFeedbackRecord[] {
  return pilotFeedbackDb
    .prepare(`SELECT * FROM pilot_feedback ORDER BY created_at DESC`)
    .all() as PilotFeedbackRecord[]
}

export function getPilotFeedbackSummary() {
  const total = (pilotFeedbackDb
    .prepare(`SELECT COUNT(*) as count FROM pilot_feedback`)
    .get() as { count: number }).count

  const byAssessment = pilotFeedbackDb
    .prepare(`SELECT reviewer_assessment, COUNT(*) as count FROM pilot_feedback GROUP BY reviewer_assessment ORDER BY count DESC`)
    .all() as { reviewer_assessment: string; count: number }[]

  const byVerdict = pilotFeedbackDb
    .prepare(`SELECT verdict, COUNT(*) as count FROM pilot_feedback GROUP BY verdict ORDER BY count DESC`)
    .all() as { verdict: string; count: number }[]

  const falsePosCount = (pilotFeedbackDb
    .prepare(`SELECT COUNT(*) as count FROM pilot_feedback WHERE is_false_positive = 1`)
    .get() as { count: number }).count

  const falseNegCount = (pilotFeedbackDb
    .prepare(`SELECT COUNT(*) as count FROM pilot_feedback WHERE is_false_negative = 1`)
    .get() as { count: number }).count

  const allCategories = (pilotFeedbackDb
    .prepare(`SELECT issue_categories FROM pilot_feedback WHERE issue_categories != '[]'`)
    .all() as { issue_categories: string }[])
    .flatMap((row) => {
      try { return JSON.parse(row.issue_categories) as string[] } catch { return [] }
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
