# PlainPath — Contract Review Closeout

**Status: APPROVED / LOCKED**
**Closed: May 2026**
**Commit range:** `ecb8a7f` → `2d698518`

---

## Product Definition

Contract Review helps users quickly understand:
- What a contract says in plain English
- Which clauses need attention before signing
- What obligations they may be accepting
- What questions to ask the other party before signing

**Primary purpose:** Understand before signing.

**Not in scope for this product:**
- Legal advice or telling the user whether to sign
- Aggressive negotiation or contract drafting as a lawyer replacement
- PDF editing, redaction, or markup
- Trust scoring, document comparison, or scam detection (separate tools)

---

## Final Approved Section Structure

```
Summary
  └── Fairness score + verdict + clause count pills

Key Clauses  — review each before signing
  └── Needs Attention clauses (red-flag rating)
  └── Watch Out clauses (watch-out rating)
  └── [each clause card — see card structure below]

Balanced Clauses  — collapsed by default
  └── Fair clauses with lower risk

Before You Sign
  └── Checklist items (negotiation + clarification actions)
  └── Items this contract is missing (missing protections sub-card)
```

---

## Final Clause Card Structure

Each Key Clause card (when expanded) shows sections in this order:

1. **What it says** — exact source quote from the contract, always visible
2. **Why this matters** — plain-English explanation of significance
3. **Questions to Ask Before Signing** — numbered, plain-English questions (violet box; shown when question data exists)
4. **Suggested language to discuss** — alternative wording the user can raise with the other party (blue box; secondary)
5. **Draft questions email** — generates a questions-focused email draft (button; non-fair clauses only, where available)

---

## Final QA Results

| Check | Result |
|-------|--------|
| Contract Review opens | PASS |
| Demo Contract Review opens | PASS |
| Summary section renders (score, verdict, pills) | PASS |
| Key Clauses section renders | PASS |
| Clause cards: What it says | PASS |
| Clause cards: Why this matters | PASS |
| Clause cards: Questions to Ask Before Signing | PASS |
| Clause cards: Suggested language to discuss | PASS |
| Balanced Clauses collapsed by default | PASS |
| Before You Sign section | PASS |
| Items this contract is missing (sub-card) | PASS |
| Filter chips: All / Needs Attention / Balanced / Before You Sign | PASS |
| Mobile readability at 390px | PASS |
| No horizontal overflow | PASS |
| No "do not sign" language anywhere | PASS |
| No "why this is a problem" language | PASS |
| No "Already signed?" section | PASS |
| No removed-tool references in primary flow | PASS |
| Production build | PASS — `✓ built in ~14s`, zero TypeScript errors |
| Protected files untouched | PASS |

---

## Corrections Completed (in order)

**A.** Removed all "do not sign" / "Do not sign as-is" language from:
- `interpretScore()` verdict strings
- `primaryRecommendation()` output strings
- All three demo datasets (verdicts, summaries, exitGuidance)
- `DemoSection.tsx` UI copy
- `ProductPreview.tsx` UI copy
- Print report intro text

**B.** Removed "why this is a problem" framing:
- `ClauseCard` — heading changed to "Why this matters"
- Print report Red Flags section — changed to "Why this matters:"
- Print report Watch Outs section label ("Why this is a concern" kept as neutral language)

**C.** Removed "Already signed?" section from `ClauseCard` entirely (wrong focus for a before-signing tool)

**D.** Added "Questions to Ask Before Signing":
- `questionsToAsk?: string[]` field added to `ClauseResult` interface
- 2–3 targeted questions populated for every clause in all three demo datasets (employment offer, freelance design, residential lease, NDA)
- Violet box section added to `ClauseCard` — appears between "Why this matters" and "Suggested language to discuss"
- Same section added to `DemoClauseCard` in `DemoContractReview.tsx`

**E.** Renamed "Suggested Revision Language" → "Suggested language to discuss":
- `ClauseCard` header label
- `DemoClauseCard` header label
- Print report Red Flags section
- Print report Watch Outs section

**F.** Renamed "Draft negotiation email" → "Draft questions email":
- Button label in `ClauseCard`
- Result state header changed to "Questions email draft"

