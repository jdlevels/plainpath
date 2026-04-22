import type {
  ClauseExtractorSessionMeta,
  ClauseExtractorSessionDetail,
} from "./clauseExtractorTypes"

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

export const clauseExtractorApi = {
  async createSession(
    file: File,
    token: string | null,
  ): Promise<ClauseExtractorSessionDetail> {
    const form = new FormData()
    form.append("file", file, file.name)
    const res = await fetch("/api/clause-extractor/sessions", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    })
    return handleResponse<ClauseExtractorSessionDetail>(res)
  },

  async listSessions(
    token: string | null,
  ): Promise<ClauseExtractorSessionMeta[]> {
    const res = await fetch("/api/clause-extractor/sessions", {
      headers: authHeaders(token),
    })
    return handleResponse<ClauseExtractorSessionMeta[]>(res)
  },

  async getSession(
    id: string,
    token: string | null,
  ): Promise<ClauseExtractorSessionDetail> {
    const res = await fetch(`/api/clause-extractor/sessions/${id}`, {
      headers: authHeaders(token),
    })
    return handleResponse<ClauseExtractorSessionDetail>(res)
  },

  async deleteSession(
    id: string,
    token: string | null,
  ): Promise<void> {
    const res = await fetch(`/api/clause-extractor/sessions/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || `HTTP ${res.status}`)
    }
  },
}
