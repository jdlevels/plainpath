# PlainPath — Subscription / Runtime Alignment Verification

Verifies that the subscription configuration, RevenueCat entitlements, App Store Connect IAP, and the app's paywall behavior are all consistent.

---

## Section 1 — Configuration Reference

| Parameter | Value | Location |
|---|---|---|
| RevenueCat entitlement ID | `plainpath_pro` | `artifacts/api-server/src/lib/nativeBillingConfig.ts` |
| Apple App Store product ID | `plainpath_pro_monthly` | `artifacts/api-server/src/lib/nativeBillingConfig.ts` |
| Plan key | `pro` | `artifacts/api-server/src/lib/nativeBillingConfig.ts` |
| Price shown in paywall | $19.99/month | `artifacts/plainpath/src/pages/PaywallPreview.tsx` |
| Billing mode | `live` (real charges) | `artifacts/plainpath/src/lib/billingConfig.ts` |
| Paywall enforcement | `true` | `artifacts/plainpath/src/lib/billingConfig.ts` |
| Stripe test mode | `false` | `artifacts/plainpath/src/lib/billingConfig.ts` |

---

## Section 2 — App Store Connect Alignment

| Check | Expected | Status |
|---|---|---|
| IAP product ID matches code | `plainpath_pro_monthly` in App Store Connect matches `nativeBillingConfig.ts` | |
| IAP product type | Auto-Renewable Subscription | |
| IAP product status | Approved or Ready to Submit | |
| IAP price in App Store Connect | $19.99/month (or equivalent local pricing) | |
| Subscription group created | At least one subscription group containing this product | |
| Free trial configured | Yes / No (confirm matches what is shown in paywall UI) | |
| Promotional offer configured | N/A for v1.0 | |

---

## Section 3 — RevenueCat Alignment

| Check | Expected | Status |
|---|---|---|
| RevenueCat project exists | "PlainPath" project visible in RevenueCat dashboard | |
| iOS app added | Bundle ID `com.plainpathapp.plainpath` registered | |
| Entitlement created | `plainpath_pro` entitlement exists | |
| Product added | `plainpath_pro_monthly` product added to project | |
| Product mapped to entitlement | `plainpath_pro_monthly` → `plainpath_pro` mapping confirmed | |
| REVENUECAT_API_KEY_IOS set | API key configured in production environment | |
| RevenueCat public key in app | `VITE_REVENUECAT_PUBLIC_KEY_IOS` set in frontend environment | |

---

## Section 4 — Paywall UI Alignment

The paywall must show exactly what the user is purchasing.

| Check | Paywall shows | App Store shows | Match? |
|---|---|---|---|
| Price | $19.99/month | $19.99/month | |
| Billing period | Monthly | Auto-Renewable, 1 month | |
| Auto-renewal disclosure | Yes — "Renews automatically" | N/A | |
| Cancellation instructions | Link to iOS Settings → Subscriptions | N/A | |
| Privacy policy link | Yes | N/A | |
| Terms link | Yes | N/A | |

**Critical:** If the price in the paywall UI does not match App Store Connect, Apple will reject the app under Guideline 3.1.1.

---

## Section 5 — Entitlement Flow Verification

Trace the entitlement from purchase to tool access:

```
User taps Subscribe
  → RevenueCat SDK shows purchase sheet (StoreKit)
  → User completes purchase
  → RevenueCat records purchase; entitlement "plainpath_pro" activated
  → App calls Purchases.getCustomerInfo()
  → Result passed to POST /api/entitlements/native-verify
  → Server verifies with RevenueCat; updates billing DB
  → useEntitlements hook returns hasPaidSubscription=true
  → PlanGate renders tool content (not paywall)
```

| Step | Verification | Status |
|---|---|---|
| Purchase sheet appears | Native StoreKit sheet shows on tap Subscribe | |
| RevenueCat records purchase | New subscriber visible in RC dashboard after purchase | |
| `/api/entitlements/native-verify` returns 200 | Check API logs for this call after purchase | |
| `hasPaidSubscription` becomes true | Tools unlock without app restart | |
| Tool access confirmed | Both Analyze and Contract Review accessible after purchase | |

---

## Section 6 — Lapsed Subscription Behavior

Verify that a cancelled subscription correctly locks the app:

| Check | Expected | Status |
|---|---|---|
| Cancel subscription in iOS Settings | After billing period ends, `hasPaidSubscription` becomes false | |
| Paywall shown on next tool access | Yes — paywall displayed, not tool content | |
| Restore Purchases works | After re-subscribing, tools unlock again | |
| No data deleted on cancellation | Saved analyses remain accessible | |

---

## Section 7 — Admin Access

Admins bypass subscription checks entirely.

| Check | Expected | Status |
|---|---|---|
| `support@plainpathapp.com` — has `role: admin` in Clerk metadata | Yes | |
| Admin sees all tools regardless of subscription status | Yes | |
| Admin is NOT counted as a RevenueCat subscriber | Correct — admin access is role-based, not billing-based | |

---

*Document: 09 | Phase: Compliance Verification | Last updated: May 2026*
