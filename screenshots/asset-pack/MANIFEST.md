# PlainPath Screenshot Asset Pack — Manifest
**Produced:** April 22, 2026 | **Resolution:** 1440×900 | **Format:** JPEG

---

## CAPTURED SCREENSHOTS

### A. Marketing Surfaces

| # | Filename | Surface | Demonstrates | Launch Deck | Store Listing |
|---|----------|---------|--------------|-------------|---------------|
| 1 | `marketing-01-hero.jpeg` | Hero section | Full-page hero — headline "Stop guessing what your documents mean", 8 canonical tool pills, phone mockup with Lease Agreement demo, "Get the App" CTA | **YES** | **YES** |
| 2 | `marketing-02-covered.jpeg` | "Every document situation, covered" | "8 TOOLS LIVE" label, 3 premium feature cards visible (Analyze a Document, Document Trust Check, Contract Review) with real action examples and document type tags | **YES** | **YES** |
| 3 | `marketing-03-see-it-in-action.jpeg` | Video Walkthrough | "See PlainPath in action" on dark cinematic background, "8 TOOLS · LIVE DEMO" badge, animated app demo showing Analyze workflow with document preview and analysis panel | **YES** | **YES** |
| 4 | `marketing-04-live-demos.jpeg` | Live Demos section | "Real scenarios — pre-loaded and ready to run" heading, 5 demo cards (Analyze, Trust Check, Build a Contract, Contract Review, Redact) with real document names, outcome badges, and CTAs | **YES** | **YES** |
| 5 | `marketing-05-common-documents.jpeg` | Document Situations | "Documents people bring to PlainPath" — 8 document type cards (Lease, Job offer, Medical bill, Gov't letter, Payment demand, Freelance contract, Utility shutoff, Sensitive info) each with canonical tool CTA | **YES** | **YES** |
| 6 | `marketing-06-faq.jpeg` | FAQ section | "Questions we hear a lot" — 8 FAQ questions visible (collapsed accordion), clean and trustworthy | **YES** | NO — collapsed state not informative enough for store |
| 7 | `marketing-07-pricing.jpeg` | Pricing | "Honest pricing. No surprises." — Attorney vs. PlainPath comparison, $4.99 Starter vs. $300–600 attorney cost visible, Lease Agreement selected | **YES** | **YES** |

---

### B. Authenticated App Surfaces — CAPTURED

| # | Filename | Surface | Demonstrates | Launch Deck | Store Listing |
|---|----------|---------|--------------|-------------|---------------|
| 8 | `app-02-my-documents.jpeg` | My Documents | 4-section My Documents page (My Contracts, My Analyses, Signed Docs, PDF Sessions) with compact empty states and section-specific CTAs — shows post-login product structure | **YES** | YES (with caption) |

---

### C. Optional / Session Shots — CAPTURED

| # | Filename | Surface | Demonstrates | Launch Deck | Store Listing |
|---|----------|---------|--------------|-------------|---------------|
| 9 | `optional-01-analyze-session.jpeg` | Analyze a Document session | Full authenticated Analyze session — document preview + full Key Terms tab with extracted clause data, real analysis output | **YES** | **YES** |

---

## DEFERRED SCREENSHOTS
*Require an authenticated browser session. All surfaces verified via code audit — correct headings, copy, and empty states confirmed. Re-capture in a logged-in session.*

| Filename | Surface | Why Deferred |
|----------|---------|--------------|
| `app-01-dashboard.jpeg` | Dashboard (8-tool grid) | Auth-gated — redirects to marketing homepage without login |
| `app-03-my-analyses.jpeg` | My Analyses | Auth-gated |
| `app-04-pdf-editor-hub.jpeg` | PDF Editor hub | Auth-gated (Pro) |
| `app-05-compare-versions.jpeg` | Compare Versions hub | Auth-gated (Pro) |
| `app-06-document-builder.jpeg` | Document Builder | Auth-gated + requires `VITE_BUILDER_ENABLED=true` |
| `optional-02-compare-session.jpeg` | Compare Versions session diff view | Auth-gated (Pro) |
| `optional-03-builder-workspace.jpeg` | Document Builder workspace | Auth-gated + BUILDER_ENABLED |

---

## SHORTLISTS

### Top 5 Hero Screenshots
1. **`marketing-01-hero.jpeg`** — Single strongest brand moment. Headline + phone mockup + all 8 tools. Lead every pitch deck, press kit, and landing page.
2. **`marketing-04-live-demos.jpeg`** — Real document names, real outcomes, 5 scenarios. Shows the product is fully loaded and specific.
3. **`optional-01-analyze-session.jpeg`** — Authenticated result view. Real analysis output, Key Terms extracted. The "what you actually get" shot.
4. **`marketing-02-covered.jpeg`** — Premium feature cards with copy samples like "Sign and return the lease addendum before April 22nd." and "High scam risk — 3 fraud signals detected." Specific and credible.
5. **`marketing-07-pricing.jpeg`** — Honest pricing framing with attorney cost comparison. Converts skeptics.

### Best 3 App Proof Screenshots
1. **`optional-01-analyze-session.jpeg`** — Deepest product proof. Authenticated, populated, real output.
2. **`app-02-my-documents.jpeg`** — Shows the organized post-login workspace structure. Proves it's a real product with persistent data.
3. **`marketing-03-see-it-in-action.jpeg`** — App UI visible inside the marketing page — closest to a "dashboard" screenshot available without auth.

---

## DO NOT USE PUBLICLY
- None of the current screenshots contain private real-user data.
- `marketing-06-faq.jpeg` — Collapsed accordion is clean but not informative; fine for reference, not for store listing.
- The `optional-01-analyze-session.jpeg` uses synthetic demo data (Lease_Agreement_Unit4B.pdf) — safe to publish.

---

## CAPTURE NOTES
- All screenshots: 1440×900 viewport, JPEG format (PNG not supported by capture tool)
- Section-specific marketing screenshots use `useLayoutEffect` + `scrollIntoView({ behavior: 'instant' })` via hash anchor — no dev hack, production-safe
- Anchor IDs added to marketing Home.tsx for 3 previously-unnavigable sections: `#walkthrough`, `#common-documents`, `#faq`
- All deferred app screenshots confirmed clean via code audit: correct headings, canonical tool names, appropriate empty states
- PDF Editor naming fixed this session: `PDF Platform` → `PDF Editor` (2 occurrences in PdfEditor.tsx)
