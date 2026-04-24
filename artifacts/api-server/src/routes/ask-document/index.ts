// ─── Ask This Document — API Routes ──────────────────────────────────────────
// POST /api/ask-document/sessions          — upload doc, extract text
// GET  /api/ask-document/sessions/:id      — get session
// POST /api/ask-document/sessions/:id/ask  — ask a question, get grounded answer
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express"
import multer from "multer"
import { getAuth } from "@clerk/express"
import { pool } from "@workspace/db"
import { openai } from "@workspace/integrations-openai-ai-server"

const router = Router()

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    const mime = file.mimetype.toLowerCase()
    const name = (file.originalname ?? "").toLowerCase()
    const ok =
      mime === "application/pdf" ||
      name.endsWith(".pdf") ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword" ||
      name.endsWith(".docx") ||
      name.endsWith(".doc") ||
      mime === "text/plain" ||
      name.endsWith(".txt")
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
    CREATE TABLE IF NOT EXISTS ask_document_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'pdf',
      page_count INTEGER,
      status TEXT NOT NULL DEFAULT 'ready',
      page_texts JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ask_document_exchanges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES ask_document_sessions(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer JSONB,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

ensureTable().catch((err: Error) => {
  console.error("[ask-document] table init failed:", err.message)
})

// ─── Text extraction: returns array of strings (one per page) ─────────────────

async function extractPageTexts(buffer: Buffer, fileName: string): Promise<{ pageTexts: string[]; totalText: string }> {
  const name = fileName.toLowerCase()

  if (name.endsWith(".txt")) {
    const text = buffer.toString("utf-8")
    // Split into ~500-word pages for text files
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
      // Split DOCX into ~500-word pages
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

  // PDF: extract page-by-page using pdf-parse pagerender callback
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

    if (pageTexts.length === 0) {
      // Fallback: single page
      pageTexts.push(parsed.text)
    }

    return { pageTexts, totalText: pageTexts.join("\n\n") }
  } catch {
    return { pageTexts: [""], totalText: "" }
  }
}

// ─── Build page-numbered context string for AI ───────────────────────────────

function buildPageContext(pageTexts: string[], maxChars = 14000): string {
  const lines: string[] = []
  let total = 0
  for (let i = 0; i < pageTexts.length; i++) {
    const header = `\n--- Page ${i + 1} ---\n`
    const content = pageTexts[i]?.trim() ?? ""
    if (!content) continue
    if (total + header.length + content.length > maxChars) {
      // Include truncation note
      lines.push(`\n--- Page ${i + 1} (truncated) ---\n${content.slice(0, Math.max(0, maxChars - total - header.length - 20))}…`)
      break
    }
    lines.push(header + content)
    total += header.length + content.length
  }
  return lines.join("")
}

// ─── Ask AI ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a document analysis assistant. Your ONLY job is to answer questions about the specific document provided. You must not use any general knowledge or information outside the document.

Rules:
- If the answer is clearly found in the document, provide it with exact page citations.
- If the answer is NOT clearly found, set notFoundInDocument: true and explain what you did find that is related.
- Never fabricate information. Never guess. Never use world knowledge.
- Each finding must have a citation with the actual page number from the document.
- Excerpts must be short verbatim quotes from the document (max 120 chars).
- Follow-up questions should help the user explore the document further.`

const buildUserPrompt = (question: string, pageContext: string) => `
Document content (with page numbers):
${pageContext}

User question: "${question}"

Respond with ONLY a valid JSON object in exactly this structure:
{
  "confidence": "high|medium|low",
  "notFoundInDocument": false,
  "summary": "1-3 sentence direct answer to the question, or explanation of why it wasn't found",
  "findings": [
    {
      "id": 1,
      "title": "short finding title (max 8 words)",
      "body": "2-4 sentence explanation in plain English",
      "citation": {
        "page": <integer page number from document>,
        "section": "section heading or § reference if visible, or null",
        "excerpt": "short verbatim quote from the document (max 120 chars)"
      }
    }
  ],
  "followUps": ["question 1", "question 2", "question 3"]
}

- If notFoundInDocument is true: still include the closest related finding if any exists, but set confidence to "low"
- findings array: 1-4 items maximum. Empty array if truly nothing relevant found.
- followUps: always 3 items
`

async function runAskAI(question: string, pageTexts: string[]): Promise<any> {
  const pageContext = buildPageContext(pageTexts)
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(question, pageContext) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1500,
  })
  const content = response.choices[0]?.message?.content ?? "{}"
  return JSON.parse(content)
}

// ─── POST /sessions ───────────────────────────────────────────────────────────

router.post(
  "/sessions",
  requireAuth,
  upload.single("file"),
  async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ error: "no_file", message: "No file uploaded." })
    }
    const { originalname, buffer, size } = req.file
    const fileNameLower = originalname.toLowerCase()
    const fileType = fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".doc")
      ? "docx"
      : fileNameLower.endsWith(".txt")
        ? "txt"
        : "pdf"

    // Create session immediately
    let sessionId: string
    try {
      const idRes = await pool.query("SELECT gen_random_uuid()::text AS id")
      sessionId = idRes.rows[0].id
      await pool.query(
        `INSERT INTO ask_document_sessions
           (id, user_id, file_name, file_size_bytes, file_type, status)
         VALUES ($1, $2, $3, $4, $5, 'extracting')`,
        [sessionId, req.userId, originalname, size, fileType],
      )
    } catch (err: any) {
      console.error("[ask-document] session create error:", err.message)
      return res.status(500).json({ error: "session_error", message: "Failed to create session." })
    }

    // Extract text synchronously
    let pageTexts: string[]
    let totalText: string
    try {
      const extracted = await extractPageTexts(buffer, originalname)
      pageTexts = extracted.pageTexts
      totalText = extracted.totalText

      if (!totalText.trim()) {
        await pool.query(
          `UPDATE ask_document_sessions SET status='error', error_message=$1, updated_at=NOW() WHERE id=$2`,
          ["Could not extract text from this document. It may be a scanned image. Try a text-based PDF or Word file.", sessionId],
        )
        return res.status(422).json({
          error: "no_text",
          message: "Could not extract text from this document. It may be a scanned image. Try a text-based PDF or Word file.",
          sessionId,
        })
      }

      await pool.query(
        `UPDATE ask_document_sessions
           SET status='ready', page_texts=$1, page_count=$2, updated_at=NOW()
         WHERE id=$3`,
        [JSON.stringify(pageTexts), pageTexts.length, sessionId],
      )
    } catch (err: any) {
      console.error("[ask-document] extraction error:", err.message)
      await pool.query(
        `UPDATE ask_document_sessions SET status='error', error_message=$1, updated_at=NOW() WHERE id=$2`,
        ["Text extraction failed. Please try again.", sessionId],
      )
      return res.status(500).json({ error: "extraction_failed", message: "Failed to read your document. Please try again." })
    }

    return res.status(201).json({
      sessionId,
      fileName: originalname,
      fileType,
      pageSizeBytes: size,
      pageCount: pageTexts.length,
      status: "ready",
    })
  },
)

// ─── GET /sessions/:id ────────────────────────────────────────────────────────

router.get("/sessions/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params
  try {
    const sessionRes = await pool.query(
      `SELECT id, user_id, file_name, file_size_bytes, file_type, page_count, status, error_message, created_at
       FROM ask_document_sessions WHERE id=$1`,
      [id],
    )
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: "not_found" })
    }
    const session = sessionRes.rows[0]
    if (session.user_id !== req.userId) {
      return res.status(403).json({ error: "forbidden" })
    }

    const exchangeRes = await pool.query(
      `SELECT id, question, answer, status, error_message, created_at
       FROM ask_document_exchanges WHERE session_id=$1 ORDER BY created_at ASC`,
      [id],
    )

    return res.json({
      id: session.id,
      fileName: session.file_name,
      fileSizeBytes: session.file_size_bytes,
      fileType: session.file_type,
      pageCount: session.page_count,
      status: session.status,
      errorMessage: session.error_message,
      createdAt: session.created_at,
      exchanges: exchangeRes.rows.map((e: any) => ({
        id: e.id,
        question: e.question,
        answer: e.answer,
        status: e.status,
        errorMessage: e.error_message,
        createdAt: e.created_at,
      })),
    })
  } catch (err: any) {
    console.error("[ask-document] get session error:", err.message)
    return res.status(500).json({ error: "internal_error" })
  }
})

// ─── POST /sessions/:id/ask ───────────────────────────────────────────────────

router.post("/sessions/:id/ask", requireAuth, async (req: any, res: any) => {
  const { id } = req.params
  const question = (req.body?.question ?? "").trim()
  if (!question) {
    return res.status(400).json({ error: "no_question", message: "A question is required." })
  }
  if (question.length > 1000) {
    return res.status(400).json({ error: "question_too_long", message: "Question must be under 1000 characters." })
  }

  // Load session + page texts
  let sessionRow: any
  let pageTexts: string[]
  try {
    const res2 = await pool.query(
      `SELECT id, user_id, status, page_texts FROM ask_document_sessions WHERE id=$1`,
      [id],
    )
    if (res2.rows.length === 0) return res.status(404).json({ error: "not_found" })
    sessionRow = res2.rows[0]
    if (sessionRow.user_id !== req.userId) return res.status(403).json({ error: "forbidden" })
    if (sessionRow.status !== "ready") {
      return res.status(409).json({ error: "session_not_ready", message: "Session is not ready." })
    }
    pageTexts = sessionRow.page_texts ?? [""]
  } catch (err: any) {
    console.error("[ask-document] session load error:", err.message)
    return res.status(500).json({ error: "internal_error" })
  }

  // Create exchange record
  let exchangeId: string
  try {
    const exRes = await pool.query(
      `INSERT INTO ask_document_exchanges (session_id, question, status)
       VALUES ($1, $2, 'processing') RETURNING id`,
      [id, question],
    )
    exchangeId = exRes.rows[0].id
  } catch (err: any) {
    console.error("[ask-document] exchange create error:", err.message)
    return res.status(500).json({ error: "internal_error" })
  }

  // Run AI
  try {
    const answer = await runAskAI(question, pageTexts)
    await pool.query(
      `UPDATE ask_document_exchanges SET status='done', answer=$1 WHERE id=$2`,
      [JSON.stringify(answer), exchangeId],
    )
    return res.json({ exchangeId, answer })
  } catch (err: any) {
    console.error("[ask-document] AI error:", err.message)
    await pool.query(
      `UPDATE ask_document_exchanges SET status='error', error_message=$1 WHERE id=$2`,
      [err.message, exchangeId],
    )
    return res.status(500).json({
      error: "ai_error",
      message: "The AI could not generate an answer. Please try again.",
    })
  }
})

export default router
