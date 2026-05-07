# PlainPath — v1.0 Launch Scope
**Version:** 1.0  
**Last updated:** May 7, 2026  
**Decision status:** LOCKED

---

## Launch Decision

PlainPath v1.0 launches with **exactly two tools**:

1. **Analyze a Document**
2. **Contract Review**

This is not a temporary technical limitation. It is a deliberate product decision. Launching a focused, well-tested, well-marketed two-tool product is the correct v1.0 strategy. Each additional tool will be unlocked only after the previous one has been validated with real users in production.

---

## Live Tools

### Tool 1: Analyze a Document

**What it does:**  
User uploads a PDF, DOCX, or TXT file, or pastes text directly. PlainPath reads the full document and returns a structured action plan:
- Prioritized action steps
- Required documents to gather
- Key deadlines extracted from the fine print
- Risks flagged by severity (High / Medium / Watch-Out)
- Plain-English explanations of important terms
- Source section references so users can verify every claim

**Who it's for:**  
Anyone with a confusing document they don't know how to act on — IRS notices, lease agreements, HOA letters, school enrollment packets, grant applications, insurance EOBs, court summons.

**Access model:**
- Free tier: limited monthly analyses (usage-metered via localStorage)
- Pro tier ($19.99/month): unlimited analyses, saved history, shareable links

**Routes:**
- `/app/analyze` — upload / paste form
- `/app/results` — analysis result viewer

**API:**
- `POST /api/documents/analyze` — requires auth + pro entitlement

---

### Tool 2: Contract Review

**What it does:**  
User pastes or uploads a contract. PlainPath reads it clause by clause and returns:
- Overall Fairness Score (0–100)
- Clause-by-clause verdict: Watch-Out / Fair
- Before You Sign checklist
- Missing protections the contract lacks
- Negotiation language ready to copy
- Questions to Ask on specific clauses

**Who it's for:**  
Anyone about to sign a contract they didn't write — freelance agreements, NDAs, service agreements, lease contracts, employment offers.

**Access model:**
- Pro tier only ($19.99/month): unlimited reviews

**Routes:**
- `/app/contract-review` — form + results (single-screen flow)

**API:**
- `POST /api/contracts/review` — requires auth + pro entitlement

---

## Hidden Tools (Post-Launch Only)

The following tools exist in the codebase in various states of completeness. They are hidden from all user-visible surfaces and must remain hidden until the post-launch gate criteria are met for each.

| Tool | Codebase Status | User Visibility | Launch Gate |
|---|---|---|---|
| Trust Check | Complete (hidden) | Hidden everywhere | Post v1.0 |
| Redact Sensitive Info | Complete (hidden) | Hidden everywhere | Post v1.0 |
| Clause Extractor | Complete (hidden) | Hidden everywhere | Post v1.1+ |
| Compare Versions | Complete (hidden) | Hidden everywhere | Post v1.1+ |
| Ask This Document | Partial (hidden) | Hidden everywhere | Post v1.2+ |
| Contract Builder | Complete (hidden) | Hidden everywhere | Post v2.0 |
| Completion Engine Phase 3 | Not built | N/A | Post v2.0 |
| Document Packet Compiler | Not built | N/A | Post v2.0 |

### What "hidden" means — enforcement checklist

For a tool to be properly hidden, all of the following must be true:

- [ ] Not in dashboard `TOOLS` array (no card rendered on Home.tsx)
- [ ] Route redirects to `/` or `/` equivalent in App.tsx router
- [ ] Not listed in `pricingData.ts` feature list
- [ ] Not listed in `Upgrade.tsx` included features
- [ ] Not listed in `PricingSection.tsx` feature list
- [ ] Not listed in marketing site `ToolsShowcase.tsx`
- [ ] Not claimed as available in marketing site copy
- [ ] Demo route (if any) redirects to `/demo`
- [ ] API route protected by `requireEntitlement` middleware (server-side)
- [ ] E2E test confirms hidden tool route is inaccessible to unauthenticated users

**Current status:** All hidden tools pass all checks above. Verified by `hidden-tools.spec.ts` (15/15 tests passing).

---

## What Users See at Launch

### Dashboard (Home.tsx)
Two tool cards only:
- **Analyze a Document** — free + pro
- **Contract Review** — pro only

No other tool cards are rendered. The dashboard TOOLS array is the single source of truth.

### Marketing site
- "2 tools available now"
- Tool grid: Analyze + Contract Review only
- Pricing: "Both tools included — Analyze a Document and Contract Review"
- FAQ: "Both tools — Analyze a Document and Contract Review — are available with PlainPath Pro"

### Pricing page (app)
- One plan: PlainPath Pro at $19.99/month
- Features listed: Analyze a Document, Contract Review, Plain-English summary, Key terms/deadlines/risks, Saved history, Export and share
- No mention of any hidden tool as included

### Upgrade page
- "Both tools included — Analyze a Document and Contract Review. Cancel anytime."
- "All tools available at $19.99/month — both Analyze a Document and Contract Review included."

### App Store listing
- Two-tool full description (Analyze + Contract Review)
- Two-tool reviewer notes
- Two-tool screenshot plan
- No mention of Trust Check, Contract Builder, or any hidden tool

### Privacy policy
- Hidden tools (Clause Extractor, Compare Versions, Document Builder) labeled as "coming in future updates" — not described as currently active

---

## Subscription Model

| Plan | Price | Tools included | Free trial |
|---|---|---|---|
| Free | $0/month | Usage-metered access | N/A (is the free tier) |
| PlainPath Pro | $19.99/month | Analyze + Contract Review | No |

- Subscriptions managed via Stripe hosted checkout
- Billing portal available via Stripe customer portal
- No in-app purchases (native IAP not supported at launch)
- iOS/Android app manages subscriptions through web at plainpathapp.com

---

## Hard Launch Restrictions

These restrictions are in force until explicitly lifted by the post-launch gate process.

| Restriction | Reason |
|---|---|
| Do not unlock Clause Extractor | Post-launch gate not completed |
| Do not unlock Compare Versions | Post-launch gate not completed |
| Do not unlock Trust Check | Post-launch gate not completed |
| Do not unlock Redact | Post-launch gate not completed |
| Do not unlock Ask This Document | Post-launch gate not completed |
| Do not unlock Builder | Post-launch gate not completed |
| Do not add new tools | Out of scope |
| Do not modify database schema | Schema is launch-locked |
| Do not change pricing amounts | Pricing is launch-locked |
| Do not change billing structure | Billing is launch-locked |
| Do not redesign auth | Auth is launch-locked |
| Do not redesign UI | UI is launch-locked |
| Do not build Completion Engine Phase 3 | Not in v1.0 scope |
| Do not build Document Packet Compiler | Not in v1.0 scope |

---

## Future Tool Unlock Gate Process

Before any hidden tool can be unlocked, the following gate criteria must all be satisfied:

1. **Customer usage data exists** — at least 30 days of production usage on the prior tool(s)
2. **User feedback reviewed** — NPS or direct feedback on current tool set
3. **E2E coverage** — new tool has a dedicated E2E spec with at least 15 tests passing
4. **Copy updated** — dashboard, pricing, marketing, app store, and privacy policy all updated for the new tool
5. **API security reviewed** — new tool's API route passes entitlement enforcement test
6. **Build verified** — production build passes with no regressions
7. **Hidden tool enforcement verified** — all remaining hidden tools still pass the enforcement checklist

Unlock decisions must be recorded in this document as a dated entry.
