# PlainPath — Submission-Ready Asset Inventory
## Phase B complete — generated/exported asset pack

**Locked pricing:** Starter $4.99/mo · Pro $29.99/mo
**Tools:** 5 live tools + Digital Signature Coming Soon
**Annual (future):** Starter $47.99/yr (save about 20%) · Pro $251.99/yr (save about 30%)

---

## FOLDER STRUCTURE

```
docs/store/submission/
├── SUBMISSION-READY-INVENTORY.md       ← This file
│
├── ios/
│   └── screenshots/                    ← 6 Phase B screenshots (App Store reference set)
│       ├── 01-home-390x844.jpg         ← App home hero + tool cards
│       ├── 02-analyze-390x844.jpg      ← Analyze a Document page
│       ├── 03-trust-check-390x844.jpg  ← Document Trust Check page
│       ├── 04-build-contract-390x844.jpg ← Build a Contract page
│       ├── 05-contract-review-390x844.jpg ← Contract Review page
│       └── 06-redact-390x844.jpg       ← Redact Sensitive Information page
│
├── android/
│   └── screenshots/                    ← 6 Phase B screenshots (Play Store reference set)
│       ├── 01-home-390x844.jpg
│       ├── 02-analyze-390x844.jpg
│       ├── 03-trust-check-390x844.jpg
│       ├── 04-build-contract-390x844.jpg
│       ├── 05-contract-review-390x844.jpg
│       └── 06-redact-390x844.jpg
│
├── assets/
│   ├── app-icon/
│   │   ├── plainpath-app-icon-v3-1024x1024.png   ← Phase B icon (navy bg, doc + shield)
│   │   ├── plainpath-app-icon-v2.png              ← Prior iteration (reference only)
│   │   └── plainpath-app-icon-1024x1024.png       ← Prior iteration (reference only)
│   └── feature-graphic/
│       ├── plainpath-feature-graphic-v3-1024x500-raw.png ← Phase B feature graphic (16:9 raw)
│       ├── plainpath-feature-graphic-crop-to-1024x500.png ← Prior iteration
│       └── plainpath-feature-graphic-v2.png               ← Prior iteration
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

## ASSET INVENTORY — PHASE B DELIVERABLES

### 1. App Icon

| File | Dimensions | Format | Status | Notes |
|---|---|---|---|---|
| `plainpath-app-icon-v3-1024x1024.png` | 1024×1024 | PNG | ✅ Phase B generated | Deep navy bg, white document icon, green shield badge. Use as production reference. |
| `plainpath-app-icon-v2.png` | 1024×1024 | PNG | Archive | Prior iteration — keep for reference |
| `plainpath-app-icon-1024x1024.png` | 1024×1024 | PNG | Archive | First iteration — keep for reference |

**Required derivative exports (manual — from Figma/Sketch):**
- [ ] 1024×1024 PNG, no alpha channel → Apple App Store Connect
- [ ] 512×512 PNG → Google Play high-res icon
- [ ] Full Xcode asset catalog set (20×20 through 1024×1024) if building native iOS app

---

### 2. Feature Graphic (Google Play only)

| File | Raw Dimensions | Required Upload Dimensions | Format | Status |
|---|---|---|---|---|
| `plainpath-feature-graphic-v3-1024x500-raw.png` | 1920×1080 (16:9) | 1024×500 | PNG | ✅ Phase B generated | Deep navy, white PlainPath wordmark, "Understand every document." tagline |

**Action required before upload:**
- [ ] Open `plainpath-feature-graphic-v3-1024x500-raw.png` in any image editor
- [ ] Crop/resize to exactly **1024×500 px** from center
- [ ] Export as PNG, file size must be under 1 MB
- [ ] Upload to: Google Play Console → Store listing → Feature graphic

---

### 3. Apple App Store Screenshots

**Phase B captures:** 6 screens at 390×844 px (iPhone 14 equivalent viewport)
**Required for submission:** 1320×2868 px (iPhone 16 Pro Max portrait) — must be retaken on device/simulator

| # | File | Screen | URL | Caption (suggested) |
|---|---|---|---|---|
| 1 | `01-home-390x844.jpg` | Home hero + tool cards | `/app/` | 5 tools for every document you face |
| 2 | `02-analyze-390x844.jpg` | Analyze a Document | `/app/analyze` | Plain English — not legal jargon |
| 3 | `03-trust-check-390x844.jpg` | Document Trust Check | `/app/trust-check` | Spot scams before it's too late |
| 4 | `04-build-contract-390x844.jpg` | Build a Contract | `/app/build-contract` | Build a clear contract in minutes |
| 5 | `05-contract-review-390x844.jpg` | Contract Review | `/app/contract-review` | Know before you sign |
| 6 | `06-redact-390x844.jpg` | Redact Sensitive Info | `/app/redact` | Find and remove sensitive info |

**App Store required dimensions:**
- iPhone 6.7" (required): **1320×2868 px** (iPhone 16 Pro Max)
- iPhone 6.5" (required): **1284×2778 px** (iPhone 11 Pro Max / 12/13/14 Pro Max)
- iPad 12.9" (if iPad supported): **2048×2732 px**

---

### 4. Google Play Screenshots

**Phase B captures:** Same 6 screens at 390×844 px
**Required for submission:** Minimum 1080×1920 px (phone portrait) — must be retaken on device/emulator

| # | File | Screen | URL | Caption (suggested) |
|---|---|---|---|---|
| 1 | `01-home-390x844.jpg` | Home hero + tool cards | `/app/` | 5 tools for every document you face |
| 2 | `02-analyze-390x844.jpg` | Analyze a Document | `/app/analyze` | Plain English — not legal jargon |
| 3 | `03-trust-check-390x844.jpg` | Document Trust Check | `/app/trust-check` | Spot scams before it's too late |
| 4 | `04-build-contract-390x844.jpg` | Build a Contract | `/app/build-contract` | Build a clear contract in minutes |
| 5 | `05-contract-review-390x844.jpg` | Contract Review | `/app/contract-review` | Know before you sign |
| 6 | `06-redact-390x844.jpg` | Redact Sensitive Info | `/app/redact` | Find and remove sensitive info |

**Play Store required dimensions:**
- Phone: minimum **1080×1920 px**, maximum 3840×2160 px
- 7" tablet (optional): 1200×1920 px
- 10" tablet (optional): 1920×1200 px

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
- [ ] New app created with Bundle ID `com.plainpath.app`
- [ ] Subscription group "PlainPath Plans" created
- [ ] `com.plainpath.app.starter_monthly` — $4.99/month
- [ ] `com.plainpath.app.pro_monthly` — $29.99/month
- [ ] All metadata pasted from `metadata/app-store-metadata.md`
- [ ] Final 1320×2868 screenshots (×6) uploaded with caption overlays
- [ ] App icon 1024×1024 PNG (no alpha) uploaded
- [ ] Privacy Policy URL: https://plainpathapp.com/privacy
- [ ] Test account credentials added to Review Notes
- [ ] Age rating questionnaire completed (4+)

### Google Play Console
- [ ] New app created with Package `com.plainpath.app`
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
