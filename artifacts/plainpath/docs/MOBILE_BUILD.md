# PlainPath — Mobile Build Guide

## Overview

PlainPath uses [Capacitor 8](https://capacitorjs.com/) to package the React/Vite web app into native iOS and Android apps. The web app is built first, then synced into the native projects.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| pnpm | 9+ |
| Xcode | 15+ (macOS required for iOS) |
| Android Studio | Hedgehog / Iguana |
| JDK | 17 |
| CocoaPods | 1.14+ |

---

## Environment Variables

Before building, create a `.env.production` file at `artifacts/plainpath/`:

```env
# Required for native (Capacitor) builds — all API calls go here
VITE_API_BASE_URL=https://plain-path.replit.app
```

Without this, all API calls will fail in the native build.

---

## Quick Commands

```bash
# From the workspace root:
cd artifacts/plainpath

# Build + sync both platforms
pnpm cap:sync

# Build + open in Xcode (macOS only)
pnpm cap:ios

# Build + open in Android Studio
pnpm cap:android
```

---

## iOS (TestFlight / App Store)

### 1. Build and sync

```bash
cd artifacts/plainpath
pnpm cap:ios
# Xcode opens automatically
```

### 2. In Xcode

- Select **App** target → **Signing & Capabilities**
- Set **Team** to your Apple Developer account
- Set **Bundle Identifier**: `com.plainpath.app`
- Set **Version** (Marketing Version): `1.0.0`
- Set **Build** (Current Project Version): `1` (increment for each submission)

### 3. App icons

Place a 1024×1024 PNG named `AppIcon.png` in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`. Xcode will generate all required sizes from it (or use an asset catalog tool).

### 4. Archive and upload

**Product → Archive → Distribute App → TestFlight & App Store**

### App Store review notes

| Key | Value |
|-----|-------|
| Primary category | Productivity |
| Uses encryption | No (`ITSAppUsesNonExemptEncryption = false` in Info.plist) |
| Camera access | "PlainPath can use your camera to photograph and analyze physical documents" |
| Photo library access | "PlainPath needs access to your photo library to select documents" |
| Sign in required | No |
| In-app purchases | No (subscriptions managed on web) |

---

## Android (Play Store)

### 1. Build and sync

```bash
cd artifacts/plainpath
pnpm cap:android
# Android Studio opens automatically
```

### 2. In Android Studio

- Open `android/app/build.gradle`
- Update `versionCode` (integer, increment per release) and `versionName` (string)
- **Build → Generate Signed Bundle / APK → Android App Bundle (AAB)**
- Use your keystore (.jks) to sign the release build

### 3. App icons

Replace files in `android/app/src/main/res/mipmap-*/` with your custom icons. Use Android Studio's **Image Asset** tool (right-click `res` → New → Image Asset) with a 1024×1024 source PNG.

### 4. Target SDK

| Setting | Value |
|---------|-------|
| `minSdkVersion` | 24 (Android 7) |
| `compileSdkVersion` | 36 |
| `targetSdkVersion` | 36 |

---

## Capacitor Config

`capacitor.config.json`:

```json
{
  "appId": "com.plainpath.app",
  "appName": "PlainPath",
  "webDir": "dist/public",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 800,
      "backgroundColor": "#F8F7F4"
    }
  }
}
```

`webDir` must match Vite's `build.outDir` (`dist/public`).

---

## Permissions summary

### iOS (Info.plist)

| Permission | Reason |
|------------|--------|
| NSPhotoLibraryUsageDescription | Select image documents from Photos |
| NSPhotoLibraryAddUsageDescription | Save files to Photos (future) |
| NSDocumentsFolderUsageDescription | Pick PDFs from Files app |
| NSCameraUsageDescription | Scan physical documents with camera |
| ITSAppUsesNonExemptEncryption = false | No custom encryption — removes export compliance question |

### Android (AndroidManifest.xml)

| Permission | Reason |
|------------|--------|
| INTERNET | API calls |
| ACCESS_NETWORK_STATE | Network checks |
| CAMERA | Scan physical documents |
| READ_EXTERNAL_STORAGE (API ≤32) | Pick documents on older Android |
| READ_MEDIA_IMAGES (API 33+) | Pick image documents on Android 13+ |

---

## Subscription flow on mobile

Per Apple App Store guidelines, in-app purchases for subscriptions managed outside Apple's system are not permitted to be advertised or initiated in the app. The PlainPath iOS app shows a message directing users to the web at `plain-path.replit.app` to subscribe. This is handled in `PricingSection.tsx` and `Subscribe.tsx` via the `isNative()` guard.

---

## Useful Capacitor commands

```bash
# Sync only (no build step)
npx cap sync

# Open iOS without building
npx cap open ios

# Open Android without building
npx cap open android

# Show doctor info
npx cap doctor
```
