// ── PlainPath Completion Parser — QA Runner ───────────────────────────────────
// Run with: npx tsx artifacts/plainpath/src/lib/__tests__/completionParserQA.ts
//
// Exercises the parser against three fixture scenarios and asserts:
//   - No completion object has an empty title
//   - All item types have a non-empty whatToDo
//   - whereToGetThis is populated when the category/docType supports it
//   - trigger is extracted from timing language in descriptions
//   - dueDate is only set when the fixture explicitly provides a date
//   - No URLs are invented
//   - No official form numbers are invented
//   - No legal advice wording is introduced
//   - IDs remain unique per fixture run

import { analysisResultToCompletionObjects } from "../completionParser";
import { SCHOOL_ENROLLMENT_FIXTURE } from "../completionFixture";
import { CONTRACT_SERVICE_AGREEMENT_FIXTURE } from "../completionFixtureContract";
import { EOB_MEDICAL_BILL_FIXTURE } from "../completionFixtureEOB";
import type { CompletionObject } from "../completionTypes";

// ── Assertion helpers ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertNone(items: CompletionObject[], predicate: (o: CompletionObject) => boolean, label: string): void {
  const matches = items.filter(predicate);
  assert(matches.length === 0, label + (matches.length > 0 ? ` (${matches.length} violations: ${matches.map(m => m.id).join(", ")})` : ""));
}

function assertSome(items: CompletionObject[], predicate: (o: CompletionObject) => boolean, label: string): void {
  assert(items.some(predicate), label);
}

function assertIds(items: CompletionObject[]): void {
  const ids = items.map(o => o.id);
  const unique = new Set(ids);
  assert(unique.size === ids.length, `All IDs are unique (${ids.length} items)`);
}

const INVENTED_URL_RE = /https?:\/\/[^\s]+|www\.[^\s]+/i;
const LEGAL_ADVICE_RE = /\b(you are legally (required|entitled)|this is not legal advice|consult (an|a) (lawyer|attorney)|legal advice)\b/i;
const INVENTED_FORM_RE = /\b(form\s+[A-Z0-9]{2,}-[A-Z0-9]+|IRS\s+Form|SF-\d{3}|CMS-\d{4})\b/i;

function runQA(label: string, fixture: typeof SCHOOL_ENROLLMENT_FIXTURE): CompletionObject[] {
  console.log(`\n══ ${label} ══`);
  const items = analysisResultToCompletionObjects(fixture);
  console.log(`  Generated ${items.length} completion objects`);

  // ── Universal assertions ──────────────────────────────────────────────────

  assertIds(items);

  assertNone(items,
    o => !o.title || o.title.trim().length === 0,
    "No item has an empty title"
  );

  assertNone(items,
    o => !o.whatToDo || o.whatToDo.trim().length === 0,
    "No item has an empty whatToDo"
  );

  assertNone(items,
    o => !o.plainEnglishExplanation || o.plainEnglishExplanation.trim().length === 0,
    "No item lacks both description and plainEnglishExplanation"
  );

  assertNone(items,
    o => INVENTED_URL_RE.test(o.whereToGetThis ?? "") ||
         INVENTED_URL_RE.test(o.whatToDo) ||
         INVENTED_URL_RE.test(o.plainEnglishExplanation),
    "No invented URLs in output fields"
  );

  assertNone(items,
    o => INVENTED_FORM_RE.test(o.whatToDo) || INVENTED_FORM_RE.test(o.whereToGetThis ?? ""),
    "No invented official form numbers"
  );

  assertNone(items,
    o => LEGAL_ADVICE_RE.test(o.whatToDo) || LEGAL_ADVICE_RE.test(o.plainEnglishExplanation),
    "No legal advice wording"
  );

  assertNone(items,
    o => o.whatToDo === o.plainEnglishExplanation && o.type === "action_step",
    "action_step: whatToDo is distinct from plainEnglishExplanation"
  );

  // ── Trigger assertions ────────────────────────────────────────────────────

  const deadlines = items.filter(o => o.type === "deadline");
  const deadlinesWithTrigger = deadlines.filter(o => o.trigger !== null);
  console.log(`  Deadlines: ${deadlines.length}, with trigger extracted: ${deadlinesWithTrigger.length}`);

  const actionSteps = items.filter(o => o.type === "action_step");
  const actionsWithWhereToGet = actionSteps.filter(o => o.whereToGetThis !== null);
  console.log(`  Action steps: ${actionSteps.length}, with whereToGetThis: ${actionsWithWhereToGet.length}`);

  const questions = items.filter(o => o.type === "question_to_ask");
  const questionsWithWhereToGet = questions.filter(o => o.whereToGetThis !== null);
  console.log(`  Questions: ${questions.length}, with whereToGetThis: ${questionsWithWhereToGet.length}`);

  // ── dueDate discipline ────────────────────────────────────────────────────

  assertNone(items,
    o => o.type !== "deadline" && o.type !== "action_step" && o.dueDate !== null,
    "dueDate only set for deadline and action_step types"
  );

  // ── sourceQuote discipline ────────────────────────────────────────────────

  const withSourceQuote = items.filter(o => o.sourceQuote !== null);
  console.log(`  Items with sourceQuote: ${withSourceQuote.length}/${items.length}`);

  assertNone(items,
    o => o.sourceQuote !== null && o.sourceQuote.startsWith("http"),
    "sourceQuote values are not URLs"
  );

  return items;
}

