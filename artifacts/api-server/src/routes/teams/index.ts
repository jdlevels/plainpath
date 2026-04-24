import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { pool } from "@workspace/db";
import { getSubscriberByEmail } from "../../lib/billingDb";
import crypto from "crypto";
import { Resend } from "resend";

const MAX_TEAM_SEATS = 3;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function sendInviteEmail(opts: {
  toEmail: string;
  inviteUrl: string;
  teamName: string;
  ownerEmail: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[teams] RESEND_API_KEY not set — skipping invite email");
    return;
  }
  try {
    await resend.emails.send({
      from: "PlainPath <no-reply@plainpathapp.com>",
      to: opts.toEmail,
      subject: `You've been invited to join ${opts.teamName} on PlainPath`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;">
          <h2 style="color:#1a1a1a;margin:0 0 12px">You're invited to PlainPath</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 20px">
            <strong>${opts.ownerEmail}</strong> has invited you to join their team
            <strong>${opts.teamName}</strong> on PlainPath — giving you full Pro access
            to all document analysis tools.
          </p>
          <a href="${opts.inviteUrl}"
             style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;">
            Accept invitation
          </a>
          <p style="color:#999;font-size:12px;margin:24px 0 0">
            This link expires in 7 days. If you didn't expect this invitation, you can safely ignore it.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[teams] Failed to send invite email:", err);
  }
}

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    return user.emailAddresses?.[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}

async function getUserDisplayName(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const first = user.firstName ?? "";
    const last = user.lastName ?? "";
    const full = `${first} ${last}`.trim();
    return full || (user.emailAddresses?.[0]?.emailAddress ?? null);
  } catch {
    return null;
  }
}

async function requireTeamPlan(req: any, res: any, next: any) {
  const email = await getUserEmail(req.userId);
  if (!email) return res.status(401).json({ error: "could_not_resolve_email" });
  req.userEmail = email;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
  if (adminEmails.includes(email)) return next();

  const sub = getSubscriberByEmail(email);
  if (!sub || sub.plan !== "team" || sub.status !== "active") {
    return res.status(403).json({ error: "team_plan_required", message: "This feature requires a Team plan." });
  }
  next();
}

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function generateInviteToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// ─── GET /api/teams/invite/:token  (public — no auth needed) ─────────────────
router.get("/invite/:token", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ti.id, ti.invited_email, ti.status, ti.expires_at, t.name as team_name, t.id as team_id
       FROM team_invites ti
       JOIN teams t ON t.id = ti.team_id
       WHERE ti.token = $1`,
      [req.params.token]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "invite_not_found" });
    const invite = result.rows[0];
    if (invite.status !== "pending") return res.status(410).json({ error: "invite_used", status: invite.status });
    if (new Date(invite.expires_at) < new Date()) {
      await pool.query(`UPDATE team_invites SET status = 'expired' WHERE token = $1`, [req.params.token]);
      return res.status(410).json({ error: "invite_expired" });
    }
    res.json({
      teamId: invite.team_id,
      teamName: invite.team_name,
      invitedEmail: invite.invited_email,
      status: invite.status,
    });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/teams/invite/:token/accept ─────────────────────────────────────
router.post("/invite/:token/accept", requireAuth, async (req: any, res) => {
  try {
    const email = req.userEmail ?? (await getUserEmail(req.userId));
    if (!email) return res.status(401).json({ error: "could_not_resolve_email" });

    const inviteResult = await pool.query(
      `SELECT ti.*, t.name as team_name FROM team_invites ti
       JOIN teams t ON t.id = ti.team_id
       WHERE ti.token = $1`,
      [req.params.token]
    );
    if (inviteResult.rowCount === 0) return res.status(404).json({ error: "invite_not_found" });
    const invite = inviteResult.rows[0];

    if (invite.status !== "pending") return res.status(410).json({ error: "invite_used" });
    if (new Date(invite.expires_at) < new Date()) {
      await pool.query(`UPDATE team_invites SET status = 'expired' WHERE token = $1`, [req.params.token]);
      return res.status(410).json({ error: "invite_expired" });
    }

    if (email.toLowerCase() !== invite.invited_email.toLowerCase()) {
      return res.status(403).json({ error: "invite_email_mismatch" });
    }

    const displayName = await getUserDisplayName(req.userId);

    const existing = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [invite.team_id, req.userId]
    );
    if (existing.rowCount === 0) {
      await pool.query(
        `INSERT INTO team_members (team_id, user_id, email, display_name, role) VALUES ($1, $2, $3, $4, 'member')`,
        [invite.team_id, req.userId, email, displayName]
      );
    }

    await pool.query(`UPDATE team_invites SET status = 'accepted' WHERE token = $1`, [req.params.token]);
    res.json({ ok: true, teamId: invite.team_id, teamName: invite.team_name });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// All routes below require auth
router.use(requireAuth);

// ─── GET /api/teams/mine ───────────────────────────────────────────────────────
router.get("/mine", async (req: any, res) => {
  try {
    const email = await getUserEmail(req.userId);
    if (!email) return res.status(401).json({ error: "could_not_resolve_email" });
    req.userEmail = email;

    const memberResult = await pool.query(
      `SELECT tm.role, tm.team_id, t.name, t.owner_id, t.invite_code
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE tm.user_id = $1`,
      [req.userId]
    );

    if (memberResult.rowCount === 0) return res.json({ team: null });

    const row = memberResult.rows[0];
    const membersResult = await pool.query(
      `SELECT id, user_id, email, display_name, role, joined_at FROM team_members WHERE team_id = $1 ORDER BY joined_at ASC`,
      [row.team_id]
    );

    const pendingResult = await pool.query(
      `SELECT id, invited_email, status, created_at, expires_at FROM team_invites
       WHERE team_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
      [row.team_id]
    );

    res.json({
      team: {
        id: row.team_id,
        name: row.name,
        ownerId: row.owner_id,
        inviteCode: row.invite_code,
        myRole: row.role,
      },
      members: membersResult.rows.map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        email: m.email,
        displayName: m.display_name,
        role: m.role,
        joinedAt: m.joined_at,
      })),
      pendingInvites: pendingResult.rows.map((i: any) => ({
        id: i.id,
        invitedEmail: i.invited_email,
        status: i.status,
        createdAt: i.created_at,
        expiresAt: i.expires_at,
      })),
    });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/teams ──────────────────────────────────────────────────────────
