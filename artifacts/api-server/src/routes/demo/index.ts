import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import multer from "multer";
import { pool as db } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

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
  // IPv4: take first two octets; IPv6: take first two groups
  if (raw.includes(".")) {
    const parts = raw.split(".");
    return `${parts[0] ?? "0"}.${parts[1] ?? "0"}`;
  }
  const parts = raw.split(":");
  return parts.slice(0, 2).join(":");
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
// Side-effects: creates guest if missing, updates last_seen_at + fingerprint

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
      // Update last_seen_at and set fingerprint if missing
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

// ─── Quota check ─────────────────────────────────────────────────────────────
// Returns true if the guest or fingerprint is exhausted

async function isQuotaExhausted(
  guest: Record<string, unknown>,
  fingerprintHash: string,
): Promise<boolean> {
  if ((guest.completed_uses as number) >= DEMO_MAX_USES) return true;

  // Fingerprint backstop: check if ANOTHER guest with same fingerprint is exhausted within 7 days
  const fp = await db.query(
    `SELECT id FROM demo_guests
     WHERE fingerprint_hash = $1
       AND exhausted_at IS NOT NULL
       AND exhausted_at > NOW() - INTERVAL '${FINGERPRINT_BLOCK_DAYS} days'
       AND id <> $2
     LIMIT 1`,
    [fingerprintHash, guest.id],
  );
  return fp.rows.length > 0;
}

