import type { BuilderContent, BuilderSection, BuilderBlock } from "@/lib/builderTypes";

// ─── Re-export for backward compatibility ──────────────────────────────────────
export { BUILTIN_TEMPLATES } from "@/lib/builderTemplates";
export type { BuiltinTemplate, BuiltinTemplateQuestion } from "@/lib/builderTemplates";

// ─── Parsing helpers ───────────────────────────────────────────────────────────

function parseList(text: string): string[] {
  if (!text.trim()) return [];
  const byNewline = text
    .split(/\n+/)
    .map((s) => s.trim().replace(/^[-•*\d]+[.)]\s*/, ""))
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  const byComma = text.split(/,/).map((s) => s.trim()).filter(Boolean);
  if (byComma.length > 1) return byComma;
  return [text.trim()];
}

function parseContacts(text: string): Array<{ key: string; value: string }> {
  if (!text.trim()) return [];
  return text
    .split(/\n+/)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        return { key: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() };
      }
      return { key: line.trim(), value: "" };
    })
    .filter((p) => p.key);
}

// ─── Block builders ────────────────────────────────────────────────────────────

function block(type: string, payload: Record<string, unknown>): BuilderBlock {
  return { id: crypto.randomUUID(), type, order: 0, payload };
}

function para(text: string): BuilderBlock {
  return block("paragraph", { text });
}

function heading(text: string, level: 1 | 2 | 3 = 2): BuilderBlock {
  return block("heading", { text, level });
}

function note(text: string, variant: "info" | "warning" | "tip" = "info"): BuilderBlock {
  return block("note", { text, variant });
}

function bulletList(items: string[]): BuilderBlock {
  return block("bullet-list", { items });
}

function numberedList(items: string[]): BuilderBlock {
  return block("numbered-list", { items, start: 1 });
}

function checklist(items: string[]): BuilderBlock {
  return block("checklist", { items: items.map((text) => ({ text, checked: false })) });
}

function keyValue(pairs: Array<{ key: string; value: string }>): BuilderBlock {
  return block("key-value", { pairs, layout: "two-column" });
}

function revisionTable(): BuilderBlock {
  return block("table", {
    columns: ["Date", "Version", "Author", "Change Summary"],
    rows: [["", "1.0", "", "Initial release"]],
    has_header_row: true,
  });
}

function divider(): BuilderBlock {
  return block("divider", { style: "line" });
}

// ─── Section builder ───────────────────────────────────────────────────────────

function section(title: string, blocks: BuilderBlock[], order: number): BuilderSection {
  return {
    id: crypto.randomUUID(),
    title,
    order,
    blocks: blocks.map((b, i) => ({ ...b, order: i })),
  };
}

// ─── Fallbacks ─────────────────────────────────────────────────────────────────

const PLACEHOLDER_STEPS = [
  "Step one — describe the action and expected result.",
  "Step two — describe the action and expected result.",
  "Step three — describe the action and expected result.",
  "Step four — describe the action and expected result.",
];

const PLACEHOLDER_CHECKLIST = [
  "Item one — describe what must be completed.",
  "Item two — describe what must be completed.",
  "Item three — describe what must be completed.",
];

// ─── Content generators by template key ───────────────────────────────────────

