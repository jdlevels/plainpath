// ─── PDF Editor Types ──────────────────────────────────────────────────────────

export type EditOpKind = "text" | "mask" | "highlight"

export interface EditOp {
  id: string
  kind: EditOpKind
  pageIndex: number
  // Position + size as fractions of page image dimensions (0–1)
  x: number
  y: number
  w: number
  h: number
  // Text-op fields
  text?: string
  fontSize?: number  // CSS px at natural render scale, default 16
  color?: string     // CSS hex, default "#000000"
  // Highlight-op fields
  highlightColor?: string  // CSS hex, default "#fde68a"
  opacity?: number         // 0–1, default 0.4
  // Mask op: solid white rectangle — no extra fields needed
  // Correction tracking (handoff highlights only)
  correctedAt?: string     // ISO timestamp set when marked corrected; undefined = open
}

export type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error"

export type ActiveTool = "select" | "text" | "mask" | "highlight"

// ─── PDF classification ────────────────────────────────────────────────────────

export type PdfType = "text" | "scanned" | "mixed" | "unknown"

// ─── OCR types ────────────────────────────────────────────────────────────────

export interface OcrPage {
  pageIndex: number
  text: string
  editedText?: string  // user correction; undefined = not edited
}

export interface OcrData {
  pages: OcrPage[]
  runAt?: string
}

// ─── Session types ────────────────────────────────────────────────────────────

export interface SessionMeta {
  id: string
  fileName: string
  fileSizeBytes: number
  pageCount: number | null
  updatedAt: string
  pdfType?: PdfType
}

export interface SessionDetail extends SessionMeta {
  ops: EditOp[]
  createdAt: string
  ocrData?: OcrData | null
}
