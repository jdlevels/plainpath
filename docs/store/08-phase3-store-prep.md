# PlainPath — Phase 3 Store-Prep Pack
## Screenshot Plan · Submission Risk Notes · Asset Checklist · Stability Statement

Last updated: April 2026 · Web app live · Mobile/native planned for future submission

---

## A. SCREENSHOT PLAN

### Capture philosophy
- Use real app UI, not mockups or reconstructions
- Capture at full iPhone 16 Pro Max resolution (1320 × 2868 px) — scale down for other sizes
- Use light mode throughout for consistency (the app's default state matches the marketing site aesthetic)
- Add a caption overlay bar at the bottom of each shot: dark semi-transparent bar, white bold text, consistent height and padding across all shots
- No device frames required (both stores accept frameless screenshots)
- Do not show any pricing UI in screenshots (App Store policy — pricing must appear only in IAP metadata)
- Use built-in sample documents to avoid showing real user data

---

### Screenshot 1 — Home: Tool Grid
**Screen to capture:** App home page, authenticated, all 8 tool cards visible
**Content requirements:**
- All 8 tool cards in the grid: Analyze, Document Trust Check, Build a Contract, Contract Review, Redact Sensitive Info, Clause Extractor, Compare Versions, Digital Signature
- No active analysis or open modal — clean dashboard state
- User's name or account info should not be visible (use a generic/test account)
**Caption overlay:** `8 tools for every document you face`
**Purpose:** Establishes scope and completeness. First impression. Most important shot.
**Notes:** If the grid wraps on a narrow viewport, capture at a wider device width or scroll to show all 8 tiles.

---

### Screenshot 2 — Analyze: Plain English Result
**Screen to capture:** Analyze tool — result view with a completed analysis of a sample document (e.g., lease or job offer letter)
**Content requirements:**
- Plain-English summary visible at the top
- At least one section expanded (e.g., "Key Terms" or "What You Should Know")
- Result panel should look populated and substantive — not a loading state
- Use a built-in sample document (lease or medical form work well here)
**Caption overlay:** `Plain English — not legal jargon`
**Purpose:** Demonstrates the core product promise. Shows the output quality.
**Notes:** Crop to the result output area, not the input form. The analysis card format reads best when at least 3–4 sections are visible.

---

### Screenshot 3 — Document Trust Check: Flagged Clause View
**Screen to capture:** Trust Check result — at least 2–3 flagged clauses visible in the risk panel
**Content requirements:**
- A risk/flag panel showing flagged language with short explanations
- Severity indicators (color-coded) visible if present
- Use the built-in sample or a freelance contract with known one-sided clauses
**Caption overlay:** `See what you're really signing`
**Purpose:** Emotionally resonant. Addresses the fear of "what am I missing?" directly.
**Notes:** Pick a demo document with a few genuinely flagged items — a clean all-green result is a poor screenshot for this slot.

---

### Screenshot 4 — Contract Review: Clause Breakdown
**Screen to capture:** Contract Review result — clause-by-clause breakdown with risk categories visible
**Content requirements:**
- Multiple clauses listed with labels (Standard / Unusual / Missing / Negotiate)
- At least one clause expanded or highlighted
- Fairness or risk score panel if visible
**Caption overlay:** `Know before you sign`
**Purpose:** Shows depth of analysis for people receiving professional contracts.

---

### Screenshot 5 — Clause Extractor: Structured Output
**Screen to capture:** Clause Extractor result — organized list of extracted clauses, dates, obligations, and parties
**Content requirements:**
- Structured list view showing clause categories (e.g., Termination, Payment, Liability)
- Key dates and parties sections visible
- Use a multi-clause contract (service agreement or NDA) for rich output
**Caption overlay:** `Every clause. Every obligation. Found.`
**Purpose:** Differentiates PlainPath from basic "summarize my document" tools. Appeals to professional users.

---

### Screenshot 6 — Compare Versions: Diff View
**Screen to capture:** Compare Versions result — two document versions compared with changes highlighted
**Content requirements:**
- Visible diff output: additions, removals, or changed sections labeled
- Plain-English explanation of what the changes mean, if shown
- Use two versions of a lease or contract with a few meaningful changes
**Caption overlay:** `See exactly what changed`
**Purpose:** High-value differentiator. Appeals to anyone renegotiating contracts or tracking redlines.

---

### Screenshot 7 — Redact: PII Detection List
**Screen to capture:** Redact tool — detection results screen showing grouped PII items found
**Content requirements:**
- Grouped detection categories (Names, Account Numbers, Emails, etc.)
- Item count badges visible per group
- Use the built-in "Personal Info Letter" or "Freelance Contract" sample — never a real document with real PII
- Detection checkboxes or review state visible
**Caption overlay:** `Find and remove sensitive info`
**Purpose:** Clear privacy-focused value prop. Addresses data protection anxiety.
**Notes:** The Redact tool has 3 built-in sample documents. Use one of them for this shot.

---

### Screenshot 8 — Digital Signature: Signing Flow
**Screen to capture:** Digital Signature tool — the active signing/e-signature view
**Content requirements:**
- Signature placement UI visible (draw or type signature)
- Document being signed in the background
- Status or progress indicator if present
- Do not show real recipient email addresses
**Caption overlay:** `Sign anything. Legally. Instantly.`
**Purpose:** Shows the full tool breadth — PlainPath handles both analysis AND execution. Closes the loop.
**Notes:** If the Dropbox Sign iframe embed is prominent, ensure the PlainPath chrome is still visible in frame.

---

### Recommended Shot Order for Submission

| Order | Shot | Reason |
|---|---|---|
| 1 | Tool Grid (all 8) | Establishes scope immediately |
| 2 | Analyze result | Core tool — most-used, clearest value |
| 3 | Trust Check flags | Emotional hook — "what am I missing?" |
| 4 | Contract Review | Depth and professionalism |
| 5 | Redact detection | Privacy value prop |
| 6 | Digital Signature | Shows full workflow capability |
| 7 | Clause Extractor | Pro differentiator |
| 8 | Compare Versions | Power user differentiator |

> For a 6-shot minimum submission: use slots 1–6 above.

---

### App Preview Video Script (updated for 8 tools)

```
0:00–0:03
[Screen: Home, all 8 tool tiles visible]
Caption: "8 tools. Every document."

0:03–0:08
[Screen: User taps Analyze, result loads — plain English summary]
Caption: "Paste any document. Get plain English instantly."

0:08–0:14
[Screen: Trust Check — flagged clause panel with 2–3 items]
Caption: "See what's really in a contract before you sign."

0:14–0:19
[Screen: Clause Extractor — structured clause list]
Caption: "Pull every clause, date, and obligation to the surface."

0:19–0:24
[Screen: Redact — PII list, user selects items]
Caption: "Find sensitive information hidden in any document."

0:24–0:28
[Screen: Digital Signature — signing view]
Caption: "Sign. Send. Done."

0:28–0:30
[Screen: PlainPath logo on warm background]
Caption: "PlainPath — plain English for every document."
```

**Notes:**
- Use real app recordings, not animation or illustration
- Do not show competitor apps or real PII
- Must not show pricing UI (App Store policy)
- Audio is optional — the video must tell the story without sound (auto-muted in store)

---

## B. STORE-SUBMISSION RISK NOTES

Files reviewed:
- `docs/store/07-metadata-pack-final.md` (updated this session)
- `docs/store/02-app-store-listing.md` (updated this session)
- `docs/store/04-store-assets.md`
- `docs/store/01-store-metadata.md`
- `artifacts/plainpath-marketing/src/pages/Home.tsx`

---

### Risk 1 — "Processed and discarded" privacy claim
**Location:** All store descriptions (Privacy By Design section)
**Current wording:** "Your documents are processed to generate your analysis and then discarded."
**Risk:** This is accurate for Analyze and other stateless tools, but Pro workspace tools (Document Builder, Compare Versions, Clause Extractor) do store session data. The current description is now partially incomplete.
**Required fix before submission:** Existing description in `07-metadata-pack-final.md` has already been updated with a carve-out: "Pro workspace tools store working data only for your active session — you can delete it at any time." Confirm this is accurate with the actual product behavior before submission.
**Severity:** Medium. Not a rejection risk on its own, but could create user-trust issues if claims don't match behavior.

---

### Risk 2 — Dropbox Sign third-party disclosure
**Location:** All store descriptions (Privacy By Design), Data Safety section
**Current state:** `07-metadata-pack-final.md` now discloses "Dropbox Sign for e-signature workflows" in the privacy section.
**Risk:** Google Play's Data Safety section requires explicit declaration of third-party libraries that share data. Dropbox Sign sends document and signature data to Hellosign Inc. (Dropbox's legal entity). This must be declared.
**Required fix before submission:** In the Play Store Data Safety section, add a row for "Signature data — shared with Dropbox Sign (Hellosign Inc.) for e-signature workflow." The updated `07-metadata-pack-final.md` Data Safety table now includes this row.
**Apple note:** App Store privacy nutrition labels should also list Dropbox Sign data under "Data Linked to You → Contact Info" and "Data Used to Track You → None."
**Severity:** High. Google Play will reject submissions with undisclosed data-sharing.

