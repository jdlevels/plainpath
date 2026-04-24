// ─── Document Overview Hub — API Routes ────────────────────────────────────────
// POST /api/document-overview/sessions          — upload doc, extract & analyze
// GET  /api/document-overview/sessions          — list user's sessions
// GET  /api/document-overview/sessions/:id      — get single session
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express"
import multer from "multer"
import { getAuth } from "@clerk/express"
import { pool } from "@workspace/db"
import { openai } from "@workspace/integrations-openai-ai-server"

const router = Router()

const MAX_BYTES = 50 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    const mime = file.mimetype.toLowerCase()
    const name = (file.originalname ?? "").toLowerCase()
    const ok =
      mime === "application/pdf" || name.endsWith(".pdf") ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword" ||
      name.endsWith(".docx") || name.endsWith(".doc") ||
      mime === "text/plain" || name.endsWith(".txt")
    if (ok) cb(null, true)
    else cb(new Error("Only PDF, Word (.docx), and plain text files are accepted"))
  },
})

function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: "unauthorized" })
  req.userId = userId
  next()
}

// ─── Table init ───────────────────────────────────────────────────────────────

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_overview_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'pdf',
      page_count INTEGER,
      status TEXT NOT NULL DEFAULT 'analyzing',
      overview JSONB,
      ask_session_id UUID,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS document_overview_sessions_user_idx
      ON document_overview_sessions(user_id, created_at DESC)
  `)
}

ensureTable().catch((err: Error) => {
  console.error("[document-overview] table init failed:", err.message)
})

// ─── Text extraction (mirrors ask-document) ───────────────────────────────────

async function extractPageTexts(
  buffer: Buffer,
  fileName: string,
): Promise<{ pageTexts: string[]; totalText: string }> {
  const name = fileName.toLowerCase()

  if (name.endsWith(".txt")) {
    const text = buffer.toString("utf-8")
    const words = text.split(/\s+/)
    const WORDS_PER_PAGE = 500
    const pageTexts: string[] = []
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
      pageTexts.push(words.slice(i, i + WORDS_PER_PAGE).join(" "))
    }
    return { pageTexts: pageTexts.length > 0 ? pageTexts : [text], totalText: text }
  }

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    try {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value
      const words = text.split(/\s+/)
      const WORDS_PER_PAGE = 500
      const pageTexts: string[] = []
      for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
        pageTexts.push(words.slice(i, i + WORDS_PER_PAGE).join(" "))
      }
      return { pageTexts: pageTexts.length > 0 ? pageTexts : [text], totalText: text }
    } catch {
      const text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ")
      return { pageTexts: [text], totalText: text }
    }
  }

  const pageTexts: string[] = []
  try {
    const pdfMod = await import("pdf-parse/lib/pdf-parse.js")
    const pdfParse: (buf: Buffer, opts?: any) => Promise<{ text: string; numpages: number }> =
      (pdfMod as any).default ?? (pdfMod as any)
    const parsed = await pdfParse(buffer, {
      pagerender(pageData: any) {
        return pageData.getTextContent().then((content: any) => {
          const text = content.items.map((item: any) => item.str ?? "").join(" ").trim()
          pageTexts.push(text)
          return text
        })
      },
    })
    if (pageTexts.length === 0) pageTexts.push(parsed.text)
    return { pageTexts, totalText: pageTexts.join("\n\n") }
  } catch {
    return { pageTexts: [""], totalText: "" }
  }
}

function buildPageContext(pageTexts: string[], maxChars = 16000): string {
  const lines: string[] = []
  let total = 0
  for (let i = 0; i < pageTexts.length; i++) {
    const header = `\n--- Page ${i + 1} ---\n`
    const content = pageTexts[i]?.trim() ?? ""
    if (!content) continue
    if (total + header.length + content.length > maxChars) {
      lines.push(
        `\n--- Page ${i + 1} (truncated) ---\n${content.slice(0, Math.max(0, maxChars - total - header.length - 20))}…`,
      )
      break
    }
    lines.push(header + content)
    total += header.length + content.length
  }
  return lines.join("")
}

// ─── AI overview generation ───────────────────────────────────────────────────

const OVERVIEW_SYSTEM = `You are a document intelligence AI. Your job is to extract structured, actionable intelligence from legal and business documents in plain English.

You MUST return ONLY valid JSON matching the exact schema below. No markdown, no explanation, just JSON.

