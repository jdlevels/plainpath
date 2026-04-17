# PlainPath — Store Asset Specifications

Complete asset checklist and design briefs for App Store and Google Play submission.

---

## App Icon

### Specifications

| Platform | Size | Format | Notes |
|---|---|---|---|
| App Store | 1024 × 1024 px | PNG, no alpha | Required for submission |
| Google Play | 512 × 512 px | PNG, 32-bit with alpha | High-res icon |
| iOS App (@3x) | 180 × 180 px | PNG | Home screen |
| iOS App (@2x) | 120 × 120 px | PNG | Older devices |
| Android adaptive | 108 × 108 px foreground on 108×108 bg | PNG | Adaptive icon layers |

### Design Brief

**Concept:** A clean document shield — representing both document clarity and data protection. The "plain path" metaphor: a straight, clear road through complex territory.

**Recommended approach:**
- Background: Warm off-white (`#F8F7F4`) or deep slate (`#1A1A2E`) for dark variant
- Foreground: A stylized document page with a subtle shield overlay, or a "P" monogram with document lines
- Style: Flat / minimal, single focal element, no gradients that look cheap at small sizes
- Do NOT use: generic scales of justice, gavel, magnifying glass on document (overused in this category)

**Color palette (from app):**
- Background: `#F8F7F4`
- Primary: `#2D3142` (dark navy-slate)
- Accent: Muted teal or amber

**Icon must be legible at 60×60px on a busy home screen.**

---

## App Screenshots

### Quantity & Priority

| # | Priority | Screen | Caption Overlay |
|---|---|---|---|
| 1 | Required | Home / Tool Grid | "5 tools for every document you face" |
| 2 | Required | Analyze — Plain English result | "Understand any document instantly" |
| 3 | Required | Trust Check — flagged clause view | "Know what you're signing" |
| 4 | Recommended | Contract Builder — draft output | "Build clear contracts in minutes" |
| 5 | Recommended | Redact — PII detection list | "Remove sensitive info before sharing" |
| 6 | Recommended | Redact — Applied summary (green panel) | "Clean redacted output. Original untouched." |

### Screenshot Sizes Required

| Device | Size (px) | Store |
|---|---|---|
| iPhone 16 Pro Max (6.9") | 1320 × 2868 | App Store — PRIMARY |
| iPhone 15 Plus (6.7") | 1290 × 2796 | App Store — fallback |
| iPad Pro 13" (M4) | 2064 × 2752 | App Store — if iPad supported |
| Android Phone | 1080 × 1920 | Play Store — PRIMARY |
| Android 7" tablet | 1200 × 1920 | Play Store — recommended |
| Android 10" tablet | 1920 × 1200 | Play Store — recommended |

### Screenshot Design Guidelines

- Use real app UI, not mockups or illustrations
- Add a caption overlay bar at top or bottom (not covering UI)
- Caption font: System bold, white text on dark translucent bar OR brand color on light bar
- Consistent padding, consistent caption style across all shots
- Dark mode or light mode — pick one and use consistently across the set
- No device frames required (both stores accept frameless screenshots)

### Caption Copy

```
Shot 1: "5 tools for every document you face"
Shot 2: "Plain English — not legal jargon"
Shot 3: "See what you're really signing"
Shot 4: "Build a clear contract in minutes"
Shot 5: "Find and remove sensitive info"
Shot 6: "Redacted. Protected. Ready to share."
```

---

## Feature Graphic (Google Play only)

**Size:** 1024 × 500 px
**Format:** PNG or JPEG
**Required:** Yes — shows at top of Play Store listing

### Design Brief

**Layout:** Landscape banner. Left 60%: brand tagline + subtext. Right 40%: screenshot or icon.

**Content:**
```
Headline: "Read every document in plain English"
Subline:  "Analyze, Trust Check, Review, Build, Redact"
Visual:   Phone showing tool grid or Analyze result
```

**Background:** Warm off-white (`#F8F7F4`) with subtle diagonal texture or clean gradient to slate
**Typography:** Brand/system bold for headline, regular for subline
**No busy backgrounds.** Feature graphic must be clean at small preview sizes.

---

## App Preview Video (App Store)

**Duration:** 15–30 seconds (30 seconds max)
**Size:** Same as screenshots — 1320 × 2868 (portrait) or 886 × 1920 minimum
**Format:** H.264 .mov or .mp4
**Audio:** Optional — if included, must work without audio (auto-muted in store)

### Script

```
0:00–0:03
[Screen: Home page, 5 tool tiles visible]
Caption: "5 tools. Every document."

0:03–0:08
[Screen: User taps Analyze, pastes text, result loads]
Caption: "Paste any document. Get plain English instantly."

0:08–0:13
[Screen: Trust Check — flagged clause highlighted]
Caption: "See what's really in a contract before you sign."

0:13–0:18
[Screen: Redact tool — PII detection list, names highlighted]
Caption: "Find sensitive information hidden in any document."

0:18–0:24
[Screen: Redact — user taps Select All, Apply — green summary appears]
Caption: "Remove it. Export a clean, safe version."

0:24–0:29
[Screen: PlainPath logo + app icon on warm background]
Caption: "PlainPath — plain English for every document."
```

**Notes:**
- Use real app recordings, not animation/illustration
- Do not show competitor apps
- Do not show real PII in demo content — use fictional data (same as Redact test sample)
- Must not contain pricing UI (App Store policy)

---

## Preview / Promotional Video (Google Play)

**Format:** YouTube link (unlisted or public)
**Duration:** 30–120 seconds recommended
**Aspect ratio:** 16:9

### Suggested structure (60 seconds)

```
0:00–0:05  Hook: "Your lease. Your contract. Your medical form. Can you explain what it says?"
0:05–0:15  Demo: Analyze — paste text, plain English result loads
0:15–0:25  Demo: Trust Check — flag panel with clause explanation
0:25–0:35  Demo: Redact — detection, select, apply, green summary
0:35–0:45  Demo: Contract Builder — question form → draft output
0:45–0:55  App icon + tagline: "PlainPath — plain English for every document"
0:55–1:00  CTA: "Available on iOS and Android"
```

---

## Asset Checklist

### Before Submission — App Store

- [ ] App icon 1024×1024 PNG (no alpha, no rounded corners — Apple rounds automatically)
- [ ] 3–6 iPhone 16 Pro Max screenshots (1320×2868)
- [ ] Optional: iPad Pro 13" screenshots (2064×2752)
- [ ] Optional: App Preview video (.mov, 30s max)
- [ ] Privacy Policy URL live at plainpathapp.com/privacy
- [ ] Support URL live at plainpathapp.com/support
- [ ] Review notes written (test account credentials)
- [ ] In-app purchase products configured in App Store Connect
- [ ] Subscription group created in App Store Connect
- [ ] Apple Small Business Program enrolled
- [ ] RevenueCat synced to App Store Connect products

### Before Submission — Google Play

- [ ] App icon 512×512 PNG
- [ ] Feature Graphic 1024×500 PNG
- [ ] 2–8 phone screenshots (1080×1920)
- [ ] Optional: tablet screenshots
- [ ] Optional: YouTube promo video (unlisted)
- [ ] Privacy Policy URL
- [ ] Data Safety section completed
- [ ] In-app products configured in Google Play Console
- [ ] Subscription group created in Google Play Console
- [ ] RevenueCat synced to Google Play products
