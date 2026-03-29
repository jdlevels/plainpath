import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { demoDocuments } from "../../lib/demoData.js";
import type { DocumentAnalysis, DocumentSection } from "../../lib/types.js";

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
- Priority: high = must do first or has dependencies, medium = important but flexible, low = optional`;

async function runAnalysis(text: string, title?: string, documentTypeHint?: string, rawText?: string): Promise<DocumentAnalysis> {
  const hintLine = documentTypeHint ? `\nUser-specified document category: ${documentTypeHint}` : "";
  const userMessage = title
    ? `Document Title: ${title}${hintLine}\n\n---\n\n${text}`
    : `${hintLine ? hintLine + "\n\n" : ""}${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
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
      message: "Please provide document text with at least 50 characters.",
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "analysis_failed", message });
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "analysis_failed", message });
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
