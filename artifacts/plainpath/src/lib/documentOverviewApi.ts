// ─── Document Overview Hub — API Client ───────────────────────────────────────

import { getApiBaseUrl } from "@/lib/api"
import type { DocumentOverviewSession } from "@/lib/documentOverviewTypes"

const BASE = () => `${getApiBaseUrl()}/api/document-overview`

export const documentOverviewApi = {
  async createSession(
    file: File,
    getToken: () => Promise<string | null>,
  ): Promise<DocumentOverviewSession> {
    const token = await getToken()
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`${BASE()}/sessions`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message ?? `Upload failed (${res.status})`)
    }
    return res.json()
  },

  async getSession(
    id: string,
    getToken: () => Promise<string | null>,
  ): Promise<DocumentOverviewSession> {
    const token = await getToken()
    const res = await fetch(`${BASE()}/sessions/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message ?? `Session not found (${res.status})`)
    }
    return res.json()
  },

  async listSessions(
    getToken: () => Promise<string | null>,
  ): Promise<DocumentOverviewSession[]> {
    const token = await getToken()
    const res = await fetch(`${BASE()}/sessions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return []
    return res.json()
  },
}
