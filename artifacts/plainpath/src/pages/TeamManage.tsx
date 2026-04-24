import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Plus, Loader2, Mail, Trash2, Copy, Check, Crown } from "lucide-react"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { getApiBaseUrl } from "@/lib/api"
import { useUser } from "@clerk/react"
import { useEntitlements } from "@/hooks/useEntitlements"

type Team = { id: string; name: string; ownerId: string; inviteCode: string; myRole: string }
type Member = { id: string; userId: string; email: string; displayName: string | null; role: string; joinedAt: string }
type Invite = { id: string; invitedEmail: string; status: string; createdAt: string; expiresAt: string }

export default function TeamManage() {
  const { user } = useUser()
  const { entitlements } = useEntitlements()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string } | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [teamName, setTeamName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [copied, setCopied] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const apiBase = getApiBaseUrl()
  const isTeamPlan = entitlements?.plan === "team"

  useEffect(() => {
    document.title = "My Team — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  const fetchTeam = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/teams/mine`)
      const data = await res.json()
      if (data.team) {
        setTeam(data.team)
        setMembers(data.members ?? [])
        setInvites(data.pendingInvites ?? [])
      } else {
        setTeam(null)
      }
    } catch {
      setError("Failed to load team data. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchTeam() }, [])

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch(`${apiBase}/api/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed to create team")
      await fetchTeam()
      setTeamName("")
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create team")
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async () => {
    if (!team || !inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteResult(null)
    try {
      const res = await fetch(`${apiBase}/api/teams/${team.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed to send invite")
      setInviteResult(data)
      setInviteEmail("")
      await fetchTeam()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite member")
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return
    setRemovingId(memberId)
    try {
      await fetch(`${apiBase}/api/teams/${team.id}/members/${memberId}`, { method: "DELETE" })
      await fetchTeam()
    } finally {
      setRemovingId(null)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!team) return
    setCancelingId(inviteId)
    try {
      await fetch(`${apiBase}/api/teams/${team.id}/invites/${inviteId}`, { method: "DELETE" })
      await fetchTeam()
    } finally {
      setCancelingId(null)
    }
  }

  const copyLink = (url: string) => {
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </WorkspaceShell>
    )
  }

  return (
    <WorkspaceShell>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl font-display font-bold">My Team</h1>
          </div>
          <p className="text-sm text-muted-foreground">Share PlainPath Pro access with up to 3 people.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {!isTeamPlan && !team && (
          <div className="rounded-2xl border border-violet-200/50 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-950/20 p-6 text-center">
            <Users className="w-8 h-8 text-violet-500 mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-1.5">Team Plan required</h2>
            <p className="text-sm text-muted-foreground mb-4">Upgrade to the Team plan to share PlainPath Pro with up to 3 users.</p>
            <a
              href="subscribe"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              View Team Plan
            </a>
          </div>
        )}

        {isTeamPlan && !team && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/60 bg-card p-6 space-y-4"
          >
            <h2 className="font-bold">Create your team</h2>
            <p className="text-sm text-muted-foreground">Give your team a name (e.g. "Smith Family" or "Our Business").</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Team name"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") void handleCreateTeam() }}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              />
              <button
                onClick={() => void handleCreateTeam()}
                disabled={creating || !teamName.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </button>
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </motion.div>
        )}

        {team && (
          <>
            {/* Team members */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <h2 className="font-bold">{team.name}</h2>
                <span className="text-xs text-muted-foreground">{members.length}/3 seats used</span>
              </div>
              <div className="divide-y divide-border/30">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{(m.displayName ?? m.email)[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.displayName ?? m.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.role === "admin" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <Crown className="w-3 h-3" />Owner
                        </span>
                      )}
                      {m.role !== "admin" && team.myRole === "admin" && m.userId !== user?.id && (
                        <button
                          onClick={() => void handleRemoveMember(m.id)}
                          disabled={removingId === m.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Remove from team"
                        >
                          {removingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite new member */}
            {team.myRole === "admin" && members.length < 3 && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Invite a team member</h3>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="their@email.com"
                      value={inviteEmail}
                      onChange={e => { setInviteEmail(e.target.value); setInviteError(null) }}
                      onKeyDown={e => { if (e.key === "Enter") void handleInvite() }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                  </div>
                  <button
                    onClick={() => void handleInvite()}
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                  </button>
                </div>
                {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
                {inviteResult && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 space-y-2">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Invitation link created</p>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">Share this link with your invitee — they'll be able to join directly after signing in.</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={inviteResult.inviteUrl}
                        className="flex-1 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-background text-xs font-mono"
                      />
                      <button
                        onClick={() => copyLink(inviteResult.inviteUrl)}
                        className="px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-200 dark:hover:bg-emerald-950/60 transition-all"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pending invites */}
            {invites.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30">
                  <h3 className="font-semibold text-sm">Pending invitations</h3>
                </div>
                <div className="divide-y divide-border/30">
                  {invites.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                      <Mail className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.invitedEmail}</p>
                        <p className="text-xs text-muted-foreground">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                      </div>
                      {team.myRole === "admin" && (
                        <button
                          onClick={() => void handleCancelInvite(inv.id)}
                          disabled={cancelingId === inv.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Cancel invitation"
                        >
                          {cancelingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </WorkspaceShell>
  )
}
