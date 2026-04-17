import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const dataDir = path.resolve(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "plainpath-usage.sqlite")
export const usageDb = new Database(dbPath)

// ─── Per-tool event tracking ──────────────────────────────────────────────────
// Tracks how many times each tool is run per user per month.
// PAYWALL_ENFORCEMENT is currently off — data is collected for analytics
// and future enforcement only. No usage is blocked yet.
usageDb.exec(`
  CREATE TABLE IF NOT EXISTS tool_usage (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT NOT NULL,
    tool      TEXT NOT NULL,
    monthKey  TEXT NOT NULL,
    count     INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    UNIQUE(email, tool, monthKey)
  );
`)

// Legacy table — kept for backwards compatibility
usageDb.exec(`
  CREATE TABLE IF NOT EXISTS analysis_usage (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT NOT NULL,
    monthKey  TEXT NOT NULL,
    count     INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    UNIQUE(email, monthKey)
  );
`)

// ─── Tool keys ────────────────────────────────────────────────────────────────
export type ToolKey = "analyze" | "trust-check" | "contract-review" | "build-contract"

// ─── Month helpers ────────────────────────────────────────────────────────────
function getMonthKey(date = new Date()) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function getCurrentMonthKey() {
  return getMonthKey()
}

// ─── Per-tool usage ───────────────────────────────────────────────────────────

export function getToolUsageForCurrentMonth(email: string, tool: ToolKey): number {
  const monthKey = getMonthKey()
  const row = usageDb
    .prepare(
      `SELECT count FROM tool_usage WHERE email = ? AND tool = ? AND monthKey = ?`
    )
    .get(email, tool, monthKey) as { count: number } | undefined
  return row?.count ?? 0
}

export function incrementToolUsage(email: string, tool: ToolKey): void {
  const monthKey = getMonthKey()
  const now = new Date().toISOString()

  const existing = usageDb
    .prepare(
      `SELECT count FROM tool_usage WHERE email = ? AND tool = ? AND monthKey = ?`
    )
    .get(email, tool, monthKey) as { count: number } | undefined

  if (existing) {
    usageDb
      .prepare(
        `UPDATE tool_usage
         SET count = count + 1, updatedAt = ?
         WHERE email = ? AND tool = ? AND monthKey = ?`
      )
      .run(now, email, tool, monthKey)
  } else {
    usageDb
      .prepare(
        `INSERT INTO tool_usage (email, tool, monthKey, count, createdAt, updatedAt)
         VALUES (?, ?, ?, 1, ?, ?)`
      )
      .run(email, tool, monthKey, now, now)
  }
}

export function getAllToolUsageForCurrentMonth(email: string): Record<ToolKey, number> {
  const monthKey = getMonthKey()
  const rows = usageDb
    .prepare(
      `SELECT tool, count FROM tool_usage WHERE email = ? AND monthKey = ?`
    )
    .all(email, monthKey) as Array<{ tool: string; count: number }>

  const result: Record<ToolKey, number> = {
    "analyze": 0,
    "trust-check": 0,
    "contract-review": 0,
    "build-contract": 0,
  }
  for (const row of rows) {
    if (row.tool in result) {
      result[row.tool as ToolKey] = row.count
    }
  }
  return result
}

// ─── Legacy analysis usage (kept for backwards compat) ───────────────────────

export function getUsageForCurrentMonth(email: string): number {
  const monthKey = getMonthKey()
  const row = usageDb
    .prepare(
      `SELECT count FROM analysis_usage WHERE email = ? AND monthKey = ?`
    )
    .get(email, monthKey) as { count: number } | undefined
  return row?.count ?? 0
}

export function incrementUsageForCurrentMonth(email: string): void {
  const monthKey = getMonthKey()
  const now = new Date().toISOString()

  const existing = usageDb
    .prepare(
      `SELECT count FROM analysis_usage WHERE email = ? AND monthKey = ?`
    )
    .get(email, monthKey) as { count: number } | undefined

  if (existing) {
    usageDb
      .prepare(
        `UPDATE analysis_usage
         SET count = count + 1, updatedAt = ?
         WHERE email = ? AND monthKey = ?`
      )
      .run(now, email, monthKey)
  } else {
    usageDb
      .prepare(
        `INSERT INTO analysis_usage (email, monthKey, count, createdAt, updatedAt)
         VALUES (?, ?, 1, ?, ?)`
      )
      .run(email, monthKey, now, now)
  }
}
