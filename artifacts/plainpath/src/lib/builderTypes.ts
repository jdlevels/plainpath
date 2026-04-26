// ─── Block Payload Types ───────────────────────────────────────────────────────

export interface HeadingPayload {
  text: string;
  level: 1 | 2 | 3;
}

export interface ParagraphMark {
  type: "bold" | "italic";
  start: number;
  end: number;
}

export interface ParagraphPayload {
  text: string;
  marks?: ParagraphMark[];
}

export interface BulletListPayload {
  items: string[];
}

export interface NumberedListPayload {
  items: string[];
  start?: number;
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface ChecklistPayload {
  items: ChecklistItem[];
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface KeyValuePayload {
  pairs: KeyValuePair[];
  layout?: "two-column" | "stacked";
}

export interface DividerPayload {
  style?: "line" | "space";
}

export interface NotePayload {
  text: string;
  variant?: "info" | "warning" | "tip";
}

export interface TablePayload {
  columns: string[];
  rows: string[][];
  has_header_row?: boolean;
}

export type KnownBlockType =
  | "heading"
  | "paragraph"
  | "bullet-list"
  | "numbered-list"
  | "checklist"
  | "key-value"
  | "divider"
  | "note"
  | "table";

export const KNOWN_BLOCK_TYPES: KnownBlockType[] = [
  "heading",
  "paragraph",
  "bullet-list",
  "numbered-list",
  "checklist",
  "key-value",
  "divider",
  "note",
  "table",
];

export const BLOCK_TYPE_LABELS: Record<KnownBlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  "bullet-list": "Bullet List",
  "numbered-list": "Numbered List",
  checklist: "Checklist",
  "key-value": "Key-Value",
  divider: "Divider",
  note: "Note / Callout",
  table: "Table",
};

// ─── Block ────────────────────────────────────────────────────────────────────

export interface BuilderBlock {
  id: string;
  type: string;
  order: number;
  payload: Record<string, unknown>;
  _unknown?: boolean;
}

// ─── Section ─────────────────────────────────────────────────────────────────

export interface BuilderSection {
  id: string;
  title: string;
  order: number;
  blocks: BuilderBlock[];
}

// ─── Branding ─────────────────────────────────────────────────────────────────

export type HeaderStyle = "minimal" | "formal" | "modern" | "internal";
export type LogoPosition = "left" | "center" | "right";

/** Text-only branding fields that are safe to persist in the content JSON column. */
export interface BrandingData {
  companyName?: string;
  departmentName?: string;
  documentOwner?: string;
  approvedBy?: string;
  reviewCycle?: string;
  brandColor?: string;
  logoPosition?: LogoPosition;
  headerStyle?: HeaderStyle;
  footerText?: string;
  showPageNumber?: boolean;
  showConfidential?: boolean;
  showRevisionLine?: boolean;
  watermarkEnabled?: boolean;
}

/** Full runtime branding state, including local-only fields (e.g. logoDataUrl). */
export interface BrandingState extends Required<BrandingData> {
  logoDataUrl: string | null; // local preview only — never persisted
}

export const DEFAULT_BRANDING: BrandingState = {
  companyName: "",
  departmentName: "",
  documentOwner: "",
  approvedBy: "",
  reviewCycle: "",
  brandColor: "#1d4ed8",
  logoDataUrl: null,
  logoPosition: "left",
  headerStyle: "minimal",
  footerText: "",
  showPageNumber: false,
  showConfidential: false,
  showRevisionLine: false,
  watermarkEnabled: false,
};

// ─── Content ─────────────────────────────────────────────────────────────────

export interface BuilderContent {
  sections: BuilderSection[];
  /** Optional persisted branding (text fields only; logoDataUrl is never stored here). */
  branding?: BrandingData;
}

// ─── Document ────────────────────────────────────────────────────────────────

export type BuilderDocStatus = "draft" | "final";

export interface BuilderDocumentMeta {
  id: string;
  userId: string;
  title: string;
  category: string;
  status: BuilderDocStatus;
  source: "blank" | "template";
  templateId?: string | null;
  serverVersion: number;
  latestSnapshotId?: string | null;
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
  blockCount: number;
}

export interface BuilderDocumentFull extends BuilderDocumentMeta {
  content: BuilderContent;
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface BuilderTemplate {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  isSystem: boolean;
  content: BuilderContent;
}

// ─── Autosave ─────────────────────────────────────────────────────────────────

export type AutosaveStatus =
  | "idle"
  | "pending"
  | "saving"
  | "saved"
  | "conflict"
  | "error";
