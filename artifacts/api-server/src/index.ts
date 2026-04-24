import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      logger.warn("DATABASE_URL not set — skipping Stripe sync");
      return;
    }

    const migrationLogger = {
      info:  (msg: string, ...args: unknown[]) => logger.info({ stripe: true }, `[stripe-migration] ${msg}`),
      warn:  (msg: string, ...args: unknown[]) => logger.warn({ stripe: true }, `[stripe-migration] ${msg}`),
      error: (msg: string, ...args: unknown[]) => logger.error({ stripe: true }, `[stripe-migration] ${msg}`),
    };

    await runMigrations({ databaseUrl, logger: migrationLogger });

    // Verify that the key stripe.accounts table was actually created — the
    // migration library can silently skip when a prior run left the schema in
    // a partial state.  If it's missing we bail out early so the error is
    // clearly visible in the logs instead of surfacing as a confusing "relation
    // does not exist" deep inside stripe-replit-sync.
    const { Pool } = await import("pg");
    const verifyPool = new Pool({ connectionString: databaseUrl });
    const checkResult = await verifyPool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'stripe' AND table_name = 'accounts'
      ) AS exists`
    );
    await verifyPool.end();

    if (!checkResult.rows[0]?.exists) {
      logger.error(
        "stripe.accounts table missing after runMigrations — " +
        "migrations may have been skipped or partially applied. " +
        "Check the [stripe-migration] log lines above for details."
      );
      return;
    }

    const { getStripeSync } = await import("./lib/stripeClient");
    const stripeSync = await getStripeSync();

    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    if (domain) {
      const webhookBaseUrl = `https://${domain}`;
      const webhookUrl = `${webhookBaseUrl}/api/stripe/webhook`;

      await stripeSync.findOrCreateManagedWebhook(webhookUrl);

      // The secret is always stored in the _managed_webhooks table
      // (Stripe only returns it once on creation; we read it from DB for reliability)
      const pool2 = new Pool({ connectionString: process.env.DATABASE_URL });
      const row = await pool2.query(
        "SELECT secret FROM stripe._managed_webhooks WHERE url = $1 LIMIT 1",
        [webhookUrl],
      );
      await pool2.end();

      if (row.rows[0]?.secret) {
        const { setWebhookSecret } = await import("./lib/stripeWebhookSecret");
        setWebhookSecret(row.rows[0].secret);
        logger.info("Stripe managed webhook configured");
      } else {
        logger.warn("Stripe webhook secret not found in database — webhooks will be rejected");
      }
    }

    await stripeSync.syncBackfill();
    logger.info("Stripe initialized and backfill complete");
  } catch (err) {
    logger.warn({ err }, "Stripe initialization failed — billing disabled in this environment");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  initStripe();
});
