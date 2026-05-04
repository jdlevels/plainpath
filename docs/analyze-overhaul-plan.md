# PlainPath — Analyze a Document Overhaul Plan
## Document Completion Engine

**Version**: 1.0  
**Date**: May 4, 2026  
**Status**: Planning only — no implementation yet  
**Scope**: Controlled overhaul of the Analyze a Document experience  
**Not in scope**: Billing, RevenueCat, routing changes, removed tools, new pricing tiers

---

## Summary

Analyze a Document currently explains documents well. It does not guide users to completion.

This plan defines how to evolve the experience from a tab-driven explanation tool into a four-mode, guided document completion system — without discarding the existing analysis output or visual design.

**New product framing**: *PlainPath turns confusing paperwork into a guided action plan and a print-ready packet.*

**Core flow**:
```
Upload → Understand → Plan → Complete → Compile
```

**End goal of every analysis**: A completed, print-ready **Document Action Packet** — a structured export of every action taken, every item gathered, every risk noted, and every open item remaining.

---

## 1. Product Purpose

### Current state
Analyze a Document reads a document and produces explanations across several tabs: Plain English, Overview, Key Terms, Source Sections, Risks, Obligations, Deadlines, etc. These are useful, but they are outputs — not a guided workflow. The user leaves with information, not a plan.

### New end goal
After uploading a document, the user should leave with:
1. A clear understanding of what the document says
2. A complete, trackable action plan derived from the document
3. Proof of everything they gathered and completed
4. A print-ready Document Action Packet they can submit, save, or share

### What changes
The mental model shifts from "here are your analysis results" to "here is your completion journey." The existing analysis outputs become raw material fed into the completion engine — they are not replaced.

---

## 2. New Experience Structure

Replace the current single tab row with four major **modes**. Each mode has a clear purpose.

---

### Mode A — Understand
**Purpose**: Explain the document in plain language.

**Contains**:
- Plain English summary
- Document overview (parties, type, effective dates)
- Source sections (how the document is organized)
- Key terms glossary

**This is largely the current analysis output.** No rebuild required — it gets reorganized under a clearer label.

---

### Mode B — Plan
**Purpose**: Show the user exactly what must happen.

**Contains**:
- Action steps required
- Required documents list
- Missing documents (referenced but not uploaded)
- Deadlines (chronological)
- Risks and penalties
- Questions to ask the issuing party
- Signatures needed
- Where to get each official document

**This is derived from the existing analysis sections** (Obligations, Risks, Key Dates, etc.) mapped into typed completion objects. See Section 3.

---

### Mode C — Complete
**Purpose**: Guide the user through the work, step by step.

**Contains**:
- Guided Completion Mode (one item at a time — see Section 4)
- Checklist overview (all items, status at a glance)
- Upload/gather document per item
- Mark complete / Mark not applicable / Needs help
- Add note per item
- Copy request message per item
- Open items tracking

---

### Mode D — Compile
**Purpose**: Create the final deliverable.

**Contains**:
- Document Action Packet preview
- Export full packet as PDF
- Print checklist
- Copy packet summary
- Open items clearly surfaced even at export time

---

### Navigation
```
[Understand]  [Plan]  [Complete]  [Compile]
```

The current detailed tabs (Plain English, Key Terms, Risks, etc.) are still accessible — they live *inside* Understand and Plan. They do not disappear; they are grouped.

---

## 3. Core Completion Engine — Data Model

Every item extracted from a document analysis maps to a **completion object**. All objects share a common schema.

### Completion Object Schema

