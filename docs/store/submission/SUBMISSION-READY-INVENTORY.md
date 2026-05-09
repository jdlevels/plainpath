# PlainPath — Submission-Ready Asset Inventory
## Phase B partially complete — non-screenshot assets finalized, native screenshots pending

**Locked pricing:** Starter $4.99/mo · Pro $29.99/mo
**Tools:** 5 live tools + Digital Signature Coming Soon
**Annual (future):** Starter $47.99/yr (save about 20%) · Pro $251.99/yr (save about 30%)

---

## FOLDER STRUCTURE

```
docs/store/submission/
├── SUBMISSION-READY-INVENTORY.md           ← This file
├── NATIVE-SCREENSHOT-CAPTURE-CHECKLIST.md  ← iOS + Android capture instructions
│
├── ios/
│   └── screenshots/                        ← STORYBOARD REFERENCE ONLY (390×844 px)
│       ├── 01-home-390x844.jpg             ← Replace with Xcode Simulator 1320×2868 capture
│       ├── 02-analyze-390x844.jpg
│       ├── 03-trust-check-390x844.jpg
│       ├── 04-build-contract-390x844.jpg
│       ├── 05-contract-review-390x844.jpg
│       └── 06-redact-390x844.jpg
│
├── android/
│   └── screenshots/                        ← STORYBOARD REFERENCE ONLY (390×844 px)
│       ├── 01-home-390x844.jpg             ← Replace with Android Studio 1080×2400 capture
│       ├── 02-analyze-390x844.jpg
│       ├── 03-trust-check-390x844.jpg
│       ├── 04-build-contract-390x844.jpg
│       ├── 05-contract-review-390x844.jpg
│       └── 06-redact-390x844.jpg
│
├── assets/
│   ├── app-icon/
│   │   ├── plainpath-app-icon-v3-1024x1024.png   ← ✅ FINAL Apple App Store icon (1024×1024, no alpha)
│   │   ├── plainpath-app-icon-512x512-FINAL.png  ← ✅ FINAL Google Play high-res icon (512×512)
│   │   ├── plainpath-app-icon-v2.png              ← Archive (prior iteration)
│   │   └── plainpath-app-icon-1024x1024.png       ← Archive (prior iteration)
│   └── feature-graphic/
│       ├── plainpath-feature-graphic-1024x500-FINAL.png  ← ✅ FINAL Play Store feature graphic (1024×500)
│       ├── plainpath-feature-graphic-v3-1024x500-raw.png ← Source before crop (1024×1024 square)
│       ├── plainpath-feature-graphic-crop-to-1024x500.png ← Archive (prior iteration)
│       └── plainpath-feature-graphic-v2.png               ← Archive (prior iteration)
│
├── screenshots/
│   └── raw/                            ← All raw browser captures from Phase B
│       ├── home-390x844.jpg
│       ├── analyze-390x844.jpg
│       ├── trust-check-390x844.jpg
│       ├── build-contract-390x844.jpg
│       ├── contract-review-390x844.jpg
│       ├── redact-390x844.jpg
│       ├── dashboard-tools-390x844.jpg
│       └── pricing-390x844.jpg
│
└── metadata/
    ├── app-store-metadata.md            ← Copy-paste ready for App Store Connect
    └── play-store-metadata.md           ← Copy-paste ready for Play Console
```

---

## ASSET INVENTORY — FINAL STATUS

### 1. App Icon

| File | Dimensions | Format | Alpha | Status |
|---|---|---|---|---|
| `plainpath-app-icon-v3-1024x1024.png` | **1024×1024 px** | PNG | ✅ None detected | **✅ FINAL — Apple App Store ready** |
| `plainpath-app-icon-512x512-FINAL.png` | **512×512 px** | PNG | ✅ None detected | **✅ FINAL — Google Play high-res icon ready** |
| `plainpath-app-icon-v2.png` | 1024×1024 px | PNG | unknown | Archive — prior iteration |
| `plainpath-app-icon-1024x1024.png` | 1024×1024 px | PNG | unknown | Archive — first iteration |

