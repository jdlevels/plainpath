import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { pool } from "@workspace/db";
import { getSubscriberByEmail, getSubscriberByClerkUserId, getTeamFromBilling } from "../../lib/billingDb";
import crypto from "crypto";

const router = Router();

const TEAM_SEAT_LIMIT = 3;

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

async function getVerifiedUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    );
    if (!primary?.emailAddress) return null;
    if (primary.verification?.status !== "verified") return null;
    return primary.emailAddress;
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
  const email = await getVerifiedUserEmail(req.userId);
  if (!email) return res.status(401).json({ error: "could_not_resolve_email" });
  req.userEmail = email;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
  if (adminEmails.includes(email)) return next();

  // Prefer lookup by clerkUserId (immutable identity); fall back to email only
  // when the email-matched row is unbound or already bound to this same user.
  // This mirrors the ownership check in resolvePlan.ts and prevents a user
  // from claiming a Team subscription that belongs to a different Clerk account.
  const byClerkId = getSubscriberByClerkUserId(req.userId);
  const byEmail = !byClerkId ? getSubscriberByEmail(email) : null;
  const sub =
    byClerkId ??
    (byEmail && (!byEmail.clerkUserId || byEmail.clerkUserId === req.userId)
      ? byEmail
      : null);

  if (!sub || sub.plan !== "team" || sub.status !== "active") {
    return res.status(403).json({ error: "team_plan_required", message: "This feature requires a Team plan." });
  }
  next();
}

async function requireTargetTeamPlan(req: any, res: any, next: any) {
  const email = await getVerifiedUserEmail(req.userId);
  if (!email) return res.status(401).json({ error: "could_not_resolve_email" });
  req.userEmail = email;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
  if (adminEmails.includes(email)) return next();

  const teamId = req.params.teamId;
  if (!teamId) return res.status(400).json({ error: "missing_team_id" });

  const billingTeam = getTeamFromBilling(teamId);
  if (!billingTeam || billingTeam.plan !== "team" || billingTeam.status !== "active") {
    return res.status(403).json({ error: "team_plan_required", message: "This feature requires an active Team plan for this team." });
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
    const email = req.userEmail ?? (await getVerifiedUserEmail(req.userId));
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

    // Re-validate that the team still holds an active Team plan at the moment
    // of acceptance. Invites are issued while the plan is active, but the
    // subscription may have lapsed before the invitee redeems the link.
    // We check the team owner's subscriber record (same source requireTeamPlan uses)
    // rather than the billing-DB teams table, which has no application write path.
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
    if (!adminEmails.includes(email)) {
      const teamRow = await pool.query(`SELECT owner_id FROM teams WHERE id = $1`, [invite.team_id]);
      const ownerId: string | null = teamRow.rows[0]?.owner_id ?? null;
      let ownerHasTeamPlan = false;
      if (ownerId) {
        try {
          const ownerUser = await clerkClient.users.getUser(ownerId);
          const ownerPrimary = ownerUser.emailAddresses.find(
            (e) => e.id === ownerUser.primaryEmailAddressId
          );
          const ownerEmail = ownerPrimary?.emailAddress?.toLowerCase().trim() ?? null;
          if (ownerEmail) {
            const ownerSub = getSubscriberByEmail(ownerEmail);
            ownerHasTeamPlan = ownerSub?.plan === "team" && ownerSub?.status === "active";
          }
        } catch {
          // Could not resolve owner — fail closed
          ownerHasTeamPlan = false;
        }
      }
      if (!ownerHasTeamPlan) {
        return res.status(403).json({
          error: "team_plan_required",
          message: "This team no longer has an active Team plan. The invite cannot be accepted.",
        });
      }
    }

    if (email.toLowerCase() !== invite.invited_email.toLowerCase()) {
      return res.status(403).json({ error: "invite_email_mismatch" });
    }

    const displayName = await getUserDisplayName(req.userId);

    // Use a transaction with FOR UPDATE on the team row to serialize concurrent
    // accept requests and prevent TOCTOU races that could exceed the seat limit.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lock the team row to serialize concurrent accept calls for the same team.
      await client.query(`SELECT id FROM teams WHERE id = $1 FOR UPDATE`, [invite.team_id]);

      // Check if the user is already a member of any team (one-team-per-user policy).
      const anyTeamMembership = await client.query(
        `SELECT id, team_id FROM team_members WHERE user_id = $1 LIMIT 1`,
        [req.userId]
      );
      if ((anyTeamMembership.rowCount ?? 0) > 0) {
        const existingTeamId = anyTeamMembership.rows[0].team_id;
        if (existingTeamId === invite.team_id) {
          // Already in this team — idempotent: just mark the invite accepted and return.
          await client.query(`UPDATE team_invites SET status = 'accepted' WHERE token = $1`, [req.params.token]);
          await client.query("COMMIT");
          return res.json({ ok: true, teamId: invite.team_id, teamName: invite.team_name });
        }
        // Already in a different team — reject to enforce the one-team-per-user boundary.
        await client.query("ROLLBACK");
        return res.status(403).json({
          error: "already_in_team",
          message: "You are already a member of a team. Leave your current team before joining another.",
        });
      }

      const memberCount = await client.query(
        `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1`,
        [invite.team_id]
      );
      if (parseInt(memberCount.rows[0].count, 10) >= TEAM_SEAT_LIMIT) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          error: "seat_limit_reached",
          message: `This team has reached its maximum of ${TEAM_SEAT_LIMIT} members and cannot accept new members.`,
        });
      }
      await client.query(
        `INSERT INTO team_members (team_id, user_id, email, display_name, role) VALUES ($1, $2, $3, $4, 'member')`,
        [invite.team_id, req.userId, email, displayName]
      );

      await client.query(`UPDATE team_invites SET status = 'accepted' WHERE token = $1`, [req.params.token]);
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

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
    const email = await getVerifiedUserEmail(req.userId);
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
      return res.status(409).json({ error: "already_member" });
    }

    const memberCount = await pool.query(
      `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1`,
      [req.params.teamId]
    );
    if (parseInt(memberCount.rows[0].count, 10) >= TEAM_SEAT_LIMIT) {
      return res.status(403).json({
        error: "seat_limit_reached",
        message: `This team has reached its maximum of ${TEAM_SEAT_LIMIT} members.`,
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

    const inviteUrl = `${process.env.APP_URL ?? "https://plainpathapp.com/app"}/join?token=${token}`;

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
router.get("/:teamId/analytics", requireTargetTeamPlan, async (req: any, res) => {
  try {
    const adminCheck = await pool.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'admin'`,
      [req.params.teamId, req.userId]
    );
    if (adminCheck.rowCount === 0) return res.status(403).json({ error: "not_admin" });

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
