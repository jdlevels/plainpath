import { Router, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../../lib/logger";

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

export default router;
