# PlainPath — Store Asset Index
## Complete inventory of all store submission assets

---

## Generated AI Assets (`docs/store/assets/`)

| File | Type | Dimensions | Status | Notes |
|---|---|---|---|---|
| `app-icon-1024-v2.png` | App Icon | 1024×1024 | ✅ Generated | Document + shield concept, warm off-white bg. Submit to App Store as-is. Resize to 512×512 for Play Store. |
| `feature-graphic-final.png` | Play Feature Graphic | ~1920×1080 (16:9) | ✅ Generated | Crop to exactly 1024×500 before uploading to Play Console. |

> **Note on app icon v1 (`app-icon-1024.png`):** Has a dark outer frame — do not submit. Use v2.

---

## App Screenshots (`docs/store/screenshots/`)

All screenshots captured at 430×932 (iPhone-sized mobile viewport). **Must be resized/exported at store-required dimensions before submission.** Use Xcode Simulator or physical device for final 1320×2868 shots.

| File | Shot # | Screen | Caption (apply as overlay) |
|---|---|---|---|
| `01-home-tools.jpg` | 1 | App home — 5 tool buttons | "5 tools for every document you face" |
| `02-analyze-result.jpg` | 2 | Analyze — Plain English Overview (event permit demo) | "Plain English — not legal jargon" |
| `03-trust-check.jpg` | 3 | Trust Check — Scam verdict (fake IRS collection) | "See what you're really signing" |
| `04-contract-review.jpg` | 4 | Contract Review — Fairness score 32/100 (freelance-design) | "Know before you sign" |
| `05-contract-builder.jpg` | 5 | Contract Builder — type selection step | "Build a clear contract in minutes" |
| `06-redact-input.jpg` | 6 | Redact — input with 3 sample document cards | "Find and remove sensitive info" |

### Before Final Submission — Screenshot Tasks
- [ ] Record screenshots on iPhone 16 Pro Max (1320×2868) via Xcode Simulator or physical device
- [ ] Record screenshots on Android phone (1080×1920)
- [ ] Add caption overlay bars to all shots (dark translucent bar, white bold text, consistent positioning)
- [ ] For Shot 2 (Analyze): Use freelance or lease demo for a more relatable document type than event permit
- [ ] For Shot 5 (Builder): Capture the final draft output step instead of type-selection step
- [ ] For Shot 6 (Redact): Load one of the 3 built-in demo docs and capture the PII detection list screen

---

## Store Metadata Docs (`docs/store/`)

| File | Contents |
|---|---|
| `00-asset-index.md` | This file — master asset inventory |
| `01-store-metadata.md` | Shared metadata + plan positioning (source of truth) |
| `02-app-store-listing.md` | App Store copy + screenshot requirements |
| `03-play-store-listing.md` | Play Store copy + requirements |
| `04-store-assets.md` | Asset specs, design briefs, preview video script |
| `05-revenuecat-config.md` | RevenueCat entitlements, products, code scaffold, pricing notes |
| `06-native-packaging-checklist.md` | Full iOS + Android packaging checklist |
| `07-metadata-pack-final.md` | **Copy-paste ready metadata for both stores** |

---

## Submission Readiness Checklist

### Assets: AI-generated (done)
- [x] App icon concept generated (1024×1024, v2)
- [x] Feature graphic generated (crop to 1024×500 before Play Console upload)
- [ ] Final high-res icon produced from design tool (Figma/Sketch) using generated concept as reference
- [ ] Feature graphic exported at exact 1024×500 PNG

### Assets: Screenshots (reference captures done)
- [x] Reference captures for all 6 screens at mobile viewport size
- [ ] Final captures at iPhone 16 Pro Max resolution (1320×2868) with caption overlays
- [ ] Final captures at Android phone resolution (1080×1920)

### Metadata (complete)
- [x] App Store name, subtitle, description, keywords finalized
- [x] Play Store name, short description, full description finalized
- [x] Screenshot captions written
- [x] Review notes written (needs test account filled in before submission)
- [x] In-app purchase product IDs and prices finalized ($4.99 Starter, $29.99 Pro)
- [x] Annual pricing language: "save about 20%" / "save about 30%" (charm-priced, not exact)
- [x] Privacy policy, terms, support URLs live at plainpathapp.com

### Accounts (pre-submission)
- [ ] Apple Developer Account enrolled ($99/year)
- [ ] Google Play Developer Account enrolled ($25 one-time)
- [ ] RevenueCat account created, project and products configured
- [ ] Apple Small Business Program enrolled (30% → 15% commission)