```typescript
interface CompletionObject {
  id:                       string
  type:                     CompletionObjectType
  title:                    string
  plainEnglishExplanation:  string
  whyItMatters:             string
  whatToDo:                 string
  whereToGetThis:           string | null
  sourceQuote:              string | null
  sourcePage:               string | null
  sourceSection:            string | null
  priority:                 "critical" | "high" | "medium" | "low"
  severity:                 "critical" | "high" | "medium" | "low" | null
  dueDate:                  string | null        // ISO date
  trigger:                  string | null        // e.g. "within 10 days of receipt"
  status:                   CompletionStatus
  userNotes:                string | null
  uploadedFileId:           string | null        // user-uploaded supporting document
  includedInPacket:         boolean
  createdFromAnalysisSection: string | null      // which analysis section generated this
}
```

### Completion Object Types

| Type | Description |
|---|---|
| `action_step` | A task the user must perform |
| `required_document` | A document the user must gather |
| `missing_document` | A document referenced in the upload but not included |
| `signature_needed` | A signature location identified in the document |
| `deadline` | A date or trigger deadline |
| `risk` | A risk, penalty, or consequence |
| `question_to_ask` | Something to clarify with the issuing party |
| `source_evidence` | A key passage supporting one or more other objects |
| `user_note` | A free-text note added by the user |
| `packet_section` | A structural container for the final export only |

### Completion Statuses

| Status | Meaning |
|---|---|
| `not_started` | Not yet addressed |
| `in_progress` | Started but not finished |
| `gathered` | Document obtained or uploaded |
| `completed` | Marked done by user |
| `not_applicable` | User confirmed this does not apply |
| `needs_help` | User flagged this as stuck or unclear |

### Mapping from existing analysis outputs

| Current analysis section | Maps to |
|---|---|
| Obligations / action items | `action_step` |
| Required documents | `required_document` |
| Missing items / referenced exhibits | `missing_document` |
| Key dates / deadlines | `deadline` |
| Risks / penalties | `risk` |
| Clauses requiring signature | `signature_needed` |
| Suggested questions | `question_to_ask` |
| Source quotes | `source_evidence` |

No new AI calls are required for Phase 2. The existing analysis output is re-parsed and structured into completion objects.

---

## 4. Guided Completion Flow

Guided Completion Mode presents one item at a time in a focused, linear interface.

### Step layout

```
Step 2 of 6
────────────────────────────────────────
Proof of Residency Required                    [HIGH]

What you need:
A current utility bill, lease agreement, mortgage statement,
or official government mail showing your address.

Why it matters:
The school may reject enrollment without valid proof of residency.
This must typically be submitted before processing begins.

Where to get it:
Utility provider account portal, landlord/property management portal,
mortgage servicer, or recent official mail (IRS, DMV, USPS).

Source:
"Parent/guardian must provide proof of current residency
before the enrollment application is accepted."
— Section 2, Enrollment Requirements

────────────────────────────────────────
[ Upload document ]   [ Mark gathered ]
[ Add note ]          [ Copy request message ]
[ I don't have this ] [ Mark not applicable ]
────────────────────────────────────────
← Previous                         Next →
```

### "I don't have this" behavior
- Item status → `needs_help`
- Item added to open items list
- System offers to generate a pre-drafted request message the user can send to the relevant party (school office, employer, utility company, etc.)
- Item remains in the final packet under "Open Items"

### Copy Request Message
Generates a neutral, professional message the user can paste into an email or portal. The message:
- States what document is needed and references the source document
- Does not claim to be from a lawyer or official authority
- Is clearly labeled as a user-drafted request
- Is never presented as an official form

### Sidebar overview panel
- Full item list grouped by type
- Status badge per item
- Progress bar (e.g. 5 of 11 complete)
- Jump to any item

---

## 5. Handling Documents That Need Signing

### Rules
- PlainPath identifies signature locations. It does not fabricate signable documents.
- If the user did not upload the signable form, PlainPath tells them where to get the official version.
- PlainPath may generate supporting messages or cover letters, clearly labeled as drafts.

### Output format

