import type { SavedAnalysis } from "./savedAnalyses";
import type { SavedTrustCheck } from "./savedTrustChecks";

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

// ─── Analyses ────────────────────────────────────────────────────────────────

export async function fetchCloudAnalyses(): Promise<SavedAnalysis[]> {
  return apiFetch("/api/user/analyses");
}

export async function saveCloudAnalysis(
  item: Omit<SavedAnalysis, "id" | "savedAt">
): Promise<SavedAnalysis> {
  return apiFetch("/api/user/analyses", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function renameCloudAnalysis(id: string, title: string): Promise<void> {
  await apiFetch(`/api/user/analyses/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteCloudAnalysis(id: string): Promise<void> {
  await apiFetch(`/api/user/analyses/${id}`, { method: "DELETE" });
}

// ─── Trust Checks ─────────────────────────────────────────────────────────────

export async function fetchCloudTrustChecks(): Promise<SavedTrustCheck[]> {
  return apiFetch("/api/user/trust-checks");
}

export async function saveCloudTrustCheck(
  item: Omit<SavedTrustCheck, "id" | "savedAt">
): Promise<SavedTrustCheck> {
  return apiFetch("/api/user/trust-checks", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function deleteCloudTrustCheck(id: string): Promise<void> {
  await apiFetch(`/api/user/trust-checks/${id}`, { method: "DELETE" });
}
