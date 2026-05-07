# PlainPath — Post-Launch Roadmap
**Version:** 1.0  
**Last updated:** May 7, 2026  
**Current status:** v1.0 — two-tool launch locked

---

## Guiding Principle

Every feature unlock is earned, not scheduled. The roadmap phases below represent the intended order and logical grouping, but each phase is gated behind real-world validation from the previous phase. No hidden tool is unlocked without completing its gate criteria.

**The unlock gate is:**
1. 30+ days of production usage data on the current live tool set
2. Customer feedback reviewed (support, NPS, direct contact)
3. E2E spec written and passing (minimum 15 tests) for the new tool
4. All surfaces updated: dashboard, pricing, marketing, app store metadata, privacy policy
5. Hidden tool enforcement re-verified after unlock (all remaining hidden tools still pass)
6. Production build passes with no regressions

---

## v1.0 — Launch (Current — May 2026)

**Tools live:**
- Analyze a Document
- Contract Review

**Supporting infrastructure:**
- PlainPath Pro subscription ($19.99/month, Stripe)
- Clerk authentication
- Saved analysis history (My Analyses)
- Shareable links (30-day TTL)
- Document demo
- Free tier with usage metering
- Deadline email reminders
- Static guide pages (7 guides)
- Marketing site

**Remaining pre-launch tasks:**
- App Store screenshots captured (two-tool scope)
- Apple App Store Connect submission
- Google Play Console submission
- Stripe billing mode switched from test → live
- Production ADMIN_EMAILS and STRIPE_WEBHOOK_SECRET set

---

## v1.1 — Trust Check (est. 6–8 weeks post-launch)

**New tool:** Document Trust Check

**What it does:**  
User uploads or pastes a suspicious document. PlainPath scans for scam indicators, pressure tactics, suspicious payment demands, and verifiable claims. Returns an Authenticity Risk score, Document Risk score, and Verification Confidence score with red flags explicitly called out.

**Target use case:**  
"Is this job offer / prize notice / government letter / payment demand legitimate?"

**Gate criteria:**
- [ ] 30 days of production Analyze + Contract Review usage
- [ ] Trust Check E2E spec written (minimum 15 tests, all passing)
- [ ] Dashboard TOOLS array updated (third card added)
- [ ] Marketing site ToolsShowcase updated
- [ ] Pricing copy updated to include Trust Check
- [ ] App Store metadata updated
- [ ] Privacy policy updated (removes "coming in future updates" qualifier for Trust Check)
- [ ] All existing 116+ tests still pass after unlock

**Codebase status:** Complete (hidden). No implementation work required — only unlock and copy updates.

**Pricing impact:** Include in Pro tier at current price (no price change at this phase).

---

## v1.2 — Redact Sensitive Info (est. 10–12 weeks post-launch)

**New tool:** Redact Sensitive Info

**What it does:**  
User uploads or pastes a document. PlainPath detects PII across 14 categories (names, SSNs, account numbers, phone numbers, addresses, etc.). User selects which items to redact with per-item approval. Exports a redacted copy as plain text or PDF.

**Target use case:**  
"I need to share this document (lease, employment file, medical record) but want to remove personal information first."

**Gate criteria:**
- [ ] v1.1 gate completed and Trust Check live for 30+ days
- [ ] Redact E2E spec written (minimum 15 tests)
- [ ] PDF redaction export tested end-to-end
- [ ] Dashboard, marketing, pricing, app store, privacy policy all updated
- [ ] Full regression suite passes

**Codebase status:** Complete (hidden). `PiiReview.tsx`, `PdfRedactViewer.tsx`, `piiDetection` route, and `piiTypes.ts` are all implemented.

**Pricing impact:** Evaluate whether to include in Pro at current price or introduce a higher tier. Decision must be made before unlock.

---

## v1.3 — Clause Extractor (est. 14–16 weeks post-launch)

**New tool:** Clause Extractor

**What it does:**  
User uploads a contract or long document. PlainPath extracts individual clauses, classifies them (Indemnification, Termination, Payment, Confidentiality, etc.), and provides clause-level "Questions to Ask" guidance. Results saved to server (not device-only) so users can revisit and export.

**Target use case:**  
"I have a long contract and I want to see all the payment clauses / termination clauses in one place with guidance on what to ask about each."

**Gate criteria:**
- [ ] v1.2 gate completed and Redact live for 30+ days
- [ ] Clause Extractor E2E spec written (minimum 15 tests)
- [ ] Server-side persistence tested (clause results stored in DB, not localStorage)
- [ ] Privacy policy updated to remove "coming in future updates" qualifier for Clause Extractor
- [ ] Dashboard, marketing, pricing, app store all updated
- [ ] Full regression suite passes

**Codebase status:** Complete (hidden). `ClauseExtractor.tsx`, `clauseExtractorApi.ts`, `clauseExtractorTypes.ts`, and API routes are implemented.

**Data model impact:** Clause Extractor results stored server-side (already in schema — no migration needed at unlock).

---

## v1.4 — Compare Versions (est. 18–20 weeks post-launch)

**New tool:** Compare Versions

**What it does:**  
User uploads or pastes two versions of a document. PlainPath generates a clause-by-clause diff: what was added, what was removed, what changed in meaning. Results grouped by change type and stored server-side for cross-session access.

**Target use case:**  
"My landlord sent me a revised lease — I need to know exactly what changed from the first version."

