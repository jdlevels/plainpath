// ─── Compare Versions — Shared Types (Slices 1–3) ─────────────────────────────

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

// ─── Diff result types (mirroring the engine output) ──────────────────────────

export interface CVDiffRect {
  x: number; // fractional 0-1, from left
  y: number; // fractional 0-1, from top
  w: number; // fractional width
  h: number; // fractional height
}

export type CVDiffSeverity = "high" | "medium" | "low";

export type CVDiffChangeType =
  | "visual_change"
  | "added_page"
  | "removed_page"
  | "text_added"
  | "text_removed"
  | "text_modified"
  | "structural_signal";

export type CVSignalType =
  | "page_count_change"
  | "heading_added"
  | "heading_removed"
  | "heading_renamed"
  | "section_reordered"
  | "table_added"
  | "table_removed"
  | "appendix_added"
  | "appendix_removed"
  | "signature_block_changed"
  | "version_history_changed"
  | "header_footer_changed";

export interface CVDiffItem {
  id: string;
  source: "visual" | "text" | "structural";
  page_original: number | null;
  page_revised: number | null;
  rect_original: CVDiffRect | null;
  rect_revised: CVDiffRect | null;
  change_type: CVDiffChangeType;
  signal_type: CVSignalType | null;
  original_text: string | null;
  revised_text: string | null;
  severity: CVDiffSeverity;
  severity_overridden: boolean;
  ai_explanation: null;
  ai_category: null;
  meta: Record<string, unknown>;
}

export interface CVDiffStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  pagesWithDiffs: number;
}

export interface CVDiffResult {
  version: 1;
  generatedAt: string;
  stats: CVDiffStats;
  items: CVDiffItem[];
}

// ─── Session types ─────────────────────────────────────────────────────────────

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
  diffResult: CVDiffResult | null;
  scannedAt: string | null;
}

export interface CreateCVSessionInput {
  originalFile: File;
  revisedFile: File;
  title?: string;
  managerNotes?: CVManagerNotes;
}
