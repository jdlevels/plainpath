import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireEntitlement } from "../../lib/requireEntitlement";
import { demoDocuments } from "../../lib/demoData.js";
import { trustCheckDemoDocuments } from "../../lib/trustCheckDemoData.js";
import { parsePdfWithLimits, parseDocxWithLimits, ParseResourceLimitError } from "../../lib/parseWithLimits";
import type { DocumentAnalysis, DocumentSection, KeyTerm, ActionPack, TrustCheckAnalysis, TrustCheckVerdict, TrustCheckContactDetail, TrustCheckDeadlineItem, TrustCheckScamIndicator, TrustCheckScores, TrustCheckMetadataFinding } from "../../lib/types.js";
import type { PDFRef, PDFRawStream, PDFDict, PDFArray } from "pdf-lib";

function extractSections(text: string): DocumentSection[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawBlocks = normalized.split(/\n{2,}/);
  const sections: DocumentSection[] = [];
  let idx = 0;

  for (const block of rawBlocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const firstLine = lines[0];
    const isHeading =
      lines.length > 1 &&
      firstLine.length < 100 &&
      (
        (firstLine === firstLine.toUpperCase() && /[A-Z]/.test(firstLine) && firstLine.length > 3) ||
        /^(\d+[\.\)]\s*|\d+\.\d+\s*|[A-Z]\.\s*|section\s+\d+|article\s+\d+|part\s+\d+)/i.test(firstLine) ||
        (firstLine.endsWith(":") && lines.length > 1 && firstLine.length < 80)
      );

    let title: string | undefined;
    let content: string;

    if (isHeading) {
      title = firstLine;
      content = lines.slice(1).join(" ").trim();
    } else {
      content = lines.join(" ").trim();
    }

    if (content.length < 40) continue;

    if (content.length > 700) {
      const sentences = content.match(/[^.!?]+[.!?]+(\s+|$)/g) || [content];
      let sub = "";
      let isFirst = true;
      for (const s of sentences) {
        if (sub.length + s.length > 650 && sub.length > 100) {
          sections.push({ id: `sec-${++idx}`, title: isFirst ? title : undefined, content: sub.trim() });
          sub = s;
          isFirst = false;
        } else {
          sub += s;
        }
      }
      if (sub.trim().length >= 40) {
        sections.push({ id: `sec-${++idx}`, content: sub.trim() });
      }
    } else {
      sections.push({ id: `sec-${++idx}`, title, content });
    }

    if (sections.length >= 40) break;
  }

  return sections;
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const SYSTEM_PROMPT = `You are PlainPath, a document analysis engine that transforms confusing paperwork into structured, actionable plans.

Your job is to read the given document text and extract a comprehensive, practical analysis that helps ordinary people understand exactly what they need to do.

Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON.

The JSON must have this exact structure:
{
  "title": "string - descriptive title for this document",
  "summary": "string - 2-4 sentence plain-English summary of what this document requires",
  "documentType": "string - type of document (e.g., 'Government Permit Application', 'Insurance Form', 'Legal Agreement')",
  "overallConfidence": "high|medium|low",
  "actionSteps": [
    {
      "id": "as-1",
      "title": "string - short action title (imperative verb phrase)",
      "description": "string - 1-3 sentence clear description of what to do",
      "priority": "high|medium|low",
      "category": "string - category label (e.g., 'Documentation', 'Applications', 'Fees')",
      "completed": false,
      "sourceEvidence": "string - direct quote or paraphrase from document",
      "confidence": "high|medium|low"
    }
  ],
  "requiredDocuments": [
    {
      "id": "rd-1",
      "name": "string - document name",
      "description": "string - what this document is and where to get it",
      "required": true,
      "obtained": false,
      "sourceEvidence": "string - direct quote or paraphrase from document",
      "confidence": "high|medium|low"
    }
  ],
  "deadlines": [
    {
      "id": "dl-1",
      "title": "string - deadline name",
      "date": "string - date or timeframe (e.g., '30 days before event', 'March 15')",
      "description": "string - what must be done by this deadline",
      "isHard": true,
      "sourceEvidence": "string",
      "confidence": "high|medium|low"
    }
  ],
  "followUpQuestions": [
    {
      "id": "fq-1",
      "question": "string - question the user needs to answer",
      "context": "string - why this question matters for their situation",
      "answered": false
    }
  ],
  "risks": [
    {
      "id": "risk-1",
      "title": "string - risk name",
      "description": "string - what could go wrong and why it matters",
      "severity": "high|medium|low",
      "sourceEvidence": "string"
    }
  ],
  "keyTerms": [
    {
      "id": "kt-1",
      "term": "string - name of the clause, provision, or term (e.g., 'Non-Refundable Fee', 'Auto-Renewal Clause', 'Mandatory Arbitration')",
      "severity": "high|medium|low",
      "category": "string - category label (e.g., 'Fees & Penalties', 'Deadlines', 'Liability', 'Ownership / IP', 'Termination', 'Compliance', 'Repayment', 'Appeal Rights', 'Submission Rules')",
      "explanation": "string - 1-2 sentences: what this term or clause means in plain English",
      "whyItMatters": "string - 1-2 sentences: why this clause is important to the reader and what depends on it",
      "watchOut": "string - 1-2 sentences: specific risk, hidden obligation, or consequence the reader might miss",
      "questionToAsk": "string - optional: a specific question the reader should ask before agreeing or signing (omit field entirely if not applicable)"
    }
  ],
  "actionPack": {
    "questionsToAsk": [
      {
        "id": "q-1",
        "question": "string - a smart, specific clarification question the user should ask about this document",
        "context": "string - 1 sentence: why this question matters for their situation"
      }
    ],
    "whatToGather": [
      {
        "id": "g-1",
        "item": "string - name of the record, form, ID, or document to gather",
        "description": "string - 1 sentence: what this is and why it's needed",
        "category": "string - optional: category like 'Financial Records', 'Identification', 'Legal Documents', 'Medical Records', 'Correspondence'"
      }
    ],
    "whatToSay": [
      {
        "id": "s-1",
        "label": "string - the communication situation (e.g., 'Asking for more time', 'Requesting clarification', 'Responding to a notice')",
        "draft": "string - a neutral, practical draft message the user can adapt — keep it professional, factual, and jargon-free. Never frame as legal or professional advice."
      }
    ],
    "beforeYouActChecklist": [
      {
        "id": "ba-1",
        "text": "string - one important thing to confirm before signing or submitting"
      }
    ]
  },
  "plainEnglish": {
    "whatItIs": "string - 2-4 sentences: what kind of document this is and what it is used for, written for someone who has never seen it before",
    "whatItSays": "string - 3-5 sentences: the main points the document communicates, avoiding jargon",
    "whatItAsks": "string - 2-4 sentences: what the document specifically asks the reader to do, submit, sign, or pay",
    "obligations": "string - 2-4 sentences: what the reader is agreeing to, is responsible for, or may become liable for",
    "payAttentionTo": "string - 2-4 sentences: the most important clauses, dates, or conditions the reader must not overlook",
    "nextSteps": "string - 2-4 sentences: the first concrete things the reader should do after reading this document"
  }
}

Guidelines:
- Extract 4-10 action steps ordered by priority
- List all documents required to complete the process
- Identify ALL deadlines, including soft ones
- Flag 2-5 questions the applicant needs to answer based on their specific situation
- Identify 2-4 risks that could cause delays or rejections
- Use "high" confidence when the document explicitly states something
- Use "medium" confidence when you're inferring from context
- Use "low" confidence when uncertain or the document is ambiguous
- Mark isHard=true for deadlines with serious consequences (rejection, legal issues)
- Priority: high = must do first or has dependencies, medium = important but flexible, low = optional
- Extract 4-8 key terms: clauses, provisions, or terms with significant impact on the reader
- keyTerms severity: high = significant financial/legal/practical consequence; medium = important but manageable; low = worth noting
- Focus keyTerms on: fees/penalties, non-refundable terms, termination/cancellation, auto-renewal, liability limits, repayment obligations, ownership/IP, indemnity, arbitration, exclusivity, appeal deadlines, submission requirements, disqualifiers, reporting obligations
- Tailor keyTerms to document type: contracts→ownership/termination/renewal; tax/gov→penalties/deadlines/agency actions; healthcare→exclusions/prior auth/appeal windows; grants/applications→eligibility/disqualifiers/reporting; bills/notices→shutoff/legal deadlines/collections
- actionPack.questionsToAsk: 4-5 smart clarification questions tailored to the document — specific, not generic
- actionPack.whatToGather: 4-6 records, forms, IDs, or documents the user should have ready before responding or proceeding
- actionPack.whatToSay: 2-3 neutral, practical draft messages for common communication scenarios (asking for time, requesting clarification, responding to a notice). NEVER frame as legal or professional advice — use phrasing like "You may want to ask..." and "You might consider saying..."
- actionPack.beforeYouActChecklist: 4-6 concrete things to confirm before signing or submitting
- Tailor actionPack to document type: contracts→negotiation questions, ownership/renewal concerns; tax/gov→deadline clarification, missing forms, agency response; healthcare→appeal questions, coverage clarification, missing records; bills/notices→payment proof, deadline response, collections; grants/applications→eligibility, attachments, submission completeness`;

async function runAnalysis(text: string, title?: string, documentTypeHint?: string, rawText?: string): Promise<DocumentAnalysis> {
  const hintLine = documentTypeHint ? `\nUser-specified document category: ${documentTypeHint}` : "";
  const userMessage = title
    ? `Document Title: ${title}${hintLine}\n\n---\n\n${text}`
    : `${hintLine ? hintLine + "\n\n" : ""}${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 10240,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analyze the following document and extract a structured action plan:\n\n${userMessage}` },
    ],
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) throw new Error("No response from analysis engine");

  let parsed: Partial<DocumentAnalysis>;
  try {
    const cleaned = rawContent.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Analysis engine returned an unparseable response");
  }

  return {
    id: uuidv4(),
    title: parsed.title || title || "Analyzed Document",
    summary: parsed.summary || "",
    documentType: parsed.documentType || "Document",
    actionSteps: (parsed.actionSteps || []).map((step, i) => ({
      id: step.id || `as-${i + 1}`,
      title: step.title || "",
      description: step.description || "",
      priority: step.priority || "medium",
      category: step.category || "General",
      completed: false,
      sourceEvidence: step.sourceEvidence,
      confidence: step.confidence || "medium",
    })),
    requiredDocuments: (parsed.requiredDocuments || []).map((doc, i) => ({
      id: doc.id || `rd-${i + 1}`,
      name: doc.name || "",
      description: doc.description || "",
      required: doc.required !== false,
      obtained: false,
      sourceEvidence: doc.sourceEvidence,
      confidence: doc.confidence || "medium",
    })),
    deadlines: (parsed.deadlines || []).map((dl, i) => ({
      id: dl.id || `dl-${i + 1}`,
      title: dl.title || "",
      date: dl.date || "",
      description: dl.description || "",
      isHard: dl.isHard !== false,
      sourceEvidence: dl.sourceEvidence,
      confidence: dl.confidence || "medium",
    })),
    followUpQuestions: (parsed.followUpQuestions || []).map((fq, i) => ({
      id: fq.id || `fq-${i + 1}`,
      question: fq.question || "",
      context: fq.context || "",
      answered: false,
    })),
    risks: (parsed.risks || []).map((risk, i) => ({
      id: risk.id || `risk-${i + 1}`,
      title: risk.title || "",
      description: risk.description || "",
      severity: risk.severity || "medium",
      sourceEvidence: risk.sourceEvidence,
    })),
    keyTerms: (parsed.keyTerms || []).map((kt, i) => ({
      id: (kt as any).id || `kt-${i + 1}`,
      term: (kt as any).term || "",
      severity: (kt as any).severity || "medium",
      category: (kt as any).category || "General",
      explanation: (kt as any).explanation || "",
      whyItMatters: (kt as any).whyItMatters || "",
      watchOut: (kt as any).watchOut || "",
      questionToAsk: (kt as any).questionToAsk,
    } as KeyTerm)),
    actionPack: parsed.actionPack && typeof parsed.actionPack === "object" ? ({
      questionsToAsk: ((parsed.actionPack as any).questionsToAsk || []).map((q: any, i: number) => ({
        id: q.id || `q-${i + 1}`,
        question: q.question || "",
        context: q.context || "",
      })),
      whatToGather: ((parsed.actionPack as any).whatToGather || []).map((g: any, i: number) => ({
        id: g.id || `g-${i + 1}`,
        item: g.item || "",
        description: g.description || "",
        category: g.category,
      })),
      whatToSay: ((parsed.actionPack as any).whatToSay || []).map((s: any, i: number) => ({
        id: s.id || `s-${i + 1}`,
        label: s.label || "",
        draft: s.draft || "",
      })),
      beforeYouActChecklist: ((parsed.actionPack as any).beforeYouActChecklist || []).map((c: any, i: number) => ({
        id: c.id || `ba-${i + 1}`,
        text: c.text || "",
      })),
    } as ActionPack) : undefined,
    overallConfidence: parsed.overallConfidence || "medium",
    processedAt: new Date().toISOString(),
    sections: extractSections(rawText ?? text),
    plainEnglish: parsed.plainEnglish && typeof parsed.plainEnglish === "object" ? {
      whatItIs: (parsed.plainEnglish as any).whatItIs || "",
      whatItSays: (parsed.plainEnglish as any).whatItSays || "",
      whatItAsks: (parsed.plainEnglish as any).whatItAsks || "",
      obligations: (parsed.plainEnglish as any).obligations || "",
      payAttentionTo: (parsed.plainEnglish as any).payAttentionTo || "",
      nextSteps: (parsed.plainEnglish as any).nextSteps || "",
    } : undefined,
  };
}

router.post("/analyze", requireEntitlement("analyze"), async (req, res) => {
  const { text, title, documentTypeHint } = req.body;

  if (!text || typeof text !== "string" || text.trim().length < 30) {
    return res.status(400).json({
      error: "too_short",
      message: "Please paste more of the document — PlainPath needs enough text to identify the requirements, deadlines, and obligations.",
    });
  }

  const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
  if (wordCount < 15) {
    return res.status(400).json({
      error: "too_short",
      message: "Please paste more of the document so PlainPath can identify the requirements, deadlines, and obligations. A sentence or two isn't enough — paste a few paragraphs.",
    });
  }

  if (text.length > 60000) {
    return res.status(400).json({
      error: "text_too_long",
      message: "Document text is too long. Please limit to 60,000 characters.",
    });
  }

  try {
    const analysis = await runAnalysis(text, title, typeof documentTypeHint === "string" ? documentTypeHint : undefined);
    return res.json({ analysis });
  } catch (error) {
    const isTimeout = error instanceof Error && (
      error.name === "AbortError" ||
      error.message.toLowerCase().includes("timeout") ||
      error.message.toLowerCase().includes("timed out")
    );
    if (isTimeout) {
      return res.status(504).json({
        error: "analysis_timeout",
        message: "Analysis is taking too long. Please try again — shorter documents process faster.",
      });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    const isServiceError = message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("overloaded");
    if (isServiceError) {
      return res.status(503).json({
        error: "service_unavailable",
        message: "The analysis service is temporarily busy. Please wait a moment and try again.",
      });
    }
    return res.status(500).json({
      error: "analysis_failed",
      message: "Analysis failed. Please try again. If the problem continues, try pasting the document text instead of uploading.",
    });
  }
});

router.post("/upload", requireEntitlement("analyze"), upload.single("file"), async (req, res, next) => {
  // Top-level safety net: catches anything that escapes inner try/catch blocks
  // so the global handler never fires for upload errors.
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "no_file", message: "No file was uploaded." });
    }

    const mime = file.mimetype ?? "";
    const originalName = (file.originalname ?? "").toLowerCase();
    let extractedText = "";
    const detectedTitle = file.originalname.replace(/\.[^.]+$/, "");

    // ── Text extraction ─────────────────────────────────────────────────────
    if (mime === "application/pdf" || originalName.endsWith(".pdf")) {
      let pdfParseText: string | null = null;
      let parseError: string | null = null;

      try {
        const pdfResult = await parsePdfWithLimits(file.buffer);
        pdfParseText = pdfResult.text ?? null;
      } catch (err) {
        if (err instanceof ParseResourceLimitError) {
          return res.status(400).json({ error: "document_too_large", message: err.message });
        }
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[upload] pdf-parse threw:", errMsg, "| file:", file.originalname, "| size:", file.size);
        parseError = errMsg;
      }

      if (parseError !== null) {
        // Parser threw — likely corrupt, encrypted, or unsupported PDF structure
        return res.status(422).json({
          error: "corrupt_pdf",
          message: "This PDF could not be read. It may be corrupted or password-protected. Please try a different file, or copy and paste the text instead.",
        });
      }

      if (!pdfParseText || !pdfParseText.trim()) {
        // Parser succeeded but returned no text — scanned / image-only PDF
        console.error("[upload] pdf-parse returned empty text | file:", file.originalname, "| size:", file.size);
        return res.status(422).json({
          error: "scanned_pdf",
          message: "This PDF appears to contain only images (scanned document). PlainPath cannot read image-based PDFs — please copy and paste the text instead.",
        });
      }

      extractedText = pdfParseText;

    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      originalName.endsWith(".docx")
    ) {
      try {
        extractedText = await parseDocxWithLimits(file.buffer);
      } catch (err) {
        if (err instanceof ParseResourceLimitError) {
          return res.status(400).json({ error: "document_too_large", message: err.message });
        }
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[upload] mammoth threw:", errMsg, "| file:", file.originalname);
        return res.status(422).json({
          error: "unreadable_docx",
          message: "Could not read this Word document. It may be corrupted. Please try re-saving it as a .docx or paste the text instead.",
        });
      }
      if (!extractedText.trim()) {
        return res.status(422).json({
          error: "empty_docx",
          message: "This Word document appears to be empty or contains no readable text. Please paste the text instead.",
        });
      }

    } else if (mime === "text/plain" || originalName.endsWith(".txt")) {
      extractedText = file.buffer.toString("utf-8");
      if (!extractedText.trim()) {
        return res.status(422).json({
          error: "empty_txt",
          message: "This text file appears to be empty. Please check the file and try again.",
        });
      }

    } else {
      return res.status(400).json({
        error: "unsupported_type",
        message: "Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file.",
      });
    }

    // ── Analysis ─────────────────────────────────────────────────────────────
    const rawTextForSections = extractedText;
    if (extractedText.length > 60000) {
      extractedText = extractedText.slice(0, 60000);
    }

    console.debug("[upload] extracted", extractedText.length, "chars from", file.originalname, "— starting analysis");

    const documentTypeHint = typeof req.body?.documentTypeHint === "string" ? req.body.documentTypeHint : undefined;

    try {
      const analysis = await runAnalysis(extractedText, detectedTitle, documentTypeHint, rawTextForSections);
      return res.json({ analysis });
    } catch (analysisError) {
      const msg = analysisError instanceof Error ? analysisError.message : String(analysisError);
      console.error("[upload] runAnalysis threw:", msg, "| file:", file.originalname);

      const isTimeout = analysisError instanceof Error && (
        analysisError.name === "AbortError" ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("timed out")
      );
      if (isTimeout) {
        return res.status(504).json({
          error: "analysis_timeout",
          message: "Analysis is taking too long. Please try again — shorter documents process faster.",
        });
      }
      const isServiceError = msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("overloaded");
      if (isServiceError) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "The analysis service is temporarily busy. Please wait a moment and try again.",
        });
      }
      return res.status(500).json({
        error: "analysis_failed",
        message: "Analysis failed. Please try again. If the problem continues, try pasting the document text instead.",
      });
    }

  } catch (outerError) {
    // Safety net for anything that escaped all inner try/catch blocks
    const msg = outerError instanceof Error ? outerError.message : String(outerError);
    console.error("[upload] unhandled error escaped route:", msg);
    return res.status(500).json({
      error: "upload_failed",
      message: "Upload failed. Please try again. If the problem continues, try pasting the document text instead.",
    });
  }
});