// ── Fixture A: School enrollment ───────────────────────────────────────────────

const schoolItems = runQA("A — School Enrollment Packet", SCHOOL_ENROLLMENT_FIXTURE);

assertSome(schoolItems, o => o.type === "signature_needed", "Has signature_needed");
assertSome(schoolItems, o => o.type === "required_document", "Has required_document");
assertSome(schoolItems, o => o.type === "missing_document", "Has missing_document");
assertSome(schoolItems, o => o.type === "deadline", "Has deadline");
assertSome(schoolItems, o => o.type === "question_to_ask", "Has question_to_ask");
assertSome(schoolItems, o => o.type === "deadline" && o.trigger !== null, "At least one deadline has an extracted trigger");
assertSome(schoolItems, o => o.type === "action_step" && o.whereToGetThis !== null, "At least one action_step has whereToGetThis");
assertSome(schoolItems, o => o.dueDate === "2026-06-15", "Hard enrollment deadline date preserved");

// ── Fixture B: Contract / Service Agreement ────────────────────────────────────

const contractItems = runQA("B — Contract / Service Agreement", CONTRACT_SERVICE_AGREEMENT_FIXTURE);

assertSome(contractItems, o => o.type === "action_step", "Has action_step");
assertSome(contractItems, o => o.type === "deadline", "Has deadline");
assertSome(contractItems, o => o.type === "risk", "Has risk");
assertSome(contractItems, o => o.type === "signature_needed", "Has signature_needed");
assertSome(contractItems, o => o.type === "required_document", "Has required_document");
assertSome(contractItems, o => o.type === "action_step" && o.whereToGetThis !== null, "Finance action step has whereToGetThis");
assertSome(contractItems, o => o.type === "deadline" && o.trigger !== null, "At least one deadline has an extracted trigger");

// ── Fixture C: EOB / Medical Bill ─────────────────────────────────────────────

const eobItems = runQA("C — EOB / Medical Bill", EOB_MEDICAL_BILL_FIXTURE);

assertSome(eobItems, o => o.type === "action_step", "Has action_step");
assertSome(eobItems, o => o.type === "deadline", "Has deadline");
assertSome(eobItems, o => o.type === "risk", "Has risk");
assertSome(eobItems, o => o.type === "question_to_ask", "Has question_to_ask");
assertSome(eobItems, o => o.type === "required_document", "Has required_document");
assertSome(eobItems, o => o.type === "action_step" && o.whereToGetThis !== null, "Healthcare action step has whereToGetThis");
assertSome(eobItems, o => o.type === "question_to_ask" && o.whereToGetThis !== null, "Question has whereToGetThis from docType");
assertSome(eobItems, o => o.type === "deadline" && o.trigger !== null, "Appeal deadline has extracted trigger");
assertSome(eobItems, o => o.dueDate === "2026-06-22", "Hard appeal deadline date preserved");
assertSome(eobItems, o => o.type === "action_step" && o.dueDate === "2026-06-22", "Action step with explicit deadline has dueDate");

// ── Summary ────────────────────────────────────────────────────────────────────

console.log(`\n══ QA Summary ══`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
  console.error(`\n✗ ${failed} assertion(s) failed.`);
  process.exit(1);
} else {
  console.log(`\n✓ All ${passed} assertions passed.`);
}
