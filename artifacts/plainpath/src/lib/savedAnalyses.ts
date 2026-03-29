import type { DocumentAnalysis } from "@workspace/api-client-react";

const STORAGE_KEY = "plainpath-saved-analyses";

export interface SavedAnalysis {
  id: string;
  savedAt: string;
  title: string;
  sourceKind: "demo" | "document";
  documentTypeHint: string | null;
  analysis: DocumentAnalysis;
}

function load(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedAnalysis[]) : [];
  } catch {
    return [];
  }
}

function persist(items: SavedAnalysis[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getAll(): SavedAnalysis[] {
  return load().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export function getById(id: string): SavedAnalysis | null {
  return load().find((a) => a.id === id) ?? null;
}

export function saveAnalysis(
  item: Omit<SavedAnalysis, "id" | "savedAt">
): SavedAnalysis {
  const items = load();
  const newItem: SavedAnalysis = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...item,
  };
  persist([newItem, ...items]);
  return newItem;
}

export function updateSaved(
  id: string,
  updates: Partial<Pick<SavedAnalysis, "title" | "analysis">>
): boolean {
  const items = load();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  items[idx] = { ...items[idx], ...updates, savedAt: new Date().toISOString() };
  persist(items);
  return true;
}

export function renameAnalysis(id: string, title: string): boolean {
  return updateSaved(id, { title });
}

export function deleteAnalysis(id: string): boolean {
  const items = load();
  const filtered = items.filter((a) => a.id !== id);
  if (filtered.length === items.length) return false;
  persist(filtered);
  return true;
}

export function estimateSizeKb(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    return Math.round(raw.length / 1024);
  } catch {
    return 0;
  }
}