// ── Scan images (multi-page camera capture) ──────────────────────────────────
router.post("/scan-images", requireEntitlement("analyze"), async (req, res) => {
  const { images, documentTypeHint } = req.body;

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ message: "No images provided. Please capture at least one page." });
  }
  if (images.length > 10) {
    return res.status(400).json({ message: "Maximum 10 pages allowed per scan session." });
  }

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (typeof img !== "string" || !img.startsWith("data:image/")) {
      return res.status(400).json({ message: `Page ${i + 1} has an invalid image format.` });
    }
    if (img.length > 12_000_000) {
      return res.status(413).json({ message: `Page ${i + 1} image is too large. Please try a lower-resolution photo.` });
    }
  }

  console.debug(`[scan-images] Extracting text from ${images.length} page(s)`);

  try {
    const extractedTexts: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      console.debug(`[scan-images] Processing page ${i + 1}/${images.length}`);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a document scanner assistant. Extract ALL text from this image exactly as it appears, preserving structure and line breaks. Include every word, number, and symbol visible — even if the image is slightly tilted or imperfect. Do not summarize, interpret, or skip any content. Output only the raw extracted text, nothing else.`,
              },
              {
                type: "image_url",
                image_url: { url: imageData, detail: "high" },
              },
            ],
          },
        ],
        max_completion_tokens: 4000,
      });

      const pageText = response.choices[0]?.message?.content?.trim() ?? "";
      if (pageText) {
        extractedTexts.push(images.length > 1 ? `--- Page ${i + 1} ---\n${pageText}` : pageText);
      }
    }

    if (extractedTexts.length === 0) {
      return res.status(422).json({
        message: "Could not extract readable text from the photo(s). Please retake with a clearer, well-lit photo taken straight-on.",
      });
    }

    let combinedText = extractedTexts.join("\n\n");
    if (combinedText.length > 60000) combinedText = combinedText.slice(0, 60000);

    console.debug(`[scan-images] Extracted ${combinedText.length} chars — running analysis`);

    const hint = typeof documentTypeHint === "string" ? documentTypeHint : undefined;
    const analysis = await runAnalysis(combinedText, undefined, hint);
    return res.json({ analysis });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[scan-images] error:", msg);

    const isTimeout = err instanceof Error && (
      err.name === "AbortError" ||
      msg.toLowerCase().includes("timeout") ||
      msg.toLowerCase().includes("timed out")
    );
    if (isTimeout) {
      return res.status(504).json({
        error: "analysis_timeout",
        message: "Analysis is taking too long. Please try with fewer pages.",
      });
    }
    const isBusy = msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("overloaded");
    if (isBusy) {
      return res.status(503).json({
        error: "service_unavailable",
        message: "The analysis service is temporarily busy. Please wait a moment and try again.",
      });
    }
    return res.status(500).json({
      error: "scan_failed",
      message: "Scan analysis failed. Please try again with a clearer, well-lit photo.",
    });
  }
});

// ── Scan images → Trust Check ────────────────────────────────────────────────
router.post("/scan-images-trust", requireEntitlement("trust-check"), async (req, res) => {
  const { images } = req.body;

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ message: "No images provided. Please capture at least one page." });
  }
  if (images.length > 10) {
    return res.status(400).json({ message: "Maximum 10 pages allowed per scan session." });
  }
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (typeof img !== "string" || !img.startsWith("data:image/")) {
      return res.status(400).json({ message: `Page ${i + 1} has an invalid image format.` });
    }
    if (img.length > 12_000_000) {
      return res.status(413).json({ message: `Page ${i + 1} image is too large. Please try a lower-resolution photo.` });
    }
  }

  console.debug(`[scan-images-trust] Extracting text from ${images.length} page(s)`);

  try {
    const extractedTexts: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `Extract ALL text from this image exactly as it appears. Include every word, number, and symbol. Output only the raw extracted text, nothing else.` },
            { type: "image_url", image_url: { url: images[i], detail: "high" } },
          ],
        }],
        max_completion_tokens: 4000,
      });
      const pageText = response.choices[0]?.message?.content?.trim() ?? "";
      if (pageText) extractedTexts.push(images.length > 1 ? `--- Page ${i + 1} ---\n${pageText}` : pageText);
    }

    if (extractedTexts.length === 0) {
      return res.status(422).json({ message: "Could not extract readable text from the photo(s). Please retake with a clearer, well-lit photo." });
    }

    let text = extractedTexts.join("\n\n");
    if (text.length > 60000) text = text.slice(0, 60000);

    console.debug(`[scan-images-trust] Extracted ${text.length} chars — running trust check`);

    const lower = text.toLowerCase();
    const ruleData = extractRuleData(text);
    const riskScore = calculateRiskScore(ruleData, lower, text);
    const verdict = scoreToVerdict(riskScore);
    const analysis = await runTrustCheckAnalysis(text, ruleData, riskScore, verdict, undefined);
    return res.json({ analysis });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[scan-images-trust] error:", msg);
    const isTimeout = err instanceof Error && (err.name === "AbortError" || msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("timed out"));
    if (isTimeout) return res.status(504).json({ error: "analysis_timeout", message: "Analysis is taking too long. Please try again with fewer pages." });
    const isBusy = msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("overloaded");
    if (isBusy) return res.status(503).json({ error: "service_unavailable", message: "The analysis service is temporarily busy. Please wait a moment and try again." });
    return res.status(500).json({ error: "scan_failed", message: "Scan trust check failed. Please try again with a clearer photo." });
  }
});

// ── Document Trust Check ──────────────────────────────────────────────────────

interface ExtractedRuleData {
  phones: string[];
  emails: string[];
  urls: string[];
  dates: string[];
  amounts: string[];
  urgencyPhrases: string[];
  threatPhrases: string[];
  paymentRedFlags: string[];
  infoRequests: string[];
  contractRiskTerms: string[];
}

function extractRuleData(text: string): ExtractedRuleData {
  const lower = text.toLowerCase();

  const phoneRegex = /\b(\+1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}\b/g;
  const intlPhoneRegex = /\+(?!1\b)\d{1,3}[\s.\-]\d{3,5}[\s.\-]\d{4,8}\b/g;
  const phones = [...new Set([...(text.match(phoneRegex) || []), ...(text.match(intlPhoneRegex) || [])].map((p) => p.trim()))];

  const emailRegex = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;
  const emails = [...new Set((text.match(emailRegex) || []).map((e) => e.trim()))];

  const urlRegex = /https?:\/\/[^\s\)\]\>"\']+/g;
  const urls = [...new Set((text.match(urlRegex) || []).map((u) => u.trim()))];

  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},?\s+\d{4}|\d{1,2} \w+ \d{4})\b/g;
  const dates = [...new Set((text.match(dateRegex) || []).map((d) => d.trim()))].slice(0, 10);

  const amountRegex = /\$[\d,]+(\.\d{2})?/g;
  const amounts = [...new Set((text.match(amountRegex) || []).map((a) => a.trim()))];

  const urgencyTerms = [
    "immediately", "act now", "within 24 hours", "within 48 hours", "within 72 hours",
    "today only", "time sensitive", "time-sensitive", "do not ignore", "must respond",
    "respond immediately", "urgent", "last chance", "final opportunity",
    "do not delay", "prompt attention", "without delay",
    // Expanded — additional pressure phrases common in advance-fee, prize, and account-threat scams
    "final demand", "deadline today", "expires today", "respond within",
    "offer expires", "limited time offer", "respond by end of day",
    "same day", "same-day", "before midnight", "by close of business",
    "action required immediately", "must act", "failure to act",
  ];
  const urgencyPhrases = urgencyTerms.filter((t) => lower.includes(t));

  const threatTerms = [
    "arrest", "warrant", "prosecution", "criminal charges", "law enforcement",
    "legal action", "lawsuit", "sue you", "take you to court",
    "collections", "collection agency", "debt collector",
    "repossession", "foreclose", "foreclosure", "lien",
    "eviction", "unlawful detainer", "asset seizure", "property seizure",
    "shutoff", "shut off", "service interruption", "disconnect", "suspension",
    "final notice", "final warning", "last notice", "failure to respond",
    "social security administration", "internal revenue service",
    "attorney general", "sheriff", "marshal", "federal agent",
    "contempt", "judgment", "garnish", "garnishment",
    "remote access", "remotely access", "anydesk", "teamviewer",
    // Expanded — immigration/deportation scams, account-closure threats, tech-support variants
    "deportation", "deportation order", "immigration violation", "visa revocation",
    "visa cancellation", "ice agent", "ice officer", "immigration enforcement",
    "account will be permanently", "account will be closed", "account closure",
    "permanently suspended", "permanently banned", "access will be revoked",
    "bench warrant", "federal charges", "criminal referral",
    "interpol notice", "interpol warrant",
  ];
  const threatPhrases = threatTerms.filter((t) => lower.includes(t));

  const paymentRedFlagTerms = [
    "gift card", "itunes card", "google play card", "steam card", "amazon gift card",
    "wire transfer", "western union", "moneygram",
    "cryptocurrency", "bitcoin", "ethereum", "crypto", "usdt",
    "zelle", "cash app", "cashapp", "venmo",
    "prepaid card", "prepaid debit", "money order",
    "payment link", "pay here", "click to pay", "pay online now",
    // Account-takeover / fund-isolation signals (Tuning Round 3):
    "holding account", "safe account", "protected account",
    // Tuning Round 6: added "holding status" — PayPal/bank phishing often places accounts in
    // "holding status" rather than directing to a "holding account"; semantically identical.
    "holding status", "funds on hold", "account on hold", "account placed on hold",
    // Tuning Round 5 — P2: Cryptocurrency / digital asset payments as a standalone scam signal.
    "digital asset", "digital asset transfer", "digital wallet", "wallet transfer", "digital currency",
    // Expanded — advance fee / processing fee / fake check signals
    "processing fee", "release fee", "clearance fee", "administrative fee to release",
    "customs fee", "customs clearance", "insurance fee to release",
    "reload pack", "reload card", "scratch card",
    // Fake check / overpayment refund pattern — send back the "excess"
    "send back the difference", "return the difference", "refund the overpayment",
    "deposit and return", "overpayment refund",
  ];
  const paymentRedFlags = paymentRedFlagTerms.filter((t) => lower.includes(t));

  const infoRequestTerms = [
    "social security number", "social security no", "ssn",
    "bank account number", "routing number", "account number",
    "credit card number", "debit card", "card number", "cvv",
    "date of birth", "mother's maiden name", "password", "pin number",
    "drivers license", "driver's license",
    // Expanded — passport, Medicare, insurance ID, and online credentials
    "passport number", "passport copy", "medicare number", "medicaid number",
    "insurance id", "insurance card number", "national id", "national identification",
    "online banking password", "banking credentials", "login credentials",
    "security question", "one-time code", "verification code", "otp",
  ];
  const infoRequests = infoRequestTerms.filter((t) => lower.includes(t));

  const contractRiskPatterns: Array<[string, string]> = [
    // ── Financing / loan-specific terms ─────────────────────────────────────
    ["default rate", "Default rate escalation"],
    ["default apr", "Default APR escalation"],
    ["penalty apr", "Penalty APR clause"],
    ["penalty rate", "Penalty rate clause"],
    ["repossession", "Repossession clause"],
    ["mandatory arbitration", "Mandatory arbitration"],
    ["binding arbitration", "Mandatory arbitration"],
    ["class action waiver", "Class-action waiver"],
    ["class action", "Class-action waiver"],
    ["deficiency balance", "Deficiency balance exposure"],
    ["deficiency judgment", "Deficiency balance exposure"],
    ["starter interrupt", "GPS / starter-interrupt device"],
    ["payment assurance device", "GPS / starter-interrupt device"],
    ["force-placed insurance", "Force-placed insurance"],
    ["lender-placed insurance", "Force-placed insurance"],
    ["balloon payment", "Balloon payment risk"],
    ["blanket lien", "Blanket lien on collateral"],
    ["acceleration clause", "Acceleration clause"],
    ["accelerate the", "Acceleration clause"],
    ["immediately due and payable", "Acceleration clause"],
    ["all sums due", "Acceleration clause"],
    ["wage garnishment", "Wage garnishment risk"],
    ["garnish your wages", "Wage garnishment risk"],
    ["negative amortization", "Negative amortization risk"],
    ["interest-only", "Interest-only payment period"],
    ["yield spread premium", "Yield spread premium"],
    // ── Non-financing consumer-harm terms (Tuning Round 1) ──────────────────
    // Cancellation and early-exit penalties
    ["early termination fee", "Early termination fee"],
    ["termination fee", "Early termination fee"],
    ["cancellation fee", "Cancellation fee"],
    // Auto-renewal and continuous billing traps
    ["auto-renewal", "Auto-renewal clause"],
    ["automatically renews", "Auto-renewal clause"],
    ["automatically renewed", "Auto-renewal clause"],
    ["automatically renew", "Auto-renewal clause"],
    ["automatic renewal", "Auto-renewal clause"],
    ["until cancelled", "Continuous auto-renewal"],
    ["until you cancel", "Continuous auto-renewal"],
    // High-interest accrual outside of traditional loan contexts
    ["accrues interest at", "Interest accrual clause"],
    ["apr compounded", "Compounded APR interest accrual"],
    ["compounded monthly", "Compounded interest accrual"],
    ["compounded daily", "Compounded interest accrual"],
    // Credit bureau reporting threats
    ["reporting to equifax", "Credit bureau reporting threat"],
    ["reporting to transunion", "Credit bureau reporting threat"],
    ["reporting to experian", "Credit bureau reporting threat"],
    ["report to equifax", "Credit bureau reporting threat"],
    ["report to transunion", "Credit bureau reporting threat"],
    ["report to experian", "Credit bureau reporting threat"],
    ["the three major credit", "Credit bureau reporting threat"],
    ["three credit bureaus", "Credit bureau reporting threat"],
    ["credit reporting agencies", "Credit bureau reporting threat"],
    ["credit reporting agency", "Credit bureau reporting threat"],
    ["report non-payment to credit", "Credit bureau reporting threat"],
    ["report to credit reporting", "Credit bureau reporting threat"],
    // Collections referral
    ["collections partner", "Collections referral clause"],
    ["collection partner", "Collections referral clause"],
    ["debt recovery", "Collections referral clause"],
    ["referral of this account", "Collections referral clause"],
    // One-sided or punitive terms
    ["liquidated damages", "Liquidated damages clause"],
    ["non-refundable", "Non-refundable clause"],
    ["unilateral right to terminate", "Unilateral termination right"],
    ["reserves the right to terminate", "Unilateral termination right"],
    ["sole and absolute discretion", "Unilateral authority clause"],
    // ── Non-financing consumer-harm terms (Tuning Round 2) ──────────────────
    // Class-action waiver — hyphenated variant (Tuning Round 2)
    ["class-action", "Class-action waiver"],
    // Service suspension without notice — unilateral provider right
    ["may suspend service", "Service suspension without notice"],
    ["suspend service without notice", "Service suspension without notice"],
    ["suspend without notice", "Service suspension without notice"],
    ["right to suspend", "Service suspension without notice"],
    // Equipment non-return / return fees
    ["non-return fee", "Equipment non-return fee"],
    ["equipment not returned", "Equipment return requirement"],
    ["unreturned equipment", "Equipment non-return fee"],
    ["full replacement cost", "Equipment non-return fee"],
    // Long advance cancellation notice requirements — renewal traps
    ["days before renewal", "Long cancellation notice requirement"],
    ["days before the renewal", "Long cancellation notice requirement"],
    ["days prior to renewal", "Long cancellation notice requirement"],
    ["days prior to the renewal", "Long cancellation notice requirement"],
    ["prior written notice of cancellation", "Advance cancellation notice requirement"],
    ["days written notice", "Advance cancellation notice requirement"],
    // Unilateral price or term adjustment rights
    ["reserves the right to adjust", "Unilateral price/term adjustment right"],
    ["right to adjust pricing", "Unilateral price/term adjustment right"],
    ["may adjust pricing", "Unilateral price/term adjustment right"],
    ["may adjust rates", "Unilateral price/term adjustment right"],
    ["may adjust fees", "Unilateral price/term adjustment right"],
    // Recurring successive renewal cycles — lock-in structures
    ["successive 12-month", "Recurring renewal cycle"],
    ["successive one-year", "Recurring renewal cycle"],
    ["successive annual", "Recurring renewal cycle"],
    // ── Non-financing consumer-harm terms (Tuning Round 3) ──────────────────
    // Data-cap overage billing traps (ISP / telecom contracts)
    ["overage", "Data overage billing"],
    ["data cap", "Data cap with overage billing"],
    ["data usage allowance", "Data cap with overage billing"],
    // Service reinstatement / reconnection fees
    ["reinstatement fee", "Service reinstatement fee"],
    ["reconnection fee", "Service reinstatement fee"],
    // GPS tracking device in loan contexts (installment / title loan)
    ["gps tracking device", "GPS / starter-interrupt device"],
    ["gps tracker", "GPS / starter-interrupt device"],
    ["gps tracking", "GPS / starter-interrupt device"],
    // Rollover provisions — predatory lending / title loan traps
    // Use specific "roll over the loan/balance" phrasing to avoid matching retirement 401k rollovers.
    ["roll over the loan", "Rollover provision"],
    ["roll over the balance", "Rollover provision"],
    ["roll the loan over", "Rollover provision"],
    ["rollovers permitted", "Rollover provision"],
    ["no limit on the number of rollover", "Unlimited rollover provision"],
    ["number of rollovers permitted", "Unlimited rollover provision"],
    // No right of rescission — removes the buyer's cooling-off period
    ["no right of rescission", "No right of rescission"],
    ["there is no right of rescission", "No right of rescission"],
    ["no cooling-off period", "No right of rescission"],
    // ── Tuning Round 5 — P4: Regression repair for service contracts (gym / telecom) ────────────
    // Arbitration clauses phrased without "mandatory" or "binding" keywords
    ["agrees to arbitration", "Mandatory arbitration"],
    ["arbitration on an individual", "Mandatory arbitration"],
    // Class-action waivers phrased without "class action" as a direct substring
    ["class or representative action", "Class-action waiver"],
    ["waives participation in class", "Class-action waiver"],
    ["representative action", "Class-action waiver"],
    // Early termination phrasing without the word "fee" immediately adjacent
    ["early termination", "Early termination fee"],
    // Auto-renewal phrasing using "unless cancelled" instead of "until cancelled"
    ["unless cancelled", "Continuous auto-renewal"],
    // Charge acceleration clauses phrased differently from "accelerate the"
    ["accelerate all", "Acceleration clause"],
    ["accelerate unpaid", "Acceleration clause"],
    // Service suspension phrased as passive voice or with discretionary target
    ["suspended without notice", "Service suspension without notice"],
    ["may suspend", "Service suspension without notice"],
    ["suspend access", "Service suspension without notice"],
    ["suspend club access", "Service suspension without notice"],
    // Collections referral phrased as "refer the account for collection"
    ["account for collection", "Collections referral clause"],
    // Unilateral price adjustment phrased as "price adjustments" (no "may adjust X" verb form)
    ["price adjustment", "Unilateral price/term adjustment right"],
    ["promotional expiration", "Unilateral price/term adjustment right"],
    // Returned payment / NSF fee — common service-contract penalty for failed billing attempts
    ["returned payment fee", "Returned payment fee"],
    ["returned payment charge", "Returned payment fee"],
    ["nsf fee", "Returned payment fee"],
    ["insufficient funds fee", "Returned payment fee"],
    // ── Legal Glossary Expansion — high-risk clauses from Cornell LII / consumer law ─────────────
    // Personal guarantee — borrower's personal assets at risk beyond business liability
    ["personal guarantee", "Personal guarantee"],
    ["personal guaranty", "Personal guarantee"],
    ["personal guarantor", "Personal guarantee"],
    // Confession of judgment / cognovit — waives right to be heard before judgment
    ["confession of judgment", "Confession of judgment"],
    ["cognovit", "Confession of judgment"],
    // Cross-collateralization / dragnet clause — existing collateral covers all future debts
    ["cross-collateral", "Cross-collateralization clause"],
    ["future advances", "Future advances / dragnet clause"],
    ["dragnet clause", "Future advances / dragnet clause"],
    // Jury trial waiver — gives up constitutional right to jury
    ["waiver of jury trial", "Jury trial waiver"],
    ["jury trial waiver", "Jury trial waiver"],
    ["waives jury", "Jury trial waiver"],
    ["waive your right to a jury", "Jury trial waiver"],
    ["waive the right to a jury", "Jury trial waiver"],
    // Indemnification and hold harmless — one-sided liability transfer
    ["indemnif", "Indemnification clause"],
    ["hold harmless", "Hold harmless clause"],
    // Limitation of liability and consequential damages exclusion
    ["limitation of liability", "Limitation of liability"],
    ["consequential damage", "Exclusion of consequential damages"],
    ["incidental damage", "Exclusion of consequential damages"],
    // Right of setoff — lender can take funds from your other accounts
    ["right of setoff", "Right of setoff"],
    ["right of offset", "Right of setoff"],
    ["right to setoff", "Right of setoff"],
    // Prepayment penalty — fee for paying loan off early
    ["prepayment penalty", "Prepayment penalty"],
    ["prepayment fee", "Prepayment penalty"],
    ["prepayment charge", "Prepayment penalty"],
    // Wage assignment — voluntary paycheck diversion (distinct from garnishment)
    ["wage assignment", "Wage assignment clause"],
    // Assignment without consent — contract sold to unknown third party
    ["may assign this agreement", "Assignment without consent"],
    ["right to assign this", "Assignment without consent"],
    ["assignable without your consent", "Assignment without consent"],
    // Unilateral modification of terms
    ["may modify these terms", "Unilateral modification of terms"],
    ["may amend these terms", "Unilateral modification of terms"],
    ["right to modify these terms", "Unilateral modification of terms"],
    ["may change these terms", "Unilateral modification of terms"],
    // Attorneys' fees shifting — loser pays the other side's legal costs
    ["attorneys' fees", "Attorneys' fees clause"],
    ["attorney fees", "Attorneys' fees clause"],
    ["attorney's fees", "Attorneys' fees clause"],
    ["prevailing party fees", "Attorneys' fees clause"],
    // Forum selection — must sue in company's home state
    ["forum selection", "Forum selection clause"],
    ["exclusive jurisdiction", "Forum selection clause"],
    // Choice of law — another state's laws govern
    ["governing law", "Choice of law clause"],
    // Non-disparagement — silences negative reviews
    ["non-disparagement", "Non-disparagement clause"],
    ["nondisparagement", "Non-disparagement clause"],
    // Non-compete and non-solicitation
    ["non-compete", "Non-compete clause"],
    ["noncompete", "Non-compete clause"],
    ["non-solicitation", "Non-solicitation clause"],
    // Evergreen perpetual renewal
    ["evergreen", "Evergreen (perpetual renewal) clause"],
    // Force majeure — excuses performance
    ["force majeure", "Force majeure clause"],
    // Security interest — lender claims right to specific property
    ["grant a security interest", "Security interest clause"],
    ["grants a security interest", "Security interest clause"],
    ["security interest in", "Security interest clause"],
    // Blanket security / all-assets lien
    ["all of your assets", "Blanket security interest"],
    ["all assets of the", "Blanket security interest"],
  ];
  const seenContractLabels = new Set<string>();
  const contractRiskTerms: string[] = [];
  for (const [pattern, label] of contractRiskPatterns) {
    // Skip if the match appears in a clear negation context (e.g. "no prepayment penalty")
    const idx = lower.indexOf(pattern);
    if (idx === -1) continue;
    const before = lower.slice(Math.max(0, idx - 20), idx);
    if (/\b(no|without|waiving|waives|no such|does not include|there is no)\s*$/.test(before.trimEnd())) continue;
    if (!seenContractLabels.has(label)) {
      seenContractLabels.add(label);
      contractRiskTerms.push(label);
    }
  }

  // Tuning Round 3: detect predatory APR (≥ 100%) — hallmark of title loans, payday loans, rent-to-own.
  // The pattern loop only matches exact strings; a regex search is needed to catch specific numeric APR values.
  if (!seenContractLabels.has("Predatory APR (≥100%)")) {
    const aprNumericMatch =
      lower.match(/annual percentage rate[^%\n]{0,40}(\d{3,}(?:\.\d+)?)\s*%/) ||
      lower.match(/\bapr[^%\n]{0,30}?(\d{3,}(?:\.\d+)?)\s*%/);
    if (aprNumericMatch) {
      const aprVal = parseFloat(aprNumericMatch[1]);
      if (aprVal >= 100) {
        seenContractLabels.add("Predatory APR (≥100%)");
        contractRiskTerms.push("Predatory APR (≥100%)");
      }
    }
  }

  return { phones, emails, urls, dates, amounts, urgencyPhrases, threatPhrases, paymentRedFlags, infoRequests, contractRiskTerms };
}

function calculateRiskScore(data: ExtractedRuleData, lower: string, text: string): number {
  let score = 0;

  // High severity — payment method red flags
  const giftCardTerms = ["gift card", "itunes card", "google play card", "steam card", "amazon gift card"];
  if (data.paymentRedFlags.some((f) => giftCardTerms.some((k) => f.includes(k)))) score += 25;
  const wireTerms = ["wire transfer", "western union", "moneygram"];
  if (data.paymentRedFlags.some((f) => wireTerms.some((k) => f.includes(k)))) score += 20;
  // Tuning Round 5 — P2: expanded to catch "digital asset", "digital wallet", "wallet transfer"
  // These are never accepted by legitimate government agencies or financial institutions.
  const cryptoTerms = ["cryptocurrency", "bitcoin", "ethereum", "crypto", "usdt", "digital asset", "digital wallet", "wallet transfer", "digital currency"];
  if (data.paymentRedFlags.some((f) => cryptoTerms.some((k) => f.includes(k)))) score += 22;
  const ssnTerms = ["social security number", "ssn"];
  // Tuning Round 3 — Priority 4: Guard against SSN scoring spuriously elevating legitimate government docs.
  // Legitimate SSA/government letters reference the recipient's SSN in masked form (e.g. "XXX-XX-7831") or
  // as a records field ("Social Security Number: ...on file"). Only add score when the SSN appears in a
  // demand/verification context rather than a mere record-reference context.
  const ssnIsReferenceOnly =
    /\b(ssn|social\s+security\s+(?:number|no\.?))\s*:?\s*x{2,}|social\s+security\s+(?:number|no\.?).*last\s*\d+\s*(?:digit|shown)|social\s+security.*on\s+(?:file|record)/i.test(lower);
  if (!ssnIsReferenceOnly && data.infoRequests.some((r) => ssnTerms.some((k) => r.includes(k)))) score += 22;
  const bankTerms = ["bank account number", "routing number", "credit card number", "cvv"];
  if (data.infoRequests.some((r) => bankTerms.some((k) => r.includes(k)))) score += 20;
  const arrestTerms = ["arrest", "warrant", "prosecution", "criminal charges", "federal agent"];
  if (data.threatPhrases.some((t) => arrestTerms.some((k) => t.includes(k)))) score += 25;
  const linkTerms = ["payment link", "pay here", "click to pay"];
  if (data.paymentRedFlags.some((f) => linkTerms.some((k) => f.includes(k)))) score += 18;

  // High severity — impersonation and pattern detection
  // Well-known brand impersonation + payment demand is a strong scam signal.
  // Tuning Round 5: added "paypal", "amazon.com", "venmo", "zelle" — common phishing targets that
  // send urgent security/account notices directing victims to holding accounts or lookalike sites.
  const impersonatedBrands = [
    "microsoft", "apple support", "apple inc.", "google support", "amazon support",
    "irs ", "internal revenue service", "fbi ", "dea ", "interpol",
    "social security administration", "medicare fraud", "medicaid fraud",
    "paypal", "paypal security", "paypal support",
  ];
  // Tuning Round 6: also fires when infoRequests.length > 0 (not just payment red flags).
  // Credential-harvesting phishing impersonates a brand and requests identity info without a direct
  // payment link — the victim is directed to a fake site instead of being asked for money directly.
  if (impersonatedBrands.some((b) => lower.includes(b)) && (data.paymentRedFlags.length > 0 || data.infoRequests.length > 0)) score += 18;

  // Remote access request combined with payment demand — hallmark of tech support scam
  const remoteAccessTerms = ["remote access", "remotely access", "anydesk", "teamviewer", "remote session", "remote control your"];
  if (remoteAccessTerms.some((t) => lower.includes(t)) && data.paymentRedFlags.length > 0) score += 15;

  // Advance-fee fraud: prize/lottery/inheritance + upfront fee requirement + payment method
  const prizeClaims = ["prize", "winner", "lottery", "sweepstakes", "inheritance", "winnings", "jackpot", "grant award", "selected recipient"];
  const feeRequirements = ["processing fee", "clearance fee", "release fee", "tax fee", "transfer fee", "administrative fee", "advance fee", "tax clearance"];
  if (
    prizeClaims.some((t) => lower.includes(t)) &&
    feeRequirements.some((t) => lower.includes(t)) &&
    data.paymentRedFlags.length > 0
  ) score += 30;

  // Secrecy/confidentiality instruction + payment demand — used to prevent victims from seeking advice
  const secrecyTerms = ["do not share", "keep confidential", "tell no one", "prize transfers are confidential", "do not discuss with"];
  if (secrecyTerms.some((t) => lower.includes(t)) && data.paymentRedFlags.length > 0) score += 10;

  // Anti-verification instruction — telling recipient not to contact official channels or to use an exclusive hotline.
  // Expanded (Tuning Round 1): catches "do not contact [brand/company] directly" and exclusive-channel demands.
  // Expanded (Tuning Round 3): added paypal, ebay, bank, support, "us" targets; added "do not contact \w+ directly" catch-all.
  // Tuning Round 6: added "do not attempt to log in directly" and "do not sign in directly"
  // — PayPal/bank phishing uses "do not attempt to log in" rather than "do not contact X".
  const antiVerification = /do\s+not\s+contact\s+(the\b|our\b|us\b|amazon\b|microsoft\b|apple\b|google\b|irs\b|fbi\b|official\b|main\b|paypal\b|ebay\b|bank\b|support\b)|do\s+not\s+contact\s+\w+\s+directly|do\s+not\s+call\s+the\s*(irs|fbi|police|main\s+office|official)|must\s+be\s+resolved\s+exclusively\s+through\s+our|avoid\s+contacting|do\s+not\s+discuss\s+(this|the)|do\s+not\s+speak\s+with\s+(anyone|family)|do\s+not\s+attempt\s+to\s+(log\s+in|sign\s+in|access\s+(your\s+account|the\s+account)|login)\s+directly|use\s+only\s+the\s+(secure\s+)?(link|portal|page)\s+(above|provided|below)/i;
  // Tuning Round 3: expanded trigger condition — also fires when urgency phrases are present.
  // This catches phishing emails that isolate victims from official channels without using traditional payment red flags.
  if (antiVerification.test(lower) && (data.paymentRedFlags.length > 0 || data.infoRequests.length > 0 || data.urgencyPhrases.length > 0)) score += 12;

  // Compound signal: SSN demand + anti-verification = strong identity-theft pattern (Tuning Round 1)
  const hasSsnDemand = data.infoRequests.some((r) => ["social security number", "ssn"].some((k) => r.includes(k)));
  if (hasSsnDemand && antiVerification.test(lower)) score += 6;

  // Tuning Round 5: Fund-isolation + anti-verification compound.
  // Directing a victim to transfer funds to a "holding account" while simultaneously telling them
  // not to contact the brand's official support is the two-step PayPal / bank phishing pattern.
  // This combination almost never appears in legitimate communications.
  const hasFundIsolation = data.paymentRedFlags.some((f) => ["holding account", "safe account", "protected account"].some((k) => f.includes(k)));
  if (hasFundIsolation && antiVerification.test(lower)) score += 15;

  // ── Trust Check Expansion: New Scam Category Detection ─────────────────────────────────────────

  // Advance fee / 419 fraud — victim must pay a fee to "release" a larger sum.
  // Signal: fee payment demand (processing, release, clearance, customs) + promise of large reward.
  const hasAdvanceFeePay = data.paymentRedFlags.some((f) =>
    ["processing fee", "release fee", "clearance fee", "customs fee", "customs clearance",
     "administrative fee to release", "insurance fee to release"].some((k) => f.includes(k))
  );
  const hasAdvanceFeeReward = /\b(inheritance|unclaimed\s+(funds|money|prize|award)|winning(s)?|lottery|prize\s+(money|funds)|release\s+(your|the)\s+(funds|money|winnings)|compensation\s+(package|fund)|beneficiary\s+(of|to))\b/i.test(lower);
  if (hasAdvanceFeePay && hasAdvanceFeeReward) score += 35;
  else if (hasAdvanceFeeReward && data.amounts.length > 0 && data.paymentRedFlags.length > 0) score += 20;

  // Lottery / prize notification fraud — "you have won" + any payment demand.
  const hasPrizeClaim = /\b(you\s+have\s+(won|been\s+selected\s+(as\s+a\s+)?winner)|congratulations.*you\s+have\s+won|prize\s+winner|winning\s+notification|selected\s+as\s+a\s+(lucky|grand)\s+winner|lucky\s+draw\s+winner)\b/i.test(lower);
  if (hasPrizeClaim && (data.paymentRedFlags.length > 0 || data.infoRequests.length > 0)) score += 30;
  else if (hasPrizeClaim && data.urgencyPhrases.length > 0 && data.amounts.length > 0) score += 20;

  // Fake check / overpayment scam — deposit a fraudulent check, then wire back the "excess".
  const hasFakeCheckRefund = data.paymentRedFlags.some((f) =>
    ["send back the difference", "return the difference", "refund the overpayment",
     "deposit and return", "overpayment refund"].some((k) => f.includes(k))
  );
  const hasOverpaymentClaim = /\b(overpayment|over-payment|excess\s+(funds|amount|payment)|mistaken\s+(payment|deposit)|erroneous\s+(payment|transfer)|more\s+than\s+(intended|expected)|accidentally\s+(sent|transferred|deposited))\b/i.test(lower);
  if (hasFakeCheckRefund || (hasOverpaymentClaim && (data.paymentRedFlags.some((f) => ["wire transfer", "western union", "moneygram", "zelle"].some((k) => f.includes(k)))))) score += 35;

  // Immigration / deportation threat scam — creates fear of legal status action to extort payment.
  const hasImmigrationThreat = data.threatPhrases.some((t) =>
    ["deportation", "deportation order", "immigration violation", "visa revocation",
     "visa cancellation", "ice agent", "ice officer", "immigration enforcement"].some((k) => t.includes(k))
  );
  if (hasImmigrationThreat && data.paymentRedFlags.length > 0) score += 30;
  else if (hasImmigrationThreat && (data.infoRequests.length > 0 || data.urgencyPhrases.length >= 2)) score += 20;

  // Free / personal email provider used as sender for a claimed official or governmental notice.
  // Legitimate government agencies, banks, and established companies never use gmail/yahoo/hotmail.
  const hasFreeEmailSender = data.emails.some((e) =>
    /@(gmail|yahoo|hotmail|outlook\.com|aol|icloud|protonmail|mail\.com|yandex|live\.com)\./i.test(e)
  );
  if (hasFreeEmailSender && (data.paymentRedFlags.length > 0 || data.threatPhrases.length > 0 || data.infoRequests.length > 0)) score += 15;
  // Extra boost when the document also claims to be from a government or official entity
  if (hasFreeEmailSender && (claimsGovernmentEntity || /\b(irs|fbi|dea|police|court|federal|government|official\s+notice)\b/i.test(lower))) score += 10;

  // Excessive urgency density — four or more urgency phrases in a single document is abnormal.
  // Even genuine emergency communications rarely stack this many pressure terms together.
  if (data.urgencyPhrases.length >= 4) score += 12;
  else if (data.urgencyPhrases.length >= 6) score += 8; // additional, stacks with above

  // Overseas / romance isolation pattern — sender claims to be abroad and asks for money transfer.
  const hasOverseasSender = /\b(i\s+am\s+(currently\s+)?(overseas|abroad|out\s+of\s+country|stationed|deployed|traveling)|currently\s+(overseas|abroad|in\s+[A-Z][a-z]+)\s+and|cannot\s+(meet|come|be\s+there)\s+(in\s+person|right\s+now))\b/i.test(lower);
  if (hasOverseasSender && (data.paymentRedFlags.length > 0 || data.amounts.length > 0)) score += 20;

  // OTP / verification code request — phishing targeting 2FA bypass.
  // Legitimate institutions never ask you to share a one-time code they sent you.
  const hasOtpRequest = data.infoRequests.some((r) => ["one-time code", "verification code", "otp"].some((k) => r.includes(k)));
  if (hasOtpRequest) score += 25;

  // Tuning Round 3 — Priority 1: Phishing domain detection.
  // Lookalike domains (brand + suspicious suffix: -secure, -accounts-secure, -verify, -helpdesk, etc.)
  // are a hallmark of phishing attacks. Check email domains and URL hostnames independently.
  const extractHostname = (url: string): string => {
    try { return new URL(url).hostname.toLowerCase(); } catch { return url.toLowerCase(); }
  };
  const phishingDomainSuffixes = /-(secure|accounts?secure|alert|helpdesk|verif|verify|verification|limited|suspended|restore|recover|unlock|login|signin)\b/i;
  const allContactDomains = [
    ...data.emails.map((e) => (e.split("@")[1] || "").toLowerCase()),
    ...data.urls.map(extractHostname),
  ];
  if (allContactDomains.some((d) => phishingDomainSuffixes.test(d))) score += 18;

  // Tuning Round 3 — Priority 1: Email/URL domain mismatch with suspicious context.
  // A legitimate organisation uses consistent domains across its email and web addresses.
  // Mismatch combined with urgency, payment demand, or info request is a strong phishing signal.
  if (data.emails.length > 0 && data.urls.length > 0) {
    const emailDomains = data.emails.map((e) => (e.split("@")[1] || "").toLowerCase().replace(/^www\./, "")).filter(Boolean);
    const urlDomains = data.urls.map(extractHostname).map((h) => h.replace(/^www\./, "")).filter(Boolean);
    const hasMatch = emailDomains.some((ed) => urlDomains.some((ud) => ud.includes(ed) || ed.includes(ud)));
    if (!hasMatch && emailDomains.length > 0 && urlDomains.length > 0) {
      const hasSuspiciousContext = data.urgencyPhrases.length > 0 || data.paymentRedFlags.length > 0 || data.infoRequests.length > 0;
      if (hasSuspiciousContext) score += 15;
    }
  }

  // Medium severity — language and pressure tactics
  const urgentTerms = ["within 24 hours", "act now", "immediately", "do not ignore"];
  if (data.urgencyPhrases.some((u) => urgentTerms.some((k) => u.includes(k)))) score += 10;
  const legalTerms = ["legal action", "lawsuit", "collections", "collection agency", "debt collector"];
  if (data.threatPhrases.some((t) => legalTerms.some((k) => t.includes(k)))) score += 10;
  const shutoffTerms = ["shutoff", "shut off", "service interruption", "disconnect", "suspension"];
  if (data.threatPhrases.some((t) => shutoffTerms.some((k) => t.includes(k)))) score += 8;
  const finalTerms = ["final notice", "final warning", "last notice"];
  if (data.threatPhrases.some((t) => finalTerms.some((k) => t.includes(k)))) score += 8;
  const repoTerms = ["repossession", "foreclosure", "lien", "eviction", "unlawful detainer", "asset seizure"];
  if (data.threatPhrases.some((t) => repoTerms.some((k) => t.includes(k)))) score += 10;
  const peerPayTerms = ["zelle", "cash app", "cashapp", "venmo"];
  if (data.paymentRedFlags.some((f) => peerPayTerms.some((k) => f.includes(k)))) score += 12;

  // Compound: Western Union/MoneyGram + collections claim (Tuning Round 1)
  // Legitimate collection agencies never use Western Union — this combination is near-certain fraud.
  const hasWireScam = data.paymentRedFlags.some((f) => ["western union", "moneygram"].some((k) => f.includes(k)));
  const hasCollectionsClaim = data.threatPhrases.some((t) => ["collections", "collection agency", "debt collector"].some((k) => t.includes(k)));
  if (hasWireScam && hasCollectionsClaim) score += 7;

  if (data.urgencyPhrases.length >= 3) score += 8;
  else if (data.urgencyPhrases.length >= 2) score += 4;

  // Low severity — contextual indicators
  if (data.urgencyPhrases.length >= 1) score += 3;
  if (data.threatPhrases.length >= 1) score += 3;
  if (data.amounts.length > 0) score += 2;

  // ── Tuning Round 4: Government / Utility impersonation via private .com domain ──────────────
  // Batch-6 false negatives (Red River Utilities shutoff, Easton County Tax) both exhibited this
  // pattern: document claims a public/municipal/utility issuer but directs payment/contact to a
  // private .com portal, with no .gov or institutional domain present.
  //
  // Priority 3 safeguard: this rule ONLY fires when the issuer explicitly claims to be a
  // government, municipal, or public-utility entity. Normal private businesses using .com are
  // not affected. Established utility companies whose .com is their actual brand domain are only
  // penalised if the domain is clearly constructed as a payment portal (not their company name).

  // Step 1 — Does the document claim to be from a government / municipal / public-utility entity?
  // Tuning Round 5 — P1: extended to also catch IRS / federal / revenue-enforcement impersonation.
  // Pattern covers Internal Revenue, IRS-branded units, levy/enforcement notices, and Treasury-level
  // federal entities — all of which must use .gov domains for legitimate contact.
  const claimsGovernmentEntity =
    /\b(county|township|municipality|municipal\s+(government|service|court|authority|office)|city\s+of\b|village\s+of\b|town\s+of\b|borough\s+of\b|public\s+works\s+(department|office))\b/i.test(text) ||
    /\b(tax\s+(collector|office|department|authority|division|bureau|portal)|county\s+treasurer|city\s+treasurer|treasurer'?s?\s+office|revenue\s+(office|department|division|bureau)|assessor'?s?\s+office|treasury\s+department|department\s+of\s+(revenue|taxation|finance)|property\s+tax|delinquent\s+tax|back\s+taxes?)\b/i.test(lower) ||
    // Tuning Round 5 — P1: IRS / federal tax authority impersonation
    /\b(internal\s+revenue\s+(service|collections?\s*(unit|desk|center|division)?)?|revenue\s+collections?\s*(unit|division|center|desk)?|irs\s+(enforcement|levy|notice|collections?|resolution|division|compliance|unit)|federal\s+(tax|revenue|levy|enforcement|collections?|bureau)\b|intent\s+to\s+levy|notice\s+of\s+(levy|intent\s+to\s+levy)|tax\s+(enforcement|levy|collections?|resolution)\s*(unit|center|division|desk|bureau)?)\b/i.test(lower);

  const claimsPublicUtility =
    /\b(public\s+(utility|utilities)|utility\s+(district|authority|board|service|department)|utilities\s+(department|authority|district|board)|water\s+(authority|district|utility|department|service|board)|electric\s+(authority|district|utility|cooperative)|gas\s+(authority|district|utility)|power\s+(authority|district|utility))\b/i.test(lower);

  const claimsPublicIssuer = claimsGovernmentEntity || claimsPublicUtility;

  if (claimsPublicIssuer) {
    // Step 2 — Collect all domains present in the document (URLs + bare domains)
    const extractHostnameR4 = (u: string): string => {
      try { return new URL(u).hostname.toLowerCase(); } catch { return u.toLowerCase(); }
    };
    const allDocDomains = [
      ...data.urls.map(extractHostnameR4),
      ...(text.match(/\b[A-Za-z0-9\-]+\.(com|org|gov|net|edu)(\/[\w\-\/\.]+)?\b/g) || [])
        .filter((d) => !d.includes("@"))
        .map((d) => d.toLowerCase()),
    ];

    // Step 3 — Check for authoritative public-sector domains (reduces suspicion)
    const hasGovDomain = allDocDomains.some((d) => d.includes(".gov"));
    const hasInstitutionalOrg = allDocDomains.some((d) => d.includes(".org") && !/pay|portal|payment|collect/i.test(d));

    if (!hasGovDomain && !hasInstitutionalOrg) {
      // No .gov and no institutional .org — contact/payment channels are all private

      // Step 4a — Strong signal: a .com domain that looks like a constructed payment portal.
      // These have BOTH a utility/tax/government keyword AND a payment/portal keyword in the
      // domain name — e.g. "redriver-utilities-pay.com", "tax-portal-easton.com".
      const comDomains = allDocDomains.filter((d) => /\.com(\/|$)/.test(d) || d.endsWith(".com"));
      // Tuning Round 5 — P1: expanded keyword sets to catch IRS/federal-style constructed domains.
      // e.g. "irs-tax-resolution-center.com" has "tax"+"irs" (gov) and "resolution"+"center" (portal).
      const hasConstructedPaymentPortal = comDomains.some((d) => {
        const hasGovUtilWord = /(utilities?|electric|water|gas|tax|county|municipal|city|township|treasury|revenue|assessor|irs|federal|levy|enforcement|clearance)/i.test(d);
        const hasPaymentWord = /(pay|portal|payment|bill|collect|account|resolution|center|clearance|enforcement|collections)/i.test(d);
        return hasGovUtilWord && hasPaymentWord;
      });

      if (hasConstructedPaymentPortal) {
        // Strongest signal: clearly constructed payment-portal domain for a claimed public issuer.
        // Real utilities/agencies do not register "<entity>-pay.com" or "tax-portal-<city>.com".
        score += 35;
      } else if (claimsGovernmentEntity && comDomains.length > 0) {
        // Government/municipal entities (county, tax office, treasury) must use .gov.
        // A .com-only contact structure for a claimed government entity is highly suspicious.
        score += 20;
      }
      // Note: established utility companies legitimately use their company .com domain —
      // only penalise when the portal is clearly constructed (handled above).

      // Step 5 — Priority 2: Payment-pressure combination boost.
      // When the public-issuer/private-domain pattern appears alongside social-engineering
      // pressure tactics, the combined weight should materially elevate the score.
      const hasShutoffOrSeizureThreat = data.threatPhrases.some((t) =>
        ["shutoff", "shut off", "service interruption", "disconnect", "suspension",
          "seizure", "asset seizure", "property seizure", "lien"].some((k) => t.includes(k)),
      );
      const hasUrgentPaymentDemand = data.urgencyPhrases.length > 0 && data.amounts.length > 0;
      const hasFinalNoticeThreat = data.threatPhrases.some((t) =>
        ["final notice", "final warning", "last notice"].some((k) => t.includes(k)),
      );
      const hasPhonePaymentDemand = /\b(pay\s+by\s+phone|payment\s+by\s+phone|pay\s+(?:over|via)\s+(?:the\s+)?phone|convenience\s+fee|debit\s+by\s+phone)\b/i.test(lower);
      const hasRecoveryOrIsolationLanguage = /\b(recovery\s+file|account\s+isolation|notice\s+of\s+(seizure|lien|assessment|levy)|final\s+demand\s+for\s+payment)\b/i.test(lower);

      if (hasShutoffOrSeizureThreat && hasUrgentPaymentDemand) score += 10;
      if (hasFinalNoticeThreat && hasUrgentPaymentDemand) score += 5;
      if (hasPhonePaymentDemand && claimsPublicIssuer) score += 8;
      if (hasRecoveryOrIsolationLanguage) score += 5;
    }
  }
  // ── End Tuning Round 4 ───────────────────────────────────────────────────────────────────────

  return Math.min(100, score);
}

function scoreToVerdict(score: number): TrustCheckVerdict {
  if (score >= 75) return "High scam risk";
  if (score >= 50) return "Suspicious — verify before acting";
  if (score >= 25) return "Cannot verify authenticity";
  return "Likely legitimate";
}

/**
 * Multi-signal verdict resolution.
 * "Likely legitimate" requires BOTH low authenticity risk AND reasonably strong verification
 * confidence. If auth is low but confidence is weak/partial, we prefer "Cannot verify
 * authenticity" to avoid giving false reassurance on mixed-trust documents.
 */
function resolveVerdict(authRisk: number, conf: number): TrustCheckVerdict {
  if (authRisk >= 75) return "High scam risk";
  if (authRisk >= 50) return "Suspicious — verify before acting";
  if (authRisk >= 25) return "Cannot verify authenticity";
  // Low authenticity risk — also require at least moderate verification confidence.
  // Confidence < 50 means partial/low — prefer "Cannot verify authenticity" over a soft clearance.
  if (conf < 50) return "Cannot verify authenticity";
  return "Likely legitimate";
}

function calculateDocumentRiskScore(contractRiskTerms: string[]): number {
  const weights: Record<string, number> = {
    // Financing / loan terms
    "Default rate escalation": 14,
    "Penalty APR clause": 12,
    "Penalty rate clause": 12,
    "Repossession clause": 16,
    "Voluntary repossession option": 8,
    "Acceleration clause": 13,
    "GPS / starter-interrupt device": 15,
    "Mandatory arbitration": 11,
    "Binding arbitration clause": 11,
    "Class-action waiver": 10,
    "Deficiency balance exposure": 13,
    "Force-placed insurance": 9,
    "Blanket lien on collateral": 9,
    "Balloon payment risk": 13,
    "Wage garnishment risk": 10,
    "Negative amortization risk": 14,
    "Prepayment penalty": 7,
    // Non-financing consumer-harm terms (Tuning Round 1, weights updated in Round 2)
    "Early termination fee": 14,
    "Cancellation fee": 8,
    "Auto-renewal clause": 10,
    "Continuous auto-renewal": 11,
    "Interest accrual clause": 10,
    "Compounded APR interest accrual": 12,
    "Compounded interest accrual": 10,
    "Credit bureau reporting threat": 11,
    "Collections referral clause": 10,
    "Non-refundable clause": 7,
    "Liquidated damages clause": 13,
    "Unilateral termination right": 11,
    "Unilateral authority clause": 8,
    // Non-financing consumer-harm terms (Tuning Round 2)
    "Service suspension without notice": 9,
    "Equipment non-return fee": 7,
    "Equipment return requirement": 6,
    "Long cancellation notice requirement": 8,
    "Advance cancellation notice requirement": 8,
    "Unilateral price/term adjustment right": 8,
    "Recurring renewal cycle": 7,
    // Non-financing and predatory lending terms (Tuning Round 3)
    "Data overage billing": 6,
    "Data cap with overage billing": 7,
    "Service reinstatement fee": 7,
    "Rollover provision": 10,
    "Unlimited rollover provision": 16,
    "No right of rescission": 11,
    "Predatory APR (≥100%)": 20,
    // High-risk legal clauses added in legal glossary expansion (weights were defaulting to 8)
    "Personal guarantee": 12,
    "Confession of judgment": 15,
    "Cognovit note / confession of judgment": 15,
    "Jury trial waiver": 9,
    "Waiver of jury trial": 9,
    "Right of setoff": 11,
    "Dragnet / cross-collateralization clause": 13,
    "Cross-collateralization clause": 13,
    "Indemnification clause": 9,
    "Broad indemnification clause": 11,
    "Mutual indemnification clause": 7,
    "Limitation of liability clause": 8,
    "Exclusion of consequential damages": 8,
    "Non-disparagement clause": 6,
    "Non-compete clause": 9,
    "Forum selection clause": 7,
    "Choice of law clause": 6,
    "Assignment without consent": 8,
    "Unilateral modification of terms": 10,
    "Evergreen clause": 9,
    "Force majeure clause": 5,
    "Returned payment fee": 6,
    "Security interest clause": 8,
    "Attorneys' fees shifting": 9,
    "One-sided attorneys' fees clause": 11,
    "Wage assignment clause": 13,
    "Future-advances clause": 10,
  };
  let total = 0;
  for (const term of contractRiskTerms) {
    total += weights[term] ?? 8;
  }
  return Math.round(Math.min(100, total * 0.78));
}

function calculateVerificationConfidence(
  text: string,
  lower: string,
  ruleData: ExtractedRuleData,
  riskScore: number,
): number {
  let conf = 40;

  // Positive: specific traceable reference identifier.
  // Expanded in Tuning Round 2 to include claim #, group #, statement #, record # (EOB/insurance/billing docs).
  // Expanded in Tuning Round 3 to include membership #, account ID, subscriber #, and contract # patterns
  // that appear in gym memberships, subscription agreements, and consumer services.
  // Also tightened the trailing match from [\w\-]+ to [\w\-]{3,} to prevent short common words from matching.
  if (
    /\b(account\s*(number|#|no\.?|id|identifier)|case\s*(number|#|no\.?)|reference\s*(number|#|no\.?)|invoice\s*(number|#|no\.?)|confirmation\s*(number|#|no\.?)|claim\s*(number|#|no\.?)|group\s*(number|#|no\.?)|statement\s*(number|#|no\.?)|record\s*(number|#|no\.?)|member\s*(account|number|#|id)|membership\s*(number|#|no\.?)|subscriber\s*(id|number|#)|loan\s*(number|#|no\.?)|policy\s*(number|#|no\.?)|contract\s*(number|#|no\.?))\s*:?\s*[\w\-]{3,}/i.test(text)
    || /\bAccount\s*:\s*[\w\-]{3,}/i.test(text)
    || /\bRef(?:erence)?\s*(?:no\.?|#|:)\s*[\w\-]{3,}/i.test(text)
  ) conf += 12;

  // Positive: contract-specific identifier (VIN, loan #, policy #)
  if (/\b(VIN|vehicle\s+identification\s+number|loan\s*(number|#|no\.?)|policy\s*(number|#|no\.?))\s*:?\s*[\w\-]+/i.test(text)) conf += 10;

  // Positive: multi-identifier compound bonus (Tuning Round 2 + 3).
  // Genuine institutional records (EOBs, loan contracts, insurance policies) typically carry multiple
  // distinct numbered identifiers. Counting distinct types rewards internal consistency.
  const identifierTypeMatchers: RegExp[] = [
    /\b(account|acct)\.?\s*(number|#|no\.?|id)\s*:?\s*[\w\-]{3,}/i,
    /\b(claim|case)\s*(number|#|no\.?)\s*:?\s*[\w\-]{3,}/i,
    /\b(member|plan)\s*(id|number|#|no\.?)\s*:?\s*[\w\-]{3,}/i,
    /\b(membership)\s*(number|#|no\.?)\s*:?\s*[\w\-]{3,}/i,
    /\b(subscriber)\s*(id|number|#)\s*:?\s*[\w\-]{3,}/i,
    /\b(group|policy)\s*(number|#|no\.?)\s*:?\s*[\w\-]{3,}/i,
    /\b(reference|invoice|confirmation|statement|record|contract)\s*(number|#|no\.?)\s*:?\s*[\w\-]{3,}/i,
    /\b(loan|mortgage)\s*(number|#|no\.?)\s*:?\s*[\w\-]{3,}/i,
    /\b(VIN|vehicle\s+identification\s+number)\b/i,
  ];
  const identifierTypeCount = identifierTypeMatchers.filter((r) => r.test(text)).length;
  if (identifierTypeCount >= 3) conf += 10;
  else if (identifierTypeCount >= 2) conf += 5;

  // Positive: named recipient (specific person, not generic)
  if (/\bdear\s+(?:(mr|ms|mrs|dr|prof)\.?\s+)?[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(text)) conf += 8;
  // Positive: named individual in contract context (BORROWER: Name, TENANT: Name, etc.)
  if (/\b(borrower|buyer|purchaser|lessee|tenant|subscriber|client)\s*:\s*[A-Z][a-z]+\s+[A-Z][a-z]/i.test(text)) conf += 5;

  // Positive: government domain in email or URL
  if (ruleData.emails.some((e) => /\.gov$/i.test(e)) || ruleData.urls.some((u) => /\.gov\b/i.test(u))) conf += 20;

  // Positive: URL present (https://) without payment red flags
  if (ruleData.urls.length > 0 && ruleData.paymentRedFlags.length === 0) conf += 5;

  // Positive: business email address (non-free-provider domain).
  // A custom-domain email (e.g. billing@company.com) is a strong signal of a real registered entity.
  // Free-provider emails (Gmail, Yahoo, Hotmail, Outlook, AOL, iCloud) are excluded —
  // their presence is neutral at best and suspicious in formal-document contexts.
  const businessEmails = ruleData.emails.filter(
    (e) => !/(gmail|yahoo|hotmail|outlook|live|aol|icloud|msn|protonmail|mail\.com)\./i.test(e)
  );
  if (businessEmails.length > 0 && ruleData.paymentRedFlags.length === 0) conf += 6;

  // Positive: bare domain reference (Tuning Round 2).
  // Many legitimate documents (phone bills, EOBs, utility notices) cite domains without https://.
  // The URL extractor only captures https:// URLs, so bare domains were previously unrecognised.
  const bareDomainsFound = (text.match(/\b[A-Za-z0-9\-]+\.(com|org|gov|net|edu)(\/[\w\-\/\.]+)?\b/g) || [])
    .filter((d) => !d.includes("@"));
  if (bareDomainsFound.length > 0 && ruleData.paymentRedFlags.length === 0) conf += 5;

  // Positive: institutional contact structure — both a phone number and a URL/domain present (Tuning Round 2).
  // Having two independent channels (phone + web) is characteristic of real institutions.
  const hasDomain = ruleData.urls.length > 0 || bareDomainsFound.length > 0;
  if (ruleData.phones.length > 0 && hasDomain && ruleData.paymentRedFlags.length === 0) conf += 5;

  // Positive: physical street address
  if (/\b\d{1,5}\s+[A-Za-z]+\s+(street|st|avenue|ave|boulevard|blvd|drive|dr|road|rd|lane|ln|way|court|ct|place|pl|suite|ste)\b/i.test(text)) conf += 8;

  // Positive: named signatory
  if (/\b(sincerely|regards|yours\s+truly)\b/i.test(lower) && /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text)) conf += 5;

  // Positive: business registration identifiers — EIN, DUNS, state license, NPI, NMLS
  // These are verifiable through public registries and strongly indicate a real registered entity.
  if (/\b(EIN|employer\s+identification\s+number|federal\s+tax\s+id)\s*:?\s*\d{2}-\d{7}/i.test(text)) conf += 12;
  if (/\b(DUNS|D-U-N-S)\s*(number|#|no\.?)?\s*:?\s*\d{2}-\d{3}-\d{4}/i.test(text)) conf += 10;
  if (/\b(NPI|national\s+provider\s+identifier)\s*:?\s*\d{10}/i.test(text)) conf += 10;
  if (/\b(NMLS|nmls\s*id|nmls\s*#)\s*:?\s*\d{4,8}/i.test(text)) conf += 8;
  if (/\b(license\s*(number|#|no\.?)|registration\s*(number|#|no\.?))\s*:?\s*[\w\-]{4,}/i.test(text)) conf += 6;

  // Positive: named professional title with signatory — letter signed by a specific titled person
  if (/\b(Director|Manager|President|Officer|Commissioner|Superintendent|Administrator|Attorney|Counsel|Trustee|Executor|Agent)\b/.test(text)
      && /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text)) conf += 4;

  // Positive: multiple standard payment / contact channels (Tuning Round 2).
  // Wider set captures real billing documents (AutoPay, App, Online, automated phone, etc.)
  const channelMatchers: RegExp[] = [
    /\bonline\b/i,
    /auto[\s\-]?pay\b/i,
    /\bapp\b/i,
    /in[\s\-]person\b/i,
    /mail[\s\-]in\b|mail\s+a\s+check\b/i,
    /\bACH\b/,
    /automated\s+(phone|payment|line)\b/i,
    /official\s+website\b/i,
    /online\s+portal\b/i,
  ];
  const channelCount = channelMatchers.filter((r) => r.test(text)).length;
  if (channelCount >= 3) conf += 10;
  else if (channelCount >= 2) conf += 5;

  // Positive: institutional self-identification language (Tuning Round 2).
  // EOBs, statements, and official records often include explicit non-payment-demand language.
  if (/this\s+is\s+not\s+a\s+bill|explanation\s+of\s+benefits|statement\s+of\s+account|official\s+record/i.test(lower)) conf += 5;

  // Positive (Tuning Round 3): structured commercial agreement confidence floor.
  // Agreements with a named party + at least one institutional identifier + no scam signals tend to be
  // authentic contracts regardless of whether they provide a phone number or website.
  // Grant a small confidence bonus so legitimate gym memberships, subscription contracts, and professional
  // service agreements aren't unfairly penalised by the no-contact-info deduction.
  const hasNamedContractParty = /\b(borrower|buyer|purchaser|lessee|tenant|subscriber|client|member|customer|account\s+holder)\s*:\s*[A-Z][a-z]/i.test(text)
    || /\bdear\s+(mr|ms|mrs|dr)\.?\s+[A-Z][a-z]+/i.test(text);
  if (hasNamedContractParty && identifierTypeCount >= 1 && ruleData.paymentRedFlags.length === 0 && riskScore < 25) {
    conf += 7;
  }

  // Positive: template contract with named-party placeholder (blank line after role label).
  // Legitimate service agreements (gym memberships, leases, subscriptions) use "Member Name: ___"
  // or "Customer Name: _____" as a template field. This signals a real business contract form,
  // not a scam document. Only fires when risk is low and no payment red flags are present.
  const hasContractTemplatePlaceholder =
    /\b(member|customer|client|borrower|tenant|subscriber|employee|renter)\s+(name|:)\s*:?\s*_{3,}/i.test(text)
    || /\b(member|customer|client)\s+name\s*:\s*\n/im.test(text);
  if (hasContractTemplatePlaceholder && ruleData.paymentRedFlags.length === 0 && riskScore < 25) {
    conf += 6;
  }

  // Negative: generic greeting
  if (/\bdear\s+(valued\s+)?(customer|resident|account\s+holder|homeowner|recipient)|to\s+whom\s+it\s+may\s+concern/i.test(lower)) conf -= 10;
  // Negative: no contact info at all
  if (ruleData.phones.length === 0 && ruleData.emails.length === 0 && ruleData.urls.length === 0 && bareDomainsFound.length === 0) conf -= 12;
  // Negative: suspicious payment methods
  if (ruleData.paymentRedFlags.length > 0) conf -= 15;
  // Negative: high authenticity risk
  if (riskScore >= 75) conf -= 25;
  else if (riskScore >= 50) conf -= 15;
  else if (riskScore >= 25) conf -= 5;

  return Math.round(Math.max(0, Math.min(100, conf)));
}

function parsePdfDate(raw: string): Date | null {
  const m = raw.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
}

function inspectPdfMetadata(info: Record<string, string>): TrustCheckMetadataFinding[] {
  const findings: TrustCheckMetadataFinding[] = [];

  const producer = (info.Producer || "").trim();
  const creator = (info.Creator || "").trim();
  const author = (info.Author || "").trim();
  const creationDate = parsePdfDate(info.CreationDate || "");
  const modDate = parsePdfDate(info.ModDate || "");
  const now = new Date();

  // Flag graphics/image-editing software as producer for a document
  const editingSoftware = /gimp|photoshop|inkscape|canva|paint/i;
  if (editingSoftware.test(producer) || editingSoftware.test(creator)) {
    findings.push({
      field: "PDF Producer",
      value: producer || creator,
      note: "This PDF was produced by image-editing or design software, which is unusual for an official notice or contract. Legitimate documents are typically produced by word processors or official document systems.",
      suspicious: true,
    });
  } else if (producer) {
    findings.push({
      field: "PDF Producer",
      value: producer,
      note: editingSoftware.test(producer) ? "Produced by graphics software — unusual for an official document" : "Software that generated this PDF",
      suspicious: false,
    });
  }

  if (creator && creator !== producer) {
    findings.push({ field: "Authoring Tool", value: creator, note: "Application used to create the original document", suspicious: false });
  }

  if (creationDate) {
    const yearDiff = now.getFullYear() - creationDate.getFullYear();
    const isFuture = creationDate > now;
    const isTooOld = yearDiff > 10;
    const createdStr = creationDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (isFuture) {
      findings.push({ field: "Creation Date", value: createdStr, note: "Creation date is set in the future, which is implausible and may suggest metadata manipulation.", suspicious: true });
    } else if (isTooOld) {
      findings.push({ field: "Creation Date", value: createdStr, note: "Creation date is unusually old — verify whether this matches the document's claimed date.", suspicious: true });
    } else {
      findings.push({ field: "Creation Date", value: createdStr, note: "Date this PDF was first created", suspicious: false });
    }
  }

  if (modDate && creationDate) {
    const gapMs = modDate.getTime() - creationDate.getTime();
    const gapDays = Math.round(gapMs / (1000 * 60 * 60 * 24));
    const modStr = modDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (gapDays > 30) {
      findings.push({
        field: "Last Modified",
        value: `${modStr} (${gapDays} days after creation)`,
        note: `This PDF was modified ${gapDays} days after it was originally created. Significant post-creation modification may indicate the document was altered — verify against an original source if possible.`,
        suspicious: true,
      });
    } else if (gapDays > 0) {
      findings.push({ field: "Last Modified", value: modStr, note: "PDF was modified shortly after creation, which is normal during document preparation.", suspicious: false });
    }
  } else if (modDate && !creationDate) {
    const modStr = modDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    findings.push({ field: "Last Modified", value: modStr, note: "Modification date present but no creation date found.", suspicious: false });
  }

  if (author) {
    findings.push({ field: "Author", value: author, note: "Person or system recorded as the document author", suspicious: false });
  }

  // Flag entirely empty metadata for a document that claims to be institutional
  const hasAnyMeta = producer || creator || author || creationDate;
  if (!hasAnyMeta) {
    findings.push({
      field: "Metadata",
      value: "None present",
      note: "This PDF has no embedded metadata (no producer, author, or creation date). While this can occur with some PDF generators, it may also indicate the metadata was deliberately stripped — unusual for official institutional documents.",
      suspicious: true,
    });
  }

  return findings;
}

function detectStructuralIssues(
  text: string,
  lower: string,
  ruleData: ExtractedRuleData,
): string[] {
  const issues: string[] = [];

  // 1. Generic greeting + specific dollar amount + payment red flag
  const hasGenericGreeting = /\bdear\s+(valued\s+)?(customer|resident|account\s+holder|homeowner|recipient)|to\s+whom\s+it\s+may\s+concern/i.test(lower);
  if (hasGenericGreeting && ruleData.amounts.length > 0 && ruleData.paymentRedFlags.length > 0) {
    issues.push("Generic greeting ('Dear Valued Customer' or similar) combined with a specific dollar amount and payment demand — legitimate institutions typically address customers by name");
  }

  // 2. Payment demand with no traceable reference number
  // Broad pattern covers: "Account Number: X", "Account: X", "Ref #X", "Case No. X", "Member Account #X",
  // "Membership #: X", "Account ID: X", "Subscriber ID: X", etc.
  // Expanded in Tuning Round 3 to match identifier patterns common in consumer agreements.
  // Tuning Round 5 — P3: Expanded identifier detection to eliminate false "no reference number"
  // structural findings. Added recognition for: Case ID (IRS/federal notices), File No. / File Number
  // (debt collection), Parcel Ref / Parcel No. / Parcel # (tax/county notices), and Claim #.
  const hasRefNumber =
    /\b(account\s*(number|#|no\.?|id|identifier)|case\s*(number|#|no\.?|id|identifier)|file\s*(number|#|no\.?)|reference\s*(number|#|no\.?)|invoice\s*(number|#|no\.?)|confirmation\s*(number|#|no\.?)|notice\s*(number|#|no\.?)|member\s*(account|number|#|id)|membership\s*(number|#|no\.?)|subscriber\s*(id|number|#)|loan\s*(number|#|no\.?)|policy\s*(number|#|no\.?)|contract\s*(number|#|no\.?)|claim\s*(number|#|no\.?)|parcel\s*(number|#|no\.?|ref|id))\s*:?\s*[\w\-]+/i.test(text)
    // Also catch bare labels: "Account: 78-2934-16", "Ref: XYZ", "Acct #12345", "File No.: HRS-882014"
    || /\bAccount\s*:\s*[\w\-]{3,}/i.test(text)
    || /\bRef(?:erence)?\s*(?:no\.?|#|:)\s*[\w\-]{3,}/i.test(text)
    || /\bMember\s+(?:Account|ID)\s*(?:no\.?|#|:)?\s*[\w\-]{3,}/i.test(text)
    || /\bAcct\.?\s*(?:no\.?|#|:)?\s*[\w\-]{3,}/i.test(text)
    // Tuning Round 5 — P3: catch "Case ID: XYZ", "File No.: ABC", "Parcel Ref: 123", "Claim #: 456"
    || /\bCase\s+ID\s*:?\s*[\w\-]{3,}/i.test(text)
    || /\bFile\s+No\.?\s*:?\s*[\w\-]{3,}/i.test(text)
    || /\bParcel\s+(?:Ref|No\.?|#|ID)\s*:?\s*[\w\-]{3,}/i.test(text)
    || /\bClaim\s+(?:#|No\.?|Number)\s*:?\s*[\w\-]{3,}/i.test(text);
  const hasMeaningfulAmount = ruleData.amounts.length > 0;
  const hasThreatOrPayment = ruleData.paymentRedFlags.length > 0 || ruleData.threatPhrases.some((t) => ["collections", "collection agency", "debt collector", "lawsuit", "legal action", "eviction"].includes(t));
  if (hasMeaningfulAmount && hasThreatOrPayment && !hasRefNumber) {
    issues.push("Payment or legal action demanded without any traceable reference number, account number, or case number — legitimate institutions typically include at least one verifiable identifier");
  }

  // 3. Email domain / URL domain mismatch
  if (ruleData.emails.length > 0 && ruleData.urls.length > 0) {
    const emailDomains = ruleData.emails.map((e) => (e.split("@")[1] || "").toLowerCase().replace(/^www\./, "")).filter(Boolean);
    const urlDomains = ruleData.urls.map((u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } }).filter(Boolean);
    const hasMatch = emailDomains.some((ed) => urlDomains.some((ud) => ud.includes(ed) || ed.includes(ud)));
    if (!hasMatch && emailDomains.length > 0 && urlDomains.length > 0) {
      issues.push(`Contact email domain (${emailDomains[0]}) does not appear to match the URL domain referenced in the document (${urlDomains[0]}) — verify both belong to the same organization before acting`);
    }
  }

  // 4. Three or more distinct area codes claiming to be from one organization
  if (ruleData.phones.length >= 3) {
    const areaCodes = ruleData.phones.map((p) => p.replace(/\D/g, "").slice(0, 3));
    const unique = [...new Set(areaCodes)];
    if (unique.length >= 3) {
      issues.push(`Multiple different phone area codes found (${unique.slice(0, 3).join(", ")}) — unusual if all numbers belong to the same organization's contact block`);
    }
  }

  // 5. Instruction to not contact official channels (social engineering)
  if (/do\s+not\s+contact\s+the|do\s+not\s+call\s+the\s*(irs|fbi|police|main\s+office|official)|avoid\s+contacting|do\s+not\s+discuss\s+(this|the)/i.test(lower)) {
    issues.push("Document instructs the recipient not to contact official authorities or the organization's main office — this is a known social engineering tactic used to prevent independent verification");
  }

  // 6. Wire transfer to a named third-party bank
  if (/wire\s+(funds|transfer|payment|money)\s+(to|immediately)/i.test(lower)) {
    const bankMatch = text.match(/at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:Bank|Holdings|Financial|Trust|Credit\s+Union))/);
    if (bankMatch) {
      issues.push(`Wire transfer instructed to what may be a third-party financial entity (${bankMatch[1]}) — verify the wire destination belongs to the claimed sender before transferring any funds`);
    }
  }

  // 7. Settlement offer with a very short expiry (≤ 5 days) combined with a payment red flag
  if (/\bsettle\b.*\b(offer|amount)\b|\b(settlement|reduced|discounted)\s+(offer|amount|payment)\b/i.test(lower) &&
      /\b[1-5]\s*days?\b/i.test(lower) && ruleData.paymentRedFlags.length > 0) {
    issues.push("Short-expiry settlement offer (5 days or fewer) combined with a non-standard payment method — this pressure combination is common in fraudulent collection attempts");
  }

  // 8. Free / personal email provider used as sender contact for a claimed official or legal notice
  const hasFreeEmailInDoc = ruleData.emails.some((e) =>
    /@(gmail|yahoo|hotmail|outlook\.com|aol|icloud|protonmail|mail\.com|yandex|live\.com)\./i.test(e)
  );
  const looksOfficial = /\b(notice|official|government|federal|irs|fbi|treasury|court|department\s+of|ministry|bureau|commissioner|attorney\s+general|police\s+department|sheriff)\b/i.test(lower);
  if (hasFreeEmailInDoc && looksOfficial) {
    const freeEmail = ruleData.emails.find((e) => /@(gmail|yahoo|hotmail|outlook\.com|aol|icloud|protonmail|mail\.com|yandex|live\.com)\./i.test(e))!;
    issues.push(`Contact email (${freeEmail}) uses a free personal email provider — government agencies, courts, and official institutions never use Gmail, Yahoo, or similar services for formal communications`);
  } else if (hasFreeEmailInDoc && (ruleData.paymentRedFlags.length > 0 || ruleData.threatPhrases.length > 0)) {
    const freeEmail = ruleData.emails.find((e) => /@(gmail|yahoo|hotmail|outlook\.com|aol|icloud|protonmail|mail\.com|yandex|live\.com)\./i.test(e))!;
    issues.push(`Sender contact email (${freeEmail}) is a free personal email address, which is inconsistent with a formal legal notice, collection demand, or institutional communication`);
  }

  // 9. Advance fee / 419 fraud structural pattern
  // Promising a large payout (inheritance, lottery, prize) but requiring a fee first is the
  // defining characteristic of advance-fee fraud — never present in legitimate communications.
  const hasAdvanceFeeSignal = /\b(inheritance|unclaimed\s+(funds|money|prize)|winning(s)?|lottery|beneficiary)\b/i.test(lower);
  const hasFeeDemand = ruleData.paymentRedFlags.some((f) =>
    ["processing fee", "release fee", "clearance fee", "customs fee",
     "administrative fee to release", "insurance fee to release"].some((k) => f.includes(k))
  );
  if (hasAdvanceFeeSignal && hasFeeDemand) {
    issues.push("Document promises a large sum (inheritance, winnings, or unclaimed funds) but requires a fee payment before the funds can be released — this is the defining structure of advance-fee (419) fraud");
  }

  // 10. Prize / lottery claim without prior entry — unsolicited winning notifications are a scam hallmark
  const hasPrizeWinClaim = /\b(you\s+have\s+(won|been\s+selected\s+(as\s+a\s+)?winner)|prize\s+winner|winning\s+notification|lucky\s+draw\s+winner|selected\s+as\s+a\s+(lucky|grand)\s+winner)\b/i.test(lower);
  if (hasPrizeWinClaim && (ruleData.paymentRedFlags.length > 0 || ruleData.infoRequests.length > 0 || ruleData.urgencyPhrases.length > 0)) {
    issues.push("Document claims the recipient has won a prize or been selected as a winner, combined with a request for payment or personal information — unsolicited winning notifications combined with demands are a well-known scam pattern");
  }

  // 11. OTP / verification code sharing request
  // No legitimate institution asks you to read back a security code they sent you.
  const hasOtpRequest = ruleData.infoRequests.some((r) => ["one-time code", "verification code", "otp"].some((k) => r.includes(k)));
  if (hasOtpRequest) {
    issues.push("Document or message requests a one-time code, OTP, or verification code — legitimate senders never ask recipients to share security codes that were sent to them, as this is exclusively used to bypass two-factor authentication");
  }

  // 12. Excessive urgency — four or more pressure phrases in one document is structurally abnormal
  if (ruleData.urgencyPhrases.length >= 4) {
    issues.push(`Document contains ${ruleData.urgencyPhrases.length} urgency phrases (e.g. "${ruleData.urgencyPhrases.slice(0, 2).join('", "')}"...) — legitimate institutions rarely stack this many pressure terms; this density of urgency language is a social engineering pattern used to prevent calm verification`);
  }

  // 13. Overpayment / fake check refund request
  // The overpayment scam always requires sending back "excess" via a fast, non-reversible channel.
  const hasOverpaymentRefundSignal = /\b(overpayment|over-payment|excess\s+(funds|amount|payment)|mistakenly\s+sent|accidentally\s+(sent|transferred|deposited))\b/i.test(lower);
  const hasReturnDemand = /\b(send\s+back|wire\s+back|return\s+(the\s+)?(difference|excess|overpayment|funds|amount)|refund\s+(the\s+)?(overpayment|difference|excess))\b/i.test(lower);
  if (hasOverpaymentRefundSignal && hasReturnDemand) {
    issues.push("Document claims an overpayment was made and asks the recipient to return the difference — this is the defining pattern of fake check / overpayment fraud, where a deposited check later bounces leaving the victim liable for the returned amount");
  }

  return issues;
}

