# PlainPath — App Review Response Library

Use this library when Apple rejects the PlainPath submission. Match the rejection to the closest category, follow the response guidance, and log all rejections in document `99-rejection-log.md`.

---

## Guideline 1.1 — Objectionable Content

**Likely trigger:** AI-generated content from document analysis contains language Apple deems objectionable.

**Root cause:** OpenAI API response includes text flagged by Apple's review team.

**Response approach:**
- Reply in Resolution Center: "PlainPath processes user-uploaded documents using AI. The app does not generate or host objectionable content. Any text displayed to the user is a plain-English interpretation of the user's own document. We do not store document content after processing."
- If Apple provides a specific example, add content filtering on the AI output layer for that class of content.
- Do not add a content warning — it is not appropriate for a document analysis utility.

**Binary change required:** Only if adding output filtering. Otherwise, reply via message.

---

## Guideline 2.1 — Performance: App Completeness

**Likely trigger:** App crashes, blank screens, or broken flows during Apple's review session.

**Root cause candidates:**
1. Reviewer is not signed in and hits a protected route.
2. Review account credentials not provided in review notes.
3. Allowlist is blocking the reviewer's email (see `00-CRITICAL-LAUNCH-BLOCKERS.md` Blocker 1).
4. API server is down or cold-starting.

**Response approach:**
- First check: Did you provide a reviewer test account in review notes? If no, reply with credentials immediately.
- Second check: Is the reviewer's email blocked by the allowlist? If yes, this is a critical fix — resolve Blocker 1 before resubmitting.
- Third check: Check deployment logs for the time period Apple was reviewing.
- Reply in Resolution Center with test account credentials and a specific walkthrough of the flow Apple should test.

**Binary change required:** Only if the allowlist or a crash is the root cause.

---

## Guideline 2.5.2 — Design: Minimum Functionality / Thin App

**Likely trigger:** Apple considers the app too simple or mostly a web wrapper.

**Root cause:** Capacitor-based apps can trigger this; Apple looks for native UI patterns and meaningful offline or device capability use.

**Response approach:**
Reply in Resolution Center: "PlainPath provides substantive AI-powered document analysis and contract review functionality. The app processes user-uploaded documents locally and via a secure API, returns structured plain-English summaries, and persists analysis history per-user. The app uses native device capabilities including the file system (document upload), native subscriptions (StoreKit/RevenueCat), status bar, and keyboard handling. This is not a bookmarked website — the app requires an active account, manages user data, and provides content that is generated dynamically based on each user's documents."

Include screenshots of the analysis result, My Analyses, and the native subscription purchase sheet in your reply.

**Binary change required:** No, unless Apple specifically identifies a missing native feature.

---

## Guideline 3.1.1 — In-App Purchase

**Likely trigger:** App contains links to a website for purchasing, or references pricing that differs from the App Store.

**Root cause candidates:**
1. The web version's Stripe checkout flow is accessible from the iOS app.
2. Pricing text in the app does not exactly match the App Store price.
3. A "Subscribe on Web" link is visible.

**Response approach:**
- Audit every button and link in the app. Remove any path that leads to a non-StoreKit purchase flow while running on iOS.
- Confirm pricing text (`$19.99/month`) matches App Store Connect exactly.
- Reply with: "All subscription purchases on iOS are processed exclusively through StoreKit via RevenueCat. No external payment links are shown to iOS users. Stripe is used only for web users on the plainpathapp.com website, which is a separate product not included in this binary."

**Binary change required:** Yes if any Stripe/web purchase path is reachable on iOS.

---

## Guideline 3.1.2 — Subscriptions

**Likely trigger:** Subscription terms not clearly disclosed, or trial terms missing.

**Root cause:** Missing subscription disclosure text near the purchase button, or RevenueCat paywall does not show duration/price/renewal terms.

**Response approach:**
- Verify the paywall shows: price, billing period, auto-renewal disclosure, cancellation instructions, and links to Terms and Privacy.
- Apple requires: "Subscription automatically renews unless cancelled at least 24 hours before the end of the current period."
- If missing, add the disclosure text to `PaywallPreview.tsx` and the native paywall component.

**Binary change required:** Yes if disclosure text is missing.

---

## Guideline 4.0 — Design

**Likely trigger:** App crashes on a specific device size, orientation, or iOS version.

**Root cause:** Layout issue not caught in QA.

**Response approach:**
- Reproduce on the device/OS Apple cited.
- Fix the layout issue.
- Reply with a description of the fix and the devices it was tested on.

**Binary change required:** Yes.

---

## Guideline 5.1.1 — Data Collection and Storage: Privacy Policies

**Likely trigger:** Privacy policy URL is broken, privacy policy does not cover collected data types, or privacy nutrition labels do not match actual behavior.

**Root cause candidates:**
1. `https://plain-path.replit.app/privacy` returning a non-200 status during review.
2. Privacy policy does not mention OpenAI as a third-party processor.
3. Privacy labels declare data types not actually collected, or omit types that are.

**Response approach:**
- Confirm privacy policy URL is live.
- Review the current privacy policy at `/privacy` against App Store Connect labels.
- If there is a mismatch, update the labels in App Store Connect (no new binary required) and/or update the privacy policy page.
- Reply: "Our privacy policy is available at [URL]. It discloses all data collection including: document text sent to OpenAI for analysis (not stored by PlainPath), email address for subscription management (processed by Stripe), and analysis output stored per-user account on PlainPath servers. All declared privacy nutrition labels match actual data flows."

**Binary change required:** No if only metadata correction. Yes if actual data collection behavior changes.

---

## Guideline 5.1.2 — Data Use and Sharing: Device Permissions

**Likely trigger:** App requests a device permission (camera, contacts, location) without a clear usage justification, or permission is not used.

**Root cause:** Capacitor or a plugin declares a permission in Info.plist that is not actively used.

**Response approach:**
- Audit `ios/App/App/Info.plist` for all `NSUsageDescription` keys.
- Remove any permission that the app does not actively use.
- For file access: "PlainPath uses the Files permission to allow users to select documents from their iOS Files app for analysis. No files are uploaded without explicit user action."

**Binary change required:** Yes if a permission must be removed from Info.plist.

---

## Template — Resolution Center Reply

```
Thank you for your review.

[One sentence: acknowledge the specific issue Apple raised.]

[Two to three sentences: explain what the app does and why the behavior Apple flagged is correct, or describe the fix if a fix was made.]

[If a new build is being submitted: "We have submitted build [number] which addresses this issue by [specific change]." ]

[If replying without a new build: "No binary changes are required. [Specific metadata or configuration that was corrected]." ]

We are happy to provide additional information or a test walkthrough if helpful.

Test account for review:
  Email: [reviewer account email]
  Password: [reviewer account password]
  Note: [any specific step needed to reach the tested feature]
```

---

*Document: 03 | Phase: Review Handling | Last updated: May 2026*
