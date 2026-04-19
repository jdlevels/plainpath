import { pool } from "../index";

/**
 * System template seeding — idempotent.
 *
 * Uses stable UUIDs prefixed "bbbbbbbb-" so seeds are easily identifiable.
 * ON CONFLICT DO NOTHING ensures re-runs are safe.
 */

const SYSTEM_TEMPLATES = [
  {
    id: "bbbbbbbb-0000-0000-0000-000000000001",
    name: "Standard Operating Procedure",
    category: "sop",
    description: "A structured SOP template covering purpose, scope, procedures, and revision history.",
    content: {
      sections: [
        {
          id: "s1-sop-purpose",
          title: "Purpose",
          order: 0,
          blocks: [
            {
              id: "b1-sop-purpose",
              type: "paragraph",
              order: 0,
              payload: { text: "Describe the purpose of this standard operating procedure." },
            },
          ],
        },
        {
          id: "s2-sop-scope",
          title: "Scope",
          order: 1,
          blocks: [
            {
              id: "b1-sop-scope",
              type: "paragraph",
              order: 0,
              payload: { text: "Define who this SOP applies to and any exclusions." },
            },
          ],
        },
        {
          id: "s3-sop-responsibilities",
          title: "Responsibilities",
          order: 2,
          blocks: [
            {
              id: "b1-sop-resp",
              type: "key-value",
              order: 0,
              payload: {
                pairs: [
                  { key: "Role", value: "Responsibility description" },
                  { key: "Role", value: "Responsibility description" },
                ],
                layout: "two-column",
              },
            },
          ],
        },
        {
          id: "s4-sop-procedure",
          title: "Procedure",
          order: 3,
          blocks: [
            {
              id: "b1-sop-proc",
              type: "numbered-list",
              order: 0,
              payload: {
                items: ["Step one — describe the action.", "Step two — describe the action.", "Step three — describe the action."],
                start: 1,
              },
            },
          ],
        },
        {
          id: "s5-sop-exceptions",
          title: "Exceptions",
          order: 4,
          blocks: [
            {
              id: "b1-sop-exc",
              type: "paragraph",
              order: 0,
              payload: { text: "List any exceptions to this procedure and how they should be handled." },
            },
          ],
        },
        {
          id: "s6-sop-revhistory",
          title: "Revision History",
          order: 5,
          blocks: [
            {
              id: "b1-sop-revh",
              type: "table",
              order: 0,
              payload: {
                columns: ["Date", "Version", "Author", "Change Summary"],
                rows: [["YYYY-MM-DD", "1.0", "Your name", "Initial release"]],
                has_header_row: true,
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000002",
    name: "Employee Handbook",
    category: "handbook",
    description: "A handbook template covering culture, policies, benefits, and acknowledgment.",
    content: {
      sections: [
        {
          id: "s1-hb-welcome",
          title: "Welcome",
          order: 0,
          blocks: [
            {
              id: "b1-hb-welcome",
              type: "paragraph",
              order: 0,
              payload: { text: "Welcome to our team. This handbook outlines our policies, culture, and expectations." },
            },
          ],
        },
        {
          id: "s2-hb-culture",
          title: "Company Culture",
          order: 1,
          blocks: [
            {
              id: "b1-hb-culture",
              type: "note",
              order: 0,
              payload: { text: "Our core values guide everything we do. Add your company's values and mission statement here.", variant: "info" },
            },
          ],
        },
        {
          id: "s3-hb-policies",
          title: "Employment Policies",
          order: 2,
          blocks: [
            {
              id: "b1-hb-pol",
              type: "bullet-list",
              order: 0,
              payload: {
                items: [
                  "Equal opportunity employment",
                  "Anti-harassment and anti-discrimination",
                  "Confidentiality and data privacy",
                  "Remote work and attendance expectations",
                ],
              },
            },
          ],
        },
        {
          id: "s4-hb-conduct",
          title: "Code of Conduct",
          order: 3,
          blocks: [
            {
              id: "b1-hb-conduct",
              type: "numbered-list",
              order: 0,
              payload: {
                items: [
                  "Treat colleagues, clients, and partners with respect.",
                  "Protect company and client confidential information.",
                  "Report concerns or violations through proper channels.",
                ],
                start: 1,
              },
            },
          ],
        },
        {
          id: "s5-hb-benefits",
          title: "Benefits Overview",
          order: 4,
          blocks: [
            {
              id: "b1-hb-ben",
              type: "key-value",
              order: 0,
              payload: {
                pairs: [
                  { key: "Health Insurance", value: "Description of coverage" },
                  { key: "Paid Time Off", value: "Description of PTO policy" },
                  { key: "Retirement Plan", value: "Description of plan" },
                ],
                layout: "two-column",
              },
            },
          ],
        },
        {
          id: "s6-hb-ack",
          title: "Acknowledgment",
          order: 5,
          blocks: [
            {
              id: "b1-hb-ack",
              type: "paragraph",
              order: 0,
              payload: { text: "By receiving this handbook, you acknowledge that you have read and agree to abide by all policies contained herein." },
            },
          ],
        },
      ],
    },
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000003",
    name: "Internal Policy",
    category: "policy",
    description: "A policy template with statement, scope, definitions, procedures, and compliance.",
    content: {
      sections: [
        {
          id: "s1-pol-stmt",
          title: "Policy Statement",
          order: 0,
          blocks: [
            {
              id: "b1-pol-stmt",
              type: "paragraph",
              order: 0,
              payload: { text: "State the policy clearly. Explain what this policy governs and why it exists." },
            },
          ],
        },
        {
          id: "s2-pol-scope",
          title: "Scope",
          order: 1,
          blocks: [
            {
              id: "b1-pol-scope",
              type: "paragraph",
              order: 0,
              payload: { text: "Identify who and what this policy applies to. List any exclusions." },
            },
          ],
        },
        {
          id: "s3-pol-defs",
          title: "Definitions",
          order: 2,
          blocks: [
            {
              id: "b1-pol-defs",
              type: "key-value",
              order: 0,
              payload: {
                pairs: [
                  { key: "Term", value: "Definition" },
                  { key: "Term", value: "Definition" },
                ],
                layout: "stacked",
              },
            },
          ],
        },
        {
          id: "s4-pol-proc",
          title: "Procedures",
          order: 3,
          blocks: [
            {
              id: "b1-pol-proc",
              type: "numbered-list",
              order: 0,
              payload: {
                items: ["Describe the first required action.", "Describe the second required action."],
                start: 1,
              },
            },
          ],
        },
        {
          id: "s5-pol-compliance",
          title: "Compliance",
          order: 4,
          blocks: [
            {
              id: "b1-pol-comp",
              type: "note",
              order: 0,
              payload: { text: "Violations of this policy may result in disciplinary action up to and including termination.", variant: "warning" },
            },
          ],
        },
        {
          id: "s6-pol-review",
          title: "Review Schedule",
          order: 5,
          blocks: [
            {
              id: "b1-pol-rev",
              type: "paragraph",
              order: 0,
              payload: { text: "This policy will be reviewed annually or as needed. Last reviewed: [date]. Next review: [date]." },
            },
          ],
        },
      ],
    },
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000004",
    name: "Onboarding Checklist",
    category: "checklist",
    description: "A phased onboarding checklist from before day one through the first 30 days.",
    content: {
      sections: [
        {
          id: "s1-cl-before",
          title: "Before Day One",
          order: 0,
          blocks: [
            {
              id: "b1-cl-before",
              type: "checklist",
              order: 0,
              payload: {
                items: [
                  { text: "Send welcome email with start date, time, and location", checked: false },
                  { text: "Prepare workstation and required equipment", checked: false },
                  { text: "Set up accounts and system access", checked: false },
                  { text: "Assign onboarding buddy or mentor", checked: false },
                ],
              },
            },
          ],
        },
        {
          id: "s2-cl-day1",
          title: "Day One",
          order: 1,
          blocks: [
            {
              id: "b1-cl-day1",
              type: "checklist",
              order: 0,
              payload: {
                items: [
                  { text: "Welcome meeting with manager", checked: false },
                  { text: "Office / team introduction tour", checked: false },
                  { text: "HR paperwork and policy acknowledgment", checked: false },
                  { text: "Review role expectations and first-week plan", checked: false },
                ],
              },
            },
          ],
        },
        {
          id: "s3-cl-week1",
          title: "First Week",
          order: 2,
          blocks: [
            {
              id: "b1-cl-week1",
              type: "checklist",
              order: 0,
              payload: {
                items: [
                  { text: "Complete required compliance training", checked: false },
                  { text: "Meet with key stakeholders and team members", checked: false },
                  { text: "Review internal documentation and tooling", checked: false },
                ],
              },
            },
          ],
        },
        {
          id: "s4-cl-30days",
          title: "First 30 Days",
          order: 3,
          blocks: [
            {
              id: "b1-cl-30days",
              type: "checklist",
              order: 0,
              payload: {
                items: [
                  { text: "Complete initial project or onboarding task", checked: false },
                  { text: "30-day check-in with manager", checked: false },
                  { text: "Provide feedback on onboarding experience", checked: false },
                ],
              },
            },
          ],
        },
        {
          id: "s5-cl-signoff",
          title: "Completion Sign-Off",
          order: 4,
          blocks: [
            {
              id: "b1-cl-signoff",
              type: "paragraph",
              order: 0,
              payload: { text: "Employee name: ___________   Manager name: ___________   Date completed: ___________" },
            },
          ],
        },
      ],
    },
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000005",
    name: "Incident Report",
    category: "incident-report",
    description: "An incident report template covering summary, parties involved, and follow-up actions.",
    content: {
      sections: [
        {
          id: "s1-ir-summary",
          title: "Incident Summary",
          order: 0,
          blocks: [
            {
              id: "b1-ir-summary",
              type: "paragraph",
              order: 0,
              payload: { text: "Provide a brief, factual summary of what occurred." },
            },
          ],
        },
        {
          id: "s2-ir-details",
          title: "Date, Time, and Location",
          order: 1,
          blocks: [
            {
              id: "b1-ir-details",
              type: "key-value",
              order: 0,
              payload: {
                pairs: [
                  { key: "Date", value: "" },
                  { key: "Time", value: "" },
                  { key: "Location", value: "" },
                  { key: "Reported by", value: "" },
                ],
                layout: "two-column",
              },
            },
          ],
        },
        {
          id: "s3-ir-parties",
          title: "Parties Involved",
          order: 2,
          blocks: [
            {
              id: "b1-ir-parties",
              type: "key-value",
              order: 0,
              payload: {
                pairs: [
                  { key: "Name", value: "Role / involvement" },
                  { key: "Name", value: "Role / involvement" },
                ],
                layout: "two-column",
              },
            },
          ],
        },
        {
          id: "s4-ir-desc",
          title: "Description of Incident",
          order: 3,
          blocks: [
            {
              id: "b1-ir-desc",
              type: "paragraph",
              order: 0,
              payload: { text: "Describe the sequence of events in detail. Use factual, objective language." },
            },
          ],
        },
        {
          id: "s5-ir-actions",
          title: "Immediate Actions Taken",
          order: 4,
          blocks: [
            {
              id: "b1-ir-actions",
              type: "bullet-list",
              order: 0,
              payload: {
                items: ["Action taken immediately after the incident."],
              },
            },
          ],
        },
        {
          id: "s6-ir-followup",
          title: "Follow-Up",
          order: 5,
          blocks: [
            {
              id: "b1-ir-followup",
              type: "paragraph",
              order: 0,
              payload: { text: "Describe any corrective actions, investigations, or prevention measures to be taken." },
            },
          ],
        },
      ],
    },
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000006",
    name: "Business Proposal",
    category: "proposal",
    description: "A proposal template with executive summary, problem statement, solution, timeline, and budget.",
    content: {
      sections: [
        {
          id: "s1-bp-exec",
          title: "Executive Summary",
          order: 0,
          blocks: [
            {
              id: "b1-bp-exec",
              type: "paragraph",
              order: 0,
              payload: { text: "Summarize the proposal in 2–3 sentences. State the opportunity, your solution, and the expected outcome." },
            },
          ],
        },
        {
          id: "s2-bp-problem",
          title: "Problem Statement",
          order: 1,
          blocks: [
            {
              id: "b1-bp-problem",
              type: "paragraph",
              order: 0,
              payload: { text: "Describe the problem or opportunity clearly. Quantify the impact where possible." },
            },
          ],
        },
        {
          id: "s3-bp-solution",
          title: "Proposed Solution",
          order: 2,
          blocks: [
            {
              id: "b1-bp-solution",
              type: "paragraph",
              order: 0,
              payload: { text: "Describe your proposed solution, approach, and key differentiators." },
            },
          ],
        },
        {
          id: "s4-bp-timeline",
          title: "Timeline",
          order: 3,
          blocks: [
            {
              id: "b1-bp-timeline",
              type: "table",
              order: 0,
              payload: {
                columns: ["Phase", "Description", "Start", "End"],
                rows: [
                  ["Phase 1", "Description", "YYYY-MM-DD", "YYYY-MM-DD"],
                  ["Phase 2", "Description", "YYYY-MM-DD", "YYYY-MM-DD"],
                ],
                has_header_row: true,
              },
            },
          ],
        },
        {
          id: "s5-bp-budget",
          title: "Budget",
          order: 4,
          blocks: [
            {
              id: "b1-bp-budget",
              type: "key-value",
              order: 0,
              payload: {
                pairs: [
                  { key: "Line Item", value: "Cost estimate" },
                  { key: "Line Item", value: "Cost estimate" },
                  { key: "Total", value: "$0.00" },
                ],
                layout: "two-column",
              },
            },
          ],
        },
        {
          id: "s6-bp-nextsteps",
          title: "Next Steps",
          order: 5,
          blocks: [
            {
              id: "b1-bp-nextsteps",
              type: "numbered-list",
              order: 0,
              payload: {
                items: ["Decision required by [date].", "Kickoff meeting scheduled for [date].", "First deliverable due [date]."],
                start: 1,
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000007",
    name: "Product Requirements Document",
    category: "prd",
    description: "A PRD template covering goals, user stories, requirements, and success metrics.",
    content: {
      sections: [
        {
          id: "s1-prd-overview",
          title: "Overview",
          order: 0,
          blocks: [
            {
              id: "b1-prd-overview",
              type: "paragraph",
              order: 0,
              payload: { text: "Describe the product or feature and the problem it solves. Include context and strategic alignment." },
            },
          ],
        },
        {
          id: "s2-prd-goals",
          title: "Goals and Non-Goals",
          order: 1,
          blocks: [
            {
              id: "b1-prd-goals",
              type: "heading",
              order: 0,
              payload: { text: "Goals", level: 3 },
            },
            {
              id: "b2-prd-goals",
              type: "bullet-list",
              order: 1,
              payload: { items: ["Goal one — what success looks like.", "Goal two."] },
            },
            {
              id: "b3-prd-nongoals",
              type: "heading",
              order: 2,
              payload: { text: "Non-Goals", level: 3 },
            },
            {
              id: "b4-prd-nongoals",
              type: "note",
              order: 3,
              payload: { text: "Explicitly state what this initiative will NOT do to prevent scope creep.", variant: "info" },
            },
          ],
        },
        {
          id: "s3-prd-stories",
          title: "User Stories",
          order: 2,
          blocks: [
            {
              id: "b1-prd-stories",
              type: "numbered-list",
              order: 0,
              payload: {
                items: [
                  "As a [user type], I want to [action] so that [benefit].",
                  "As a [user type], I want to [action] so that [benefit].",
                ],
                start: 1,
              },
            },
          ],
        },
        {
          id: "s4-prd-reqs",
          title: "Requirements",
          order: 3,
          blocks: [
            {
              id: "b1-prd-reqs",
              type: "checklist",
              order: 0,
              payload: {
                items: [
                  { text: "Requirement one — describe the behavior expected.", checked: false },
                  { text: "Requirement two — describe the behavior expected.", checked: false },
                ],
              },
            },
          ],
        },
        {
          id: "s5-prd-outofscope",
          title: "Out of Scope",
          order: 4,
          blocks: [
            {
              id: "b1-prd-oos",
              type: "bullet-list",
              order: 0,
              payload: {
                items: ["Feature or behavior explicitly not included in this version."],
              },
            },
          ],
        },
        {
          id: "s6-prd-metrics",
          title: "Success Metrics",
          order: 5,
          blocks: [
            {
              id: "b1-prd-metrics",
              type: "key-value",
              order: 0,
              payload: {
                pairs: [
                  { key: "Metric", value: "Target value" },
                  { key: "Metric", value: "Target value" },
                ],
                layout: "two-column",
              },
            },
          ],
        },
      ],
    },
  },
];

export async function seedBuilderTemplates(): Promise<void> {
  for (const template of SYSTEM_TEMPLATES) {
    await pool.query(
      `INSERT INTO builder_templates (id, name, category, description, is_system, owner_user_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        template.id,
        template.name,
        template.category,
        template.description,
        true,
        null,
        JSON.stringify(template.content),
      ],
    );
  }
}

/**
 * One-time initialization: seeds system templates only when the table is empty.
 * Safe to call on startup — runs one COUNT query and exits immediately if already seeded.
 * Replaces unconditional seedBuilderTemplates() on every API boot.
 */
export async function initBuilderTemplates(): Promise<void> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM builder_templates WHERE is_system = true`,
  );
  const count = rows[0]?.count ?? 0;
  if (count > 0) return; // already seeded — fast exit
  await seedBuilderTemplates();
}