const TRUST_CHECK_SYSTEM_PROMPT = `You are PlainPath Trust Check, a document risk analysis engine that helps people evaluate suspicious letters, notices, and contracts across three dimensions: authenticity risk, document/contract risk, and verification confidence.

CRITICAL — Use risk-based language only. Never claim certainty.
ALLOWED: "appears to", "may indicate", "suggests", "could be", "shows signs of", "likely", "suspicious", "cannot confirm", "cannot verify", "appears structurally inconsistent"
FORBIDDEN: "definitely fake", "is a scam", "is fraud", "proven fraud", "legally invalid", "certainly fraudulent"

Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON.

{
  "verdictExplanation": "string - 2-4 sentences explaining the primary risk level using risk-based language. Distinguish between authenticity concerns (scam/impersonation risk) and contract-term concerns — do not conflate the two.",
  "whatItClaims": "string - 2-4 sentences: what organization or authority this document claims to be from, and what situation it describes",
  "demandedAction": "string - 2-4 sentences: what the letter/contract asks the recipient to do — pay, call, respond, sign, provide information, etc.",
  "scamIndicators": [
    {
      "indicator": "string - clear description of the authenticity or scam-risk signal",
      "severity": "high|medium|low",
      "sourceEvidence": "string - brief quote or paraphrase from the document supporting this indicator"
    }
  ],
  "structuralFindings": [
    "string - a text-observable structural or logical anomaly in this document. Examples: tone shift between sections, contradictory issuer identity across header/body/footer, math/date inconsistency, abrupt change in formality, conflicting payment instructions. CRITICAL: Only include findings you can directly support from the document text. Never claim a document is missing an account number, reference number, contact detail, or physical address if the rule system has confirmed one is present — rule-confirmed facts take priority over AI inferences. Leave array empty if no genuine anomalies detected."
  ],
  "suspiciousContactNotes": [
    "string - a note ONLY for contacts with a specific reason to be flagged — wrong domain for claimed brand, non-standard number for a known institution, 555 placeholder number, short URL. Leave EMPTY for low-risk or legitimate-appearing documents. Do NOT include routine contacts or generate notes purely as generic caution."
  ],
  "whatToVerify": [
    "string - one specific thing to independently verify before taking action"
  ],
  "safeNextSteps": [
    "string - one concrete safe action"
  ],
  "legitimacyIndicators": [
    "string - a specific observable signal that supports the document's authenticity or legitimacy. Examples: references a specific account/member/case number that matches the claimed sender; uses officially-listed payment channels (website, mail, in-person); no suspicious or untraceable payment methods; deadlines are specific calendar dates rather than extreme urgency threats; contact details match known official sources; document structure matches known legitimate format for this document type; sender can be independently verified. Only include genuinely positive signals you can directly support from the document text or rule-extracted data. Leave EMPTY for clearly fraudulent documents."
  ],
  "contractRiskNotes": "string or null — ONLY populate when the document is a binding legal agreement (loan contract, lease, service agreement, employment contract, gym membership, subscription, financing agreement, or any commitment requiring payment or performance) AND it contains potentially harmful consumer terms. Harmful terms include: high default/penalty APR or compounded interest accrual, mandatory arbitration or class-action waiver, repossession or acceleration clauses, deficiency balance exposure, force-placed insurance, GPS/starter-interrupt devices, balloon payments, blanket liens, prepayment penalties, early termination or cancellation fees, auto-renewal or continuous billing traps, credit bureau reporting threats, collections referral, one-sided termination rights, liquidated damages, or non-refundable clause combinations. Write 2-4 sentences in plain language explaining the specific risks. These are CONTRACT risks — distinct from scam/authenticity concerns. A contract can be entirely authentic yet contain provisions that significantly harm the consumer. Return null if not a binding agreement or no significant harmful terms."
}

Guidelines:
- scamIndicators: 0-8 warning signs mapped to authenticity/scam risk only (not contract terms). HIGH: gift card/wire/crypto payment demand, threats of arrest or deportation, identity info requests, OTP/verification code requests, advance fee demands ("pay a fee to release your funds"), prize/lottery winning claims, fake check/overpayment refund requests, impersonation signals, instructions to not contact authorities, overseas-sender patterns; MEDIUM: time pressure, missing case/account numbers for a payment demand, vague sender identity, free email provider (gmail/yahoo/hotmail) used as official contact, excessive urgency density; LOW: generic greetings, formatting inconsistencies, grammar errors
- structuralFindings: only include text-provable anomalies. Typical findings: sender name in header doesn't match signature block, email domain differs from URL domain, a payment is demanded but no account/case/reference number exists, dates are inconsistent or illogical, abrupt formality shift between sections, a wire transfer to a third-party named bank
- suspiciousContactNotes: only flag contacts with a specific evidentiary reason
- whatToVerify: 3-6 specific verification steps. Always include: verify sender identity through official public channels (not numbers in the letter)
- safeNextSteps: 4-6 safe actions. Always include: verify through official website, do not call numbers in the letter until verified, do not pay until independently confirmed, preserve the document
- contractRiskNotes: separate analytical dimension from scam detection. Analyze for consumer-harmful contract terms regardless of whether the document appears legitimate or fraudulent. Keep factual and non-alarming.
- Keep language practical. Help the person stay safe without causing unnecessary panic.`;

