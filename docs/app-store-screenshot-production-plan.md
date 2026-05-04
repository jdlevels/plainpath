# PlainPath — App Store Screenshot Production Plan

**Status:** Draft — owner confirmation items flagged inline.
**Reference:** `docs/app-store-submission-assets.md`
**Launch scope:** Two tools — Analyze a Document, Contract Review.

---

## Device & Dimensions

### Primary target
**iPhone 6.9-inch portrait** (iPhone 16 Pro Max)
Resolution: **1320 × 2868 px** (PNG or JPEG, sRGB)

### Secondary target
**iPhone 6.5-inch portrait** (iPhone 14 Plus / 15 Plus)
Resolution: **1242 × 2688 px**

### App Store Connect scaling note
As of 2024, App Store Connect **does not auto-scale** from 6.9-inch to 6.5-inch. Both sizes must be uploaded separately if you support devices that show the 6.5-inch slot. If PlainPath's minimum supported iOS device requires 6.5-inch screenshots, produce both sets. ⚑ *Owner to confirm minimum supported device.*

### Recommended capture method
- **Xcode Simulator** — iPhone 16 Pro Max (6.9-inch) and iPhone 15 Plus (6.5-inch)
- Or physical device running a clean demo session
- Use **light mode** for primary set (higher contrast, App Store default appearance)
- Optionally produce a **dark mode** alternate set for the second slot

---

## Filename Convention

```
plainpath-ios-screenshot-[number]-[slug]-[size].png

Examples:
plainpath-ios-screenshot-1-upload-6.9.png
plainpath-ios-screenshot-2-analyze-summary-6.9.png
plainpath-ios-screenshot-3-analyze-checklist-6.9.png
plainpath-ios-screenshot-4-analyze-complete-6.9.png
plainpath-ios-screenshot-5-contract-clauses-6.9.png
plainpath-ios-screenshot-6-contract-questions-6.9.png
```

Use the same slug pattern for 6.5-inch, replacing `6.9` with `6.5`.

---

## Screenshot Set — 6 Screens

---

### Screenshot 1 — Start / Upload

| Field | Detail |
|---|---|
| **Title** | Start with your document |
| **Overlay caption** | Upload paperwork or a contract. |
| **Screen to capture** | Import screen — document picker ready state, or home screen with tool selection visible |
| **Required state** | Clean state, no prior document loaded. Show the tool-selection or upload prompt. |
| **What it proves** | Simple, low-friction entry point. Works with any document. |
| **Do not show** | Error states, partial uploads, any real user data, removed tools, Starter/Team plan UI |

**Caption notes:** Keep to one short sentence. No punctuation-heavy overlays on screenshot 1 — let the UI speak.

---

### Screenshot 2 — Analyze: Plain-English Summary

| Field | Detail |
|---|---|
| **Title** | See what the document says |
| **Overlay caption** | See what the document says in plain English. |
| **Screen to capture** | Analyze results — summary section at top of results view |
| **Required state** | Demo document loaded (use fictional lease or school enrollment notice). Summary section visible, no scroll required. |
| **What it proves** | Core Analyze value: instant plain-English reading of confusing documents. |
| **Do not show** | Real personal data, real addresses, real names, attorney-approved language, fear-based copy, risk score alone without context |

**Demo document suggestion:** Fictional lease renewal notice — "Maple Street Apartments LLC" — fictional tenant name.

---

### Screenshot 3 — Analyze: Requirements Checklist

| Field | Detail |
|---|---|
| **Title** | Know what needs to be completed |
| **Overlay caption** | Know what needs to be completed. |
| **Screen to capture** | Analyze results — action items / required documents section |
| **Required state** | Checklist visible with 3–5 fictional items (e.g., "Proof of residency," "Signed addendum," "Photo ID"). At least one item marked as needed. |
| **What it proves** | PlainPath doesn't just summarize — it tells you what to gather or complete before submitting. |
| **Do not show** | Completed-all state (show active work-in-progress), real document requirements |

**Demo document suggestion:** Same fictional lease or a fictional school enrollment packet.

---

### Screenshot 4 — Analyze: Completion Progress

| Field | Detail |
|---|---|
| **Title** | Check off items as you finish |
| **Overlay caption** | Check off items as you finish them. |
| **Screen to capture** | Analyze results or builder view — checklist with mixed completed/pending states |
| **Required state** | 2–3 items checked off, 1–2 remaining. Progress indicator visible if available. |
| **What it proves** | PlainPath is a workflow tool, not a one-time reader — users can track completion. |
| **Do not show** | All items complete (underwhelming), all items pending (looks unstarted), any real data |

**Note:** If the builder/plan view is visually richer than the checklist within results, prefer that screen. ⚑ *Owner to confirm which screen best shows completion state.*

---

### Screenshot 5 — Contract Review: Key Clauses

