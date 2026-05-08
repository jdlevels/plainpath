# PlainPath — App Store Screenshot Checklist
**Version:** 1.0
**Date:** May 8, 2026
**Target slot:** iPhone 6.5" (App Store Connect required slot)
**Dimensions:** 1242 × 2688 px (414×896 logical @ 3× device scale factor)
**Format:** PNG
**Appearance:** Light mode (matches current app default)
**Generated:** Automated via Playwright — real app UI, fixture/demo data, no real user documents

---

## Screenshot Set

### 1. `plainpath-01-analyze-upload.png`
| Field | Value |
|---|---|
| Filename | `plainpath-01-analyze-upload.png` |
| Dimensions | 1242 × 2688 px |
| Format | PNG |
| Route | `/app/analyze` |
| Viewport | 414 × 896 px @ 3× DPR |
| Tool shown | Analyze a Document |
| Content | Upload screen with Paste Text / Upload File / Scan Photo tabs; document type chips (IRS notice, Lease agreement, Insurance EOB, etc.); paste area; "Generate Action Plan" CTA |
| Hidden tools visible | ✅ None |
| Real user data | ✅ None — empty input screen |
| Upload-ready | ✅ Ready |

---

### 2. `plainpath-02-analyze-results.png`
| Field | Value |
|---|---|
| Filename | `plainpath-02-analyze-results.png` |
| Dimensions | 1242 × 2688 px |
| Format | PNG |
| Route | `/demo/analyze` |
| Viewport | 414 × 896 px @ 3× DPR |
| Tool shown | Analyze a Document |
| Content | Fixture lease agreement analysis — Understand / Requirements / Complete tabs; "Key risks & concerns" section with 4 risk items (landlord entry notice, late fee cap, early termination, auto-renewal); "Recommended next steps" visible at bottom |
| Hidden tools visible | ✅ None |
| Real user data | ✅ None — fixture/demo document (Residential Lease Agreement Unit 4B) |
| Upload-ready | ✅ Ready |

---

### 3. `plainpath-03-contract-review-upload.png`
| Field | Value |
|---|---|
| Filename | `plainpath-03-contract-review-upload.png` |
| Dimensions | 1242 × 2688 px |
| Format | PNG |
| Route | `/app/contract-review` |
| Viewport | 414 × 896 px @ 3× DPR |
| Tool shown | Contract Review |
| Content | Input screen with Paste Text / Upload File / Scan Photo tabs; feature bullets (Red flags surfaced, Watch-outs explained, Negotiation language ready to copy, Missing protections identified); paste area; "Try a Sample Contract" section with Freelance Design Agreement and Apartment Lease Agreement fixtures |
| Hidden tools visible | ✅ None |
| Real user data | ✅ None — empty input screen with sample contract labels |
| Upload-ready | ✅ Ready |

---

### 4. `plainpath-04-contract-review-results.png`
| Field | Value |
|---|---|
| Filename | `plainpath-04-contract-review-results.png` |
| Dimensions | 1242 × 2688 px |
| Format | PNG |
| Route | `/demo/contract-review` |
| Viewport | 414 × 896 px @ 3× DPR |
| Tool shown | Contract Review |
| Content | Fixture employment contract review — Fairness Score 41/100; "Several clauses need clarification — review carefully before signing"; 2 clauses need attention / 2 watch-outs badges; Key Clauses section with "Non-compete clause" (Needs Attention) expanded showing clause text and "Why This Matters" explanation |
| Hidden tools visible | ✅ None |
| Real user data | ✅ None — fixture/demo contract (employment offer with non-compete) |
| Upload-ready | ✅ Ready |

---

### 5. `plainpath-05-upgrade-subscription.png`
| Field | Value |
|---|---|
| Filename | `plainpath-05-upgrade-subscription.png` |
| Dimensions | 1242 × 2688 px |
| Format | PNG |
| Route | `/app/upgrade` |
| Viewport | 414 × 896 px @ 3× DPR |
| Tool shown | Upgrade / subscription |
| Content | "Simple pricing. Powerful tools." heading; "Both tools included — Analyze a Document and Contract Review. No commitment — cancel anytime."; PlainPath Pro card at $19.99/month; feature checklist (Analyze a Document, Contract Review, Plain-English summary, Key terms/deadlines, Saved analysis history, Export and share tools); "Get PlainPath Pro" CTA |
| Hidden tools visible | ✅ None |
| Real user data | ✅ None |
| Upload-ready | ✅ Ready |

---

## Launch Scope Compliance

| Check | Result |
|---|---|
| Only Analyze a Document shown as a live tool | ✅ Pass |
| Only Contract Review shown as a live tool | ✅ Pass |
| Clause Extractor not visible in any screenshot | ✅ Pass |
| Compare Versions not visible in any screenshot | ✅ Pass |
| Trust Check not visible in any screenshot | ✅ Pass |
| Redact Sensitive Info not visible in any screenshot | ✅ Pass |
| Ask This Document not visible in any screenshot | ✅ Pass |
| Builder not visible in any screenshot | ✅ Pass |
| Completion Engine not visible in any screenshot | ✅ Pass |
| Packet Compiler not visible in any screenshot | ✅ Pass |
| No "all tools" or "full suite" language visible | ✅ Pass |
| No real user documents or PII visible | ✅ Pass |
| No developer tools, localhost, or debug banners | ✅ Pass |
| No Replit UI visible | ✅ Pass |
| Subscription screen shows only two tools | ✅ Pass |
| All screenshots are light-mode, clean layout | ✅ Pass |
| All screenshots are exactly 1242 × 2688 px | ✅ Pass |
| All screenshots are PNG format | ✅ Pass |

---

## App Store Connect Upload Instructions

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → **App Store** tab → **iPhone Screenshots**
3. Select the **6.5-inch (iPhone 14 Plus, iPhone 13 Pro Max, iPhone 12 Pro Max)** slot
4. Upload all 5 PNGs in order (drag-and-drop or file picker)
5. Arrange in this order:
   - 1 — Analyze upload
   - 2 — Analyze results
   - 3 — Contract Review upload
   - 4 — Contract Review results
   - 5 — Upgrade / subscription

**If iPad is supported:** Capture the same 5 screens at iPad 12.9" dimensions (2048 × 2732 px) in landscape orientation.

---

## File Locations

All screenshots are in: `docs/app-store-screenshots/`

```
docs/app-store-screenshots/
├── plainpath-01-analyze-upload.png         1242×2688 px
├── plainpath-02-analyze-results.png        1242×2688 px
├── plainpath-03-contract-review-upload.png 1242×2688 px
├── plainpath-04-contract-review-results.png 1242×2688 px
└── plainpath-05-upgrade-subscription.png  1242×2688 px
```

Screenshots are reproducible at any time by running:
```
pnpm exec node scripts/take-screenshots.mjs
```
