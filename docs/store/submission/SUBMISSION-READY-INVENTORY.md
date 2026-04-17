# PlainPath — Submission-Ready Asset Inventory
## Complete record of all generated assets and their submission status

Locked pricing: Starter $4.99/mo · Pro $29.99/mo
5 live tools + Digital Signature Coming Soon
Annual (future): Starter $47.99/yr (save about 20%) · Pro $251.99/yr (save about 30%)

---

## FOLDER STRUCTURE

```
docs/store/submission/
├── SUBMISSION-READY-INVENTORY.md       ← This file
│
├── ios/
│   └── screenshots/                    ← 6 reference screenshots (App Store)
│       ├── 01-home-tool-grid.jpg
│       ├── 02-analyze-plain-english.jpg
│       ├── 03-trust-check-verdict.jpg
│       ├── 04-contract-review-score.jpg
│       ├── 05-contract-builder.jpg
│       └── 06-redact-detection.jpg
│
├── android/
│   └── screenshots/                    ← 6 reference screenshots (Play Store)
│       ├── 01-home-tool-grid.jpg
│       ├── 02-analyze-plain-english.jpg
│       ├── 03-trust-check-verdict.jpg
│       ├── 04-contract-review-score.jpg
│       ├── 05-contract-builder.jpg
│       └── 06-redact-detection.jpg
│
├── assets/
│   ├── app-icon/
│   │   └── plainpath-app-icon-1024x1024.png   ← AI-generated concept, clean bg
│   └── feature-graphic/
│       └── plainpath-feature-graphic-crop-to-1024x500.png  ← Crop before uploading
│
└── metadata/
    ├── app-store-metadata.md            ← Copy-paste ready for App Store Connect
    └── play-store-metadata.md           ← Copy-paste ready for Play Console
```

---

## ASSET INVENTORY

### App Icon

| File | Dimensions | Format | Status | Notes |
|---|---|---|---|---|
| `plainpath-app-icon-1024x1024.png` | 1024×1024 | PNG | ✅ Concept generated | Document + shield, warm off-white bg. Use as reference for final Figma/Sketch production file. App Store requires no alpha, no rounded corners. Play Store needs 512×512 version. |

**Action required before submission:**
- [ ] Produce final 1024×1024 PNG in Figma or Sketch based on generated concept
- [ ] Export 512×512 version for Google Play high-res icon
- [ ] Ensure no alpha channel on App Store version (App Store Connect will reject alpha)

---

### Feature Graphic (Google Play only)

| File | Source Dimensions | Required Dimensions | Format | Status |
|---|---|---|---|---|
| `plainpath-feature-graphic-crop-to-1024x500.png` | ~1920×1080 (16:9) | 1024×500 | PNG | ✅ Generated | Crop to 1024×500 before upload |

**Action required before submission:**
- [ ] Open in any image editor (Photoshop, Preview, GIMP)
- [ ] Crop to exactly 1024×500 px from center
- [ ] Export as PNG, file size under 1 MB
- [ ] Upload to Google Play Console → Store listing → Feature graphic

---

### Screenshots

**Capture context:** All 6 screenshots taken at 430×932 mobile viewport.
**Status:** Reference quality — production submission requires higher-resolution captures.

| # | File | Screen | App URL used | Caption text |
|---|---|---|---|---|
| 1 | `01-home-tool-grid.jpg` | App home / tool selection | `/app/` | 5 tools for every document you face |
| 2 | `02-analyze-plain-english.jpg` | Analyze — Plain English result | `/app/results?demo=event-permit` | Plain English — not legal jargon |
| 3 | `03-trust-check-verdict.jpg` | Trust Check — High scam risk | `/app/trust-check?demo=fake-irs-collection` | See what you're really signing |
| 4 | `04-contract-review-score.jpg` | Contract Review — Score 32/100 | `/app/contract-review?demo=freelance-design` | Know before you sign |
| 5 | `05-contract-builder.jpg` | Contract Builder — Type selection | `/app/build-contract?demo=nda` | Build a clear contract in minutes |
| 6 | `06-redact-detection.jpg` | Redact — Input + 3 sample docs | `/app/redact` | Find and remove sensitive info |

**App Store required dimensions:** 1320×2868 px (iPhone 16 Pro Max portrait)
**Google Play required dimensions:** 1080×1920 px (phone portrait)

**Recommended capture workflow for final screenshots:**
1. Open Xcode → Simulator → iPhone 16 Pro Max → Scale to 100%
2. Navigate to each URL listed above
3. File → Take Screenshot in Simulator (saves at full 1320×2868 resolution)
4. Repeat for Android on Android Studio emulator at 1080×1920
5. Add caption overlay bars in Figma or Canva (dark semi-transparent bar, white bold text, bottom of shot)

---

### Metadata Files

| File | For | Status |
|---|---|---|
| `metadata/app-store-metadata.md` | Apple App Store Connect | ✅ Ready — copy-paste each field directly |
| `metadata/play-store-metadata.md` | Google Play Console | ✅ Ready — copy-paste each field directly |

---

## PRE-SUBMISSION CHECKLIST

### Accounts (do first)
- [ ] Apple Developer Program enrolled — $99/year — developer.apple.com/enroll
- [ ] Apple Small Business Program enrolled — free, reduces commission 30%→15% — developer.apple.com/app-store/small-business-program/enroll
- [ ] Google Play Developer account enrolled — $25 one-time — play.google.com/console/signup
- [ ] RevenueCat account created, PlainPath project configured (see `05-revenuecat-config.md`)

### App Store Connect setup
- [ ] New app created with Bundle ID `com.plainpath.app`
- [ ] Subscription group "PlainPath Plans" created
- [ ] `com.plainpath.app.starter_monthly` — $4.99/month
- [ ] `com.plainpath.app.pro_monthly` — $29.99/month
- [ ] All metadata pasted from `metadata/app-store-metadata.md`
- [ ] Final 1320×2868 screenshots uploaded with caption overlays
- [ ] App icon 1024×1024 PNG (no alpha) uploaded
- [ ] Privacy Policy URL entered: https://plainpathapp.com/privacy
- [ ] Test account credentials added to Review Notes
- [ ] Age rating questionnaire completed (4+)

### Google Play Console setup
- [ ] New app created with Package `com.plainpath.app`
- [ ] Subscription group "PlainPath Plans" created
- [ ] `plainpath_starter_monthly` — $4.99/month
- [ ] `plainpath_pro_monthly` — $29.99/month
- [ ] All metadata pasted from `metadata/play-store-metadata.md`
- [ ] Final 1080×1920 screenshots uploaded with caption overlays
- [ ] App icon 512×512 PNG uploaded
- [ ] Feature graphic cropped to 1024×500 and uploaded
- [ ] Privacy Policy URL entered: https://plainpathapp.com/privacy
- [ ] Data Safety section completed (see `metadata/play-store-metadata.md`)
- [ ] Content rating questionnaire completed (Everyone)

### Frozen values — do not change during submission
- Starter: $4.99/month
- Pro: $29.99/month
- Annual copy (future): "save about 20%" / "save about 30%"
- Tool count: 5 live tools
- 6th tool: Digital Signature — Coming Soon
- Redact limitation: exports clean text version; original uploaded file is not modified
