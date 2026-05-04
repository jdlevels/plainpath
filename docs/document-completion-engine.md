# PlainPath — Document Completion Engine
## Product Planning Document

**Version**: 1.0  
**Date**: May 4, 2026  
**Status**: Planning only — no implementation yet  
**Scope**: Defines the Document Completion Engine as PlainPath's next core product layer

---

## 1. Product Purpose

PlainPath should become a **document completion system**, not only a document explanation system.

Today, PlainPath reads and analyzes a document and explains what it means. That is valuable — but incomplete. A user who understands a document still faces a second problem: *what do I actually do now?*

The gap between understanding and completing is where users get stuck, miss deadlines, forget required items, lose track of what they gathered, or submit incomplete packets.

The end goal of Analyze a Document is a **completed, print-ready Document Action Packet** — a structured export of every action taken, every item gathered, every risk noted, and every open item remaining.

**Core product loop:**

```
Upload → Analyze → Build Action Plan → Guide Completion → Compile Packet
```

PlainPath reads the document, extracts every completion requirement, guides the user through each one, and compiles the result into a final packet they can print, save, or submit.

---

## 2. User-Facing Flow

### Step 1 — Upload
User uploads a document. PlainPath identifies the document type (lease, enrollment packet, court notice, EOB, government letter, employment contract, service agreement, etc.).

### Step 2 — Analyze
PlainPath reads the full document and produces its standard analysis output: plain-English summary, risk flags, key terms, obligations, and deadlines.

### Step 3 — Build Action Plan
New layer. PlainPath extracts a structured set of completion objects from the analysis:

- Actions the user must take
- Documents the user must gather
- Documents that are missing from the upload
- Signatures required
- Deadlines
- Risks
- Questions the user should ask the issuing party
- Source evidence for each item

This produces the **Document Action Plan** — a structured checklist derived from the document itself.

### Step 4 — Guided Completion Mode
User enters Guided Completion Mode and works through each item one at a time. Each step shows what is needed, why it matters, where to get it, what happens if ignored, and source evidence.

User actions per item:
- Mark complete
- Upload supporting document
- Add a note
- Copy a request message (pre-drafted message they can send to a school, employer, landlord, etc.)
- Mark not applicable
- Add to open items list

### Step 5 — Compile Packet
When the user is ready (at any completion state), PlainPath compiles the Document Action Packet — a structured, formatted export of everything gathered, completed, and still open.

---

## 3. Core Engine Objects

Every item extracted from the document maps to one of these object types. All objects share a common field set.

### Common Fields (all object types)

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `type` | enum | See object types below |
| `title` | string | Short label (e.g. "Birth Certificate") |
| `plainEnglishExplanation` | string | What this is, in plain language |
| `whyItMatters` | string | Consequence of missing or ignoring this item |
| `sourceQuote` | string | Verbatim text from the uploaded document that generated this item |
| `sourcePage` | string | Page or section reference, if available |
| `sourceSection` | string | Named section reference, if available |
| `status` | enum | See completion statuses below |
| `priority` | enum | `critical` / `high` / `medium` / `low` |
| `dueDate` | date | Absolute deadline, if specified |
| `dueTrigger` | string | Relative deadline (e.g. "within 10 days of receipt") |
| `whereToGetThis` | string | Official source — school office, court clerk, employer HR, etc. |
| `userNotes` | string | Free-text user annotation |
| `uploadedFileId` | string | If user uploaded a supporting document for this item |
| `includedInPacket` | boolean | Whether this item appears in the compiled export |

### Object Types

| Type | Description |
|---|---|
| `action_item` | A task the user must perform (sign a form, make a phone call, submit a request) |
| `required_document` | A document the user must gather and provide |
| `missing_document` | A document referenced in the upload that was not included (e.g. "see attached exhibit A" but A is missing) |
| `signature_needed` | A signature location identified in the document |
| `deadline` | A date or trigger deadline extracted from the document |
| `risk` | A risk, penalty, or consequence identified in the document |
| `question_to_ask` | Something the user should clarify with the issuing party |
| `source_evidence` | A key passage cited to support one or more other objects |
| `user_note` | A free-text note added by the user during guided completion |
| `packet_section` | A structural container used in the final packet export only |

---

## 4. Completion Statuses

| Status | Meaning |
|---|---|
| `not_started` | User has not addressed this item yet |
| `in_progress` | User has started but not finished |
| `gathered` | User has uploaded or obtained this item |
| `completed` | User has marked this item as done |
| `not_applicable` | User has confirmed this item does not apply to their situation |
| `needs_help` | User flagged this item as stuck or unclear |

---

## 5. Guided Completion Mode — UI Definition

Guided Completion Mode presents one item at a time in a focused, step-by-step interface.

