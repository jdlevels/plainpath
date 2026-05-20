# PlainPath — Stabilization Ruleset

**Applies to:** Gate 16 (Stabilization), from app approval through the first 30 days post-launch.
**Expires:** When the team formally enters Expansion planning.

---

## Rule 1 — Feature Freeze

No new features, screens, or tools are added during stabilization.

A "new feature" is defined as:
- Any new route or page not in the current router
- Any new user-facing capability not in the current v1.0 build
- Any change to the subscription plan structure or pricing
- Any addition to the navigation structure

**Exception process:** If a feature is identified as a launch blocker (i.e., its absence causes rejection or prevents the app from functioning), it may be added with written approval. Document the justification in `99-rejection-log.md`.

---

## Rule 2 — Verify in Archive, Not in Source

Any fix that touches an asset (icon, font, image) must be verified in a processed App Store Connect build before the fix is declared complete.

"The file looks right in the repo" is not sufficient. The definition of done is: the asset is confirmed correct in App Store Connect's "Included Assets" panel for a processed build.

---

## Rule 3 — CI Is the Only Build Path

All builds that go to TestFlight or App Store Connect must be produced by the GitHub Actions CI workflow (`.github/workflows/ios-testflight.yml`).

No manual Xcode archives. No Transporter uploads from a local machine. This rule ensures: icon verification step runs, build number is correct, signing is consistent, and the build is reproducible.

---

## Rule 4 — Every Change Goes Through Git

No hotfixes applied directly to the production server environment. Every fix must be:
1. Made in the codebase
2. Committed and pushed to GitHub origin/main
3. Verified in a CI build
4. Deployed through the normal deployment path

This rule prevents the "works on my machine" class of problems.

---

## Rule 5 — Allowlist Must Be Resolved at Launch

See `00-CRITICAL-LAUNCH-BLOCKERS.md`. The `ALLOWED_EMAILS` allowlist must be either removed or expanded to allow real users before any public announcement. This rule is P0 — no other stabilization work takes priority over it.

---

## Rule 6 — Compliance Changes Require Re-Verification

Any change to data collection, third-party service usage, or privacy policy content requires:
- Updating the in-app Privacy page (`/privacy`)
- Updating App Store Connect privacy nutrition labels
- Re-running Section E of the Production Verification Matrix

A change to one must always trigger review of the others. They must stay synchronized.

---

## Rule 7 — Subscription Flow Changes Are Immediate P0

If any user reports that subscriptions are not processing, not restoring, or not unlocking tools:
1. Verify immediately in RevenueCat dashboard (< 30 minutes response time)
2. If RevenueCat shows a purchase but tools are not unlocked: check entitlement sync (`/api/entitlements/status`)
3. If no purchase recorded in RevenueCat: check StoreKit configuration in App Store Connect
4. Document the issue in the support escalation flow (document 07)

A broken purchase flow is the highest-severity user issue possible. Treat it as an outage.

---

## Rule 8 — No Experimental Dependencies

No new npm packages, CocoaPods, or Swift packages are added during stabilization unless they are the minimal fix for a verified production bug.

If a fix requires a new dependency, document why the fix cannot be achieved without it before adding.

---

## Rule 9 — Rejection Log Is Maintained

Every App Store rejection is logged in `launch-ops/99-rejection-log.md` with:
- Date received
- Rejection guideline number and title
- Apple's exact rejection text
- Root cause analysis
- Fix applied (or "reply only" if no binary change)
- Resubmission date
- Resolution date

This log becomes the historical record for future submissions.

---

## Rule 10 — Stabilization Ends Formally

Stabilization does not end by default. It ends when:
- Crash rate is below 1% for 7 consecutive days
- Subscription purchase flow has processed at least 5 real subscribers without incident
- No open P0 or P1 issues exist
- A formal decision is made to enter Expansion planning

---

*Document: 04 | Phase: Stabilization | Last updated: May 2026*
