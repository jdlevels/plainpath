import { Router, type Request, type Response } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../../lib/logger";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

// POST /api/contracts/insight
// Returns live AI insights for the current intake step and answers.
router.post("/insight", async (req: Request, res: Response) => {
  const { contractType, step, people, scope, money, protection } = req.body;

  if (!contractType) {
    return res.status(400).json({ error: "contract_type_required", message: "contractType is required." });
  }

  const systemPrompt = `You are a plain-language contract assistant helping a user build a ${contractType} agreement step by step.

Return ONLY valid JSON — no markdown fences, no prose — in exactly this shape:
{
  "suggestions": ["string", ...],
  "warnings": ["string", ...],
  "draftGuidance": ["string", ...]
}

Rules:
- suggestions: things they might want to add (0–3 items)
- warnings: risks or missing protections (0–3 items)
- draftGuidance: what their answers will produce in the draft — use "Based on X, [clause] will be added" phrasing (0–3 items)
- Each item must be under 18 words, plain English, specific to their actual answers
- Do not repeat information already provided in another array
- Return empty arrays if there is nothing useful to say`;

  const userPrompt = `Contract: ${contractType} | Step: ${step}
People: ${JSON.stringify(people ?? {})}
Scope: ${JSON.stringify(scope ?? {})}
Money: ${JSON.stringify(money ?? {})}
Protection: ${JSON.stringify(protection ?? {})}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.25,
      max_completion_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return res.json({
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      draftGuidance: Array.isArray(parsed.draftGuidance) ? parsed.draftGuidance : [],
    });
  } catch {
    return res.json({ suggestions: [], warnings: [], draftGuidance: [] });
  }
});

// POST /api/contracts/generate-draft
// Returns a structured draft payload from the completed intake answers.
router.post("/generate-draft", async (req: Request, res: Response) => {
  const { contractType, people, scope, money, protection } = req.body;

  if (!contractType) {
    return res.status(400).json({ error: "missing_data", message: "contractType is required." });
  }

  const systemPrompt = `You are a plain-language contract assistant. Generate a structured draft payload for a ${contractType} agreement.

Return ONLY valid JSON — no markdown fences — in exactly this shape:
{
  "contractType": "string",
  "parties": {
    "partyA": { "label": "string", "name": "string", "type": "string" },
    "partyB": { "label": "string", "name": "string", "type": "string" }
  },
  "sections": [
    { "title": "string", "clauses": ["string", ...] }
  ],
  "paymentSummary": ["string", ...],
  "protectionSummary": ["string", ...],
  "defaultClauses": ["string", ...],
  "reviewFlags": ["string", ...],
  "missingProtections": ["string", ...],
  "plainEnglishSummary": ["string", ...]
}

Rules:
- sections: cover Services/Scope, Payment, Intellectual Property, Termination, Dispute Resolution (5 sections)
- Each clause is a concrete, specific statement derived from the intake data
- If data is missing for a field, write the clause with "[TBD]" placeholder
- paymentSummary: 2–4 key payment bullet points
- protectionSummary: 2–4 key rights/protection bullet points
- defaultClauses: standard boilerplate to be added (Severability, Force Majeure, Entire Agreement, Notices)
- reviewFlags: clauses or provisions that warrant human review before signing
- missingProtections: recommended protections NOT included by the user
- plainEnglishSummary: 5–8 bullet points summarising the whole agreement simply`;

  const userPrompt = `Generate a draft for:
Contract: ${contractType}
People: ${JSON.stringify(people ?? {})}
Scope: ${JSON.stringify(scope ?? {})}
Money: ${JSON.stringify(money ?? {})}
Protection: ${JSON.stringify(protection ?? {})}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_completion_tokens: 2500,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const draft = JSON.parse(cleaned);
    return res.json({ draft, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "contracts/generate-draft failed");
    return res.status(500).json({
      error: "generation_failed",
      message: "Draft generation failed. Please try again.",
    });
  }
});