```
Signature Needed
─────────────────────────────
Enrollment Application

Who likely signs:
Parent or legal guardian

Where to get the official form:
School enrollment office, official school website, or school enrollment portal.

PlainPath can help you:
  • Identify where the signature is required
  • Draft a request message to the school
  • Track this in your packet
  • Mark it complete once signed

[ Get request message ]  [ Mark complete ]  [ Add to open items ]
```

---

## 6. School Enrollment Example

**Scenario**: A parent uploads a school enrollment packet. PlainPath produces the following completion objects:

| Item | Type | Priority | Where to Get |
|---|---|---|---|
| Enrollment form | `required_document` | Critical | School office or district website |
| Child's birth certificate | `required_document` | Critical | Vital records office or existing copy |
| Parent/guardian photo ID | `required_document` | Critical | User already holds this |
| Proof of residency | `required_document` | Critical | Utility provider, landlord, mortgage servicer |
| Immunization record | `required_document` | Critical | Pediatrician's office or state immunization registry |
| Emergency contact form | `required_document` | High | School office (official form from school) |
| Medical release form | `required_document` | High | School office |
| Technology/device agreement | `required_document` | Medium | School office |
| Enrollment form signatures | `signature_needed` | Critical | School office provides form; parent signs |
| Submission deadline | `deadline` | Critical | Extracted from enrollment packet |
| IEP/504 disclosure status | `question_to_ask` | High | Parent judgment + school special services contact |
| Missing district policy (referenced but not uploaded) | `missing_document` | Medium | School office |
| Meal program eligibility | `question_to_ask` | Low | School office |

**Rule applied**: PlainPath identifies the enrollment form as a required document from the school. PlainPath does not generate or fill out the official enrollment form. It tells the user where to get it.

**Output**: A **School Enrollment Action Packet** containing all items above with statuses, source quotes, notes, and open items.

---

## 7. Document Action Packet

The final compiled export. Available at any completion state.

### Sections (in order)

| # | Section | Notes |
|---|---|---|
| 1 | Cover page | Document title, type, analysis date, completion status summary |
| 2 | Plain-English summary | What the document says in plain language |
| 3 | Completion checklist | All items with status indicators |
| 4 | Completed items | Items marked complete, gathered, or not applicable — with source evidence and user notes |
| 5 | Open items | **Never hidden.** Items still not started, in progress, or needs help |
| 6 | Required documents | Full list, status, source, user notes, file reference if uploaded |
| 7 | Signatures needed | Each signature, status, source quote |
| 8 | Deadlines | Chronological, with status and source quote |
| 9 | Risks | By severity, with source quote |
| 10 | Questions to ask | With suggested recipient |
| 11 | Source evidence | All source quotes organized by section/page |
| 12 | User notes | All user-added notes |
| 13 | Disclaimer | See Section 8 product rules |

### Export states

| State | Label | Open items behavior |
|---|---|---|
| Incomplete | "Incomplete — Review before submitting" | Open items section is prominent; export allowed |
| Partially complete | "In Progress — X of Y items complete" | Progress shown; open items included |
| Final | "Final — Ready to submit" | All items complete or not applicable; open items section still present |

Export is always available. No items are ever suppressed.

---

## 8. Product Rules

1. **Do not fabricate official documents.** PlainPath does not generate enrollment forms, court filings, lease addenda, government forms, or any document that must come from an official source — unless the user uploaded the blank form.

2. **Draft label required.** Any PlainPath-generated document must be labeled: *"Draft — For reference only. Obtain the official form from [source]."*

3. **Always show where to get official documents.** Every `required_document` and `missing_document` object must include a `whereToGetThis` value. Default: "Contact the issuing party."

4. **Source-backed evidence only.** Every completion object must trace back to a quote from the uploaded document. If no source can be identified, the object is not generated.

5. **Open items are never hidden.** Unresolved items appear prominently in the packet at all export states. They cannot be collapsed or removed from the export.

6. **Uncertainty is surfaced, not discarded.** If PlainPath is unsure whether an item applies, it flags it and lets the user decide.

