import type { DocumentAnalysis } from "@workspace/api-client-react";

const BASE_STORAGE_KEY = "plainpath-saved-analyses";

function storageKey(userId?: string | null): string {
  return userId ? `${BASE_STORAGE_KEY}-${userId}` : BASE_STORAGE_KEY;
}

export interface SavedAnalysis {
  id: string;
  savedAt: string;
  title: string;
  sourceKind: "demo" | "document";
  documentTypeHint: string | null;
  analysis: DocumentAnalysis;
}

function load(userId?: string | null): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as SavedAnalysis[]) : [];
  } catch {
    return [];
  }
}

function persist(items: SavedAnalysis[], userId?: string | null): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(items));
}

export function getAll(userId?: string | null): SavedAnalysis[] {
  return load(userId).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export function getById(id: string, userId?: string | null): SavedAnalysis | null {
  return load(userId).find((a) => a.id === id) ?? null;
}

export function saveAnalysis(
  item: Omit<SavedAnalysis, "id" | "savedAt">,
  userId?: string | null
): SavedAnalysis {
  const items = load(userId);
  const newItem: SavedAnalysis = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...item,
  };
  persist([newItem, ...items], userId);
  return newItem;
}

export function updateSaved(
  id: string,
  updates: Partial<Pick<SavedAnalysis, "title" | "analysis">>,
  userId?: string | null
): boolean {
  const items = load(userId);
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  items[idx] = { ...items[idx], ...updates, savedAt: new Date().toISOString() };
  persist(items, userId);
  return true;
}

export function renameAnalysis(id: string, title: string, userId?: string | null): boolean {
  return updateSaved(id, { title }, userId);
}

export function deleteAnalysis(id: string, userId?: string | null): boolean {
  const items = load(userId);
  const filtered = items.filter((a) => a.id !== id);
  if (filtered.length === items.length) return false;
  persist(filtered, userId);
  return true;
}

export function estimateSizeKb(userId?: string | null): number {
  try {
    const raw = localStorage.getItem(storageKey(userId)) ?? "";
    return Math.round(raw.length / 1024);
  } catch {
    return 0;
  }
}

export function clearUserAnalyses(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore
  }
}
