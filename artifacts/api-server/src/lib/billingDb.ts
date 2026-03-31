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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    stripeCustomerId TEXT,
    stripeSubscriptionId TEXT,
    stripeCheckoutSessionId TEXT,
    plan TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'inactive',
    currentPeriodEnd TEXT,
    cancelAtPeriodEnd INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`)

export type SubscriberRecord = {
  id: number
  email: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeCheckoutSessionId: string | null
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: number
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
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
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
          stripeCustomerId = COALESCE(?, stripeCustomerId),
          stripeSubscriptionId = COALESCE(?, stripeSubscriptionId),
          stripeCheckoutSessionId = COALESCE(?, stripeCheckoutSessionId),
          plan = ?,
          status = ?,
          currentPeriodEnd = ?,
          cancelAtPeriodEnd = ?,
          updatedAt = ?
        WHERE email = ?
      `)
      .run(
        input.stripeCustomerId ?? null,
        input.stripeSubscriptionId ?? null,
        input.stripeCheckoutSessionId ?? null,
        input.plan,
        input.status,
        input.currentPeriodEnd ?? null,
        input.cancelAtPeriodEnd ? 1 : 0,
        now,
        input.email
      )
  } else {
    billingDb
      .prepare(`
        INSERT INTO subscribers (
          email,
          stripeCustomerId,
          stripeSubscriptionId,
          stripeCheckoutSessionId,
          plan,
          status,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.email,
        input.stripeCustomerId ?? null,
        input.stripeSubscriptionId ?? null,
        input.stripeCheckoutSessionId ?? null,
        input.plan,
        input.status,
        input.currentPeriodEnd ?? null,
        input.cancelAtPeriodEnd ? 1 : 0,
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
