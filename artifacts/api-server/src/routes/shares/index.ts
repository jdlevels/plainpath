import { Router, type Request, type Response, type NextFunction } from "express"
import { pool } from "@workspace/db"
import { randomBytes } from "crypto"
import { getAuth } from "@clerk/express"

const router = Router()

interface AuthedRequest extends Request {
  userId: string
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req)
  const userId = auth?.userId
  if (!userId) {
    res.status(401).json({ error: "unauthorized" })
    return
  }
  (req as AuthedRequest).userId = userId
  next()
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared_analyses (
      token       TEXT PRIMARY KEY,
      analysis    JSONB NOT NULL,
      title       TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
    )
  `)
}

async function deleteExpiredRows() {
  try {
    const result = await pool.query("DELETE FROM shared_analyses WHERE expires_at <= NOW()")
    if ((result.rowCount ?? 0) > 0) {
      console.log(`shares cleanup: deleted ${result.rowCount} expired row(s)`)
    }
  } catch (err) {
    console.error("shares cleanup error:", err)
  }
}

async function sanitizeExistingRows() {
  try {
    const { rows } = await pool.query<{ token: string; analysis: Record<string, unknown> }>(
      "SELECT token, analysis FROM shared_analyses WHERE expires_at > NOW()"
    )
    for (const row of rows) {
      if (typeof row.analysis === "object" && row.analysis !== null) {
        const hadSections = "sections" in row.analysis
        const hadEvidence =
          hasSourceEvidence(row.analysis.actionSteps) ||
          hasSourceEvidence(row.analysis.requiredDocuments) ||
          hasSourceEvidence(row.analysis.deadlines) ||
          hasSourceEvidence(row.analysis.risks)
        if (hadSections || hadEvidence) {
          const clean = stripDocumentContent(row.analysis)
          await pool.query("UPDATE shared_analyses SET analysis = $1 WHERE token = $2", [
            JSON.stringify(clean),
            row.token,
          ])
        }
      }
    }
  } catch (err) {
    console.error("shares sanitize-existing error:", err)
  }
}

function hasSourceEvidence(arr: unknown): boolean {
  if (!Array.isArray(arr)) return false
  return arr.some(
    (item) => item && typeof item === "object" && "sourceEvidence" in (item as object)
  )
}

function stripDocumentContent(analysis: Record<string, unknown>): Record<string, unknown> {
  const { sections: _sections, ...rest } = analysis

  const stripEvidence = (item: unknown): unknown => {
    if (!item || typeof item !== "object") return item
    const { sourceEvidence: _se, ...clean } = item as Record<string, unknown>
    return clean
  }

  return {
    ...rest,
    ...(Array.isArray(rest.actionSteps)       ? { actionSteps:       rest.actionSteps.map(stripEvidence)       } : {}),
    ...(Array.isArray(rest.requiredDocuments)  ? { requiredDocuments:  rest.requiredDocuments.map(stripEvidence)  } : {}),
    ...(Array.isArray(rest.deadlines)          ? { deadlines:          rest.deadlines.map(stripEvidence)          } : {}),
    ...(Array.isArray(rest.risks)              ? { risks:              rest.risks.map(stripEvidence)              } : {}),
  }
}

ensureTable()
  .then(() => deleteExpiredRows())
  .then(() => sanitizeExistingRows())
  .catch(console.error)

// Purge expired rows once per hour so storage stays bounded.
setInterval(() => {
  deleteExpiredRows().catch(console.error)
}, 60 * 60 * 1000)

// POST /api/shares — authentication required
router.post("/shares", requireAuth, async (req, res) => {
  try {
    const { analysis } = req.body as { analysis: unknown }
    if (!analysis || typeof analysis !== "object") {
      return res.status(400).json({ error: "analysis object required" })
    }
    const sanitized = stripDocumentContent(analysis as Record<string, unknown>)
    const token = randomBytes(8).toString("hex")
    const title = sanitized.title as string | undefined
    await pool.query(
      "INSERT INTO shared_analyses (token, analysis, title) VALUES ($1, $2, $3)",
      [token, JSON.stringify(sanitized), title ?? null]
    )
    return res.json({ token, url: `/shared/${token}` })
  } catch (err) {
    console.error("shares POST error:", err)
    return res.status(500).json({ error: "Failed to create share link" })
  }
})

// GET /api/shares/:token — public read is fine; only creation requires auth
router.get("/shares/:token", async (req, res) => {
  try {
    const { token } = req.params
    const result = await pool.query(
      "SELECT analysis, title, created_at FROM shared_analyses WHERE token = $1 AND expires_at > NOW()",
      [token]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Share link not found or expired" })
    }
    const raw = result.rows[0].analysis as Record<string, unknown>
    const analysis = typeof raw === "object" && raw !== null
      ? stripDocumentContent(raw)
      : raw
    return res.json({ analysis, title: result.rows[0].title, createdAt: result.rows[0].created_at })
  } catch (err) {
    console.error("shares GET error:", err)
    return res.status(500).json({ error: "Failed to load shared analysis" })
  }
})

export default router
