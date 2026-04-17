# PlainPath — Native Screenshot Capture Checklist
## Required before final store submission

The 6 storyboard reference captures (390×844 px) confirm the correct screens and content.
This checklist governs the high-resolution native device captures that replace them for upload.

---

## iOS — Apple App Store

### Required device sizes
Apple requires screenshots for these two display sizes. Both are mandatory.

| Slot | Device | Required dimensions | Notes |
|---|---|---|---|
| 6.9" (primary) | iPhone 16 Pro Max | **1320×2868 px** | Required — App Store Connect rejects smaller |
| 6.5" (secondary) | iPhone 15 Pro Max / 14 Pro Max / 13 Pro Max / 12 Pro Max | **1284×2778 px** | Required — covers older devices |

iPad is optional unless you plan to list as a Universal app.

### Simulator setup
1. Open **Xcode** → **Xcode menu → Open Developer Tool → Simulator**
2. In Simulator: **File → New Simulator** (if not already present)
   - For 6.9": choose **iPhone 16 Pro Max**
   - For 6.5": choose **iPhone 15 Pro Max**
3. Set scale: **Window → Physical Size** (or 100%) — do not use "Fit Screen"
4. Boot the simulator, wait for it to fully load
5. Open Safari in the simulator and navigate to: `https://plainpathapp.com/app/`
   - Or use the Expo/native app build pointed at the live backend

### Screenshot sequence (same for both device sizes)

| # | Screen | URL | What to verify before capturing |
|---|---|---|---|
| 1 | Home / Tool Selection | `https://plainpathapp.com/app/` | Banner reads "5 TOOLS LIVE · DIGITAL SIGNATURE COMING SOON". All 6 tool cards visible (scroll if needed). |
| 2 | Analyze a Document | `https://plainpathapp.com/app/analyze` | Tab bar shows Paste Text / Upload File / Scan Photo. Sample document chips visible. |
| 3 | Document Trust Check | `https://plainpathapp.com/app/trust-check` | "Check a Document" CTA visible. 3 demo entries: Fake Utility Shutoff, Fake IRS Collection, Legitimate Utility Notice. |
| 4 | Build a Contract | `https://plainpathapp.com/app/build-contract` | Step 1 of 6 stepper visible. "What are you building?" with contract type cards. |
| 5 | Contract Review | `https://plainpathapp.com/app/contract-review` | Input tabs visible. "TRY A SAMPLE CONTRACT" shown at bottom. |
| 6 | Redact Sensitive Information | `https://plainpathapp.com/app/redact` | 3 PII sample docs shown: Personal Info Letter, Freelance Contract, Medical Benefits Form. |

### How to capture
- In Simulator menu bar: **File → Take Screenshot**
- Screenshots save to your Desktop at full native resolution
- Naming convention: `ios-[device]-[screen]-[date].png`

### Caption overlay (recommended, not required by Apple)
- Add in Figma, Sketch, or Canva after capture
- Dark semi-transparent bar at bottom (~180px tall at 1320px width)
- White bold sans-serif text, center-aligned
- Suggested captions per screen:

| # | Caption |
|---|---|
| 1 | 5 tools for every document you face |
| 2 | Plain English — not legal jargon |
| 3 | Spot scams before it's too late |
| 4 | Build a clear contract in minutes |
| 5 | Know before you sign |
| 6 | Find and remove sensitive info |

### App Store Connect upload
- Navigate to: App Store Connect → Your App → App Store → Screenshots
- Upload the 6.9" set under **iPhone 6.9" Display**
- Upload the 6.5" set under **iPhone 6.5" Display**
- Drag to reorder: Home first, Redact last

---

## Android — Google Play

### Required device sizes
Google Play requires at minimum one phone screenshot set. Tablets are optional.

| Slot | Device | Required dimensions | Notes |
|---|---|---|---|
| Phone (required) | Pixel 9 Pro / Pixel 8 Pro | **1080×2400 px** (or 1080×1920 minimum) | Must be at least 1080×1920; aspect ratio must be 16:9 or 19.5:9 |
| 7" tablet (optional) | Pixel Tablet | 1200×1920 px | Only needed if targeting tablet layout |
| 10" tablet (optional) | Pixel Tablet 10" | 1920×1200 px | Only needed if targeting tablet layout |

### Emulator setup
1. Open **Android Studio** → **Device Manager** → Create Virtual Device
2. Choose **Pixel 9 Pro** (or Pixel 8 Pro) — 1080×2400 resolution
3. Select system image: Android 15 (API 35) — download if needed
4. Launch emulator, wait for full boot
5. Open Chrome and navigate to: `https://plainpathapp.com/app/`

### Screenshot sequence

| # | Screen | URL | What to verify before capturing |
|---|---|---|---|
| 1 | Home / Tool Selection | `https://plainpathapp.com/app/` | Banner reads "5 TOOLS LIVE · DIGITAL SIGNATURE COMING SOON". All 6 cards visible. |
| 2 | Analyze a Document | `https://plainpathapp.com/app/analyze` | Input tabs, sample document chips all visible. |
| 3 | Document Trust Check | `https://plainpathapp.com/app/trust-check` | "Check a Document" CTA + 3 demo entries visible. |
| 4 | Build a Contract | `https://plainpathapp.com/app/build-contract` | Step 1 stepper + contract type cards visible. |
| 5 | Contract Review | `https://plainpathapp.com/app/contract-review` | Input tabs + "TRY A SAMPLE CONTRACT" visible. |
| 6 | Redact Sensitive Information | `https://plainpathapp.com/app/redact` | 3 PII demo entries visible + "Scan for Sensitive Information" CTA. |

### How to capture
- In Android Studio emulator: click the **camera icon** in the emulator toolbar (right side)
- Or use: **adb exec-out screencap -p > screenshot.png** (run from Terminal)
- Screenshots save at native emulator resolution
- Naming convention: `android-[device]-[screen]-[date].png`

### Caption overlay (recommended)
- Same Figma/Canva approach as iOS
- Dark bar bottom, white bold text
- Use same caption text as iOS set above

### Google Play Console upload
- Navigate to: Play Console → Your App → Store presence → Main store listing
- Scroll to **Phone screenshots** section
- Upload all 6 in order (drag to reorder)
- Minimum 2 screenshots required; 6 is optimal

---

## Summary checklist — before upload

### iOS
- [ ] Xcode Simulator installed (Xcode 16+)
- [ ] iPhone 16 Pro Max simulator created and booted
- [ ] iPhone 15 Pro Max simulator created and booted
- [ ] 6 screenshots captured at 1320×2868 (iPhone 16 Pro Max)
- [ ] 6 screenshots captured at 1284×2778 (iPhone 15 Pro Max)
- [ ] Caption overlays added (optional but recommended)
- [ ] All 12 files uploaded to App Store Connect

### Android
- [ ] Android Studio installed with emulator
- [ ] Pixel 9 Pro virtual device created (1080×2400)
- [ ] 6 screenshots captured at 1080×2400
- [ ] Caption overlays added (optional but recommended)
- [ ] All 6 files uploaded to Play Console

### Both
- [ ] Verify Digital Signature card shows "Coming Soon" in every dashboard screenshot
- [ ] Verify Pro price is NOT visible in screenshots (no pricing in screenshots)
- [ ] Verify no test/debug UI elements appear in any capture
- [ ] Verify Clerk "Sign in" button in nav is present (app is accessible without login)
