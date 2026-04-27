import { Router } from "express"
import {
  createPendingVerification,
  confirmVerification,
  isAlreadyOnWaitlist,
  getWaitlistCount,
} from "../lib/waitlistDb.js"
import { logger } from "../lib/logger.js"

const router = Router()

function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null
}

/**
 * Step 1 email: asks the submitter to confirm they own the address.
 * No branded "you're on the list" content — just a plain verification link.
 */
async function sendVerificationEmail(email: string, token: string) {
  const apiKey = getResendApiKey()
  if (!apiKey) return

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)

    const baseUrl =
      process.env.PUBLIC_API_BASE_URL ?? "https://plainpathapp.com/api"
    const verifyUrl = `${baseUrl}/waitlist/verify?token=${token}`

    await resend.emails.send({
      from: "PlainPath <support@plainpathapp.com>",
      to: email,
      subject: "Confirm your PlainPath waitlist spot",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #F8F7F4; border-radius: 16px;">

          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 28px;">
            <div style="width: 36px; height: 36px; background: #4F46E5; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 18px;">📄</span>
            </div>
            <span style="font-weight: 700; font-size: 18px; color: #1a1a1a; letter-spacing: -0.3px;">PlainPath</span>
          </div>

          <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px; line-height: 1.3;">
            Confirm your email address
          </h1>
          <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
            Click the button below to confirm your email and reserve your spot on the PlainPath mobile waitlist.
            This link expires in 24 hours.
          </p>

          <a href="${verifyUrl}" style="display: inline-block; background: #4F46E5; color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-bottom: 24px;">
            Confirm my spot →
          </a>

          <p style="font-size: 12px; color: #bbb; margin: 32px 0 0; border-top: 1px solid #eee; padding-top: 16px;">
            If you didn't request this, you can ignore this email — no action is needed.
            Questions? Write to <a href="mailto:support@plainpathapp.com" style="color: #bbb;">support@plainpathapp.com</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    logger.warn({ err }, "waitlist: failed to send verification email")
  }
}

/**
 * Step 2 email: sent only after the submitter has clicked the verify link.
 */
async function sendConfirmationEmail(email: string, platform: string) {
  const apiKey = getResendApiKey()
  if (!apiKey) return

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)

    const platformLabel =
      platform === "ios" ? "iPhone (iOS)"
      : platform === "android" ? "Android"
      : "iPhone and Android"

    await resend.emails.send({
      from: "PlainPath <support@plainpathapp.com>",
      to: email,
      subject: "You're on the list — PlainPath mobile is coming",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #F8F7F4; border-radius: 16px;">

          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 28px;">
            <div style="width: 36px; height: 36px; background: #4F46E5; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 18px;">📄</span>
            </div>
            <span style="font-weight: 700; font-size: 18px; color: #1a1a1a; letter-spacing: -0.3px;">PlainPath</span>
          </div>

          <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px; line-height: 1.3;">
            You're on the list!
          </h1>
          <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
            We'll send you a heads-up as soon as PlainPath lands on <strong>${platformLabel}</strong>. You'll be among the first to know.
          </p>

          <div style="background: #fff; border-radius: 12px; padding: 18px 20px; border: 1px solid #E5E5E5; margin-bottom: 24px;">
            <p style="font-size: 13px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px;">What's coming to mobile:</p>
            <ul style="font-size: 13px; color: #555; margin: 0; padding-left: 18px; line-height: 1.8;">
              <li>Analyze documents with your camera — point and shoot</li>
              <li>Document Trust Check for suspicious mail and letters</li>
              <li>Build and review contracts on the go</li>
              <li>Your saved analyses synced across all devices</li>
            </ul>
          </div>

          <p style="font-size: 13px; color: #888; margin: 0 0 4px;">
            In the meantime, the full PlainPath web app is available now at no cost — no account needed.
          </p>
          <a href="https://plainpathapp.com/app/analyze" style="font-size: 13px; color: #4F46E5; font-weight: 600;">
            Try the web app →
          </a>

          <p style="font-size: 12px; color: #bbb; margin: 32px 0 0; border-top: 1px solid #eee; padding-top: 16px;">
            You're receiving this because you confirmed your spot on the PlainPath mobile waitlist.
            Questions? Reply to this email or write to <a href="mailto:support@plainpathapp.com" style="color: #bbb;">support@plainpathapp.com</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    logger.warn({ err }, "waitlist: failed to send confirmation email")
  }
}

/**
 * POST /waitlist/join
 *
 * Double-opt-in step 1: validate the address format, then create a pending
 * verification token and email the submitter a confirmation link.  No email
 * is added to the waitlist and no branded "you're in" message is sent until
 * the submitter proves mailbox ownership via GET /waitlist/verify.
 *
 * The response is always `{ ok: true }` regardless of whether the address was
 * already confirmed, already pending, or brand-new — preventing enumeration.
 */
