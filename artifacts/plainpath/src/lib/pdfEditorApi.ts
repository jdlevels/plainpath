// ─── PDF Editor API Client ─────────────────────────────────────────────────────

import type { EditOp, SessionMeta, SessionDetail } from "./pdfEditorTypes"

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err: any = new Error(body?.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json() as Promise<T>
}

export const pdfEditorApi = {
  // Create session — uploads raw PDF bytes as multipart form
  async createSession(
    file: File,
    fileName: string,
    token: string | null,
  ): Promise<{ id: string; fileName: string; fileSizeBytes: number; createdAt: string }> {
    const form = new FormData()
    form.append("file", file, file.name)
    form.append("fileName", fileName)
    const res = await fetch("/api/pdf-editor/sessions", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    })
    return handleResponse(res)
  },

  // List user sessions (minimal)
  async listSessions(token: string | null): Promise<SessionMeta[]> {
    const res = await fetch("/api/pdf-editor/sessions", {
      headers: authHeaders(token),
    })
    return handleResponse(res)
  },

  // Get session metadata + ops (no pdf bytes)
  async getSession(id: string, token: string | null): Promise<SessionDetail> {
    const res = await fetch(`/api/pdf-editor/sessions/${id}`, {
      headers: authHeaders(token),
    })
    return handleResponse(res)
  },

  // Get raw PDF bytes as ArrayBuffer
  async getPdf(id: string, token: string | null): Promise<ArrayBuffer> {
    const res = await fetch(`/api/pdf-editor/sessions/${id}/pdf`, {
      headers: authHeaders(token),
    })
    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}`)
      err.status = res.status
      throw err
    }
    return res.arrayBuffer()
  },

  // Save ops (replaces entire array)
  async saveOps(
    id: string,
    ops: EditOp[],
    token: string | null,
  ): Promise<{ updatedAt: string }> {
    const res = await fetch(`/api/pdf-editor/sessions/${id}/ops`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ ops }),
    })
    return handleResponse(res)
  },

  // Set page count once (idempotent — server only updates when null)
  async setPageCount(
    id: string,
    pageCount: number,
    token: string | null,
  ): Promise<void> {
    await fetch(`/api/pdf-editor/sessions/${id}/page-count`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ pageCount }),
    })
    // fire-and-forget; errors here are non-critical
  },
}
