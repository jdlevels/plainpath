export interface ActionStep {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  completed: boolean;
  sourceEvidence?: string;
  confidence: "high" | "medium" | "low";
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  obtained: boolean;
  sourceEvidence?: string;
  confidence: "high" | "medium" | "low";
}

export interface Deadline {
  id: string;
  title: string;
  date: string;
  description: string;
  isHard: boolean;
  sourceEvidence?: string;
  confidence: "high" | "medium" | "low";
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  context: string;
  answered: boolean;
  answer?: string;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  sourceEvidence?: string;
}

export interface KeyTerm {
  id: string;
  term: string;
  severity: "high" | "medium" | "low";
  category: string;
  explanation: string;
  whyItMatters: string;
  watchOut: string;
  questionToAsk?: string;
}

export interface ActionPackQuestion {
  id: string;
  question: string;
  context: string;
}

export interface ActionPackGatherItem {
  id: string;
  item: string;
  description: string;
  category?: string;
}

export interface ActionPackDraft {
  id: string;
  label: string;
  draft: string;
}

export interface ActionPackCheckItem {
  id: string;
  text: string;
}

export interface ActionPack {
  questionsToAsk: ActionPackQuestion[];
  whatToGather: ActionPackGatherItem[];
  whatToSay: ActionPackDraft[];
  beforeYouActChecklist: ActionPackCheckItem[];
}

export interface DocumentSection {
  id: string;
  title?: string;
  content: string;
}

export interface PlainEnglishSections {
  whatItIs: string;
  whatItSays: string;
  whatItAsks: string;
  obligations: string;
  payAttentionTo: string;
  nextSteps: string;
}

export interface DocumentAnalysis {
  id: string;
  title: string;
  summary: string;
  documentType: string;
  actionSteps: ActionStep[];
  requiredDocuments: RequiredDocument[];
  deadlines: Deadline[];
  followUpQuestions: FollowUpQuestion[];
  risks: RiskItem[];
  overallConfidence: "high" | "medium" | "low";
  processedAt: string;
  plainEnglish?: PlainEnglishSections;
  sections?: DocumentSection[];
  keyTerms?: KeyTerm[];
  actionPack?: ActionPack;
}

// ── Document Trust Check types ──────────────────────────────────────────────

export type TrustCheckVerdict =
  | "Likely legitimate"
  | "Suspicious — verify before acting"
  | "High scam risk"
  | "Cannot verify authenticity";

export interface TrustCheckContactDetail {
  type: "phone" | "email" | "url" | "address";
  value: string;
  suspicious: boolean;
  note?: string;
}

export interface TrustCheckDeadlineItem {
  text: string;
  type: "explicit_date" | "relative" | "threat" | "escalation";
  note?: string;
}

export interface TrustCheckScamIndicator {
  indicator: string;
  severity: "high" | "medium" | "low";
  sourceEvidence?: string;
}

export interface TrustCheckScores {
  authenticityRisk: number;
  documentRisk: number;
  verificationConfidence: number;
}

export interface TrustCheckMetadataFinding {
  field: string;
  value: string;
  note: string;
  suspicious: boolean;
}

export interface TrustCheckAnalysis {
  id: string;
  processedAt: string;
  riskScore: number;
  verdict: TrustCheckVerdict;
  verdictExplanation: string;
  whatItClaims: string;
  demandedAction: string;
  scamIndicators: TrustCheckScamIndicator[];
  contactDetails: TrustCheckContactDetail[];
  deadlines: TrustCheckDeadlineItem[];
  whatToVerify: string[];
  safeNextSteps: string[];
  contractRiskNotes?: string;
  contractTermsFound?: string[];
  scores?: TrustCheckScores;
  metadataFindings?: TrustCheckMetadataFinding[];
  structuralFindings?: string[];
}
