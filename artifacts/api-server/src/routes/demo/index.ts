import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import multer from "multer";
import { pool as db } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { parsePdfWithLimits, ParseResourceLimitError } from "../../lib/parseWithLimits";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Demo limits ─────────────────────────────────────────────────────────────

const DEMO_MAX_USES = 2;
const DEMO_MAX_PAGES = 10;
const DEMO_MAX_BYTES = 10 * 1024 * 1024;
const DEMO_COOKIE_NAME = "demo_guest_id";
const DEMO_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days ms
const FINGERPRINT_BLOCK_DAYS = 7;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getIpPrefix(req: Request): string {
  // req.ip is resolved by Express using X-Forwarded-For and the trust proxy
  // setting ("trust proxy": 1 in app.ts).  The edge load balancer is expected
  // to overwrite/append X-Forwarded-For, so an attacker cannot inject arbitrary
  // IPs into the header that Express would trust.  This is safer than reading
  // X-Forwarded-For directly (fully attacker-controlled) or using
  // req.socket.remoteAddress (which in proxied production would be the load
  // balancer's IP, causing all users behind it to share one fingerprint).
  const raw = req.ip ?? req.socket.remoteAddress ?? "";
  // IPv4: take first three octets (/24) so the quota applies to ~254 addresses
  // rather than a /16 (65,535 addresses).  Using only two octets let a single
  // attacker exhaust the allowance for entire offices, schools, or ISP blocks.
  // IPv6: take first four groups (/64) — the standard end-site prefix assigned
  // by ISPs — instead of two groups (/32) which covers millions of addresses.
  if (raw.includes(".")) {
    const parts = raw.split(".");
    return `${parts[0] ?? "0"}.${parts[1] ?? "0"}.${parts[2] ?? "0"}`;
  }
  const parts = raw.split(":");
  return parts.slice(0, 4).join(":");
}

function getFingerprintHash(req: Request): string {
  // Fingerprint is keyed solely on the trusted network address.  User-Agent is
  // intentionally excluded: it is attacker-controlled and including it would
  // allow quota bypass by rotating UA strings after dropping the cookie.
  const prefix = getIpPrefix(req);
  return crypto.createHash("sha256").update(prefix).digest("hex");
}

function setGuestCookie(res: Response, token: string): void {
  res.cookie(DEMO_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DEMO_COOKIE_MAX_AGE,
    path: "/",
  });
}

// ─── Guest resolution ─────────────────────────────────────────────────────────
// Returns { guest, token, isNew }
// Side-effects: creates guest if missing, updates last_seen_at + fingerprint.
// Guest rows are for analytics only; enforcement is done via demo_fingerprint_quotas.

