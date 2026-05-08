/**
 * PlainPath — App Store Screenshot Generator
 *
 * Produces 5 App Store-ready PNGs at 1242×2688 px (iPhone 6.5" @3x).
 * Uses Playwright with Clerk + entitlements mocked (same pattern as E2E tests).
 *
 * Usage:
 *   node scripts/take-screenshots.mjs
 *
 * Output:
 *   docs/app-store-screenshots/plainpath-01-analyze-upload.png
 *   docs/app-store-screenshots/plainpath-02-analyze-results.png
 *   docs/app-store-screenshots/plainpath-03-contract-review-upload.png
 *   docs/app-store-screenshots/plainpath-04-contract-review-results.png
 *   docs/app-store-screenshots/plainpath-05-upgrade-subscription.png
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROMIUM_EXEC =
  "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
const CLERK_MOCK_PATH = path.join(__dirname, "../e2e/fixtures/clerk-mock.js");
const OUT_DIR = path.join(__dirname, "../docs/app-store-screenshots");
const BASE_URL = "http://localhost:80";

// iPhone 6.5" App Store dimensions: 1242×2688 = 414×896 logical @3x DPR
const VIEWPORT = { width: 414, height: 896 };
const DEVICE_SCALE_FACTOR = 3;

const MOCK_ENTITLEMENTS_PRO = {
  found: true,
  status: "active",
  plan: "pro",
  role: "admin",
  accessTier: "pro",
  source: "screenshot",
};

const MOCK_ENTITLEMENTS_FREE = {
  found: false,
  status: "inactive",
  plan: null,
  role: null,
  accessTier: "free",
  source: "screenshot",
};

fs.mkdirSync(OUT_DIR, { recursive: true });

async function setupPage(browser, planMock = MOCK_ENTITLEMENTS_PRO) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    colorScheme: "light",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  // Inject Clerk mock (same as E2E tests)
  const clerkMockCode = fs.readFileSync(CLERK_MOCK_PATH, "utf-8");
  await page.addInitScript(clerkMockCode);

  // Suppress first-run onboarding overlay
  await page.addInitScript(() => {
    localStorage.setItem("pp-onboarded-v1", "1");
  });

  // Mock entitlements
  await page.route("**/api/entitlements/status**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(planMock),
    })
  );
  await page.route("**/api/entitlements/bootstrap**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    })
  );
  await page.route("**/api/entitlements/consume**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, remaining: 999 }),
    })
  );
  await page.route("**/api/entitlements/consume-analysis**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, remaining: 999 }),
    })
  );

  // Block Clerk network calls
  await page.route(
    (url) => url.hostname.includes("clerk.plainpathapp.com"),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "/* clerk mock active */",
      })
  );

  return { page, context };
}

async function dismissCookieBanner(page) {
  try {
    // Click the "Got it" button on the cookie consent banner if visible
    const gotIt = page.locator('button:has-text("Got it")');
    if (await gotIt.isVisible({ timeout: 2000 })) {
      await gotIt.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // Banner not present — continue
  }
}

async function shot(page, filename, waitMs = 4000) {
  await page.waitForTimeout(waitMs);
  // Dismiss cookie consent banner
  await dismissCookieBanner(page);
  // Hide test-user UI artifacts not suitable for App Store screenshots
  await page.evaluate(() => {
    // Suppress the "QT" user avatar / notification dot in header
    document.querySelectorAll('[data-testid="error-banner"], .dev-banner').forEach((el) => el.remove());
    // Hide the Clerk user button badge (orange notification dot on avatar)
    document.querySelectorAll(".cl-userButtonBox, .cl-userButton").forEach((el) => {
      el.style.display = "none";
    });
    // Also find any element that shows the user avatar initials "QT"
    document.querySelectorAll("button").forEach((btn) => {
      const text = btn.textContent?.trim();
      if (text === "QT" || btn.querySelector(".cl-userButtonAvatarBox")) {
        btn.style.visibility = "hidden";
      }
    });
  });
  const outPath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: outPath, type: "png", fullPage: false });
  console.log(`✓ ${filename} (${VIEWPORT.width * DEVICE_SCALE_FACTOR}×${VIEWPORT.height * DEVICE_SCALE_FACTOR}px)`);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // ── Screenshot 1: Analyze upload/input screen ─────────────────────────
    console.log("\n[1/5] Analyze — upload/input screen");
    {
      const { page, context } = await setupPage(browser, MOCK_ENTITLEMENTS_PRO);
      await page.goto(`${BASE_URL}/app/analyze`);
      await page.waitForTimeout(6000);
      // If redirected to sign-in, the mock should have resolved it
      // Scroll to top to show the upload area
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, "plainpath-01-analyze-upload.png", 1000);
      await context.close();
    }

    // ── Screenshot 2: Analyze results screen ─────────────────────────────
    console.log("\n[2/5] Analyze — results screen");
    {
      const { page, context } = await setupPage(browser, MOCK_ENTITLEMENTS_PRO);
      await page.goto(`${BASE_URL}/demo/analyze`);
      await page.waitForTimeout(5000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, "plainpath-02-analyze-results.png", 1000);
      await context.close();
    }

    // ── Screenshot 3: Contract Review upload/input screen ─────────────────
    console.log("\n[3/5] Contract Review — upload/input screen");
    {
      const { page, context } = await setupPage(browser, MOCK_ENTITLEMENTS_PRO);
      await page.goto(`${BASE_URL}/app/contract-review`);
      await page.waitForTimeout(6000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, "plainpath-03-contract-review-upload.png", 1000);
      await context.close();
    }

    // ── Screenshot 4: Contract Review results / clause cards ──────────────
    console.log("\n[4/5] Contract Review — results / clause cards");
    {
      const { page, context } = await setupPage(browser, MOCK_ENTITLEMENTS_PRO);
      await page.goto(`${BASE_URL}/demo/contract-review`);
      await page.waitForTimeout(5000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, "plainpath-04-contract-review-results.png", 1000);
      await context.close();
    }

    // ── Screenshot 5: Upgrade / subscription screen ───────────────────────
    console.log("\n[5/5] Upgrade / subscription screen");
    {
      const { page, context } = await setupPage(browser, MOCK_ENTITLEMENTS_FREE);
      await page.goto(`${BASE_URL}/app/upgrade`);
      await page.waitForTimeout(6000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, "plainpath-05-upgrade-subscription.png", 1000);
      await context.close();
    }

    console.log(`\n✅ All 5 screenshots saved to docs/app-store-screenshots/`);
    console.log(`   Dimensions: ${VIEWPORT.width * DEVICE_SCALE_FACTOR}×${VIEWPORT.height * DEVICE_SCALE_FACTOR}px PNG (App Store 6.5" slot)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Screenshot script failed:", err);
  process.exit(1);
});
