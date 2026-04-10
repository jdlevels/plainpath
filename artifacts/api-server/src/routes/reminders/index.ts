import { Router } from "express"
import { logger } from "../../lib/logger"

const router = Router()

function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null
}

async function sendReminderEmail(opts: {
  to: string
  deadlineTitle: string
  deadlineDate: string
  deadlineDescription: string
  docTitle: string
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = getResendApiKey()
  if (!apiKey) {
    return { ok: false, reason: "email_not_configured" }
  }

  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)

  const daysText = opts.deadlineDate
    ? `on <strong>${opts.deadlineDate}</strong>`
    : "coming up soon"

  const { error } = await resend.emails.send({
    from: "PlainPath <reminders@plain-path.app>",
    to: opts.to,
    subject: `Deadline reminder: ${opts.deadlineTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #F8F7F4; border-radius: 16px;">
        <p style="font-size: 13px; font-weight: 600; color: #6B6B6B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 16px;">Deadline Reminder · PlainPath</p>

        <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">${opts.deadlineTitle}</h1>

        <p style="font-size: 16px; color: #444; margin: 0 0 24px;">
          This deadline is ${daysText}. It was identified from:<br>
          <strong>${opts.docTitle}</strong>
        </p>

        ${opts.deadlineDescription ? `
        <div style="background: #fff; border-radius: 12px; padding: 16px 20px; border: 1px solid #E5E5E5; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #555; margin: 0;">${opts.deadlineDescription}</p>
        </div>
        ` : ""}

        <p style="font-size: 13px; color: #999; margin: 0;">
          This reminder was set via PlainPath. You can analyze more documents at
          <a href="https://plain-path.replit.app" style="color: #4F6EF7;">plain-path.replit.app</a>.
        </p>
      </div>
    `,
  })

  if (error) {
    logger.error({ error }, "Resend send error")
    return { ok: false, reason: error.message ?? "send_failed" }
  }

  return { ok: true }
}

router.post("/api/reminders/email", async (req, res) => {
  const { email, deadlineTitle, deadlineDate, deadlineDescription, docTitle } =
    req.body as {
      email?: string
      deadlineTitle?: string
      deadlineDate?: string
      deadlineDescription?: string
      docTitle?: string
    }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." })
  }

  if (!deadlineTitle || typeof deadlineTitle !== "string") {
    return res.status(400).json({ error: "deadlineTitle is required." })
  }

  const result = await sendReminderEmail({
    to: email.trim().toLowerCase(),
    deadlineTitle,
    deadlineDate: deadlineDate ?? "",
    deadlineDescription: deadlineDescription ?? "",
    docTitle: docTitle ?? "Your document",
  })

  if (!result.ok) {
    if (result.reason === "email_not_configured") {
      return res.status(503).json({
        error: "Email reminders are not yet configured on this server.",
      })
    }
    return res.status(500).json({ error: "Failed to send reminder email." })
  }

  return res.json({ sent: true })
})

// ── Welcome / drip email sent after first analysis ───────────────────────────
router.post("/api/reminders/drip", async (req, res) => {
  const { email, firstName, tool } =
    req.body as { email?: string; firstName?: string; tool?: string }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." })
  }

  const apiKey = getResendApiKey()
  if (!apiKey) {
    return res.status(503).json({ error: "Email not configured." })
  }

  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)

  const greeting = firstName ? `Hi ${firstName}` : "Hi there"
  const toolName = tool ?? "PlainPath"

  const { error } = await resend.emails.send({
    from: "PlainPath <hello@plain-path.app>",
    to: email.trim().toLowerCase(),
    subject: "Your first PlainPath analysis is ready",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #F8F7F4; border-radius: 16px;">
        <p style="font-size: 13px; font-weight: 600; color: #6B6B6B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 16px;">Welcome · PlainPath</p>

        <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px;">${greeting} — welcome to PlainPath 👋</h1>

        <p style="font-size: 15px; color: #444; margin: 0 0 20px; line-height: 1.6;">
          You just used <strong>${toolName}</strong> to analyze a document in plain English.
          No legal jargon. No hourly billing. Just the information you need to act confidently.
        </p>

        <div style="background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #E5E5E5; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">Three more tools waiting for you:</p>
          <ul style="margin: 0; padding: 0 0 0 20px; color: #555; font-size: 14px; line-height: 1.8;">
            <li><strong>Document Trust Check</strong> — verify if a document or letter is legitimate</li>
            <li><strong>Contract Builder</strong> — create a professional agreement in minutes</li>
            <li><strong>Contract Review</strong> — catch unfair clauses before you sign</li>
          </ul>
        </div>

        <a href="https://plain-path.replit.app" style="display: inline-block; background: #4F6EF7; color: #fff; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; margin-bottom: 24px;">
          Open PlainPath →
        </a>

        <p style="font-size: 13px; color: #999; margin: 0;">
          Questions? Reply to this email — we read every message.<br>
          <a href="https://plain-path.replit.app/privacy" style="color: #999;">Privacy policy</a>
        </p>
      </div>
    `,
  })

  if (error) {
    logger.error({ error }, "Drip send error")
    return res.status(500).json({ error: "Failed to send email." })
  }

  return res.json({ sent: true })
})

export default router
