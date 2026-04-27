// ─── Bounded document-parsing helpers ─────────────────────────────────────────
// These wrappers enforce hard page-count and extracted-text budgets on every
// attacker-controlled PDF or DOCX buffer before (and during) the expensive
// in-process parse, preventing parser-bomb documents from exhausting CPU/RAM.
//
// The limits mirror the protections already in place for the redact-pdf route
// and should be used anywhere untrusted files are handed to pdf-parse,
// pdf-lib, or mammoth.
// ──────────────────────────────────────────────────────────────────────────────

export const MAX_PARSE_PDF_PAGES = 500;
export const MAX_EXTRACTED_TEXT_BYTES = 10 * 1024 * 1024; // 10 MB of extracted text

/**
 * Maximum total uncompressed size of all ZIP entries in a DOCX file.
 *
 * DOCX files are ZIP archives.  A "zip-bomb" DOCX can have tiny compressed
 * XML entries that expand to hundreds of MB in memory.  We check this budget
 * by reading the ZIP Central Directory (a header-level operation — no entries
 * are decompressed) BEFORE handing the buffer to mammoth.
 *
 * 50 MB of uncompressed XML is generous for any real DOCX document and orders
 * of magnitude below what a deliberately crafted bomb would contain.
 */
export const MAX_DOCX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024; // 50 MB total uncompressed

// ─── ZIP Central Directory pre-expansion size check ──────────────────────────
// These constants and the function below implement a minimal ZIP reader whose
// only job is to sum the declared uncompressed sizes of all entries.  No ZIP
// entries are decompressed; this is purely a header-level operation.

const ZIP_EOCD_SIGNATURE = 0x06054b50; // PK\x05\x06
const ZIP_CD_SIGNATURE   = 0x02014b50; // PK\x01\x02
const ZIP_EOCD_MIN_SIZE  = 22;
const ZIP_CD_ENTRY_MIN   = 46;

/**
 * Reads the ZIP Central Directory from `buf` and returns the sum of declared
 * uncompressed sizes for all entries.  Throws if the buffer is not a valid ZIP
 * or if the Central Directory cannot be located.
 *
 * This is a read-only, zero-decompression operation: we only parse fixed-size
 * header fields and skip variable-length name / extra / comment blocks without
 * reading their contents.
 */
function getZipTotalUncompressedSize(buf: Buffer): number {
  // Search for the EOCD record from the end of the file.
  // The comment field means the EOCD may not be at buf.length - 22.
  const searchStart = Math.max(0, buf.length - ZIP_EOCD_MIN_SIZE - 0xffff);
  let eocdOffset = -1;
  for (let i = buf.length - ZIP_EOCD_MIN_SIZE; i >= searchStart; i--) {
    if (buf.readUInt32LE(i) === ZIP_EOCD_SIGNATURE) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error("Not a valid ZIP/DOCX file: EOCD record not found");
  }

  const totalEntries = buf.readUInt16LE(eocdOffset + 10); // total Central Directory entries
  const cdOffset     = buf.readUInt32LE(eocdOffset + 16); // offset of Central Directory

  if (cdOffset >= buf.length) {
    throw new Error("Not a valid ZIP/DOCX file: Central Directory offset out of range");
  }

  let pos = cdOffset;
  let totalUncompressed = 0;

  for (let i = 0; i < totalEntries; i++) {
    if (pos + ZIP_CD_ENTRY_MIN > buf.length) break;
    if (buf.readUInt32LE(pos) !== ZIP_CD_SIGNATURE) break;

    const uncompressedSize = buf.readUInt32LE(pos + 24);
    totalUncompressed += uncompressedSize;

    const filenameLen = buf.readUInt16LE(pos + 28);
    const extraLen    = buf.readUInt16LE(pos + 30);
    const commentLen  = buf.readUInt16LE(pos + 32);
    pos += ZIP_CD_ENTRY_MIN + filenameLen + extraLen + commentLen;
  }

  return totalUncompressed;
}

/**
 * Thrown when an uploaded document would require more parsing work than the
 * server is willing to perform.  Callers should map this to HTTP 400.
 */
export class ParseResourceLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseResourceLimitError";
  }
}

// ─── Local interfaces for untyped third-party modules ─────────────────────────
// pdf-parse ships without TypeScript declarations; we define the minimal surface
// we actually use so the helper can be fully typed without `any` casts.

interface PdfPageData {
  getTextContent(): Promise<{ items: Array<{ str: string }> }>;
}

interface PdfParseOptions {
  pagerender?: (pageData: PdfPageData) => Promise<string>;
}

interface PdfParseResult {
  text: string;
  numpages: number;
}

type PdfParseFn = (buf: Buffer, opts?: PdfParseOptions) => Promise<PdfParseResult>;

interface PdfParseModule {
  default?: PdfParseFn;
}

// mammoth.extractRawText only requires the fields we actually call.
interface MammothResult {
  value: string;
}

interface MammothModule {
  extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
  default?: {
    extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
  };
}

// ──────────────────────────────────────────────────────────────────────────────

/**
 * Parses a PDF buffer with hard limits on page count and extracted-text size.
 *
 * The `pagerender` hook is invoked once per page by pdfjs (via pdf-parse).
 * Throwing inside it causes the outer pdfParse promise to reject immediately,
 * aborting all remaining page work — no more data is decompressed or allocated
 * after the limit is hit.
 *
 * @param buffer     Raw PDF bytes from the upload / download.
 * @param maxPages   Reject after this many pages (default MAX_PARSE_PDF_PAGES).
 * @param maxTextBytes Reject when accumulated extracted-text bytes exceed this
 *                   value (default MAX_EXTRACTED_TEXT_BYTES).
 * @returns          `{ text, numpages }` on success.
 * @throws           ParseResourceLimitError when a limit is exceeded.
 * @throws           Any error thrown by pdf-parse / pdfjs for corrupt files.
 */