---

### Risk 3 — OpenAI data disclosure
**Location:** All descriptions, Data Safety section
**Current state:** Description says "PlainPath uses OpenAI to power document analysis." Play Store Data Safety table includes document text with "(OpenAI — transient)" notation.
**Risk:** OpenAI receives document text transiently for analysis. This is a third-party data share, even if temporary, and must be declared in both stores' privacy tooling.
**Required fix before submission:** Ensure Privacy Policy at plainpathapp.com/privacy explicitly names OpenAI as a sub-processor. Confirm API calls use the correct OpenAI data-retention API settings (zero data retention if possible). Confirm this matches what the Privacy Policy states.
**Severity:** Medium-High. Omitting AI sub-processor disclosure is increasingly scrutinized by both stores.

---

### Risk 4 — "Without a lawyer" positioning
**Location:** Opening line of all store descriptions: "PlainPath turns complex documents into plain English — instantly, privately, and without a lawyer."
**Risk:** Both stores generally allow productivity apps that assist with legal documents, but the phrase "without a lawyer" could draw additional scrutiny from reviewers who interpret it as legal advice positioning.
**Required fix before submission:** Consider adding a short disclaimer at the end of the description: "PlainPath does not provide legal advice. For legal matters, consult a qualified attorney." This is standard practice for this category and reduces rejection risk to near zero.
**Severity:** Low-Medium. Most document-analysis apps pass with this language, but a one-line disclaimer removes the risk entirely.