**Gate criteria:**
- [ ] v1.3 gate completed and Clause Extractor live for 30+ days
- [ ] Compare Versions E2E spec written (minimum 15 tests)
- [ ] Two-document upload flow tested
- [ ] Server-side session persistence tested
- [ ] Privacy policy updated (removes "coming in future updates" for Compare Versions)
- [ ] Dashboard, marketing, pricing, app store all updated
- [ ] Full regression suite passes

**Codebase status:** Complete (hidden). `CompareVersions.tsx`, `CompareVersionsSession.tsx`, `compareVersionsEngine.ts`, `compareVersionsApi.ts`, and API routes are implemented.

---

## v1.5 — Ask This Document (est. 22–26 weeks post-launch)

**New tool:** Ask This Document

**What it does:**  
User uploads a document, then asks natural-language questions about it. PlainPath answers directly from the document text, citing the relevant section. Conversational interface for clauses, deadlines, obligations, risks.

**Target use case:**  
"Does this contract require me to give 30 days' notice to terminate?" "Who is responsible for repairs under this lease?"

**Gate criteria:**
- [ ] v1.4 gate completed
- [ ] Ask This Document E2E spec written (minimum 15 tests)
- [ ] Conversational context management tested across multiple turns
- [ ] Document upload persistence strategy finalized (current state: session-only)
- [ ] Dashboard, marketing, pricing, app store, privacy policy all updated
- [ ] Full regression suite passes

**Codebase status:** Partial (hidden). `AskDocument.tsx` page exists. API route implementation status: to be assessed at gate entry.

---

## v2.0 — Builder + Packet Compiler (est. 9–12 months post-launch)

**New tools:** Contract Builder + Document Packet Compiler

### Contract Builder

**What it does:**  
Guided 6-step intake wizard: who, what, how much, when, and dispute resolution. Generates a complete, clause-by-clause AI-drafted contract. Five contract types at launch: Freelance Agreement, NDA, Payment Agreement, Service Agreement, Lease Agreement. Export as PDF. Drafts stored server-side.

**Target use case:**  
"I need a contract for a freelance project and I don't have a lawyer."

**Codebase status:** Complete (hidden). `builder/` route folder and all builder components are implemented. Feature flag controlled by `BUILDER_ENABLED` env var.

### Document Packet Compiler

**What it does:**  
Multi-document filing assistant. User describes a situation requiring multiple documents (e.g., applying for a permit, responding to an eviction, setting up a business). PlainPath generates a packet of related documents in the correct order.

**Codebase status:** Not built.

**Gate criteria (v2.0 combined gate):**
- [ ] All v1.x tools live and stable for 60+ days
- [ ] Contract Builder E2E spec written (minimum 20 tests including full wizard flow)
- [ ] Builder feature flag (`BUILDER_ENABLED`) enabled for Pro tier
- [ ] Contract types fully tested (all 5 types generate valid output)
- [ ] Packet Compiler: design doc written, API contract defined, E2E spec planned
- [ ] Team plan pricing evaluated and decided
- [ ] Dashboard, marketing, pricing, app store, privacy policy all updated
- [ ] Full regression suite passes

**Pricing impact:** v2.0 is the earliest point to evaluate a higher-tier plan or per-use pricing for Builder and Packet Compiler.

---

## Infrastructure Roadmap

These items are independent of tool unlocks but should be sequenced in parallel.

| Item | Target phase | Priority | Notes |
|---|---|---|---|
| Code-split large JS bundle (1.8MB chunk) | v1.1 | Medium | Rollup warning at build — performance improvement |
| Stripe live mode activated | v1.0 (pre-launch) | Critical | Currently in test mode |
| STRIPE_WEBHOOK_SECRET set in production | v1.0 (pre-launch) | Critical | Required for webhook verification |
| TypeScript strict mode cleanup | v1.1 | Low | Pre-existing errors in hidden pages |
| Native IAP (Apple/Google) | v1.2–v1.3 | Medium | Current: web-only billing |
| Team plan implementation | v2.0 | Low | Not needed until Builder |
| Usage analytics dashboard (internal) | v1.1 | Medium | Needed to make gate decisions |
| RESEND_API_KEY configured | v1.0 (pre-launch) | Medium | Deadline reminders require this |

---

## Phase Summary Table

| Phase | Tool(s) | Est. Timeline | Gate Entry Requirement |
|---|---|---|---|
| v1.0 | Analyze + Contract Review | **Now (launched)** | — |
| v1.1 | + Trust Check | 6–8 weeks post-launch | 30 days v1.0 usage |
| v1.2 | + Redact | 10–12 weeks post-launch | 30 days v1.1 live |
| v1.3 | + Clause Extractor | 14–16 weeks post-launch | 30 days v1.2 live |
| v1.4 | + Compare Versions | 18–20 weeks post-launch | 30 days v1.3 live |
| v1.5 | + Ask This Document | 22–26 weeks post-launch | 30 days v1.4 live |
| v2.0 | + Builder + Packet Compiler | 9–12 months post-launch | All v1.x live + 60 days stable |

---

## What Must Never Change Without a Gate Review

The following decisions are locked for v1.0 and may not be changed without completing a formal gate review (documenting usage data, E2E results, copy updates, and a dated decision entry in this file):

- Which tools are visible in the dashboard
- Which tools are claimed as available in marketing copy
- Which tools are listed in the pricing plan features
- Which tools are described in App Store metadata
- The $19.99/month Pro plan price
- The plan structure (free + pro — no new plans until v2.0 gate)
- The database schema
- The auth flow (Clerk-based)