// POST /api/contracts/review
// Contract Review — clause-by-clause fairness analysis of a contract the user received.
// Accepts JSON { text } or multipart { file }.
router.post("/review", upload.single("file"), async (req: Request, res: Response) => {
  let text = "";

  if (req.file) {
    try {
      const mime = req.file.mimetype;
      if (mime === "application/pdf" || req.file.originalname?.endsWith(".pdf")) {
        const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
        const parsed = await pdfParse(req.file.buffer);
        text = parsed.text ?? "";
      } else if (
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        req.file.originalname?.endsWith(".docx")
      ) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value ?? "";
      } else {
        text = req.file.buffer.toString("utf-8");
      }
    } catch (err) {
      logger.error({ err }, "contracts/review file extraction failed");
      return res.status(422).json({ message: "Could not read the uploaded file. Try a different format." });
    }
  } else {
    text = typeof req.body?.text === "string" ? req.body.text : "";
  }

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ message: "Please provide at least 50 characters of contract text." });
  }

  const systemPrompt = `You are a contract review expert working on behalf of the person who received this contract — they did NOT write it and need to know if it's fair, what risks they're taking on, and what to negotiate before signing.

Return ONLY valid JSON — no markdown fences — in exactly this shape:
{
  "overallScore": number (0-100, where 100 = completely fair and balanced for the reader),
  "verdict": "Fair" | "Mostly Fair" | "Some Concerns" | "Significant Issues" | "Heavily One-Sided",
  "summary": "2-3 sentence plain English overall assessment of the contract's fairness and key risks",
  "clauses": [
    {
      "id": "c1",
      "text": "Short label or excerpt identifying the clause (max 100 chars)",
      "rating": "fair" | "watch-out" | "red-flag",
      "explanation": "Plain English: what this clause actually means for the reader (max 70 words)",
      "whyUnfair": "Why this clause is problematic or risky — null if rating is fair (max 70 words)",
      "negotiationLanguage": "Specific suggested revision wording the reader can copy and send back — null if rating is fair (max 160 words, include actual replacement clause text)",
      "exitGuidance": "What the reader should know if they've already signed or if this clause may be unenforceable — null if rating is fair (max 60 words)"
    }
  ],
  "missingProtections": [
    "Short plain-English statement of an important protection missing from this contract (e.g. 'No payment protection if the project is cancelled mid-way')"
  ],
  "preSigningChecklist": [
    "Specific action item or verification the reader should complete before signing (e.g. 'Confirm the payment schedule aligns with your invoicing cycle')"
  ]
}

Score guide: 80-100 = Fair, 60-79 = Mostly Fair, 40-59 = Some Concerns, 20-39 = Significant Issues, 0-19 = Heavily One-Sided.

Rules:
- clauses: 5-20 items covering real obligations, rights, or restrictions. Skip purely administrative boilerplate (section headings, "entire agreement" mergers, page references)
- Use "watch-out" for vague, unusual, or one-sided clauses that deserve attention or negotiation
- Use "red-flag" for clearly harmful, exploitative, or potentially unenforceable clauses  
- negotiationLanguage must be specific — not "you may want to request a revision." Include actual suggested replacement text the reader can send
- missingProtections: 2-5 items — important protections a fair contract of this type should have but this one lacks or poorly addresses
- preSigningChecklist: 3-6 specific verifications the reader should do before signing, tailored to this contract's actual content
- All language plain English — no legal jargon. Frame as understanding, risk awareness, and negotiation guidance`;

  const userPrompt = `Review this contract:\n\n${text.slice(0, 12000)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_completion_tokens: 4500,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const result = JSON.parse(cleaned);

    return res.json({
      overallScore: typeof result.overallScore === "number" ? Math.max(0, Math.min(100, result.overallScore)) : 50,
      verdict: typeof result.verdict === "string" ? result.verdict : "Some Concerns",
      summary: typeof result.summary === "string" ? result.summary : "",
      clauses: Array.isArray(result.clauses) ? result.clauses : [],
      missingProtections: Array.isArray(result.missingProtections) ? result.missingProtections : [],
      preSigningChecklist: Array.isArray(result.preSigningChecklist) ? result.preSigningChecklist : [],
      reviewedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "contracts/review failed");
    return res.status(500).json({ message: "Review failed. Please try again." });
  }
});

// POST /api/contracts/scan-images
// Camera scan → Contract Review: extract text from images, then run review.
router.post("/scan-images", async (req: Request, res: Response) => {
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
    if (img.length > 8 * 1024 * 1024) {
      return res.status(413).json({ message: `Page ${i + 1} image is too large. Please try a lower-resolution photo.` });
    }
  }

  console.debug(`[contracts/scan-images] Extracting text from ${images.length} page(s)`);

  try {
    const extractedTexts: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Extract ALL text from this contract image exactly as it appears. Include every word, number, clause, and symbol. Output only the raw extracted text, nothing else." },
            { type: "image_url", image_url: { url: images[i], detail: "high" } },
          ],
        }],
        max_completion_tokens: 4000,
      });
      const pageText = resp.choices[0]?.message?.content?.trim() ?? "";
      if (pageText) extractedTexts.push(images.length > 1 ? `--- Page ${i + 1} ---\n${pageText}` : pageText);
    }

    const text = extractedTexts.join("\n\n");
    if (!text || text.trim().length < 50) {
      return res.status(422).json({ message: "Could not extract readable text from the photo. Please try a clearer, well-lit image." });
    }

    console.debug(`[contracts/scan-images] Extracted ${text.length} chars — running review`);

    const systemPrompt = `You are a contract review expert working on behalf of the person who received this contract — they did NOT write it and need to know if it's fair, what risks they're taking on, and what to negotiate before signing.