Schema:
{
  "documentType": "string (e.g. NDA, Employment Agreement, Lease Agreement, Invoice, etc.)",
  "confidence": number (0.0 to 1.0 — how well-extracted the content was; low for scanned/image PDFs),
  "summary": "string (2-4 sentence plain-English summary of what this document is and what it does)",
  "risks": [
    {
      "level": "high" | "medium" | "low",
      "text": "string (plain-English explanation of the risk or watchout)",
      "page": number (1-indexed page number where this was found),
      "section": "string | null (e.g. § 7.2 if available)"
    }
  ],
  "keyDates": [
    {
      "label": "string (e.g. Effective Date, Renewal Deadline, Payment Due)",
      "value": "string (the actual date or duration, e.g. January 15, 2025 or 30 days)",
      "page": number,
      "section": "string | null",
      "isUrgent": boolean (true if this date is approaching or requires action)
    }
  ],
  "keyParties": [
    {
      "role": "string (e.g. Service Provider, Client, Landlord, Employee)",
      "name": "string (legal name of the party)",
      "detail": "string | null (e.g. Delaware LLC, California Corporation)",
      "page": number
    }
  ],
  "keyObligations": [
    {
      "party": "string (who has this obligation)",
      "text": "string (plain-English description of what they must do)",
      "page": number,
      "section": "string | null"
    }
  ],
  "recommendedActions": [
    {
      "action": "string (specific action the user should take, starting with a verb)",
      "tool": "ask-document" | "trust-check" | "contract-review" | "clause-extractor" | "compare-versions" | "redact" | "none",
      "detail": "string (one sentence explaining why this action matters for this specific document)",
      "isUrgent": boolean
    }
  ],
  "suggestedQuestions": ["string", "string", "string"]
}

Rules:
- risks: max 5 items, ordered high → medium → low
- keyDates: max 6 items, urgency = true if renewal/expiration/deadline within ~6 months
- keyParties: max 4 items
- keyObligations: max 6 items
- recommendedActions: EXACTLY 3 items, most important first
- suggestedQuestions: EXACTLY 3 natural questions a user might ask about this document
- All page numbers must be real page numbers from the document content provided
- If content is illegible or very sparse, set confidence < 0.6 and still provide your best effort
- Never fabricate specifics (names, dates, amounts) — only report what is actually in the document`

async function generateOverview(
  pageTexts: string[],
  fileName: string,
): Promise<{ overview: any; status: "ready" | "partial" }> {
  const pageContext = buildPageContext(pageTexts)
  const totalText = pageContext.trim()

  const isEmpty = totalText.length < 100
  if (isEmpty) {
    return {
      overview: {
        documentType: "Unknown",
        confidence: 0.1,
        summary: "PlainPath could not extract readable text from this document. It may be a scanned image or protected PDF.",
        risks: [],
        keyDates: [],
        keyParties: [],
        keyObligations: [],
        recommendedActions: [
          { action: "Ask questions about this document", tool: "ask-document", detail: "Even with limited text, you may be able to ask specific questions.", isUrgent: false },
          { action: "Run a Trust Check", tool: "trust-check", detail: "Verify document authenticity even without full text extraction.", isUrgent: false },
          { action: "Try uploading a cleaner scan", tool: "none", detail: "A higher-quality scan will give PlainPath more to work with.", isUrgent: false },
        ],
        suggestedQuestions: [
          "What type of document is this?",
          "Who are the parties involved?",
          "What are my obligations?",
        ],
      },
      status: "partial" as const,
    }
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_tokens: 2000,
    messages: [
      { role: "system", content: OVERVIEW_SYSTEM },
      {
        role: "user",
        content: `File name: ${fileName}\n\nDocument content (with page numbers):\n${pageContext}\n\nExtract the document overview as JSON.`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? "{}"
  let overview: any
  try {
    overview = JSON.parse(raw)
  } catch {
    overview = {
      documentType: "Unknown",
      confidence: 0.3,
      summary: "Overview could not be fully generated. Please try again.",
      risks: [], keyDates: [], keyParties: [], keyObligations: [],
      recommendedActions: [
        { action: "Ask questions about this document", tool: "ask-document", detail: "Use Ask This Document to explore the content directly.", isUrgent: false },
        { action: "Run a Trust Check", tool: "trust-check", detail: "Verify authenticity and check for red flags.", isUrgent: false },
        { action: "Extract specific clauses", tool: "clause-extractor", detail: "Pull out the clauses you care about most.", isUrgent: false },
      ],
      suggestedQuestions: ["What does this document cover?", "What are my obligations?", "What are the key dates?"],
    }
  }

  const status = (overview.confidence ?? 1) < 0.6 ? "partial" : "ready"
  return { overview, status }
}

// ─── POST /sessions — upload + analyze ───────────────────────────────────────

router.post("/sessions", requireAuth, upload.single("file"), async (req: any, res: any) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: "no_file", message: "No file was uploaded." })

  const userId = req.userId as string
  const fileName = file.originalname
  const fileType = fileName.toLowerCase().endsWith(".txt")
    ? "txt" : fileName.toLowerCase().endsWith(".docx") || fileName.toLowerCase().endsWith(".doc")
    ? "docx" : "pdf"

  // Insert skeleton row
  const insertRes = await pool.query(
    `INSERT INTO document_overview_sessions
       (user_id, file_name, file_size_bytes, file_type, status)
     VALUES ($1, $2, $3, $4, 'analyzing')
     RETURNING id`,
    [userId, fileName, file.size, fileType],
  )
  const sessionId: string = insertRes.rows[0].id

  try {
    // 1. Extract text
    const { pageTexts } = await extractPageTexts(file.buffer, fileName)
    const pageCount = pageTexts.length

    // 2. Generate overview via GPT-4o
    const { overview, status } = await generateOverview(pageTexts, fileName)

    // 3. Create an ask_document_sessions record so "Ask This Document" works with no re-upload
    let askSessionId: string | null = null
    try {
      const askInsert = await pool.query(
        `INSERT INTO ask_document_sessions
           (user_id, file_name, file_size_bytes, file_type, page_count, status, page_texts)
         VALUES ($1, $2, $3, $4, $5, 'ready', $6)
         RETURNING id`,
        [userId, fileName, file.size, fileType, pageCount, JSON.stringify(pageTexts)],
      )
      askSessionId = askInsert.rows[0].id
    } catch (askErr: any) {
      // Non-fatal — overview still works, just no direct Ask This Document link
      console.error("[document-overview] failed to create ask session:", askErr.message)
    }

    // 4. Finalize overview session
    await pool.query(
      `UPDATE document_overview_sessions
       SET status = $1, overview = $2, page_count = $3, ask_session_id = $4, updated_at = NOW()
       WHERE id = $5`,
      [status, JSON.stringify(overview), pageCount, askSessionId, sessionId],
    )

    return res.json({
      sessionId,
      askSessionId,
      fileName,
      fileSizeBytes: file.size,
      fileType,
      pageCount,
      status,
      overview,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("[document-overview] analysis error:", err.message)
    await pool.query(
      `UPDATE document_overview_sessions SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
      [err.message ?? "Unknown error", sessionId],
    )
    return res.status(500).json({
      error: "analysis_failed",
      message: "Overview generation failed. Please try again.",
    })
  }
})