### Per-Item View

**Header block**
- Item type badge (Required Document / Action / Deadline / Risk / etc.)
- Priority badge (Critical / High / Medium / Low)
- Title
- Due date or trigger (if set)

**Body**
- Plain English explanation of this item
- Why it matters — what happens if this is missed or ignored
- Where to get this — specific source (do not fabricate; show what was extracted from the document or what is standard for the document type)
- Source evidence — verbatim quote from the uploaded document with page/section reference

**Action bar**
- Mark complete
- Upload document
- Add note
- Copy request message (pre-drafted message the user can send to request this item)
- Mark not applicable
- Flag as needs help

**Navigation**
- Item counter (e.g. "3 of 14")
- Previous / Next
- Jump to any item via checklist sidebar

**Sidebar / Overview panel**
- Full item list grouped by type (Required Documents, Actions, Deadlines, Risks, Questions)
- Status indicator per item
- Overall completion progress bar

### Copy Request Message

When user taps "Copy request message," PlainPath generates a neutral, professional draft message the user can paste into an email or portal to request the item. The message:
- Does not claim to be from a lawyer or official source
- States what document is needed and why
- References the original document where appropriate
- Is clearly labeled as a user-drafted request, not an official form

---

## 6. School Enrollment Example

**Scenario**: A parent uploads a school enrollment packet.

PlainPath should identify and surface the following completion objects:

| Item | Type | Where to Get |
|---|---|---|
| Enrollment form | Required Document | School office or district website |
| Birth certificate | Required Document | Vital records office or existing copy |
| Parent/guardian government-issued ID | Required Document | User already holds this |
| Proof of residency (utility bill, lease, or official mail) | Required Document | User already holds this |
| Immunization record | Required Document | Pediatrician's office or state immunization registry |
| Emergency contact form | Required Document | School office (official form from school) |
| Signatures on enrollment form | Signature Needed | School office provides form; parent signs |
| Submission deadline | Deadline | Extracted from enrollment packet |
| IEP/504 disclosure if applicable | Action Item | Parent judgment + school contact |
| Missing exhibit (e.g. district policy referenced but not included) | Missing Document | School office |
| Questions about meal program / transportation eligibility | Question to Ask | School office |

**Important rule applied here**: PlainPath identifies the enrollment form as a Required Document from the school. PlainPath does not generate or fill out an enrollment form. PlainPath tells the user where to get the official form.

---

## 7. Document Action Packet — Export Definition

The Document Action Packet is the final compiled export, available at any completion state.

### Packet Sections (in order)

1. **Cover page**
   - Document title
   - Document type
   - Date analyzed
   - Completion status summary (e.g. "8 of 14 items completed")
   - PlainPath disclaimer (see Section 8)

2. **Document summary**
   - Plain-English summary of the uploaded document
   - Key terms
   - Parties identified

3. **Completion checklist**
   - Full item list with status indicators
   - Grouped by type

4. **Completed items**
   - All items marked complete, gathered, or not applicable
   - Source evidence for each
   - User notes

5. **Open items**
   - All items marked not started, in progress, or needs help
   - Clearly flagged — never hidden
   - Why each matters + where to get each

6. **Required documents**
   - Full list of required documents
   - Status + source + user notes per item
   - Uploaded file reference if applicable

7. **Signatures needed**
   - Each signature location identified
   - Status
   - Source quote

8. **Deadlines**
   - All deadlines in chronological order
   - Status
   - Source quote

9. **Risks**
   - All identified risks
   - Severity
   - Source quote

10. **Questions to ask**
    - All flagged questions
    - Status
    - Suggested recipient

11. **Source evidence**
    - All source quotes organized by section/page

12. **User notes**
    - All user-added notes

13. **Disclaimer**
    - See Section 8

### Export States

| State | Description |
|---|---|
| Incomplete packet | User exports before addressing any items. Open items section is prominent. |
| Partially complete packet | User exports mid-completion. All completed and open items present. |
| Final packet | User marks all items complete or not applicable. Export clearly labeled "Final." |

All three states are valid exports. Open items are never suppressed.

---

## 8. Product Rules

These rules govern every output PlainPath produces in the Document Completion Engine.

1. **Do not fabricate official documents.** PlainPath does not generate enrollment forms, court filings, lease addenda, government forms, or any document that must come from an official source — unless the user uploaded the blank form. PlainPath may draft supporting notes or request messages clearly labeled as such.

2. **Do not generate forms as if they are official.** If PlainPath generates a draft document, it must be clearly labeled "Draft — For reference only. Obtain the official form from [source]."

3. **Always show where to get official documents.** Every required document object must include a `whereToGetThis` value. If extraction cannot determine it, default to "Contact the issuing party."

