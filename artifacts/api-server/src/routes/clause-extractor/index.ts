// ─── Clause Extractor & Obligation Tracker API Routes ───────────────────────
// POST /api/clause-extractor/sessions   — upload doc + run extraction (sync)
// GET  /api/clause-extractor/sessions   — list user sessions
// GET  /api/clause-extractor/sessions/:id — get session + results
// DELETE /api/clause-extractor/sessions/:id — delete session
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireEntitlement } from "../../lib/requireEntitlement";

const router = Router();

const MAX_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    const mime = file.mimetype.toLowerCase();
    const name = (file.originalname || "").toLowerCase();
    const ok =
      mime === "application/pdf" ||
      name.endsWith(".pdf") ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword" ||
      name.endsWith(".docx") ||
      name.endsWith(".doc");
    if (ok) cb(null, true);
    else cb(new Error("Only PDF and Word (.docx) files are accepted"));
  },
});

function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

// ─── Table init ───────────────────────────────────────────────────────────────

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clause_extractor_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'pdf',
      status TEXT NOT NULL DEFAULT 'pending',
      results JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTable().catch((err: Error) => {
  console.error("[clause-extractor] table init failed:", err.message);
});

// ─── Text extraction ──────────────────────────────────────────────────────────

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const name = fileName.toLowerCase();
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }
  }
  try {
    const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
      (pdfMod as any).default ?? (pdfMod as any);
    const parsed = await pdfParse(buffer);
    return parsed.text;
  } catch {
    return "";
  }
}

// ─── OpenAI extraction ────────────────────────────────────────────────────────

const EXTRACTION_SYSTEM = `You are a legal document analysis expert. Extract structured data from contracts and agreements precisely and conservatively. Only report information explicitly present in the document. Never infer or hallucinate.`;

const EXTRACTION_PROMPT = (text: string) => `
Analyze the following contract/agreement text and extract structured data. Return ONLY a valid JSON object with exactly this structure:

{
  "documentType": "string describing the document type (e.g. 'Lease Agreement', 'Employment Contract', 'NDA')",
  "extractionConfidence": "high|medium|low",
  "keyDates": {
    "effectiveDate": "string or null",
    "executionDate": "string or null",
    "expirationDate": "string or null",
    "renewalDate": "string or null",
    "noticeDeadline": "string or null",
    "noticePeriod": "string or null"
  },
  "parties": [
    {
      "name": "string",
      "role": "string or null (e.g. Landlord, Tenant, Employer, Employee, Client, Vendor)",
      "type": "individual|company|unknown",
      "isSigner": true|false
    }
  ],
  "financialTerms": {
    "paymentAmount": "string or null",
    "paymentSchedule": "string or null",
    "lateFees": "string or null",
    "refundLanguage": "string or null",
    "otherTerms": ["array of other financial terms as strings"]
  },
  "legalClauses": {
    "governingLaw": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" },
    "terminationClause": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" },
    "autoRenewal": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" },
    "liabilityCap": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" },
    "indemnity": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" },
    "confidentiality": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" },
    "assignment": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" },
    "disputeResolution": { "present": true|false, "summary": "string or null", "snippet": "short quote from document or null" }
  },
  "obligations": [
    {
      "party": "string or null (who must act)",
      "obligation": "string (what they must do, in plain English)",
      "deadline": "string or null",
      "consequence": "string or null (what happens if not done)"
    }
  ],
  "missingFields": ["array of important fields typically expected for this document type that were NOT found"]
}

Rules:
- Only report dates, amounts, and terms actually stated in the document
- For legal clauses: only mark present=true if the clause is explicitly in the document
- For obligations: extract concrete, actionable obligations (not vague statements)
- For missingFields: list fields that would normally appear in this document type but are absent
- Keep summaries concise (1-2 sentences)
- Snippets should be short direct quotes (max 100 chars)

Document text:
---
${text.slice(0, 12000)}
---
`;

async function runExtraction(text: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM },
      { role: "user", content: EXTRACTION_PROMPT(text) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 2000,
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

// ─── POST /sessions ───────────────────────────────────────────────────────────

router.post(
  "/sessions",
  requireEntitlement("clause-extractor"),
  upload.single("file"),
  async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { originalname, buffer, size, mimetype } = req.file;
    const fileType = originalname.toLowerCase().endsWith(".docx") ||
      originalname.toLowerCase().endsWith(".doc") ? "docx" : "pdf";

    let sessionId: string;
    try {
      const idResult = await pool.query("SELECT gen_random_uuid()::text AS id");
      sessionId = idResult.rows[0].id;

      await pool.query(
        `INSERT INTO clause_extractor_sessions
           (id, user_id, file_name, file_size_bytes, file_type, status)
         VALUES ($1, $2, $3, $4, $5, 'processing')`,
        [sessionId, req.userId, originalname, size, fileType],
      );
    } catch (err: any) {
      console.error("[clause-extractor] session create error:", err.message);
      return res.status(500).json({ error: "Failed to create session" });
    }

    try {
      const text = await extractText(buffer, originalname);
      if (!text || text.trim().length < 50) {
        await pool.query(
          `UPDATE clause_extractor_sessions SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
          ["Could not extract readable text from this document. Please ensure the file is not scanned/image-only.", sessionId],
        );
        const row = await pool.query(
          `SELECT * FROM clause_extractor_sessions WHERE id = $1`,
          [sessionId],
        );
        return res.status(200).json(formatSession(row.rows[0]));
      }

      const results = await runExtraction(text);

      await pool.query(
        `UPDATE clause_extractor_sessions SET status = 'done', results = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(results), sessionId],
      );

      const row = await pool.query(
        `SELECT * FROM clause_extractor_sessions WHERE id = $1`,
        [sessionId],
      );
      return res.status(201).json(formatSession(row.rows[0]));
    } catch (err: any) {
      console.error("[clause-extractor] extraction error:", err.message);
      await pool.query(
        `UPDATE clause_extractor_sessions SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
        [err.message || "Extraction failed", sessionId],
      ).catch(() => {});
      const row = await pool.query(
        `SELECT * FROM clause_extractor_sessions WHERE id = $1`,
        [sessionId],
      );
      return res.status(200).json(formatSession(row.rows[0]));
    }
  },
);

// ─── GET /sessions ────────────────────────────────────────────────────────────

router.get("/sessions", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, file_name, file_size_bytes, file_type, status, error_message, created_at, updated_at
       FROM clause_extractor_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.userId],
    );
    return res.json(result.rows.map(formatSessionMeta));
  } catch (err: any) {
    console.error("[clause-extractor] list error:", err.message);
    return res.status(500).json({ error: "Failed to list sessions" });
  }
});

// ─── GET /sessions/:id ────────────────────────────────────────────────────────

router.get("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT * FROM clause_extractor_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    return res.json(formatSession(result.rows[0]));
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ─── DELETE /sessions/:id ─────────────────────────────────────────────────────

router.delete("/sessions/:id", requireAuth, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `DELETE FROM clause_extractor_sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete session" });
  }
});

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatSessionMeta(row: any) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    fileType: row.file_type,
    status: row.status,
    errorMessage: row.error_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatSession(row: any) {
  return {
    ...formatSessionMeta(row),
    results: row.results ?? null,
  };
}

export default router;
