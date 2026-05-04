# PlainPath — Official Product Course
## Document Completion System

**Version**: 1.0  
**Date**: May 4, 2026  
**Status**: Canonical — this document defines PlainPath's official product direction

---

## What PlainPath Is

**Category**: Document Completion System

**North star**: PlainPath helps people understand, complete, and organize important paperwork before they submit it.

**Product promise**: *PlainPath turns confusing paperwork into a guided action plan and a ready-to-use document packet.*

**Approved positioning lines**:
- "Understand it. Complete it. Submit it."
- "From paperwork to action packet."
- "Know what to do before you submit."
- "Plain-English guidance for important documents."

---

## What PlainPath Is Not

PlainPath does not compete with:

| Category | Examples | Why PlainPath is different |
|---|---|---|
| Generic document parser | Adobe Acrobat, Docparser | PlainPath explains and guides, not just extracts |
| PDF editor | Adobe Acrobat, Preview | PlainPath is not a markup/annotation tool |
| E-signature platform | DocuSign, HelloSign | PlainPath guides users to get signatures, not host them |
| Legal AI / lawyer replacement | Harvey, Casetext | PlainPath explains documents without providing legal advice |
| Bulk document automation | Ironclad, ContractPodAi | PlainPath is built for individuals and families, not enterprise contract pipelines |
| Contract lifecycle management | Salesforce CLM, Ironclad | PlainPath is not a repository or workflow orchestrator |

PlainPath is:
- A **guided document completion system**
- A **plain-English paperwork assistant**
- A **source-backed action planner**
- A **completion checklist and packet compiler**

---

## Core User Problem

Users who receive confusing paperwork do not only need to know what the document says. They need to know:

1. **What to do** — what actions are required of them
2. **What to gather** — which supporting documents they need
3. **What to sign** — where signatures are required and how to get the official form
4. **What deadline matters** — which dates are hard vs. flexible
5. **What is missing** — documents referenced in the packet that weren't included
6. **Where to get official documents** — the correct source for each required item
7. **Whether they are ready to submit** — a final readiness check
8. **What to print, save, or share** — a compiled packet they can hand off or archive

PlainPath solves all of these in a single, guided flow.

---

## Official Product Loop

```
Upload
  └─▶ PlainPath reads the document

Understand
  └─▶ PlainPath explains what the document is, what it means,
       and what it asks of the user in plain language

Plan
  └─▶ PlainPath identifies:
       • action steps
       • required documents
       • missing documents
       • deadlines (hard and soft)
       • risks and penalties
       • signatures needed
       • questions to ask the issuing party
       • where to get each official document

Guide
  └─▶ PlainPath walks the user through each item
       one step at a time with source-backed context

Complete
  └─▶ User:
       • marks items complete
       • uploads and gathers documents
       • adds notes
       • tracks open and unresolved items

Compile
  └─▶ PlainPath generates a Document Action Packet
```

---

## Primary Output — Document Action Packet

The final output of every Analyze a Document session is a **Document Action Packet**: a structured, print-ready export that proves what was done and clearly flags what remains open.

### Packet Contents (in order)

1. Cover page — document title, type, analysis date, completion status
2. Plain-English summary — what the document is and what it means
3. Action checklist — all items with status indicators
4. Completed items — with source evidence and user notes
5. Open items — **always present, never hidden**
6. Required documents — status, source, file reference if uploaded
7. Signatures needed — location, status, source quote
8. Where to get missing documents — specific source for each item
9. Deadlines — chronological, with source quote and status
10. Risks — by severity, with source quote
11. Questions to ask — with suggested recipient
12. Source evidence — organized by section/page
13. User notes — all user-added notes
14. Final submission checklist — readiness summary
15. Disclaimer — PlainPath is not legal, financial, or professional advice

### Export States

| State | Description |
|---|---|
| Incomplete | Open items are prominent. Export allowed. |
| Partially complete | Progress shown. All completed and open items present. |
| Final | All items complete or not applicable. "Final" label applied. Open items section still present. |

Export is always available. No items are ever suppressed or hidden.

---

## Product Rules

These rules govern every output PlainPath produces.

| Rule | Description |
|---|---|
| **Source-backed** | Every completion item must trace back to a quote from the uploaded document. If no source can be found, the item is not generated. |
| **Preserve uncertainty** | If PlainPath is unsure whether an item applies, it flags it and lets the user decide. Ambiguous items are not silently discarded. |
| **Show where documents come from** | Every required or missing document must include a `whereToGetThis` value directing the user to the correct official source. |
| **No fabricated official forms** | PlainPath does not generate enrollment forms, court filings, government forms, or any document that must come from an official source — unless the user uploaded the blank form. |
| **No legal advice** | PlainPath explains documents and guides completion. It does not advise on legal strategy, rights, or whether to sign. |
| **Label drafts clearly** | Any PlainPath-generated letter or supporting message must be labeled: "Draft — For reference only." |
| **Open items always visible** | Unresolved items appear in every packet export. They cannot be hidden or collapsed. |
| **All export states are valid** | Incomplete, partial, and complete packets are all valid exports. Export is never blocked by missing items. |
| **No stale upgrade messages** | Messaging must not reference removed tiers (Starter, Team, annual) or removed tools. |
| **Stay focused on completion** | PlainPath does not expand into tangential features (redaction, trust scoring, version comparison, clause extraction, contract drafting) for launch. |