async function runTrustCheckAnalysis(
  text: string,
  ruleData: ExtractedRuleData,
  riskScore: number,
  verdict: TrustCheckVerdict,
  pdfMetadata?: Record<string, string>,
): Promise<TrustCheckAnalysis> {
  const lower = text.toLowerCase();

  const documentRisk = calculateDocumentRiskScore(ruleData.contractRiskTerms);
  const verificationConfidence = calculateVerificationConfidence(text, lower, ruleData, riskScore);
  // Refine the verdict using both authenticity risk AND verification confidence.
  // This prevents low-auth-risk documents with weak/partial confidence from being
  // prematurely cleared as "Likely legitimate".
  const finalVerdict = resolveVerdict(riskScore, verificationConfidence);
  const scores: TrustCheckScores = { authenticityRisk: riskScore, documentRisk, verificationConfidence };

  const metadataFindings: TrustCheckMetadataFinding[] | undefined =
    pdfMetadata ? inspectPdfMetadata(pdfMetadata) : undefined;

  const ruleStructuralIssues = detectStructuralIssues(text, lower, ruleData);

  const metadataContext = metadataFindings && metadataFindings.length > 0
    ? `\n- PDF Metadata findings:\n${metadataFindings.map((f) => `  [${f.suspicious ? "SUSPICIOUS" : "info"}] ${f.field}: ${f.value} — ${f.note}`).join("\n")}`
    : "\n- PDF metadata: not available (pasted text or metadata stripped)";

  const ruleStructuralContext = ruleStructuralIssues.length > 0
    ? `- Rule-detected structural issues (ALREADY REPORTED — do NOT repeat these in structuralFindings):\n${ruleStructuralIssues.map((r) => `  • ${r}`).join("\n")}`
    : `- Rule-detected structural issues: none`;

  // Build confirmed-identifier list so AI structural findings cannot contradict confirmed rule evidence (Tuning Round 1)
  const confirmedIdentifiers: string[] = [];
  if (ruleData.phones.length > 0) confirmedIdentifiers.push(`phone number(s): ${ruleData.phones.join(", ")}`);
  if (ruleData.emails.length > 0) confirmedIdentifiers.push(`email address(es): ${ruleData.emails.join(", ")}`);
  if (ruleData.urls.length > 0) confirmedIdentifiers.push(`URL(s): ${ruleData.urls.join(", ")}`);
  if (/\b(account\s*(number|#|no\.?)|case\s*(number|#|no\.?)|reference\s*(number|#|no\.?)|invoice\s*(number|#|no\.?)|confirmation\s*(number|#|no\.?)|notice\s*(number|#|no\.?)|member\s*(number|#|id)|loan\s*(number|#|no\.?))\s*:?\s*[\w\-]+/i.test(text)) confirmedIdentifiers.push("account/reference/case/member number");
  if (/\b\d{1,5}\s+[A-Za-z]+\s+(street|st|avenue|ave|boulevard|blvd|drive|dr|road|rd|lane|ln|way|court|ct|place|pl|suite|ste)\b/i.test(text)) confirmedIdentifiers.push("physical street address");
  const confirmedIdContext = confirmedIdentifiers.length > 0
    ? `- Rule-confirmed document identifiers (FACTS — do NOT claim these are absent in structuralFindings):\n${confirmedIdentifiers.map((id) => `  ✓ ${id}`).join("\n")}`
    : `- Rule-confirmed document identifiers: none detected`;

  const ruleContext = [
    `Rule-extracted data:`,
    `- Phone numbers found: ${ruleData.phones.join(", ") || "none"}`,
    `- Email addresses found: ${ruleData.emails.join(", ") || "none"}`,
    `- URLs found: ${ruleData.urls.join(", ") || "none"}`,
    `- Dates found: ${ruleData.dates.join(", ") || "none"}`,
    `- Currency amounts found: ${ruleData.amounts.join(", ") || "none"}`,
    `- Urgency phrases detected: ${ruleData.urgencyPhrases.join(", ") || "none"}`,
    `- Threat phrases detected: ${ruleData.threatPhrases.join(", ") || "none"}`,
    `- Payment method red flags: ${ruleData.paymentRedFlags.join(", ") || "none"}`,
    `- Sensitive info requests: ${ruleData.infoRequests.join(", ") || "none"}`,
    `- Contract risk terms detected: ${ruleData.contractRiskTerms.join(", ") || "none"}`,
    `- Rule-based authenticity risk score: ${riskScore}/100 → ${finalVerdict}`,
    `- Rule-based document risk score: ${documentRisk}/100`,
    `- Rule-based verification confidence score: ${verificationConfidence}/100`,
    confirmedIdContext,
    ruleStructuralContext,
    metadataContext,
  ].join("\n");

  const structuralInstruction = ruleStructuralIssues.length > 0
    ? `\n\nIMPORTANT for structuralFindings: The rule system has already detected ${ruleStructuralIssues.length} structural issue(s) listed above. Do NOT duplicate or paraphrase those. Your structuralFindings array should ONLY contain genuinely new observations not covered by the rule-detected list — such as tone shifts between sections, contradictory issuer names or dates across the document, math inconsistencies, or conflicting payment instructions. NEVER claim a document lacks an identifier (account number, reference number, physical address, contact info) that the rule system has already confirmed is present. Leave structuralFindings empty if the rule system already covered everything significant.`
    : `\n\nIMPORTANT for structuralFindings: NEVER claim a document lacks an identifier (account number, reference number, physical address, contact info) that the rule system has confirmed is present in the rule-confirmed identifiers section above. Only include structural observations you can directly support from the document text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      { role: "system", content: TRUST_CHECK_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this document for trust and risk:\n\n${ruleContext}\n\n---\n\nDocument text:\n${text}${structuralInstruction}`,
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) throw new Error("No response from trust-check engine");

  let parsed: any;
  try {
    const cleaned = rawContent.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Trust-check engine returned an unparseable response");
  }

  const suspiciousNotes: string[] = Array.isArray(parsed.suspiciousContactNotes)
    ? parsed.suspiciousContactNotes
    : [];

  const contactDetails: TrustCheckContactDetail[] = [];
  for (const phone of ruleData.phones) {
    const isSuspicious = riskScore >= 50 || suspiciousNotes.some((n) => n.includes(phone));
    const aiNote = suspiciousNotes.find((n) => n.includes(phone));
    contactDetails.push({
      type: "phone",
      value: phone,
      suspicious: isSuspicious,
      note: aiNote ?? (isSuspicious
        ? "Verify this number through the sender's official website before calling"
        : "Confirm this number matches the sender's official contact information"),
    });
  }
  for (const email of ruleData.emails) {
    const isSuspicious = riskScore >= 50 || suspiciousNotes.some((n) => n.includes(email));
    const aiNote = suspiciousNotes.find((n) => n.includes(email));
    contactDetails.push({
      type: "email",
      value: email,
      suspicious: isSuspicious,
      note: aiNote ?? (isSuspicious
        ? "Verify this email domain belongs to the official sender before responding"
        : "Confirm this email address matches the sender's official contact details"),
    });
  }
  for (const url of ruleData.urls) {
    const isShortUrl = /bit\.ly|tinyurl|goo\.gl|t\.co|rebrand\.ly/i.test(url);
    const isSuspicious = isShortUrl || riskScore >= 50 || suspiciousNotes.some((n) => n.includes(url));
    const aiNote = suspiciousNotes.find((n) => n.includes(url));
    contactDetails.push({
      type: "url",
      value: url,
      suspicious: isSuspicious,
      note: isShortUrl
        ? "Short/redirected URL — verify the destination before visiting"
        : aiNote ?? (isSuspicious
          ? "Verify this URL matches the sender's official website before clicking"
          : "Confirm this is the sender's official website before entering any information"),
    });
  }

  const deadlines: TrustCheckDeadlineItem[] = [];
  for (const date of ruleData.dates) {
    deadlines.push({ text: date, type: "explicit_date" });
  }
  // Only classify urgency phrases as "threat" when suspicious payment methods are
  // also present — this prevents legitimate legal/collection language from being
  // incorrectly labelled THREAT in the UI.
  const hasSuspiciousPayment = ruleData.paymentRedFlags.length > 0;
  for (const phrase of ruleData.urgencyPhrases) {
    deadlines.push({ text: phrase, type: hasSuspiciousPayment ? "threat" : "relative" });
  }

  const scamIndicators: TrustCheckScamIndicator[] = Array.isArray(parsed.scamIndicators)
    ? parsed.scamIndicators.map((si: any) => ({
        indicator: si.indicator || "",
        severity: (si.severity as "high" | "medium" | "low") || "medium",
        sourceEvidence: si.sourceEvidence,
      }))
    : [];

  const contractRiskNotes =
    typeof parsed.contractRiskNotes === "string" && parsed.contractRiskNotes.trim()
      ? parsed.contractRiskNotes.trim()
      : undefined;

  const aiStructuralFindings: string[] = Array.isArray(parsed.structuralFindings)
    ? parsed.structuralFindings.filter((s: unknown) => typeof s === "string" && (s as string).trim().length > 0)
    : [];

  // Deduplicate AI structural findings against rule-based ones using topic keyword matching.
  // Each rule finding is tagged with keywords; if an AI finding shares 2+ keywords with a rule
  // finding, it's considered a duplicate and excluded.
  const STRUCTURAL_TOPIC_KEYWORDS: string[][] = [
    ["generic greeting", "dear valued", "valued customer", "dear resident", "dear account holder"],
    ["reference number", "account number", "case number", "traceable identifier", "verifiable identifier"],
    ["email domain", "url domain", "domain mismatch", "domain does not match"],
    ["area code", "phone area", "multiple.*phone"],
    ["contact official", "do not contact", "contact authorities", "main office", "power company"],
    ["wire transfer", "third-party", "third party bank", "first national"],
    ["short-expiry", "settlement offer", "western union", "5 days", "7 days"],
  ];

  function aiOverlapsWithRule(ai: string): boolean {
    const aiLower = ai.toLowerCase();
    return STRUCTURAL_TOPIC_KEYWORDS.some((keywords) =>
      keywords.filter((kw) => aiLower.includes(kw)).length >= 1 &&
      ruleStructuralIssues.some((rule) => {
        const ruleLower = rule.toLowerCase();
        return keywords.filter((kw) => ruleLower.includes(kw)).length >= 1;
      })
    );
  }

  const allStructuralFindings = [
    ...ruleStructuralIssues,
    ...aiStructuralFindings.filter((ai) => !aiOverlapsWithRule(ai)),
  ];

  const significantMetadataFindings = metadataFindings?.filter((f) => f.suspicious) ?? [];

  const legitimacyIndicators: string[] = Array.isArray(parsed.legitimacyIndicators)
    ? parsed.legitimacyIndicators.filter((s: unknown) => typeof s === "string" && (s as string).trim().length > 0)
    : [];

  return {
    id: uuidv4(),
    processedAt: new Date().toISOString(),
    riskScore,
    verdict: finalVerdict,
    verdictExplanation: parsed.verdictExplanation || "",
    whatItClaims: parsed.whatItClaims || "",
    demandedAction: parsed.demandedAction || "",
    scamIndicators,
    legitimacyIndicators: legitimacyIndicators.length > 0 ? legitimacyIndicators : undefined,
    contactDetails,
    deadlines,
    whatToVerify: Array.isArray(parsed.whatToVerify) ? parsed.whatToVerify : [],
    safeNextSteps: Array.isArray(parsed.safeNextSteps) ? parsed.safeNextSteps : [],
    contractRiskNotes,
    contractTermsFound: ruleData.contractRiskTerms.length > 0 ? ruleData.contractRiskTerms : undefined,
    scores,
    metadataFindings: significantMetadataFindings.length > 0 ? significantMetadataFindings : undefined,
    structuralFindings: allStructuralFindings.length > 0 ? allStructuralFindings : undefined,
  };
}

async function extractTextFromBuffer(
  file: Express.Multer.File,
): Promise<{ text: string; title: string; pdfMetadata?: Record<string, string>; error?: { status: number; body: object } }> {
  const mime = file.mimetype ?? "";
  const originalName = (file.originalname ?? "").toLowerCase();
  const title = file.originalname.replace(/\.[^.]+$/, "");

  if (mime === "application/pdf" || originalName.endsWith(".pdf")) {
    let pdfText: string | null = null;
    let parseErr: string | null = null;
    try {
      const pdfResult = await parsePdfWithLimits(file.buffer);
      pdfText = pdfResult.text ?? null;
    } catch (err) {
      if (err instanceof ParseResourceLimitError) {
        return { text: "", title, error: { status: 400, body: { error: "document_too_large", message: err.message } } };
      }
      parseErr = err instanceof Error ? err.message : String(err);
    }
    if (parseErr !== null) {
      return { text: "", title, error: { status: 422, body: { error: "corrupt_pdf", message: "This PDF could not be read. It may be corrupted or password-protected. Please try a different file, or copy and paste the text instead." } } };
    }
    if (!pdfText || !pdfText.trim()) {
      return { text: "", title, error: { status: 422, body: { error: "scanned_pdf", message: "This PDF appears to contain only images (scanned document). PlainPath cannot read image-based PDFs — please copy and paste the text instead." } } };
    }
    return { text: pdfText, title };
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    originalName.endsWith(".docx")
  ) {
    try {
      const text = await parseDocxWithLimits(file.buffer);
      if (!text.trim()) {
        return { text: "", title, error: { status: 422, body: { error: "empty_docx", message: "This Word document appears to be empty or contains no readable text. Please paste the text instead." } } };
      }
      return { text, title };
    } catch (err) {
      if (err instanceof ParseResourceLimitError) {
        return { text: "", title, error: { status: 400, body: { error: "document_too_large", message: (err as Error).message } } };
      }
      return { text: "", title, error: { status: 422, body: { error: "unreadable_docx", message: "Could not read this Word document. It may be corrupted. Please try re-saving it as a .docx or paste the text instead." } } };
    }
  }

  if (mime === "text/plain" || originalName.endsWith(".txt")) {
    const text = file.buffer.toString("utf-8");
    if (!text.trim()) {
      return { text: "", title, error: { status: 422, body: { error: "empty_txt", message: "This text file appears to be empty. Please check the file and try again." } } };
    }
    return { text, title };
  }

  return { text: "", title, error: { status: 400, body: { error: "unsupported_type", message: "Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file." } } };
}

router.post("/trust-check", requireEntitlement("trust-check"), async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length < 30) {
    return res.status(400).json({ error: "too_short", message: "Please paste more of the document — PlainPath needs enough text to analyze for risk indicators." });
  }
  const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
  if (wordCount < 15) {
    return res.status(400).json({ error: "too_short", message: "Please paste more of the document. A sentence or two isn't enough — paste several paragraphs for an accurate risk assessment." });
  }
  if (text.length > 60000) {
    return res.status(400).json({ error: "text_too_long", message: "Document text is too long. Please limit to 60,000 characters." });
  }

  try {
    const lower = text.toLowerCase();
    const ruleData = extractRuleData(text);
    const riskScore = calculateRiskScore(ruleData, lower, text);
    const verdict = scoreToVerdict(riskScore);
    const analysis = await runTrustCheckAnalysis(text, ruleData, riskScore, verdict, undefined);
    return res.json({ analysis });
  } catch (error) {
    const isTimeout = error instanceof Error && (
      error.name === "AbortError" ||
      error.message.toLowerCase().includes("timeout") ||
      error.message.toLowerCase().includes("timed out")
    );
    if (isTimeout) return res.status(504).json({ error: "analysis_timeout", message: "Analysis is taking too long. Please try again — shorter documents process faster." });
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isService = msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("overloaded");
    if (isService) return res.status(503).json({ error: "service_unavailable", message: "The analysis service is temporarily busy. Please wait a moment and try again." });
    return res.status(500).json({ error: "trust_check_failed", message: "Trust check failed. Please try again." });
  }
});

