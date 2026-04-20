// ─── Compare Versions API Client ───────────────────────────────────────────────

import type { CVSessionListItem, CVSessionDetail, CVManagerNotes } from "./compareVersionsTypes";

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body?.message || body?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export const compareVersionsApi = {
  async createSession(
    originalFile: File,
    revisedFile: File,
    title: string,
    managerNotes: CVManagerNotes | undefined,
    token: string | null,
  ): Promise<CVSessionListItem> {
    const form = new FormData();
    form.append("originalFile", originalFile, originalFile.name);
    form.append("revisedFile", revisedFile, revisedFile.name);
    form.append("title", title);
    if (managerNotes) {
      form.append("managerNotes", JSON.stringify(managerNotes));
    }
    const res = await fetch("/api/compare-versions/sessions", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    });
    return handleResponse<CVSessionListItem>(res);
  },

  async listSessions(token: string | null): Promise<CVSessionListItem[]> {
    const res = await fetch("/api/compare-versions/sessions", {
      headers: authHeaders(token),
    });
    return handleResponse<CVSessionListItem[]>(res);
  },

  async getSession(id: string, token: string | null): Promise<CVSessionDetail> {
    const res = await fetch(`/api/compare-versions/sessions/${id}`, {
      headers: authHeaders(token),
    });
    return handleResponse<CVSessionDetail>(res);
  },
};