7. **No legal advice.** PlainPath explains documents and guides completion. It does not advise on legal strategy, legal rights, or whether to sign.

8. **Completion is the user's decision.** PlainPath structures the work. The user decides what to do.

---

## 9. What to Keep

| Element | Status |
|---|---|
| Dark premium layout | Keep |
| Split-screen document viewer + analysis panel | Keep |
| Confidence chip | Keep |
| Source-backed language | Keep |
| Export / save buttons | Keep — reroute to packet compiler |
| Document title header | Keep |
| Existing analysis output sections | Keep — repurpose as raw material for completion objects |

### What to remove or replace

| Element | Action |
|---|---|
| Ungrouped tab row with 10+ tabs | Replace with Understand / Plan / Complete / Compile mode navigation |
| Export menu with non-functional actions | Clean up; route to packet compiler |
| Stale upgrade messaging referencing removed tiers | Already done |
| Removed tool references | Already done |

---

## 10. Implementation Phases

### Phase 1 — Planning and schema design *(this document)*
- Define completion object schema
- Define packet structure
- Define mode navigation model
- No code changes

---

### Phase 2 — Unified completion object model
*Build the data layer.*

- Define `CompletionObject` TypeScript type in shared lib
- Write a parser that takes existing analysis output JSON and emits a typed `CompletionObject[]` array
- Map each current analysis section to its corresponding object type(s)
- Store completion objects alongside the existing analysis record in the database
- No UI changes

**Acceptance**: An analysis of a school enrollment packet produces a structured `CompletionObject[]` with correct types, priorities, sources, and statuses — stored and queryable.

---

### Phase 3 — Mode navigation
*Reorganize the existing UI.*

- Replace the flat tab row with four mode buttons: Understand / Plan / Complete / Compile
- Understand mode: existing Plain English, Overview, Key Terms, Source Sections tabs (unchanged, just grouped)
- Plan mode: existing Risks, Obligations, Deadlines tabs (unchanged, just grouped) + new structured completion object list
- Complete mode: stub view showing checklist (no interaction yet)
- Compile mode: stub view showing "Generate Packet" button (no output yet)

**Acceptance**: User can navigate between four modes. Existing analysis content is accessible within Understand and Plan. No analysis functionality is broken.

---

### Phase 4 — Guided Completion UI
*Build the step-by-step completion interface.*

- Guided Completion Mode accessible from Complete mode
- Item-by-item view per Section 4 layout
- Status actions: complete, gathered, not applicable, needs help, in progress
- Note add per item
- Document upload per item
- Copy request message generation (GPT call per item)
- Sidebar overview panel with progress indicator
- Completion state persisted to the analysis record

**Acceptance**: User can open Guided Completion, step through each item, update statuses, add notes, and see progress tracked and persisted.

---

### Phase 5 — Document Action Packet compiler
*Build the export pipeline.*

- Packet compiler reads `CompletionObject[]` and renders all 13 sections from Section 7
- PDF export (print-ready, formatted)
- Incomplete / partial / final state labeling
- Cover page with summary
- Open items section — always present
- Disclaimer block

**Acceptance**: User exports a Document Action Packet at any completion state and receives a formatted PDF with all completed items, open items, source evidence, and disclaimer.

---

### Phase 6 — Document-type templates
*Pre-defined completion frameworks for common document types.*

Priority order:
1. School enrollment packet
2. Residential lease / rental notice
3. Explanation of Benefits (EOB) / medical bill
4. Employment contract / offer letter
5. Government notice (IRS, DMV, housing authority)
6. Court notice / summons
7. Service agreement / terms of service

Each template defines:
- Expected completion object types
- Default `whereToGetThis` values for common required items
- Default questions to ask for this document type
- Priority rules specific to this document type

Templates supplement AI extraction — they do not replace it. AI-extracted items not in the template are still included.

---

### Phase 7 — Polish and mobile optimization
*Premium visual refinement.*