router.post("/trust-check-upload", requireEntitlement("trust-check"), upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "no_file", message: "No file was uploaded." });

    const extracted = await extractTextFromBuffer(file);
    if (extracted.error) {
      const { status, body } = extracted.error;
      return res.status(status).json(body);
    }

    let text = extracted.text;
    if (text.length > 60000) text = text.slice(0, 60000);

    console.debug("[trust-check-upload] extracted", text.length, "chars from", file.originalname);

    try {
      const lower = text.toLowerCase();
      const ruleData = extractRuleData(text);
      const riskScore = calculateRiskScore(ruleData, lower, text);
      const verdict = scoreToVerdict(riskScore);
      const analysis = await runTrustCheckAnalysis(text, ruleData, riskScore, verdict, extracted.pdfMetadata);
      return res.json({ analysis });
    } catch (analysisError) {
      const msg = analysisError instanceof Error ? analysisError.message : String(analysisError);
      console.error("[trust-check-upload] analysis threw:", msg);
      const isTimeout = analysisError instanceof Error && (
        analysisError.name === "AbortError" ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("timed out")
      );
      if (isTimeout) return res.status(504).json({ error: "analysis_timeout", message: "Analysis is taking too long. Please try again — shorter documents process faster." });
      const isService = msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("overloaded");
      if (isService) return res.status(503).json({ error: "service_unavailable", message: "The analysis service is temporarily busy. Please wait a moment and try again." });
      return res.status(500).json({ error: "trust_check_failed", message: "Trust check failed. Please try again. If the problem continues, try pasting the document text instead." });
    }
  } catch (outerError) {
    const msg = outerError instanceof Error ? outerError.message : String(outerError);
    console.error("[trust-check-upload] unhandled error:", msg);
    return res.status(500).json({ error: "upload_failed", message: "Upload failed. Please try again." });
  }
});

