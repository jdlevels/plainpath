import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { demoDocuments } from "../../lib/demoData.js";
import type { DocumentAnalysis, DocumentSection, KeyTerm, ActionPack } from "../../lib/types.js";

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

  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return res.status(400).json({
      error: "invalid_input",
      message: "Please paste more text — at least 50 characters are needed to generate an action plan.",
    });
  }

  const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
  if (wordCount < 8) {
    return res.status(400).json({
      error: "invalid_input",
      message: "The text you pasted is too short to analyze. Please paste the full document text — at least a few sentences.",
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
      message: "Analysis failed. Please try again. If the problem continues, try pasting a shorter section of your document.",
    });
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "no_file", message: "No file was uploaded." });
  }

  const mime = file.mimetype;
  const originalName = file.originalname.toLowerCase();
  let extractedText = "";
  let detectedTitle = file.originalname.replace(/\.[^.]+$/, "");

  try {
    if (mime === "application/pdf" || originalName.endsWith(".pdf")) {
      const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
        (pdfMod as any).default ?? (pdfMod as any);
      let pdfResult: { text: string };
      try {
        pdfResult = await pdfParse(file.buffer);
      } catch {
        return res.status(422).json({
          error: "unreadable_pdf",
          message: "This PDF could not be read. It may be corrupted, password-protected, or image-based. Please copy and paste the text instead.",
        });
      }
      extractedText = pdfResult.text;
      if (!extractedText?.trim()) {
        return res.status(422).json({
          error: "unreadable_pdf",
          message: "This PDF appears to be image-based or scanned. Please copy and paste the text instead.",
        });
      }
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      originalName.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
      if (!extractedText?.trim()) {
        return res.status(422).json({
          error: "unreadable_docx",
          message: "Could not extract text from this Word document. Please paste the text instead.",
        });
      }
    } else if (mime === "text/plain" || originalName.endsWith(".txt")) {
      extractedText = file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({
        error: "unsupported_type",
        message: "Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file.",
      });
    }

    const rawTextForSections = extractedText;
    if (extractedText.length > 60000) {
      extractedText = extractedText.slice(0, 60000);
    }

    const documentTypeHint = typeof req.body?.documentTypeHint === "string" ? req.body.documentTypeHint : undefined;
    const analysis = await runAnalysis(extractedText, detectedTitle, documentTypeHint, rawTextForSections);
    return res.json({ analysis });
  } catch (error) {
    return res.status(500).json({
      error: "analysis_failed",
      message: "Analysis failed. Please try again. If the problem continues, try pasting the document text instead.",
    });
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
