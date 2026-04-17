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
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriberRecord = {
  id: number
  email: string
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

  const existing = billingDb
    .prepare("SELECT * FROM subscribers WHERE email = ?")
    .get(input.email) as SubscriberRecord | undefined

  if (existing) {
    billingDb
      .prepare(`
        UPDATE subscribers
        SET
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
        WHERE email = ?
      `)
      .run(
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
        input.email
      )
  } else {
    billingDb
      .prepare(`
        INSERT INTO subscribers (
          email, stripeCustomerId, stripeSubscriptionId, stripeCheckoutSessionId,
          plan, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd,
          billingMode, billingProvider, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.email,
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
