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
    from: "PlainPath <support@plainpathapp.com>",
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
          <a href="https://plainpathapp.com" style="color: #4F6EF7;">plainpathapp.com</a>.
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
    from: "PlainPath <support@plainpathapp.com>",
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

        <a href="https://plainpathapp.com/app/analyze" style="display: inline-block; background: #4F6EF7; color: #fff; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; margin-bottom: 24px;">
          Open PlainPath →
        </a>

        <p style="font-size: 13px; color: #999; margin: 0;">
          Questions? Reply to this email — we read every message.<br>
          <a href="https://plainpathapp.com/app/privacy" style="color: #999;">Privacy policy</a>
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

// ── Welcome email sent on new account creation ───────────────────────────────
router.post("/api/reminders/welcome", async (req, res) => {
  const { email, firstName } = req.body as { email?: string; firstName?: string }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." })
  }

  const apiKey = getResendApiKey()
  if (!apiKey) return res.status(503).json({ error: "Email not configured." })

  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)
  const greeting = firstName ? `Hi ${firstName}` : "Hi there"

  const { error } = await resend.emails.send({
    from: "PlainPath <support@plainpathapp.com>",
    to: email.trim().toLowerCase(),
    subject: "Welcome to PlainPath — you're all set",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #F8F7F4;">
        <div style="padding: 32px 32px 0;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 28px;">
            <div style="width: 32px; height: 32px; background: #4F6EF7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <span style="font-size: 17px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.01em;">PlainPath</span>
          </div>

          <p style="font-size: 13px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 14px;">Welcome</p>
          <h1 style="font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.25; margin: 0 0 16px;">${greeting} — welcome to PlainPath</h1>

          <p style="font-size: 15px; color: #555; line-height: 1.65; margin: 0 0 28px;">
            You now have access to <strong>four document tools</strong> that turn confusing paperwork into plain-English action plans. No legal jargon. No hourly billing. Just the clarity you need to act confidently.
          </p>
        </div>

        <div style="margin: 0 32px 28px; background: #fff; border-radius: 14px; border: 1px solid #E8E8E8; overflow: hidden;">
          ${[
            { emoji: "🔍", title: "Analyze a Document", desc: "Upload any document and get a full plain-English breakdown — deadlines, required actions, key terms, and risks." },
            { emoji: "🛡️", title: "Document Trust Check", desc: "Verify if a letter or notice is legitimate. Catches scams, fake legal threats, and suspicious requests." },
            { emoji: "📝", title: "Contract Builder", desc: "Generate a professional contract in minutes by answering plain-English questions — no lawyer needed." },
            { emoji: "⚖️", title: "Contract Review", desc: "Spot unfair clauses, hidden obligations, and risky terms before you sign anything." },
          ].map((t, i) => `
            <div style="padding: 16px 20px; ${i < 3 ? "border-bottom: 1px solid #F0F0F0;" : ""}">
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                <span style="font-size: 20px; line-height: 1;">${t.emoji}</span>
                <div>
                  <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 3px;">${t.title}</p>
                  <p style="font-size: 13px; color: #777; margin: 0; line-height: 1.5;">${t.desc}</p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>

        <div style="padding: 0 32px 32px;">
          <a href="https://plainpathapp.com/app/analyze" style="display: inline-block; background: #4F6EF7; color: #fff; padding: 13px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; letter-spacing: -0.01em;">
            Open PlainPath →
          </a>

          <p style="font-size: 13px; color: #aaa; margin: 24px 0 0; line-height: 1.6;">
            Questions? Reply to this email — we read every message.<br>
            <a href="https://plainpathapp.com/app/privacy" style="color: #aaa;">Privacy Policy</a> · <a href="https://plainpathapp.com/app/terms" style="color: #aaa;">Terms of Service</a>
          </p>
        </div>
      </div>
    `,
  })

  if (error) {
    logger.error({ error }, "Welcome email send error")
    return res.status(500).json({ error: "Failed to send welcome email." })
  }

  return res.json({ sent: true })
})

export default router