function generateSop(a: Record<string, string>): BuilderSection[] {
  const process = a.process_what || "this process";
  const responsible = a.who_responsible || "the responsible team";
  const whenUse = a.when_use || "";
  const tools = parseList(a.tools_needed || "");
  const steps = parseList(a.steps || "");
  const concerns = a.safety_concerns || "";
  const records = a.records || "";
  const approver = a.who_approves || "";

  const scopeText = [
    `This SOP applies to ${responsible}.`,
    whenUse ? `It should be followed ${whenUse}.` : "",
  ].filter(Boolean).join(" ");

  return [
    section("Purpose", [
      para(`This Standard Operating Procedure describes the ${process} process. The goal of this document is to ensure consistent, high-quality execution by all relevant team members.`),
    ], 0),

    section("Scope", [
      para(scopeText || "Define who this SOP applies to and any exclusions."),
    ], 1),

    section("Roles & Responsibilities", [
      keyValue([
        { key: "Responsible", value: responsible },
        { key: "Approver / Reviewer", value: approver || "To be assigned" },
      ]),
    ], 2),

    section("Required Tools & Materials", [
      tools.length > 0
        ? bulletList(tools)
        : bulletList(["List the tools, materials, and systems required for this procedure."]),
    ], 3),

    section("Safety & Caution Notes", [
      concerns
        ? note(concerns, "warning")
        : note("Document any safety requirements, caution points, or common mistakes to avoid.", "warning"),
    ], 4),

    section("Step-by-Step Procedure", [
      steps.length > 0
        ? numberedList(steps)
        : numberedList(PLACEHOLDER_STEPS),
    ], 5),

    section("Quality Checks", [
      checklist([
        "Verify all steps were completed in order.",
        "Check outputs match expected results.",
        "Confirm required records have been created.",
        "Obtain sign-off from the approver.",
      ]),
    ], 6),

    section("Records & Documentation", [
      para(records || "Describe what records must be created, where they should be stored, and for how long they should be kept."),
    ], 7),

    section("References", [
      bulletList(["List any related SOPs, policies, or external documents here."]),
    ], 8),

    section("Revision History", [
      revisionTable(),
    ], 9),
  ];
}

function generateOnboarding(a: Record<string, string>): BuilderSection[] {
  const roleOrDept = a.role_dept || "this role";
  const dayOneItems = parseList(a.day_one || "");
  const systems = parseList(a.systems_access || "");
  const training = parseList(a.training_required || "");
  const contacts = parseContacts(a.key_contacts || "");
  const policies = parseList(a.policies_to_review || "");
  const completion = parseList(a.completion_criteria || "");

  return [
    section("Welcome", [
      para(`Welcome to the team! This onboarding guide will help you get started in your new role as ${roleOrDept}. Work through each section at your own pace and reach out to your manager or HR if you have any questions.`),
    ], 0),

    section("Company Overview", [
      para("Our mission, values, and what we do. Ask your manager for a walkthrough of the company background, key products or services, and how your team fits into the bigger picture."),
    ], 1),

    section("First-Day Checklist", [
      dayOneItems.length > 0
        ? checklist(dayOneItems)
        : checklist([
          "Receive laptop and equipment setup",
          "Complete HR paperwork and benefits enrollment",
          "Get access badge or remote access credentials",
          "Meet your manager and direct team",
          "Attend orientation or welcome meeting",
        ]),
    ], 2),

    section("Tools & Systems", [
      note("Request access to all systems listed below through IT or your manager on day one.", "tip"),
      systems.length > 0
        ? bulletList(systems)
        : bulletList(["List all tools, platforms, and systems the employee needs access to."]),
    ], 3),

    section("Role Expectations", [
      para(`As ${roleOrDept}, you are expected to contribute to your team's goals, collaborate with colleagues, and communicate proactively. Your manager will walk you through specific deliverables and performance expectations.`),
    ], 4),

    section("Training Plan", [
      training.length > 0
        ? checklist(training)
        : checklist([
          "Complete required compliance or security training",
          "Product or service walkthrough session",
          "Shadow a senior team member",
          "Review key internal documentation",
        ]),
    ], 5),

    section("Key Contacts", [
      contacts.length > 0
        ? keyValue(contacts)
        : keyValue([
          { key: "Manager", value: "Name — email" },
          { key: "HR", value: "Name — email" },
          { key: "IT Support", value: "Name — email" },
        ]),
    ], 6),

    section("Policies to Review", [
      policies.length > 0
        ? checklist(policies.map((p) => `Read and acknowledge: ${p}`))
        : bulletList(["Code of Conduct", "Remote Work Policy", "Information Security Policy", "Expense Reimbursement Policy"]),
    ], 7),

    section("Completion Checklist", [
      completion.length > 0
        ? checklist(completion)
        : checklist([
          "All system access confirmed and working",
          "All required training completed",
          "30-day check-in held with manager",
          "Onboarding confirmed complete by HR",
        ]),
    ], 8),
  ];
}

