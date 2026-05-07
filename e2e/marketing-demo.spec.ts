/**
 * E2E: Marketing site demo pages
 *
 * Covers:
 * - /demo landing: loads publicly, shows both live tools
 * - /demo/contract-review: pre-populated results, correct structure, no prohibited language
 * - /demo/analyze: loads publicly
 * - Retired demo pages redirect to /demo (not leaked)
 */
import { test, expect } from "@playwright/test";

const PROHIBITED_TEXT = [
  "Do Not Sign",
  "do not sign",
];

test.describe("Demo Landing (/demo)", () => {
  test("loads publicly — no auth wall", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).not.toHaveURL(/sign-in|login/);
    await expect(page.locator("text=See PlainPath in action").first()).toBeVisible();
  });

  test("shows both live tools — Analyze and Contract Review", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("text=Analyze a Document").first()).toBeVisible();
    await expect(page.locator("text=Contract Review").first()).toBeVisible();
  });
});

test.describe("Contract Review Demo (/demo/contract-review)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo/contract-review");
    await expect(page).not.toHaveURL(/sign-in|login/);
  });

  test("loads publicly — no auth wall", async ({ page }) => {
    await expect(page.locator("text=Contract Review").first()).toBeVisible();
  });

  test("Fairness Score section renders", async ({ page }) => {
    await expect(page.locator("text=Fairness Score").first()).toBeVisible();
    await expect(page.locator("text=/ 100").first()).toBeVisible();
  });

  test("summary verdict renders", async ({ page }) => {
    await expect(
      page.locator("text=Several clauses need clarification").first()
    ).toBeVisible();
  });

  test("clause cards render with ratings", async ({ page }) => {
    await expect(page.locator("text=Needs Attention").first()).toBeVisible();
    await expect(page.locator("text=Watch Out").first()).toBeVisible();
    await expect(page.locator("text=Non-compete clause").first()).toBeVisible();
  });

  test("Questions to Ask section appears on clause cards", async ({ page }) => {
    await expect(
      page.locator("text=Questions to Ask").first()
    ).toBeVisible();
  });

  test("Before You Sign section renders", async ({ page }) => {
    await expect(
      page.locator("text=Before You Sign").first()
    ).toBeVisible();
  });

  test("Items This Contract Is Missing section renders", async ({ page }) => {
    await expect(
      page.locator("text=Items This Contract Is Missing").first()
    ).toBeVisible();
  });

  test("legal disclaimer renders", async ({ page }) => {
    await expect(
      page.locator("text=Not legal advice").first()
    ).toBeVisible();
  });

  for (const prohibited of PROHIBITED_TEXT) {
    test(`prohibited text "${prohibited}" does NOT appear`, async ({ page }) => {
      const content = await page.content();
      expect(content.toLowerCase()).not.toContain(prohibited.toLowerCase());
    });
  }

  test("Key Clauses section header renders (not 'Red Flags')", async ({ page }) => {
    await expect(page.locator("text=Key Clauses").first()).toBeVisible();
    const content = await page.content();
    expect(content).not.toMatch(/\bRed Flags\b/);
  });
});

test.describe("Analyze Demo (/demo/analyze)", () => {
  test("loads publicly — no auth wall", async ({ page }) => {
    await page.goto("/demo/analyze");
    await expect(page).not.toHaveURL(/sign-in|login/);
    await expect(page).not.toHaveURL(/\/demo$/);
  });
});

test.describe("Retired demo routes redirect to /demo", () => {
  const retiredRoutes = [
    "/demo/trust-check",
    "/demo/build-contract",
    "/demo/redact",
    "/demo/compare",
    "/demo/clause-extractor",
    "/demo/ask-document",
    "/demo/builder",
  ];

  for (const route of retiredRoutes) {
    test(`${route} redirects to /demo (not a usable tool)`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/demo\/?$/);
      await expect(page.locator("text=See PlainPath in action").first()).toBeVisible();
    });
  }
});

test.describe("Mobile viewport — demo pages", () => {
  test.use({ viewport: { width: 400, height: 720 } });

  test("Contract Review demo is readable on mobile", async ({ page }) => {
    await page.goto("/demo/contract-review");
    await expect(page.locator("text=Fairness Score").first()).toBeVisible();
    await expect(page.locator("text=Before You Sign").first()).toBeVisible();
    const body = page.locator("body");
    const box = await body.boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(420);
    }
  });

  test("Demo landing is readable on mobile", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("text=Analyze a Document").first()).toBeVisible();
    await expect(page.locator("text=Contract Review").first()).toBeVisible();
  });
});
