import { getApiBaseUrl } from "./api";
import type {
  BuilderDocumentFull,
  BuilderDocumentMeta,
  BuilderContent,
  BuilderTemplate,
} from "./builderTypes";

function base(): string {
  return getApiBaseUrl();
}

/**
 * Builds fetch options that include the Clerk session token in the
 * Authorization header when one is provided.  Falls back to
 * credentials:"include" (cookie-based) so the API still works in contexts
 * where getToken() is unavailable (e.g. server-side, tests).
 */
function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function authFetchOptions(token?: string | null, extra?: RequestInit): RequestInit {
  return {
    credentials: "include",
    ...extra,
    headers: {
      ...authHeaders(token),
      ...(extra?.headers ?? {}),
    },
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = Object.assign(
      new Error((data as Record<string, string>).message ?? "Request failed"),
      { status: res.status, data },
    );
    throw err;
  }
  return res.json() as Promise<T>;
}

export const builderApi = {
  async listDocuments(token?: string | null): Promise<BuilderDocumentMeta[]> {
    const res = await fetch(
      `${base()}/api/builder/documents`,
      authFetchOptions(token),
    );
    return handleResponse(res);
  },

  async createDocument(
    data: {
      title: string;
      category: string;
      source: "blank" | "template";
      templateId?: string | null;
      content: BuilderContent;
    },
    token?: string | null,
  ): Promise<BuilderDocumentFull> {
    const res = await fetch(
      `${base()}/api/builder/documents`,
      authFetchOptions(token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
    return handleResponse(res);
  },

  async getDocument(id: string, token?: string | null): Promise<BuilderDocumentFull> {
    const res = await fetch(
      `${base()}/api/builder/documents/${id}`,
      authFetchOptions(token),
    );
    return handleResponse(res);
  },

  async updateDocument(
    id: string,
    data: {
      title?: string;
      status?: string;
      content?: BuilderContent;
      server_version: number;
    },
    token?: string | null,
  ): Promise<{
    id: string;
    serverVersion: number;
    updatedAt: string;
    status: string;
    title: string;
  }> {
    const res = await fetch(
      `${base()}/api/builder/documents/${id}`,
      authFetchOptions(token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
    return handleResponse(res);
  },

  async archiveDocument(
    id: string,
    token?: string | null,
  ): Promise<{ id: string; status: string }> {
    const res = await fetch(
      `${base()}/api/builder/documents/${id}/archive`,
      authFetchOptions(token, { method: "POST" }),
    );
    return handleResponse(res);
  },

  async listTemplates(
    category?: string,
    token?: string | null,
  ): Promise<BuilderTemplate[]> {
    const path = category
      ? `${base()}/api/builder/templates?category=${encodeURIComponent(category)}`
      : `${base()}/api/builder/templates`;
    const res = await fetch(path, authFetchOptions(token));
    return handleResponse(res);
  },

  async getTemplate(
    id: string,
    token?: string | null,
  ): Promise<BuilderTemplate> {
    const res = await fetch(
      `${base()}/api/builder/templates/${id}`,
      authFetchOptions(token),
    );
    return handleResponse(res);
  },

  async aiBlockAction(
    data: {
      action: string;
      blockType: string;
      blockContent: string;
      documentTitle?: string;
      category?: string;
      sectionTitle?: string;
    },
    token?: string | null,
  ): Promise<{
    suggestion: string;
    newBlockType: string | null;
    safe: boolean;
    message: string | null;
  }> {
    const res = await fetch(
      `${base()}/api/builder/ai/block-action`,
      authFetchOptions(token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
    return handleResponse(res);
  },
};
