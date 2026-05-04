// ── PlainPath Document Completion Engine — Parser ─────────────────────────────
// Converts an existing DocumentAnalysis into CompletionObject[].
//
// Rules:
//   - Deterministic. No AI calls. No external API calls.
//   - Never fabricates source quotes or page numbers.
//   - If a field is unknown, it is null or empty string.
//   - whereToGetThis uses conservative guidance only when document type clearly supports it.
//   - Signature objects always direct the user to the official issuer.
//   - Does not mutate the input analysis object.
//   - Does not reference removed tools (Redact, Trust Check, Compare, etc.).

import type {
  AnalysisInput,
  CompletionObject,
  CompletionPriority,
  CompletionStatus,
} from "./completionTypes";

// ── Signature detection ────────────────────────────────────────────────────────

const SIGNATURE_KEYWORDS = [
  "sign",
  "signature",
  "signed",
  "execute",
  "executed",
  "execution",
  "notarize",
  "notarized",
  "notarization",
  "initial",
  "countersign",
  "wet signature",
  "e-sign",
  "esign",
  "authorization",
  "authorized signature",
  "sign here",
  "sign below",
  "signature required",
  "must be signed",
  "requires signature",
  "needs your signature",
];

function containsSignatureKeyword(text: string | undefined | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SIGNATURE_KEYWORDS.some((k) => lower.includes(k));
}

// ── Missing document detection ─────────────────────────────────────────────────

const MISSING_DOC_KEYWORDS = [
  "exhibit",
  "attachment",
  "schedule",
  "appendix",
  "addendum",
  "referenced but not",
  "not included",
  "not provided",
  "not attached",
  "not submitted",
  "not uploaded",
  "not found",
  "missing from",
  "see attached",
  "see exhibit",
  "see schedule",
  "see appendix",
];

function isMissingDocumentHint(text: string | undefined | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return MISSING_DOC_KEYWORDS.some((k) => lower.includes(k));
}

// ── Priority helpers ───────────────────────────────────────────────────────────

function riskSeverityToPriority(severity: "high" | "medium" | "low"): CompletionPriority {
  switch (severity) {
    case "high":   return "critical";
    case "medium": return "high";
    case "low":    return "medium";
  }
}

function actionStepPriorityToCompletion(
  priority: "high" | "medium" | "low"
): CompletionPriority {
  switch (priority) {
    case "high":   return "high";
    case "medium": return "medium";
    case "low":    return "low";
  }
}

function confidenceToRequiredDocPriority(
  required: boolean,
  confidence: "high" | "medium" | "low"
): CompletionPriority {
  if (!required) return "low";
  return confidence === "low" ? "medium" : "high";
}

// ── ID generator ──────────────────────────────────────────────────────────────

function makeId(prefix: string, sourceId: string): string {
  return `ce-${prefix}-${sourceId}`;
}

// ── Deduplication guard ───────────────────────────────────────────────────────

