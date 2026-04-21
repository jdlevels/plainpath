// ─── PDF Editor API Client ─────────────────────────────────────────────────────

import type { EditOp, OcrData, SessionMeta, SessionDetail } from "./pdfEditorTypes"

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
  ): Promise<{ id: string; fileName: string; fileSizeBytes: number; createdAt: string; pdfType?: string }> {
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

  // Export: apply ops server-side and return the modified PDF as a Blob
  async exportSession(id: string, token: string | null): Promise<Blob> {
    const res = await fetch(`/api/pdf-editor/sessions/${id}/export`, {
      headers: authHeaders(token),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err: any = new Error(body?.error || `HTTP ${res.status}`)
      err.status = res.status
      throw err
    }
    return res.blob()
  },

  // Run OCR: send page images to server, receive OCR results back
  async runOcr(
    id: string,
    pages: Array<{ pageIndex: number; imageDataUrl: string }>,
    token: string | null,
  ): Promise<OcrData> {
    const res = await fetch(`/api/pdf-editor/sessions/${id}/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ pages }),
    })
    return handleResponse(res)
  },

  // Save OCR edits (user corrections to extracted text)
  async saveOcrEdits(
    id: string,
    ocrData: OcrData,
    token: string | null,
  ): Promise<void> {
    await fetch(`/api/pdf-editor/sessions/${id}/ocr`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ ocrData }),
    })
  },

  // Rename session
  async renameSession(
    id: string,
    fileName: string,
    token: string | null,
  ): Promise<void> {
    await fetch(`/api/pdf-editor/sessions/${id}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ fileName }),
    })
  },

  // Delete session
  async deleteSession(id: string, token: string | null): Promise<void> {
    await fetch(`/api/pdf-editor/sessions/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  },
}

// ─── PDF Utilities API ────────────────────────────────────────────────────────

export const pdfUtilitiesApi = {
  // Merge multiple PDFs into one — returns Blob
  async merge(files: File[], token: string | null): Promise<Blob> {
    const form = new FormData()
    files.forEach((f, i) => form.append(`file_${i}`, f, f.name))
    form.append("count", String(files.length))
    const res = await fetch("/api/pdf-utilities/merge", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || `HTTP ${res.status}`)
    }
    return res.blob()
  },

  // Extract pages from a PDF — pageRange like "1-3,5,7-9"
  async extractPages(file: File, pageRange: string, token: string | null): Promise<Blob> {
    const form = new FormData()
    form.append("file", file, file.name)
    form.append("pageRange", pageRange)
    const res = await fetch("/api/pdf-utilities/extract-pages", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || `HTTP ${res.status}`)
    }
    return res.blob()
  },

  // Page operations (delete, rotate, reorder) — ops is a declarative list
  async pageOps(
    file: File,
    ops: Array<
      | { type: "delete"; pageIndexes: number[] }
      | { type: "rotate"; pageIndexes: number[]; degrees: 90 | 180 | 270 }
      | { type: "reorder"; order: number[] }
    >,
    token: string | null,
  ): Promise<Blob> {
    const form = new FormData()
    form.append("file", file, file.name)
    form.append("ops", JSON.stringify(ops))
    const res = await fetch("/api/pdf-utilities/page-ops", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || `HTTP ${res.status}`)
    }
    return res.blob()
  },

  // Compress / optimize PDF
  async compress(file: File, token: string | null): Promise<Blob> {
    const form = new FormData()
    form.append("file", file, file.name)
    const res = await fetch("/api/pdf-utilities/compress", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || `HTTP ${res.status}`)
    }
    return res.blob()
  },

  // Get page count from a file (before committing to a full operation)
  async getPageCount(file: File, token: string | null): Promise<number> {
    const form = new FormData()
    form.append("file", file, file.name)
    const res = await fetch("/api/pdf-utilities/page-count", {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || `HTTP ${res.status}`)
    }
    const data = await res.json()
    return data.pageCount as number
  },
}