**Xcode asset catalog** (needed only if building native iOS binary — not needed for web app submission):
- Generate from `plainpath-app-icon-v3-1024x1024.png` using Xcode's asset catalog generator or App Icon Generator (appicon.co)

---

### 2. Feature Graphic (Google Play only)

| File | Dimensions | Format | File Size | Status |
|---|---|---|---|---|
| `plainpath-feature-graphic-1024x500-FINAL.png` | **1024×500 px** | PNG | 462 KB | **✅ FINAL — Upload-ready for Play Console** |
| `plainpath-feature-graphic-v3-1024x500-raw.png` | 1024×1024 px (square) | PNG | 829 KB | Source — pre-crop reference |

**Upload to:** Google Play Console → Store presence → Main store listing → Feature graphic

---

### 3. Apple App Store Screenshots — STORYBOARD REFERENCE ONLY

**Status: NOT submission-ready.** These are 390×844 px browser captures used as storyboard reference.
App Store Connect requires minimum 1320×2868 px and will reject these at upload.

| # | File | Actual Dimensions | Screen | URL | Caption (approved) |
|---|---|---|---|---|---|
| 1 | `01-home-390x844.jpg` | 390×844 px | Home hero + tool cards | `/app/` | 5 tools for every document you face |
| 2 | `02-analyze-390x844.jpg` | 390×844 px | Analyze a Document | `/app/analyze` | Plain English — not legal jargon |
| 3 | `03-trust-check-390x844.jpg` | 390×844 px | Document Trust Check | `/app/trust-check` | Spot scams before it's too late |
| 4 | `04-build-contract-390x844.jpg` | 390×844 px | Build a Contract | `/app/build-contract` | Build a clear contract in minutes |
| 5 | `05-contract-review-390x844.jpg` | 390×844 px | Contract Review | `/app/contract-review` | Know before you sign |
| 6 | `06-redact-390x844.jpg` | 390×844 px | Redact Sensitive Info | `/app/redact` | Find and remove sensitive info |

**Required native captures (see `NATIVE-SCREENSHOT-CAPTURE-CHECKLIST.md`):**
- 6.9" slot: **1320×2868 px** via Xcode Simulator — iPhone 16 Pro Max — MANDATORY
- 6.5" slot: **1284×2778 px** via Xcode Simulator — iPhone 15 Pro Max — MANDATORY

---

### 4. Google Play Screenshots — STORYBOARD REFERENCE ONLY

**Status: NOT submission-ready.** Same 390×844 px reference captures.
Play Console requires minimum 1080×1920 px.

| # | File | Actual Dimensions | Screen | URL | Caption (approved) |
|---|---|---|---|---|---|
| 1 | `01-home-390x844.jpg` | 390×844 px | Home hero + tool cards | `/app/` | 5 tools for every document you face |
| 2 | `02-analyze-390x844.jpg` | 390×844 px | Analyze a Document | `/app/analyze` | Plain English — not legal jargon |
| 3 | `03-trust-check-390x844.jpg` | 390×844 px | Document Trust Check | `/app/trust-check` | Spot scams before it's too late |
| 4 | `04-build-contract-390x844.jpg` | 390×844 px | Build a Contract | `/app/build-contract` | Build a clear contract in minutes |
| 5 | `05-contract-review-390x844.jpg` | 390×844 px | Contract Review | `/app/contract-review` | Know before you sign |
| 6 | `06-redact-390x844.jpg` | 390×844 px | Redact Sensitive Info | `/app/redact` | Find and remove sensitive info |

**Required native captures (see `NATIVE-SCREENSHOT-CAPTURE-CHECKLIST.md`):**
- Phone: **1080×2400 px** via Android Studio emulator — Pixel 9 Pro — MANDATORY