---

## Launch Scope

PlainPath launches with three capabilities only:

| Capability | Description |
|---|---|
| **Analyze a Document** | Upload → read → explain → plan → guide → compile |
| **Contract Review** | Focused contract analysis with risk flags and key terms |
| **Saved analysis history** | Cloud-synced analysis history for Pro subscribers |

### Do Not Restore

The following tools are removed from the product and must not be reintroduced:

- Redact Sensitive Info
- Document Trust Check
- Compare Versions
- Clause Extractor
- Document Builder
- Digital Signature
- Starter plan
- Team plan
- Annual billing

---

## Competitive Distinction

PlainPath's edge is not document scanning alone. Any model can read a PDF and return a summary.

PlainPath's edge is the full completion journey:

| Edge | What it means |
|---|---|
| **Plain-English comprehension** | Users understand exactly what the document is asking |
| **Task extraction** | Every required action is surfaced, not buried in prose |
| **Deadline awareness** | Hard and soft deadlines are extracted and prioritized |
| **Missing document guidance** | Referenced but absent documents are identified and sourced |
| **Signature guidance** | Signature locations are identified; official signable forms are sourced from the correct issuer |
| **Where-to-get-this guidance** | Every required item has a named source (school office, vital records, utility provider, HR, court clerk, etc.) |
| **Guided completion** | Users work through items one at a time with context, evidence, and actions |
| **Final packet compilation** | The result is a print-ready Document Action Packet the user can submit, archive, or share |

No other consumer-facing product provides this end-to-end loop for everyday paperwork.

---

## Roadmap

### Phase 1 — Completion Object Parser *(complete)*
- `CompletionObject` TypeScript type defined in shared lib
- `analysisResultToCompletionObjects()` parser converts existing analysis output to structured `CompletionObject[]`
- No AI calls — deterministic mapping from existing analysis sections
- 44/44 QA assertions passing

### Phase 2 — Grouped Analyze Modes
- Replace flat tab row with four mode buttons: **Understand / Plan / Complete / Compile**
- Understand mode: Plain English, Overview, Key Terms, Source Sections (existing tabs, regrouped)
- Plan mode: structured `CompletionObject[]` list from parser (Action Steps, Required Docs, Deadlines, Risks, Questions)
- Complete mode: stub view (checklist, progress)
- Compile mode: stub view ("Generate Packet" button)
- Existing analysis output is untouched — this is a layout reorganization

### Phase 3 — Guided Completion UI
- Step-by-step completion interface within Complete mode
- One item at a time, with source evidence, actions, status tracking
- Upload per item, note per item, copy request message per item
- Progress bar and sidebar checklist overview
- Completion state persisted to analysis record

### Phase 4 — Document Action Packet Compiler
- Packet compiler reads `CompletionObject[]` and renders all 15 sections
- PDF export (print-ready, formatted)
- Three export states: incomplete, partial, final
- Open items always included
- Disclaimer block

### Phase 5 — Document-Type Templates
Templates supplement AI extraction — they do not replace it.

Priority order:
1. School enrollment packet
2. Residential lease / rental notice
3. Insurance Explanation of Benefits (EOB) / medical bill
4. Employment contract / offer letter
5. Government notice (IRS, DMV, housing authority)
6. Court notice / summons
7. Service agreement / terms of service

Each template defines expected completion objects, `whereToGetThis` defaults, and common questions to ask for that document type.

### Phase 6 — Premium Polish and Mobile Optimization
- Packet PDF visual polish
- Mobile-optimized Guided Completion layout
- Motion transitions between modes
- Completion progress animation

---

## Acceptance Criteria

| Question | Answer |
|---|---|
| What is PlainPath? | A document completion system that turns confusing paperwork into a guided action plan and a print-ready Document Action Packet. |
| What is PlainPath not? | Not a PDF editor, e-signature platform, legal AI, document automation tool, or contract lifecycle manager. |
| What is the product loop? | Upload → Understand → Plan → Guide → Complete → Compile |
| What is the final deliverable? | A Document Action Packet: a structured, print-ready export of every action taken, every item gathered, every risk noted, and every open item remaining. |
| What should launch include? | Analyze a Document, Contract Review, and Saved analysis history. |
| What should not be rebuilt? | Redact, Trust Check, Compare Versions, Clause Extractor, Builder, Digital Signature, Starter plan, Team plan, annual billing. |
| What makes PlainPath different? | The full completion journey: task extraction, deadline awareness, missing document guidance, where-to-get-this sourcing, guided completion, and final packet compilation. |
| What implementation phase comes next? | Phase 2 — Grouped Analyze modes (Understand / Plan / Complete / Compile). No data changes required; the completion parser from Phase 1 feeds straight in. |
