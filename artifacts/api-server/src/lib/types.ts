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
}