function generatePolicy(a: Record<string, string>): BuilderSection[] {
  const subject = a.policy_subject || "the subject of this policy";
  const whoApplies = a.who_applies || "all applicable staff";
  const required = parseList(a.required_actions || "");
  const prohibited = parseList(a.prohibited_actions || "");
  const exceptions = a.exceptions || "";
  const enforcement = a.enforcement || "Violations of this policy may result in disciplinary action, up to and including termination of employment.";
  const reviewCycle = a.review_cycle || "This policy will be reviewed annually or following any significant regulatory or operational change.";

  return [
    section("Purpose", [
      para(`This policy establishes guidelines and expectations for ${subject}. It is designed to ensure consistency, compliance, and accountability across the organization.`),
    ], 0),

    section("Scope", [
      para(`This policy applies to ${whoApplies}. It covers all situations and environments where ${subject} is relevant.`),
    ], 1),

    section("Policy Statement", [
      para(`${whoApplies.charAt(0).toUpperCase() + whoApplies.slice(1)} are expected to comply with the requirements set forth in this policy. Non-compliance may result in enforcement action as described below.`),
    ], 2),

    section("Who Must Follow It", [
      para(`This policy applies to ${whoApplies}. Any person whose activities are covered by this policy is responsible for understanding and complying with its requirements.`),
    ], 3),

    section("Responsibilities", [
      required.length > 0
        ? bulletList(required)
        : bulletList([
          "Read and understand this policy before performing relevant activities.",
          "Comply with all requirements described in this document.",
          "Report any known violations to management or HR.",
        ]),
    ], 4),

    section("Prohibited Actions", [
      prohibited.length > 0
        ? bulletList(prohibited)
        : bulletList([
          "Taking actions that are inconsistent with this policy.",
          "Circumventing controls or approval processes established by this policy.",
          "Failing to report known violations.",
        ]),
    ], 5),

    section("Exceptions", [
      para(exceptions || "Exceptions to this policy must be approved in writing by the appropriate authority. All approved exceptions will be documented and reviewed during the next policy review cycle."),
    ], 6),

    section("Enforcement", [
      para(enforcement),
    ], 7),

    section("Review Cycle", [
      para(reviewCycle),
      keyValue([
        { key: "Next Review Date", value: "To be scheduled" },
        { key: "Policy Owner", value: "To be assigned" },
      ]),
    ], 8),
  ];
}

function generateTrainingManual(a: Record<string, string>): BuilderSection[] {
  const subject = a.subject || "the subject of this training";
  const audience = a.audience || "the intended audience";
  const priorKnowledge = a.prior_knowledge || "";
  const modules = parseList(a.modules || "");
  const outcomes = parseList(a.outcomes || "");
  const completion = a.completion || "";
  const maintainer = a.maintainer || "";

  return [
    section("Learning Objectives", [
      para(`After completing this training, learners should be able to:`),
      outcomes.length > 0
        ? bulletList(outcomes)
        : bulletList([
          "Understand the core concepts covered in this training.",
          "Apply the skills learned to real tasks in their role.",
          "Identify when and how to use the knowledge from this training.",
        ]),
    ], 0),

    section("Intended Audience", [
      para(`This training manual is designed for ${audience}. It is relevant to anyone who needs to develop skills or knowledge related to ${subject}.`),
    ], 1),

    section("Required Knowledge", [
      para(priorKnowledge || "No specific prior knowledge is required. Learners should be familiar with their general job responsibilities before starting this training."),
    ], 2),

    section("Training Modules", [
      modules.length > 0
        ? numberedList(modules)
        : numberedList([
          "Module 1: Introduction and Overview",
          "Module 2: Core Concepts",
          "Module 3: Hands-On Practice",
          "Module 4: Assessment and Review",
        ]),
    ], 3),

    section("Step-by-Step Lessons", [
      para("Each module should be completed in order. Work through the lessons at your own pace. Ask your manager or trainer if you have questions before moving on."),
    ], 4),

    section("Practice Exercises", [
      checklist([
        "Complete the scenario exercises at the end of each module.",
        "Practice with a colleague or training partner.",
        "Apply what you've learned to a real task with supervisor oversight.",
      ]),
    ], 5),

    section("Knowledge Checks", [
      para(completion || "At the end of each module, complete the knowledge check. A passing score of 80% or higher is required before moving to the next module."),
    ], 6),

    section("Completion Checklist", [
      checklist([
        "All modules completed",
        "All knowledge checks passed",
        "Practice exercises completed",
        "Manager or trainer sign-off obtained",
        "Training record updated",
      ]),
    ], 7),

    section("Revision History", [
      keyValue([
        { key: "Maintained By", value: maintainer || "To be assigned" },
        { key: "Last Updated", value: "To be filled in" },
      ]),
      revisionTable(),
    ], 8),
  ];
}

