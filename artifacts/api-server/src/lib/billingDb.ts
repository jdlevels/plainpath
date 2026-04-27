import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const dataDir = path.resolve(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "plainpath-billing.sqlite")
export const billingDb = new Database(dbPath)

billingDb.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    email                  TEXT UNIQUE NOT NULL,
    stripeCustomerId       TEXT,
    stripeSubscriptionId   TEXT,
    stripeCheckoutSessionId TEXT,
    plan                   TEXT NOT NULL DEFAULT 'starter',
    status                 TEXT NOT NULL DEFAULT 'inactive',
    currentPeriodStart     TEXT,
    currentPeriodEnd       TEXT,
    cancelAtPeriodEnd      INTEGER NOT NULL DEFAULT 0,
    billingMode            TEXT NOT NULL DEFAULT 'test',
    billingProvider        TEXT NOT NULL DEFAULT 'stripe',
    createdAt              TEXT NOT NULL,
    updatedAt              TEXT NOT NULL
  );
`)

// ─── Team tables ─────────────────────────────────────────────────────────────
billingDb.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id             TEXT PRIMARY KEY,
    ownerClerkId   TEXT NOT NULL,
    ownerEmail     TEXT NOT NULL,
    plan           TEXT NOT NULL DEFAULT 'team',
    status         TEXT NOT NULL DEFAULT 'active',
    maxSeats       INTEGER NOT NULL DEFAULT 3,
    stripeSubId    TEXT,
    createdAt      TEXT NOT NULL,
    updatedAt      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id         TEXT PRIMARY KEY,
    teamId     TEXT NOT NULL,
    clerkId    TEXT,
    email      TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'member',
    status     TEXT NOT NULL DEFAULT 'active',
    joinedAt   TEXT NOT NULL,
    FOREIGN KEY (teamId) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS team_invitations (
    id         TEXT PRIMARY KEY,
    teamId     TEXT NOT NULL,
    email      TEXT NOT NULL,
    token      TEXT UNIQUE NOT NULL,
    expiresAt  TEXT NOT NULL,
    acceptedAt TEXT,
    createdAt  TEXT NOT NULL,
    FOREIGN KEY (teamId) REFERENCES teams(id)
  );
`)

// ─── Non-destructive schema migrations ───────────────────────────────────────
// Add new columns to existing databases without dropping data.
const pragmaColumns = billingDb
  .prepare("PRAGMA table_info(subscribers)")
  .all() as Array<{ name: string }>
const existingColumns = new Set(pragmaColumns.map((c) => c.name))

if (!existingColumns.has("billingMode")) {
  billingDb.exec(
    `ALTER TABLE subscribers ADD COLUMN billingMode TEXT NOT NULL DEFAULT 'test'`
  )
}
if (!existingColumns.has("billingProvider")) {
  billingDb.exec(
    `ALTER TABLE subscribers ADD COLUMN billingProvider TEXT NOT NULL DEFAULT 'stripe'`
  )
}
if (!existingColumns.has("currentPeriodStart")) {
  billingDb.exec(
    `ALTER TABLE subscribers ADD COLUMN currentPeriodStart TEXT`
  )
}
if (!existingColumns.has("clerkUserId")) {
  billingDb.exec(
    `ALTER TABLE subscribers ADD COLUMN clerkUserId TEXT`
  )
}

// Enforce uniqueness on clerkUserId at the storage level.
// SQLite partial-index semantics: NULLs are not considered equal so multiple
// unbound rows (NULL clerkUserId) are still permitted. Once a Clerk user ID is
// set it cannot be shared across rows, making the lookup deterministic.
billingDb.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_clerkUserId
  ON subscribers (clerkUserId)
  WHERE clerkUserId IS NOT NULL
