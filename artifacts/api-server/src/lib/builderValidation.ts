/**
 * Server-side validation for all 9 V1 Builder block types.
 *
 * Rules per spec:
 *  - Paragraph marks: UTF-16 code unit indices, non-overlapping, bold/italic only
 *  - Unknown blocks: preserved verbatim if _unknown === true
 *  - Status: only draft/final accepted on PUT (archived is system-only)
 */

// ─── Category enum ────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  "sop", "handbook", "policy", "checklist",
  "incident-report", "proposal", "prd", "other",
] as const;

// ─── V1 block type registry ───────────────────────────────────────────────────

const V1_BLOCK_TYPES = new Set([
  "heading", "paragraph", "bullet-list", "numbered-list",
  "checklist", "key-value", "divider", "note", "table",
]);

export function isSupportedBlockType(type: string): boolean {
  return V1_BLOCK_TYPES.has(type);
}

// ─── Error structure ──────────────────────────────────────────────────────────

export interface ValidationError {
  error: string;
  field?: string;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringOfLength(v: unknown, min: number, max: number): v is string {
  return typeof v === "string" && v.length >= min && v.length <= max;
}

// ─── Payload validators ───────────────────────────────────────────────────────

function validateHeadingPayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "heading payload must be an object";
  const { text, level } = p as Record<string, unknown>;
  if (!isStringOfLength(text, 0, 300)) return "heading.text must be 0–300 characters";
  if (![1, 2, 3].includes(level as number)) return "heading.level must be 1, 2, or 3";
  return null;
}

function validateParagraphPayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "paragraph payload must be an object";
  const { text, marks } = p as Record<string, unknown>;
  if (!isStringOfLength(text, 0, 10000)) return "paragraph.text must be 0–10,000 characters";

  if (marks !== undefined) {
    if (!Array.isArray(marks)) return "paragraph.marks must be an array";
    const textLen = (text as string).length; // UTF-16 code units

    const validatedMarks: Array<{ type: string; start: number; end: number }> = [];
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i] as Record<string, unknown>;
      if (!["bold", "italic"].includes(m.type as string)) {
        return `paragraph.marks[${i}].type must be "bold" or "italic"`;
      }
      if (typeof m.start !== "number" || typeof m.end !== "number") {
        return `paragraph.marks[${i}] start/end must be numbers (UTF-16 indices)`;
      }
      if (m.start < 0 || m.end > textLen || m.start >= m.end) {
        return `paragraph.marks[${i}] offsets out of bounds or invalid (0 <= start < end <= ${textLen})`;
      }
      validatedMarks.push({ type: m.type as string, start: m.start, end: m.end });
    }
    // Check non-overlapping (sort by start, check each against prior end)
    const sorted = [...validatedMarks].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        return "paragraph.marks must not overlap";
      }
    }
  }
  return null;
}

function validateBulletListPayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "bullet-list payload must be an object";
  const { items } = p as Record<string, unknown>;
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
    return "bullet-list.items must be an array of 1–100 items";
  }
  for (let i = 0; i < items.length; i++) {
    if (!isStringOfLength(items[i], 0, 2000)) {
      return `bullet-list.items[${i}] must be a string of 0–2,000 characters`;
    }
  }
  return null;
}

function validateNumberedListPayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "numbered-list payload must be an object";
  const { items, start } = p as Record<string, unknown>;
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
    return "numbered-list.items must be an array of 1–100 items";
  }
  for (let i = 0; i < items.length; i++) {
    if (!isStringOfLength(items[i], 0, 2000)) {
      return `numbered-list.items[${i}] must be a string of 0–2,000 characters`;
    }
  }
  if (start !== undefined) {
    if (typeof start !== "number" || !Number.isInteger(start) || start < 1) {
      return "numbered-list.start must be a positive integer";
    }
  }
  return null;
}

function validateChecklistPayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "checklist payload must be an object";
  const { items } = p as Record<string, unknown>;
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
    return "checklist.items must be an array of 1–100 items";
  }
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    if (!item || typeof item !== "object") {
      return `checklist.items[${i}] must be an object`;
    }
    if (!isStringOfLength(item.text, 0, 2000)) {
      return `checklist.items[${i}].text must be 0–2,000 characters`;
    }
    if (typeof item.checked !== "boolean") {
      return `checklist.items[${i}].checked must be a boolean`;
    }
  }
  return null;
}

function validateKeyValuePayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "key-value payload must be an object";
  const { pairs, layout } = p as Record<string, unknown>;
  if (!Array.isArray(pairs) || pairs.length < 1 || pairs.length > 30) {
    return "key-value.pairs must be an array of 1–30 pairs";
  }
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i] as Record<string, unknown>;
    if (!pair || typeof pair !== "object") return `key-value.pairs[${i}] must be an object`;
    if (!isStringOfLength(pair.key, 0, 100)) {
      return `key-value.pairs[${i}].key must be 0–100 characters`;
    }
    if (typeof pair.value !== "string" || (pair.value as string).length > 1000) {
      return `key-value.pairs[${i}].value must be a string of 0–1,000 characters`;
    }
  }
  if (layout !== undefined && !["two-column", "stacked"].includes(layout as string)) {
    return 'key-value.layout must be "two-column" or "stacked"';
  }
  return null;
}

function validateDividerPayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "divider payload must be an object";
  const { style } = p as Record<string, unknown>;
  if (style !== undefined && !["line", "space"].includes(style as string)) {
    return 'divider.style must be "line" or "space"';
  }
  return null;
}

function validateNotePayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "note payload must be an object";
  const { text, variant } = p as Record<string, unknown>;
  if (!isStringOfLength(text, 0, 5000)) return "note.text must be 0–5,000 characters";
  if (variant !== undefined && !["info", "warning", "tip"].includes(variant as string)) {
    return 'note.variant must be "info", "warning", or "tip"';
  }
  return null;
}

function validateTablePayload(p: unknown): string | null {
  if (!p || typeof p !== "object") return "table payload must be an object";
  const { columns, rows, has_header_row } = p as Record<string, unknown>;
  if (!Array.isArray(columns) || columns.length < 1 || columns.length > 10) {
    return "table.columns must be an array of 1–10 column headers";
  }
  for (let i = 0; i < columns.length; i++) {
    if (typeof columns[i] !== "string") return `table.columns[${i}] must be a string`;
  }
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 50) {
    return "table.rows must be an array of 1–50 rows";
  }
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!Array.isArray(row)) return `table.rows[${r}] must be an array`;
    if (row.length !== columns.length) {
      return `table.rows[${r}] must have exactly ${columns.length} cells (matches column count)`;
    }
    for (let c = 0; c < row.length; c++) {
      if (typeof row[c] !== "string" || (row[c] as string).length > 2000) {
        return `table.rows[${r}][${c}] must be a string of 0–2,000 characters`;
      }
    }
  }
  if (has_header_row !== undefined && typeof has_header_row !== "boolean") {
    return "table.has_header_row must be a boolean";
  }
  return null;
}

const PAYLOAD_VALIDATORS: Record<string, (p: unknown) => string | null> = {
  heading: validateHeadingPayload,
  paragraph: validateParagraphPayload,
  "bullet-list": validateBulletListPayload,
  "numbered-list": validateNumberedListPayload,
  checklist: validateChecklistPayload,
  "key-value": validateKeyValuePayload,
  divider: validateDividerPayload,
  note: validateNotePayload,
  table: validateTablePayload,
};

// ─── Block validator ──────────────────────────────────────────────────────────

function validateBlock(
  block: unknown,
  blockIndex: number,
  sectionIndex: number,
): string | null {
  if (!block || typeof block !== "object") {
    return `sections[${sectionIndex}].blocks[${blockIndex}] must be an object`;
  }
  const b = block as Record<string, unknown>;

  if (typeof b.id !== "string" || b.id.trim().length === 0) {
    return `sections[${sectionIndex}].blocks[${blockIndex}].id must be a non-empty string`;
  }
  if (typeof b.type !== "string" || b.type.trim().length === 0) {
    return `sections[${sectionIndex}].blocks[${blockIndex}].type must be a non-empty string`;
  }
  if (typeof b.order !== "number" || !Number.isInteger(b.order) || b.order < 0) {
    return `sections[${sectionIndex}].blocks[${blockIndex}].order must be a non-negative integer`;
  }

  const isUnknown = b._unknown === true;
  const isKnown = isSupportedBlockType(b.type);

  if (!isKnown && !isUnknown) {
    return `sections[${sectionIndex}].blocks[${blockIndex}].type "${b.type}" is not a supported V1 block type and is not marked as _unknown`;
  }

  // Unknown blocks: accept payload verbatim, skip payload validation
  if (isUnknown) return null;

  // Known blocks: validate payload
  const validator = PAYLOAD_VALIDATORS[b.type];
  if (!validator) return null; // Guard; should not happen

  const payloadError = validator(b.payload);
  if (payloadError) {
    return `sections[${sectionIndex}].blocks[${blockIndex}] (${b.type}): ${payloadError}`;
  }

  return null;
}