function generateProcessGuide(a: Record<string, string>): BuilderSection[] {
  const processName = a.process_name || "this process";
  const trigger = a.trigger || "";
  const responsible = parseContacts(a.responsible || "");
  const inputs = parseList(a.inputs || "");
  const steps = parseList(a.workflow_steps || "");
  const outputs = parseList(a.outputs || "");
  const escalation = a.escalation || "";

  return [
    section("Process Overview", [
      para(`This guide describes the end-to-end workflow for ${processName}. It is intended to provide clarity on who does what, when, and how.`),
    ], 0),

    section("Trigger / Start Point", [
      para(trigger || "Describe what event, condition, or request initiates this process."),
    ], 1),

    section("Responsible Parties", [
      responsible.length > 0
        ? keyValue(responsible)
        : keyValue([
          { key: "Process Owner", value: "Name / Role" },
          { key: "Participants", value: "Name / Role" },
        ]),
    ], 2),

    section("Inputs", [
      inputs.length > 0
        ? bulletList(inputs)
        : bulletList(["List the inputs, data, or resources required before this process can start."]),
    ], 3),

    section("Step-by-Step Workflow", [
      steps.length > 0
        ? numberedList(steps)
        : numberedList(PLACEHOLDER_STEPS),
    ], 4),

    section("Outputs", [
      outputs.length > 0
        ? bulletList(outputs)
        : bulletList(["Describe the expected deliverables, decisions, or records produced by this process."]),
    ], 5),

    section("Escalation Path", [
      para(escalation || "Describe who handles exceptions, blockers, or edge cases that fall outside the normal workflow."),
    ], 6),

    section("Quality Checks", [
      checklist([
        "All inputs were available before starting.",
        "Each step was completed in the correct order.",
        "Outputs were verified against expected results.",
        "Any exceptions were handled per the escalation path.",
      ]),
    ], 7),

    section("Related Documents", [
      bulletList(["List any related SOPs, policies, templates, or reference materials."]),
    ], 8),
  ];
}

