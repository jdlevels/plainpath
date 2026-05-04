// ── PlainPath Document Completion Engine — Core Types ─────────────────────────
// Phase 2 of the Analyze a Document overhaul.
// No UI exposure. Parser and types only.

export type CompletionObjectType =
  | "action_step"
  | "required_document"
  | "missing_document"
  | "signature_needed"
  | "deadline"
  | "risk"
  | "question_to_ask"
  | "source_evidence"
  | "user_note"
  | "packet_section";

export type CompletionStatus =
  | "not_started"
  | "in_progress"
  | "gathered"
  | "completed"
  | "not_applicable"
  | "needs_help";

export type CompletionPriority = "critical" | "high" | "medium" | "low";

export interface CompletionObject {
  id: string;
  type: CompletionObjectType;
  title: string;
  plainEnglishExplanation: string;
  whyItMatters: string;
  whatToDo: string;
  whereToGetThis: string | null;
  sourceQuote: string | null;
  sourcePage: string | null;
  sourceSection: string | null;
  priority: CompletionPriority;
  severity: CompletionPriority | null;
  dueDate: string | null;
  trigger: string | null;
  status: CompletionStatus;
  userNotes: string | null;
  uploadedFileId: string | null;
  includedInPacket: boolean;
  createdFromAnalysisSection: string | null;
}

export const ALL_COMPLETION_OBJECT_TYPES: CompletionObjectType[] = [
  "action_step",
  "required_document",
  "missing_document",
  "signature_needed",
  "deadline",
  "risk",
  "question_to_ask",
  "source_evidence",
  "user_note",
  "packet_section",
];

export const ALL_COMPLETION_STATUSES: CompletionStatus[] = [
  "not_started",
  "in_progress",
  "gathered",
  "completed",
  "not_applicable",
  "needs_help",
];

export const ALL_COMPLETION_PRIORITIES: CompletionPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

// ── AnalysisInput — mirrors DocumentAnalysis from @workspace/api-client-react ─
// Defined locally so the completion engine has no cross-project build dependency.
// Must stay structurally compatible with DocumentAnalysis.

export interface AnalysisActionStep {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  completed: boolean;
  sourceEvidence?: string;
  confidence: "high" | "medium" | "low";
  deadline?: string;
}

export interface AnalysisRequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  obtained: boolean;
  sourceEvidence?: string;
  confidence: "high" | "medium" | "low";
}

export interface AnalysisDeadline {
  id: string;
  title: string;
  date: string;
  description: string;
  isHard: boolean;
  sourceEvidence?: string;
  confidence: "high" | "medium" | "low";
  consequence?: string;
}

export interface AnalysisFollowUpQuestion {
  id: string;
  question: string;
  context: string;
  answered: boolean;
  answer?: string;
}

export interface AnalysisRiskItem {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  sourceEvidence?: string;
}

export interface AnalysisKeyTerm {
  id: string;
  term: string;
  severity: "high" | "medium" | "low";
  category: string;
  explanation: string;
  whyItMatters: string;
  watchOut: string;
  questionToAsk?: string;
}

export interface AnalysisActionPackQuestion {
  id: string;
  question: string;
  context: string;
}

export interface AnalysisActionPackGatherItem {
  id: string;
  item: string;
  description: string;
  category?: string;
}

export interface AnalysisActionPackDraft {
  id: string;
  label: string;
  draft: string;
}

export interface AnalysisActionPackCheckItem {
  id: string;
  text: string;
}

export interface AnalysisActionPack {
  questionsToAsk: AnalysisActionPackQuestion[];
  whatToGather: AnalysisActionPackGatherItem[];
  whatToSay: AnalysisActionPackDraft[];
  beforeYouActChecklist: AnalysisActionPackCheckItem[];
}

export interface AnalysisDocumentSection {
  id: string;
  title?: string;
  content: string;
}

export interface AnalysisPlainEnglishSections {
  whatItIs: string;
  whatItSays: string;
  whatItAsks: string;
  obligations: string;
  payAttentionTo: string;
  nextSteps: string;
}

export interface AnalysisInput {
  id: string;
  title: string;
  summary: string;
  documentType: string;
  actionSteps: AnalysisActionStep[];
  requiredDocuments: AnalysisRequiredDocument[];
  deadlines: AnalysisDeadline[];
  followUpQuestions: AnalysisFollowUpQuestion[];
  risks: AnalysisRiskItem[];
  overallConfidence: "high" | "medium" | "low";
  processedAt: string;
  plainEnglish?: AnalysisPlainEnglishSections;
  sections?: AnalysisDocumentSection[];
  keyTerms?: AnalysisKeyTerm[];
  actionPack?: AnalysisActionPack;
}