router.post("/waitlist/join", async (req, res) => {
  const { email, platform = "both", source = "marketing" } = req.body ?? {}

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email_required" })
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(email)) {
    return res.status(400).json({ error: "invalid_email" })
  }

  const validPlatforms = ["ios", "android", "both"]
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: "invalid_platform" })
  }

  try {
    // If already confirmed, silently succeed — no email, no oracle.
    if (isAlreadyOnWaitlist(email)) {
      return res.json({ ok: true })
    }

    const { token, shouldSendEmail } = createPendingVerification(
      email,
      platform as "ios" | "android" | "both",
      source,
    )

    if (shouldSendEmail) {
      void sendVerificationEmail(email, token)
    }

    logger.info({ platform }, "waitlist: verification email queued")
    return res.json({ ok: true })
  } catch (err) {
    logger.error({ err }, "waitlist: join failed")
    return res.status(500).json({ error: "server_error" })
  }
})

/**
 * GET /waitlist/verify?token=<hex>
 *
 * Double-opt-in step 2a: return a confirmation page that asks the user to
 * click a button.  This handler performs NO state changes so that automated
 * email-scanner GETs cannot consume the one-time token on behalf of the user.
 *
 * The confirmation button POSTs the token to POST /waitlist/verify, which is
 * the only handler that redeems the token and writes to the database.
 */
router.get("/waitlist/verify", (req, res) => {
  const { token } = req.query

  const marketingBase =
    process.env.PUBLIC_MARKETING_URL ?? "https://plainpathapp.com"

  // Show the same neutral page for missing/invalid-looking tokens to avoid
  // leaking information about token existence before the POST is attempted.
  const safeToken =
    token && typeof token === "string" && /^[0-9a-f]{1,128}$/i.test(token)
      ? token
      : ""

  const apiBase =
    process.env.PUBLIC_API_BASE_URL ?? "https://plainpathapp.com/api"
  const postAction = `${apiBase}/waitlist/verify`

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirm your PlainPath waitlist spot</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #F8F7F4;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      text-align: center;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .logo-icon {
      width: 36px; height: 36px;
      background: #4F46E5;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .logo-name {
      font-weight: 700; font-size: 18px; color: #1a1a1a; letter-spacing: -0.3px;
    }
    h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px; }
    p { font-size: 15px; color: #555; margin: 0 0 28px; line-height: 1.6; }
    button {
      background: #4F46E5; color: #fff;
      font-size: 15px; font-weight: 600;
      border: none; border-radius: 8px;
      padding: 12px 32px;
      cursor: pointer;
      width: 100%;
    }
    button:hover { background: #4338CA; }
    .note { font-size: 12px; color: #bbb; margin-top: 20px; }
    a { color: #bbb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">📄</div>
      <span class="logo-name">PlainPath</span>
    </div>
    <h1>Confirm your spot</h1>
    <p>Click the button below to confirm your email address and reserve your spot on the PlainPath mobile waitlist.</p>
    <form method="POST" action="${postAction}">
      <input type="hidden" name="token" value="${safeToken}" />
      <button type="submit">Confirm my spot →</button>
    </form>
    <p class="note">
      Didn't request this? You can ignore it — your address won't be added unless you click above.<br />
      Questions? <a href="mailto:support@plainpathapp.com">support@plainpathapp.com</a>
    </p>
  </div>
</body>
</html>`)
})

/**
 * POST /waitlist/verify
 *
 * Double-opt-in step 2b: redeem the one-time token submitted from the
 * confirmation page.  This is the only handler that writes to the database,
 * ensuring that automated GET-based email scanners cannot complete enrollment
 * on behalf of the user.
 *
 * Redirects to the marketing site with a query parameter indicating success
 * or failure so the frontend can show a friendly message.
 */
router.post("/waitlist/verify", async (req, res) => {
  const token = req.body?.token

  const marketingBase =
    process.env.PUBLIC_MARKETING_URL ?? "https://plainpathapp.com"

  if (!token || typeof token !== "string") {
    return res.redirect(`${marketingBase}/?waitlist=invalid`)
  }

  try {
    const result = confirmVerification(token)

    if (!result) {
      // Token unknown or expired — identical redirect to avoid oracle.
      return res.redirect(`${marketingBase}/?waitlist=invalid`)
    }

    if (result.inserted) {
      void sendConfirmationEmail(result.email, result.platform)
      logger.info({ platform: result.platform }, "waitlist: email confirmed and enrolled")
    } else {
      logger.info({ platform: result.platform }, "waitlist: re-verify of existing member")
    }

    return res.redirect(`${marketingBase}/?waitlist=confirmed`)
  } catch (err) {
    logger.error({ err }, "waitlist: verify failed")
    return res.redirect(`${marketingBase}/?waitlist=invalid`)
  }
})

router.get("/waitlist/count", (_req, res) => {
  try {
    const count = getWaitlistCount()
    return res.json({ count })
  } catch (err) {
    logger.error({ err }, "waitlist: count failed")
    return res.status(500).json({ error: "server_error" })
  }
})

export default router