// ─── Section validator ────────────────────────────────────────────────────────

function validateSection(section: unknown, index: number): string | null {
  if (!section || typeof section !== "object") {
    return `sections[${index}] must be an object`;
  }
  const s = section as Record<string, unknown>;

  if (typeof s.id !== "string" || s.id.trim().length === 0) {
    return `sections[${index}].id must be a non-empty string`;
  }
  if (!isStringOfLength(s.title, 0, 120)) {
    return `sections[${index}].title must be 0–120 characters`;
  }
  if (typeof s.order !== "number" || !Number.isInteger(s.order) || s.order < 0) {
    return `sections[${index}].order must be a non-negative integer`;
  }

  const blocks = s.blocks;
  if (!Array.isArray(blocks)) return `sections[${index}].blocks must be an array`;
  if (blocks.length > 100) return `sections[${index}] must not exceed 100 blocks`;

  // Unique block IDs within section
  const blockIds = new Set<string>();
  const blockOrders = new Set<number>();
  for (let i = 0; i < blocks.length; i++) {
    const err = validateBlock(blocks[i], i, index);
    if (err) return err;
    const b = blocks[i] as Record<string, unknown>;
    if (blockIds.has(b.id as string)) {
      return `sections[${index}].blocks: duplicate block id "${b.id}"`;
    }
    if (blockOrders.has(b.order as number)) {
      return `sections[${index}].blocks: duplicate block order ${b.order}`;
    }
    blockIds.add(b.id as string);
    blockOrders.add(b.order as number);
  }

  return null;
}

// ─── Content validator ────────────────────────────────────────────────────────

function validateContent(content: unknown): string | null {
  if (!content || typeof content !== "object") return "content must be an object";
  const c = content as Record<string, unknown>;

  if (!Array.isArray(c.sections)) return "content.sections must be an array";
  if (c.sections.length < 1) return "content must have at least 1 section";
  if (c.sections.length > 50) return "content must not exceed 50 sections";

  const sectionIds = new Set<string>();
  const sectionOrders = new Set<number>();
  for (let i = 0; i < c.sections.length; i++) {
    const err = validateSection(c.sections[i], i);
    if (err) return err;
    const s = c.sections[i] as Record<string, unknown>;
    if (sectionIds.has(s.id as string)) {
      return `content.sections: duplicate section id "${s.id}"`;
    }
    if (sectionOrders.has(s.order as number)) {
      return `content.sections: duplicate section order ${s.order}`;
    }
    sectionIds.add(s.id as string);
    sectionOrders.add(s.order as number);
  }

  return null;
}

// ─── Document-level validators ────────────────────────────────────────────────

export function validateCreateDocument(body: unknown): ValidationError | null {
  if (!body || typeof body !== "object") {
    return { error: "validation_error", message: "Request body must be an object" };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.title) || (b.title as string).length > 200) {
    return { error: "validation_error", field: "title", message: "title must be 1–200 non-whitespace characters" };
  }
  if (!VALID_CATEGORIES.includes(b.category as never)) {
    return { error: "validation_error", field: "category", message: `category must be one of: ${VALID_CATEGORIES.join(", ")}` };
  }
  if (b.source !== undefined && !["blank", "template"].includes(b.source as string)) {
    return { error: "validation_error", field: "source", message: 'source must be "blank" or "template"' };
  }

  const contentErr = validateContent(b.content);
  if (contentErr) {
    return { error: "validation_error", field: "content", message: contentErr };
  }

  return null;
}

export function validateUpdateDocument(body: unknown): ValidationError | null {
  if (!body || typeof body !== "object") {
    return { error: "validation_error", message: "Request body must be an object" };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.server_version !== "number" || !Number.isInteger(b.server_version)) {
    return { error: "validation_error", field: "server_version", message: "server_version must be an integer" };
  }

  if (b.title !== undefined) {
    if (typeof b.title !== "string" || (b.title as string).length > 200) {
      return { error: "validation_error", field: "title", message: "title must be a string of 0–200 characters" };
    }
  }

  if (b.status !== undefined && !["draft", "final"].includes(b.status as string)) {
    return {
      error: "validation_error",
      field: "status",
      message: 'status must be "draft" or "final" — archived status is set via the archive endpoint',
    };
  }

  if (b.content !== undefined) {
    const contentErr = validateContent(b.content);
    if (contentErr) {
      return { error: "validation_error", field: "content", message: contentErr };
    }
  }

  return null;
}