router.get("/demo/:demoId", (req, res) => {
  const { demoId } = req.params;
  const demo = demoDocuments[demoId];
  if (!demo) {
    return res.status(404).json({
      error: "not_found",
      message: `Demo '${demoId}' not found. Available: event-permit, school-enrollment, grant-application`,
    });
  }
  return res.json({ analysis: demo });
});

router.get("/trust-check-demo/:demoId", (req, res) => {
  const { demoId } = req.params;
  const demo = trustCheckDemoDocuments[demoId];
  if (!demo) {
    return res.status(404).json({
      error: "not_found",
      message: `Trust check demo '${demoId}' not found. Available: fake-utility-shutoff, fake-irs-collection, debt-collection-letter, legitimate-utility-notice`,
    });
  }
  return res.json({ analysis: demo });
});

router.post("/explain-source-section", requireEntitlement("compare"), async (req, res) => {
  const { sectionContent, sectionTitle, documentTypeHint } = req.body;

  if (!sectionContent || typeof sectionContent !== "string" || sectionContent.trim().length < 10) {
    return res.status(400).json({ error: "invalid_input", message: "sectionContent is required." });
  }

  const hintLine = documentTypeHint ? `\nDocument category: ${documentTypeHint}` : "";
  const titleLine = sectionTitle ? `\nSection heading: "${sectionTitle}"` : "";
  const prompt = `You are PlainPath, a document explanation engine.
A user is reading a section of a legal, government, or administrative document and needs a plain-English breakdown.${hintLine}${titleLine}

Section text:
"""
${sectionContent.slice(0, 2000)}
"""

Return ONLY a valid JSON object with this exact structure:
{
  "meaning": "string - 2-3 sentences explaining what this section means in plain, everyday English",
  "requires": "string - 1-3 sentences on what this section specifically asks or requires from the reader, or 'Nothing specific is required from you in this section.' if none",
  "whyItMatters": "string - 1-2 sentences on why this section is important and what depends on it",
  "risks": "string - 1-3 sentences on any risks, obligations, hidden implications, or things that could go wrong — be specific and honest",
  "questionsToAsk": "string - 2-3 practical questions the reader should consider asking a professional or the issuing authority before agreeing to or signing anything"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) throw new Error("No response from explanation engine");

    const cleaned = rawContent.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    return res.json({
      explanation: {
        meaning: parsed.meaning || "",
        requires: parsed.requires || "",
        whyItMatters: parsed.whyItMatters || "",
        risks: parsed.risks || "",
        questionsToAsk: parsed.questionsToAsk || "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "explain_failed", message });
  }
});

router.post("/explain-section", requireEntitlement("compare"), async (req, res) => {
  const { sectionTitle, sectionContent, documentTypeHint } = req.body;

  if (!sectionContent || typeof sectionContent !== "string" || sectionContent.trim().length < 5) {
    return res.status(400).json({ error: "invalid_input", message: "sectionContent is required." });
  }

  const hintLine = documentTypeHint ? `\nDocument category: ${documentTypeHint}` : "";
  const prompt = `You are PlainPath, a document explanation engine.
A user is reading an action step from their analyzed document and needs a plain-English breakdown.${hintLine}

Action step: "${sectionTitle || "Step"}"
Description: "${sectionContent}"

Return ONLY a valid JSON object with this exact structure:
{
  "meaning": "string - 2-3 sentences explaining what this step means in everyday language",
  "requires": "string - 1-3 sentences explaining exactly what the user needs to do or gather",
  "risks": "string - 1-2 sentences on what could go wrong if this step is skipped or done incorrectly (or 'No specific risk identified.' if none)",
  "whyItMatters": "string - 1-2 sentences on why completing this step matters for the overall process"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) throw new Error("No response from explanation engine");

    const cleaned = rawContent.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    return res.json({
      explanation: {
        meaning: parsed.meaning || "",
        requires: parsed.requires || "",
        risks: parsed.risks || "",
        whyItMatters: parsed.whyItMatters || "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "explain_failed", message });
  }
});

router.post("/checklist", (req, res) => {
  const { itemId, itemType, completed } = req.body;
  if (!itemId || !itemType) {
    return res.status(400).json({ error: "invalid_input", message: "itemId and itemType are required" });
  }
  return res.json({ success: true, itemId, completed: Boolean(completed) });
});

// POST /api/documents/extract-text
// Extracts plain text from a PDF, DOCX, or TXT file without running analysis.
// Used by the Compare tool to load document text before diffing.
router.post("/extract-text", requireEntitlement("redact"), upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "no_file", message: "No file was uploaded." });
  }

  const mime = file.mimetype ?? "";
  const originalName = (file.originalname ?? "").toLowerCase();
  let extractedText = "";

  if (mime === "application/pdf" || originalName.endsWith(".pdf")) {
    try {
      const pdfResult = await parsePdfWithLimits(file.buffer);
      extractedText = pdfResult.text ?? "";
    } catch (err) {
      if (err instanceof ParseResourceLimitError) {
        return res.status(400).json({ error: "document_too_large", message: err.message });
      }
      return res.status(422).json({
        error: "corrupt_pdf",
        message: "This PDF could not be read. It may be corrupted or password-protected. Please paste the text instead.",
      });
    }
    if (!extractedText.trim()) {
      return res.status(422).json({
        error: "scanned_pdf",
        message: "This PDF appears to contain only images and cannot be read as text. Please paste the text instead.",
      });
    }
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    originalName.endsWith(".docx")
  ) {
    try {
      extractedText = await parseDocxWithLimits(file.buffer);
    } catch (err) {
      if (err instanceof ParseResourceLimitError) {
        return res.status(400).json({ error: "document_too_large", message: err.message });
      }
      return res.status(422).json({
        error: "unreadable_docx",
        message: "Could not read this Word document. Please paste the text instead.",
      });
    }
    if (!extractedText.trim()) {
      return res.status(422).json({
        error: "empty_docx",
        message: "This Word document appears to be empty.",
      });
    }
  } else if (mime === "text/plain" || originalName.endsWith(".txt")) {
    extractedText = file.buffer.toString("utf-8");
    if (!extractedText.trim()) {
      return res.status(422).json({ error: "empty_txt", message: "This text file appears to be empty." });
    }
  } else if (
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(originalName)
  ) {
    // ── Image OCR via OpenAI Vision ────────────────────────────────────────
    try {
      const openaiMod = await import("openai");
      const OpenAI = (openaiMod as any).default ?? openaiMod.OpenAI;
      const openai = new OpenAI();
      const b64 = file.buffer.toString("base64");
      const imageMediaType = (
        mime.startsWith("image/") ? mime : "image/jpeg"
      ) as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe ALL visible text from this image exactly as it appears. Include every word, number, address, name, date, and piece of information visible. Format it clearly as plain text. If there is no text, respond with '[no text found]'.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${imageMediaType};base64,${b64}`, detail: "high" },
              },
            ],
          },
        ],
      });
      extractedText = response.choices?.[0]?.message?.content?.trim() ?? "";
      if (!extractedText || extractedText === "[no text found]") {
        return res.status(422).json({
          error: "no_text_in_image",
          message: "No readable text was found in this image. Please upload an image with visible text, or paste the text directly.",
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[extract-text] OpenAI Vision error:", errMsg, "| file:", file.originalname);
      return res.status(500).json({
        error: "vision_failed",
        message: "Could not extract text from this image. Please try again or paste the text directly.",
      });
    }
  } else {
    return res.status(400).json({
      error: "unsupported_type",
      message: "Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), plain text (.txt), or image (JPG, PNG, WEBP).",
    });
  }

  if (extractedText.length > 60000) extractedText = extractedText.slice(0, 60000);
  return res.json({ text: extractedText, filename: file.originalname });
});

// Helper: scrub matching text from within PDF literal strings ( ) and hex strings < >
// in a raw (already-decompressed) content stream buffer. Returns a new buffer and
// a flag indicating whether any replacements were made.
function sanitizePdfContentStream(streamBytes: Buffer, values: string[]): { bytes: Uint8Array; changed: boolean } {
  const buf = Buffer.from(streamBytes); // mutable copy
  let changed = false;
  let i = 0;

  while (i < buf.length) {
    // ── Literal string: (text …) ─────────────────────────────────────────────
    if (buf[i] === 0x28 /* ( */) {
      i++;
      let depth = 1;
      const start = i;
      // Scan to the matching closing ')' respecting backslash escapes and nesting
      while (i < buf.length && depth > 0) {
        if (buf[i] === 0x5C /* \ */) { i += 2; continue; }
        if (buf[i] === 0x28) depth++;
        else if (buf[i] === 0x29) depth--;
        if (depth > 0) i++;
        else break;
      }
      const end = i; // buf[end] === ')'
      for (const value of values) {
        if (!value) continue;
        const vb = Buffer.from(value, "latin1");
        let p = start;
        while (p <= end - vb.length) {
          if (buf.slice(p, p + vb.length).equals(vb)) {
            buf.fill(0x20, p, p + vb.length); // overwrite with spaces
            changed = true;
            p += vb.length;
          } else {
            p++;
          }
        }
      }
      i++;
      continue;
    }

    // ── Hex string: <hexdigits> (not << which is a dict) ────────────────────
    if (buf[i] === 0x3C /* < */ && buf[i + 1] !== 0x3C) {
      const hexStart = i + 1;
      let j = hexStart;
      while (j < buf.length && buf[j] !== 0x3E /* > */) j++;
      const hexEnd = j; // buf[hexEnd] === '>'
      // Decode hex pairs, ignoring whitespace
      const hexStr = buf.slice(hexStart, hexEnd).toString("ascii").replace(/\s/g, "");
      if (hexStr.length > 0 && hexStr.length % 2 === 0) {
        const decoded = Buffer.from(hexStr, "hex");
        let hexChanged = false;
        for (const value of values) {
          if (!value) continue;
          const vb = Buffer.from(value, "latin1");
          let p = 0;
          while (p <= decoded.length - vb.length) {
            if (decoded.slice(p, p + vb.length).equals(vb)) {
              decoded.fill(0x20, p, p + vb.length);
              hexChanged = true;
              p += vb.length;
            } else {
              p++;
            }
          }
        }
        if (hexChanged) {
          // Re-encode to hex and write back into the buffer
          const newHex = decoded.toString("hex").toUpperCase();
          const newHexBuf = Buffer.from(newHex, "ascii");
          // Only safe to write back if the hex segment hasn't changed in length
          if (newHexBuf.length === hexEnd - hexStart) {
            newHexBuf.copy(buf, hexStart);
            changed = true;
          }
        }
      }
      i = hexEnd + 1;
      continue;
    }

    i++;
  }

  return { bytes: new Uint8Array(buf), changed };
}

// Sentinel error used to surface resource-limit violations from inner async
// functions (e.g. per-stream inflate helpers) back to the top-level handler.
class PdfResourceLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfResourceLimitError";
  }
}

// Hard limits for the redact-pdf route.
// These cap the work that a single attacker-controlled PDF can force the
// server to perform, regardless of the on-wire upload size.
const MAX_PDF_PAGES = 500;
const MAX_EXTRACTED_TEXT_BYTES = 10 * 1024 * 1024;      // 10 MB of extracted text
const MAX_DECOMPRESSED_STREAM_BYTES = 50 * 1024 * 1024; // 50 MB per stream (hard abort)

// Bounded streaming inflate — decompression is aborted as soon as the output
// exceeds `maxBytes`, preventing zip-bomb style exhaustion of CPU and memory.
// Throws PdfResourceLimitError if the limit is exceeded, otherwise resolves
// to the fully decompressed Buffer.
async function boundedInflate(input: Buffer, maxBytes: number): Promise<Buffer> {
  const zlib = await import("zlib");
  return new Promise<Buffer>((resolve, reject) => {
    const inflater = zlib.createInflate();
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    inflater.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        // Abort decompression immediately — do not accumulate further bytes.
        inflater.destroy();
        reject(new PdfResourceLimitError(
          `PDF stream exceeds the maximum allowed decompressed size of ${maxBytes / 1024 / 1024} MB.`,
        ));
        return;
      }
      chunks.push(chunk);
    });

    inflater.on("end", () => resolve(Buffer.concat(chunks)));
    inflater.on("error", (err: Error) => reject(err));

    inflater.end(input);
  });
}

// POST /api/documents/redact-pdf
// Accepts a PDF + list of string values to redact.
// Uses pdfjs-dist to locate each value's bounding box on each page.
// Draws solid black rectangles over matching text items AND removes the underlying
// text content from the page content streams so it cannot be recovered by extraction tools.
// Returns the modified PDF binary. The original uploaded file is never mutated.
router.post("/redact-pdf", requireEntitlement("redact"), upload.single("file"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "unauthorized", message: "You must be signed in to redact a PDF." });
  }

  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "PDF file required." });

    const mime = file.mimetype;
    const ext = (file.originalname ?? "").split(".").pop()?.toLowerCase() ?? "";
    if (mime !== "application/pdf" && ext !== "pdf") {
      return res.status(400).json({ message: "Only PDF files are supported for PDF redaction." });
    }

    let redactValues: string[] = [];
    try {
      const raw = req.body?.redactValues;
      if (raw) redactValues = JSON.parse(raw);
    } catch {
      return res.status(400).json({ message: "Invalid redactValues — expected a JSON array of strings." });
    }

    // Deduplicate and filter empty values
    redactValues = [...new Set(redactValues.map(v => v?.trim()).filter(v => v && v.length >= 2))];

    // Cap the number of redact values to prevent CPU exhaustion via attacker-controlled
    // work factors. The nested scan cost grows with both value count and PDF size, so
    // an unbounded list can monopolize the Node process for an arbitrarily long time.
    const REDACT_VALUES_LIMIT = 100;
    if (redactValues.length > REDACT_VALUES_LIMIT) {
      return res.status(400).json({
        error: "too_many_redact_values",
        message: `Too many redaction terms — maximum ${REDACT_VALUES_LIMIT} allowed per request.`,
      });
    }

    // Secondary cost-budget guard: cap total character volume across all values.
    // Even with the per-count cap, 100 very long values can still produce expensive
    // scans proportional to their combined length × number of text items in the PDF.
    const REDACT_TOTAL_CHARS_LIMIT = 2000;
    const totalChars = redactValues.reduce((sum, v) => sum + v.length, 0);
    if (totalChars > REDACT_TOTAL_CHARS_LIMIT) {
      return res.status(400).json({
        error: "redact_values_too_large",
        message: `Redaction terms too long in total — maximum ${REDACT_TOTAL_CHARS_LIMIT} characters combined.`,
      });
    }

    // If nothing to redact, return a clean copy of the PDF as-is
    const pdfBuffer = file.buffer;
    if (redactValues.length === 0) {
      res.set("Content-Type", "application/pdf");
      res.set("Content-Disposition", `attachment; filename="redacted.pdf"`);
      return res.send(pdfBuffer);
    }

    // ── Preflight: load PDF and enforce page-count limit before any iteration ──
    // PDFDocument.load is done here — before text extraction — so that an
    // oversized-page-count PDF is rejected before pdfParse iterates any pages.
    // The loaded doc is reused throughout the rest of the route (step 4+).
    const { PDFDocument, rgb, PDFName, PDFRawStream, PDFArray, PDFRef, PDFDict, PDFString, PDFHexString } = await import("pdf-lib");
    const pdfLibDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfLibDoc.getPages();

    if (pages.length > MAX_PDF_PAGES) {
      return res.status(400).json({
        error: "pdf_too_many_pages",
        message: `PDF has too many pages — maximum ${MAX_PDF_PAGES} pages allowed per request.`,
      });
    }

    // ── Step 1: Extract text items with bounding boxes ────────────────────────
    // We piggyback on pdf-parse's bundled pdfjs-dist (v2.x) via its pagerender
    // hook. That version is already configured for Node.js and doesn't require
    // DOMMatrix, canvas polyfills, or external worker setup.

    interface TextItem {
      str: string;
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }

    const allItems: TextItem[] = [];
    let currentPage = 0;

    // Import the internal module directly to avoid pdf-parse's test-file-read side effect
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = pdfParseModule.default ?? pdfParseModule;

    await pdfParse(pdfBuffer, {
      pagerender: async (pageData: { getTextContent: (opts?: Record<string, unknown>) => Promise<{ items: unknown[] }> }) => {
        currentPage++;
        const pageNum = currentPage;
        if (pageNum > MAX_PDF_PAGES) return "";
        try {
          const content = await pageData.getTextContent();
          for (const item of content.items) {
            const ti = item as Record<string, unknown>;
            if (typeof ti.str !== "string" || !ti.str.trim()) continue;
            const t = ti.transform as number[];
            if (!Array.isArray(t) || t.length < 6) continue;
            const height = Math.abs(t[3]) || (ti.height as number) || 12;
            allItems.push({
              str: ti.str,
              page: pageNum,
              x: t[4],
              y: t[5],
              width: (ti.width as number) || 0,
              height,
            });
          }
        } catch {
          // Page extraction failed — skip this page's items
        }
        return "";
      },
    });

    // Guard: reject PDFs whose extracted text volume would make the flat-text
    // scan (step 2-3) disproportionately expensive.
    {
      const totalTextBytes = allItems.reduce((sum, item) => sum + item.str.length, 0);
      if (totalTextBytes > MAX_EXTRACTED_TEXT_BYTES) {
        return res.status(400).json({
          error: "pdf_text_too_large",
          message: `PDF contains too much text — maximum ${MAX_EXTRACTED_TEXT_BYTES / 1024 / 1024} MB of extracted text allowed per request.`,
        });
      }
    }

    // ── Step 2: Build two searchable flat-text indexes with item offset maps ──
    // "Spaced": items separated by a synthetic space — catches values stored in a
    //   single item or that rely on the separator to form a match (e.g. "abc def"
    //   where "abc" and "def" are adjacent items).
    // "Dense": items concatenated with no separator — catches values that span item
    //   boundaries and where one item already carries the whitespace (e.g. "John "
    //   + "Smith" → "John Smith" only visible without an extra inserted space).
    // Unioning both result sets with a dedup key gives the most complete coverage.
    let fullTextSpaced = "";
    const spacedOffsets: Array<{ start: number; end: number; idx: number }> = [];
    let fullTextDense = "";
    const denseOffsets: Array<{ start: number; end: number; idx: number }> = [];

    for (let i = 0; i < allItems.length; i++) {
      const sStart = fullTextSpaced.length;
      fullTextSpaced += allItems[i].str;
      spacedOffsets.push({ start: sStart, end: fullTextSpaced.length, idx: i });
      fullTextSpaced += " ";

      const dStart = fullTextDense.length;
      fullTextDense += allItems[i].str;
      denseOffsets.push({ start: dStart, end: fullTextDense.length, idx: i });
    }

    // ── Step 3: Find each value in both flat texts, collect bounding boxes ───
    interface RedactBox {
      page: number;
      x: number;
      y: number;
      w: number;
      h: number;
    }

    const boxes: RedactBox[] = [];
    const seen = new Set<string>(); // deduplicate identical boxes

    function collectBoxesFromSearch(
      flatText: string,
      offsets: Array<{ start: number; end: number; idx: number }>,
      value: string,
    ) {
      let searchPos = 0;
      while (true) {
        const found = flatText.indexOf(value, searchPos);
        if (found === -1) break;
        const foundEnd = found + value.length;

        for (const range of offsets) {
          if (range.start < foundEnd && range.end > found) {
            const item = allItems[range.idx];
            const key = `${item.page}:${item.x.toFixed(1)}:${item.y.toFixed(1)}:${item.width.toFixed(1)}`;
            if (!seen.has(key)) {
              seen.add(key);
              boxes.push({
                page: item.page,
                x: item.x,
                y: item.y,
                w: item.width > 0 ? item.width : Math.max(value.length * 6, 30),
                h: item.height,
              });
            }
          }
        }

        searchPos = found + 1;
      }
    }

    for (const value of redactValues) {
      collectBoxesFromSearch(fullTextSpaced, spacedOffsets, value);
      collectBoxesFromSearch(fullTextDense, denseOffsets, value);
    }

    // ── Step 4: Draw solid black rectangles over matched text ────────────────
    // pdfLibDoc and pages were loaded in the preflight above and are reused here.
    const PAD_X = 1; // horizontal padding around text box
    const PAD_Y = 2; // vertical padding below text box

    for (const box of boxes) {
      const page = pages[box.page - 1];
      if (!page) continue;
      page.drawRectangle({
        x: box.x - PAD_X,
        y: box.y - PAD_Y,
        width: box.w + PAD_X * 2,
        height: box.h + PAD_Y * 2,
        color: rgb(0, 0, 0),
        opacity: 1,
      });
    }

    // ── Step 5: Remove text content from page content streams (ALL pages) ────
    // Drawing black rectangles only affects the visual rendering layer.
    // We scrub the underlying text operators on ALL pages so that even if a
    // value was missed by the box-matching step above (e.g. due to fragmented
    // text runs), the content stream no longer contains the raw value.
    // Replacement uses the public pdf-lib API (context.assign + PDFRawStream.of)
    // to avoid relying on internal mutable state.
    {
      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const pdfPage = pages[pageIdx];
        if (!pdfPage) continue;

        // Content streams may be a single ref or an array of refs
        const contentsEntry = pdfPage.node.get(PDFName.of("Contents"));
        const streamsToProcess: { ref: PDFRef; stream: PDFRawStream }[] = [];

        if (contentsEntry instanceof PDFRef) {
          const obj = pdfLibDoc.context.lookup(contentsEntry);
          if (obj instanceof PDFRawStream) {
            streamsToProcess.push({ ref: contentsEntry, stream: obj });
          }
        } else if (contentsEntry instanceof PDFArray) {
          for (let si = 0; si < contentsEntry.size(); si++) {
            const entry = contentsEntry.get(si);
            if (entry instanceof PDFRef) {
              const obj = pdfLibDoc.context.lookup(entry);
              if (obj instanceof PDFRawStream) {
                streamsToProcess.push({ ref: entry, stream: obj });
              }
            }
          }
        }

        for (const { ref, stream } of streamsToProcess) {
          const dict = stream.dict;
          const filterEntry = dict.get(PDFName.of("Filter"));
          const filterStr = filterEntry ? filterEntry.toString() : "";

          let bytes: Buffer = Buffer.from(stream.contents);

          const isFlateDecode = filterStr === "/FlateDecode" || filterStr === "/Fl" || filterStr.includes("FlateDecode");
          if (isFlateDecode) {
            try {
              // boundedInflate aborts decompression mid-stream and throws
              // PdfResourceLimitError if output exceeds the ceiling — this is
              // the primary defence against zip-bomb style attacks.
              bytes = await boundedInflate(bytes, MAX_DECOMPRESSED_STREAM_BYTES);
            } catch (inflateErr) {
              if (inflateErr instanceof PdfResourceLimitError) throw inflateErr;
              // Other decompression error — leave stream unchanged; verification below will catch it
              continue;
            }
            // Remove compression entries so the new stream is stored uncompressed
            dict.delete(PDFName.of("Filter"));
            dict.delete(PDFName.of("DecodeParms"));
          } else if (filterStr && filterStr !== "null") {
            // Non-FlateDecode filter (e.g. LZWDecode) — skip sanitization for this stream.
            // Verification step will reject the PDF if this stream contains recoverable values.
            continue;
          }

          const { bytes: sanitized, changed } = sanitizePdfContentStream(bytes, redactValues);
          if (!changed) continue;

          // Replace the stream using the public API — avoids mutating readonly internals
          dict.set(PDFName.of("Length"), pdfLibDoc.context.obj(sanitized.length));
          pdfLibDoc.context.assign(ref, PDFRawStream.of(dict, sanitized));
        }
      }
    }

    // ── Step 5b: Scrub AcroForm fields, annotations, metadata, embedded files ─
    // Page content streams only contain rendered text operators.  Sensitive data
    // can also live in AcroForm field values (/V), annotation /Contents strings,
    // the document /Info dictionary, XMP metadata streams, and embedded files.
    // None of these are touched by step 5, so we walk the full object tree here.
    {
      // ── Helpers ───────────────────────────────────────────────────────────

      // Replace every occurrence of each redact value inside a decoded string
      // with spaces of equal byte-length.  Returns null when nothing matched.
      function scrubText(decoded: string): string | null {
        let result = decoded;
        let changed = false;
        for (const v of redactValues) {
          if (!v) continue;
          let idx = result.indexOf(v);
          while (idx !== -1) {
            result = result.slice(0, idx) + " ".repeat(v.length) + result.slice(idx + v.length);
            changed = true;
            idx = result.indexOf(v, idx + v.length);
          }
        }
        return changed ? result : null;
      }

      // Scrub a PDFString or PDFHexString in-place if it contains a redact value.
      // Returns a replacement object or null.
      function scrubPdfStringEntry(obj: unknown) {
        if (obj instanceof PDFString) {
          try {
            const decoded = obj.decodeText();
            const scrubbed = scrubText(decoded);
            if (scrubbed !== null) return PDFString.of(scrubbed);
          } catch { /* non-text bytes — skip */ }
        } else if (obj instanceof PDFHexString) {
          try {
            const decoded = obj.decodeText();
            const scrubbed = scrubText(decoded);
            // fromText encodes the string correctly as hex; .of() expects raw hex content
            if (scrubbed !== null) return PDFHexString.fromText(scrubbed);
          } catch { /* non-text bytes — skip */ }
        }
        return null;
      }

      // Recursively scrub all PDFString/PDFHexString values reachable from a
      // PDFDict or PDFArray, following refs to resolve indirect objects.
      // `visited` prevents infinite loops in cyclic object graphs.
      function scrubDictOrArray(obj: unknown, visited: Set<string>): void {
        if (obj instanceof PDFRef) {
          const key = obj.toString();
          if (visited.has(key)) return;
          visited.add(key);
          try { scrubDictOrArray(pdfLibDoc.context.lookup(obj), visited); } catch { /* ignore */ }
          return;
        }

        if (obj instanceof PDFDict) {
          for (const [entryKey, val] of obj.entries()) {
            const replacement = scrubPdfStringEntry(val);
            if (replacement !== null) {
              obj.set(entryKey, replacement);
            } else {
              scrubDictOrArray(val, visited);
            }
          }
          return;
        }

        if (obj instanceof PDFArray) {
          for (let ai = 0; ai < obj.size(); ai++) {
            const val = obj.get(ai);
            const replacement = scrubPdfStringEntry(val);
            if (replacement !== null) {
              obj.set(ai, replacement);
            } else {
              scrubDictOrArray(val, visited);
            }
          }
        }
      }

      // ── Pass 1: Walk all indirect objects ─────────────────────────────────
      // This is the broadest net — catches every named object in the file,
      // including AcroForm fields and annotations stored as indirect refs.
      for (const [, pdfObj] of pdfLibDoc.context.enumerateIndirectObjects()) {
        if (!(pdfObj instanceof PDFDict)) continue;
        // Scrub the specific keys most likely to carry user-visible text
        for (const key of ["V", "Contents", "TU", "DV", "T", "Subj"]) {
          const entry = pdfObj.get(PDFName.of(key));
          if (!entry) continue;
          const replacement = scrubPdfStringEntry(entry);
          if (replacement !== null) pdfObj.set(PDFName.of(key), replacement);
        }
      }

      // ── Pass 2: Explicit recursive walk of AcroForm field tree ───────────
      // Belt-and-suspenders in case any field dict is inline (non-indirect).
      const acroFormEntry = pdfLibDoc.catalog.get(PDFName.of("AcroForm"));
      if (acroFormEntry) {
        scrubDictOrArray(acroFormEntry, new Set());
      }

      // ── Pass 3: Explicit recursive walk of per-page Annots arrays ─────────
      for (const page of pdfLibDoc.getPages()) {
        const annotsEntry = page.node.get(PDFName.of("Annots"));
        if (annotsEntry) scrubDictOrArray(annotsEntry, new Set());
      }

      // ── Scrub /Info trailer dictionary ────────────────────────────────────
      // The Info dict holds author, title, subject, keywords, and similar.
      const trailerInfoRef = pdfLibDoc.context.trailerInfo.Info;
      if (trailerInfoRef instanceof PDFRef) {
        const infoDict = pdfLibDoc.context.lookup(trailerInfoRef);
        if (infoDict instanceof PDFDict) {
          for (const [key, val] of infoDict.entries()) {
            const replacement = scrubPdfStringEntry(val);
            if (replacement !== null) infoDict.set(key, replacement);
          }
        }
      }

      // ── Remove XMP metadata stream unconditionally ────────────────────────
      // XMP streams are often FlateDecode-compressed, making substring-based
      // detection unreliable without full decompression.  Removing the /Metadata
      // entry from the catalog is the fail-safe approach and has no effect on
      // visual content or form functionality.
      pdfLibDoc.catalog.delete(PDFName.of("Metadata"));

      // ── Remove embedded files ─────────────────────────────────────────────
      // Attached files could carry the original unredacted source document.
      const namesEntry = pdfLibDoc.catalog.get(PDFName.of("Names"));
      if (namesEntry) {
        const namesDict = namesEntry instanceof PDFRef
          ? pdfLibDoc.context.lookup(namesEntry)
          : namesEntry;
        if (namesDict instanceof PDFDict) {
          namesDict.delete(PDFName.of("EmbeddedFiles"));
        }
      }

      // ── Remove XFA XML packet from AcroForm ───────────────────────────────
      // XFA streams embed the entire form's XML data (including field values)
      // as a compressed stream inside /AcroForm /XFA. Even after scrubbing
      // AcroForm field strings above, the XFA packet retains originals.
      // Removing it is safe: the visual/AcroForm layer is unaffected.
      {
        const acroFormRef = pdfLibDoc.catalog.get(PDFName.of("AcroForm"));
        const acroFormDict = acroFormRef instanceof PDFRef
          ? pdfLibDoc.context.lookup(acroFormRef)
          : acroFormRef;
        if (acroFormDict instanceof PDFDict) {
          acroFormDict.delete(PDFName.of("XFA"));
        }
      }
    }

    // ── Step 5c: Sanitize annotation appearance streams (/AP) ─────────────
    // Widget and annotation /AP streams are content streams (just like page
    // /Contents) that may contain Tj/TJ operators preserving the original
    // field text even after the visible area is covered by a black box.
    // We decompress and scrub them with the same sanitizePdfContentStream()
    // helper used for page streams.
    //
    // Fail-closed policy: if any stream in an annotation's /AP sub-tree
    // cannot be decoded (unsupported filter, inflate failure), the entire
    // /AP entry is removed from that annotation.  This is safer than
    // skipping — the page-text verification step does not inspect hidden
    // stream objects, so silent skips would leave recoverable data in place.
    //
    // PDF /AP graph structures handled:
    //   Annot dict → /AP → PDFRef → PDFRawStream          (indirect stream)
    //                     PDFRef → PDFDict { /N, /R, /D } (indirect AP dict)
    //                     PDFDict { /N, /R, /D }           (inline AP dict)
    //                       where each sub-key may be:
    //                         • PDFRef → PDFRawStream  (indirect stream)
    //                         • PDFRawStream           (inline stream)
    //                         • PDFRef → PDFDict       (state dict: /Off, /Yes, …)
    //                         • PDFDict                (inline state dict)
    //   Annots entries may be PDFRef or inline PDFDict.
    {
      // Try to scrub a single PDFRawStream.
      // Returns "ok" when the stream was clean or successfully sanitized.
      // Returns "unsanitizable" when the stream cannot be decoded — the
      // caller must then remove the /AP entry (fail-closed).
      async function scrubApRawStream(
        streamObj: PDFRawStream,
        streamRef: PDFRef | null,
      ): Promise<"ok" | "unsanitizable"> {
        const dict = streamObj.dict;
        const filterEntry = dict.get(PDFName.of("Filter"));
        const filterStr = filterEntry ? filterEntry.toString() : "";

        let bytes: Buffer = Buffer.from(streamObj.contents);
        const isFlateDecode =
          filterStr === "/FlateDecode" || filterStr === "/Fl" || filterStr.includes("FlateDecode");
        if (isFlateDecode) {
          try {
            // boundedInflate aborts mid-stream and throws PdfResourceLimitError
            // when decompressed output exceeds MAX_DECOMPRESSED_STREAM_BYTES.
            bytes = await boundedInflate(bytes, MAX_DECOMPRESSED_STREAM_BYTES);
          } catch (inflateErr) {
            if (inflateErr instanceof PdfResourceLimitError) throw inflateErr;
            // Cannot decompress — caller must remove /AP to prevent data leak
            return "unsanitizable";
          }
          dict.delete(PDFName.of("Filter"));
          dict.delete(PDFName.of("DecodeParms"));
        } else if (filterStr && filterStr !== "null") {
          // Unsupported filter (e.g. LZW, JBIG2) — caller must remove /AP
          return "unsanitizable";
        }

        const { bytes: sanitized, changed } = sanitizePdfContentStream(bytes, redactValues);
        if (!changed) return "ok";

        dict.set(PDFName.of("Length"), pdfLibDoc.context.obj(sanitized.length));
        if (streamRef !== null) {
          // Indirect stream — replace via the public pdf-lib API
          pdfLibDoc.context.assign(streamRef, PDFRawStream.of(dict, sanitized));
        } else {
          // Inline stream — register as a new indirect object and point the
          // parent to it.  pdf-lib has no public API for mutating an inline
          // stream's bytes, so we promote it to an indirect object here and
          // the walkApNode caller is responsible for updating its parent entry.
          // We store the ref on the streamObj so the parent walk can retrieve it.
          const newRef = pdfLibDoc.context.register(PDFRawStream.of(dict, sanitized));
          // Tag the original streamObj so the dict/array walker can replace
          // the entry with the new indirect ref after we return.
          (streamObj as unknown as { _replacementRef: PDFRef })._replacementRef = newRef;
        }
        return "ok";
      }

      // Recursively walk an AP graph node.
      // Returns "ok" if all reachable streams were sanitized (or needed no change).
      // Returns "unsanitizable" if any stream could not be decoded — caller removes /AP.
      // `visited` prevents infinite loops in cyclic ref graphs.
      async function walkApNode(node: unknown, visited: Set<string>): Promise<"ok" | "unsanitizable"> {
        if (node instanceof PDFRef) {
          const key = node.toString();
          if (visited.has(key)) return "ok"; // already processed
          visited.add(key);
          let resolved: unknown;
          try { resolved = pdfLibDoc.context.lookup(node); } catch { return "ok"; }
          if (resolved instanceof PDFRawStream) {
            return scrubApRawStream(resolved, node);
          }
          // PDFDict (AP sub-dict or state dict) or anything else — descend
          return walkApNode(resolved, visited);
        }

        if (node instanceof PDFRawStream) {
          // Inline stream (no ref) — scrub and let caller apply replacement ref
          return scrubApRawStream(node, null);
        }

        if (node instanceof PDFDict) {
          let result: "ok" | "unsanitizable" = "ok";
          for (const [entryKey, val] of node.entries()) {
            const entryResult = await walkApNode(val, visited);
            if (entryResult === "unsanitizable") {
              result = "unsanitizable";
            } else if (val instanceof PDFRawStream) {
              // Replace inline stream entry with the registered indirect ref if promoted
              const tagged = val as unknown as { _replacementRef?: PDFRef };
              if (tagged._replacementRef) {
                node.set(entryKey, tagged._replacementRef);
                delete tagged._replacementRef;
              }
            }
          }
          return result;
        }

        if (node instanceof PDFArray) {
          let result: "ok" | "unsanitizable" = "ok";
          for (let ai = 0; ai < node.size(); ai++) {
            const val = node.get(ai);
            const entryResult = await walkApNode(val, visited);
            if (entryResult === "unsanitizable") {
              result = "unsanitizable";
            } else if (val instanceof PDFRawStream) {
              const tagged = val as unknown as { _replacementRef?: PDFRef };
              if (tagged._replacementRef) {
                node.set(ai, tagged._replacementRef);
                delete tagged._replacementRef;
              }
            }
          }
          return result;
        }

        // All other PDF object types (Name, Number, Boolean, etc.) carry no streams.
        return "ok";
      }

      // Process /AP for a resolved annotation dict.
      // If the walk finds any undecodable stream, remove /AP entirely (fail-closed).
      async function processAnnotDict(annotDict: PDFDict): Promise<void> {
        const apEntry = annotDict.get(PDFName.of("AP"));
        if (!apEntry) return;
        const result = await walkApNode(apEntry, new Set());
        if (result === "unsanitizable") {
          // Cannot guarantee the AP sub-tree is clean — remove it.
          // Black rectangles drawn in step 4 still cover the visible text area.
          annotDict.delete(PDFName.of("AP"));
        }
      }

      // Walk every annotation on every page.
      // /Annots entries may be PDFRef (most common) or inline PDFDict.
      for (const pdfPage of pdfLibDoc.getPages()) {
        const annotsEntry = pdfPage.node.get(PDFName.of("Annots"));
        if (!annotsEntry) continue;
        const annotsArr = annotsEntry instanceof PDFRef
          ? pdfLibDoc.context.lookup(annotsEntry)
          : annotsEntry;
        if (!(annotsArr instanceof PDFArray)) continue;
        for (let ai = 0; ai < annotsArr.size(); ai++) {
          const el = annotsArr.get(ai);
          if (el instanceof PDFRef) {
            let annotObj: unknown;
            try { annotObj = pdfLibDoc.context.lookup(el); } catch { continue; }
            if (annotObj instanceof PDFDict) await processAnnotDict(annotObj);
          } else if (el instanceof PDFDict) {
            await processAnnotDict(el);
          }
        }
      }
    }

    const redactedBytes = await pdfLibDoc.save({ useObjectStreams: false });

    // ── Step 6: Verify redaction — fail closed ─────────────────────────────
    // Re-extract text from the output PDF (reusing pdfParse already imported above)
    // and confirm none of the target values remain. Reject with a 422 rather than
    // silently delivering a PDF that only appears redacted. No sensitive values
    // are written to logs — only the count is recorded.
    {
      let verifyText = "";
      try {
        // pdfParse is already in scope from Step 1 — no re-import needed
        const verifyResult = await pdfParse(Buffer.from(redactedBytes));
        verifyText = verifyResult?.text ?? "";
      } catch {
        // Text extraction of the output PDF failed entirely — return a generic error
        return res.status(500).json({ message: "PDF redaction failed — could not verify the output. Please try again." });
      }

      const recoverableCount = redactValues.filter(v => verifyText.includes(v)).length;
      if (recoverableCount > 0) {
        console.error(`[redact-pdf] Verification failed — ${recoverableCount} of ${redactValues.length} value(s) still detectable in text layer`);
        return res.status(422).json({
          error: "redaction_unverifiable",
          message:
            "This PDF's text encoding could not be fully sanitized. The selected values may still be recoverable by text-extraction tools. " +
            "For maximum security please use a dedicated PDF redaction tool, or export the document to a rasterized image-only PDF before sharing.",
        });
      }
    }

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="${file.originalname.replace(/\.[^.]+$/, "")}_redacted.pdf"`);
    return res.send(Buffer.from(redactedBytes));
  } catch (err) {
    if (err instanceof PdfResourceLimitError) {
      return res.status(400).json({ error: "pdf_resource_limit", message: err.message });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[documents/redact-pdf]", msg);
    return res.status(500).json({ message: "PDF redaction failed. Please try again." });
  }
});