function generateSafetyManual(a: Record<string, string>): BuilderSection[] {
  const workplace = a.workplace || "this workplace";
  const safetyOfficer = parseContacts(a.safety_officer || "");
  const hazards = parseList(a.hazards || "");
  const ppe = parseList(a.ppe_required || "");
  const safetyTraining = parseList(a.training_safety || "");
  const incidentReporting = a.incident_reporting || "";
  const emergencySteps = parseList(a.emergency_steps || "");

  return [
    section("Safety Commitment", [
      para(`${workplace.charAt(0).toUpperCase() + workplace.slice(1)} is committed to providing a safe and healthy environment for all employees, contractors, and visitors. Safety is a shared responsibility at every level of the organization.`),
      note("Everyone is responsible for maintaining a safe workplace. If you see a hazard, report it immediately.", "info"),
    ], 0),

    section("Roles & Responsibilities", [
      safetyOfficer.length > 0
        ? keyValue(safetyOfficer)
        : keyValue([
          { key: "Safety Officer", value: "Name — responsible for overall safety program" },
          { key: "Supervisors", value: "Enforce safety rules on the floor" },
          { key: "All Employees", value: "Follow safety procedures and report hazards" },
        ]),
    ], 1),

    section("Hazard Identification", [
      hazards.length > 0
        ? bulletList(hazards)
        : bulletList([
          "Physical hazards (machinery, heavy equipment, trip and fall risks)",
          "Chemical or biological exposure risks",
          "Ergonomic risks (repetitive motion, lifting)",
          "Environmental hazards (heat, cold, noise)",
        ]),
    ], 2),

    section("Hazard Prevention & Controls", [
      bulletList([
        "Engineering controls: modify equipment or environment to reduce risk.",
        "Administrative controls: change work practices, schedules, and procedures.",
        "PPE: use personal protective equipment as a last line of defense.",
        "Report new or uncontrolled hazards to the Safety Officer immediately.",
      ]),
    ], 3),

    section("PPE Requirements", [
      ppe.length > 0
        ? checklist(ppe.map((item) => `Required: ${item}`))
        : checklist([
          "Safety glasses or goggles in designated areas",
          "Steel-toed or slip-resistant footwear",
          "High-visibility vest in traffic areas",
          "Gloves when handling materials",
        ]),
    ], 4),

    section("Training Requirements", [
      safetyTraining.length > 0
        ? checklist(safetyTraining)
        : checklist([
          "General safety induction — all employees",
          "Hazard-specific training relevant to your role",
          "Emergency response and evacuation drill",
          "Annual refresher training",
        ]),
    ], 5),

    section("Incident Reporting", [
      para(incidentReporting || "All incidents, near-misses, and unsafe conditions must be reported immediately to your direct supervisor. A formal incident report must be filed within 24 hours using the designated form."),
    ], 6),

    section("Emergency Procedures", [
      note("Know the location of fire exits, first aid kits, eyewash stations, and the assembly point before starting work.", "warning"),
      emergencySteps.length > 0
        ? numberedList(emergencySteps)
        : numberedList([
          "Sound the alarm or call emergency services (911) if there is immediate danger.",
          "Evacuate via the nearest marked exit calmly and without delay.",
          "Proceed to the designated assembly point.",
          "Do not re-enter the building until cleared by the emergency warden or safety officer.",
          "Account for all personnel with your supervisor.",
        ]),
    ], 7),

    section("Inspections & Review", [
      block("table", {
        columns: ["Inspection Type", "Frequency", "Responsible", "Last Completed"],
        rows: [
          ["Workplace walkthrough", "Weekly", "", ""],
          ["PPE inspection", "Monthly", "", ""],
          ["Emergency equipment check", "Monthly", "", ""],
          ["Full safety audit", "Annually", "", ""],
        ],
        has_header_row: true,
      }),
    ], 8),
  ];
}