- Packet PDF visual polish
- Mobile-optimized Guided Completion layout
- Motion transitions between modes
- Progress animation

---

## 11. Proposed New Analyze Header Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  School Enrollment Packet — Roosevelt Elementary                 │
│  Detected: School Enrollment  ·  Confidence: High  ·  8 pages   │
│  Progress: 5 of 11 steps complete          [ Generate Packet ▼ ] │
├──────────────────────────────────────────────────────────────────┤
│  [Understand]  [Plan]  [Complete]  [Compile]                     │
├───────────────────────────────┬──────────────────────────────────┤
│  Document viewer (PDF)        │  Current mode content            │
│                               │                                  │
└───────────────────────────────┴──────────────────────────────────┘
```

The split-screen PDF viewer remains. The right panel shows content for the selected mode.

---

## 12. Acceptance Criteria

| Question | Answer |
|---|---|
| What is the true end goal of Analyze a Document? | A completed, print-ready Document Action Packet — structured proof of every action taken and every item still open. |
| How does the user move from reading to action? | After Understand, they enter Plan (structured item list) then Complete (guided step-by-step). |
| How does the user complete the document task? | Guided Completion Mode walks through each item one at a time. User marks status, uploads docs, adds notes. |
| How does PlainPath handle missing/signature documents? | Extracted as `missing_document` and `signature_needed` objects. User is directed to the official source. PlainPath does not fabricate official forms. |
| Where does the user get official documents? | From the issuing party. `whereToGetThis` is set on every object. PlainPath never generates official forms without a user-uploaded original. |
| How does the app compile a final packet? | The Compile mode runs the packet compiler over the `CompletionObject[]` array and exports a formatted PDF with all 13 sections. |
| What should be built first? | Phase 2 — the completion object model and parser. No UI changes, low risk, validates the data shape before any new interface is built. |
| What should not be changed yet? | Billing, RevenueCat, routing, removed tools, existing visual design, existing analysis AI pipeline. |

---

## 13. Risks and Blockers

| Risk | Severity | Notes |
|---|---|---|
| AI extraction quality for completion objects | Medium | The parser maps existing analysis JSON. If existing analysis misses an obligation, it will be missing from the completion model. Mitigated by document-type templates (Phase 6) providing expected item lists. |
| PDF export complexity | Medium | Print-ready multi-section PDFs require careful layout work. A simpler first version (plain-text export with formatting) is acceptable for Phase 5 launch. |
| Scope creep into removed tools | High | The completion engine must not reintroduce Redact, Trust Check, Compare, or Builder as part of "document completion." These are separate products, not completion steps. |
| Official form generation risk | High | Any document PlainPath generates that looks official could mislead users. The "Draft — For reference only" rule must be enforced at every output point. |
| Mode navigation disruption | Low | Moving from flat tabs to four modes is a visual restructure, not a data change. Existing analysis output is untouched. Risk is low if tab content is preserved inside the modes. |
| Mobile layout | Low | Guided Completion Mode is step-by-step and maps cleanly to mobile. Deferred to Phase 7. |

---

## First Safe Implementation Slice

**Phase 2 — Completion object parser, school enrollment template.**

Why this is the right first slice:
- **No UI changes.** Risk to existing users is zero.
- **Validates the data shape** before building any new interface.
- **Uses existing analysis output** — no new AI calls, no new API endpoints.
- **School enrollment is well-defined.** The expected item list is predictable and testable.
- **Unblocks everything else.** Phases 3–7 all depend on the `CompletionObject[]` existing.

Definition of done for this slice:
- `CompletionObject` type defined in shared lib
- Parser function: `analysisResultToCompletionObjects(analysisResult) → CompletionObject[]`
- School enrollment template defines expected items, priorities, and `whereToGetThis` defaults
- Running the parser on a school enrollment analysis produces a correct, complete `CompletionObject[]`
- Objects stored in the database alongside the analysis record
- No visible UI change to the user