4. **Always preserve source-backed evidence.** Every completion object must trace back to a quote from the uploaded document. If no source can be identified, the object should not be generated.

5. **Always include open items in the final packet.** Open and unresolved items must appear prominently. They are never hidden or collapsed by default.

6. **Do not hide uncertainty.** If PlainPath is unsure whether an item applies, flag it as uncertain and let the user decide. Do not silently discard ambiguous items.

7. **Do not provide legal advice.** PlainPath explains documents and guides completion. It does not advise on legal strategy, legal rights, or whether the user should sign or not sign.

8. **Completion is the user's decision.** PlainPath provides guidance, evidence, and structure. The user makes all final decisions.

---

## 9. Implementation Phases

### Phase 1 — Unified Completion Object Model
*What gets built*: The data model and the task aggregation layer.

- Define the completion object schema in code
- Extend the existing analysis output pipeline to emit structured completion objects
- Map existing analysis output sections (risks, obligations, key dates, missing items) into typed completion objects
- Store completion objects alongside the analysis record
- No new UI required — this is a data layer

**Acceptance**: An analysis run on a school enrollment packet produces a structured array of typed completion objects with source evidence, priority, and status fields — stored and queryable.

---

### Phase 2 — Guided Completion UI
*What gets built*: The step-by-step completion interface.

- Guided Completion Mode accessible from the analysis result page
- Item-by-item view with all fields from Section 5
- Status update actions (complete, not applicable, needs help, in progress)
- Note-add capability
- Document upload per item
- Copy request message generation
- Sidebar overview panel with progress indicator
- Completion state persisted to the analysis record

**Acceptance**: A user can open Guided Completion Mode from an analysis, work through each item, update statuses, add notes, and see their progress tracked.

---

### Phase 3 — Document Action Packet Compiler
*What gets built*: The export pipeline.

- Packet compiler that reads completion object array and renders all sections from Section 7
- PDF export (print-ready)
- Incomplete / partial / final packet state labeling
- Cover page with summary
- Disclaimer block
- Open items prominently surfaced even on "final" exports

**Acceptance**: A user can export a Document Action Packet at any completion state and receive a formatted, readable PDF containing all completed items, all open items, source evidence, and the disclaimer.

---

### Phase 4 — Document-Type Templates
*What gets built*: Pre-defined completion frameworks for common document types.

Templates to build (in priority order):
1. School enrollment packet
2. Residential lease agreement
3. Explanation of Benefits (EOB)
4. Employment contract / offer letter
5. Government notice (IRS, DMV, housing authority)
6. Court notice / summons
7. Service agreement / terms of service

Each template defines:
- Expected completion object types for this document type
- Default `whereToGetThis` values for common required documents
- Default questions to ask for this document type
- Priority rules specific to this document type

Templates supplement AI extraction — they do not replace it. If the document contains items not in the template, they are still extracted.

**Acceptance**: A school enrollment packet analysis produces a completion object list that matches the template definition (all expected items identified) plus any additional items extracted from the specific document uploaded.

---

## 10. Acceptance Criteria

| Question | Answer |
|---|---|
| What is the end goal of Analyze a Document? | A completed, print-ready Document Action Packet — structured evidence of every action taken and every item still open. |
| How does the user move from analysis to action? | After analysis, the user enters Guided Completion Mode. PlainPath presents each required action, document, deadline, and risk as a step to complete. |
| How does PlainPath guide completion? | One item at a time. Each step shows what is needed, why it matters, where to get it, what happens if missed, and the source quote. User marks status and adds notes. |
| How does PlainPath handle documents that need signing? | Signature locations are extracted as `signature_needed` objects. PlainPath shows where the signature is required and directs the user to the official issuing party for the signable form. PlainPath does not generate signable documents unless the user uploaded the original form. |
| Where does the user get official documents? | From the issuing party. PlainPath always identifies the correct source (school office, court clerk, employer HR, vital records, etc.) and never fabricates official forms. |
| What gets compiled into the final packet? | All completion objects with status, source evidence, user notes, and uploaded documents. Open items are always included. |
| What should be built first? | Phase 1 — the unified completion object model and task aggregation layer. This is the foundation everything else depends on. |

---

## Recommended First Implementation Slice

**Phase 1, starting with the school enrollment template.**

The school enrollment document type is well-defined, non-adversarial, and highly relatable — it makes the value of the completion engine immediately obvious to a broad user base. It has a predictable set of required documents, a firm deadline, and clear "where to get" sources.

Starting here validates:
- The completion object schema in a real scenario
- The aggregation pipeline against an existing analysis output
- The template system with a concrete, testable definition

Once the school enrollment template produces clean, structured completion objects from an analysis run, Phase 2 (Guided Completion UI) can be built against a known-good data shape.
