// ─── Compare Versions — Shared Types (Slices 1–5) ─────────────────────────────

export type CVSessionStatus = "pending" | "scanning" | "complete" | "error";
export type CVAiStatus = "idle" | "running" | "complete" | "error";

// ─── AI enrichment ─────────────────────────────────────────────────────────────

export type CVAiCategory =
  | "meaning_change"
  | "policy_change"
  | "legal_language"
  | "financial_value"
  | "date_deadline"
  | "safety_threshold"
  | "rewrite_equivalent"
  | "typo_correction"
  | "cosmetic_text"
  | "unclear";

// ─── Notes & watchlist ─────────────────────────────────────────────────────────

export type CVNoteSeverity = "high" | "medium" | "low";

export interface CVFreeformNote {
  id: string;
  type: "freeform";
  text: string;
  resolved: boolean;
  created_at: string;
  linked_diff_id: string | null;
}

export interface CVWatchlistItem {
  id: string;
  type: "watchlist";
  text: string;
  severity: CVNoteSeverity;
  resolved: boolean;
  created_at: string;
  linked_diff_id: string | null;
}

export type CVNoteItem = CVFreeformNote | CVWatchlistItem;

export interface CVManagerNotes {
  freeform: string; // legacy plain-text field — kept for backward compat
  watchlist: CVWatchlistItem[];
  notes: CVFreeformNote[]; // structured freeform notes (Slice 4+)
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
  // AI enrichment fields (Slice 5) — null until enrichment runs
  ai_category: CVAiCategory | null;
  ai_explanation: string | null;
  ai_confidence: number | null;
  ai_enriched_at: string | null;
  // meta: severity_deterministic, severity_ai, originalSeverity (from Slice 4 override)
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

// ─── Group zone (Slice 4) ──────────────────────────────────────────────────────
// A group zone is a union-rect of overlapping individual diff item rects on one pane.

export interface CVGroupZone {
  id: string; // stable: "grp-{pane}-{sortedItemIds}"
  pane: "original" | "revised";
  page: number;
  rect: CVDiffRect;
  itemIds: string[];
  highestSeverity: CVDiffSeverity;
  containsAdded: boolean;
  containsRemoved: boolean;
}

// ─── Session types ─────────────────────────────────────────────────────────────

export interface CVSessionListItem {
  id: string;
  title: string;
  status: CVSessionStatus;
  originalFileName: string;
  revisedFileName: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Diff stats — null until scan completes
  diffTotal:  number | null;
  diffHigh:   number | null;
  diffMedium: number | null;
  diffLow:    number | null;
}

export interface CVSessionDetail extends CVSessionListItem {
  originalStorageKey: string;
  originalPageCount: number | null;
  revisedStorageKey: string;
  revisedPageCount: number | null;
  managerNotes: CVManagerNotes;
  diffResult: CVDiffResult | null;
  scannedAt: string | null;
  // AI enrichment status (Slice 5)
  aiStatus: CVAiStatus;
  aiEnrichedAt: string | null;
}

export interface CreateCVSessionInput {
  originalFile: File;
  revisedFile: File;
  title?: string;
  managerNotes?: CVManagerNotes;
}
