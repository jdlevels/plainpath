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
// row (UNIQUE on email); re-submitting the form refreshes the token only after
// the per-recipient cooldown has elapsed.
waitlistDb.exec(`
  CREATE TABLE IF NOT EXISTS pending_waitlist_verifications (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          TEXT UNIQUE NOT NULL,
    platform       TEXT NOT NULL DEFAULT 'both',
    source         TEXT NOT NULL DEFAULT 'marketing',
    token          TEXT UNIQUE NOT NULL,
    expires_at     TEXT NOT NULL,
    created_at     TEXT NOT NULL,
    last_sent_at   TEXT NOT NULL
  )
`)

// Migrate existing rows that are missing the last_sent_at column (added later).
try {
  waitlistDb.exec(`ALTER TABLE pending_waitlist_verifications ADD COLUMN last_sent_at TEXT NOT NULL DEFAULT ''`)
} catch {
  // Column already exists — ignore.
}

// Minimum gap between verification emails sent to the same address (10 minutes).
const EMAIL_RESEND_COOLDOWN_MS = 10 * 60 * 1000

export function isAlreadyOnWaitlist(email: string): boolean {
  const row = waitlistDb
    .prepare("SELECT id FROM mobile_waitlist WHERE email = ?")
    .get(email.toLowerCase().trim())
  return !!row
}

/**
 * Create (or refresh) a pending verification record for the given email.
 *
 * Returns `{ token, shouldSendEmail }`.  `shouldSendEmail` is false when a
 * verification email was already dispatched to this address within the
 * per-recipient cooldown window — the caller should NOT send another email in
 * that case so the endpoint cannot be used to flood an arbitrary inbox.
 */
export function createPendingVerification(
  email: string,
  platform: "ios" | "android" | "both",
  source = "marketing",
): { token: string; shouldSendEmail: boolean } {
  const normalised = email.toLowerCase().trim()
  const now = new Date()

  // Check for an existing pending record still within the cooldown window.
  const existing = waitlistDb
    .prepare(
      "SELECT token, last_sent_at FROM pending_waitlist_verifications WHERE email = ?",
    )
    .get(normalised) as { token: string; last_sent_at: string } | undefined

  if (existing) {
    const lastSent = existing.last_sent_at ? new Date(existing.last_sent_at).getTime() : 0
    if (now.getTime() - lastSent < EMAIL_RESEND_COOLDOWN_MS) {
      // Still within cooldown — return the existing token but suppress the email.
      return { token: existing.token, shouldSendEmail: false }
    }
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const nowIso = now.toISOString()

  waitlistDb
    .prepare(
      `INSERT INTO pending_waitlist_verifications
         (email, platform, source, token, expires_at, created_at, last_sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         platform     = excluded.platform,
         source       = excluded.source,
         token        = excluded.token,
         expires_at   = excluded.expires_at,
         created_at   = excluded.created_at,
         last_sent_at = excluded.last_sent_at`,
    )
    .run(normalised, platform, source, token, expiresAt, nowIso, nowIso)

  return { token, shouldSendEmail: true }
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
