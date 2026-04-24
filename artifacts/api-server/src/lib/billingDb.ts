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
if (!existingColumns.has("billingPeriod")) {
  billingDb.exec(
    `ALTER TABLE subscribers ADD COLUMN billingPeriod TEXT NOT NULL DEFAULT 'monthly'`
  )
}
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
  billingPeriod: string | null
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
  billingPeriod?: string | null
}) {
  const now = new Date().toISOString()

  const existing = billingDb
    .prepare("SELECT * FROM subscribers WHERE email = ?")
    .get(input.email) as SubscriberRecord | undefined

  if (existing) {
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
          billingPeriod           = COALESCE(?, billingPeriod),
          updatedAt               = ?
        WHERE email = ?
      `)
      .run(
        input.clerkUserId ?? null,
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
        input.billingPeriod ?? null,
        now,
        input.email
      )
  } else {
    billingDb
      .prepare(`
        INSERT INTO subscribers (
          email, clerkUserId, stripeCustomerId, stripeSubscriptionId,
          stripeCheckoutSessionId, plan, status, currentPeriodStart,
          currentPeriodEnd, cancelAtPeriodEnd, billingMode, billingProvider,
          billingPeriod, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        input.billingPeriod ?? "monthly",
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
