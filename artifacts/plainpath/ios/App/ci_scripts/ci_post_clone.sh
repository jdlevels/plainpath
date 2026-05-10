#!/bin/sh
set -e

# ─── Xcode Cloud: ci_post_clone.sh ───────────────────────────────────────────
#
# Runs automatically after Xcode Cloud clones the repo, before Xcode builds.
#
# What this does:
#   1. Ensures Node.js is available (Xcode Cloud images include it)
#   2. Installs pnpm (not pre-installed on Xcode Cloud)
#   3. Installs all pnpm workspace dependencies from the monorepo root
#   4. Builds the React/Vite web app  →  artifacts/plainpath/dist/public/
#   5. Runs cap sync ios             →  copies dist/public into ios/App/App/public/
#      (this is the folder that is gitignored — it must be generated here)
#
# Environment variables set by Xcode Cloud:
#   CI_WORKSPACE  — absolute path to the cloned repository root
#   CI_BUILD_ID   — unique build identifier (used for logging)
#
# ─────────────────────────────────────────────────────────────────────────────

echo "=== PlainPath ci_post_clone.sh — build $CI_BUILD_ID ==="
echo "    Workspace: $CI_WORKSPACE"

# ── 1. Verify Node.js ─────────────────────────────────────────────────────────
# Xcode Cloud images include Node.js. If for any reason it is absent,
# install it via Homebrew (also pre-installed on Xcode Cloud).

if ! command -v node >/dev/null 2>&1; then
  echo "[ci] Node.js not found — installing via Homebrew..."
  brew install node
else
  echo "[ci] Node.js: $(node --version)"
fi

# ── 2. Install pnpm ───────────────────────────────────────────────────────────
# pnpm is not pre-installed on Xcode Cloud. Install the version that matches
# the monorepo's packageManager field in package.json.

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[ci] Installing pnpm..."
  npm install -g pnpm
else
  echo "[ci] pnpm: $(pnpm --version)"
fi

# ── 3. Install workspace dependencies ─────────────────────────────────────────
# Must run from the monorepo root so all workspace packages resolve correctly.

echo "[ci] Installing dependencies..."
cd "$CI_WORKSPACE"
pnpm install --frozen-lockfile

# ── 4. Build the web app ──────────────────────────────────────────────────────
# Outputs to:  artifacts/plainpath/dist/public/
# This is a production Vite build — same as the deployed web version.

echo "[ci] Building web assets..."
pnpm --filter @workspace/plainpath build

# ── 5. Sync web assets into the iOS project ───────────────────────────────────
# Copies dist/public → ios/App/App/public/
# Also writes capacitor.config.json and updates Package.swift plugin list.
# The public/ folder is gitignored (generated) — this step is required.

echo "[ci] Running cap sync ios..."
cd "$CI_WORKSPACE/artifacts/plainpath"
npx cap sync ios --no-open

echo "=== ci_post_clone.sh complete ==="