// POST /api/documents/compare
// Compares two versions of a document and returns a structured diff with risk assessment.
router.post("/compare", requireEntitlement("compare"), async (req, res) => {
  const { original, revised } = req.body;
  if (!original || !revised) {
    return res.status(400).json({ error: "both_required", message: "Both original and revised document text are required." });
  }
  if (original.length < 50 || revised.length < 50) {
    return res.status(422).json({ error: "too_short", message: "Both documents must be at least 50 characters." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a document comparison expert. Compare two versions of a document and identify all meaningful changes. For each change, assess whether it increases or decreases risk for the party who didn't draft the document.

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence plain-English summary of what changed overall",
  "overallRiskChange": "increased or decreased or unchanged",
  "changesCount": 0,
  "highSignificanceCount": 0,
  "recommendation": "1-2 sentence recommendation on whether to accept the revised version",
  "changes": [
    {
      "type": "added or removed or modified or risk-increased or risk-decreased",
      "clause": "short clause title/description (max 80 chars)",
      "original": "relevant original text or null if added",
      "revised": "relevant revised text or null if removed",
      "significance": "high or medium or low",
      "explanation": "plain-English explanation of what changed and why it matters"
    }
  ]
}

Focus on substantive changes — skip formatting-only differences. Limit to 15 most significant changes.`,
        },
        {
          role: "user",
          content: `ORIGINAL VERSION:\n${original.substring(0, 6000)}\n\n---\n\nREVISED VERSION:\n${revised.substring(0, 6000)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI");

    const result = JSON.parse(content);
    result.analyzedAt = new Date().toISOString();
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "documents/compare failed");
    return res.status(500).json({ message: "Comparison failed. Please try again." });
  }
});

// ── Document Chat ────────────────────────────────────────────────────────────
// POST /api/documents/chat
// Ask a follow-up question about a document using its analysis as context.
// Accepts Clerk auth via session cookie OR Authorization: Bearer <token> header.
router.post("/chat", requireEntitlement("ask-document"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  const { analysisContext, message, history = [] } = req.body;
  if (!message || typeof message !== "string" || message.trim().length < 2) {
    return res.status(400).json({ error: "message_required", message: "A message is required." });
  }
  if (!analysisContext || typeof analysisContext !== "object") {
    return res.status(400).json({ error: "context_required", message: "Analysis context is required." });
  }

  const { title, documentType, summary, risks = [], deadlines = [], keyTerms = [], actionSteps = [], plainEnglish } = analysisContext;

  const contextParts = [
    `Document: "${title || "Untitled"}" (${documentType || "Unknown type"})`,
    summary ? `Summary: ${summary}` : null,
    risks.length
      ? `Key risks:\n${(risks as any[]).slice(0, 6).map((r: any) => `- [${String(r.severity ?? "").toUpperCase()}] ${r.title}: ${r.description}`).join("\n")}`
      : null,
    deadlines.length
      ? `Deadlines:\n${(deadlines as any[]).slice(0, 5).map((d: any) => `- ${d.title}${d.date ? ` (${d.date})` : ""}${d.isHard ? " [HARD]" : ""}: ${d.description}`).join("\n")}`
      : null,
    keyTerms.length
      ? `Key terms:\n${(keyTerms as any[]).slice(0, 8).map((k: any) => `- ${k.term}: ${k.definition}`).join("\n")}`
      : null,
    actionSteps.length
      ? `Action steps:\n${(actionSteps as any[]).slice(0, 5).map((a: any) => `- [${String(a.priority ?? "").toUpperCase()}] ${a.title}: ${a.description}`).join("\n")}`
      : null,
    plainEnglish
      ? `Plain English breakdown:\n- What it is: ${(plainEnglish as any).whatItIs}\n- Obligations: ${(plainEnglish as any).obligations}\n- Pay attention to: ${(plainEnglish as any).payAttentionTo}`
      : null,
  ].filter(Boolean).join("\n\n");

  const systemPrompt = `You are PlainPath's document assistant — an expert at explaining legal and official documents in plain English. A user has analyzed their document. Answer their questions using the analysis context below.

${contextParts}

Rules:
- Speak in plain English. Explain any legal terms you use.
- Be specific to this document. Don't give generic advice.
- If asked something not in the analysis, say you don't have enough context from the document to answer that precisely.
- Keep answers concise: 2–4 sentences for simple questions, a short paragraph for complex ones.
- If the user asks about serious legal consequences, encourage them to consult a licensed attorney for their specific situation.
- Never fabricate document details not present in the analysis above.`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(history as any[]).slice(-12).map((h: any) => ({ role: h.role as "user" | "assistant", content: String(h.content) })),
    { role: "user" as const, content: message.trim() },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 500,
      messages,
    });

    const reply = response.choices[0]?.message?.content?.trim() ?? "I wasn't able to generate a response. Please try again.";
    const suggestedQuestions = buildSuggestedQuestions(documentType, risks, deadlines);
    return res.json({ reply, suggestedQuestions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "documents/chat failed");
    return res.status(500).json({ message: "Chat failed. Please try again." });
  }
});

