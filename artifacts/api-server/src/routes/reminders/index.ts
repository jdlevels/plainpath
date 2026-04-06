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

export default router
