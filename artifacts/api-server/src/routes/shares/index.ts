import { Router } from "express"
import { pool } from "@workspace/db"
import { randomBytes } from "crypto"

const router = Router()

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

ensureTable().catch(console.error)

router.post("/shares", async (req, res) => {
  try {
    const { analysis } = req.body as { analysis: unknown }
    if (!analysis || typeof analysis !== "object") {
      return res.status(400).json({ error: "analysis object required" })
    }
    const token = randomBytes(8).toString("hex")
    const title = (analysis as Record<string, unknown>).title as string | undefined
    await pool.query(
      "INSERT INTO shared_analyses (token, analysis, title) VALUES ($1, $2, $3)",
      [token, JSON.stringify(analysis), title ?? null]
    )
    return res.json({ token, url: `/shared/${token}` })
  } catch (err) {
    console.error("shares POST error:", err)
    return res.status(500).json({ error: "Failed to create share link" })
  }
})

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
    return res.json({ analysis: result.rows[0].analysis, title: result.rows[0].title, createdAt: result.rows[0].created_at })
  } catch (err) {
    console.error("shares GET error:", err)
    return res.status(500).json({ error: "Failed to load shared analysis" })
  }
})

export default router
