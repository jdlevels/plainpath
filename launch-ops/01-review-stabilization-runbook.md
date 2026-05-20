# PlainPath — Review & Stabilization Runbook

**Phase:** Gate 14 (Final Submission Audit) → Gate 15 (Review/Launch Handling) → Gate 16 (Stabilization)
**Current status:** Submitted / In Review
**Rules:** No new features. No redesigns. No architecture changes. Review blockers, compliance fixes, and stability fixes only.

---

## Part 1 — While In Review

### 1.1 Daily monitoring tasks

| Task | Where | Frequency |
|---|---|---|
| Check review status | App Store Connect → My Apps → PlainPath → App Review | Daily |
| Check TestFlight crash logs | App Store Connect → TestFlight → Crashes | Daily |
| Check API server error rate | Deployment logs | Daily |
| Check RevenueCat dashboard for failed purchase attempts | dashboard.revenuecat.com | Daily |

### 1.2 Review status definitions

| Status | Meaning | Action |
|---|---|---|
| In Review | Apple reviewer is actively testing the app | Monitor; prepare rejection response library |
| Waiting for Review | Queued; not yet assigned to a reviewer | No action needed |
| Metadata Rejected | Submission form issue (not the binary) | Fix metadata only; no new build required |
| Rejected | Binary rejected; reason given in Resolution Center | See Part 3 (App Review Response Library) |
| Ready for Sale | Approved; released or pending manual release | Execute Part 2 (Launch Day) |

### 1.3 What to do if you receive a rejection

1. Read the rejection reason in Resolution Center carefully — do not assume.
2. Identify whether the rejection is: (a) a binary issue requiring a new build, (b) a metadata issue fixable without a new build, or (c) a clarification request that can be answered via message.
3. Log the rejection in `launch-ops/99-rejection-log.md` with: date, rejection code, reason text, root cause, fix plan.
4. Never resubmit without fully resolving the stated reason. Partial fixes cause re-rejection.
5. Use the App Review Response Library (document 03) for common rejection types.

---

## Part 2 — Launch Day Sequence

Execute these steps in order after "Ready for Sale" appears.

### Step 1 — Confirm release type
- If set to "Manual Release": go to App Store Connect → Pricing and Availability → Release this Version → Confirm.
- If set to "Automatic after approval": the app is already live. Proceed to Step 2.

### Step 2 — Verify production environment (run smoke test — see document 05)
Execute every item in the launch-day smoke test checklist before announcing.

### Step 3 — Confirm allowlist is resolved
Before announcing, verify that real external users can complete sign-up → tool use → subscription. See Blocker 1 in `00-CRITICAL-LAUNCH-BLOCKERS.md`.

### Step 4 — Confirm RevenueCat purchase works end-to-end
- Sign in with a Sandbox Apple ID on a real device.
- Tap Subscribe, complete the purchase.
- Verify RevenueCat shows the new subscriber.
- Verify the app unlocks tools after purchase.

### Step 5 — Monitor for the first 2 hours
- Keep App Store Connect Crashes tab open.
- Keep API deployment logs open.
- Keep RevenueCat dashboard open.
- Watch for any spike in 4xx or 5xx errors from the API.

### Step 6 — Announce
Only announce after Step 5 shows no critical errors.

---

## Part 3 — Stabilization Phase Rules

During Gate 16 (Stabilization), the only changes permitted are:

| Allowed | Not Allowed |
|---|---|
| Crash fixes with a reproduction path | New features |
| Subscription purchase flow fixes | UI redesigns |
| Privacy compliance corrections | New tools or screens |
| App Store metadata corrections | Architecture refactors |
| Review rejection responses | Dependency upgrades (unless required for a fix) |
| Allowlist configuration fix | Experimental code |

Any proposed change that does not fit the "Allowed" column requires promotion to the Expansion planning phase. Document it and defer it.

---

## Part 4 — Reviewer Credentials

Apple reviewers must be able to sign in and access core features to evaluate the app. If PlainPath receives a rejection citing inability to test functionality, this section provides the response.

### Test Account for Apple Review

```
Email:    support@plainpathapp.com
Password: [SET BEFORE SUBMISSION — stored in secure password manager, not in this file]
Plan:     Admin (bypasses subscription paywall; all tools unlocked)
```

### What the reviewer account can do
- Sign in without needing to create a new account
- Access both Analyze a Document and Contract Review without a subscription
- Upload a sample PDF and receive a full analysis result
- Save and view analyses in My Analyses
- Access Privacy Policy at /privacy and Terms at /terms

### Sample test document for reviewer
Suggest the reviewer upload any standard PDF — a lease agreement, terms of service, or employment letter. The app accepts any text-based PDF or DOCX. A suitable public-domain sample:
- Download any sample contract PDF from a search for "sample lease agreement PDF"
- Any multi-page text document works

### Reviewer walkthrough steps to include in review notes
```
1. Sign in using the credentials above.
2. Tap "Analyze a Document" from the home screen.
3. Tap the upload area and select any PDF from your Files app.
4. Wait up to 30 seconds for the analysis to complete.
5. Review the plain-English action plan, key dates, and risk flags.
6. Tap "Save" to save the analysis to My Analyses.
7. Tap the back arrow and tap "Contract Review" from the home screen.
8. Upload the same or a different contract PDF.
9. Review the contract risk assessment result.
10. Tap your avatar → Billing to see the subscription management screen.
```

---

## Part 5 — Known-Risk Section

These are the known risks that could lead to rejection or instability. Each has a mitigation noted.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Allowlist blocks reviewer's email | High if not resolved | P0 — App appears broken to reviewer | Resolve per `00-CRITICAL-LAUNCH-BLOCKERS.md` Blocker 1 before review |
| Reviewer cannot complete purchase (IAP not approved) | Medium | P1 — Subscription flow fails | Verify `plainpath_pro_monthly` is Approved in App Store Connect |
| AI response timeout during review session | Low | P1 — Analysis fails mid-review | OpenAI p95 latency is typically < 15s; reviewer should wait 30s before considering it a failure |
| Privacy policy URL temporarily unreachable | Low | P0 — Immediate rejection risk | Monitor `https://plain-path.replit.app/privacy` daily during review |
| `/paywall-preview` flagged as hidden feature | Very Low | P2 — Reviewer may ask about it | Route serves the subscription UI for screenshot purposes; buttons return "Native billing not available on web" — no fake purchase |
| Reviewer tests on iOS version below minimum | Very Low | P1 — UI may not render correctly | Minimum supported iOS version should be declared in App Store Connect |
| Builder routes redirect to `/` without explanation | Very Low | P3 — Reviewer may see a redirect | Expected behavior — these tools are gated by `BUILDER_ENABLED` flag, currently off |

### Risk response rule
If any of these risks materializes into a rejection:
1. Do not resubmit immediately.
2. Identify root cause precisely before attempting a fix.
3. Follow the App Review Response Library (document 03) for the appropriate response.
4. Log in `99-rejection-log.md`.

---

## Part 6 — Contacts and Access

| Resource | Location |
|---|---|
| App Store Connect | appstoreconnect.apple.com |
| RevenueCat dashboard | dashboard.revenuecat.com |
| Clerk dashboard | dashboard.clerk.com |
| Stripe dashboard | dashboard.stripe.com |
| API server deployment logs | Replit deployment logs |
| GitHub Actions CI | github.com/jdlevels/plainpath/actions |
| Support email | support@plainpathapp.com |

---

*Document: 01 | Phase: Review & Stabilization | Last updated: May 2026*
