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
  async listDocuments(): Promise<BuilderDocumentMeta[]> {
    const res = await fetch(`${base()}/api/builder/documents`, {
      credentials: "include",
    });
    return handleResponse(res);
  },

  async createDocument(data: {
    title: string;
    category: string;
    source: "blank" | "template";
    templateId?: string | null;
    content: BuilderContent;
  }): Promise<BuilderDocumentFull> {
    const res = await fetch(`${base()}/api/builder/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getDocument(id: string): Promise<BuilderDocumentFull> {
    const res = await fetch(`${base()}/api/builder/documents/${id}`, {
      credentials: "include",
    });
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
  ): Promise<{
    id: string;
    serverVersion: number;
    updatedAt: string;
    status: string;
    title: string;
  }> {
    const res = await fetch(`${base()}/api/builder/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async archiveDocument(id: string): Promise<{ id: string; status: string }> {
    const res = await fetch(
      `${base()}/api/builder/documents/${id}/archive`,
      { method: "POST", credentials: "include" },
    );
    return handleResponse(res);
  },

  async listTemplates(category?: string): Promise<BuilderTemplate[]> {
    const url = new URL(`${base()}/api/builder/templates`);
    if (category) url.searchParams.set("category", category);
    const res = await fetch(url.toString(), { credentials: "include" });
    return handleResponse(res);
  },

  async getTemplate(id: string): Promise<BuilderTemplate> {
    const res = await fetch(`${base()}/api/builder/templates/${id}`, {
      credentials: "include",
    });
    return handleResponse(res);
  },
};