---

### Risk 5 — Screenshot: pricing UI
**Location:** App UI — the Upgrade page shows pricing ($4.99, $19.99)
**Risk:** Both stores prohibit pricing UI in screenshots and app preview videos. If any screenshot accidentally captures the Upgrade/pricing page or a plan upsell modal, it will be flagged.
**Required fix before submission:** Ensure all screenshots are captured with a fully subscribed Pro test account or with the Upgrade/pricing UI not visible. Review all 8 shots before submission.
**Severity:** Medium. A submission rejection for this is easy to fix but delays approval.

---

### Risk 6 — "Coming Soon" language in screenshots
**Location:** `docs/store/04-store-assets.md` — screenshot note still references "Digital Signature Coming Soon card"
**Risk:** Digital Signature is now live. If any screenshot captures a "Coming Soon" badge on the Digital Signature card, reviewers may flag the product as misrepresenting its feature set.
**Required fix before submission:** Confirm the Digital Signature tool card in the live app no longer shows a "Coming Soon" badge. Update `04-store-assets.md` note accordingly.
**Severity:** Low. But must be verified before screenshot capture.

---

### Risk 7 — Web-specific language in descriptions
**Location:** Descriptions reference "Paste or upload any document" — the word "upload" implies file upload, which on mobile requires native file pickers (not web file input).
**Risk:** If the native app uses a Capacitor-wrapped web file input that doesn't properly trigger the native document picker, the behavior won't match the description.
**Required fix before submission:** Confirm the native Capacitor build properly invokes the iOS/Android document picker for file upload. If using `@capacitor/filesystem` or similar, test on a physical device. If text-paste-only is the native behavior, update wording to "Paste or import any document."
**Severity:** Medium. Functional mismatch between description and app behavior is a common rejection reason.

---

## C. ASSET / READINESS CHECKLIST

### What already exists

