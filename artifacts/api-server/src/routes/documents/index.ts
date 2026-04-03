import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { demoDocuments } from "../../lib/demoData.js";
import { trustCheckDemoDocuments } from "../../lib/trustCheckDemoData.js";
import type { DocumentAnalysis, DocumentSection, KeyTerm, ActionPack, TrustCheckAnalysis, TrustCheckVerdict, TrustCheckContactDetail, TrustCheckDeadlineItem, TrustCheckScamIndicator } from "../../lib/types.js";

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

router.post("/analyze", async (req, res) => {
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

router.post("/upload", upload.single("file"), async (req, res, next) => {
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
        const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
        const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
          (pdfMod as any).default ?? (pdfMod as any);
        const pdfResult = await pdfParse(file.buffer);
        pdfParseText = pdfResult?.text ?? null;
      } catch (err) {
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
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value ?? "";
      } catch (err) {
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

    console.log("[upload] extracted", extractedText.length, "chars from", file.originalname, "— starting analysis");

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
}

function extractRuleData(text: string): ExtractedRuleData {
  const lower = text.toLowerCase();

  const phoneRegex = /\b(\+1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}\b/g;
  const phones = [...new Set((text.match(phoneRegex) || []).map((p) => p.trim()))];

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
    "respond immediately", "urgent", "emergency", "last chance", "final opportunity",
    "do not delay", "prompt attention", "without delay",
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
  ];
  const threatPhrases = threatTerms.filter((t) => lower.includes(t));

  const paymentRedFlagTerms = [
    "gift card", "itunes card", "google play card", "steam card", "amazon gift card",
    "wire transfer", "western union", "moneygram",
    "cryptocurrency", "bitcoin", "ethereum", "crypto", "usdt",
    "zelle", "cash app", "cashapp", "venmo",
    "prepaid card", "prepaid debit", "money order",
    "payment link", "pay here", "click to pay", "pay online now",
  ];
  const paymentRedFlags = paymentRedFlagTerms.filter((t) => lower.includes(t));

  const infoRequestTerms = [
    "social security number", "social security no", "ssn",
    "bank account number", "routing number", "account number",
    "credit card number", "debit card", "card number", "cvv",
    "date of birth", "mother's maiden name", "password", "pin number",
    "drivers license", "driver's license",
  ];
  const infoRequests = infoRequestTerms.filter((t) => lower.includes(t));

  return { phones, emails, urls, dates, amounts, urgencyPhrases, threatPhrases, paymentRedFlags, infoRequests };
}

function calculateRiskScore(data: ExtractedRuleData, lower: string): number {
  let score = 0;

  // High severity — payment method red flags
  const giftCardTerms = ["gift card", "itunes card", "google play card", "steam card", "amazon gift card"];
  if (data.paymentRedFlags.some((f) => giftCardTerms.some((k) => f.includes(k)))) score += 25;
  const wireTerms = ["wire transfer", "western union", "moneygram"];
  if (data.paymentRedFlags.some((f) => wireTerms.some((k) => f.includes(k)))) score += 20;
  const cryptoTerms = ["cryptocurrency", "bitcoin", "ethereum", "crypto", "usdt"];
  if (data.paymentRedFlags.some((f) => cryptoTerms.some((k) => f.includes(k)))) score += 22;
  const ssnTerms = ["social security number", "ssn"];
  if (data.infoRequests.some((r) => ssnTerms.some((k) => r.includes(k)))) score += 22;
  const bankTerms = ["bank account number", "routing number", "credit card number", "cvv"];
  if (data.infoRequests.some((r) => bankTerms.some((k) => r.includes(k)))) score += 20;
  const arrestTerms = ["arrest", "warrant", "prosecution", "criminal charges", "federal agent"];
  if (data.threatPhrases.some((t) => arrestTerms.some((k) => t.includes(k)))) score += 25;
  const linkTerms = ["payment link", "pay here", "click to pay"];
  if (data.paymentRedFlags.some((f) => linkTerms.some((k) => f.includes(k)))) score += 18;

  // High severity — impersonation and pattern detection
  // Well-known brand impersonation + payment demand is a strong scam signal
  const impersonatedBrands = [
    "microsoft", "apple support", "apple inc.", "google support", "amazon support",
    "irs ", "internal revenue service", "fbi ", "dea ", "interpol",
    "social security administration", "medicare fraud", "medicaid fraud",
  ];
  if (impersonatedBrands.some((b) => lower.includes(b)) && data.paymentRedFlags.length > 0) score += 18;

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
  if (data.urgencyPhrases.length >= 3) score += 8;
  else if (data.urgencyPhrases.length >= 2) score += 4;

  // Low severity — contextual indicators
  if (data.urgencyPhrases.length >= 1) score += 3;
  if (data.threatPhrases.length >= 1) score += 3;
  if (data.amounts.length > 0) score += 2;

  return Math.min(100, score);
}

function scoreToVerdict(score: number): TrustCheckVerdict {
  if (score >= 75) return "High scam risk";
  if (score >= 50) return "Suspicious — verify before acting";
  if (score >= 25) return "Cannot verify authenticity";
  return "Likely legitimate";
}

const TRUST_CHECK_SYSTEM_PROMPT = `You are PlainPath Trust Check, a document risk analysis engine that helps people evaluate suspicious letters, notices, and documents.

Your task: Read the document text and identify whether it contains warning signs of fraud, scams, impersonation, or manipulation.

CRITICAL — Use risk-based language only. Never claim certainty.
ALLOWED language: "appears to", "may indicate", "suggests", "could be", "shows signs of", "likely", "suspicious", "cannot confirm", "cannot verify"
FORBIDDEN language: "definitely fake", "is a scam", "is fraud", "proven fraud", "legally invalid", "certainly fraudulent"

Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON.

{
  "verdictExplanation": "string - 2-4 sentences explaining the risk level in cautious, risk-based language",
  "whatItClaims": "string - 2-4 sentences: what organization or authority this document claims to be from, and what situation it describes",
  "demandedAction": "string - 2-4 sentences: what the letter asks the recipient to do — pay, call, respond, provide information, etc.",
  "scamIndicators": [
    {
      "indicator": "string - clear description of the suspicious signal",
      "severity": "high|medium|low",
      "sourceEvidence": "string - brief quote or paraphrase from the document"
    }
  ],
  "suspiciousContactNotes": [
    "string - a note ONLY for contacts you have specific reason to flag as suspicious, spoofed, or unverifiable (e.g. non-official domain, mismatched brand, unregistered number). For documents that appear low-risk or legitimate, leave this EMPTY. Do NOT include routine contacts like known government agency lines or contacts that are easily verifiable."
  ],
  "whatToVerify": [
    "string - one specific thing to independently verify before taking action"
  ],
  "safeNextSteps": [
    "string - one concrete safe action"
  ]
}

Guidelines:
- scamIndicators: 2-8 warning signs. HIGH severity: payment red flags (gift card, wire, crypto), threats of arrest/shutdown, identity info requests, sender impersonation, remote access requests; MEDIUM: time pressure, missing case/account numbers, vague sender identity, threat language without specifics; LOW: generic greetings, formatting inconsistencies, grammar errors, vague references
- If the document appears legitimate, scamIndicators may be empty or have only low-severity items
- suspiciousContactNotes: ONLY list contacts that have a specific reason to be flagged — wrong domain for claimed brand, non-standard number for a known institution, short URL, etc. If the document appears low-risk, leave this array EMPTY. Do not generate notes for every contact just as generic caution.
- whatToVerify: 3-6 specific verification steps. Always include: verify sender identity through official public channels (not numbers in the letter)
- safeNextSteps: 4-6 safe actions. Always include: verify through official website, do not call numbers in the letter until verified, do not pay until independently confirmed, preserve the document
- Keep language practical and non-alarming. Help the person stay safe without causing unnecessary panic.`;

async function runTrustCheckAnalysis(
  text: string,
  ruleData: ExtractedRuleData,
  riskScore: number,
  verdict: TrustCheckVerdict,
): Promise<TrustCheckAnalysis> {
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
    `- Rule-based risk score: ${riskScore}/100 → Verdict: ${verdict}`,
  ].join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      { role: "system", content: TRUST_CHECK_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this document for trust and risk:\n\n${ruleContext}\n\n---\n\nDocument text:\n${text}`,
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

  return {
    id: uuidv4(),
    processedAt: new Date().toISOString(),
    riskScore,
    verdict,
    verdictExplanation: parsed.verdictExplanation || "",
    whatItClaims: parsed.whatItClaims || "",
    demandedAction: parsed.demandedAction || "",
    scamIndicators,
    contactDetails,
    deadlines,
    whatToVerify: Array.isArray(parsed.whatToVerify) ? parsed.whatToVerify : [],
    safeNextSteps: Array.isArray(parsed.safeNextSteps) ? parsed.safeNextSteps : [],
  };
}

async function extractTextFromBuffer(
  file: Express.Multer.File,
): Promise<{ text: string; title: string; error?: { status: number; body: object } }> {
  const mime = file.mimetype ?? "";
  const originalName = (file.originalname ?? "").toLowerCase();
  const title = file.originalname.replace(/\.[^.]+$/, "");

  if (mime === "application/pdf" || originalName.endsWith(".pdf")) {
    let pdfText: string | null = null;
    let parseErr: string | null = null;
    try {
      const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
        (pdfMod as any).default ?? (pdfMod as any);
      const result = await pdfParse(file.buffer);
      pdfText = result?.text ?? null;
    } catch (err) {
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
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      const text = result.value ?? "";
      if (!text.trim()) {
        return { text: "", title, error: { status: 422, body: { error: "empty_docx", message: "This Word document appears to be empty or contains no readable text. Please paste the text instead." } } };
      }
      return { text, title };
    } catch {
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

router.post("/trust-check", async (req, res) => {
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
    const riskScore = calculateRiskScore(ruleData, lower);
    const verdict = scoreToVerdict(riskScore);
    const analysis = await runTrustCheckAnalysis(text, ruleData, riskScore, verdict);
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

router.post("/trust-check-upload", upload.single("file"), async (req, res) => {
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

    console.log("[trust-check-upload] extracted", text.length, "chars from", file.originalname);

    try {
      const lower = text.toLowerCase();
      const ruleData = extractRuleData(text);
      const riskScore = calculateRiskScore(ruleData, lower);
      const verdict = scoreToVerdict(riskScore);
      const analysis = await runTrustCheckAnalysis(text, ruleData, riskScore, verdict);
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

router.post("/explain-source-section", async (req, res) => {
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

router.post("/explain-section", async (req, res) => {
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

export default router;