function isDuplicateSignature(
  existing: CompletionObject[],
  title: string
): boolean {
  const norm = title.toLowerCase().trim();
  return existing.some(
    (obj) =>
      obj.type === "signature_needed" &&
      obj.title.toLowerCase().trim() === norm
  );
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function analysisResultToCompletionObjects(
  analysis: AnalysisInput
): CompletionObject[] {
  const result: CompletionObject[] = [];
  const DEFAULT_STATUS: CompletionStatus = "not_started";

  // 1 ── Action steps → action_step ─────────────────────────────────────────
  for (const step of analysis.actionSteps) {
    const isSig =
      containsSignatureKeyword(step.title) ||
      containsSignatureKeyword(step.description) ||
      containsSignatureKeyword(step.sourceEvidence);

    if (isSig) {
      const sigTitle = step.title;
      if (!isDuplicateSignature(result, sigTitle)) {
        result.push({
          id: makeId("sig", step.id),
          type: "signature_needed",
          title: sigTitle,
          plainEnglishExplanation: step.description || step.title,
          whyItMatters:
            "A required signature is missing or not yet obtained. The document may not be legally effective without it.",
          whatToDo:
            "Obtain and sign the official document, or request the signable copy from the issuing party.",
          whereToGetThis:
            "Request the official signable or executed copy from the original sender, portal, school, agency, employer, landlord, provider, insurer, court, or document issuer.",
          sourceQuote: step.sourceEvidence ?? null,
          sourcePage: null,
          sourceSection: step.category ?? "Action Steps",
          priority: "critical",
          severity: "critical",
          dueDate: null,
          trigger: null,
          status: DEFAULT_STATUS,
          userNotes: null,
          uploadedFileId: null,
          includedInPacket: true,
          createdFromAnalysisSection: "actionSteps",
        });
      }
      continue;
    }

    result.push({
      id: makeId("act", step.id),
      type: "action_step",
      title: step.title,
      plainEnglishExplanation: step.description || step.title,
      whyItMatters: step.sourceEvidence
        ? `Based on: "${step.sourceEvidence}"`
        : "This step was identified as a required action from the document.",
      whatToDo: step.description || step.title,
      whereToGetThis: null,
      sourceQuote: step.sourceEvidence ?? null,
      sourcePage: null,
      sourceSection: step.category ?? "Action Steps",
      priority: actionStepPriorityToCompletion(step.priority),
      severity: null,
      dueDate: null,
      trigger: null,
      status: DEFAULT_STATUS,
      userNotes: null,
      uploadedFileId: null,
      includedInPacket: true,
      createdFromAnalysisSection: "actionSteps",
    });
  }

  // 2 ── Required documents → required_document or missing_document ───────────
  for (const doc of analysis.requiredDocuments) {
    const combinedText = [doc.name, doc.description, doc.sourceEvidence ?? ""].join(" ");
    const isMissing = isMissingDocumentHint(combinedText);
    const type = isMissing ? "missing_document" : "required_document";
    const priority = confidenceToRequiredDocPriority(doc.required, doc.confidence);

    result.push({
      id: makeId(isMissing ? "mis" : "req", doc.id),
      type,
      title: doc.name,
      plainEnglishExplanation: doc.description || doc.name,
      whyItMatters: doc.required
        ? "This document is required. Without it, you may not be able to complete or submit the relevant process."
        : "This document is recommended to support your position or completion of this process.",
      whatToDo: doc.obtained
        ? "Document already obtained. Confirm it is the correct version before including."
        : `Locate and gather: ${doc.name}.`,
      whereToGetThis: isMissing
        ? "Obtain the referenced document from the original issuer, sending party, or the portal/office it was attached to."
        : null,
      sourceQuote: doc.sourceEvidence ?? null,
      sourcePage: null,
      sourceSection: "Required Documents",
      priority,
      severity: null,
      dueDate: null,
      trigger: null,
      status: doc.obtained ? "gathered" : DEFAULT_STATUS,
      userNotes: null,
      uploadedFileId: null,
      includedInPacket: true,
      createdFromAnalysisSection: "requiredDocuments",
    });
  }

  // 3 ── Deadlines → deadline ────────────────────────────────────────────────
  for (const dl of analysis.deadlines) {
    const priority: CompletionPriority = dl.isHard ? "critical" : "high";

    result.push({
      id: makeId("dl", dl.id),
      type: "deadline",
      title: dl.title,
      plainEnglishExplanation: dl.description || dl.title,
      whyItMatters: dl.isHard
        ? "This is a hard deadline. Missing it may result in loss of rights, penalties, or rejection of your submission."
        : "This deadline is noted in the document. Aim to complete the related task before this date.",
      whatToDo: `Complete all related tasks before: ${dl.date || dl.description || "the date specified in the document"}.`,
      whereToGetThis: null,
      sourceQuote: dl.sourceEvidence ?? null,
      sourcePage: null,
      sourceSection: "Deadlines",
      priority,
      severity: priority,
      dueDate: dl.date ?? null,
      trigger: null,
      status: DEFAULT_STATUS,
      userNotes: null,
      uploadedFileId: null,
      includedInPacket: true,
      createdFromAnalysisSection: "deadlines",
    });
  }

  // 4 ── Risks → risk ────────────────────────────────────────────────────────
  for (const risk of analysis.risks) {
    const isSig =
      containsSignatureKeyword(risk.title) ||
      containsSignatureKeyword(risk.description) ||
      containsSignatureKeyword(risk.sourceEvidence);

    if (isSig) {
      const sigTitle = `Signature issue: ${risk.title}`;
      if (!isDuplicateSignature(result, sigTitle)) {
        result.push({
          id: makeId("rsig", risk.id),
          type: "signature_needed",
          title: sigTitle,
          plainEnglishExplanation: risk.description || risk.title,
          whyItMatters:
            "A signature-related risk was identified. The document may not be binding or valid without the correct signature.",
          whatToDo:
            "Obtain the official signable copy and ensure it is properly executed.",
          whereToGetThis:
            "Request the official signable or executed copy from the original sender, portal, school, agency, employer, landlord, provider, insurer, court, or document issuer.",
          sourceQuote: risk.sourceEvidence ?? null,
          sourcePage: null,
          sourceSection: "Risks",
          priority: "critical",
          severity: "critical",
          dueDate: null,
          trigger: null,
          status: DEFAULT_STATUS,
          userNotes: null,
          uploadedFileId: null,
          includedInPacket: true,
          createdFromAnalysisSection: "risks",
        });
      }
      continue;
    }

    result.push({
      id: makeId("rsk", risk.id),
      type: "risk",
      title: risk.title,
      plainEnglishExplanation: risk.description || risk.title,
      whyItMatters: risk.description || "This risk was identified in the document and should be addressed.",
      whatToDo: "Review this risk and determine whether action is needed. Consult the relevant party if you are unsure.",
      whereToGetThis: null,
      sourceQuote: risk.sourceEvidence ?? null,
      sourcePage: null,
      sourceSection: "Risks",
      priority: riskSeverityToPriority(risk.severity),
      severity: riskSeverityToPriority(risk.severity),
      dueDate: null,
      trigger: null,
      status: DEFAULT_STATUS,
      userNotes: null,
      uploadedFileId: null,
      includedInPacket: true,
      createdFromAnalysisSection: "risks",
    });
  }

  // 5 ── Follow-up questions → question_to_ask ───────────────────────────────
  for (const q of analysis.followUpQuestions) {
    result.push({
      id: makeId("fq", q.id),
      type: "question_to_ask",
      title: q.question,
      plainEnglishExplanation: q.context || q.question,
      whyItMatters:
        "This question should be clarified with the issuing party before finalizing your response or submission.",
      whatToDo: `Ask: "${q.question}"`,
      whereToGetThis: null,
      sourceQuote: null,
      sourcePage: null,
      sourceSection: "Follow-Up Questions",
      priority: "medium",
      severity: null,
      dueDate: null,
      trigger: null,
      status: q.answered ? "completed" : DEFAULT_STATUS,
      userNotes: q.answer ?? null,
      uploadedFileId: null,
      includedInPacket: true,
      createdFromAnalysisSection: "followUpQuestions",
    });
  }

  // 6 ── Action pack questions → question_to_ask ────────────────────────────
  if (analysis.actionPack?.questionsToAsk) {
    for (const q of analysis.actionPack.questionsToAsk) {
      result.push({
        id: makeId("apq", q.id),
        type: "question_to_ask",
        title: q.question,
        plainEnglishExplanation: q.context || q.question,
        whyItMatters:
          "This question was identified in the action pack as something to clarify before proceeding.",
        whatToDo: `Ask: "${q.question}"`,
        whereToGetThis: null,
        sourceQuote: null,
        sourcePage: null,
        sourceSection: "Action Pack — Questions",
        priority: "medium",
        severity: null,
        dueDate: null,
        trigger: null,
        status: DEFAULT_STATUS,
        userNotes: null,
        uploadedFileId: null,
        includedInPacket: true,
        createdFromAnalysisSection: "actionPack.questionsToAsk",
      });
    }
  }

  // 7 ── Action pack — what to gather → required_document (if not already present) ──
  if (analysis.actionPack?.whatToGather) {
    const existingDocTitles = new Set(
      result
        .filter((o) => o.type === "required_document" || o.type === "missing_document")
        .map((o) => o.title.toLowerCase().trim())
    );

    for (const g of analysis.actionPack.whatToGather) {
      const normTitle = g.item.toLowerCase().trim();
      if (existingDocTitles.has(normTitle)) continue;

      const isMissing = isMissingDocumentHint([g.item, g.description].join(" "));
      result.push({
        id: makeId(isMissing ? "apm" : "apg", g.id),
        type: isMissing ? "missing_document" : "required_document",
        title: g.item,
        plainEnglishExplanation: g.description || g.item,
        whyItMatters:
          "This item was identified in the action pack as something you should gather before proceeding.",
        whatToDo: `Gather: ${g.item}. ${g.description || ""}`.trim(),
        whereToGetThis: isMissing
          ? "Obtain from the original issuer, sending party, or the portal/office it was attached to."
          : null,
        sourceQuote: null,
        sourcePage: null,
        sourceSection: "Action Pack — What to Gather",
        priority: "medium",
        severity: null,
        dueDate: null,
        trigger: null,
        status: DEFAULT_STATUS,
        userNotes: null,
        uploadedFileId: null,
        includedInPacket: true,
        createdFromAnalysisSection: "actionPack.whatToGather",
      });
      existingDocTitles.add(normTitle);
    }
  }

  // 8 ── Action pack — before-you-act checklist → signature_needed if applicable ─
  if (analysis.actionPack?.beforeYouActChecklist) {
    for (const item of analysis.actionPack.beforeYouActChecklist) {
      if (!containsSignatureKeyword(item.text)) continue;
      const sigTitle = item.text.length > 80 ? item.text.slice(0, 80) + "…" : item.text;
      if (isDuplicateSignature(result, sigTitle)) continue;

      result.push({
        id: makeId("bsig", item.id),
        type: "signature_needed",
        title: sigTitle,
        plainEnglishExplanation: item.text,
        whyItMatters:
          "A signature-related check was identified before you act. Confirm the document has been properly signed before proceeding.",
        whatToDo:
          "Confirm the required signature is in place. Obtain the official signable copy if not yet signed.",
        whereToGetThis:
          "Request the official signable or executed copy from the original sender, portal, school, agency, employer, landlord, provider, insurer, court, or document issuer.",
        sourceQuote: null,
        sourcePage: null,
        sourceSection: "Action Pack — Before You Act",
        priority: "critical",
        severity: "critical",
        dueDate: null,
        trigger: null,
        status: DEFAULT_STATUS,
        userNotes: null,
        uploadedFileId: null,
        includedInPacket: true,
        createdFromAnalysisSection: "actionPack.beforeYouActChecklist",
      });
    }
  }

  // 9 ── Key terms — signature-related → signature_needed ───────────────────
  if (analysis.keyTerms) {
    for (const kt of analysis.keyTerms) {
      const isSig =
        containsSignatureKeyword(kt.term) ||
        containsSignatureKeyword(kt.watchOut) ||
        containsSignatureKeyword(kt.explanation);
      if (!isSig) continue;

      const sigTitle = `Signature term: ${kt.term}`;
      if (isDuplicateSignature(result, sigTitle)) continue;

      result.push({
        id: makeId("ktsig", kt.id),
        type: "signature_needed",
        title: sigTitle,
        plainEnglishExplanation: kt.explanation || kt.term,
        whyItMatters: kt.whyItMatters || kt.watchOut || "This term relates to a signature requirement.",
        whatToDo:
          "Ensure the relevant signature provision is satisfied. Obtain the official signable copy from the issuing party.",
        whereToGetThis:
          "Request the official signable or executed copy from the original sender, portal, school, agency, employer, landlord, provider, insurer, court, or document issuer.",
        sourceQuote: null,
        sourcePage: null,
        sourceSection: "Key Terms",
        priority: "critical",
        severity: "critical",
        dueDate: null,
        trigger: null,
        status: DEFAULT_STATUS,
        userNotes: null,
        uploadedFileId: null,
        includedInPacket: true,
        createdFromAnalysisSection: "keyTerms",
      });
    }
  }

  // 10 ── Key terms — questions to ask → question_to_ask ─────────────────────
  if (analysis.keyTerms) {
    for (const kt of analysis.keyTerms) {
      if (!kt.questionToAsk) continue;
      result.push({
        id: makeId("ktq", kt.id),
        type: "question_to_ask",
        title: kt.questionToAsk,
        plainEnglishExplanation: `Regarding the term "${kt.term}": ${kt.questionToAsk}`,
        whyItMatters: kt.whyItMatters || `This question relates to a key term in the document: "${kt.term}".`,
        whatToDo: `Ask: "${kt.questionToAsk}"`,
        whereToGetThis: null,
        sourceQuote: null,
        sourcePage: null,
        sourceSection: "Key Terms",
        priority: "medium",
        severity: null,
        dueDate: null,
        trigger: null,
        status: DEFAULT_STATUS,
        userNotes: null,
        uploadedFileId: null,
        includedInPacket: true,
        createdFromAnalysisSection: "keyTerms",
      });
    }
  }

  // 11 ── Source sections → source_evidence (key sections only) ─────────────
  if (analysis.sections) {
    for (const section of analysis.sections) {
      if (!section.title && !section.content) continue;
      result.push({
        id: makeId("sec", section.id),
        type: "source_evidence",
        title: section.title || "Document Section",
        plainEnglishExplanation: section.content.slice(0, 300) + (section.content.length > 300 ? "…" : ""),
        whyItMatters: "This is a source section from the uploaded document.",
        whatToDo: "Review this section for context supporting other completion items.",
        whereToGetThis: null,
        sourceQuote: section.content.slice(0, 500) || null,
        sourcePage: null,
        sourceSection: section.title ?? null,
        priority: "low",
        severity: null,
        dueDate: null,
        trigger: null,
        status: "not_started",
        userNotes: null,
        uploadedFileId: null,
        includedInPacket: false,
        createdFromAnalysisSection: "sections",
      });
    }
  }

  return result;
}
