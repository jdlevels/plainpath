import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const dataDir = path.resolve(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "plainpath-waitlist.sqlite")
export const waitlistDb = new Database(dbPath)

waitlistDb.exec(`
  CREATE TABLE IF NOT EXISTS mobile_waitlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    platform   TEXT NOT NULL DEFAULT 'both',
    source     TEXT NOT NULL DEFAULT 'marketing',
    created_at TEXT NOT NULL
  )
`)

export function addToWaitlist(
  email: string,
  platform: "ios" | "android" | "both",
  source = "marketing",
): { inserted: boolean } {
  const existing = waitlistDb
    .prepare("SELECT id FROM mobile_waitlist WHERE email = ?")
    .get(email.toLowerCase().trim())

  if (existing) {
    waitlistDb
      .prepare("UPDATE mobile_waitlist SET platform = ?, source = ? WHERE email = ?")
      .run(platform, source, email.toLowerCase().trim())
    return { inserted: false }
  }

  waitlistDb
    .prepare(
      "INSERT INTO mobile_waitlist (email, platform, source, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(email.toLowerCase().trim(), platform, source, new Date().toISOString())

  return { inserted: true }
}

export function getWaitlistCount(): number {
  const row = waitlistDb
    .prepare("SELECT COUNT(*) AS n FROM mobile_waitlist")
    .get() as { n: number }
  return row.n ?? 0
}
