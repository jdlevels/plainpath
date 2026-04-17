import { useState } from "react";
import { useUser } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Users, Plus, Mail, Copy, Trash2, LogOut, Settings,
  BarChart2, Crown, Check, AlertCircle, Loader2, UserPlus, Link2
} from "lucide-react";
import {
  fetchMyTeam, createTeam, inviteMember, removeMember,
  revokeInvite, leaveTeam, fetchTeamAnalytics, updateTeamName,
  type TeamData,
} from "@/lib/teamApi";
import { useToast } from "@/hooks/use-toast";

type Tab = "members" | "analytics" | "settings";

export default function TeamDashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("members");
  const [inviteEmail, setInviteEmail] = useState("");
  const [teamNameInput, setTeamNameInput] = useState("");
  const [createName, setCreateName] = useState("");
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<TeamData>({
    queryKey: ["my-team"],
    queryFn: fetchMyTeam,
    enabled: isSignedIn === true,
    retry: false,
  });

  const analyticsQuery = useQuery({
    queryKey: ["team-analytics", data?.team?.id],
    queryFn: () => fetchTeamAnalytics(data!.team!.id),
    enabled: !!data?.team?.id && tab === "analytics",
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () => createTeam(createName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-team"] });
      toast({ title: "Team created!", description: "You're now the team admin." });
    },
    onError: (e: any) => toast({ title: "Failed to create team", description: e.message, variant: "destructive" }),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => inviteMember(data!.team!.id, email),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["my-team"] });
      setInviteEmail("");
      copyToClipboard(result.inviteUrl);
      toast({ title: "Invite created", description: "Link copied to clipboard — share it with your teammate." });
    },
    onError: (e: any) => {
      const msg = e.code === "already_member" ? "That person is already on your team." : e.message;
      toast({ title: "Could not invite", description: msg, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(data!.team!.id, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-team"] });
      toast({ title: "Member removed" });
    },
    onError: (e: any) => toast({ title: "Could not remove member", description: e.message, variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(data!.team!.id, inviteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-team"] });
      toast({ title: "Invite revoked" });
    },
    onError: (e: any) => toast({ title: "Could not revoke invite", description: e.message, variant: "destructive" }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveTeam(data!.team!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-team"] });
      toast({ title: "You have left the team" });
    },
    onError: (e: any) => {
      const msg = e.code === "last_admin" ? "Transfer admin rights to another member before leaving." : e.message;
      toast({ title: "Could not leave team", description: msg, variant: "destructive" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: () => updateTeamName(data!.team!.id, teamNameInput.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-team"] });
      toast({ title: "Team name updated" });
    },
    onError: (e: any) => toast({ title: "Could not update name", description: e.message, variant: "destructive" }),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function copyInviteUrl(inviteId: string, email: string) {
    inviteMutation.mutate(email);
    setCopiedInvite(inviteId);
    setTimeout(() => setCopiedInvite(null), 2000);
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Sign in to access your team</h2>
        <button
          onClick={() => setLocation("/sign-in")}
          className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
        >
          Sign in
        </button>
      </div>
    );
  }

  const isErr403 = (error as any)?.status === 403;
  if (error && isErr403) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Crown className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-semibold mb-2">Pro plan required</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Upgrade to Pro to create a shared workspace, invite teammates, and track usage together.
        </p>
        <button
          onClick={() => setLocation("/#pricing")}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
        >
          View plans
        </button>
      </div>
    );
  }

  // No team yet — show create form
  if (!data?.team) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Create your team workspace</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Invite teammates, share analyses, and track usage together.
            </p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-medium mb-2">Team name</label>
            <input
              type="text"
              placeholder="e.g. Acme Legal Team"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4"
              maxLength={60}
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={!createName.trim() || createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create team
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const { team, members, pendingInvites } = data;
  const isAdmin = team.myRole === "admin";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Crown className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => { if (confirm("Leave this team?")) leaveMutation.mutate(); }}
              disabled={leaveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Leave team
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/60 mb-6">
          {(["members", "analytics", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "members" && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{t}</span>}
              {t === "analytics" && <span className="flex items-center gap-1.5"><BarChart2 className="h-3.5 w-3.5" />{t}</span>}
              {t === "settings" && <span className="flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />{t}</span>}
            </button>
          ))}
        </div>

        {/* Members Tab */}
        {tab === "members" && (
          <div className="space-y-6">
            {/* Invite form (admin only) */}
            {isAdmin && (
              <div className="bg-card border border-border/60 rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" /> Invite a teammate
                </h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && inviteEmail && inviteMutation.mutate(inviteEmail)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={() => inviteMutation.mutate(inviteEmail)}
                    disabled={!inviteEmail.trim() || inviteMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Generate link
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  An invite link will be generated and copied to your clipboard. Links expire in 7 days.
                </p>
              </div>
            )}

            {/* Members list */}
            <div className="bg-card border border-border/60 rounded-2xl divide-y divide-border/40">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                      {(m.displayName ?? m.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.displayName ?? m.email}</p>
                      {m.displayName && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.role === "admin"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {m.role}
                    </span>
                    {isAdmin && m.role !== "admin" && (
                      <button
                        onClick={() => { if (confirm(`Remove ${m.displayName ?? m.email}?`)) removeMutation.mutate(m.id); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pending invites */}
            {isAdmin && pendingInvites.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Pending invites</h3>
                <div className="bg-card border border-border/60 rounded-2xl divide-y divide-border/40">
                  {pendingInvites.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{inv.invitedEmail}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            inviteMutation.mutate(inv.invitedEmail);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Resend invite link"
                        >
                          {copiedInvite === inv.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => revokeMutation.mutate(inv.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Revoke invite"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {analyticsQuery.isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {analyticsQuery.data && (
              <>
                {/* Totals */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Analyses this month", value: analyticsQuery.data.totals.analysesThisMonth },
                    { label: "Trust checks this month", value: analyticsQuery.data.totals.trustChecksThisMonth },
                    { label: "Analyses all time", value: analyticsQuery.data.totals.analysesAllTime },
                    { label: "Trust checks all time", value: analyticsQuery.data.totals.trustChecksAllTime },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border/60 rounded-2xl p-4">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Per-member stats */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">This month by member</h3>
                  <div className="bg-card border border-border/60 rounded-2xl divide-y divide-border/40">
                    {analyticsQuery.data.memberStats.map((ms) => {
                      const member = members.find((m) => m.userId === ms.userId);
                      return (
                        <div key={ms.userId} className="flex items-center justify-between px-5 py-3.5 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                              {(member?.displayName ?? ms.email)[0].toUpperCase()}
                            </div>
                            <p className="text-sm truncate">{member?.displayName ?? ms.email}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                            <span title="Analyses">{ms.analysesThisMonth} analyses</span>
                            <span title="Trust checks">{ms.trustChecksThisMonth} trust checks</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="space-y-6">
            {isAdmin && (
              <div className="bg-card border border-border/60 rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-4">Team name</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={team.name}
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    maxLength={60}
                  />
                  <button
                    onClick={() => renameMutation.mutate()}
                    disabled={!teamNameInput.trim() || renameMutation.isPending}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    {renameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-card border border-border/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-1">Team ID</h3>
              <p className="text-xs text-muted-foreground mb-3">Share this with your teammates if they need to reference the team.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-secondary px-3 py-2 rounded-lg font-mono truncate">{team.id}</code>
                <button
                  onClick={() => { copyToClipboard(team.id); toast({ title: "Copied" }); }}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="bg-card border border-destructive/30 rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-1 text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Danger zone
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Leaving as the last admin will be blocked. Transfer admin rights first.
                </p>
                <button
                  onClick={() => { if (confirm("Leave this team? You cannot undo this.")) leaveMutation.mutate(); }}
                  disabled={leaveMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/5 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" /> Leave team
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
