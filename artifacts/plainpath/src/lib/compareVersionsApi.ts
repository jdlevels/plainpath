// ─── Compare Versions API Client ───────────────────────────────────────────────

import type {
  CVSessionListItem,
  CVSessionDetail,
  CVManagerNotes,
  CVDiffResult,
} from "./compareVersionsTypes";

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

  async listSessions(
    token: string | null,
    opts?: { archived?: boolean },
  ): Promise<CVSessionListItem[]> {
    const params = opts?.archived != null ? `?archived=${opts.archived}` : "";
    const res = await fetch(`/api/compare-versions/sessions${params}`, {
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

  async getOriginalPdf(id: string, token: string | null): Promise<ArrayBuffer> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/original`, {
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err: any = new Error(body?.message || body?.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.arrayBuffer();
  },

  async getRevisedPdf(id: string, token: string | null): Promise<ArrayBuffer> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/revised`, {
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err: any = new Error(body?.message || body?.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.arrayBuffer();
  },

  async updateNotes(
    id: string,
    managerNotes: CVManagerNotes,
    token: string | null,
  ): Promise<{ id: string; managerNotes: CVManagerNotes; updatedAt: string }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/notes`, {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ managerNotes }),
    });
    return handleResponse(res);
  },

  async rescanSession(id: string, token: string | null): Promise<{ id: string; status: string }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/scan`, {
      method: "POST",
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },

  async patchReview(
    id: string,
    diffResult: CVDiffResult,
    token: string | null,
  ): Promise<{ id: string; updatedAt: string }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/review`, {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ diffResult }),
    });
    return handleResponse(res);
  },

  async enrichSession(
    id: string,
    forceAll: boolean,
    token: string | null,
  ): Promise<{ id: string; aiStatus: string }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/enrich`, {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ forceAll }),
    });
    return handleResponse(res);
  },

  // ── Slice 6: Session management ─────────────────────────────────────────────

  async renameSession(
    id: string,
    title: string,
    token: string | null,
  ): Promise<{ id: string; title: string; updatedAt: string }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/rename`, {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },

  async archiveSession(
    id: string,
    archived: boolean,
    token: string | null,
  ): Promise<{ id: string; archivedAt: string | null; updatedAt: string }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/archive`, {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    return handleResponse(res);
  },

  async deleteSession(id: string, token: string | null): Promise<{ id: string; deleted: boolean }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },

  // ── Slice 6: Handoff to PDF Editor ──────────────────────────────────────────

  async createHandoff(
    id: string,
    diffIds: string[] | undefined,
    token: string | null,
  ): Promise<{ handoffId: string; pdfEditorSessionId: string; highlightCount: number }> {
    const res = await fetch(`/api/compare-versions/sessions/${id}/handoff`, {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(diffIds ? { diffIds, mode: "selected" } : { mode: "all" }),
    });
    return handleResponse(res);
  },

  // ── Slice 6: Audit report export ────────────────────────────────────────────

  exportReportUrl(id: string): string {
    return `/api/compare-versions/sessions/${id}/export`;
  },
};