export async function parsePdfWithLimits(
  buffer: Buffer,
  {
    maxPages = MAX_PARSE_PDF_PAGES,
    maxTextBytes = MAX_EXTRACTED_TEXT_BYTES,
  }: { maxPages?: number; maxTextBytes?: number } = {},
): Promise<{ text: string; numpages: number }> {
  const raw = await import("pdf-parse/lib/pdf-parse.js") as unknown as PdfParseModule;
  const pdfParse: PdfParseFn = raw.default ?? (raw as unknown as PdfParseFn);

  let pageCounter = 0;
  let totalTextBytes = 0;
  const pageTexts: string[] = [];

  const result = await pdfParse(buffer, {
    pagerender: async (pageData: PdfPageData): Promise<string> => {
      pageCounter++;

      if (pageCounter > maxPages) {
        throw new ParseResourceLimitError(
          `PDF exceeds the maximum allowed page limit of ${maxPages} pages.`,
        );
      }

      let pageText = "";
      try {
        const textContent = await pageData.getTextContent();
        pageText = textContent.items
          .filter((item) => typeof item.str === "string")
          .map((item) => item.str)
          .join(" ");
      } catch {
        // Text extraction failed for this page — continue with empty text.
      }

      totalTextBytes += Buffer.byteLength(pageText, "utf-8");
      if (totalTextBytes > maxTextBytes) {
        throw new ParseResourceLimitError(
          `PDF extracted text exceeds the maximum allowed ${maxTextBytes / 1024 / 1024} MB.`,
        );
      }

      pageTexts.push(pageText);
      return pageText;
    },
  });

  // Prefer the text assembled by our pagerender (correct byte budget);
  // fall back to pdf-parse's own text field if pagerender was not called.
  return {
    text: pageTexts.length > 0 ? pageTexts.join("\n") : (result.text ?? ""),
    numpages: result.numpages ?? pageCounter,
  };
}

/**
 * Extracts raw text from a DOCX buffer via mammoth, enforcing both a
 * pre-expansion ZIP uncompressed-size budget and a post-extraction text cap.
 *
 * ## Why two limits?
 *
 * A DOCX file is a ZIP archive.  A "zip-bomb" DOCX can be tiny on disk (a few
 * KB) but expand to hundreds of MB of XML in memory.  The ZIP Central Directory
 * check (`maxUncompressedBytes`) fires BEFORE mammoth decompresses anything,
 * because we read only fixed-size header fields — zero bytes of entry data are
 * decompressed.  Only if the declared uncompressed total is within budget does
 * mammoth proceed.  The text cap (`maxTextBytes`) then catches any document
 * whose expanded text would still be unreasonably large.
 *
 * @param buffer               Raw DOCX bytes from the upload / download.
 * @param maxUncompressedBytes Reject before expansion if ZIP declares more
 *                             total uncompressed bytes than this
 *                             (default MAX_DOCX_UNCOMPRESSED_BYTES = 50 MB).
 * @param maxTextBytes         Reject after extraction if extracted text exceeds
 *                             this size in UTF-8 bytes
 *                             (default MAX_EXTRACTED_TEXT_BYTES = 10 MB).
 * @returns                    Extracted plain text string on success.
 * @throws                     ParseResourceLimitError when either limit is hit.
 * @throws                     Any error thrown by mammoth for corrupt files.
 */
export async function parseDocxWithLimits(
  buffer: Buffer,
  {
    maxUncompressedBytes = MAX_DOCX_UNCOMPRESSED_BYTES,
    maxTextBytes = MAX_EXTRACTED_TEXT_BYTES,
  }: { maxUncompressedBytes?: number; maxTextBytes?: number } = {},
): Promise<string> {
  // ── Step 1: Pre-expansion ZIP Central Directory size check ─────────────────
  // This is a header-only read — no ZIP entries are decompressed.
  // We check BEFORE calling mammoth so that a zip-bomb cannot consume CPU/RAM.
  try {
    const totalUncompressed = getZipTotalUncompressedSize(buffer);
    if (totalUncompressed > maxUncompressedBytes) {
      throw new ParseResourceLimitError(
        `DOCX file expands to approximately ${Math.round(totalUncompressed / 1024 / 1024)} MB ` +
        `uncompressed, which exceeds the maximum allowed ` +
        `${Math.round(maxUncompressedBytes / 1024 / 1024)} MB.`,
      );
    }
  } catch (err) {
    // Re-throw our own limit errors; for ZIP parse errors let mammoth try and
    // surface its own (more informative) format-error message.
    if (err instanceof ParseResourceLimitError) throw err;
    // Not a valid ZIP — fall through; mammoth will reject it if truly corrupt.
  }

  // ── Step 2: Expand and extract text ────────────────────────────────────────
  const raw = await import("mammoth") as unknown as MammothModule;
  const mammoth = raw.default ?? raw;
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value ?? "";

  // ── Step 3: Post-extraction text size cap ───────────────────────────────────
  if (Buffer.byteLength(text, "utf-8") > maxTextBytes) {
    throw new ParseResourceLimitError(
      `Document extracted text exceeds the maximum allowed ${maxTextBytes / 1024 / 1024} MB.`,
    );
  }

  return text;
}