---

### 5. Metadata Files

| File | Platform | Status |
|---|---|---|
| `metadata/app-store-metadata.md` | Apple App Store Connect | ✅ Ready — copy-paste each field directly |
| `metadata/play-store-metadata.md` | Google Play Console | ✅ Ready — copy-paste each field directly |

---

## ASSETS REQUIRING MANUAL REPLACEMENT BEFORE SUBMISSION

These Phase B assets are production-quality reference captures. The following must be replaced with native device captures before final store upload:

| Asset | Phase B Format | Required Format | Tool |
|---|---|---|---|
| iOS screenshots (×6) | 390×844 browser capture | 1320×2868 Simulator capture | Xcode Simulator |
| Android screenshots (×6) | 390×844 browser capture | 1080×1920 emulator capture | Android Studio |
| App icon | AI-generated PNG concept | Final Figma/Sketch production file | Figma / Sketch |
| Feature graphic | 16:9 raw PNG | Cropped to exactly 1024×500 | Any image editor |

**Native screenshot workflow:**
1. Xcode → Simulator → iPhone 16 Pro Max → Scale 100%
2. Navigate to each `/app/` URL below, let it fully render
3. File → Take Screenshot (saves to Desktop at 1320×2868)
4. Repeat on Android Studio emulator → Pixel 7 Pro → 1080×1920
5. Add caption overlay in Figma (dark semi-transparent bar bottom, white bold text)

---

## PRE-SUBMISSION CHECKLIST

### Accounts (do first)
- [ ] Apple Developer Program enrolled — $99/year — developer.apple.com/enroll
- [ ] Apple Small Business Program enrolled (reduces commission 30%→15%) — developer.apple.com/app-store/small-business-program/enroll
- [ ] Google Play Developer account enrolled — $25 one-time — play.google.com/console/signup
- [ ] RevenueCat account created, PlainPath project configured (see `05-revenuecat-config.md`)

### App Store Connect
- [ ] New app created with Bundle ID `com.plainpathapp.plainpath`
- [ ] Subscription group "PlainPath Plans" created
- [ ] `com.plainpathapp.plainpath.starter_monthly` — $4.99/month
- [ ] `com.plainpathapp.plainpath.pro_monthly` — $29.99/month
- [ ] All metadata pasted from `metadata/app-store-metadata.md`
- [ ] Final 1320×2868 screenshots (×6) uploaded with caption overlays
- [ ] App icon 1024×1024 PNG (no alpha) uploaded
- [ ] Privacy Policy URL: https://plainpathapp.com/privacy
- [ ] Test account credentials added to Review Notes
- [ ] Age rating questionnaire completed (4+)

### Google Play Console
- [ ] New app created with Package `com.plainpathapp.plainpath`
- [ ] Subscription products created:
- [ ] `plainpath_starter_monthly` — $4.99/month
- [ ] `plainpath_pro_monthly` — $29.99/month
- [ ] All metadata pasted from `metadata/play-store-metadata.md`
- [ ] Final 1080×1920 screenshots (×6) uploaded with caption overlays
- [ ] App icon 512×512 PNG uploaded
- [ ] Feature graphic cropped to 1024×500 and uploaded
- [ ] Privacy Policy URL: https://plainpathapp.com/privacy
- [ ] Data Safety section completed (see play-store-metadata.md)
- [ ] Content rating questionnaire completed (Everyone)

---

## FROZEN VALUES — DO NOT CHANGE

| Item | Locked value |
|---|---|
| Starter price | $4.99/month |
| Pro price | $29.99/month |
| Annual Starter copy | "save about 20%" |
| Annual Pro copy | "save about 30%" |
| Live tool count | 5 |
| 6th tool status | Digital Signature — Coming Soon |
| Redact limitation | Exports clean text; original uploaded file is not modified |
| App Store URL | https://plainpathapp.com |
