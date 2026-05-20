# PlainPath — First-User Support and Escalation Flow

**Support channel:** support@plainpathapp.com
**In-app support:** `/support` route

---

## Triage Categories

| Category | Examples | Response time | Owner |
|---|---|---|---|
| P0 — Purchase broken | Charged but app still locked, purchase failed | < 1 hour | Engineering |
| P1 — Cannot sign in | Account locked, password reset not working | < 2 hours | Engineering |
| P1 — Tool broken | Analysis returns error, contract review fails | < 2 hours | Engineering |
| P2 — Data issue | Analysis not saved, My Analyses empty | < 24 hours | Engineering |
| P3 — UX / cosmetic | Button looks wrong, text truncated | < 48 hours | Product |
| P3 — Feature request | Requests for tools not in v1.0 | Acknowledge; log for Expansion | Product |
| Info — Billing question | "How do I cancel?", "What does Pro include?" | < 24 hours | Support |
| Info — Privacy question | "What data do you store?" | < 24 hours | Support |

---

## Response Templates

### T1 — Purchase charged but app still locked

```
Subject: Re: Subscription issue

Thank you for reaching out. We're sorry for the inconvenience.

To restore your subscription immediately:
1. Open PlainPath
2. Go to Settings → Billing
3. Tap "Restore Purchases"

If that doesn't work, please try signing out and signing back in.

If the issue persists, please reply with:
- Your Apple ID email address (the one used to purchase)
- The approximate time and date of the purchase
- Your device type and iOS version

We will manually verify your subscription status and unlock your account within 1 hour.
```

### T2 — Cannot sign in

```
Subject: Re: Sign-in issue

Thank you for contacting us. Let's get you back in.

Please try the following:
1. Tap "Forgot password" on the sign-in screen
2. Check your spam folder for the reset email
3. If you signed up with Apple Sign-In, use the same method to sign back in

If you're still unable to sign in, reply with the email address you used to create your account and we'll look into it directly.
```

### T3 — Analysis or tool not working

```
Subject: Re: Tool issue

Thank you for reporting this. We take tool reliability seriously.

Could you please share:
1. Which tool you were using (Analyze a Document or Contract Review)
2. What type of document you uploaded (PDF, DOCX, etc.)
3. The approximate file size
4. The exact error message you saw, if any
5. Your iOS version and device model

We'll investigate and follow up within 2 hours.
```

### T4 — Cancellation request

```
Subject: Re: Cancellation

Your PlainPath subscription is managed through Apple. To cancel:

1. Open the iOS Settings app
2. Tap your name at the top
3. Tap Subscriptions
4. Find PlainPath and tap Cancel Subscription

You'll retain access until the end of your current billing period. No further charges will occur after cancellation.

If you experienced a problem that led to this decision, we'd value knowing what happened so we can improve the product. Feel free to share — no pressure.
```

### T5 — Feature request

```
Subject: Re: Feature suggestion

Thank you for the suggestion — we genuinely appreciate feedback from early users.

We've logged your request for [feature]. While this isn't something we can commit to a timeline for right now, user feedback directly shapes what we build next.

If you have other thoughts or run into any issues, we're always happy to hear from you.
```

### T6 — Privacy / data question

```
Subject: Re: Data and privacy

PlainPath is built on a simple principle: your documents are your business, not ours.

- Documents you upload are processed in memory and never written to disk or stored by PlainPath.
- Analysis output is stored on PlainPath servers only if you choose to save it. You can delete it at any time.
- Your email is stored only if you subscribe, and is processed by Stripe for billing.

Our full privacy policy is at: https://plain-path.replit.app/privacy

If you'd like to request deletion of your account data, reply to this email and we'll process it within 7 days.
```

---

## Escalation Path

### Support → Engineering escalation trigger conditions

Escalate immediately to Engineering when any of the following are true:
- More than 2 users report the same issue within 1 hour (potential system-wide issue)
- A user reports being charged but not receiving access
- A user reports their data is missing or corrupted
- Any user reports unexpected data exposure (wrong user's data visible)

### Engineering escalation process
1. Create an entry in the incident log
2. Classify severity (P0/P1/P2) using document 06
3. Follow the rollback/hotfix flow in document 06

### When to contact RevenueCat support
If a purchase is visible in App Store Connect but not reflected in RevenueCat:
- Contact RevenueCat support at https://www.revenuecat.com/support
- Provide: Subscriber's Apple ID email, App Store transaction ID, timestamp of purchase

### When to contact Stripe support
For web subscription billing issues not resolvable via the Stripe dashboard:
- Use Stripe's support chat at https://dashboard.stripe.com (bottom right corner)

---

## App Store Review Response (User Reviews)

Respond to all App Store reviews within 48 hours.

| Rating | Tone | Action |
|---|---|---|
| 5 stars | Grateful, brief | "Thank you! We're glad [feature] is helpful." |
| 4 stars | Appreciative, address feedback | Acknowledge what they liked; note the improvement they mentioned |
| 3 stars | Empathetic, invite contact | "We'd love to understand more — please reach out at support@plainpathapp.com" |
| 1–2 stars | Empathetic, direct to support | Acknowledge the problem; provide support email; do not argue |

Never argue with a user in a review response. Never ask users to change their rating.

---

*Document: 07 | Phase: Stabilization | Last updated: May 2026*