async function resolveGuest(
  req: Request,
  res: Response,
): Promise<{ guest: Record<string, unknown>; token: string; isNew: boolean }> {
  const fingerprintHash = getFingerprintHash(req);
  const existingToken: string | undefined = req.cookies?.[DEMO_COOKIE_NAME];

  if (existingToken) {
    const guestHash = hashToken(existingToken);
    const result = await db.query(
      `SELECT * FROM demo_guests WHERE guest_hash = $1`,
      [guestHash],
    );
    if (result.rows.length > 0) {
      const guest = result.rows[0];
      await db.query(
        `UPDATE demo_guests
         SET last_seen_at = NOW(),
             fingerprint_hash = COALESCE(fingerprint_hash, $2)
         WHERE id = $1`,
        [guest.id, fingerprintHash],
      );
      return { guest, token: existingToken, isNew: false };
    }
  }

  // Create a new guest
  const token = crypto.randomBytes(32).toString("hex");
  const guestHash = hashToken(token);
  const created = await db.query(
    `INSERT INTO demo_guests (guest_hash, fingerprint_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [guestHash, fingerprintHash],
  );
  setGuestCookie(res, token);
  return { guest: created.rows[0], token, isNew: true };
}

// ─── Fingerprint quota (atomic) ───────────────────────────────────────────────
//
// demo_fingerprint_quotas is the single source of truth for enforcement.
// One row per fingerprint; total_uses tracks consumed slots within a rolling
// FINGERPRINT_BLOCK_DAYS window.  The window resets automatically when the
// existing row's window_start falls outside the block window.
//
// reserveFingerprintSlot() uses a single atomic upsert so concurrent requests
// from the same fingerprint cannot both pass:
//   - On first use: INSERT a new row with total_uses = 1.
//   - On conflict: UPDATE total_uses + 1 only when the WHERE clause passes
//     (window active AND current total < DEMO_MAX_USES, OR window expired →
//     reset to 1).  If WHERE fails the update is skipped and RETURNING yields
//     no rows → quota exhausted.
//
// This eliminates the TOCTOU race of the old read-then-check approach.

async function reserveFingerprintSlot(
  fingerprintHash: string,
): Promise<{ reserved: boolean; totalUses: number }> {
  const result = await db.query(
    `INSERT INTO demo_fingerprint_quotas (fingerprint_hash, total_uses, window_start)
     VALUES ($1, 1, NOW())
     ON CONFLICT (fingerprint_hash) DO UPDATE
       SET total_uses   = CASE
                            WHEN demo_fingerprint_quotas.window_start < NOW() - INTERVAL '${FINGERPRINT_BLOCK_DAYS} days'
                            THEN 1
                            ELSE demo_fingerprint_quotas.total_uses + 1
                          END,
           window_start = CASE
                            WHEN demo_fingerprint_quotas.window_start < NOW() - INTERVAL '${FINGERPRINT_BLOCK_DAYS} days'
                            THEN NOW()
                            ELSE demo_fingerprint_quotas.window_start
                          END
     WHERE demo_fingerprint_quotas.window_start < NOW() - INTERVAL '${FINGERPRINT_BLOCK_DAYS} days'
        OR demo_fingerprint_quotas.total_uses < $2
     RETURNING total_uses`,
    [fingerprintHash, DEMO_MAX_USES],
  );

  if (result.rows.length === 0) {
    return { reserved: false, totalUses: DEMO_MAX_USES };
  }
  const totalUses = result.rows[0].total_uses as number;
  return { reserved: true, totalUses };
}

// Releases a previously reserved fingerprint slot on failed/invalid runs.
// Does not release if total_uses is already at 0 (GREATEST guard).
async function releaseFingerprintSlot(fingerprintHash: string): Promise<void> {
  await db.query(
    `UPDATE demo_fingerprint_quotas
     SET total_uses = GREATEST(0, total_uses - 1)
     WHERE fingerprint_hash = $1`,
    [fingerprintHash],
  );
}

// Read-only fingerprint quota check for the /status endpoint.
async function getFingerprintTotalUses(fingerprintHash: string): Promise<number> {
  const result = await db.query(
    `SELECT total_uses FROM demo_fingerprint_quotas
     WHERE fingerprint_hash = $1
       AND window_start > NOW() - INTERVAL '${FINGERPRINT_BLOCK_DAYS} days'`,
    [fingerprintHash],
  );
  return result.rows.length > 0 ? (result.rows[0].total_uses as number) : 0;
}

// ─── Demo PDF analysis via OpenAI ────────────────────────────────────────────

async function runDemoAnalysis(
  textContent: string,
  fileName: string,
): Promise<{
  summary: string;
  keyRisks: string[];
  nextSteps: string[];
  missingItems: string[];
  documentType: string;
}> {
  const truncated = textContent.slice(0, 3500);

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a plain-English document review assistant. Analyze the provided document text and respond with a JSON object containing exactly these keys:
- "documentType": a brief label for what kind of document this is (e.g. "Lease Agreement", "Employment Contract", "Medical Bill")
- "summary": 2-3 sentences describing what this document is and what it does
- "keyRisks": an array of up to 3 plain-English risks or concerns a reader should be aware of
- "nextSteps": an array of up to 3 concrete, actionable steps the reader should take
- "missingItems": an array of up to 2 items that seem absent, vague, or that the reader should ask about

Rules:
- Write in plain English, accessible to a non-lawyer
- Do not provide legal advice
- Be specific to the document content
- Keep each item under 100 characters
- Return only valid JSON, no markdown`,
      },
      {
        role: "user",
        content: `File name: ${fileName}\n\nDocument text:\n${truncated}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  return {
    documentType: String(parsed.documentType ?? "Document"),
    summary: String(parsed.summary ?? ""),
    keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks.map(String).slice(0, 3) : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String).slice(0, 3) : [],
    missingItems: Array.isArray(parsed.missingItems) ? parsed.missingItems.map(String).slice(0, 2) : [],
  };
}

// ─── GET /api/demo/status ─────────────────────────────────────────────────────
// Read-only: looks up an existing guest from the cookie but never creates one.
// Reports exhaustion based on demo_fingerprint_quotas (the enforcement table).

router.get("/status", async (req: Request, res: Response) => {
  try {
    const existingToken: string | undefined = req.cookies?.[DEMO_COOKIE_NAME];
    const fingerprintHash = getFingerprintHash(req);

    // Check fingerprint quota — this is the enforcement source of truth.
    const fpTotalUses = await getFingerprintTotalUses(fingerprintHash);
    const isExhausted = fpTotalUses >= DEMO_MAX_USES;
    const remainingUses = Math.max(0, DEMO_MAX_USES - fpTotalUses);

    if (!existingToken) {
      return res.json({
        demoGuestPresent: false,
        completedUses: fpTotalUses,
        remainingUses,
        isExhausted,
      });
    }

    const guestHash = hashToken(existingToken);
    const result = await db.query(
      `SELECT * FROM demo_guests WHERE guest_hash = $1`,
      [guestHash],
    );

    if (result.rows.length === 0) {
      return res.json({
        demoGuestPresent: false,
        completedUses: fpTotalUses,
        remainingUses,
        isExhausted,
      });
    }

    return res.json({
      demoGuestPresent: true,
      completedUses: fpTotalUses,
      remainingUses,
      isExhausted,
    });
  } catch (err) {
    console.error("demo/status error", err);
    return res.status(500).json({ error: "internal_error", message: "Failed to load demo status." });
  }
});

// ─── POST /api/demo/analyze ───────────────────────────────────────────────────

router.post(
  "/analyze",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const fingerprintHash = getFingerprintHash(req);

    // 0. File validation — done BEFORE any DB writes so invalid requests
    //    are rejected without consuming a quota slot or creating guest rows.
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "no_file", message: "Please upload a PDF file." });
    }
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "invalid_type", message: "Only PDF files are accepted for the demo." });
    }
    if (file.size > DEMO_MAX_BYTES) {
      return res.status(400).json({ error: "file_too_large", message: "File must be 10 MB or smaller for the demo." });
    }

    // 1. Atomically reserve a fingerprint slot — this is the primary enforcement
    //    gate.  A single upsert statement with a conditional WHERE prevents any
    //    TOCTOU race: concurrent requests from the same fingerprint compete for
    //    the same row lock, so only one can increment from N-1 to N while
    //    others see total_uses >= DEMO_MAX_USES and get no RETURNING row.
    //    Dropping the cookie cannot bypass this because enforcement is keyed on
    //    the fingerprint (IP), not the guest row.
    let slotReserved = false;
    let fingerprintTotalUses = 0;
    try {
      ({ reserved: slotReserved, totalUses: fingerprintTotalUses } =
        await reserveFingerprintSlot(fingerprintHash));

      if (!slotReserved) {
        return res.status(403).json({
          error: "quota_exhausted",
          message: "You have used all 2 free demo analyses. Create a free account to continue.",
          remainingUses: 0,
          isExhausted: true,
        });
      }
    } catch (err) {
      console.error("demo/analyze fingerprint-reserve error", err);
      return res.status(500).json({ error: "internal_error", message: "Could not establish demo session." });
    }

    // 2. Resolve/create guest row for analytics tracking.
    //    Safe to create here: slot is already reserved (step 1) and file is valid (step 0).
    let guest: Record<string, unknown>;
    try {
      ({ guest } = await resolveGuest(req, res));
    } catch (err) {
      console.error("demo/analyze guest error", err);
      await releaseFingerprintSlot(fingerprintHash).catch(() => {});
      return res.status(500).json({ error: "internal_error", message: "Could not establish demo session." });
    }

    // 3. Parse PDF — done before the quota increment so that rejected files
    //    (unreadable, too many pages, empty text) do not consume a quota slot.
    //    parsePdfWithLimits aborts the parse mid-stream the moment the page
    //    count exceeds DEMO_MAX_PAGES or extracted text exceeds 500 KB, so a
    //    malicious compressed PDF cannot exhaust CPU / RAM before we reject it.
    let pdfText = "";
    let pageCount = 0;
    try {
      const parsed = await parsePdfWithLimits(file.buffer, {
        maxPages: DEMO_MAX_PAGES,
        maxTextBytes: 500 * 1024, // 500 KB — generous for a 10-page demo doc
      });
      pdfText = parsed.text ?? "";
      pageCount = parsed.numpages ?? 0;
    } catch (err) {
      if (err instanceof ParseResourceLimitError) {
        return res.status(400).json({ error: "document_too_large", message: err.message });
      }
      console.error("demo/analyze pdf-parse error", err);
      await releaseFingerprintSlot(fingerprintHash).catch(() => {});
      return res.status(422).json({ error: "parse_failed", message: "Could not read this PDF. Please try another file." });
    }

    if (!pdfText.trim()) {
      await releaseFingerprintSlot(fingerprintHash).catch(() => {});
      return res.status(422).json({ error: "empty_text", message: "No readable text found in this PDF. Try a text-based PDF." });
    }

    // 4. Update guest analytics row (non-gating increment for tracking purposes).
    //    Enforcement is fully handled by reserveFingerprintSlot() in step 1.
    await db.query(
      `UPDATE demo_guests
       SET completed_uses = completed_uses + 1,
           exhausted_at = CASE WHEN completed_uses + 1 >= $2 THEN NOW() ELSE exhausted_at END,
           last_seen_at = NOW()
       WHERE id = $1`,
      [guest.id, DEMO_MAX_USES],
    ).catch((err) => console.error("demo/analyze guest-counter error (non-fatal)", err));

    // 5. Insert demo_run as 'started'
    let runId: string;
    try {
      const runInsert = await db.query(
        `INSERT INTO demo_runs (guest_id, tool_key, status, file_name, file_size_bytes, page_count)
         VALUES ($1, 'analyze', 'started', $2, $3, $4)
         RETURNING id`,
        [guest.id, file.originalname, file.size, pageCount],
      );
      runId = runInsert.rows[0].id;
    } catch (err) {
      console.error("demo/analyze run-insert error", err);
      // Roll back both the fingerprint slot and the guest analytics counter
      // so enforcement and analytics stay consistent.
      await releaseFingerprintSlot(fingerprintHash).catch(() => {});
      await db.query(
        `UPDATE demo_guests
         SET completed_uses = GREATEST(0, completed_uses - 1),
             exhausted_at = CASE
               WHEN GREATEST(0, completed_uses - 1) < $2 THEN NULL
               ELSE exhausted_at
             END,
             last_seen_at = NOW()
         WHERE id = $1`,
        [guest.id, DEMO_MAX_USES],
      ).catch(() => {});
      return res.status(500).json({ error: "internal_error", message: "Could not establish demo session." });
    }

    // 6. Run analysis
    let analysisResult: Awaited<ReturnType<typeof runDemoAnalysis>>;
    try {
      analysisResult = await runDemoAnalysis(pdfText, file.originalname);
    } catch (err) {
      console.error("demo/analyze openai error", err);
      // Mark run as failed and release the reserved slot — OpenAI errors
      // should not count against the guest's allowance.
      await db.query(
        `UPDATE demo_runs SET status = 'failed', failure_reason = $2, completed_at = NOW() WHERE id = $1`,
        [runId, "openai_error"],
      ).catch(() => {});
      await db.query(
        `UPDATE demo_guests
         SET completed_uses = GREATEST(0, completed_uses - 1),
             exhausted_at = CASE
               WHEN GREATEST(0, completed_uses - 1) < $2 THEN NULL
               ELSE exhausted_at
             END,
             last_seen_at = NOW()
         WHERE id = $1`,
        [guest.id, DEMO_MAX_USES],
      ).catch(() => {});
      await releaseFingerprintSlot(fingerprintHash).catch(() => {});
      return res.status(500).json({ error: "analysis_failed", message: "Analysis failed. Please try again." });
    }

    // 7. Mark run complete.
    await db.query(
      `UPDATE demo_runs SET status = 'complete', completed_at = NOW() WHERE id = $1`,
      [runId],
    ).catch((err) => console.error("demo/analyze run-complete error (non-fatal)", err));

    const nowExhausted = fingerprintTotalUses >= DEMO_MAX_USES;
    const remainingUses = Math.max(0, DEMO_MAX_USES - fingerprintTotalUses);

    return res.json({
      success: true,
      fileName: file.originalname,
      pageCount,
      documentType: analysisResult.documentType,
      summary: analysisResult.summary,
      keyRisks: analysisResult.keyRisks,
      nextSteps: analysisResult.nextSteps,
      missingItems: analysisResult.missingItems,
      completedUses: fingerprintTotalUses,
      remainingUses,
      isExhausted: nowExhausted,
    });
  },
);

export default router;