Return ONLY valid JSON — no markdown fences — in exactly this shape:
{
  "overallScore": number (0-100, where 100 = completely fair and balanced for the reader),
  "verdict": "Fair" | "Mostly Fair" | "Some Concerns" | "Significant Issues" | "Heavily One-Sided",
  "summary": "2-3 sentence plain English overall assessment of the contract's fairness and key risks",
  "clauses": [
    {
      "id": "c1",
      "text": "Short label or excerpt identifying the clause (max 100 chars)",
      "rating": "fair" | "watch-out" | "red-flag",
      "explanation": "Plain English: what this clause actually means for the reader (max 70 words)",
      "whyUnfair": "Why this clause is problematic or risky — null if rating is fair (max 70 words)",
      "negotiationLanguage": "Specific suggested revision wording the reader can copy and send back — null if rating is fair (max 160 words, include actual replacement clause text)",
      "exitGuidance": "What the reader should know if they've already signed or if this clause may be unenforceable — null if rating is fair (max 60 words)"
    }
  ],
  "missingProtections": ["Short plain-English statement of an important protection missing from this contract"],
  "preSigningChecklist": ["Specific action item or verification the reader should complete before signing"]
}

Score guide: 80-100 = Fair, 60-79 = Mostly Fair, 40-59 = Some Concerns, 20-39 = Significant Issues, 0-19 = Heavily One-Sided.
Rules: clauses 5-20 items, negotiationLanguage must include actual replacement text, missingProtections 2-5 items, preSigningChecklist 3-6 items.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Review this contract:\n\n${text.slice(0, 12000)}` },
      ],
      temperature: 0.2,
      max_completion_tokens: 4500,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const result = JSON.parse(cleaned);

    return res.json({
      overallScore: typeof result.overallScore === "number" ? Math.max(0, Math.min(100, result.overallScore)) : 50,
      verdict: typeof result.verdict === "string" ? result.verdict : "Some Concerns",
      summary: typeof result.summary === "string" ? result.summary : "",
      clauses: Array.isArray(result.clauses) ? result.clauses : [],
      missingProtections: Array.isArray(result.missingProtections) ? result.missingProtections : [],
      preSigningChecklist: Array.isArray(result.preSigningChecklist) ? result.preSigningChecklist : [],
      reviewedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "contracts/scan-images failed");
    return res.status(500).json({ error: "scan_failed", message: "Scan review failed. Please try again with a clearer, well-lit photo." });
  }
});

// POST /api/contracts/negotiate-clause
// Generates a polished negotiation email for a specific flagged clause.
router.post("/negotiate-clause", async (req: Request, res: Response) => {
  const { clauseText, explanation, whyUnfair, negotiationLanguage, contractType } = req.body;
  if (!clauseText) {
    return res.status(400).json({ error: "clause_required", message: "clauseText is required." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a professional negotiation assistant. Write a concise, polite, professional negotiation email that the recipient can send to request a change to a problematic contract clause. The email should:
- Be direct but courteous
- Reference the specific clause concern
- Propose a fair alternative or request clarification
- Be 3–5 short paragraphs
- Sound like it was written by a professional, not a lawyer
- Not be aggressive or confrontational
Return only the email body (no subject line, no "Hi/Dear" opening — just the paragraphs).`,
        },
        {
          role: "user",
          content: `Contract type: ${contractType || "general agreement"}
Clause: ${clauseText}
Why it's a concern: ${whyUnfair || explanation || "This clause is one-sided or unusual."}
Suggested revision: ${negotiationLanguage || "Please provide a balanced alternative."}

Write a negotiation email body I can send.`,
        },
      ],
    });

    const emailBody = response.choices[0]?.message?.content?.trim() ?? "Unable to generate email. Please try again.";
    return res.json({ emailBody });
  } catch (err) {
    logger.error({ err }, "contracts/negotiate-clause failed");
    return res.status(500).json({ message: "Failed to generate negotiation email. Please try again." });
  }
});

export default router;
