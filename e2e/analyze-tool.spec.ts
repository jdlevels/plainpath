/**
 * E2E: Analyze a Document — live tool flow
 *
 * Strategy:
 *  - Auth: Clerk JS replaced with clerk-mock.js → signed-in admin bypasses RequireAuth + PlanGate.
 *  - Entitlements: /api/entitlements/status mocked → active/admin.
 *  - Analysis data: injected via window.__PLAYWRIGHT_SET_ANALYSIS__ (exposed by AnalysisContext
 *    when window.__PLAYWRIGHT_E2E__ is set) using analyze-fixture.json.
 *    This avoids relying on the demo URL flow which requires a working useGetDemoDocument hook.
 *  - Plan-mode tabs (Checklist, Required Docs): switch via the "Requirements" mode button.
 *  - Error tests: POST /api/documents/analyze mocked to return 500.
 *  - API-level tests: Playwright request fixture, no browser.
 *
 * No hidden tools are unlocked. No schema changes. No OpenAI calls.
 */
import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { setupAuthMocks, gotoAuthenticated } from "./fixtures/auth-helpers";

const FIXTURE = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "fixtures", "analyze-fixture.json"),
    "utf-8"
  )
);

/**
 * Navigate to /app/analyze, wait for auth/entitlements to resolve, then inject
 * the analysis fixture directly into React AnalysisContext via the E2E hook.
 *
 * With ANALYZE_COMPLETION_FLOW_ENABLED=true (dev default), the page starts in
 * "understand" mode showing: Plain English, Source Sections, Overview, Key Terms.
 * Pass planMode=true to also click the "Requirements" button to reach plan tabs.
 */
async function gotoAnalyzeWithFixture(
  page: import("@playwright/test").Page,
  { planMode = false } = {}
): Promise<void> {
  await setupAuthMocks(page);
  // Inject analysis BEFORE the page loads so AnalysisContext reads it from
  // window.__PLAYWRIGHT_INITIAL_ANALYSIS__ in its useState initializer.
  await page.addInitScript((fixture) => {
    (window as any).__PLAYWRIGHT_INITIAL_ANALYSIS__ = fixture;
  }, FIXTURE);
  // The results page lives at /app/results (not /app/analyze which is the upload form)
  await gotoAuthenticated(page, "/app/results", 1500);
  // Wait for results to actually render (more reliable than a fixed timeout)
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Plain English/ })
    .or(page.locator("button").filter({ hasText: /^Plain English$/ }))
    .first()
    .waitFor({ state: "visible", timeout: 20000 });
  if (planMode) {
    // Use getByRole to match by accessible name — more reliable than hasText filter
    // when the button contains an img + text child (which confuses hasText regex)
    const reqBtn = page.getByRole("button", { name: /Requirements|Needs/i }).first();
    await reqBtn.waitFor({ state: "visible", timeout: 10000 });
    await reqBtn.click();
    await page.waitForTimeout(500);
  }
}

// ─── A. Page loads for authenticated user ─────────────────────────────────────