// ─── GET /sessions — list user's recent sessions ──────────────────────────────

router.get("/sessions", requireAuth, async (req: any, res: any) => {
  const userId = req.userId as string
  const result = await pool.query(
    `SELECT id, file_name, file_size_bytes, file_type, page_count, status,
            overview, ask_session_id, error_message, created_at
     FROM document_overview_sessions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId],
  )
  const sessions = result.rows.map((r: any) => ({
    sessionId: r.id,
    askSessionId: r.ask_session_id ?? null,
    fileName: r.file_name,
    fileSizeBytes: r.file_size_bytes,
    fileType: r.file_type,
    pageCount: r.page_count ?? null,
    status: r.status,
    overview: r.overview ?? null,
    errorMessage: r.error_message ?? null,
    createdAt: r.created_at,
  }))
  return res.json(sessions)
})

// ─── GET /sessions/:id ────────────────────────────────────────────────────────

router.get("/sessions/:id", requireAuth, async (req: any, res: any) => {
  const userId = req.userId as string
  const { id } = req.params
  const result = await pool.query(
    `SELECT id, file_name, file_size_bytes, file_type, page_count, status,
            overview, ask_session_id, error_message, created_at
     FROM document_overview_sessions
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  )
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "not_found", message: "Session not found." })
  }
  const r = result.rows[0]
  return res.json({
    sessionId: r.id,
    askSessionId: r.ask_session_id ?? null,
    fileName: r.file_name,
    fileSizeBytes: r.file_size_bytes,
    fileType: r.file_type,
    pageCount: r.page_count ?? null,
    status: r.status,
    overview: r.overview ?? null,
    errorMessage: r.error_message ?? null,
    createdAt: r.created_at,
  })
})

export default router