| Field | Detail |
|---|---|
| **Title** | Review key clauses before signing |
| **Overlay caption** | Review key clauses before signing. |
| **Screen to capture** | Contract Review results — Key Clauses section, one ClauseCard expanded showing "What it says" and "Why this matters" |
| **Required state** | Fictional contract loaded (e.g., fictional freelance agreement or fictional NDA). One clause card expanded. "Needs Attention" badge visible but not alarming. |
| **What it proves** | PlainPath breaks down individual clauses in plain English — not just a summary, but clause-level clarity. |
| **Do not show** | "Do not sign" language, "Red Flag" badge as primary label, fear-heavy copy, real contract content |

**Demo document suggestion:** Fictional freelance services agreement — "Acme Creative LLC" with a fictional non-compete clause.

---

### Screenshot 6 — Contract Review: Questions to Ask

| Field | Detail |
|---|---|
| **Title** | Know what to ask before you sign |
| **Overlay caption** | Know what to clarify before you sign. |
| **Screen to capture** | Contract Review results — ClauseCard showing "Questions to Ask Before Signing" section, or the "Before You Sign" section of the results view |
| **Required state** | 2–3 fictional questions visible (e.g., "Can the non-compete scope be limited to direct competitors?" / "Is the notice period negotiable?"). Questions readable at screenshot size. |
| **What it proves** | PlainPath prepares you to negotiate — actionable output, not just flags. This is the strongest differentiator. |
| **Do not show** | "Do not sign," attorney-approved language, fear-based wording, real personal data, full email draft (too small to read at screenshot size) |

**Caption notes:** This is the most important screenshot for differentiation. Make the questions legible. Consider zooming the view or using a scrolled state to show questions prominently.

---

## Recommended Screenshot Order

The order above is recommended as-is:

1. Upload (hook — simple entry)
2. Analyze summary (core value — plain English)
3. Analyze checklist (depth — requirements)
4. Analyze completion (workflow — action)
5. Contract clauses (second tool — clause clarity)
6. Contract questions (differentiator — know what to ask)

**Rationale:** Screenshots 1–4 establish Analyze a Document first (most universal appeal — any paperwork). Screenshots 5–6 introduce Contract Review (high-intent users). The closing screenshot (questions to ask) leaves the strongest impression.

---

## Overlay / Caption Design Notes

- Font: Use a clean sans-serif (SF Pro or Inter). Match PlainPath brand where possible.
- Caption placement: Bottom third of screenshot, clear of navigation chrome and key UI.
- Background behind caption text: Semi-transparent dark pill or frosted panel — do not obscure UI.
- Max caption length per screenshot: **50 characters** (readable at thumbnail size in App Store).
- Do not add the PlainPath logo to screenshots — App Store shows your app icon separately.
- Avoid colored overlays that clash with the app's blue/amber accent palette.

---

## Demo Data Requirements

All screenshots must use fictional data only. Suggested demo set:

| Field | Value |
|---|---|
| Tenant / user name | Alex Rivera |
| Landlord / issuer | Maple Street Properties LLC |
| Document type (Analyze) | Lease renewal notice |
| Document type (Contract) | Freelance services agreement |
| Contracting party | Acme Creative LLC |
| Clause shown | Non-compete / scope of work |
| Questions shown | Fictional negotiation questions |
| Checklist items | Proof of residency, Signed addendum, Photo ID |

---

## Owner Checklist Before Upload

- [ ] Minimum supported iOS version confirmed — determine if 6.5-inch screenshots required
- [ ] Demo session prepared with fictional documents loaded and correct states visible
- [ ] Simulator running on correct device (iPhone 16 Pro Max for 6.9-inch)
- [ ] Light mode confirmed active before capture
- [ ] Status bar clean — time set to 9:41 (Apple convention), full signal/battery
- [ ] No real user data visible anywhere in screenshots
- [ ] No removed tools visible in any screenshot
- [ ] No Starter / Team / annual pricing visible in any screenshot
- [ ] Caption overlays added in design tool (Figma, Sketch, or Canva) — not burned into raw screenshots
- [ ] All 6 screenshots exported at correct resolution for each size slot
- [ ] Filenames follow naming convention before upload

---

## Missing Items / Open Questions

| # | Item | Owner action |
|---|---|---|
| 1 | Minimum iOS device support | Confirm whether 6.5-inch set is required |
| 2 | Screenshot 4 (completion) best screen | Confirm builder/plan view vs checklist-in-results |
| 3 | Demo contract document | Prepare fictional freelance agreement for Contract Review capture |
| 4 | Caption overlay design | Decide on font, color, and placement before production begins |
| 5 | Dark mode set | Decide whether to produce a dark mode alternate set |

---

## Final Recommendation

**READY FOR PRODUCTION** — all screens are defined, captions are written, and demo data is specified. Complete the owner checklist above before beginning capture. Produce 6.9-inch set first; add 6.5-inch if minimum device support requires it.
