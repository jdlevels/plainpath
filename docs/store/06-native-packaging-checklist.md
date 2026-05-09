# PlainPath — Native Packaging Checklist

Complete pre-launch checklist for shipping PlainPath on iOS (App Store) and Android (Google Play).

Stack: React + Vite frontend via Capacitor, Express API server deployed separately.

---

## Phase 0 — Prerequisites (do first)

- [ ] Apple Developer Account active ($99/year) — https://developer.apple.com/enroll/
- [ ] Google Play Developer Account active ($25 one-time) — https://play.google.com/console/signup
- [ ] RevenueCat account created and project configured (see `05-revenuecat-config.md`)
- [ ] API server deployed to production host (Railway, Render, or Fly.io)
  - [ ] `OPENAI_API_KEY` set in production environment
  - [ ] `DATABASE_URL` set in production environment
  - [ ] CORS allows `capacitor://localhost` and `http://localhost`
- [ ] Production API URL confirmed: `https://api.plainpathapp.com` (or your deployed URL)
- [ ] Privacy Policy live at: `https://plainpathapp.com/privacy`
- [ ] Terms of Service live at: `https://plainpathapp.com/terms`
- [ ] Support URL live at: `https://plainpathapp.com/support`

---

## Phase 1 — Capacitor Setup

```bash
# From monorepo root
pnpm add -D @capacitor/core @capacitor/cli
pnpm add @capacitor/ios @capacitor/android @capacitor/status-bar @capacitor/splash-screen @capacitor/share

# Init Capacitor inside the plainpath artifact
cd artifacts/plainpath
npx cap init PlainPath com.plainpathapp.plainpath --web-dir=dist/public
npx cap add ios
npx cap add android
```

### Capacitor Config (`artifacts/plainpath/capacitor.config.ts`):
```typescript
import { CapacitorConfig } from '@capacitor/cli'
const config: CapacitorConfig = {
  appId: 'com.plainpathapp.plainpath',
  appName: 'PlainPath',
  webDir: 'dist/public',
  ios: { backgroundColor: '#F8F7F4', contentInset: 'always' },
  android: { backgroundColor: '#F8F7F4' },
}
export default config
```

- [ ] Capacitor installed and initialized
- [ ] iOS platform added (`ios/` directory present)
- [ ] Android platform added (`android/` directory present)
- [ ] `capacitor.config.ts` created with correct appId and webDir

---

## Phase 2 — Build Pipeline

### Build command (both platforms):
```bash
BASE_PATH=/ VITE_API_BASE_URL=https://api.plainpathapp.com \
  VITE_REVENUECAT_IOS_API_KEY=appl_... \
  VITE_REVENUECAT_ANDROID_API_KEY=goog_... \
  pnpm --filter @workspace/plainpath build

npx cap sync
```

- [ ] `VITE_API_BASE_URL` set to production API URL at build time
- [ ] `VITE_REVENUECAT_IOS_API_KEY` set at build time
- [ ] `VITE_REVENUECAT_ANDROID_API_KEY` set at build time
- [ ] `pnpm build` completes without errors
- [ ] `npx cap sync` completes — native projects updated

---

## Phase 3 — iOS (Xcode)

### Open in Xcode:
```bash
npx cap open ios
```

### Xcode configuration:
- [ ] Bundle Identifier set to `com.plainpathapp.plainpath`
- [ ] Display Name set to `PlainPath`
- [ ] Version: `1.0.0`
- [ ] Build number: `1`
- [ ] Deployment Target: iOS 16.0+
- [ ] Signing: Team selected, Automatically manage signing ON
- [ ] App icon set added (1024×1024 + all required sizes)
- [ ] Launch screen configured (use splash screen plugin)
- [ ] Orientation locked to Portrait

### App capabilities (enable in Xcode → Signing & Capabilities):
- [ ] In-App Purchase (required for subscriptions)
- [ ] Push Notifications (optional — for future reminders feature)

### App Store Connect setup:
- [ ] New app created in App Store Connect
- [ ] Bundle ID `com.plainpathapp.plainpath` registered
- [ ] In-app purchases created:
  - [ ] `com.plainpathapp.plainpath.starter_monthly` ($4.99/month)
  - [ ] `com.plainpathapp.plainpath.pro_monthly` ($29.99/month)
- [ ] Subscription group: "PlainPath Plans"
- [ ] App metadata filled (name, subtitle, description, keywords, categories)
- [ ] Screenshots uploaded (6 shots, iPhone 16 Pro Max size)
- [ ] Privacy Policy URL entered
- [ ] Review notes written (test account + usage instructions)