router.post("/", requireTeamPlan, async (req: any, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name_required" });

  try {
    const existing = await pool.query(
      `SELECT tm.team_id FROM team_members tm WHERE tm.user_id = $1`,
      [req.userId]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ error: "already_in_team", message: "You are already a member of a team." });
    }

    const inviteCode = generateInviteCode();
    const displayName = await getUserDisplayName(req.userId);

    const teamResult = await pool.query(
      `INSERT INTO teams (name, owner_id, invite_code) VALUES ($1, $2, $3) RETURNING id, name, invite_code`,
      [name.trim(), req.userId, inviteCode]
    );
    const team = teamResult.rows[0];

    await pool.query(
      `INSERT INTO team_members (team_id, user_id, email, display_name, role) VALUES ($1, $2, $3, $4, 'admin')`,
      [team.id, req.userId, req.userEmail, displayName]
    );

    res.status(201).json({ id: team.id, name: team.name, inviteCode: team.invite_code });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── PATCH /api/teams/:teamId ─────────────────────────────────────────────────
router.patch("/:teamId", requireTeamPlan, async (req: any, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name_required" });

  try {
    const adminCheck = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'admin'`,
      [req.params.teamId, req.userId]
    );
    if (adminCheck.rowCount === 0) return res.status(403).json({ error: "admin_required" });

    await pool.query(
      `UPDATE teams SET name = $1, updated_at = NOW() WHERE id = $2`,
      [name.trim(), req.params.teamId]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/teams/:teamId/invite ───────────────────────────────────────────
router.post("/:teamId/invite", requireTeamPlan, async (req: any, res) => {
  const { email } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: "email_required" });

  try {
    const adminCheck = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'admin'`,
      [req.params.teamId, req.userId]
    );
    if (adminCheck.rowCount === 0) return res.status(403).json({ error: "admin_required" });

    const alreadyMember = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND email = $2`,
      [req.params.teamId, email.trim().toLowerCase()]
    );
    if (alreadyMember.rowCount && alreadyMember.rowCount > 0) {
      return res.status(409).json({ error: "already_member", message: "This person is already on the team." });
    }

    // Enforce seat limit
    const seatCount = await pool.query(
      `SELECT COUNT(*) FROM team_members WHERE team_id = $1`,
      [req.params.teamId]
    );
    if (parseInt(seatCount.rows[0].count) >= MAX_TEAM_SEATS) {
      return res.status(400).json({
        error: "seat_limit_reached",
        message: `Your team plan supports up to ${MAX_TEAM_SEATS} members. Remove a member before adding a new one.`,
      });
    }

    await pool.query(
      `UPDATE team_invites SET status = 'superseded' WHERE team_id = $1 AND invited_email = $2 AND status = 'pending'`,
      [req.params.teamId, email.trim().toLowerCase()]
    );

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO team_invites (team_id, invited_email, token, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, token`,
      [req.params.teamId, email.trim().toLowerCase(), token, expiresAt]
    );

    const teamResult = await pool.query(`SELECT name FROM teams WHERE id = $1`, [req.params.teamId]);
    const teamName = teamResult.rows[0]?.name ?? "your team";

    const appBase = process.env.APP_URL ?? "https://plainpathapp.com/app";
    const inviteUrl = `${appBase}/join/${token}`;

    // Send invitation email (non-blocking — failure doesn't affect response)
    void sendInviteEmail({
      toEmail: email.trim().toLowerCase(),
      inviteUrl,
      teamName,
      ownerEmail: req.userEmail,
    });

    res.json({
      ok: true,
      inviteId: result.rows[0].id,
      token,
      inviteUrl,
      teamName,
      expiresAt,
    });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /api/teams/:teamId/invites/:inviteId ──────────────────────────────
router.delete("/:teamId/invites/:inviteId", requireTeamPlan, async (req: any, res) => {
  try {
    const adminCheck = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'admin'`,
      [req.params.teamId, req.userId]
    );
    if (adminCheck.rowCount === 0) return res.status(403).json({ error: "admin_required" });

    await pool.query(`DELETE FROM team_invites WHERE id = $1 AND team_id = $2`, [req.params.inviteId, req.params.teamId]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /api/teams/:teamId/members/:memberId ──────────────────────────────
router.delete("/:teamId/members/:memberId", requireTeamPlan, async (req: any, res) => {
  try {
    const adminCheck = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'admin'`,
      [req.params.teamId, req.userId]
    );
    if (adminCheck.rowCount === 0) return res.status(403).json({ error: "admin_required" });

    const memberToRemove = await pool.query(
      `SELECT user_id FROM team_members WHERE id = $1 AND team_id = $2`,
      [req.params.memberId, req.params.teamId]
    );
    if (memberToRemove.rowCount === 0) return res.status(404).json({ error: "not_found" });
    if (memberToRemove.rows[0].user_id === req.userId) {
      return res.status(400).json({ error: "cannot_remove_self" });
    }

    await pool.query(`DELETE FROM team_members WHERE id = $1 AND team_id = $2`, [req.params.memberId, req.params.teamId]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/teams/:teamId/leave ────────────────────────────────────────────
router.post("/:teamId/leave", async (req: any, res) => {
  try {
    const memberCheck = await pool.query(
      `SELECT id, role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.userId]
    );
    if (memberCheck.rowCount === 0) return res.status(404).json({ error: "not_member" });
    if (memberCheck.rows[0].role === "admin") {
      const otherAdmins = await pool.query(
        `SELECT id FROM team_members WHERE team_id = $1 AND role = 'admin' AND user_id != $2`,
        [req.params.teamId, req.userId]
      );
      if (otherAdmins.rowCount === 0) {
        return res.status(400).json({ error: "last_admin", message: "Transfer admin rights before leaving." });
      }
    }
    await pool.query(`DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`, [req.params.teamId, req.userId]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /api/teams/:teamId/analytics ────────────────────────────────────────
router.get("/:teamId/analytics", requireTeamPlan, async (req: any, res) => {
  try {
    const adminCheck = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [req.params.teamId, req.userId]
    );
    if (adminCheck.rowCount === 0) return res.status(403).json({ error: "not_member" });

    const membersResult = await pool.query(
      `SELECT user_id, email FROM team_members WHERE team_id = $1`,
      [req.params.teamId]
    );
    const userIds = membersResult.rows.map((m: any) => m.user_id);

    const monthKey = new Date().toISOString().slice(0, 7);

    const analysesResult = await pool.query(
      `SELECT user_id, COUNT(*) as count FROM user_analyses
       WHERE user_id = ANY($1) AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
       GROUP BY user_id`,
      [userIds]
    );

    const trustResult = await pool.query(
      `SELECT user_id, COUNT(*) as count FROM user_trust_checks
       WHERE user_id = ANY($1) AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
       GROUP BY user_id`,
      [userIds]
    );

    const totalAnalyses = await pool.query(
      `SELECT COUNT(*) as count FROM user_analyses WHERE user_id = ANY($1)`,
      [userIds]
    );

    const totalTrust = await pool.query(
      `SELECT COUNT(*) as count FROM user_trust_checks WHERE user_id = ANY($1)`,
      [userIds]
    );

    const analysesMap: Record<string, number> = {};
    for (const row of analysesResult.rows) {
      analysesMap[row.user_id] = parseInt(row.count);
    }
    const trustMap: Record<string, number> = {};
    for (const row of trustResult.rows) {
      trustMap[row.user_id] = parseInt(row.count);
    }

    res.json({
      monthKey,
      memberStats: membersResult.rows.map((m: any) => ({
        userId: m.user_id,
        email: m.email,
        analysesThisMonth: analysesMap[m.user_id] ?? 0,
        trustChecksThisMonth: trustMap[m.user_id] ?? 0,
      })),
      totals: {
        analysesAllTime: parseInt(totalAnalyses.rows[0]?.count ?? "0"),
        trustChecksAllTime: parseInt(totalTrust.rows[0]?.count ?? "0"),
        analysesThisMonth: analysesResult.rows.reduce((s: number, r: any) => s + parseInt(r.count), 0),
        trustChecksThisMonth: trustResult.rows.reduce((s: number, r: any) => s + parseInt(r.count), 0),
      },
    });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
