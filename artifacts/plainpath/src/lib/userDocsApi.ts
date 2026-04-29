import { getApiBaseUrl } from "@/lib/api";

const base = () => getApiBaseUrl();

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch(path: string, token: string | null, options?: RequestInit) {
  const res = await fetch(`${base()}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
      ...(options?.headers ?? {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err: any = new Error(`API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export interface DocumentToolRun {
  id: string;
  tool: string;
  outputRef: string | null;
  outputKind: string | null;
  resultSummary: string | null;
  createdAt: string;
}

export interface UserDocument {
  id: string;
  title: string;
  sourceKind: string;
  mimeType: string | null;
  originalFilename: string | null;
  extractedText?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
  toolRunCount?: number;
  toolRuns: DocumentToolRun[];
}

export interface CreateDocumentPayload {
  title: string;
  sourceKind?: string;
  mimeType?: string;
  originalFilename?: string;
  extractedText?: string;
  metadata?: Record<string, unknown>;
}

export async function fetchUserDocuments(token: string | null = null): Promise<UserDocument[]> {
  return apiFetch("/api/user/documents", token);
}

export async function fetchUserDocument(id: string, token: string | null = null): Promise<UserDocument> {
  return apiFetch(`/api/user/documents/${id}`, token);
}

export async function createUserDocument(payload: CreateDocumentPayload, token: string | null = null): Promise<UserDocument> {
  return apiFetch("/api/user/documents", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function renameUserDocument(id: string, title: string, token: string | null = null): Promise<void> {
  await apiFetch(`/api/user/documents/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteUserDocument(id: string, token: string | null = null): Promise<void> {
  await apiFetch(`/api/user/documents/${id}`, token, { method: "DELETE" });
}

export interface AttachToolRunPayload {
  tool: string;
  outputRef?: string;
  outputKind?: string;
  resultSummary?: string;
  metadata?: Record<string, unknown>;
}

export async function attachToolRun(
  documentId: string,
  payload: AttachToolRunPayload,
  token: string | null = null,
): Promise<DocumentToolRun> {
  return apiFetch(`/api/user/documents/${documentId}/tool-run`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