| Asset | Status | Location |
|---|---|---|
| Store metadata pack (App Store) | Current — updated April 2026 | `docs/store/07-metadata-pack-final.md` |
| Store metadata pack (Play Store) | Current — updated April 2026 | `docs/store/07-metadata-pack-final.md` |
| App Store listing copy | Current — updated April 2026 | `docs/store/02-app-store-listing.md` |
| Play Store listing copy | Needs update for 8 tools | `docs/store/03-play-store-listing.md` |
| App icon design brief | Done | `docs/store/04-store-assets.md` |
| Screenshot plan (8 tools) | Current — this document | `docs/store/08-phase3-store-prep.md` |
| Screenshot captions | Current — this document | `docs/store/07-metadata-pack-final.md` Section 4 |
| Feature graphic design brief | Done (needs caption update) | `docs/store/04-store-assets.md` |
| App preview video script (8 tools) | Current — this document | Above, Section A |
| RevenueCat config | Done | `docs/store/05-revenuecat-config.md` |
| Native packaging checklist | Done | `docs/store/06-native-packaging-checklist.md` |
| Privacy Policy URL | Live | https://plainpathapp.com/privacy |
| Terms URL | Live | https://plainpathapp.com/terms |
| Support URL | Live | https://plainpathapp.com/support |
| Marketing URL | Live | https://plainpathapp.com |

---

### What still needs to be produced

| Asset | Priority | Notes |
|---|---|---|
| App icon (1024×1024 PNG, no alpha) | Required | Design brief exists in `04-store-assets.md`. Needs actual graphic production. |
| App icon (512×512 PNG for Play) | Required | Same design, different size |
| iPhone 16 Pro Max screenshots (×6–8) | Required | Capture from live app per plan above. 1320×2868 px each. |
| Android phone screenshots (×2–8) | Required | Same screens, 1080×1920 px. |
| Feature graphic (1024×500 PNG) | Required for Play | Design brief exists. Needs actual graphic production. |
| App icon variants (home screen @2x, @3x) | Required | Derived from 1024×1024 master |
| Android adaptive icon layers | Required | Foreground + background PNG layers |
| App preview video (30s .mov) | Recommended | Script above. Screen recordings on physical device. |
| YouTube promo video (60s, 16:9) | Recommended for Play | Script in `04-store-assets.md` (update for 8 tools) |
| Test account credentials | Required | Add to review notes before submission |
| App Store Connect account | Required before iOS | $99/year Apple Developer Program |
| Google Play Console account | Required before Android | $25 one-time fee |
| RevenueCat project configured | Required before either | See `05-revenuecat-config.md` |
| In-app purchases created in stores | Required before either | Product IDs defined in `07-metadata-pack-final.md` |
| Apple Small Business Program enrollment | Strongly recommended | Reduces Apple cut from 30% → 15% |
| `03-play-store-listing.md` update | Low | Update from 5 tools to 8 tools |
| `04-store-assets.md` update | Low | Remove "Digital Signature Coming Soon" note; update feature graphic subline |
| Legal advice disclaimer in descriptions | Recommended | One line at end of each description |
| Privacy Policy: OpenAI/Dropbox Sign sub-processor disclosure | Required | Confirm before submission |

---

### Suggested production order

1. App icon (blocks everything — must exist before creating screenshots that show the home screen)
2. Screenshots (6 minimum, capture in one session on a Pro test account)
3. Feature graphic for Play Store (quick to produce once icon exists)
4. App preview video (if pursuing — requires physical device recordings)
5. Store accounts and in-app purchase configuration
6. Submit to TestFlight / internal testing track
7. Submit for review

---

## D. STABILITY STATEMENT

No live application, authentication, billing, domain, or entitlement logic was changed during this Phase 3 session.

Changes made:
- `docs/store/07-metadata-pack-final.md` — fully rewritten to reflect 8 tools, $19.99 Pro, correct annual pricing, updated Data Safety table with Dropbox Sign and OpenAI disclosures, updated IAP product prices, updated screenshot plan and captions
- `docs/store/02-app-store-listing.md` — rewritten to reflect 8 tools, $19.99 Pro, updated screenshot plan, updated review notes
- `docs/store/08-phase3-store-prep.md` — created (this document)

All changes are documentation only.
The web app, API server, database, Clerk configuration, Stripe webhook logic, and live entitlement logic are unchanged and remain stable.
