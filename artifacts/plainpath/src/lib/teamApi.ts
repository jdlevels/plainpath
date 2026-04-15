const base = () =>
  ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/+$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${base()}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message ?? `API ${res.status}`), { code: data.error, status: res.status });
  return data;
}

export type TeamMember = {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: "admin" | "member";
  joinedAt: string;
};

export type PendingInvite = {
  id: string;
  invitedEmail: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export type TeamData = {
  team: {
    id: string;
    name: string;
    ownerId: string;
    inviteCode: string;
    myRole: "admin" | "member";
  } | null;
  members: TeamMember[];
  pendingInvites: PendingInvite[];
};

export type TeamAnalytics = {
  monthKey: string;
  memberStats: { userId: string; email: string; analysesThisMonth: number; trustChecksThisMonth: number }[];
  totals: { analysesAllTime: number; trustChecksAllTime: number; analysesThisMonth: number; trustChecksThisMonth: number };
};

export type InviteDetails = {
  teamId: string;
  teamName: string;
  invitedEmail: string;
  status: string;
};

export async function fetchMyTeam(): Promise<TeamData> {
  return apiFetch("/api/teams/mine");
}

export async function createTeam(name: string): Promise<{ id: string; name: string; inviteCode: string }> {
  return apiFetch("/api/teams", { method: "POST", body: JSON.stringify({ name }) });
}

export async function updateTeamName(teamId: string, name: string): Promise<void> {
  await apiFetch(`/api/teams/${teamId}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

export async function inviteMember(teamId: string, email: string): Promise<{ inviteUrl: string; token: string; teamName: string; expiresAt: string }> {
  return apiFetch(`/api/teams/${teamId}/invite`, { method: "POST", body: JSON.stringify({ email }) });
}

export async function revokeInvite(teamId: string, inviteId: string): Promise<void> {
  await apiFetch(`/api/teams/${teamId}/invites/${inviteId}`, { method: "DELETE" });
}

export async function removeMember(teamId: string, memberId: string): Promise<void> {
  await apiFetch(`/api/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
}

export async function leaveTeam(teamId: string): Promise<void> {
  await apiFetch(`/api/teams/${teamId}/leave`, { method: "POST" });
}

export async function fetchTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
  return apiFetch(`/api/teams/${teamId}/analytics`);
}

export async function fetchInviteDetails(token: string): Promise<InviteDetails> {
  return apiFetch(`/api/teams/invite/${token}`);
}

export async function acceptInvite(token: string): Promise<{ teamId: string; teamName: string }> {
  return apiFetch(`/api/teams/invite/${token}/accept`, { method: "POST" });
}
