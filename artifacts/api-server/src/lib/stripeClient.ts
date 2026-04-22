import Stripe from "stripe"

async function fetchConnection(hostname: string, token: string, environment: string) {
  const url = new URL(`https://${hostname}/api/v2/connection`)
  url.searchParams.set("include_secrets", "true")
  url.searchParams.set("connector_names", "stripe")
  url.searchParams.set("environment", environment)

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": token,
    },
  })

  const data = await response.json()
  const conn = data.items?.[0]
  if (conn && conn.settings?.publishable && conn.settings?.secret) {
    return conn
  }
  return null
}

async function getCredentials() {
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1"

  // ── Production: prefer explicit live keys set as Replit Secrets ──────────
  // Add STRIPE_SECRET_KEY (sk_live_...) and STRIPE_PUBLISHABLE_KEY (pk_live_...)
  // in the Replit Secrets pane to enable live payments.
  if (isProduction) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY
    if (secretKey && publishableKey) {
      return { secretKey, publishableKey }
    }
    // No live keys configured — billing unavailable in production.
    throw new Error(
      "Live Stripe keys not configured. Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY " +
      "to Replit Secrets to enable live payments."
    )
  }

  // ── Development: use the Replit Stripe connector (sandbox) ───────────────
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null

  if (hostname && xReplitToken) {
    const conn = await fetchConnection(hostname, xReplitToken, "development")
    if (conn) {
      return {
        publishableKey: conn.settings.publishable as string,
        secretKey: conn.settings.secret as string,
      }
    }
  }

  // Also allow manual overrides in dev via env vars (useful for local testing)
  const secretKey = process.env.STRIPE_SECRET_KEY
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY
  if (secretKey && publishableKey) {
    return { secretKey, publishableKey }
  }

  throw new Error("Stripe development connection not found")
}

// WARNING: Never cache this client. Always call fresh — tokens may rotate.
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials()
  return new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" })
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials()
  return publishableKey
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials()
  return secretKey
}

export async function isStripeAvailable(): Promise<boolean> {
  try {
    await getCredentials()
    return true
  } catch {
    return false
  }
}

let stripeSyncInstance: any = null

export async function getStripeSync() {
  if (!stripeSyncInstance) {
    const { StripeSync } = await import("stripe-replit-sync")
    const secretKey = await getStripeSecretKey()
    stripeSyncInstance = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    })
  }
  return stripeSyncInstance
}
