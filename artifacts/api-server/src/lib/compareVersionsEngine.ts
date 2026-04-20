// ─── Compare Versions Engine — Slice 3 ────────────────────────────────────────
// Deterministic three-stage comparison pipeline.
// Stage A: Spatial / visual fingerprint diff (text-position-based)
// Stage B: Line-level text diff (Myers / diffLines)
// Stage C: Structural signal detection (pattern matching)
//
// No OpenAI. No AI. No image rendering needed (no Ghostscript dependency).
// All analysis is deterministic and rule-based.
// ──────────────────────────────────────────────────────────────────────────────

// Import the underlying lib directly to avoid pdf-parse's startup file-read test
// (pdf-parse/index.js reads a test PDF at require() time which fails in production)
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { diffLines } from "diff";
import { v4 as uuidv4 } from "uuid";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DiffRect {
  x: number; // fractional 0-1, left
  y: number; // fractional 0-1, top (top-left origin)
  w: number; // fractional width
  h: number; // fractional height
}

export type DiffSeverity = "high" | "medium" | "low";

export type DiffChangeType =
  | "visual_change"
  | "added_page"
  | "removed_page"
  | "text_added"
  | "text_removed"
  | "text_modified"
  | "structural_signal";

export type SignalType =
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

export interface DiffItem {
  id: string;
  source: "visual" | "text" | "structural";
  page_original: number | null;
  page_revised: number | null;
  rect_original: DiffRect | null;
  rect_revised: DiffRect | null;
  change_type: DiffChangeType;
  signal_type: SignalType | null;
  original_text: string | null;
  revised_text: string | null;
  severity: DiffSeverity;
  severity_overridden: boolean;
  ai_explanation: null;
  ai_category: null;
  meta: Record<string, unknown>;
}

export interface DiffResult {
  version: 1;
  generatedAt: string;
  stats: {
    total: number;
    high: number;
    medium: number;
    low: number;
    pagesWithDiffs: number;
  };
  items: DiffItem[];
}

// ─── Internal page representation ─────────────────────────────────────────────

interface TextItem {
  str: string;
  x: number; // fractional (0-1)
  y: number; // fractional (0-1), top-left origin
  w: number;
  h: number;
}

interface PageData {
  pageNum: number; // 1-indexed
  width: number;   // points
  height: number;  // points
  items: TextItem[];
  rawText: string; // space-joined text
  lines: string[]; // newline-split lines for diff
}

// ─── PDF text extraction (with positions via pdfjs through pdf-parse) ──────────

async function extractPages(buffer: Buffer): Promise<PageData[]> {
  const pages: PageData[] = [];
  let pageCounter = 0;

  try {
    await pdfParse(buffer, {
      pagerender: async (pageData: any): Promise<string> => {
        pageCounter++;
        const pn = pageCounter;
        let width = 612, height = 792;
        let items: TextItem[] = [];

        try {
          const viewport = pageData.getViewport({ scale: 1 });
          width = viewport.width || 612;
          height = viewport.height || 792;

          const textContent = await pageData.getTextContent();
          items = (textContent.items as any[])
            .filter((it) => typeof it.str === "string")
            .map((it) => {
              const px = it.transform[4]; // x from left (points)
              const py = it.transform[5]; // y from bottom (points)
              const iw = Math.max(it.width || 4, 1);
              const ih = it.height || 12;
              return {
                str: it.str,
                x: Math.max(0, Math.min(1, px / width)),
                y: Math.max(0, Math.min(1, 1 - (py + ih) / height)),
                w: Math.max(0.002, Math.min(1, iw / width)),
                h: Math.max(0.002, Math.min(1, ih / height)),
              };
            });
        } catch {
          // Position extraction failed — still capture page with empty items
        }

        const rawText = items.map((i) => i.str).join(" ");
        // Build lines by grouping items with similar Y
        const lines = buildLines(items);

        pages.push({ pageNum: pn, width, height, items, rawText, lines });
        return rawText;
      },
    });
  } catch (err) {
    console.error("[cv-engine] extractPages error:", err);
  }

  return pages.sort((a, b) => a.pageNum - b.pageNum);
}

