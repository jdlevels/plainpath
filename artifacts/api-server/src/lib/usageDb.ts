import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const dataDir = path.resolve(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "plainpath-usage.sqlite")
export const usageDb = new Database(dbPath)

usageDb.exec(`
  CREATE TABLE IF NOT EXISTS analysis_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    monthKey TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    UNIQUE(email, monthKey)
  );
`)

function getMonthKey(date = new Date()) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function getUsageForCurrentMonth(email: string) {
  const monthKey = getMonthKey()
  const row = usageDb
    .prepare(
      `SELECT count FROM analysis_usage WHERE email = ? AND monthKey = ?`
    )
    .get(email, monthKey) as { count: number } | undefined

  return row?.count ?? 0
}

export function incrementUsageForCurrentMonth(email: string) {
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

export function getCurrentMonthKey() {
  return getMonthKey()
}
