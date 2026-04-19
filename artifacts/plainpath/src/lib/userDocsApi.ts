const base = () =>
  ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/+$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${base()}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
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

export async function fetchUserDocuments(): Promise<UserDocument[]> {
  return apiFetch("/api/user/documents");
}

export async function fetchUserDocument(id: string): Promise<UserDocument> {
  return apiFetch(`/api/user/documents/${id}`);
}

export async function createUserDocument(payload: CreateDocumentPayload): Promise<UserDocument> {
  return apiFetch("/api/user/documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function renameUserDocument(id: string, title: string): Promise<void> {
  await apiFetch(`/api/user/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteUserDocument(id: string): Promise<void> {
  await apiFetch(`/api/user/documents/${id}`, { method: "DELETE" });
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
  payload: AttachToolRunPayload
): Promise<DocumentToolRun> {
  return apiFetch(`/api/user/documents/${documentId}/tool-run`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
