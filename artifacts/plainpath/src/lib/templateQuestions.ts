import type { BuilderSection } from "@/lib/builderTypes";

// ─── Question types ───────────────────────────────────────────────────────────

export interface TemplateQuestion {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: "text" | "date";
  defaultValue?: string;
  hint?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Question banks ───────────────────────────────────────────────────────────

const Q_COMPANY: TemplateQuestion = {
  id: "company_name",
  label: "Company / Organization",
  placeholder: "e.g. Acme Corp",
  required: true,
  type: "text",
};

const Q_DEPARTMENT: TemplateQuestion = {
  id: "department",
  label: "Department or Team",
  placeholder: "e.g. Operations, Engineering, HR",
  required: false,
  type: "text",
};

const Q_PREPARED_BY: TemplateQuestion = {
  id: "prepared_by",
  label: "Prepared By",
  placeholder: "e.g. Jane Smith — Operations Lead",
  required: false,
  type: "text",
};

const Q_VERSION: TemplateQuestion = {
  id: "version",
  label: "Version",
  placeholder: "1.0",
  required: false,
  type: "text",
  defaultValue: "1.0",
};

const Q_EFFECTIVE_DATE: TemplateQuestion = {
  id: "effective_date",
  label: "Effective Date",
  placeholder: "",
  required: false,
  type: "date",
  defaultValue: today(),
};

// ─── Per-category question sets ───────────────────────────────────────────────

const QUESTIONS_BY_CATEGORY: Record<string, TemplateQuestion[]> = {
  sop: [
    {
      id: "process_name",
      label: "Process Name",
      placeholder: "e.g. Customer Onboarding, Invoice Approval",
      required: true,
      type: "text",
      hint: "The specific process this SOP covers.",
    },
    Q_COMPANY,
    Q_DEPARTMENT,
    Q_PREPARED_BY,
    Q_VERSION,
    Q_EFFECTIVE_DATE,
  ],
  handbook: [
    Q_COMPANY,
    Q_DEPARTMENT,
    Q_PREPARED_BY,
    Q_VERSION,
    Q_EFFECTIVE_DATE,
  ],
  policy: [
    {
      id: "policy_name",
      label: "Policy Name",
      placeholder: "e.g. Remote Work Policy, Expense Policy",
      required: true,
      type: "text",
    },
    Q_COMPANY,
    Q_DEPARTMENT,
    Q_PREPARED_BY,
    Q_VERSION,
    Q_EFFECTIVE_DATE,
  ],
  checklist: [
    {
      id: "role_name",
      label: "Role or Position",
      placeholder: "e.g. Software Engineer, Sales Representative",
      required: false,
      type: "text",
      hint: "Who is this checklist for?",
    },
    Q_COMPANY,
    Q_DEPARTMENT,
    Q_PREPARED_BY,
    Q_VERSION,
    Q_EFFECTIVE_DATE,
  ],
  "incident-report": [
    {
      id: "incident_date",
      label: "Date of Incident",
      placeholder: "",
      required: false,
      type: "date",
      defaultValue: today(),
    },
    {
      id: "location",
      label: "Location or System Affected",
      placeholder: "e.g. Warehouse B, Production Server, Customer Portal",
      required: false,
      type: "text",
    },
    Q_COMPANY,
    Q_DEPARTMENT,
    Q_PREPARED_BY,
  ],
  proposal: [
    {
      id: "project_name",
      label: "Project or Engagement Name",
      placeholder: "e.g. Website Redesign, Q3 Marketing Campaign",
      required: true,
      type: "text",
    },
    {
      id: "client_name",
      label: "Client or Recipient",
      placeholder: "e.g. Acme Corp",
      required: false,
      type: "text",
    },
    Q_COMPANY,
    Q_PREPARED_BY,
    Q_VERSION,
    Q_EFFECTIVE_DATE,
  ],
  prd: [
    {
      id: "product_name",
      label: "Product or Feature Name",
      placeholder: "e.g. Mobile Checkout Flow, User Dashboard v2",
      required: true,
      type: "text",
    },
    {
      id: "target_users",
      label: "Target Users",
      placeholder: "e.g. Small business owners, Internal ops team",
      required: false,
      type: "text",
    },
    Q_COMPANY,
    Q_DEPARTMENT,
    Q_PREPARED_BY,
    Q_VERSION,
    Q_EFFECTIVE_DATE,
  ],
  other: [
    {
      id: "meeting_date",
      label: "Meeting Date",
      placeholder: "",
      required: false,
      type: "date",
      defaultValue: today(),
    },
    {
      id: "meeting_location",
      label: "Location or Platform",
      placeholder: "e.g. Conference Room A, Zoom, Google Meet",
      required: false,
      type: "text",
    },
    Q_COMPANY,
    Q_DEPARTMENT,
    Q_PREPARED_BY,
  ],
};

const DEFAULT_QUESTIONS: TemplateQuestion[] = [
  Q_COMPANY,
  Q_DEPARTMENT,
  Q_PREPARED_BY,
  Q_VERSION,
  Q_EFFECTIVE_DATE,
];

export function getQuestionsForCategory(category: string): TemplateQuestion[] {
  return QUESTIONS_BY_CATEGORY[category] ?? DEFAULT_QUESTIONS;
}

// ─── Build Document Information header section from answers ───────────────────

function formatDate(iso: string): string {
  if (!iso) return iso;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

export function buildHeaderSection(
  answers: Record<string, string>,
  category: string,
): BuilderSection | null {
  const pairs: Array<{ key: string; value: string }> = [];

  // Category-specific first-position fields
  if (answers.process_name) pairs.push({ key: "Process", value: answers.process_name });
  if (answers.policy_name) pairs.push({ key: "Policy", value: answers.policy_name });
  if (answers.project_name) pairs.push({ key: "Project", value: answers.project_name });
  if (answers.client_name) pairs.push({ key: "Client", value: answers.client_name });
  if (answers.product_name) pairs.push({ key: "Product / Feature", value: answers.product_name });
  if (answers.target_users) pairs.push({ key: "Target Users", value: answers.target_users });
  if (answers.role_name) pairs.push({ key: "Role", value: answers.role_name });
  if (answers.meeting_date) pairs.push({ key: "Meeting Date", value: formatDate(answers.meeting_date) });
  if (answers.incident_date) pairs.push({ key: "Incident Date", value: formatDate(answers.incident_date) });
  if (answers.meeting_location) pairs.push({ key: "Location", value: answers.meeting_location });
  if (answers.location) pairs.push({ key: "Location / System", value: answers.location });

  // Common fields
  if (answers.company_name) pairs.push({ key: "Company", value: answers.company_name });
  if (answers.department) pairs.push({ key: "Department", value: answers.department });
  if (answers.prepared_by) pairs.push({ key: "Prepared By", value: answers.prepared_by });
  if (answers.version) pairs.push({ key: "Version", value: answers.version });
  if (answers.effective_date) pairs.push({ key: "Effective Date", value: formatDate(answers.effective_date) });

  if (pairs.length === 0) return null;

  return {
    id: crypto.randomUUID(),
    title: "Document Information",
    order: -1,
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "key-value",
        order: 0,
        payload: {
          pairs,
          layout: "two-column",
        },
      },
    ],
  };
}

// ─── Apply answers to template content ───────────────────────────────────────

import type { BuilderContent } from "@/lib/builderTypes";

export function applyAnswersToContent(
  templateContent: BuilderContent,
  answers: Record<string, string>,
  category: string,
): BuilderContent {
  const headerSection = buildHeaderSection(answers, category);

  // Re-order existing sections starting at 0
  const existingSections = [...templateContent.sections]
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i + (headerSection ? 1 : 0) }));

  const sections = headerSection
    ? [{ ...headerSection, order: 0 }, ...existingSections]
    : existingSections;

  return { sections };
}
