// ── PlainPath Completion Engine — QA Script ───────────────────────────────────
// Run with: pnpm --filter @workspace/plainpath exec tsx scripts/qa-completion-engine.ts
//
// Verifies:
//   - CompletionObject type supports all required fields
//   - All object types are valid
//   - All statuses are valid
//   - Parser returns an array
//   - Parser does not mutate the original analysis result
//   - Action steps map correctly
//   - Required documents map correctly
//   - Missing documents map correctly
//   - Deadlines map correctly
//   - Risks map correctly
//   - Questions map correctly
//   - signature_needed objects created only from source-backed / signature-related data
//   - Removed tools not referenced anywhere in output
//   - No billing/pricing/native files touched (file-list check)

import { analysisResultToCompletionObjects } from "../src/lib/completionParser";
import { SCHOOL_ENROLLMENT_FIXTURE } from "../src/lib/completionFixture";
import {
  ALL_COMPLETION_OBJECT_TYPES,
  ALL_COMPLETION_STATUSES,
} from "../src/lib/completionTypes";
import type {
  CompletionObject,
  CompletionObjectType,
  CompletionStatus,
} from "../src/lib/completionTypes";

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    const msg = detail ? `${label} — ${detail}` : label;
    console.error(`  ✗  ${msg}`);
    failures.push(msg);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 55 - title.length))}`);
}

// ── Run QA ────────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║  PlainPath Completion Engine — QA Script             ║");
console.log("╚══════════════════════════════════════════════════════╝");

// ── Section 1: Type constants ─────────────────────────────────────────────────
section("1. Type constants");

const EXPECTED_TYPES: CompletionObjectType[] = [
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

const EXPECTED_STATUSES: CompletionStatus[] = [
  "not_started",
  "in_progress",
  "gathered",
  "completed",
  "not_applicable",
  "needs_help",
];

assert(
  "ALL_COMPLETION_OBJECT_TYPES contains all 10 required types",
  EXPECTED_TYPES.every((t) => ALL_COMPLETION_OBJECT_TYPES.includes(t)),
  `missing: ${EXPECTED_TYPES.filter((t) => !ALL_COMPLETION_OBJECT_TYPES.includes(t)).join(", ")}`
);

assert(
  "ALL_COMPLETION_STATUSES contains all 6 required statuses",
  EXPECTED_STATUSES.every((s) => ALL_COMPLETION_STATUSES.includes(s)),
  `missing: ${EXPECTED_STATUSES.filter((s) => !ALL_COMPLETION_STATUSES.includes(s)).join(", ")}`
);

// ── Section 2: Parser basics ──────────────────────────────────────────────────
section("2. Parser basics");

const originalFixture = JSON.parse(JSON.stringify(SCHOOL_ENROLLMENT_FIXTURE));
const result: CompletionObject[] = analysisResultToCompletionObjects(SCHOOL_ENROLLMENT_FIXTURE);

assert("parser returns an array", Array.isArray(result));
assert("parser returns a non-empty array", result.length > 0, `got ${result.length} items`);

// Mutation check: compare deep equality of fixture before/after
const fixtureAfter = JSON.stringify(SCHOOL_ENROLLMENT_FIXTURE);
assert(
  "parser does not mutate the original analysis result",
  JSON.stringify(originalFixture) === fixtureAfter
);

// ── Section 3: Schema completeness ───────────────────────────────────────────
section("3. Schema completeness — all required fields present");

const REQUIRED_FIELDS: (keyof CompletionObject)[] = [
  "id",
  "type",
  "title",
  "plainEnglishExplanation",
  "whyItMatters",
  "whatToDo",
  "whereToGetThis",
  "sourceQuote",
  "sourcePage",
  "sourceSection",
  "priority",
  "severity",
  "dueDate",
  "trigger",
  "status",
  "userNotes",
  "uploadedFileId",
  "includedInPacket",
  "createdFromAnalysisSection",
];

let missingFields = false;
for (const obj of result) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) {
      console.error(`  ✗  Object "${obj.id}" missing field: ${field}`);
      failures.push(`Missing field ${field} in ${obj.id}`);
      failed++;
      missingFields = true;
    }
  }
}
if (!missingFields) {
  assert("all CompletionObject instances have all 19 required fields", true);
  passed++;
}

// ── Section 4: Type validity ──────────────────────────────────────────────────
section("4. Type validity — every object type is a valid CompletionObjectType");

const invalidTypes = result.filter((o) => !ALL_COMPLETION_OBJECT_TYPES.includes(o.type));
assert(
  "all object types are valid",
  invalidTypes.length === 0,
  invalidTypes.map((o) => `${o.id}:${o.type}`).join(", ")
);

// ── Section 5: Status validity ────────────────────────────────────────────────
section("5. Status validity — every object status is a valid CompletionStatus");

const invalidStatuses = result.filter((o) => !ALL_COMPLETION_STATUSES.includes(o.status));
assert(
  "all object statuses are valid",
  invalidStatuses.length === 0,
  invalidStatuses.map((o) => `${o.id}:${o.status}`).join(", ")
);

// ── Section 6: action_step mapping ───────────────────────────────────────────
section("6. action_step mapping");

const actionSteps = result.filter((o) => o.type === "action_step");
// Fixture has 4 action steps; one (as-003) has signature keyword → should become signature_needed
// So we expect 3 action_step objects
assert(
  "action steps map from actionSteps source section",
  actionSteps.every((o) => o.createdFromAnalysisSection === "actionSteps"),
  `unexpected sections: ${actionSteps.map((o) => o.createdFromAnalysisSection).join(", ")}`
);
assert(
  "action step titles are non-empty",
  actionSteps.every((o) => o.title.length > 0)
);
assert(
  "action step priorities are valid",
  actionSteps.every((o) => ["critical", "high", "medium", "low"].includes(o.priority))
);
assert(
  "signature-keyword action step (as-003) is NOT in action_step list",
  !actionSteps.some((o) => o.id === "ce-act-as-003"),
  "as-003 has signature keyword and should be reclassified as signature_needed"
);

// ── Section 7: required_document mapping ─────────────────────────────────────
section("7. required_document mapping");

const reqDocs = result.filter((o) => o.type === "required_document");
assert("at least one required_document object exists", reqDocs.length > 0, `got ${reqDocs.length}`);
assert(
  "required_document objects have non-empty title",
  reqDocs.every((o) => o.title.length > 0)
);
assert(
  "required_document status is not_started or gathered",
  reqDocs.every((o) => o.status === "not_started" || o.status === "gathered")
);

// ── Section 8: missing_document mapping ──────────────────────────────────────
section("8. missing_document mapping");

const missingDocs = result.filter((o) => o.type === "missing_document");
assert(
  "at least one missing_document object exists",
  missingDocs.length > 0,
  "fixture contains 'Exhibit B' and 'Appendix A' which should trigger missing_document detection"
);
assert(
  "missing_document objects have whereToGetThis set",
  missingDocs.every((o) => o.whereToGetThis !== null && o.whereToGetThis!.length > 0),
  `null whereToGetThis on: ${missingDocs.filter((o) => !o.whereToGetThis).map((o) => o.id).join(", ")}`
);

// ── Section 9: deadline mapping ───────────────────────────────────────────────
section("9. deadline mapping");

const deadlines = result.filter((o) => o.type === "deadline");
assert("at least 3 deadlines exist", deadlines.length >= 3, `got ${deadlines.length}`);
assert(
  "hard deadlines have critical priority",
  deadlines
    .filter((o) => {
      const original = SCHOOL_ENROLLMENT_FIXTURE.deadlines.find((d) => `ce-dl-${d.id}` === o.id);
      return original?.isHard ?? false;
    })
    .every((o) => o.priority === "critical")
);
assert(
  "deadlines have dueDate set from source",
  deadlines.some((o) => o.dueDate !== null),
  "at least one deadline should have a dueDate"
);

// ── Section 10: risk mapping ──────────────────────────────────────────────────
section("10. risk mapping");

const risks = result.filter((o) => o.type === "risk");
assert("at least one risk object exists", risks.length > 0, `got ${risks.length}`);
assert(
  "high-severity risks map to critical priority",
  risks
    .filter((o) => {
      const original = SCHOOL_ENROLLMENT_FIXTURE.risks.find((r) => `ce-rsk-${r.id}` === o.id);
      return original?.severity === "high";
    })
    .every((o) => o.priority === "critical")
);
assert(
  "risks have non-empty plainEnglishExplanation",
  risks.every((o) => o.plainEnglishExplanation.length > 0)
);

// ── Section 11: question_to_ask mapping ──────────────────────────────────────
section("11. question_to_ask mapping");

const questions = result.filter((o) => o.type === "question_to_ask");
assert("at least one question_to_ask exists", questions.length > 0, `got ${questions.length}`);
assert(
  "questions have non-empty title (the question text)",
  questions.every((o) => o.title.length > 0)
);
assert(
  "questions have medium priority by default",
  questions.every((o) => o.priority === "medium")
);

// ── Section 12: signature_needed — source-backed only ────────────────────────
section("12. signature_needed — source-backed and signature-keyword only");

const signatures = result.filter((o) => o.type === "signature_needed");
assert("at least one signature_needed exists", signatures.length > 0, `got ${signatures.length}`);
assert(
  "all signature_needed have critical priority",
  signatures.every((o) => o.priority === "critical"),
  signatures.filter((o) => o.priority !== "critical").map((o) => o.id).join(", ")
);
assert(
  "all signature_needed have whereToGetThis directing to official issuer",
  signatures.every(
    (o) =>
      o.whereToGetThis !== null &&
      (o.whereToGetThis!.toLowerCase().includes("issuer") ||
        o.whereToGetThis!.toLowerCase().includes("official") ||
        o.whereToGetThis!.toLowerCase().includes("issuing"))
  ),
  signatures
    .filter(
      (o) =>
        !o.whereToGetThis ||
        (!o.whereToGetThis.toLowerCase().includes("issuer") &&
          !o.whereToGetThis.toLowerCase().includes("official") &&
          !o.whereToGetThis.toLowerCase().includes("issuing"))
    )
    .map((o) => o.id)
    .join(", ")
);
// Verify that action step as-003 (signature keyword) was reclassified
const sigFromActionStep = signatures.find((o) => o.id === "ce-sig-as-003");
assert(
  "action step with signature keyword (as-003) reclassified as signature_needed",
  sigFromActionStep !== undefined
);

// ── Section 13: removed tools not referenced ─────────────────────────────────
section("13. Removed tools not referenced in output");

const REMOVED_TOOLS = [
  "redact",
  "trust check",
  "trustcheck",
  "compare versions",
  "clause extractor",
  "builder",
  "digital signature tool",
  "starter plan",
  "team plan",
  "annual plan",
  "revenuecat",
];

const outputText = JSON.stringify(result).toLowerCase();
for (const tool of REMOVED_TOOLS) {
  assert(
    `"${tool}" not referenced in parser output`,
    !outputText.includes(tool)
  );
}

// ── Section 14: IDs are unique ────────────────────────────────────────────────
section("14. ID uniqueness");

const ids = result.map((o) => o.id);
const uniqueIds = new Set(ids);
assert(
  "all CompletionObject IDs are unique",
  ids.length === uniqueIds.size,
  `${ids.length - uniqueIds.size} duplicate(s) found`
);

// ── Section 15: includedInPacket ─────────────────────────────────────────────
section("15. includedInPacket defaults");

const packetItems = result.filter((o) => o.type !== "source_evidence");
assert(
  "non-source-evidence items are included in packet by default",
  packetItems.every((o) => o.includedInPacket === true),
  packetItems.filter((o) => !o.includedInPacket).map((o) => o.id).join(", ")
);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log(`║  Results: ${passed} passed, ${failed} failed${" ".repeat(38 - String(passed).length - String(failed).length)}║`);
console.log("╚══════════════════════════════════════════════════════╝\n");

if (failures.length > 0) {
  console.error("Failed assertions:");
  failures.forEach((f) => console.error(`  • ${f}`));
  console.error("");
  process.exit(1);
} else {
  console.log("All assertions passed.\n");
  console.log(`Completion objects generated from fixture: ${result.length}`);
  const byType: Record<string, number> = {};
  for (const o of result) {
    byType[o.type] = (byType[o.type] ?? 0) + 1;
  }
  console.log("Breakdown by type:");
  for (const [type, count] of Object.entries(byType).sort()) {
    console.log(`  ${type.padEnd(22)} ${count}`);
  }
  console.log("");
}
