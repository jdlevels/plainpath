import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { demoDocuments } from "../../lib/demoData.js";
import { trustCheckDemoDocuments } from "../../lib/trustCheckDemoData.js";
import type { DocumentAnalysis, DocumentSection, KeyTerm, ActionPack, TrustCheckAnalysis, TrustCheckVerdict, TrustCheckContactDetail, TrustCheckDeadlineItem, TrustCheckScamIndicator, TrustCheckScores, TrustCheckMetadataFinding } from "../../lib/types.js";

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
  contractRiskTerms: string[];
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
    "respond immediately", "urgent", "last chance", "final opportunity",
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
    // Account-takeover / fund-isolation signals (Tuning Round 3):
    // Scammers instruct victims to move money to "holding", "safe", or "protected" accounts.
    "holding account", "safe account", "protected account",
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
    ["days prior to renewal", "Long cancellation notice requirement"],
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
  const cryptoTerms = ["cryptocurrency", "bitcoin", "ethereum", "crypto", "usdt"];
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

  // Anti-verification instruction — telling recipient not to contact official channels or to use an exclusive hotline.
  // Expanded (Tuning Round 1): catches "do not contact [brand/company] directly" and exclusive-channel demands.
  // Expanded (Tuning Round 3): added paypal, ebay, bank, support, "us" targets; added "do not contact \w+ directly" catch-all.
  const antiVerification = /do\s+not\s+contact\s+(the\b|our\b|us\b|amazon\b|microsoft\b|apple\b|google\b|irs\b|fbi\b|official\b|main\b|paypal\b|ebay\b|bank\b|support\b)|do\s+not\s+contact\s+\w+\s+directly|do\s+not\s+call\s+the\s*(irs|fbi|police|main\s+office|official)|must\s+be\s+resolved\s+exclusively\s+through\s+our|avoid\s+contacting|do\s+not\s+discuss\s+(this|the)|do\s+not\s+speak\s+with\s+(anyone|family)/i;
  // Tuning Round 3: expanded trigger condition — also fires when urgency phrases are present.
  // This catches phishing emails that isolate victims from official channels without using traditional payment red flags.
  if (antiVerification.test(lower) && (data.paymentRedFlags.length > 0 || data.infoRequests.length > 0 || data.urgencyPhrases.length > 0)) score += 12;

  // Compound signal: SSN demand + anti-verification = strong identity-theft pattern (Tuning Round 1)
  const hasSsnDemand = data.infoRequests.some((r) => ["social security number", "ssn"].some((k) => r.includes(k)));
  if (hasSsnDemand && antiVerification.test(lower)) score += 6;

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
  const claimsGovernmentEntity =
    /\b(county|township|municipality|municipal\s+(government|service|court|authority|office)|city\s+of\b|village\s+of\b|town\s+of\b|borough\s+of\b|public\s+works\s+(department|office))\b/i.test(text) ||
    /\b(tax\s+(collector|office|department|authority|division|bureau|portal)|county\s+treasurer|city\s+treasurer|treasurer'?s?\s+office|revenue\s+(office|department|division|bureau)|assessor'?s?\s+office|treasury\s+department|department\s+of\s+(revenue|taxation|finance)|property\s+tax|delinquent\s+tax|back\s+taxes?)\b/i.test(lower);

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
      const hasConstructedPaymentPortal = comDomains.some((d) => {
        const hasGovUtilWord = /(utilities?|electric|water|gas|tax|county|municipal|city|township|treasury|revenue|assessor)/i.test(d);
        const hasPaymentWord = /(pay|portal|payment|bill|collect|account)/i.test(d);
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
  const hasRefNumber =
    /\b(account\s*(number|#|no\.?|id|identifier)|case\s*(number|#|no\.?)|reference\s*(number|#|no\.?)|invoice\s*(number|#|no\.?)|confirmation\s*(number|#|no\.?)|notice\s*(number|#|no\.?)|member\s*(account|number|#|id)|membership\s*(number|#|no\.?)|subscriber\s*(id|number|#)|loan\s*(number|#|no\.?)|policy\s*(number|#|no\.?)|contract\s*(number|#|no\.?))\s*:?\s*[\w\-]+/i.test(text)
    // Also catch bare labels: "Account: 78-2934-16", "Ref: XYZ", "Acct #12345"
    || /\bAccount\s*:\s*[\w\-]{3,}/i.test(text)
    || /\bRef(?:erence)?\s*(?:no\.?|#|:)\s*[\w\-]{3,}/i.test(text)
    || /\bMember\s+(?:Account|ID)\s*(?:no\.?|#|:)?\s*[\w\-]{3,}/i.test(text)
    || /\bAcct\.?\s*(?:no\.?|#|:)?\s*[\w\-]{3,}/i.test(text);
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
  "contractRiskNotes": "string or null — ONLY populate when the document is a binding legal agreement (loan contract, lease, service agreement, employment contract, gym membership, subscription, financing agreement, or any commitment requiring payment or performance) AND it contains potentially harmful consumer terms. Harmful terms include: high default/penalty APR or compounded interest accrual, mandatory arbitration or class-action waiver, repossession or acceleration clauses, deficiency balance exposure, force-placed insurance, GPS/starter-interrupt devices, balloon payments, blanket liens, prepayment penalties, early termination or cancellation fees, auto-renewal or continuous billing traps, credit bureau reporting threats, collections referral, one-sided termination rights, liquidated damages, or non-refundable clause combinations. Write 2-4 sentences in plain language explaining the specific risks. These are CONTRACT risks — distinct from scam/authenticity concerns. A contract can be entirely authentic yet contain provisions that significantly harm the consumer. Return null if not a binding agreement or no significant harmful terms."
}

Guidelines:
- scamIndicators: 0-8 warning signs mapped to authenticity/scam risk only (not contract terms). HIGH: gift card/wire/crypto payment demand, threats of arrest, identity info requests, impersonation signals, instructions to not contact authorities; MEDIUM: time pressure, missing case/account numbers for a payment demand, vague sender identity; LOW: generic greetings, formatting inconsistencies, grammar errors
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

  return {
    id: uuidv4(),
    processedAt: new Date().toISOString(),
    riskScore,
    verdict: finalVerdict,
    verdictExplanation: parsed.verdictExplanation || "",
    whatItClaims: parsed.whatItClaims || "",
    demandedAction: parsed.demandedAction || "",
    scamIndicators,
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
    let pdfMeta: Record<string, string> | undefined;
    let parseErr: string | null = null;
    try {
      const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
      const pdfParse: (buf: Buffer) => Promise<{ text: string; info?: Record<string, string> }> =
        (pdfMod as any).default ?? (pdfMod as any);
      const result = await pdfParse(file.buffer);
      pdfText = result?.text ?? null;
      if (result?.info && typeof result.info === "object") {
        pdfMeta = result.info as Record<string, string>;
      }
    } catch (err) {
      parseErr = err instanceof Error ? err.message : String(err);
    }
    if (parseErr !== null) {
      return { text: "", title, error: { status: 422, body: { error: "corrupt_pdf", message: "This PDF could not be read. It may be corrupted or password-protected. Please try a different file, or copy and paste the text instead." } } };
    }
    if (!pdfText || !pdfText.trim()) {
      return { text: "", title, error: { status: 422, body: { error: "scanned_pdf", message: "This PDF appears to contain only images (scanned document). PlainPath cannot read image-based PDFs — please copy and paste the text instead." } } };
    }
    return { text: pdfText, title, pdfMetadata: pdfMeta };
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