### TestFlight:
- [ ] Archive built in Xcode (Product → Archive)
- [ ] Archive uploaded to App Store Connect
- [ ] Internal TestFlight group created and invited
- [ ] App tested on physical iPhone (not just simulator)
- [ ] Apple Small Business Program enrolled: https://developer.apple.com/app-store/small-business-program/enroll/

### RevenueCat → App Store Connect sync:
- [ ] RevenueCat products synced to App Store Connect via Replit Publishing pane

### Submit for Review:
- [ ] All metadata complete
- [ ] All screenshots uploaded
- [ ] Age rating questionnaire completed (4+)
- [ ] Pricing set (free download, in-app purchases)
- [ ] Submit for App Review

---

## Phase 4 — Android (Android Studio)

### Open in Android Studio:
```bash
npx cap open android
```

### Android configuration:
- [ ] Package name: `com.plainpathapp.plainpath`
- [ ] App name: `PlainPath`
- [ ] Version name: `1.0.0`
- [ ] Version code: `1`
- [ ] Min SDK: API 24 (Android 7.0)
- [ ] Target SDK: Latest stable
- [ ] App icon configured (adaptive icon: foreground + background layers)
- [ ] Signing keystore generated and securely stored
  - [ ] Keystore file backed up (losing it = can never update the app)
  - [ ] Keystore password saved in secure password manager

### Google Play Console setup:
- [ ] New app created in Play Console
- [ ] App access: available to all regions
- [ ] Content rating questionnaire completed (Everyone)
- [ ] Data safety section completed (see `03-play-store-listing.md`)
- [ ] App metadata filled (name, short description, full description, category)
- [ ] Feature graphic uploaded (1024×500 PNG)
- [ ] Screenshots uploaded (6 shots, phone + optional tablet)
- [ ] Privacy Policy URL entered

### In-app products (Play Console):
- [ ] `plainpath_starter_monthly` subscription created ($4.99/month)
- [ ] `plainpath_pro_monthly` subscription created ($29.99/month)
- [ ] Subscription group: "PlainPath Plans"
- [ ] Products activated and linked to RevenueCat

### Internal testing track:
- [ ] Signed APK or AAB uploaded to internal testing track
- [ ] Internal testers added and tested on physical Android device
- [ ] Billing tested using Google Play test accounts

### Production release:
- [ ] AAB (Android App Bundle) built: `Build → Generate Signed Bundle/APK → Android App Bundle`
- [ ] AAB uploaded to production track
- [ ] Rollout to 20% → monitor → 100%

---

## Phase 5 — Post-Launch

### Both platforms:
- [ ] Crash monitoring set up (Sentry or similar)
- [ ] RevenueCat webhook handler deployed on API server
- [ ] Analytics events implemented (first_open, tool_used, subscription_started)
- [ ] App review prompt triggered after successful analysis (not immediately on first open)

### iOS:
- [ ] Respond to App Review feedback within 48 hours if rejected
- [ ] Monitor crash reports in Xcode Organizer
- [ ] Monitor TestFlight feedback

### Android:
- [ ] Monitor Android Vitals in Play Console
- [ ] Respond to user reviews
- [ ] Monitor crash reports in Play Console → Android Vitals

---

## Future / Out of Scope for MVP

- [ ] Native PDF/DOCX binary redaction (current redaction exports .txt; original file not modified)
- [ ] Electron / Windows desktop packaging
- [ ] Push notifications (reminders feature)
- [ ] Offline mode with cached analysis
- [ ] Share extension (iOS) / Share target (Android) for receiving documents from other apps
- [ ] iPad-optimized two-column layout
- [ ] Biometric auth (Face ID / fingerprint unlock)
- [ ] Annual subscription pricing tier

---

## Key File Locations

| File | Purpose |
|---|---|
| `artifacts/plainpath/capacitor.config.ts` | Capacitor configuration |
| `artifacts/plainpath/src/lib/native.ts` | Native platform utilities (already exists) |
| `artifacts/plainpath/src/lib/nativeBilling.ts` | RevenueCat billing (scaffold in `05-revenuecat-config.md`) |
| `artifacts/plainpath/src/lib/billingConfig.ts` | Web billing flags (Stripe) |
| `docs/store/01-store-metadata.md` | Shared metadata |
| `docs/store/02-app-store-listing.md` | App Store copy + requirements |
| `docs/store/03-play-store-listing.md` | Play Store copy + requirements |
| `docs/store/04-store-assets.md` | Asset specs + design briefs |
| `docs/store/05-revenuecat-config.md` | RevenueCat structure + code scaffold |
| `docs/store/06-native-packaging-checklist.md` | This file |