/** Group text items into visual lines (similar Y ± 0.8% tolerance). */
function buildLines(items: TextItem[]): string[] {
  if (!items.length) return [];
  const groups: { y: number; strs: string[] }[] = [];
  for (const item of items) {
    if (!item.str.trim()) continue;
    const existing = groups.find((g) => Math.abs(g.y - item.y) < 0.008);
    if (existing) {
      existing.strs.push(item.str);
    } else {
      groups.push({ y: item.y, strs: [item.str] });
    }
  }
  return groups
    .sort((a, b) => a.y - b.y)
    .map((g) => g.strs.join(" ").trim())
    .filter(Boolean);
}

// ─── Severity helpers ──────────────────────────────────────────────────────────

const HIGH_FINANCIAL = /[\$€£¥]\s*[\d,]+|\b(?:USD|EUR|GBP|fee|rate|price|total|amount|cost|payment|compensation|salary|wage|revenue|penalty|damages|compensation)\b/i;
const HIGH_DATE = /\b(?:effective|expires?|expiration|termination date|deadline|due date|commencement|renewal)\b/i;
const HIGH_LEGAL = /\b(?:shall|liable|liability|indemnif|warrant|terminat|breach|default|penalt|indemnit|assign|subrogat|arbitrat|liquidated)\b/i;
const HIGH_COMPLIANCE = /\b(?:must|required|mandatory|prohibited|compliance|regulation|statute|shall not|not permitted)\b/i;
const HIGH_SAFETY = /\b(?:maximum|minimum|limit|threshold|psi|ppm|hazard|safety|danger|toxic|critical|emergency)\b/i;

function combinedText(orig: string | null, rev: string | null): string {
  return `${orig ?? ""} ${rev ?? ""}`;
}

function computeSeverity(
  change_type: DiffChangeType,
  signal_type: SignalType | null,
  original_text: string | null,
  revised_text: string | null,
  meta: Record<string, unknown>,
): DiffSeverity {
  const combined = combinedText(original_text, revised_text);

  // Always HIGH
  if (signal_type === "signature_block_changed") return "high";
  if (change_type === "removed_page") return "high";
  if (signal_type === "heading_removed") return "high";
  if (signal_type === "page_count_change") return "high";

  // HIGH by content
  if (
    HIGH_FINANCIAL.test(combined) ||
    HIGH_DATE.test(combined) ||
    HIGH_LEGAL.test(combined) ||
    HIGH_COMPLIANCE.test(combined) ||
    HIGH_SAFETY.test(combined)
  ) {
    return "high";
  }

  // MEDIUM rules
  if (change_type === "added_page") return "medium";
  if (
    signal_type === "table_added" ||
    signal_type === "table_removed" ||
    signal_type === "heading_renamed" ||
    signal_type === "section_reordered" ||
    signal_type === "appendix_added" ||
    signal_type === "appendix_removed"
  )
    return "medium";
  if (change_type === "text_modified") {
    const delta = (meta.pixel_delta_pct as number | undefined) ?? 0;
    if (delta > 10) return "medium";
    return "medium"; // text_modified defaults to medium
  }

  // LOW
  if (signal_type === "header_footer_changed") return "low";
  if (change_type === "text_added" || change_type === "text_removed") {
    const len = Math.max(
      (original_text ?? "").length,
      (revised_text ?? "").length,
    );
    return len < 30 ? "low" : "medium";
  }

  const delta = (meta.pixel_delta_pct as number | undefined) ?? 0;
  if (change_type === "visual_change") {
    if (delta < 3) return "low";
    if (delta > 10) return "medium";
    return "low";
  }

  return "low";
}

// ─── Rect helpers ──────────────────────────────────────────────────────────────

function fullPageRect(): DiffRect {
  return { x: 0, y: 0, w: 1, h: 1 };
}

