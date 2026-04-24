// ─── Ask This Document — API client ───────────────────────────────────────────

import { getApiBaseUrl } from "@/lib/api"
import type {
  AskDocumentSession,
  AskDocumentUploadResponse,
  AskDocumentAnswer,
} from "@/lib/askDocumentTypes"

const BASE = () => `${getApiBaseUrl()}/api/ask-document`

async function authHeaders(getToken: () => Promise<string | null>) {
  const token = await getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const askDocumentApi = {
  async uploadDocument(
    file: File,
    getToken: () => Promise<string | null>,
  ): Promise<AskDocumentUploadResponse> {
    const form = new FormData()
    form.append("file", file)
    const resp = await fetch(`${BASE()}/sessions`, {
      method: "POST",
      headers: await authHeaders(getToken),
      credentials: "include",
      body: form,
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.message ?? `Upload failed (${resp.status})`)
    }
    return resp.json()
  },

  async getSession(
    sessionId: string,
    getToken: () => Promise<string | null>,
  ): Promise<AskDocumentSession> {
    const resp = await fetch(`${BASE()}/sessions/${sessionId}`, {
      headers: await authHeaders(getToken),
      credentials: "include",
    })
    if (!resp.ok) throw new Error(`Session load failed (${resp.status})`)
    return resp.json()
  },

  async ask(
    sessionId: string,
    question: string,
    getToken: () => Promise<string | null>,
  ): Promise<{ exchangeId: string; answer: AskDocumentAnswer }> {
    const resp = await fetch(`${BASE()}/sessions/${sessionId}/ask`, {
      method: "POST",
      headers: {
        ...(await authHeaders(getToken)),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ question }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.message ?? `Ask failed (${resp.status})`)
    }
    return resp.json()
  },
}
