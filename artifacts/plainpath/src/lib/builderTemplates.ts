import type { BuilderCategory } from "@/lib/builderConfig";

// ─── Question type ────────────────────────────────────────────────────────────

export interface BuiltinTemplateQuestion {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  hint?: string;
}

// ─── Template type ────────────────────────────────────────────────────────────

export interface BuiltinTemplate {
  key: string;
  dbCategory: BuilderCategory;
  label: string;
  description: string;
  questions: BuiltinTemplateQuestion[];
}

// ─── Template definitions ──────────────────────────────────────────────────────

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  // ── 1. Standard Operating Procedure ─────────────────────────────────────────
  {
    key: "sop",
    dbCategory: "sop",
    label: "Standard Operating Procedure",
    description: "Step-by-step instructions for a repeatable process. Includes purpose, scope, procedure, and revision history.",
    questions: [
      {
        id: "process_what",
        label: "What process does this SOP explain?",
        placeholder: "e.g. Monthly invoice processing, equipment calibration, customer refund handling",
        multiline: false,
      },
      {
        id: "who_responsible",
        label: "Who is responsible for following it?",
        placeholder: "e.g. Accounts payable team, warehouse staff, customer success reps",
        multiline: false,
      },
      {
        id: "when_use",
        label: "When should this process be used?",
        placeholder: "e.g. At the end of each billing cycle, whenever a new order is received",
        multiline: false,
      },
      {
        id: "tools_needed",
        label: "What tools, materials, or systems are needed?",
        placeholder: "e.g. QuickBooks, safety gloves, the CRM system, barcode scanner",
        multiline: false,
        hint: "Separate multiple items with commas",
      },
      {
        id: "steps",
        label: "What are the steps, in order?",
        placeholder: "Log into the system\nOpen the pending invoices queue\nVerify each line item\nApprove or flag for review\nSubmit the batch",
        multiline: true,
        hint: "One step per line",
      },
      {
        id: "safety_concerns",
        label: "What mistakes or safety concerns should be avoided?",
        placeholder: "e.g. Do not process invoices without manager approval. Avoid skipping the verification step.",
        multiline: true,
      },
      {
        id: "records",
        label: "What records should be kept?",
        placeholder: "e.g. Completed invoices, error logs, batch confirmation emails",
        multiline: false,
      },
      {
        id: "who_approves",
        label: "Who approves or reviews this SOP?",
        placeholder: "e.g. Operations Manager, Department Head",
        multiline: false,
      },
    ],
  },

  // ── 2. Employee Onboarding Manual ────────────────────────────────────────────
  {
    key: "onboarding",
    dbCategory: "handbook",
    label: "Employee Onboarding Manual",
    description: "Guide new hires through their first days and weeks — tools, contacts, training, and policies.",
    questions: [
      {
        id: "role_dept",
        label: "What role or department is this for?",
        placeholder: "e.g. Software Engineer on the Backend team, Customer Support Representative",
        multiline: false,
      },
      {
        id: "day_one",
        label: "What should the employee do on day one?",
        placeholder: "Meet the team\nGet laptop setup\nComplete HR paperwork\nAttend orientation meeting",
        multiline: true,
        hint: "One item per line — will become a checklist",
      },
      {
        id: "systems_access",
        label: "What systems or tools need access?",
        placeholder: "e.g. GitHub, Slack, Jira, Salesforce, Google Workspace",
        multiline: false,
        hint: "Separate multiple items with commas",
      },
      {
        id: "training_required",
        label: "What training is required?",
        placeholder: "Complete security awareness training\nShadow a senior team member\nFinish product demo walkthrough",
        multiline: true,
        hint: "One item per line",
      },
      {
        id: "key_contacts",
        label: "Who are the key contacts?",
        placeholder: "Manager: Jane Smith\nIT Support: it@company.com\nHR: hr@company.com",
        multiline: true,
        hint: "One contact per line — will become a table",
      },
      {
        id: "policies_to_review",
        label: "What policies must be reviewed?",
        placeholder: "e.g. Remote Work Policy, Code of Conduct, Information Security Policy",
        multiline: false,
        hint: "Separate multiple items with commas",
      },
      {
        id: "completion_criteria",
        label: "What confirms onboarding is complete?",
        placeholder: "All system access confirmed\nTraining modules completed\nFirst 30-day check-in held with manager",
        multiline: true,
        hint: "One item per line — will become a completion checklist",
      },
    ],
  },

  // ── 3. Policy Document ────────────────────────────────────────────────────────
  {
    key: "policy",
    dbCategory: "policy",
    label: "Policy Document",
    description: "Define a rule, standard, or expectation — who it applies to, what it requires, and how it's enforced.",
    questions: [
      {
        id: "policy_subject",
        label: "What rule or standard does this policy establish?",
        placeholder: "e.g. Remote work expectations, data handling, expense reimbursements",
        multiline: false,
      },
      {
        id: "who_applies",
        label: "Who must follow this policy?",
        placeholder: "e.g. All full-time employees, contractors with data access, all staff in the US offices",
        multiline: false,
      },
      {
        id: "required_actions",
        label: "What actions are required?",
        placeholder: "Submit expenses within 30 days\nObtain manager approval for purchases over $500\nKeep receipts for all reimbursements",
        multiline: true,
        hint: "One item per line",
      },
      {
        id: "prohibited_actions",
        label: "What actions are prohibited?",
        placeholder: "Do not submit personal expenses for reimbursement\nDo not bypass the approval process",
        multiline: true,
        hint: "One item per line",
      },
      {
        id: "exceptions",
        label: "Are there exceptions to this policy?",
        placeholder: "e.g. Senior leadership may approve exceptions on a case-by-case basis",
        multiline: false,
      },
      {
        id: "enforcement",
        label: "What happens if the policy is not followed?",
        placeholder: "e.g. Violations may result in disciplinary action up to and including termination",
        multiline: false,
      },
      {
        id: "review_cycle",
        label: "How often should this policy be reviewed?",
        placeholder: "e.g. Annually, every 18 months, after any major regulatory change",
        multiline: false,
      },
    ],
  },

  // ── 4. Training Manual ────────────────────────────────────────────────────────
  {
    key: "training-manual",
    dbCategory: "handbook",
    label: "Training Manual",
    description: "Structured learning guide with objectives, modules, exercises, and knowledge checks.",
    questions: [
      {
        id: "subject",
        label: "What subject or skill does this training cover?",
        placeholder: "e.g. New hire sales training, OSHA safety certification, customer service techniques",
        multiline: false,
      },
      {
        id: "audience",
        label: "Who is the intended audience?",
        placeholder: "e.g. New customer support hires, all warehouse staff, managers at the supervisor level",
        multiline: false,
      },
      {
        id: "prior_knowledge",
        label: "What prior knowledge or experience is assumed?",
        placeholder: "e.g. Basic computer skills, familiarity with the product, 6+ months in the role",
        multiline: false,
      },
      {
        id: "modules",
        label: "What are the training modules or topics to cover?",
        placeholder: "Introduction to our products\nHandling customer objections\nUsing the CRM system\nEscalation procedures",
        multiline: true,
        hint: "One module per line — will become a numbered list",
      },
      {
        id: "outcomes",
        label: "What should learners be able to do after completing this training?",
        placeholder: "Handle inbound calls without supervision\nLog all interactions in the CRM\nEscalate complex issues correctly",
        multiline: true,
        hint: "One outcome per line",
      },
      {
        id: "completion",
        label: "How is completion verified?",
        placeholder: "e.g. Pass the knowledge check with 80%+ score, complete all exercises, get manager sign-off",
        multiline: false,
      },
      {
        id: "maintainer",
        label: "Who maintains or approves this training material?",
        placeholder: "e.g. L&D Team, Training Manager, Dept. Head",
        multiline: false,
      },
    ],
  },

  // ── 5. Process Guide ──────────────────────────────────────────────────────────
  {
    key: "process-guide",
    dbCategory: "sop",
    label: "Process Guide",
    description: "End-to-end workflow guide — trigger, responsible parties, steps, outputs, and escalation path.",
    questions: [
      {
        id: "process_name",
        label: "What process does this guide describe?",
        placeholder: "e.g. Vendor onboarding, IT change management, customer escalation handling",
        multiline: false,
      },
      {
        id: "trigger",
        label: "What triggers or starts this process?",
        placeholder: "e.g. A new vendor contract is signed, a support ticket is escalated to Level 2",
        multiline: false,
      },
      {
        id: "responsible",
        label: "Who is responsible for this process?",
        placeholder: "Process Owner: Procurement Manager\nParticipants: Finance, Legal, IT",
        multiline: true,
        hint: "One role per line",
      },
      {
        id: "inputs",
        label: "What inputs or resources are required to start?",
        placeholder: "e.g. Signed contract, vendor profile, tax ID, bank details",
        multiline: false,
        hint: "Separate multiple items with commas",
      },
      {
        id: "workflow_steps",
        label: "What are the steps in the workflow?",
        placeholder: "Receive signed contract\nCreate vendor profile in ERP\nIT grants system access\nFinance sets up payment terms\nNotify stakeholders",
        multiline: true,
        hint: "One step per line — will become a numbered list",
      },
      {
        id: "outputs",
        label: "What are the expected outputs or outcomes?",
        placeholder: "e.g. Active vendor profile, payment terms set up, access credentials issued",
        multiline: false,
        hint: "Separate multiple items with commas",
      },
      {
        id: "escalation",
        label: "Who handles exceptions or escalations?",
        placeholder: "e.g. Operations Manager for contract disputes, CISO for security concerns",
        multiline: false,
      },
    ],
  },

  // ── 6. Safety Manual ──────────────────────────────────────────────────────────
  {
    key: "safety-manual",
    dbCategory: "policy",
    label: "Safety Manual",
    description: "Workplace safety guide covering hazards, PPE, incident reporting, and emergency procedures.",
    questions: [
      {
        id: "workplace",
        label: "What workplace or operation does this manual cover?",
        placeholder: "e.g. Warehouse operations, construction site, laboratory, food processing facility",
        multiline: false,
      },
      {
        id: "safety_officer",
        label: "Who is responsible for safety in this environment?",
        placeholder: "Safety Officer: John Doe\nSupervisors: All department leads\nEmployees: All on-site staff",
        multiline: true,
        hint: "One role per line",
      },
      {
        id: "hazards",
        label: "What are the main hazards or risks?",
        placeholder: "Heavy lifting injuries\nForklift traffic\nChemical exposure\nSlip and fall on wet surfaces",
        multiline: true,
        hint: "One hazard per line",
      },
      {
        id: "ppe_required",
        label: "What PPE is required?",
        placeholder: "e.g. Hard hat, high-visibility vest, steel-toed boots, safety goggles",
        multiline: false,
        hint: "Separate multiple items with commas",
      },
      {
        id: "training_safety",
        label: "What safety training is required?",
        placeholder: "OSHA 10-hour general industry certification\nForklift operation certification\nHazmat handling training",
        multiline: true,
        hint: "One item per line",
      },
      {
        id: "incident_reporting",
        label: "How should incidents be reported?",
        placeholder: "e.g. Report immediately to your supervisor, complete Form 301 within 24 hours, notify HR",
        multiline: false,
      },
      {
        id: "emergency_steps",
        label: "What are the emergency procedures?",
        placeholder: "Sound the alarm\nEvacuate via the nearest exit\nAssemble at the muster point\nDo not re-enter until cleared by a supervisor",
        multiline: true,
        hint: "One step per line — will become a numbered list",
      },
    ],
  },

  // ── 7. Incident Report ────────────────────────────────────────────────────────
  {
    key: "incident-report",
    dbCategory: "incident-report",
    label: "Incident Report",
    description: "Document what happened, who was involved, immediate actions, root cause, and corrective actions.",
    questions: [
      {
        id: "when_where",
        label: "When and where did the incident occur?",
        placeholder: "e.g. April 15 at 2:30 PM, Warehouse B, aisle 4",
        multiline: false,
      },
      {
        id: "who_involved",
        label: "Who was involved?",
        placeholder: "e.g. Employee: James R. (Warehouse Associate), Supervisor: Maria K.",
        multiline: false,
      },
      {
        id: "what_happened",
        label: "Describe what happened",
        placeholder: "The employee was moving inventory when a pallet slipped from the shelf above. The employee was struck on the right shoulder.",
        multiline: true,
      },
      {
        id: "immediate_actions",
        label: "What immediate actions were taken?",
        placeholder: "First aid administered on-site\nEmployee transported to urgent care\nArea cordoned off pending inspection",
        multiline: true,
        hint: "One action per line",
      },
      {
        id: "evidence",
        label: "What evidence or attachments exist?",
        placeholder: "Security camera footage, incident photos, witness statements, medical report",
        multiline: false,
        hint: "Separate multiple items with commas — will become a checklist",
      },
      {
        id: "root_cause",
        label: "What was the root cause?",
        placeholder: "e.g. Pallet was overloaded beyond rated capacity. Shelf inspection was overdue.",
        multiline: true,
      },
      {
        id: "corrective_actions",
        label: "What corrective actions are needed?",
        placeholder: "Conduct full shelf safety inspection\nRetrain all warehouse staff on weight limits\nUpdate inspection schedule to weekly",
        multiline: true,
        hint: "One action per line — will become a checklist",
      },
      {
        id: "follow_up_owner",
        label: "Who will follow up and by when?",
        placeholder: "e.g. Safety Officer Maria K. — review complete by April 22",
        multiline: false,
      },
    ],
  },

  // ── 8. Checklist ──────────────────────────────────────────────────────────────
  {
    key: "checklist",
    dbCategory: "checklist",
    label: "Checklist",
    description: "A structured checklist for any recurring task, audit, or sign-off process.",
    questions: [
      {
        id: "objective",
        label: "What is the objective or goal of this checklist?",
        placeholder: "e.g. Ensure all steps are completed before a product launch, verify equipment is safe to operate",
        multiline: false,
      },
      {
        id: "checklist_items",
        label: "What items must be completed?",
        placeholder: "Verify all test cases pass\nGet legal sign-off on terms\nUpdate documentation\nNotify the support team\nSchedule launch announcement",
        multiline: true,
        hint: "One item per line — will become the checklist",
      },
      {
        id: "responsible_person",
        label: "Who is responsible for completing this checklist?",
        placeholder: "e.g. Project Manager, Department Lead, QA Engineer",
        multiline: false,
      },
      {
        id: "due_dates",
        label: "Are there due dates or deadlines?",
        placeholder: "e.g. Must be completed by end of Q3, 48 hours before go-live",
        multiline: false,
      },
      {
        id: "completion_criteria",
        label: "What confirms this checklist is complete?",
        placeholder: "e.g. All items checked and manager has signed off, no open blockers remain",
        multiline: false,
      },
    ],
  },
];
