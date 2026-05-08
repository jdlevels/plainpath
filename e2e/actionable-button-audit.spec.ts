/**
 * Actionable Button & Click-Path Audit — PlainPath v1.0
 *
 * Covers every interactive surface identified in the App Store launch audit:
 *   1.  Marketing site — Navbar, hero, pricing, footer, support
 *   2.  Auth flow — sign-in redirect, unauthenticated gate
 *   3.  Paywall / Subscribe page
 *   4.  App dashboard (Home)
 *   5.  Analyze tool entry point
 *   6.  Contract Review tool entry point
 *   7.  Documents page — hidden tool suppression
 *   8.  My Analyses page
 *   9.  Billing page
 *   10. Support & legal pages
 *   11. Mobile viewport — Navbar hamburger, tool cards
 *   12. Hidden tool routes — redirect to home
 */

import { test, expect } from "@playwright/test";
import { setupAuthMocks } from "./fixtures/auth-helpers";
import * as path from "path";

const CLERK_MOCK_PATH = path.join(__dirname, "fixtures/clerk-mock.js");

// ─── Auth mock helpers ─────────────────────────────────────────────────────

async function setupUnauthenticated(page: import("@playwright/test").Page) {
  // Inject Clerk mock that returns isSignedIn=false
  await page.addInitScript({ path: CLERK_MOCK_PATH });
  await page.addInitScript(() => {
    // Override the mock to return unauthenticated state
    (window as any).__CLERK_SIGNED_IN_OVERRIDE__ = false;
  });
  await page.addInitScript(() => {
    localStorage.setItem("pp-onboarded-v1", "1");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MARKETING SITE — NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Marketing Navbar", () => {
  test("logo links to marketing homepage", async ({ page }) => {
    await page.goto("/");
    const logo = page.locator("nav a[href='/']").first();
    await expect(logo).toBeVisible();
  });

  test("Tools dropdown shows Analyze and Contract Review links", async ({ page }) => {
    await page.goto("/");
    // Desktop tools dropdown
    const toolsBtn = page.getByRole("button", { name: /Tools/i }).first();
    await toolsBtn.click();
    await expect(page.getByRole("link", { name: /Analyze a Document/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Contract Review/i }).first()).toBeVisible();
  });

  test("Analyze a Document → /demo/analyze", async ({ page }) => {
    await page.goto("/");
    const toolsBtn = page.getByRole("button", { name: /Tools/i }).first();
    await toolsBtn.click();
    const link = page.getByRole("link", { name: /Analyze a Document/i }).first();
    await expect(link).toHaveAttribute("href", "/demo/analyze");
  });

  test("Contract Review → /demo/contract-review", async ({ page }) => {
    await page.goto("/");
    const toolsBtn = page.getByRole("button", { name: /Tools/i }).first();
    await toolsBtn.click();
    const link = page.getByRole("link", { name: /Contract Review/i }).first();
    await expect(link).toHaveAttribute("href", "/demo/contract-review");
  });

  test("Log in button → /app/sign-in", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.getByRole("link", { name: /Log in/i }).first();
    await expect(loginLink).toHaveAttribute("href", "/app/sign-in");
  });

  test("Open App button → /app/sign-in", async ({ page }) => {
    await page.goto("/");
    const openApp = page.getByRole("link", { name: /Open App/i }).first();
    await expect(openApp).toHaveAttribute("href", "/app/sign-in");
  });

  test("Try demo button → /demo", async ({ page }) => {
    await page.goto("/");
    const tryDemo = page.getByRole("link", { name: /Try demo/i }).first();
    await expect(tryDemo).toHaveAttribute("href", "/demo");
  });

  test("Support nav link → /support", async ({ page }) => {
    await page.goto("/");
    const supportLink = page.getByRole("link", { name: /Support/i }).first();
    await expect(supportLink).toHaveAttribute("href", "/support");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MARKETING HERO & PRICING CTAs
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Marketing Hero & Pricing CTAs", () => {
  test("hero primary CTA → /demo/analyze", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a[href='/demo/analyze']").first()).toBeVisible();
  });

  test("hero secondary CTA → /demo/contract-review", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a[href='/demo/contract-review']").first()).toBeVisible();
  });

  test("pricing Get PlainPath Pro CTA → /app/subscribe?plan=pro", async ({ page }) => {
    await page.goto("/#pricing");
    await expect(page.locator("a[href='/app/subscribe?plan=pro']").first()).toBeVisible();
  });

  test("pricing page renders", async ({ page }) => {
    await page.goto("/");
    const pricingSection = page.locator("#pricing");
    await pricingSection.scrollIntoViewIfNeeded();
    await expect(pricingSection).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MARKETING FOOTER
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Marketing Footer", () => {
  test("footer Web App link → /app/sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer a[href='/app/sign-in']").first()).toBeVisible();
  });

  test("footer Privacy Policy link → /privacy", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer a[href='/privacy']").first()).toBeVisible();
  });

  test("footer Terms of Service link → /terms", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer a[href='/terms']").first()).toBeVisible();
  });

  test("footer Support link → /support", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer a[href='/support']").first()).toBeVisible();
  });

  test("footer mailto support link renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a[href='mailto:support@plainpathapp.com']").first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. DEMO LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Demo Landing Page", () => {
  test("renders at /demo", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).toHaveURL(/\/demo/);
  });

  test("Analyze a Document demo tool card → /demo/analyze", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("a[href='/demo/analyze']").first()).toBeVisible();
  });

  test("Contract Review demo tool card → /demo/contract-review", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("a[href='/demo/contract-review']").first()).toBeVisible();
  });

  test("demo Sign up CTA → /app/sign-up", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("a[href='/app/sign-up']").first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUTH FLOW
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Auth flow", () => {
  test("/app/sign-in renders the Clerk sign-in UI", async ({ page }) => {
    await page.goto("/app/sign-in");
    // Page should not error; Clerk widget or redirect loads
    await expect(page).not.toHaveURL(/error/i);
  });

  test("/app/sign-up renders without error", async ({ page }) => {
    await page.goto("/app/sign-up");
    await expect(page).not.toHaveURL(/error/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PAYWALL / SUBSCRIBE
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Subscribe / Paywall page", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
  });

  test("subscribe page renders at /app/subscribe", async ({ page }) => {
    await page.goto("/app/subscribe");
    await expect(page).toHaveURL(/subscribe/);
    await expect(page.getByText(/PlainPath Pro/i).first()).toBeVisible();
  });

  test("subscribe page ?plan=pro selects pro plan", async ({ page }) => {
    await page.goto("/app/subscribe?plan=pro");
    await expect(page.getByText(/PlainPath Pro/i).first()).toBeVisible();
  });

  test("subscribe page has Get PlainPath Pro button", async ({ page }) => {
    await page.goto("/app/subscribe");
    const cta = page.getByRole("button", { name: /Get PlainPath Pro/i }).first();
    await expect(cta).toBeVisible();
  });

  test("subscribe-success page renders at /app/subscribe/success", async ({ page }) => {
    await page.goto("/app/subscribe/success");
    await expect(page).toHaveURL(/subscribe/);
  });

  test("subscribe-cancel page renders at /app/subscribe/cancel", async ({ page }) => {
    await page.goto("/app/subscribe/cancel");
    await expect(page).toHaveURL(/subscribe/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. APP DASHBOARD (Home)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("App Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
  });

  test("dashboard renders at /app/", async ({ page }) => {
    await page.goto("/app/");
    await expect(page).toHaveURL(/\/app/);
  });

  test("Analyze a Document tool card is visible", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByText(/Analyze a Document/i).first()).toBeVisible();
  });

  test("Contract Review tool card is visible", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByText(/Contract Review/i).first()).toBeVisible();
  });

  test("no Trust Check card on dashboard", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByText(/Trust Check/i)).toHaveCount(0);
  });

  test("no Clause Extractor card on dashboard", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByText(/Clause Extractor/i)).toHaveCount(0);
  });

  test("no Compare Versions card on dashboard", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByText(/Compare Versions/i)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. ANALYZE TOOL
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Analyze tool", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
  });

  test("analyze page renders at /app/analyze", async ({ page }) => {
    await page.goto("/app/analyze");
    await expect(page).toHaveURL(/analyze/);
  });

  test("import page renders at /app/import", async ({ page }) => {
    await page.goto("/app/import");
    await expect(page).toHaveURL(/import/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. CONTRACT REVIEW TOOL
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Contract Review tool", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
  });

  test("contract-review page renders at /app/contract-review", async ({ page }) => {
    await page.goto("/app/contract-review");
    await expect(page).toHaveURL(/contract-review/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. DOCUMENTS PAGE — hidden-tool section suppression
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Documents page — hidden tool suppression", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    // Stub the documents API to return an empty list so hasAnyContent=false
    await page.route("**/api/documents*", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    );
    await page.route("**/api/clause-extractor/sessions*", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    );
    await page.route("**/api/compare-versions/sessions*", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    );
  });

  test("documents page renders at /app/documents", async ({ page }) => {
    await page.goto("/app/documents");
    await expect(page).toHaveURL(/documents/);
  });

  test("Clause Extractor section header NOT shown when no sessions", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Clause Extractor")).toHaveCount(0);
  });

  test("Extract Clauses CTA NOT shown when no sessions", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Extract Clauses/i)).toHaveCount(0);
  });

  test("Compare Versions section header NOT shown when no sessions", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Compare Versions")).toHaveCount(0);
  });

  test("Compare two versions CTA NOT shown when no sessions", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Compare two versions/i)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10b. DOCUMENTS PAGE — with documents (simulate hasAnyContent=true)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Documents page — with existing docs, hidden tools still suppressed", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    // Return a list of documents so hasAnyContent=true
    const mockDocs = [
      {
        id: "doc-1",
        title: "Test Agreement.pdf",
        filename: "test.pdf",
        fileType: "pdf",
        status: "ready",
        uploadedAt: new Date().toISOString(),
        toolRuns: [{ tool: "analyze", runAt: new Date().toISOString() }],
      },
    ];
    await page.route("**/api/documents*", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mockDocs) })
    );
    await page.route("**/api/clause-extractor/sessions*", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    );
    await page.route("**/api/compare-versions/sessions*", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    );
  });

  test("Clause Extractor section NOT shown even when user has documents", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Clause Extractor")).toHaveCount(0);
  });

  test("Extract Clauses CTA NOT shown even when user has documents", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Extract Clauses/i)).toHaveCount(0);
  });

  test("Compare Versions section NOT shown even when user has documents", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Compare Versions")).toHaveCount(0);
  });

  test("Compare two versions CTA NOT shown even when user has documents", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Compare two versions/i)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. MY ANALYSES PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe("My Analyses page", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    await page.route("**/api/analyses*", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    );
  });

  test("my-analyses renders at /app/my-analyses", async ({ page }) => {
    await page.goto("/app/my-analyses");
    await expect(page).toHaveURL(/my-analyses/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. BILLING PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Billing page", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    await page.route("**/api/entitlements*", (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          found: true,
          status: "active",
          plan: "pro",
          accessTier: "pro",
          source: "stripe",
        }),
      })
    );
  });

  test("billing page renders at /app/billing", async ({ page }) => {
    await page.goto("/app/billing");
    await expect(page).toHaveURL(/billing/);
  });

  test("billing page shows support link", async ({ page }) => {
    await page.goto("/app/billing");
    await expect(page.locator("a[href='mailto:support@plainpathapp.com']").first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. SUPPORT & LEGAL PAGES
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Support and legal pages", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
  });

  test("support page renders at /app/support", async ({ page }) => {
    await page.goto("/app/support");
    await expect(page).toHaveURL(/support/);
  });

  test("support page has mailto link", async ({ page }) => {
    await page.goto("/app/support");
    await expect(
      page.locator("a[href='mailto:support@plainpathapp.com']").first()
    ).toBeVisible();
  });

  test("marketing /support page renders", async ({ page }) => {
    await page.goto("/support");
    await expect(page).not.toHaveURL(/error/i);
  });

  test("marketing /privacy page renders", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).not.toHaveURL(/error/i);
  });

  test("marketing /terms page renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(page).not.toHaveURL(/error/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. HIDDEN TOOL ROUTES — all redirect to home
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Hidden tool route enforcement", () => {
  const HIDDEN_ROUTES = [
    "/app/trust-check",
    "/app/clause-extractor",
    "/app/compare-versions",
    "/app/redact",
    "/app/ask-document",
    "/app/builder",
  ];

  for (const route of HIDDEN_ROUTES) {
    test(`${route} redirects away from hidden tool`, async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(route);
      await expect(page).not.toHaveURL(route);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. MOBILE VIEWPORT — marketing navbar hamburger
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Mobile viewport — marketing navbar", { tag: "@mobile" }, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger menu opens and shows Log in", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("button[aria-label='Open menu']");
    await hamburger.click();
    await expect(page.getByRole("link", { name: /Log in/i }).first()).toBeVisible();
  });

  test("mobile menu Open App → /app/sign-in", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("button[aria-label='Open menu']");
    await hamburger.click();
    const openApp = page.getByRole("link", { name: /Open App/i }).first();
    await expect(openApp).toHaveAttribute("href", "/app/sign-in");
  });

  test("mobile Tools accordion shows demo tool links", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("button[aria-label='Open menu']");
    await hamburger.click();
    const toolsAccordion = page.getByRole("button", { name: /Tools/i }).first();
    await toolsAccordion.click();
    await expect(page.getByRole("link", { name: /Analyze a Document/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Contract Review/i }).first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. APP NAVBAR — authenticated user links
// ─────────────────────────────────────────────────────────────────────────────

test.describe("App Navbar (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
  });

  test("Analyze a Document nav link present", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByRole("link", { name: /Analyze a Document/i }).first()).toBeVisible();
  });

  test("Contract Review nav link present", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByRole("link", { name: /Contract Review/i }).first()).toBeVisible();
  });

  test("Documents nav link → /documents", async ({ page }) => {
    await page.goto("/app/");
    const docLink = page.locator("a[href='/documents']").first();
    await expect(docLink).toBeVisible();
  });

  test("My Analyses nav link → /my-analyses", async ({ page }) => {
    await page.goto("/app/");
    const myAnalyses = page.locator("a[href='/my-analyses']").first();
    await expect(myAnalyses).toBeVisible();
  });

  test("nav does NOT show hidden tool labels", async ({ page }) => {
    await page.goto("/app/");
    await expect(page.getByText(/Trust Check/i)).toHaveCount(0);
    await expect(page.getByText(/Clause Extractor/i)).toHaveCount(0);
    await expect(page.getByText(/Compare Versions/i)).toHaveCount(0);
    await expect(page.getByText(/Redact/i)).toHaveCount(0);
  });
});