function findRectForText(text: string, items: TextItem[]): DiffRect | null {
  const needle = text.trim().slice(0, 40).toLowerCase();
  if (!needle) return null;
  const match = items.find((it) =>
    it.str.toLowerCase().includes(needle.slice(0, 20)),
  );
  if (!match) return null;
  return { x: match.x, y: match.y, w: match.w, h: match.h };
}

function boundsOfItems(subset: TextItem[]): DiffRect | null {
  if (!subset.length) return null;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const it of subset) {
    minX = Math.min(minX, it.x);
    minY = Math.min(minY, it.y);
    maxX = Math.max(maxX, it.x + it.w);
    maxY = Math.max(maxY, it.y + it.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ─── Stage A — Spatial / visual fingerprint diff ───────────────────────────────

function pageFingerprint(items: TextItem[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    if (!item.str.trim()) continue;
    const xb = Math.floor(item.x * 8); // 8 x-buckets
    const yb = Math.floor(item.y * 16); // 16 y-buckets
    set.add(`${xb}:${yb}:${item.str.trim().slice(0, 20)}`);
  }
  return set;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

function stageA(origPages: PageData[], revPages: PageData[]): DiffItem[] {
  const items: DiffItem[] = [];
  const maxPage = Math.max(origPages.length, revPages.length);

  for (let i = 0; i < maxPage; i++) {
    const orig = origPages[i] ?? null;
    const rev = revPages[i] ?? null;

    // Added page (exists in revised, not in original)
    if (!orig && rev) {
      const sev = computeSeverity("added_page", null, null, rev.rawText, {});
      items.push({
        id: uuidv4(),
        source: "visual",
        page_original: null,
        page_revised: rev.pageNum,
        rect_original: null,
        rect_revised: fullPageRect(),
        change_type: "added_page",
        signal_type: null,
        original_text: null,
        revised_text: rev.rawText.slice(0, 300) || null,
        severity: sev,
        severity_overridden: false,
        ai_explanation: null,
        ai_category: null,
        meta: { pixel_delta_pct: 100 },
      });
      continue;
    }

    // Removed page (exists in original, not in revised)
    if (orig && !rev) {
      const sev = computeSeverity("removed_page", null, orig.rawText, null, {});
      items.push({
        id: uuidv4(),
        source: "visual",
        page_original: orig.pageNum,
        page_revised: null,
        rect_original: fullPageRect(),
        rect_revised: null,
        change_type: "removed_page",
        signal_type: null,
        original_text: orig.rawText.slice(0, 300) || null,
        revised_text: null,
        severity: sev,
        severity_overridden: false,
        ai_explanation: null,
        ai_category: null,
        meta: { pixel_delta_pct: 100 },
      });
      continue;
    }

    if (!orig || !rev) continue;

    // Compare fingerprints
    const fpOrig = pageFingerprint(orig.items);
    const fpRev = pageFingerprint(rev.items);
    const similarity = jaccardSimilarity(fpOrig, fpRev);
    const deltaPct = Math.round((1 - similarity) * 100);

    if (deltaPct < 1) continue; // cosmetically unchanged

    const sev = computeSeverity(
      "visual_change",
      null,
      orig.rawText.slice(0, 200),
      rev.rawText.slice(0, 200),
      { pixel_delta_pct: deltaPct },
    );
    items.push({
      id: uuidv4(),
      source: "visual",
      page_original: orig.pageNum,
      page_revised: rev.pageNum,
      rect_original: fullPageRect(),
      rect_revised: fullPageRect(),
      change_type: "visual_change",
      signal_type: null,
      original_text: null,
      revised_text: null,
      severity: sev,
      severity_overridden: false,
      ai_explanation: null,
      ai_category: null,
      meta: { pixel_delta_pct: deltaPct },
    });
  }

  return items;
}

// ─── Stage B — Text diff ───────────────────────────────────────────────────────

function stageB(origPages: PageData[], revPages: PageData[]): DiffItem[] {
  const items: DiffItem[] = [];
  const maxPage = Math.max(origPages.length, revPages.length);

  for (let i = 0; i < maxPage; i++) {
    const orig = origPages[i] ?? null;
    const rev = revPages[i] ?? null;

    if (!orig || !rev) continue; // covered by Stage A

    const origText = orig.lines.join("\n");
    const revText = rev.lines.join("\n");

    if (origText === revText) continue;

    const changes = diffLines(origText, revText);
    let origLine = 1;
    let revLine = 1;

    // Collapse adjacent removed+added pairs into text_modified
    for (let ci = 0; ci < changes.length; ci++) {
      const ch = changes[ci];
      const next = changes[ci + 1];

      if (ch.removed && next?.added) {
        // text_modified: one section removed, one added in same place
        const origTxt = (ch.value ?? "").trim().slice(0, 500);
        const revTxt = (next.value ?? "").trim().slice(0, 500);
        const editDist = levenshteinApprox(origTxt, revTxt);
        const sev = computeSeverity(
          "text_modified",
          null,
          origTxt,
          revTxt,
          { edit_distance: editDist },
        );
        const rOrig = findRectForText(origTxt, orig.items) ?? null;
        const rRev = findRectForText(revTxt, rev.items) ?? null;

        items.push({
          id: uuidv4(),
          source: "text",
          page_original: orig.pageNum,
          page_revised: rev.pageNum,
          rect_original: rOrig,
          rect_revised: rRev,
          change_type: "text_modified",
          signal_type: null,
          original_text: origTxt || null,
          revised_text: revTxt || null,
          severity: sev,
          severity_overridden: false,
          ai_explanation: null,
          ai_category: null,
          meta: { edit_distance: editDist },
        });
        origLine += (ch.count ?? 1);
        revLine += (next.count ?? 1);
        ci++; // skip next
        continue;
      }

      if (ch.removed) {
        const origTxt = (ch.value ?? "").trim().slice(0, 500);
        if (!origTxt) { origLine += (ch.count ?? 1); continue; }
        const sev = computeSeverity("text_removed", null, origTxt, null, {});
        const rOrig = findRectForText(origTxt, orig.items) ?? null;

        items.push({
          id: uuidv4(),
          source: "text",
          page_original: orig.pageNum,
          page_revised: rev.pageNum,
          rect_original: rOrig,
          rect_revised: null,
          change_type: "text_removed",
          signal_type: null,
          original_text: origTxt,
          revised_text: null,
          severity: sev,
          severity_overridden: false,
          ai_explanation: null,
          ai_category: null,
          meta: {},
        });
        origLine += (ch.count ?? 1);
        continue;
      }

      if (ch.added) {
        const revTxt = (ch.value ?? "").trim().slice(0, 500);
        if (!revTxt) { revLine += (ch.count ?? 1); continue; }
        const sev = computeSeverity("text_added", null, null, revTxt, {});
        const rRev = findRectForText(revTxt, rev.items) ?? null;

        items.push({
          id: uuidv4(),
          source: "text",
          page_original: orig.pageNum,
          page_revised: rev.pageNum,
          rect_original: null,
          rect_revised: rRev,
          change_type: "text_added",
          signal_type: null,
          original_text: null,
          revised_text: revTxt,
          severity: sev,
          severity_overridden: false,
          ai_explanation: null,
          ai_category: null,
          meta: {},
        });
        revLine += (ch.count ?? 1);
        continue;
      }

      // Unchanged
      origLine += (ch.count ?? 1);
      revLine += (ch.count ?? 1);
    }
  }

  return items;
}

/** Approximate Levenshtein distance (capped for perf). */
function levenshteinApprox(a: string, b: string): number {
  const la = a.slice(0, 200);
  const lb = b.slice(0, 200);
  if (la === lb) return 0;
  const m = la.length, n = lb.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = la[i - 1] === lb[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = tmp;
    }
  }
  return dp[n];
}

// ─── Stage C — Structural signals ─────────────────────────────────────────────

const HEADING_RE = /^(?:(\d+\.)+\s+\w|[A-Z][A-Z\s]{4,}$|(?:Article|Section|Chapter)\s+\d)/;
const SIGNATURE_RE = /\b(?:signature|signed\s+by|approved\s+by|authorized|witnessed|executed\s+by|initials?)\b/i;
const APPENDIX_RE = /\b(?:appendix|schedule|exhibit|annex)\s+[A-Za-z0-9]/i;
const VERSION_RE = /\b(?:version\s+history|revision\s+history|change\s+log|amendment\s+history|document\s+history)\b/i;
const TABLE_LINE_RE = /\S+\s{3,}\S+/; // crude table column heuristic

function extractHeadings(pages: PageData[]): Set<string> {
  const headings = new Set<string>();
  for (const pg of pages) {
    for (const line of pg.lines) {
      if (HEADING_RE.test(line.trim())) {
        headings.add(line.trim().slice(0, 100).toLowerCase());
      }
    }
  }
  return headings;
}

function extractSignatureLines(pages: PageData[]): string[] {
  const lines: string[] = [];
  for (const pg of pages) {
    for (const line of pg.lines) {
      if (SIGNATURE_RE.test(line)) lines.push(line.trim().slice(0, 150));
    }
  }
  return lines;
}

function hasAppendix(pages: PageData[]): boolean {
  return pages.some((pg) => pg.lines.some((l) => APPENDIX_RE.test(l)));
}

function hasVersionHistory(pages: PageData[]): boolean {
  return pages.some((pg) => pg.lines.some((l) => VERSION_RE.test(l)));
}

function extractHeaderFooterLines(pages: PageData[]): string[] {
  const hf: string[] = [];
  for (const pg of pages) {
    if (pg.lines.length > 0) hf.push(pg.lines[0]);
    if (pg.lines.length > 1) hf.push(pg.lines[pg.lines.length - 1]);
  }
  return hf;
}

function tablePresent(pages: PageData[]): boolean {
  return pages.some((pg) => pg.lines.some((l) => TABLE_LINE_RE.test(l)));
}

function stageC(origPages: PageData[], revPages: PageData[]): DiffItem[] {
  const items: DiffItem[] = [];

  // page_count_change
  if (origPages.length !== revPages.length) {
    items.push({
      id: uuidv4(),
      source: "structural",
      page_original: origPages.length,
      page_revised: revPages.length,
      rect_original: null,
      rect_revised: null,
      change_type: "structural_signal",
      signal_type: "page_count_change",
      original_text: `${origPages.length} page${origPages.length !== 1 ? "s" : ""}`,
      revised_text: `${revPages.length} page${revPages.length !== 1 ? "s" : ""}`,
      severity: "high",
      severity_overridden: false,
      ai_explanation: null,
      ai_category: null,
      meta: { orig_pages: origPages.length, rev_pages: revPages.length },
    });
  }

  // Headings: added / removed / renamed
  const origHeadings = extractHeadings(origPages);
  const revHeadings = extractHeadings(revPages);

  const removedHeadings = [...origHeadings].filter((h) => !revHeadings.has(h));
  const addedHeadings = [...revHeadings].filter((h) => !origHeadings.has(h));

  for (const h of removedHeadings) {
    const origPage = origPages.find((p) => p.lines.some((l) => l.trim().slice(0, 100).toLowerCase() === h));
    const sev = computeSeverity("structural_signal", "heading_removed", h, null, {});
    items.push({
      id: uuidv4(),
      source: "structural",
      page_original: origPage?.pageNum ?? null,
      page_revised: null,
      rect_original: origPage ? findRectForText(h, origPage.items) : null,
      rect_revised: null,
      change_type: "structural_signal",
      signal_type: "heading_removed",
      original_text: h,
      revised_text: null,
      severity: sev,
      severity_overridden: false,
      ai_explanation: null,
      ai_category: null,
      meta: {},
    });
  }

  for (const h of addedHeadings) {
    const revPage = revPages.find((p) => p.lines.some((l) => l.trim().slice(0, 100).toLowerCase() === h));
    const sev = computeSeverity("structural_signal", "heading_added", null, h, {});
    items.push({
      id: uuidv4(),
      source: "structural",
      page_original: null,
      page_revised: revPage?.pageNum ?? null,
      rect_original: null,
      rect_revised: revPage ? findRectForText(h, revPage.items) : null,
      change_type: "structural_signal",
      signal_type: "heading_added",
      original_text: null,
      revised_text: h,
      severity: sev,
      severity_overridden: false,
      ai_explanation: null,
      ai_category: null,
      meta: {},
    });
  }

  // heading_renamed: removed + added with same first word (likely renamed)
  for (const removed of removedHeadings) {
    const firstWord = removed.split(/\s+/)[0];
    const candidate = addedHeadings.find((a) => a.startsWith(firstWord));
    if (candidate) {
      // Already emitted as heading_removed + heading_added — add a renamed signal too
      items.push({
        id: uuidv4(),
        source: "structural",
        page_original: origPages.find((p) => p.lines.some((l) => l.trim().slice(0, 100).toLowerCase() === removed))?.pageNum ?? null,
        page_revised: revPages.find((p) => p.lines.some((l) => l.trim().slice(0, 100).toLowerCase() === candidate))?.pageNum ?? null,
        rect_original: null,
        rect_revised: null,
        change_type: "structural_signal",
        signal_type: "heading_renamed",
        original_text: removed,
        revised_text: candidate,
        severity: "medium",
        severity_overridden: false,
        ai_explanation: null,
        ai_category: null,
        meta: {},
      });
    }
  }

  // signature_block_changed
  const origSig = extractSignatureLines(origPages).join(" | ");
  const revSig = extractSignatureLines(revPages).join(" | ");
  if (origSig !== revSig && (origSig || revSig)) {
    items.push({
      id: uuidv4(),
      source: "structural",
      page_original: origPages.length,
      page_revised: revPages.length,
      rect_original: null,
      rect_revised: null,
      change_type: "structural_signal",
      signal_type: "signature_block_changed",
      original_text: origSig.slice(0, 300) || null,
      revised_text: revSig.slice(0, 300) || null,
      severity: "high",
      severity_overridden: false,
      ai_explanation: null,
      ai_category: null,
      meta: {},
    });
  }

  // appendix_added / appendix_removed
  const origHasAppendix = hasAppendix(origPages);
  const revHasAppendix = hasAppendix(revPages);
  if (!origHasAppendix && revHasAppendix) {
    items.push({
      id: uuidv4(), source: "structural",
      page_original: null, page_revised: revPages.length,
      rect_original: null, rect_revised: null,
      change_type: "structural_signal", signal_type: "appendix_added",
      original_text: null, revised_text: "Appendix detected in revised document",
      severity: "medium", severity_overridden: false,
      ai_explanation: null, ai_category: null, meta: {},
    });
  } else if (origHasAppendix && !revHasAppendix) {
    items.push({
      id: uuidv4(), source: "structural",
      page_original: origPages.length, page_revised: null,
      rect_original: null, rect_revised: null,
      change_type: "structural_signal", signal_type: "appendix_removed",
      original_text: "Appendix present in original document", revised_text: null,
      severity: "medium", severity_overridden: false,
      ai_explanation: null, ai_category: null, meta: {},
    });
  }

  // version_history_changed
  const origHasVH = hasVersionHistory(origPages);
  const revHasVH = hasVersionHistory(revPages);
  if (origHasVH !== revHasVH) {
    items.push({
      id: uuidv4(), source: "structural",
      page_original: origPages.length, page_revised: revPages.length,
      rect_original: null, rect_revised: null,
      change_type: "structural_signal", signal_type: "version_history_changed",
      original_text: origHasVH ? "Version history present" : null,
      revised_text: revHasVH ? "Version history present" : null,
      severity: "medium", severity_overridden: false,
      ai_explanation: null, ai_category: null, meta: {},
    });
  }

  // table_added / table_removed
  const origHasTable = tablePresent(origPages);
  const revHasTable = tablePresent(revPages);
  if (!origHasTable && revHasTable) {
    items.push({
      id: uuidv4(), source: "structural",
      page_original: null, page_revised: null,
      rect_original: null, rect_revised: null,
      change_type: "structural_signal", signal_type: "table_added",
      original_text: null, revised_text: "Table-like content added",
      severity: "medium", severity_overridden: false,
      ai_explanation: null, ai_category: null, meta: {},
    });
  } else if (origHasTable && !revHasTable) {
    items.push({
      id: uuidv4(), source: "structural",
      page_original: null, page_revised: null,
      rect_original: null, rect_revised: null,
      change_type: "structural_signal", signal_type: "table_removed",
      original_text: "Table-like content present in original", revised_text: null,
      severity: "medium", severity_overridden: false,
      ai_explanation: null, ai_category: null, meta: {},
    });
  }

  // header_footer_changed
  const origHF = extractHeaderFooterLines(origPages).join("\n");
  const revHF = extractHeaderFooterLines(revPages).join("\n");
  if (origHF !== revHF && (origHF || revHF)) {
    items.push({
      id: uuidv4(), source: "structural",
      page_original: null, page_revised: null,
      rect_original: null, rect_revised: null,
      change_type: "structural_signal", signal_type: "header_footer_changed",
      original_text: origHF.slice(0, 200) || null,
      revised_text: revHF.slice(0, 200) || null,
      severity: "low", severity_overridden: false,
      ai_explanation: null, ai_category: null, meta: {},
    });
  }

  return items;
}

// ─── Deduplication ─────────────────────────────────────────────────────────────
// Remove visual_change items for a page if that page already has text diff items
// (text diffs are more specific and more useful).

function deduplicate(all: DiffItem[]): DiffItem[] {
  const pagesWithTextDiff = new Set<string>();
  for (const item of all) {
    if (item.source === "text" && item.page_original !== null) {
      pagesWithTextDiff.add(`${item.page_original}:${item.page_revised}`);
    }
  }
  return all.filter((item) => {
    if (item.change_type !== "visual_change") return true;
    const key = `${item.page_original}:${item.page_revised}`;
    return !pagesWithTextDiff.has(key);
  });
}

// ─── Main entry ────────────────────────────────────────────────────────────────

export async function runComparison(
  originalBuf: Buffer,
  revisedBuf: Buffer,
): Promise<DiffResult> {
  const [origPages, revPages] = await Promise.all([
    extractPages(originalBuf),
    extractPages(revisedBuf),
  ]);

  const aItems = stageA(origPages, revPages);
  const bItems = stageB(origPages, revPages);
  const cItems = stageC(origPages, revPages);

  const allItems = deduplicate([...aItems, ...bItems, ...cItems]);

  // Sort: high first, then medium, then low; within severity by page
  const sevOrder = { high: 0, medium: 1, low: 2 };
  allItems.sort((a, b) => {
    const so = sevOrder[a.severity] - sevOrder[b.severity];
    if (so !== 0) return so;
    const pa = a.page_original ?? a.page_revised ?? 0;
    const pb = b.page_original ?? b.page_revised ?? 0;
    return pa - pb;
  });

  const pagesWithDiffs = new Set<number>();
  for (const item of allItems) {
    if (item.page_original != null) pagesWithDiffs.add(item.page_original);
    if (item.page_revised != null) pagesWithDiffs.add(item.page_revised);
  }

  const stats = {
    total: allItems.length,
    high: allItems.filter((i) => i.severity === "high").length,
    medium: allItems.filter((i) => i.severity === "medium").length,
    low: allItems.filter((i) => i.severity === "low").length,
    pagesWithDiffs: pagesWithDiffs.size,
  };

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    stats,
    items: allItems,
  };
}
