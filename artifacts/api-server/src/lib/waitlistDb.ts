import Database from "better-sqlite3"
import fs from "fs"
import path from "path"
import crypto from "crypto"

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

// Pending verifications — records created on signup, consumed on verify click.
// Tokens expire after 24 hours. A single email may have at most one pending
// row (UNIQUE on email); re-submitting the form refreshes the token.
waitlistDb.exec(`
  CREATE TABLE IF NOT EXISTS pending_waitlist_verifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    platform   TEXT NOT NULL DEFAULT 'both',
    source     TEXT NOT NULL DEFAULT 'marketing',
    token      TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`)

export function isAlreadyOnWaitlist(email: string): boolean {
  const row = waitlistDb
    .prepare("SELECT id FROM mobile_waitlist WHERE email = ?")
    .get(email.toLowerCase().trim())
  return !!row
}

/**
 * Create (or refresh) a pending verification record for the given email.
 * Returns the opaque token that should be embedded in the verification link.
 */
export function createPendingVerification(
  email: string,
  platform: "ios" | "android" | "both",
  source = "marketing",
): string {
  const token = crypto.randomBytes(32).toString("hex")
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const normalised = email.toLowerCase().trim()

  // INSERT OR REPLACE so re-submits refresh the token rather than error.
  waitlistDb
    .prepare(
      `INSERT INTO pending_waitlist_verifications
         (email, platform, source, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         platform   = excluded.platform,
         source     = excluded.source,
         token      = excluded.token,
         expires_at = excluded.expires_at,
         created_at = excluded.created_at`,
    )
    .run(normalised, platform, source, token, expiresAt, now.toISOString())

  return token
}

/**
 * Validate a verification token.  On success:
 *   - Deletes the pending row (one-time use).
 *   - Inserts/updates the confirmed waitlist row.
 * Returns `{ email, platform }` on success, or `null` if the token is
 * unknown or expired.
 */
export function confirmVerification(
  token: string,
): { email: string; platform: string; inserted: boolean } | null {
  const row = waitlistDb
    .prepare(
      "SELECT email, platform, source, expires_at FROM pending_waitlist_verifications WHERE token = ?",
    )
    .get(token) as
    | { email: string; platform: string; source: string; expires_at: string }
    | undefined

  if (!row) return null
  if (new Date(row.expires_at) < new Date()) {
    // Expired — clean up and reject.
    waitlistDb
      .prepare("DELETE FROM pending_waitlist_verifications WHERE token = ?")
      .run(token)
    return null
  }

  // Consume the token.
  waitlistDb
    .prepare("DELETE FROM pending_waitlist_verifications WHERE token = ?")
    .run(token)

  // Upsert into the confirmed waitlist.
  const existing = waitlistDb
    .prepare("SELECT id FROM mobile_waitlist WHERE email = ?")
    .get(row.email)

  if (existing) {
    waitlistDb
      .prepare(
        "UPDATE mobile_waitlist SET platform = ?, source = ? WHERE email = ?",
      )
      .run(row.platform, row.source, row.email)
    return { email: row.email, platform: row.platform, inserted: false }
  }

  waitlistDb
    .prepare(
      "INSERT INTO mobile_waitlist (email, platform, source, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(row.email, row.platform, row.source, new Date().toISOString())

  return { email: row.email, platform: row.platform, inserted: true }
}

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