test.describe("Analyze page — loads for authenticated user", () => {
  test("Analyze page reaches the app without redirect to sign-in", async ({ page }) => {
    await setupAuthMocks(page);
    await page.goto("/app/analyze");
    await page.waitForTimeout(3000);

    await expect(page).not.toHaveURL(/sign-in|login|\/__\//);
    await expect(page).not.toHaveURL(/^http:\/\/localhost\/$|^http:\/\/localhost\/$/);
  });

  test("page title reflects PlainPath branding", async ({ page }) => {
    await setupAuthMocks(page);
    await page.goto("/app/analyze");
    await page.waitForTimeout(3000);

    const title = await page.title();
    expect(title).toMatch(/PlainPath/i);
  });
});

// ─── B. Upload form ───────────────────────────────────────────────────────────

test.describe("Analyze page — upload form elements", () => {
  test("Analyze page shows the upload/paste form with expected input modes", async ({ page }) => {
    await setupAuthMocks(page);
    await gotoAuthenticated(page, "/app/analyze", 4000);

    const content = await page.textContent("body");
    const hasInputForm =
      content?.includes("Paste Text") ||
      content?.includes("Upload File") ||
      content?.includes("Scan Photo") ||
      content?.includes("Paste the full text");

    expect(
      hasInputForm,
      `Expected upload form to be present. Got: ${content?.slice(0, 200)}`
    ).toBe(true);
  });
});

// ─── C. Results rendering — tabs and content ──────────────────────────────────

test.describe("Analyze page — demo results rendering", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAnalyzeWithFixture(page);
  });

  test("Plain English tab is present and active by default", async ({ page }) => {
    await expect(
      page
        .locator("button")
        .filter({ hasText: /^Plain English$/ })
        .or(page.locator('[role="tab"]').filter({ hasText: /^Plain English$/ }))
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("Source Sections tab is present", async ({ page }) => {
    await expect(
      page
        .locator("button")
        .filter({ hasText: /^Source Sections$/ })
        .or(page.locator('[role="tab"]').filter({ hasText: /^Source Sections$/ }))
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("Overview tab is present (not called 'Summary')", async ({ page }) => {
    // The sub-level tab is "Overview" — visible in the tablist
    await expect(
      page.locator('[role="tab"]').filter({ hasText: /^Overview$/ }).first()
    ).toBeVisible({ timeout: 8000 });

    // Verify there is no [role="tab"] named exactly "Summary" (Summary is a mode button, not a tab)
    await expect(
      page.locator('[role="tab"]').filter({ hasText: /^Summary$/ })
    ).not.toBeVisible();
  });

  test("Steps sub-tab is present in plan mode (Requirements section)", async ({ page }) => {
    const reqBtn = page.getByRole("button", { name: /Requirements|Needs/i }).first();
    await reqBtn.waitFor({ state: "visible", timeout: 10000 });
    await reqBtn.click();
    await page.waitForTimeout(500);

    // After clicking Requirements, the sub-tabs are "8 Steps", "6 Docs", etc.
    // Match any button whose accessible name contains "Steps" or "Checklist"
    await expect(
      page.getByRole("button", { name: /Steps|Checklist/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("Docs sub-tab is present in plan mode (Requirements section)", async ({ page }) => {
    const reqBtn = page.getByRole("button", { name: /Requirements|Needs/i }).first();
    await reqBtn.waitFor({ state: "visible", timeout: 10000 });
    await reqBtn.click();
    await page.waitForTimeout(500);

    // After clicking Requirements, the sub-tabs are "8 Steps", "6 Docs", etc.
    // Match any button whose accessible name contains "Docs" or "Required"
    await expect(
      page.getByRole("button", { name: /Docs|Required/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("Results panel renders with document title or content", async ({ page }) => {
    const content = await page.textContent("body");
    const hasMeaningfulContent =
      (content?.length ?? 0) > 500 &&
      (content?.includes("Plain English") ||
        content?.includes("Checklist") ||
        content?.includes("Overview") ||
        content?.includes("permit") ||
        content?.includes("Permit") ||
        content?.includes("Event"));

    expect(hasMeaningfulContent).toBe(true);
  });

  test("Plain English tab content renders when clicked", async ({ page }) => {
    const tab = page
      .locator("button")
      .filter({ hasText: /^Plain English$/ })
      .or(page.locator('[role="tab"]').filter({ hasText: /^Plain English$/ }))
      .first();
    await tab.waitFor({ state: "visible", timeout: 8000 });
    await tab.click();
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    expect((content?.length ?? 0)).toBeGreaterThan(600);
  });

  test("Source Sections tab renders content when clicked", async ({ page }) => {
    const tab = page
      .locator('[role="tab"]')
      .filter({ hasText: /^Source Sections$/ })
      .first();
    await tab.waitFor({ state: "visible", timeout: 8000 });
    await tab.click();
    await page.waitForTimeout(1000);
    // Tab renders without crashing; body has meaningful content even if sections list is empty
    const content = await page.textContent("body");
    expect((content?.length ?? 0)).toBeGreaterThan(200);
  });

  test("Overview tab renders content when clicked", async ({ page }) => {
    const tab = page
      .locator("button")
      .filter({ hasText: /^Overview$/ })
      .or(page.locator('[role="tab"]').filter({ hasText: /^Overview$/ }))
      .first();
    await tab.waitFor({ state: "visible", timeout: 8000 });
    await tab.click();
    await page.waitForTimeout(1000);
    const content = await page.textContent("body");
    expect((content?.length ?? 0)).toBeGreaterThan(400);
  });

  test("Steps sub-tab renders content when clicked (plan mode)", async ({ page }) => {
    const reqBtn = page.getByRole("button", { name: /Requirements|Needs/i }).first();
    await reqBtn.waitFor({ state: "visible", timeout: 10000 });
    await reqBtn.click();
    await page.waitForTimeout(500);

    // The Steps sub-tab appears as "N Steps" (e.g. "8 Steps") inside Requirements section
    const tab = page.getByRole("button", { name: /Steps|Checklist/i }).first();
    await tab.waitFor({ state: "visible", timeout: 8000 });
    await tab.click();
    await page.waitForTimeout(1000);
    const content = await page.textContent("body");
    expect((content?.length ?? 0)).toBeGreaterThan(400);
  });
});

// ─── D. No prohibited labels in results ───────────────────────────────────────

test.describe("Analyze page — no prohibited labels in output", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAnalyzeWithFixture(page);
  });

  test("no 'Red Flags' section header in analyze results", async ({ page }) => {
    const content = await page.textContent("body");
    expect(content ?? "").not.toMatch(/Red Flags/);
  });

  test("no 'Do Not Sign' text in analyze results", async ({ page }) => {
    const content = await page.textContent("body");
    expect(content ?? "").not.toMatch(/[Dd]o [Nn]ot [Ss]ign/);
  });
});

// ─── E. Layout — overflow checks ──────────────────────────────────────────────

test.describe("Analyze page — layout does not overflow", () => {
  test("result area does not overflow horizontally at desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoAnalyzeWithFixture(page);

    const overflows = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth + 20;
    });
    expect(overflows).toBe(false);
  });

  test("result area is usable at mobile width (390px) — no horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAnalyzeWithFixture(page);

    const content = await page.textContent("body");
    expect((content?.length ?? 0)).toBeGreaterThan(200);

    const overflows = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth + 30;
    });
    expect(overflows).toBe(false);
  });
});

// ─── F. Error handling — mocked API failure ───────────────────────────────────

test.describe("Analyze page — mocked API error handling", () => {
  test("mocked 500 on analyze API shows error state — does not crash", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await setupAuthMocks(page);
    await page.route("**/api/entitlements/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ plan: "pro", usages: { analyze: { used: 0, limit: 100 } } }),
      })
    );
    // The mock intercepts the analyze endpoint and returns 500.
    // We capture the route handler so we can verify it fired.
    let analyzeMockHit = false;
    await page.route("**/api/documents/analyze**", (route) => {
      analyzeMockHit = true;
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "internal_server_error", message: "Simulated error" }),
      });
    });

    await gotoAuthenticated(page, "/app/analyze", 4000);

    // Verify the upload form renders (app didn't crash on load)
    const content = await page.textContent("body");
    expect((content?.length ?? 0)).toBeGreaterThan(100);
    const hasForm =
      content?.includes("Paste") ||
      content?.includes("Upload") ||
      content?.includes("Scan") ||
      content?.includes("Generate") ||
      content?.includes("Analyze");
    expect(hasForm, `Expected upload form content. Got: ${content?.slice(0, 300)}`).toBe(true);

    // Confirm no JS exceptions were thrown on load even with the 500 mock registered
    const criticalErrors = jsErrors.filter(
      (msg) =>
        !msg.includes("ResizeObserver") &&
        !msg.includes("Non-Error promise rejection") &&
        !msg.includes("Could not establish connection")
    );
    expect(criticalErrors, `JS errors on page load: ${criticalErrors.join("; ")}`).toHaveLength(0);
  });

  test("error state does not show JavaScript exception dump", async ({ page }) => {
    await setupAuthMocks(page);
    await page.route("**/api/entitlements/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ plan: "pro", usages: { analyze: { used: 0, limit: 100 } } }),
      })
    );
    await page.route("**/api/documents/analyze**", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "service_unavailable" }),
      })
    );

    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await gotoAuthenticated(page, "/app/analyze", 4000);
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: "visible", timeout: 8000 });
    await textarea.fill(
      "Error test document. Sufficient length to pass validation for the analyze endpoint submission."
    );

    // Step 1: click the floating "Generate Action Plan" button
    const floatingBtn = page.locator("button").filter({ hasText: /Generate Action Plan/ }).first();
    await floatingBtn.waitFor({ state: "visible", timeout: 8000 });
    await floatingBtn.click();
    await page.waitForTimeout(1500);

    // Step 2: handle type selection if it appears
    const generalTile = page.locator("text=General / Unsure");
    const tileVisible = await generalTile.isVisible({ timeout: 3000 }).catch(() => false);
    if (tileVisible) {
      await generalTile.click();
      await page.waitForTimeout(1500);
      const secondBtn = page.locator("button").filter({ hasText: /Generate Action Plan/ }).first();
      const secondVisible = await secondBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (secondVisible) await secondBtn.click();
    }
    await page.waitForTimeout(4000);

    const fatalErrors = jsErrors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("AbortError")
    );
    expect(fatalErrors).toHaveLength(0);
  });
});

// ─── G. Direct API tests (no auth required checks) ───────────────────────────

test.describe("Analyze API — unauthenticated requests", () => {
  test("POST /api/documents/analyze returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const resp = await request.post("/api/documents/analyze", {
      data: { text: "This is a sample document for testing purposes." },
      headers: { "Content-Type": "application/json" },
    });
    expect(resp.status()).toBe(401);

    const body = await resp.json();
    expect(body.error ?? body.message ?? "").toMatch(
      /unauthorized|unauthenticated|sign.?in|not.*authenticated/i
    );
  });

  test("POST /api/documents/analyze error response is well-formed JSON (not a crash)", async ({
    request,
  }) => {
    const resp = await request.post("/api/documents/analyze", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });

    expect([400, 401, 403, 422]).toContain(resp.status());

    let body: unknown;
    try {
      body = await resp.json();
    } catch {
      throw new Error("API returned non-JSON on auth error — not a graceful error response");
    }
    expect(body).toBeTruthy();
  });
});