**G.** Restructured section layout: Summary → Key Clauses → Balanced Clauses → Before You Sign
- `ResultsView` rewritten with new section order
- Filter chips simplified to: All / Needs Attention / Balanced / Before You Sign

**H.** Merged Red Flags + Watch Outs into **Key Clauses** section (unified "needs attention" framing)

**I.** Moved Missing Protections into **Before You Sign** as "Items this contract is missing" sub-card

**J.** `DemoContractReview.tsx` fully rewritten to match real product structure:
- Summary banner with score, verdict, pill counts
- Key Clauses section with full card structure (What it says / Why this matters / Questions to Ask / Suggested language to discuss)
- Before You Sign checklist
- Items this contract is missing sub-section

---

## Safety Language Verification

Searched all Contract Review surfaces for prohibited phrases. **0 user-facing matches** found for:

- "do not sign" / "don't sign"
- "why this is a problem"
- "Already signed?"
- "you should sign" / "you should not sign"
- "guaranteed safe"
- "attorney-approved"

**Allowed and present:**
- "review carefully before signing"
- "may need attention"
- "review each before signing"
- "ask before signing"
- "consider asking" / "consider reviewing with a qualified professional if needed"

**Not in Contract Review scope** (separate tools, not touched):
- `TrustCheck.tsx` — "harmful, manipulative, or one-sided" in a tooltip (TrustCheck tool, not Contract Review)
- `EvictionNotice.tsx` — "illegal activity on the premises" (tenant guides, legal terminology)
- `Terms.tsx` — "harmful" in ToS legal text

---

## Non-Blocking Polish (post-launch candidates)

1. **"Red flags" as risk-count phrase** — `meta: "3 red flags · Score 32"` appears as small secondary text in the demo tab switcher. "Red flags" as a descriptive phrase is accepted language; not a safety concern. Could later be softened to "3 clauses need attention."
2. **Print report section headers** — Print/PDF view uses "Red Flags (N)" and "Watch Outs (N)" as `<h2>` titles. The print flow is secondary and not the core product purpose; aligning these to "Key Clauses" is a post-launch cleanup item.
3. **Suggested language box on mobile** — Takes vertical space at 390px but reads correctly and is positioned below Questions to Ask. No change needed.

---

## Protected Files Confirmation

The following areas were verified untouched throughout this work:

| Area | Status |
|------|--------|
| `artifacts/plainpath/src/pages/Analyze.tsx` | UNTOUCHED |
| `artifacts/plainpath/src/lib/__tests__/completionParserQA.ts` | UNTOUCHED — 55/55 passing |
| `artifacts/plainpath/src/lib/legalGlossary.ts` | UNTOUCHED |
| `artifacts/api-server/src/lib/demoData.ts` | UNTOUCHED |
| `artifacts/api-server/src/lib/trustCheckDemoData.ts` | UNTOUCHED |
| `artifacts/plainpath/APP_STORE_METADATA.md` | UNTOUCHED |
| `docs/analyze-document-closeout.md` | UNTOUCHED |
| Billing / RevenueCat / Stripe / native billing | UNTOUCHED |
| Auth / Clerk | UNTOUCHED |
| Pricing / homepage / routes | UNTOUCHED |
| Database schema | UNTOUCHED |
| Parser schema | UNTOUCHED |
| Removed tools | UNTOUCHED |

---

## Launch Rule

**No further Contract Review feature expansion before launch.**

Post-launch polish items (print header alignment, "red flags" softening) are cosmetic and do not block submission.

---

## Files Changed in This Work

| File | Change |
|------|--------|
| `artifacts/plainpath/src/pages/ContractReview.tsx` | Full restructure — section order, ClauseCard, labels, filter chips, safety language |
| `artifacts/plainpath-marketing/src/pages/DemoContractReview.tsx` | Full rewrite — matches real product structure |
| `artifacts/plainpath/src/components/DemoSection.tsx` | "Do not sign as-is" → "Review carefully before signing" |
| `artifacts/plainpath/src/components/ProductPreview.tsx` | "Do not sign as-is" → "Review carefully before signing" |