// Pre-flight fingerprint exhaustion check — does NOT touch the guest table.
// Used before resolveGuest() so requests from exhausted fingerprints are
// rejected without creating a new demo_guests row.
async function isFingerprintBlocked(fingerprintHash: string): Promise<boolean> {
  const fp = await db.query(
    `SELECT id FROM demo_guests
     WHERE fingerprint_hash = $1
       AND exhausted_at IS NOT NULL
       AND exhausted_at > NOW() - INTERVAL '${FINGERPRINT_BLOCK_DAYS} days'
     LIMIT 1`,
    [fingerprintHash],
  );
  return fp.rows.length > 0;
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
// This prevents attackers from inflating demo_guests by hitting /status repeatedly.

router.get("/status", async (req: Request, res: Response) => {
  try {
    const existingToken: string | undefined = req.cookies?.[DEMO_COOKIE_NAME];

    if (!existingToken) {
      return res.json({
        demoGuestPresent: false,
        completedUses: 0,
        remainingUses: DEMO_MAX_USES,
        isExhausted: false,
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
        completedUses: 0,
        remainingUses: DEMO_MAX_USES,
        isExhausted: false,
      });
    }

    const guest = result.rows[0];
    const fingerprintHash = getFingerprintHash(req);
    const exhausted = await isQuotaExhausted(guest, fingerprintHash);
    const completedUses = guest.completed_uses as number;
    const remainingUses = Math.max(0, DEMO_MAX_USES - completedUses);

    return res.json({
      demoGuestPresent: true,
      completedUses,
      remainingUses,
      isExhausted: exhausted,
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
    // 0. Pre-flight fingerprint check — reject exhausted fingerprints BEFORE
    //    calling resolveGuest() so we never create a new demo_guests row for
    //    an IP that is already blocked.  This closes the unbounded row-creation
    //    path where dropping the cookie + hitting /analyze would mint a guest
    //    row even though the fingerprint backstop would immediately reject it.
    const fingerprintHash = getFingerprintHash(req);
    try {
      const fpBlocked = await isFingerprintBlocked(fingerprintHash);
      if (fpBlocked) {
        return res.status(403).json({
          error: "quota_exhausted",
          message: "You have used all 2 free demo analyses. Create a free account to continue.",
          remainingUses: 0,
          isExhausted: true,
        });
      }
    } catch (err) {
      console.error("demo/analyze fingerprint-check error", err);
      return res.status(500).json({ error: "internal_error", message: "Could not establish demo session." });
    }

    // 1. File validation — done BEFORE guest creation so invalid requests
    //    from cookie-less callers are rejected without writing any DB rows.
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

    // 2. Resolve guest (creates + sets cookie if new).
    //    Safe to create a row here: fingerprint is confirmed not exhausted
    //    (step 0) and the uploaded file is valid (step 1).
    let guest: Record<string, unknown>;
    try {
      ({ guest } = await resolveGuest(req, res));
    } catch (err) {
      console.error("demo/analyze guest error", err);
      return res.status(500).json({ error: "internal_error", message: "Could not establish demo session." });
    }

    // 3. Quota check (covers the case where the existing guest's own count is exhausted)
    const exhausted = await isQuotaExhausted(guest, fingerprintHash);
    if (exhausted) {
      return res.status(403).json({
        error: "quota_exhausted",
        message: "You have used all 2 free demo analyses. Create a free account to continue.",
        remainingUses: 0,
        isExhausted: true,
      });
    }

    // 4. Parse PDF
    let pdfText = "";
    let pageCount = 0;
    try {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const parsed = await pdfParse(file.buffer);
      pdfText = parsed.text ?? "";
      pageCount = parsed.numpages ?? 0;
    } catch (err) {
      console.error("demo/analyze pdf-parse error", err);
      return res.status(422).json({ error: "parse_failed", message: "Could not read this PDF. Please try another file." });
    }

    if (pageCount > DEMO_MAX_PAGES) {
      return res.status(400).json({
        error: "too_many_pages",
        message: `Demo analysis is limited to ${DEMO_MAX_PAGES} pages. This file has ${pageCount} pages.`,
      });
    }

    if (!pdfText.trim()) {
      return res.status(422).json({ error: "empty_text", message: "No readable text found in this PDF. Try a text-based PDF." });
    }

    // 5. Insert demo_run as 'started'
    const runInsert = await db.query(
      `INSERT INTO demo_runs (guest_id, tool_key, status, file_name, file_size_bytes, page_count)
       VALUES ($1, 'analyze', 'started', $2, $3, $4)
       RETURNING id`,
      [guest.id, file.originalname, file.size, pageCount],
    );
    const runId: string = runInsert.rows[0].id;

    // 6. Run analysis
    let analysisResult: Awaited<ReturnType<typeof runDemoAnalysis>>;
    try {
      analysisResult = await runDemoAnalysis(pdfText, file.originalname);
    } catch (err) {
      console.error("demo/analyze openai error", err);
      // Mark run as failed — do NOT count toward quota
      await db.query(
        `UPDATE demo_runs SET status = 'failed', failure_reason = $2, completed_at = NOW() WHERE id = $1`,
        [runId, "openai_error"],
      );
      return res.status(500).json({ error: "analysis_failed", message: "Analysis failed. Please try again." });
    }

    // 7. Mark run complete + increment quota
    await db.query(
      `UPDATE demo_runs SET status = 'complete', completed_at = NOW() WHERE id = $1`,
      [runId],
    );

    const newCompletedUses = (guest.completed_uses as number) + 1;
    const nowExhausted = newCompletedUses >= DEMO_MAX_USES;
    await db.query(
      `UPDATE demo_guests
       SET completed_uses = $2,
           exhausted_at = CASE WHEN $3 THEN NOW() ELSE exhausted_at END,
           last_seen_at = NOW()
       WHERE id = $1`,
      [guest.id, newCompletedUses, nowExhausted],
    );

    const remainingUses = Math.max(0, DEMO_MAX_USES - newCompletedUses);

    return res.json({
      success: true,
      fileName: file.originalname,
      pageCount,
      documentType: analysisResult.documentType,
      summary: analysisResult.summary,
      keyRisks: analysisResult.keyRisks,
      nextSteps: analysisResult.nextSteps,
      missingItems: analysisResult.missingItems,
      completedUses: newCompletedUses,
      remainingUses,
      isExhausted: nowExhausted,
    });
  },
);

export default router;