// ─── POST /documents/negotiate ────────────────────────────────────────────────
// Pro feature: returns negotiation strategy + counter-language for a risk item.
router.post("/negotiate", requireEntitlement("negotiate"), async (req, res) => {

  const { riskTitle, riskDescription, severity, documentType, documentSummary } = req.body as {
    riskTitle?: string;
    riskDescription?: string;
    severity?: string;
    documentType?: string;
    documentSummary?: string;
  };

  if (!riskTitle || !riskDescription) {
    return res.status(400).json({ message: "riskTitle and riskDescription are required." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 700,
      messages: [
        {
          role: "system",
          content: `You are a contract and document negotiation expert helping regular people push back on unfair terms.
Be direct, practical, and confident. Give advice as if helping a friend — not legal jargon.`,
        },
        {
          role: "user",
          content: `Document type: ${documentType ?? "contract"}
${documentSummary ? `Document summary: ${documentSummary}\n` : ""}Risk identified: "${riskTitle}"
Description: ${riskDescription}
Severity: ${severity ?? "medium"}

Please provide:
1. A negotiation strategy — 1-2 sentences on the best approach
2. Exact counter-language they can propose (draft text they can copy and use or adapt)
3. Three specific talking points to use in negotiation

Return ONLY valid JSON in this exact format:
{
  "strategy": "string",
  "counterLanguage": "string",
  "talkingPoints": ["string", "string", "string"]
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let parsed: { strategy?: string; counterLanguage?: string; talkingPoints?: string[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(500).json({ message: "Failed to parse negotiation response." });
    }

    return res.json({
      strategy: parsed.strategy ?? "",
      counterLanguage: parsed.counterLanguage ?? "",
      talkingPoints: Array.isArray(parsed.talkingPoints) ? parsed.talkingPoints : [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "documents/negotiate failed");
    return res.status(500).json({ message: "Negotiation failed. Please try again." });
  }
});

// ─── SSRF helpers for /documents/import-url ───────────────────────────────────

/** Error class for policy / input violations that should surface as HTTP 400. */
class ImportUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportUrlError";
  }
}

/** Hostnames that the import-url feature is allowed to contact. */
const IMPORT_URL_ALLOWED_HOSTS = new Set([
  "drive.google.com",
  "docs.google.com",
  "www.dropbox.com",
  "dropbox.com",
  "dl.dropboxusercontent.com",
]);

/** Maximum response body size (25 MB) before we abort. */
const IMPORT_URL_MAX_BYTES = 25 * 1024 * 1024;

/** Maximum number of redirects to follow manually. */
const IMPORT_URL_MAX_REDIRECTS = 5;

/**
 * Returns true when the hostname resolves to a private / link-local / loopback
 * address that should never be reachable from outside a trusted network.
 * We perform a simple string check on the raw hostname before DNS lookup
 * to catch the most obvious cases quickly.
 */
function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  // Loopback / localhost
  if (h === "localhost" || h === "localhost.") return true;
  // IPv6 loopback
  if (h === "::1" || h === "[::1]") return true;
  // IPv4 private ranges via regex (not exhaustive but covers common cases)
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (a === 10) return true;                        // 10.0.0.0/8
    if (a === 127) return true;                       // 127.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;           // 192.168.0.0/16
    if (a === 169 && b === 254) return true;           // 169.254.0.0/16 (link-local / metadata)
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (shared address space)
    if (a === 0) return true;                          // 0.x.x.x
  }
  // Bare IPv6 private ranges (simplified)
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  return false;
}

/**
 * Validates that a URL is safe to fetch:
 *   - must be https (http is allowed only for Google/Dropbox canonical https forms,
 *     but we enforce https here to prevent cleartext exfiltration)
 *   - hostname must be in the allowlist
 *   - hostname must not map to a private address
 *
 * Returns the parsed URL on success, or throws an error with a user-facing message.
 */
function validateImportUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ImportUrlError("A valid URL is required.");
  }

  if (parsed.protocol !== "https:") {
    throw new ImportUrlError("Only HTTPS URLs from supported services (Google Drive, Dropbox) are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!IMPORT_URL_ALLOWED_HOSTS.has(hostname)) {
    throw new ImportUrlError("URL must point to a supported service (Google Drive or Dropbox).");
  }

  if (isPrivateHostname(hostname)) {
    throw new ImportUrlError("URL must point to a supported service (Google Drive or Dropbox).");
  }

  return parsed;
}

/**
 * Fetches a URL with manual redirect following so that every hop is
 * re-validated against the allowlist.  The response body is streamed and
 * capped at IMPORT_URL_MAX_BYTES to prevent memory exhaustion.
 */
async function safeFetch(startUrl: string): Promise<{ response: Response; buffer: Buffer }> {
  let currentUrl = startUrl;

  for (let hop = 0; hop <= IMPORT_URL_MAX_REDIRECTS; hop++) {
    validateImportUrl(currentUrl); // throws on policy violation

    const res = await fetch(currentUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PlainPath/1.0)",
        Accept: "*/*",
      },
      redirect: "manual", // we handle redirects ourselves
      signal: AbortSignal.timeout(30_000), // 30 s per hop — prevents indefinite hangs
    });

    const status = res.status;

    // Manual redirect handling
    if (status >= 300 && status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect with no Location header.");
      // Resolve relative redirect against the current URL
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!res.ok) {
      throw new ImportUrlError(`Could not fetch the document. The link may be expired or private. (Status: ${status})`);
    }

    // Stream and cap the response body
    if (!res.body) throw new ImportUrlError("Empty response body.");

    const chunks: Buffer[] = [];
    let totalBytes = 0;

    // Node's fetch returns a web ReadableStream; consume it chunk by chunk
    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > IMPORT_URL_MAX_BYTES) {
        await reader.cancel();
        throw new ImportUrlError("Document is too large to import (maximum 25 MB).");
      }
      chunks.push(Buffer.from(value));
    }

    const buffer = Buffer.concat(chunks);
    return { response: res, buffer };
  }

  throw new ImportUrlError("Too many redirects.");
}

// ─── POST /documents/import-url ───────────────────────────────────────────────
// Fetches a document from a Google Drive or Dropbox share URL, extracts text.
router.post("/import-url", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: "unauthenticated" });

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ message: "A valid URL is required." });
  }

  // Validate before doing anything else (fast fail, no network contact)
  try {
    validateImportUrl(url.trim());
  } catch (validationErr) {
    const msg = validationErr instanceof Error ? validationErr.message : "A valid URL is required.";
    return res.status(400).json({ message: msg });
  }

  try {
    let downloadUrl = url.trim();
    let guessedFilename = "document";

    // Google Drive: https://drive.google.com/file/d/FILE_ID/view → uc?export=download
    const driveMatch = downloadUrl.match(/drive\.google\.com\/file\/d\/([^/?\s]+)/);
    if (driveMatch) {
      downloadUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${driveMatch[1]}`;
      guessedFilename = "google-drive-document";
    }

    // Dropbox: replace ?dl=0 with ?dl=1 or add ?dl=1
    if (downloadUrl.includes("dropbox.com")) {
      if (downloadUrl.includes("dl=0")) {
        downloadUrl = downloadUrl.replace("dl=0", "dl=1");
      } else if (downloadUrl.includes("www.dropbox.com") && !downloadUrl.includes("dl=1")) {
        downloadUrl = downloadUrl + (downloadUrl.includes("?") ? "&dl=1" : "?dl=1");
      }
      guessedFilename = "dropbox-document";
    }

    const { response: fetchRes, buffer } = await safeFetch(downloadUrl);

    const contentType = (fetchRes.headers.get("content-type") ?? "").toLowerCase();
    const disposition = fetchRes.headers.get("content-disposition") ?? "";
    const filenameMatch = disposition.match(/filename[^;=\n]*=([^;\n"]*)/);
    if (filenameMatch?.[1]) guessedFilename = filenameMatch[1].trim().replace(/["']/g, "");

    let extractedText = "";

    if (contentType.includes("pdf") || guessedFilename.toLowerCase().endsWith(".pdf")) {
      try {
        const result = await parsePdfWithLimits(buffer);
        extractedText = result.text ?? "";
      } catch (err) {
        if (err instanceof ParseResourceLimitError) {
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: "Could not extract readable text from this document. Try downloading the file and uploading it directly." });
      }
    } else if (
      contentType.includes("wordprocessingml") ||
      contentType.includes("msword") ||
      guessedFilename.toLowerCase().endsWith(".docx") ||
      guessedFilename.toLowerCase().endsWith(".doc")
    ) {
      try {
        extractedText = await parseDocxWithLimits(buffer);
      } catch (err) {
        if (err instanceof ParseResourceLimitError) {
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: "Could not extract readable text from this document. Try downloading the file and uploading it directly." });
      }
    } else {
      // Treat as plain text
      extractedText = buffer.toString("utf-8");
    }

    extractedText = extractedText.trim();
    if (!extractedText || extractedText.length < 20) {
      return res.status(400).json({ message: "Could not extract readable text from this document. Try downloading the file and uploading it directly." });
    }

    return res.json({ text: extractedText, filename: guessedFilename });
  } catch (err) {
    if (err instanceof ImportUrlError) {
      return res.status(400).json({ message: err.message });
    }
    // AbortError is thrown by AbortSignal.timeout when the per-hop deadline fires
    if (err instanceof Error && err.name === "TimeoutError") {
      return res.status(504).json({ message: "The remote server took too long to respond. Please try downloading the file and uploading it directly." });
    }
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "documents/import-url failed");
    return res.status(500).json({ message: "Failed to import document from URL. Please try uploading the file directly." });
  }
});

function buildSuggestedQuestions(documentType: string, risks: any[], deadlines: any[]): string[] {
  const questions: string[] = [];
  if ((deadlines as any[]).some((d: any) => d.isHard)) questions.push("What happens if I miss the deadline?");
  if ((risks as any[]).some((r: any) => r.severity === "high")) questions.push("What should I do about the high-risk items?");

  const byType: Record<string, string[]> = {
    lease:      ["Can my landlord raise the rent mid-lease?", "What are my options if the landlord won't make repairs?", "How much notice do I need to give before moving out?"],
    employment: ["Can I negotiate these terms?", "Is this non-compete clause enforceable?", "What happens if I'm terminated without cause?"],
    medical:    ["Am I required to pay this full amount?", "How do I dispute or appeal this bill?", "What happens if I can't pay right now?"],
    irs:        ["What options do I have to respond?", "What happens if I ignore this notice?", "Can I set up a payment plan?"],
    contract:   ["What are the termination rights?", "Are there any auto-renewal clauses?", "What happens if either party breaches the contract?"],
    nda:        ["What am I not allowed to share?", "How long does this agreement last?", "What happens if I accidentally violate it?"],
  };

  const typeKey = Object.keys(byType).find(k => String(documentType ?? "").toLowerCase().includes(k)) ?? "contract";
  const extras = byType[typeKey] ?? byType.contract;
  const combined = [...questions, ...extras];
  return Array.from(new Set(combined)).slice(0, 3);
}

export default router;