`)
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriberRecord = {
  id: number
  email: string
  clerkUserId: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeCheckoutSessionId: string | null
  plan: string
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: number
  billingMode: string
  billingProvider: string
  createdAt: string
  updatedAt: string
}

export function upsertSubscriber(input: {
  email: string
  clerkUserId?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripeCheckoutSessionId?: string | null
  plan: string
  status: string
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  billingMode?: string
  billingProvider?: string
}) {
  const now = new Date().toISOString()

  // Prefer lookup by clerkUserId (immutable identity) when available.
  // Fall back to email lookup only when no clerkUserId is provided.
  let existing: SubscriberRecord | undefined
  if (input.clerkUserId) {
    existing = billingDb
      .prepare("SELECT * FROM subscribers WHERE clerkUserId = ?")
      .get(input.clerkUserId) as SubscriberRecord | undefined
  }
  if (!existing) {
    const byEmail = billingDb
      .prepare("SELECT * FROM subscribers WHERE email = ?")
      .get(input.email) as SubscriberRecord | undefined
    // Only use the email-matched record if it is not already bound to a
    // different Clerk user. Once a clerkUserId is set on a row, that row
    // belongs exclusively to that identity. Critically, we do NOT accept
    // the email match when the row is already bound and the incoming write
    // omits clerkUserId — that would allow an email-only webhook update to
    // overwrite a row owned by a different account.
    if (
      byEmail &&
      (!byEmail.clerkUserId ||
        byEmail.clerkUserId === input.clerkUserId)
    ) {
      existing = byEmail
    }
  }

  if (existing) {
    // Never overwrite an existing clerkUserId with a different one.
    // The bound Clerk identity is permanent once set.
    const safeClerkUserId =
      existing.clerkUserId && input.clerkUserId && existing.clerkUserId !== input.clerkUserId
        ? existing.clerkUserId
        : (input.clerkUserId ?? null)

    billingDb
      .prepare(`
        UPDATE subscribers
        SET
          clerkUserId             = COALESCE(?, clerkUserId),
          stripeCustomerId        = COALESCE(?, stripeCustomerId),
          stripeSubscriptionId    = COALESCE(?, stripeSubscriptionId),
          stripeCheckoutSessionId = COALESCE(?, stripeCheckoutSessionId),
          plan                    = ?,
          status                  = ?,
          currentPeriodStart      = COALESCE(?, currentPeriodStart),
          currentPeriodEnd        = ?,
          cancelAtPeriodEnd       = ?,
          billingMode             = COALESCE(?, billingMode),
          billingProvider         = COALESCE(?, billingProvider),
          updatedAt               = ?
        WHERE id = ?
      `)
      .run(
        safeClerkUserId,
        input.stripeCustomerId ?? null,
        input.stripeSubscriptionId ?? null,
        input.stripeCheckoutSessionId ?? null,
        input.plan,
        input.status,
        input.currentPeriodStart ?? null,
        input.currentPeriodEnd ?? null,
        input.cancelAtPeriodEnd ? 1 : 0,
        input.billingMode ?? null,
        input.billingProvider ?? null,
        now,
        existing.id
      )
  } else {
    billingDb
      .prepare(`
        INSERT INTO subscribers (
          email, clerkUserId, stripeCustomerId, stripeSubscriptionId,
          stripeCheckoutSessionId, plan, status, currentPeriodStart,
          currentPeriodEnd, cancelAtPeriodEnd, billingMode, billingProvider,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.email,
        input.clerkUserId ?? null,
        input.stripeCustomerId ?? null,
        input.stripeSubscriptionId ?? null,
        input.stripeCheckoutSessionId ?? null,
        input.plan,
        input.status,
        input.currentPeriodStart ?? null,
        input.currentPeriodEnd ?? null,
        input.cancelAtPeriodEnd ? 1 : 0,
        input.billingMode ?? "test",
        input.billingProvider ?? "stripe",
        now,
        now
      )
  }
}

export function getSubscriberByEmail(email: string) {
  return billingDb
    .prepare("SELECT * FROM subscribers WHERE email = ?")
    .get(email) as SubscriberRecord | undefined
}

export function getSubscriberByCustomerId(customerId: string) {
  return billingDb
    .prepare("SELECT * FROM subscribers WHERE stripeCustomerId = ?")
    .get(customerId) as SubscriberRecord | undefined
}

export function getSubscriberBySubscriptionId(subscriptionId: string) {
  return billingDb
    .prepare("SELECT * FROM subscribers WHERE stripeSubscriptionId = ?")
    .get(subscriptionId) as SubscriberRecord | undefined
}

export function getSubscriberByClerkUserId(clerkUserId: string) {
  return billingDb
    .prepare("SELECT * FROM subscribers WHERE clerkUserId = ?")
    .get(clerkUserId) as SubscriberRecord | undefined
}

export type BillingTeamRecord = {
  id: string
  ownerClerkId: string
  ownerEmail: string
  plan: string
  status: string
  maxSeats: number
  stripeSubId: string | null
  createdAt: string
  updatedAt: string
}

export function getTeamFromBilling(teamId: string) {
  return billingDb
    .prepare("SELECT * FROM teams WHERE id = ?")
    .get(teamId) as BillingTeamRecord | undefined
}