function generateIncidentReport(a: Record<string, string>): BuilderSection[] {
  const whenWhere = a.when_where || "";
  const whoInvolved = a.who_involved || "";
  const whatHappened = a.what_happened || "";
  const immediateActions = parseList(a.immediate_actions || "");
  const evidence = parseList(a.evidence || "");
  const rootCause = a.root_cause || "";
  const correctiveActions = parseList(a.corrective_actions || "");
  const followUpOwner = a.follow_up_owner || "";

  return [
    section("Incident Overview", [
      keyValue([
        { key: "Date / Time / Location", value: whenWhere || "To be filled in" },
        { key: "People Involved", value: whoInvolved || "To be filled in" },
        { key: "Report Prepared By", value: "" },
        { key: "Report Date", value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
      ]),
    ], 0),

    section("People Involved", [
      para(whoInvolved || "List all employees, contractors, or visitors involved in or who witnessed the incident."),
    ], 1),

    section("Timeline of Events", [
      para(whatHappened || "Describe what happened in chronological order. Include all relevant details — what was being done, what went wrong, and what happened immediately after."),
    ], 2),

    section("Immediate Actions Taken", [
      immediateActions.length > 0
        ? bulletList(immediateActions)
        : bulletList(["Describe the immediate response steps taken after the incident was identified."]),
    ], 3),

    section("Evidence / Attachments Checklist", [
      evidence.length > 0
        ? checklist(evidence)
        : checklist([
          "Photographs of the scene",
          "Witness statements",
          "Security or camera footage",
          "Medical report or first aid record",
        ]),
    ], 4),

    section("Root Cause", [
      para(rootCause || "Identify the underlying reason the incident occurred. Distinguish between direct causes (the immediate failure) and root causes (why the failure was allowed to occur)."),
    ], 5),

    section("Corrective Actions", [
      correctiveActions.length > 0
        ? checklist(correctiveActions)
        : checklist([
          "Describe the corrective action to be taken.",
          "Assign responsibility and a due date.",
          "Verify the action was completed.",
        ]),
    ], 6),

    section("Follow-Up Owner", [
      keyValue([
        { key: "Responsible Person", value: followUpOwner || "To be assigned" },
        { key: "Target Completion Date", value: "To be filled in" },
        { key: "Status", value: "Open" },
      ]),
    ], 7),

    section("Review / Sign-Off", [
      keyValue([
        { key: "Reviewed By", value: "" },
        { key: "Review Date", value: "" },
        { key: "Signature", value: "" },
      ]),
      divider(),
      note("This report is confidential. Distribute only to those with a need to know.", "info"),
    ], 8),
  ];
}

function generateChecklist(a: Record<string, string>): BuilderSection[] {
  const objective = a.objective || "";
  const items = parseList(a.checklist_items || "");
  const responsible = a.responsible_person || "";
  const dueDates = a.due_dates || "";
  const completionCriteria = a.completion_criteria || "";

  return [
    section("Objective", [
      para(objective || "Describe the goal or purpose of this checklist. What does successful completion ensure?"),
    ], 0),

    section("Required Items", [
      items.length > 0
        ? checklist(items)
        : checklist(PLACEHOLDER_CHECKLIST),
    ], 1),

    section("Responsible Person", [
      keyValue([
        { key: "Assigned To", value: responsible || "To be assigned" },
        { key: "Backup / Delegate", value: "" },
      ]),
    ], 2),

    section("Due Dates", [
      para(dueDates || "Specify any deadlines, milestones, or expiry dates associated with this checklist."),
    ], 3),

    section("Completion Criteria", [
      para(completionCriteria || "Describe what conditions must be met for this checklist to be considered complete."),
    ], 4),

    section("Sign-Off", [
      keyValue([
        { key: "Completed By", value: "" },
        { key: "Date", value: "" },
        { key: "Verified By", value: "" },
      ]),
    ], 5),

    section("Notes", [
      para("Use this section for any additional notes, exceptions, or follow-up items."),
    ], 6),
  ];
}

// ─── Main entry point ──────────────────────────────────────────────────────────

const GENERATORS: Record<string, (a: Record<string, string>) => BuilderSection[]> = {
  "sop": generateSop,
  "onboarding": generateOnboarding,
  "policy": generatePolicy,
  "training-manual": generateTrainingManual,
  "process-guide": generateProcessGuide,
  "safety-manual": generateSafetyManual,
  "incident-report": generateIncidentReport,
  "checklist": generateChecklist,
};

export function generateDraftContent(
  templateKey: string,
  answers: Record<string, string>,
): BuilderContent {
  const generator = GENERATORS[templateKey];
  if (!generator) {
    return {
      sections: [{ id: crypto.randomUUID(), title: "Overview", order: 0, blocks: [] }],
    };
  }
  const sections = generator(answers);
  return { sections };
}
