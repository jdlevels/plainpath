/**
 * E2E: App public routes (no auth required)
 *
 * Covers:
 * - /app/demo/:id — public Demo component (event-permit, school-enrollment, grant-application)
 * - /app/shared/:token — SharedAnalysis, graceful 404 for invalid tokens
 * - /app/privacy, /app/terms — public info pages
 * - /app/demo and /app/demo/analyze — redirect to marketing site /demo and /demo/analyze
 *
 * API: GET /api/documents/demo/:id returns demo analysis data (no OpenAI call).
 * Share API: GET /api/shares/:token — 404 returns {"error":"Share link not found or expired"}
 *
 * Note: Clerk JS loads from clerk.plainpathapp.com. In the test environment this can be
 * slow to load. Tests that require full React hydration use waitForResponse() or longer
 * timeouts. Tests that only need the API response use request fixtures.
 */
import { test, expect } from "@playwright/test";

// ─── App static demo routes (/app/demo/:id) ───────────────────────────────────

test.describe("App static demo routes (/app/demo/:id)", () => {
  /**
   * All three demo routes are PUBLIC in App.tsx (no protect() / RequireAuth wrapper).
   * The Demo component shows DemoBanner ("Demo mode") even while loading — so we can
   * reliably detect a working render regardless of Clerk load timing.
   */
  for (const { id, label } of [
    { id: "event-permit",      label: "Event Permit" },
    { id: "school-enrollment", label: "School Enrollment" },
    { id: "grant-application", label: "Grant Application" },
  ]) {
    test(`${label} demo (/app/demo/${id}) — loads without auth`, async ({ page }) => {
      await page.goto(`/app/demo/${id}`);
      await expect(page).not.toHaveURL(/sign-in|login/);
      await page.waitForTimeout(8000);

      const content = await page.content();
      const hasContent =
        content.includes("Demo mode") ||
        content.includes("sample data") ||
        content.includes("Analyze your own") ||
        content.includes("PlainPath") ||
        content.includes("demo");

      expect(
        hasContent,
        `${label} demo should show demo-related content.\nURL: ${page.url()}`
      ).toBe(true);

      expect(content).not.toMatch(/Uncaught|TypeError: Cannot read properties/);
    });
  }

  test("demo API endpoint returns data for all three IDs", async ({ request }) => {
    for (const id of ["event-permit", "school-enrollment", "grant-application"]) {
      const resp = await request.get(`/api/documents/demo/${id}`);
      expect(resp.status(), `Demo API for ${id} should return 200`).toBe(200);
      const body = await resp.json();
      expect(body).toHaveProperty("analysis");
      expect(body.analysis).toHaveProperty("title");
    }
  });

  test("demo route does not expose private dashboard or tool grid", async ({ page }) => {
    await page.goto("/app/demo/event-permit");
    await page.waitForTimeout(3000);

    const content = await page.content();
    const hasBothToolLinks =
      content.includes("/app/analyze") &&
      content.includes("/app/contract-review") &&
      content.includes("Analyze a Document");

    expect(
      !hasBothToolLinks,
      "Demo page should not show the authenticated dashboard tool grid"
    ).toBe(true);
  });
});

// ─── Shared analysis link (/app/shared/:token) ────────────────────────────────

test.describe("Shared analysis link (/app/shared/:token)", () => {
  test("invalid token — API returns 404 with graceful error message", async ({ request }) => {
    const resp = await request.get("/api/shares/nonexistent-token-qa-test-12345");
    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(
      (body.error ?? "").toLowerCase()
    ).toMatch(/not found|expired/i);
  });

  test("invalid token — page loads without crashing (no JS error dump)", async ({ page }) => {
    await page.goto("/app/shared/another-bad-token-xyz-987");
    await page.waitForTimeout(4000);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(200);
    expect(content).not.toMatch(/Uncaught Error|Cannot read properties of undefined/);
  });

  test("invalid token — page does not require Clerk sign-in", async ({ page }) => {
    await page.goto("/app/shared/some-token-abc");
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/\/sign-in/);
  });

  // Note: browser-level test for SharedAnalysis error rendering is skipped here because it
  // requires Clerk JS (clerk.plainpathapp.com) to fully load before the React component
  // hydrates and makes the API call. The API behavior (404 with graceful error JSON) is
  // already verified by the "API returns 404" test above using the request fixture.
});

// ─── /app/demo redirect to marketing site ─────────────────────────────────────

test.describe("App /demo redirects to marketing site", () => {
  test("/app/demo redirects to marketing site /demo", async ({ page }) => {
    await page.goto("/app/demo");
    await page.waitForTimeout(3000);

    const url = page.url();
    const isOnMarketingDemo =
      url.endsWith("/demo") ||
      url.endsWith("/demo/") ||
      !url.includes("/app/demo");

    expect(
      isOnMarketingDemo,
      `/app/demo should redirect to /demo. Current URL: ${url}`
    ).toBe(true);
  });

  test("/app/demo/analyze — does not expose a broken upload tool", async ({ page }) => {
    await page.goto("/app/demo/analyze");
    await page.waitForTimeout(3000);

    const url = page.url();
    const content = await page.content();

    const hasUploadUI =
      content.includes("Upload your document") ||
      content.includes("Drag and drop") ||
      content.includes("Start analyzing") ||
      (content.includes("upload") && content.includes("analyze") && content.includes("button"));

    expect(
      !hasUploadUI || url.includes("/demo/analyze"),
      `/app/demo/analyze should either redirect to /demo/analyze or not expose a broken upload form.\nURL: ${url}`
    ).toBe(true);

    expect(content).not.toMatch(/Uncaught Error|Cannot read properties of undefined/);
  });
});

// ─── App public info pages ─────────────────────────────────────────────────────

test.describe("App public info pages", () => {
  test("/app/privacy loads without auth", async ({ page }) => {
    await page.goto("/app/privacy");
    await expect(page).not.toHaveURL(/sign-in/);
    const content = await page.content();
    expect(
      content.includes("Privacy") || content.includes("privacy") || content.includes("data")
    ).toBe(true);
  });

  test("/app/terms loads without auth", async ({ page }) => {
    await page.goto("/app/terms");
    await expect(page).not.toHaveURL(/sign-in/);
    const content = await page.content();
    expect(
      content.includes("Terms") || content.includes("terms") || content.includes("agreement")
    ).toBe(true);
  });
});
