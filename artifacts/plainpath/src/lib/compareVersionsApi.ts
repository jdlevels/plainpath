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

  /** Persist severity overrides (and any diff_result mutations) without re-running the engine */
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
};
