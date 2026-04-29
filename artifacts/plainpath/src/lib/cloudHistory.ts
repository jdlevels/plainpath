import type { SavedAnalysis } from "./savedAnalyses";
import type { SavedTrustCheck } from "./savedTrustChecks";
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

// ─── Analyses ────────────────────────────────────────────────────────────────

export async function fetchCloudAnalyses(token: string | null = null): Promise<SavedAnalysis[]> {
  return apiFetch("/api/user/analyses", token);
}

export async function saveCloudAnalysis(
  item: Omit<SavedAnalysis, "id" | "savedAt">,
  token: string | null = null,
): Promise<SavedAnalysis> {
  return apiFetch("/api/user/analyses", token, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function renameCloudAnalysis(id: string, title: string, token: string | null = null): Promise<void> {
  await apiFetch(`/api/user/analyses/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteCloudAnalysis(id: string, token: string | null = null): Promise<void> {
  await apiFetch(`/api/user/analyses/${id}`, token, { method: "DELETE" });
}

// ─── Trust Checks ─────────────────────────────────────────────────────────────

export async function fetchCloudTrustChecks(token: string | null = null): Promise<SavedTrustCheck[]> {
  return apiFetch("/api/user/trust-checks", token);
}

export async function saveCloudTrustCheck(
  item: Omit<SavedTrustCheck, "id" | "savedAt">,
  token: string | null = null,
): Promise<SavedTrustCheck> {
  return apiFetch("/api/user/trust-checks", token, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function deleteCloudTrustCheck(id: string, token: string | null = null): Promise<void> {
  await apiFetch(`/api/user/trust-checks/${id}`, token, { method: "DELETE" });
}
