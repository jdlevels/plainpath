// ─── Compare Versions — Slice 1 Types ─────────────────────────────────────────

export type CVSessionStatus = "pending" | "scanning" | "complete" | "error";

export type WatchlistSeverity = "High" | "Medium" | "Low";

export interface CVWatchlistItem {
  id: string;
  text: string;
  severity: WatchlistSeverity;
  resolved: boolean;
}

export interface CVManagerNotes {
  freeform: string;
  watchlist: CVWatchlistItem[];
}

export interface CVSessionListItem {
  id: string;
  title: string;
  status: CVSessionStatus;
  originalFileName: string;
  revisedFileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CVSessionDetail extends CVSessionListItem {
  originalStorageKey: string;
  originalPageCount: number | null;
  revisedStorageKey: string;
  revisedPageCount: number | null;
  managerNotes: CVManagerNotes;
  scannedAt: string | null;
}

export interface CreateCVSessionInput {
  originalFile: File;
  revisedFile: File;
  title?: string;
  managerNotes?: CVManagerNotes;
}
