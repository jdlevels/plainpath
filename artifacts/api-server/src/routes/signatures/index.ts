import { Router, type Request, type Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { getAuth, clerkClient } from "@clerk/express";
import { pool } from "@workspace/db";
import { logger } from "../../lib/logger";
import { getSubscriberByEmail } from "../../lib/billingDb";
import { TOOL_ACCESS, normalizePlan } from "../../lib/planEntitlements";
import { BILLING_CONFIG } from "../../lib/billingConfig";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const ADMIN_EMAILS: Set<string> = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// MANUAL_PRO_EMAILS — users granted Pro access without Stripe (same env var as entitlements.ts)
const MANUAL_PRO_EMAILS: Set<string> = new Set(
  (process.env.MANUAL_PRO_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

// ─── Plan enforcement middleware ──────────────────────────────────────────────
// Enforces that the authenticated user's plan includes "signature".
// When PAYWALL_ENFORCEMENT is false, plan access is logged but never blocked.
// Admin emails always bypass plan checks.

async function requireSignaturePlan(req: any, res: any, next: any) {
  try {
    const userId = req.userId as string;
    const user = await clerkClient.users.getUser(userId);
    const email = (user.emailAddresses?.[0]?.emailAddress ?? "").toLowerCase();
    req.userEmail = email;

    // Admin bypass
    if (ADMIN_EMAILS.has(email)) return next();

    // Manual Pro bypass — granted Pro access without Stripe
    if (MANUAL_PRO_EMAILS.has(email)) return next();

    // If enforcement is off, always proceed (just log)
    if (!BILLING_CONFIG.PAYWALL_ENFORCEMENT) return next();

    const subscriber = getSubscriberByEmail(email);
    if (!subscriber || subscriber.status !== "active") {
      return res.status(403).json({
        error: "no_active_subscription",
        message: "An active subscription is required to use Digital Signature.",
        code: "NO_SUBSCRIPTION",
      });
    }

    const plan = normalizePlan(subscriber.plan);
    const allowedTools = TOOL_ACCESS[plan] ?? [];
    if (!allowedTools.includes("signature")) {
      return res.status(403).json({
        error: "tool_not_in_plan",
        message: `Your ${plan} plan does not include Digital Signature. Upgrade to Pro for full access.`,
        code: "TOOL_NOT_IN_PLAN",
        plan,
        requiredPlan: "pro",
      });
    }

    return next();
  } catch (err) {
    logger.error({ err }, "requireSignaturePlan: plan check failed — failing open to avoid outage");
    return next();
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signature_requests (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id             TEXT NOT NULL,
      document_name       TEXT NOT NULL,
      signer_name         TEXT NOT NULL,
      signer_email        TEXT NOT NULL,
      signer_role         TEXT,
      request_message     TEXT,
      provider_name       TEXT NOT NULL DEFAULT 'dropbox_sign',
      provider_request_id TEXT,
      provider_signature_id TEXT,
      status              TEXT NOT NULL DEFAULT 'draft',
      test_mode           BOOLEAN NOT NULL DEFAULT TRUE,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at             TIMESTAMPTZ,
      viewed_at           TIMESTAMPTZ,
      completed_at        TIMESTAMPTZ,
      declined_at         TIMESTAMPTZ,
      expired_at          TIMESTAMPTZ,
      failed_at           TIMESTAMPTZ,
      failure_reason      TEXT,
      signed_file_url     TEXT,
      metadata            JSONB
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signature_request_events (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      signature_request_id  UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
      provider_name         TEXT NOT NULL DEFAULT 'dropbox_sign',
      provider_event_name   TEXT NOT NULL,
      app_status_after_event TEXT,
      payload_json          JSONB,
      occurred_at           TIMESTAMPTZ NOT NULL,
      received_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      dedupe_key            TEXT UNIQUE
    );
  `);
}

// Run table init on module load
initTables().catch((err) => logger.error({ err }, "signature_requests table init failed"));

// ─── Status mapping from Dropbox Sign events ─────────────────────────────────

const EVENT_STATUS_MAP: Record<string, string> = {
  signature_request_sent: "sent",
  signature_request_viewed: "viewed",
  signature_request_signed: "signed",
  signature_request_all_signed: "signed",
  signature_request_declined: "declined",
  signature_request_expired: "expired",
  signature_request_canceled: "failed",
  signature_request_invalid: "failed",
  signature_request_remind: "sent",
  signature_request_reassigned: "sent",
};

function mapEventToStatus(eventType: string): string | null {
  return EVENT_STATUS_MAP[eventType] ?? null;
}

// ─── Dropbox Sign helpers ─────────────────────────────────────────────────────

function getDropboxSignCredentials() {
  const apiKey = process.env.DROPBOX_SIGN_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    authHeader: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    testMode: process.env.DROPBOX_SIGN_TEST_MODE !== "false",
  };
}

async function fetchDropboxSignRequest(providerRequestId: string, authHeader: string) {
  const resp = await fetch(
    `https://api.hellosign.com/v3/signature_request/${providerRequestId}`,
    { headers: { Authorization: authHeader } }
  );
  if (!resp.ok) return null;
  const data = await resp.json() as Record<string, unknown>;
  return data.signature_request as Record<string, unknown> | null;
}

// ─── GET /api/signatures ─ list user's requests ───────────────────────────────

router.get("/", requireAuth, requireSignaturePlan, async (req: any, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, document_name, signer_name, signer_email, signer_role,
              status, provider_request_id, test_mode,
              created_at, sent_at, completed_at, signed_file_url
       FROM signature_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows.map((r: any) => ({
      id: r.id,
      documentName: r.document_name,
      signerName: r.signer_name,
      signerEmail: r.signer_email,
      signerRole: r.signer_role,
      status: r.status,
      providerRequestId: r.provider_request_id,
      testMode: r.test_mode,
      createdAt: r.created_at,
      sentAt: r.sent_at,
      completedAt: r.completed_at,
      signedFileUrl: r.signed_file_url,
    })));
  } catch (err) {
    logger.error({ err }, "signatures list failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/signatures/:id ─ single request with events ────────────────────

router.get("/:id", requireAuth, requireSignaturePlan, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const reqResult = await pool.query(
      `SELECT * FROM signature_requests WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );
    if (reqResult.rowCount === 0) {
      return res.status(404).json({ error: "not_found" });
    }
    const r = reqResult.rows[0];

    const eventsResult = await pool.query(
      `SELECT id, provider_event_name, app_status_after_event, occurred_at, received_at
       FROM signature_request_events
       WHERE signature_request_id = $1
       ORDER BY occurred_at ASC`,
      [id]
    );

    return res.json({
      id: r.id,
      documentName: r.document_name,
      signerName: r.signer_name,
      signerEmail: r.signer_email,
      signerRole: r.signer_role,
      requestMessage: r.request_message,
      status: r.status,
      providerName: r.provider_name,
      providerRequestId: r.provider_request_id,
      providerSignatureId: r.provider_signature_id,
      testMode: r.test_mode,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      sentAt: r.sent_at,
      viewedAt: r.viewed_at,
      completedAt: r.completed_at,
      declinedAt: r.declined_at,
      expiredAt: r.expired_at,
      failedAt: r.failed_at,
      failureReason: r.failure_reason,
      signedFileUrl: r.signed_file_url,
      metadata: r.metadata,
      events: eventsResult.rows.map((e: any) => ({
        id: e.id,
        providerEventName: e.provider_event_name,
        appStatusAfterEvent: e.app_status_after_event,
        occurredAt: e.occurred_at,
        receivedAt: e.received_at,
      })),
    });
  } catch (err) {
    logger.error({ err }, "signatures get failed");
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/signatures/send ─ create + send to Dropbox Sign ───────────────
// Accepts multipart/form-data with optional file upload.
// Fields: signerName, signerEmail, signerRole, requestMessage, documentText

router.post("/send", requireAuth, requireSignaturePlan, upload.single("file"), async (req: any, res: Response) => {
  try {
    const {
      signerName,
      signerEmail,
      signerRole,
      requestMessage,
      documentText,
      documentName: nameOverride,
    } = req.body;

    if (!signerName?.trim() || !signerEmail?.trim()) {
      return res.status(400).json({ error: "missing_fields", message: "Signer name and email are required." });
    }
    if (!/\S+@\S+\.\S+/.test(signerEmail.trim())) {
      return res.status(400).json({ error: "invalid_email", message: "Please enter a valid signer email address." });
    }
    if (!req.file && !documentText?.trim()) {
      return res.status(400).json({ error: "missing_document", message: "Please upload a file or paste document text." });
    }

    const documentName = nameOverride?.trim() || req.file?.originalname || "Document";
    const creds = getDropboxSignCredentials();

    // ── Create draft record ───────────────────────────────────────────────────
    const insertResult = await pool.query(
      `INSERT INTO signature_requests
        (user_id, document_name, signer_name, signer_email, signer_role,
         request_message, provider_name, status, test_mode)
       VALUES ($1, $2, $3, $4, $5, $6, 'dropbox_sign', 'draft', $7)
       RETURNING id`,
      [
        req.userId,
        documentName,
        signerName.trim(),
        signerEmail.trim().toLowerCase(),
        signerRole?.trim() || null,
        requestMessage?.trim() || null,
        creds ? creds.testMode : true,
      ]
    );
    const signatureRequestId = insertResult.rows[0].id;

    // ── If no API key, stay as draft ──────────────────────────────────────────
    if (!creds) {
      return res.status(503).json({
        error: "signature_not_configured",
        message: "E-signature is not configured. A Dropbox Sign API key is required to send requests.",
        signatureRequestId,
      });
    }

    // ── Build the Dropbox Sign multipart payload ───────────────────────────────
    const formData = new FormData();
    formData.append("title", documentName);
    formData.append("subject", `Please sign: ${documentName}`);
    formData.append(
      "message",
      requestMessage?.trim() || `${signerName.trim()} — please review and sign this document sent via PlainPath.`
    );
    formData.append("signers[0][email_address]", signerEmail.trim().toLowerCase());
    formData.append("signers[0][name]", signerName.trim());
    formData.append("signers[0][order]", "0");

    if (creds.testMode) {
      formData.append("test_mode", "1");
    }

    // Append file or text
    if (req.file) {
      formData.append(
        "files[0]",
        new Blob([req.file.buffer], { type: req.file.mimetype }),
        req.file.originalname
      );
    } else {
      const textBuf = Buffer.from(documentText.trim(), "utf-8");
      formData.append(
        "files[0]",
        new Blob([textBuf], { type: "text/plain" }),
        `${documentName.replace(/[^a-z0-9]/gi, "_")}.txt`
      );
    }

    // ── Call Dropbox Sign ─────────────────────────────────────────────────────
    const dsResponse = await fetch("https://api.hellosign.com/v3/signature_request/send", {
      method: "POST",
      headers: { Authorization: creds.authHeader },
      body: formData,
    });

    const dsData = await dsResponse.json() as Record<string, unknown>;

    if (!dsResponse.ok) {
      logger.error({ status: dsResponse.status, dsData }, "Dropbox Sign API error");
      await pool.query(
        `UPDATE signature_requests
         SET status = 'failed', failed_at = NOW(), failure_reason = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(dsData), signatureRequestId]
      );

      const dsError = (dsData as any)?.error ?? {};
      let friendlyMessage = "Could not send the signature request. Please check your Dropbox Sign configuration.";

      if (dsResponse.status === 403 && typeof dsError.error_msg === "string" && dsError.error_msg.includes("test mode")) {
        friendlyMessage = "Dropbox Sign is in test mode, which only allows sending to email addresses on your own domain. To send to external addresses, contact apisupport@hellosign.com or upgrade to a paid Dropbox Sign plan.";
      } else if (dsResponse.status === 401) {
        friendlyMessage = "Dropbox Sign authentication failed. Please check that your API key is valid.";
      } else if (typeof dsError.error_msg === "string") {
        friendlyMessage = `Dropbox Sign error: ${dsError.error_msg}`;
      }

      return res.status(502).json({
        error: "provider_error",
        message: friendlyMessage,
        signatureRequestId,
      });
    }

    const dsReq = dsData.signature_request as Record<string, unknown>;
    const providerRequestId = dsReq?.signature_request_id as string ?? null;
    const firstSig = (dsReq?.signatures as any[])?.[0] ?? null;
    const providerSignatureId = firstSig?.signature_id ?? null;
    // Dropbox Sign returns the signing URL at the top-level "signing_url" field.
    const signUrl = ((dsReq as any).signing_url ?? null) as string | null;

    // ── Update record to sent ─────────────────────────────────────────────────
    await pool.query(
      `UPDATE signature_requests
       SET status = 'sent',
           provider_request_id = $1,
           provider_signature_id = $2,
           sent_at = NOW(),
           updated_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb
       WHERE id = $3`,
      [providerRequestId, providerSignatureId, signatureRequestId,
       JSON.stringify({ sign_url: signUrl, test_mode_sign_url: signUrl })]
    );

    // ── Record sent event (idempotent) ────────────────────────────────────────
    await pool.query(
      `INSERT INTO signature_request_events
        (signature_request_id, provider_event_name, app_status_after_event, occurred_at, dedupe_key)
       VALUES ($1, 'signature_request_sent', 'sent', NOW(), $2)
       ON CONFLICT (dedupe_key) DO NOTHING`,
      [signatureRequestId, `${signatureRequestId}:signature_request_sent:send`]
    ).catch(() => {});

    return res.json({
      ok: true,
      signatureRequestId,
      providerRequestId,
      status: "sent",
      message: "Signature request sent. The signer will receive an email with a secure signing link.",
    });
  } catch (err) {
    logger.error({ err }, "signatures/send failed");
    return res.status(500).json({ error: "server_error", message: "Failed to send signature request. Please try again." });
  }
});

// ─── POST /api/signatures/send-prepared ─ send with explicit field placement ──
// Like /send but accepts a JSON array of placed fields and page dimensions.
// Fields are stored as fractions (0..1) of page dimensions; we convert to
// PDF points for Dropbox Sign using: x_pts = x_frac * page_width_pts.
// DS API uses bottom-left origin → y = page_h - (y_top + field_h).

const DS_FIELD_TYPE_MAP: Record<string, string> = {
  signature: "signature",
  initials: "initials",
  date_signed: "date_signed",
  name: "name",
  title: "text",
  text: "text",
};

router.post("/send-prepared", requireAuth, requireSignaturePlan, upload.single("file"), async (req: any, res: Response) => {
  try {
    const {
      signerName,
      signerEmail,
      signerRole,
      requestMessage,
      documentName: nameOverride,
      fieldsJson,
      pageDimensionsJson,
    } = req.body;

    if (!signerName?.trim() || !signerEmail?.trim()) {
      return res.status(400).json({ error: "missing_fields", message: "Signer name and email are required." });
    }
    if (!/\S+@\S+\.\S+/.test(signerEmail.trim())) {
      return res.status(400).json({ error: "invalid_email", message: "A valid signer email address is required." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "missing_document", message: "A PDF file is required for Prepare & Place mode." });
    }

    let fields: Array<{
      id: string; type: string; page: number;
      x: number; y: number; width: number; height: number;
      label?: string; required: boolean;
    }> = [];
    let pageDimensions: Array<{ w_pts: number; h_pts: number }> = [];

    try {
      fields = JSON.parse(fieldsJson || "[]");
    } catch {
      return res.status(400).json({ error: "invalid_fields", message: "Invalid field placement data." });
    }
    try {
      pageDimensions = JSON.parse(pageDimensionsJson || "[]");
    } catch {
      return res.status(400).json({ error: "invalid_page_dims", message: "Invalid page dimension data." });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: "no_fields", message: "At least one field must be placed on the document." });
    }

    const hasSig = fields.some((f) => f.type === "signature" || f.type === "initials");
    if (!hasSig) {
      return res.status(400).json({ error: "no_signature_field", message: "At least one signature or initials field is required." });
    }

    const documentName = nameOverride?.trim() || req.file.originalname || "Document";
    const creds = getDropboxSignCredentials();

    // ── Create draft record ─────────────────────────────────────────────────
    const insertResult = await pool.query(
      `INSERT INTO signature_requests
        (user_id, document_name, signer_name, signer_email, signer_role,
         request_message, provider_name, status, test_mode, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, 'dropbox_sign', 'draft', $7, $8)
       RETURNING id`,
      [
        req.userId,
        documentName,
        signerName.trim(),
        signerEmail.trim().toLowerCase(),
        signerRole?.trim() || null,
        requestMessage?.trim() || null,
        creds ? creds.testMode : true,
        JSON.stringify({ fields, pageDimensions, workflow: "prepare_and_place" }),
      ]
    );
    const signatureRequestId = insertResult.rows[0].id;

    if (!creds) {
      return res.status(503).json({
        error: "signature_not_configured",
        message: "E-signature is not configured. A Dropbox Sign API key is required to send requests.",
        signatureRequestId,
      });
    }

    // ── Build Dropbox Sign multipart payload ────────────────────────────────
    const formData = new FormData();
    formData.append("title", documentName);
    formData.append("subject", `Please sign: ${documentName}`);
    formData.append(
      "message",
      requestMessage?.trim() || `${signerName.trim()} — please review and sign this document sent via PlainPath.`
    );
    formData.append("signers[0][email_address]", signerEmail.trim().toLowerCase());
    formData.append("signers[0][name]", signerName.trim());
    formData.append("signers[0][order]", "0");

    if (creds.testMode) {
      formData.append("test_mode", "1");
    }

    formData.append(
      "files[0]",
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname
    );

    // ── Convert and append form fields ─────────────────────────────────────
    // DS API coords: bottom-left origin, in PDF points (72 DPI = 1 pt/px).
    // Our storage: fractions (0..1) of page, top-left origin.
    // Conversion: ds_x = frac_x * w_pts
    //             ds_y = (1 - frac_y - frac_h) * h_pts  (y-flip to bottom-left)
    fields.forEach((field, i) => {
      const dims = pageDimensions[field.page - 1] || { w_pts: 612, h_pts: 792 };
      const x_pts = Math.max(0, Math.round(field.x * dims.w_pts));
      const y_pts = Math.max(0, Math.round((1 - field.y - field.height) * dims.h_pts));
      const w_pts = Math.max(30, Math.round(field.width * dims.w_pts));
      const h_pts = Math.max(12, Math.round(field.height * dims.h_pts));
      const dsType = DS_FIELD_TYPE_MAP[field.type] ?? "text";

      formData.append(`form_fields_per_document[${i}][document_index]`, "0");
      formData.append(`form_fields_per_document[${i}][api_id]`, `field_${i}`);
      formData.append(`form_fields_per_document[${i}][type]`, dsType);
      formData.append(`form_fields_per_document[${i}][x]`, String(x_pts));
      formData.append(`form_fields_per_document[${i}][y]`, String(y_pts));
      formData.append(`form_fields_per_document[${i}][width]`, String(w_pts));
      formData.append(`form_fields_per_document[${i}][height]`, String(h_pts));
      formData.append(`form_fields_per_document[${i}][page]`, String(field.page));
      formData.append(`form_fields_per_document[${i}][required]`, "1");
      formData.append(`form_fields_per_document[${i}][signer]`, "0");
      if (field.label) {
        formData.append(`form_fields_per_document[${i}][label]`, field.label);
      }
    });

    // ── Call Dropbox Sign ───────────────────────────────────────────────────
    const dsResponse = await fetch("https://api.hellosign.com/v3/signature_request/send", {
      method: "POST",
      headers: { Authorization: creds.authHeader },
      body: formData,
    });

    const dsData = await dsResponse.json() as Record<string, unknown>;

    if (!dsResponse.ok) {
      logger.error({ status: dsResponse.status, dsData }, "Dropbox Sign API error (send-prepared)");
      await pool.query(
        `UPDATE signature_requests
         SET status = 'failed', failed_at = NOW(), failure_reason = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(dsData), signatureRequestId]
      );

      const dsError = (dsData as any)?.error ?? {};
      let friendlyMessage = "Could not send the signature request. Please check your Dropbox Sign configuration.";

      if (dsResponse.status === 403 && typeof dsError.error_msg === "string" && dsError.error_msg.includes("test mode")) {
        friendlyMessage = "Dropbox Sign is in test mode, which only allows sending to email addresses on your own domain. To send to external addresses, contact apisupport@hellosign.com or upgrade to a paid Dropbox Sign plan.";
      } else if (dsResponse.status === 401) {
        friendlyMessage = "Dropbox Sign authentication failed. Please check that your API key is valid.";
      } else if (typeof dsError.error_msg === "string") {
        friendlyMessage = `Dropbox Sign error: ${dsError.error_msg}`;
      }

      return res.status(502).json({
        error: "provider_error",
        message: friendlyMessage,
        signatureRequestId,
      });
    }

    const dsReq = dsData.signature_request as Record<string, unknown>;
    const providerRequestId = dsReq?.signature_request_id as string ?? null;
    const firstSig = (dsReq?.signatures as any[])?.[0] ?? null;
    const providerSignatureId = firstSig?.signature_id ?? null;
    const signUrl = ((dsReq as any).signing_url ?? null) as string | null;

    await pool.query(
      `UPDATE signature_requests
       SET status = 'sent',
           provider_request_id = $1,
           provider_signature_id = $2,
           sent_at = NOW(),
           updated_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb
       WHERE id = $3`,
      [providerRequestId, providerSignatureId, signatureRequestId,
       JSON.stringify({ sign_url: signUrl, test_mode_sign_url: signUrl })]
    );

    await pool.query(
      `INSERT INTO signature_request_events
        (signature_request_id, provider_event_name, app_status_after_event, occurred_at, dedupe_key)
       VALUES ($1, 'signature_request_sent', 'sent', NOW(), $2)
       ON CONFLICT (dedupe_key) DO NOTHING`,
      [signatureRequestId, `${signatureRequestId}:signature_request_sent:send`]
    ).catch(() => {});

    return res.json({
      ok: true,
      signatureRequestId,
      providerRequestId,
      status: "sent",
      message: "Signature request sent with field placements. The signer will receive a secure signing link by email.",
    });
  } catch (err) {
    logger.error({ err }, "signatures/send-prepared failed");
    return res.status(500).json({ error: "server_error", message: "Failed to send signature request. Please try again." });
  }
});

// ─── GET /api/signatures/:id/refresh ─ refresh status from Dropbox Sign ──────

router.get("/:id/refresh", requireAuth, requireSignaturePlan, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const reqResult = await pool.query(
      `SELECT * FROM signature_requests WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );
    if (reqResult.rowCount === 0) return res.status(404).json({ error: "not_found" });
    const r = reqResult.rows[0];

    if (!r.provider_request_id) {
      return res.json({ status: r.status, refreshed: false, reason: "no_provider_id" });
    }

    const creds = getDropboxSignCredentials();
    if (!creds) {
      return res.json({ status: r.status, refreshed: false, reason: "not_configured" });
    }

    const dsReq = await fetchDropboxSignRequest(r.provider_request_id, creds.authHeader);
    if (!dsReq) {
      return res.json({ status: r.status, refreshed: false, reason: "provider_fetch_failed" });
    }

    // Map Dropbox Sign response to app status.
    // DS does NOT return a top-level status_code; instead uses boolean flags.
    // Per-signature status is in signatures[].status_code.
    // IMPORTANT: only advance to terminal states from polling.
    // Webhook events provide more granular status — never regress viewed→sent.
    const dsIsComplete = !!(dsReq as any).is_complete;
    const dsIsDeclined = !!(dsReq as any).is_declined;
    const dsHasError = !!(dsReq as any).has_error;
    const dsExpired = !!(dsReq as any).is_expired;
    const firstSigStatus = String(((dsReq.signatures as any[])?.[0])?.status_code ?? "");
    let newStatus = r.status;
    if (dsIsComplete) {
      newStatus = "signed";
    } else if (dsIsDeclined) {
      newStatus = "declined";
    } else if (dsExpired) {
      newStatus = "expired";
    } else if (dsHasError) {
      newStatus = "failed";
    } else if (firstSigStatus === "awaiting_signature" && r.status === "draft") {
      // Only advance from draft → sent; preserve sent/viewed (webhook-driven granular state)
      newStatus = "sent";
    }

    if (newStatus !== r.status) {
      const updates: string[] = ["status = $1", "updated_at = NOW()"];
      const values: unknown[] = [newStatus, id];
      if (newStatus === "signed")   updates.push(`completed_at = COALESCE(completed_at, NOW())`);
      if (newStatus === "declined") updates.push(`declined_at = COALESCE(declined_at, NOW())`);
      if (newStatus === "expired")  updates.push(`expired_at = COALESCE(expired_at, NOW())`);
      if (newStatus === "failed")   updates.push(`failed_at = COALESCE(failed_at, NOW())`);

      await pool.query(
        `UPDATE signature_requests SET ${updates.join(", ")} WHERE id = $2`,
        values
      );

      const refreshDedupeKey = `${id}:refresh_${newStatus}`;
      await pool.query(
        `INSERT INTO signature_request_events
          (signature_request_id, provider_event_name, app_status_after_event, occurred_at, dedupe_key)
         VALUES ($1, $2, $3, NOW(), $4)
         ON CONFLICT (dedupe_key) DO NOTHING`,
        [id, `refresh_${newStatus}`, newStatus, refreshDedupeKey]
      ).catch(() => {});
    }

    // ── Persist sign_url into metadata if in test mode ────────────────────────
    // Dropbox Sign returns the signing URL as top-level "signing_url" on the
    // signature_request object (not inside signatures[]).
    const refreshSignUrl = ((dsReq as any).signing_url ?? null) as string | null;
    if (refreshSignUrl && r.test_mode) {
      await pool.query(
        `UPDATE signature_requests
         SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
         WHERE id = $2`,
        [JSON.stringify({ sign_url: refreshSignUrl }), id]
      ).catch(() => {});
    }

    const providerStatus = dsIsComplete
      ? "signed"
      : dsIsDeclined
        ? "declined"
        : dsExpired
          ? "expired"
          : dsHasError
            ? "error"
            : firstSigStatus || "awaiting_signature";

    return res.json({
      status: newStatus,
      refreshed: true,
      providerStatus,
      signUrl: r.test_mode ? refreshSignUrl : null,
    });
  } catch (err) {
    logger.error({ err }, "signatures/refresh failed");
    return res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/signatures/:id/download ─ proxy signed file from Dropbox Sign ──

router.get("/:id/download", requireAuth, requireSignaturePlan, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const reqResult = await pool.query(
      `SELECT provider_request_id, status FROM signature_requests WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );
    if (reqResult.rowCount === 0) return res.status(404).json({ error: "not_found" });
    const r = reqResult.rows[0];

    if (r.status !== "signed") {
      return res.status(409).json({ error: "not_signed", message: "The document has not been fully signed yet." });
    }
    if (!r.provider_request_id) {
      return res.status(409).json({ error: "no_provider_id", message: "No provider request ID found." });
    }

    const creds = getDropboxSignCredentials();
    if (!creds) return res.status(503).json({ error: "not_configured" });

    const fileResp = await fetch(
      `https://api.hellosign.com/v3/signature_request/files/${r.provider_request_id}?file_type=pdf`,
      { headers: { Authorization: creds.authHeader } }
    );
    if (!fileResp.ok) {
      return res.status(502).json({ error: "download_failed", message: "Signed document is not ready yet. Please try again shortly." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="signed-document.pdf"`);
    const buffer = await fileResp.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    logger.error({ err }, "signatures/download failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /api/signatures/:id ─ delete a draft ─────────────────────────────

router.delete("/:id", requireAuth, requireSignaturePlan, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM signature_requests WHERE id = $1 AND user_id = $2 AND status IN ('draft', 'failed')`,
      [id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "not_found_or_not_deletable", message: "Only draft or failed requests can be deleted." });
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "signatures/delete failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/signatures/webhook ─ Dropbox Sign callback ────────────────────
// Dropbox Sign sends: POST application/x-www-form-urlencoded with "json" field.
// Must respond with exactly "Hello API Event Received" and 200.

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Parse the json payload field (form-encoded body)
    const rawJson = req.body?.json;
    if (!rawJson) {
      logger.warn("Dropbox Sign webhook: missing json field");
      return res.status(200).send("Hello API Event Received");
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawJson);
    } catch {
      logger.warn("Dropbox Sign webhook: invalid JSON");
      return res.status(200).send("Hello API Event Received");
    }

    const event = payload.event as Record<string, unknown> | undefined;
    const sigReq = payload.signature_request as Record<string, unknown> | undefined;

    if (!event || !sigReq) {
      logger.warn({ payload }, "Dropbox Sign webhook: unexpected payload shape");
      return res.status(200).send("Hello API Event Received");
    }

    const eventType = String(event.event_type ?? "");
    const eventTime = String(event.event_time ?? "");
    const eventHash = String(event.event_hash ?? "");
    const providerRequestId = String(sigReq.signature_request_id ?? "");

    // ── Verify HMAC if API key is present ─────────────────────────────────────
    const apiKey = process.env.DROPBOX_SIGN_API_KEY;
    if (apiKey && eventHash) {
      const expected = crypto
        .createHmac("sha256", apiKey)
        .update(eventTime + eventType)
        .digest("hex");
      if (expected !== eventHash) {
        logger.warn({ eventType, providerRequestId }, "Dropbox Sign webhook: HMAC verification failed");
        return res.status(200).send("Hello API Event Received");
      }
    }

    // ── Ignore test events ────────────────────────────────────────────────────
    if (eventType === "callback_test" || eventType === "test") {
      logger.info("Dropbox Sign webhook: callback test received");
      return res.status(200).send("Hello API Event Received");
    }

    // ── Find local signature request ──────────────────────────────────────────
    const reqResult = await pool.query(
      `SELECT id, status FROM signature_requests WHERE provider_request_id = $1`,
      [providerRequestId]
    );
    if (reqResult.rowCount === 0) {
      logger.warn({ providerRequestId, eventType }, "Dropbox Sign webhook: no matching local request");
      return res.status(200).send("Hello API Event Received");
    }
    const localReq = reqResult.rows[0];
    const newStatus = mapEventToStatus(eventType);

    // ── Record event idempotently ─────────────────────────────────────────────
    const dedupeKey = `${providerRequestId}:${eventType}:${eventTime}`;
    await pool.query(
      `INSERT INTO signature_request_events
        (signature_request_id, provider_event_name, app_status_after_event,
         payload_json, occurred_at, dedupe_key)
       VALUES ($1, $2, $3, $4, to_timestamp($5::double precision), $6)
       ON CONFLICT (dedupe_key) DO NOTHING`,
      [
        localReq.id,
        eventType,
        newStatus,
        JSON.stringify(payload),
        Number(eventTime) || Date.now() / 1000,
        dedupeKey,
      ]
    );

    // ── Update request status ─────────────────────────────────────────────────
    if (newStatus && newStatus !== localReq.status) {
      const now = "NOW()";
      let extra = "";
      if (newStatus === "viewed")   extra = ", viewed_at = COALESCE(viewed_at, NOW())";
      if (newStatus === "signed")   extra = ", completed_at = COALESCE(completed_at, NOW())";
      if (newStatus === "declined") extra = ", declined_at = COALESCE(declined_at, NOW())";
      if (newStatus === "expired")  extra = ", expired_at = COALESCE(expired_at, NOW())";
      if (newStatus === "failed")   extra = ", failed_at = COALESCE(failed_at, NOW())";

      await pool.query(
        `UPDATE signature_requests SET status = $1, updated_at = NOW()${extra} WHERE id = $2`,
        [newStatus, localReq.id]
      );
      logger.info({ id: localReq.id, eventType, newStatus }, "Dropbox Sign webhook: status updated");
    }

    return res.status(200).send("Hello API Event Received");
  } catch (err) {
    logger.error({ err }, "signatures/webhook failed");
    return res.status(200).send("Hello API Event Received");
  }
});

export default router;
