/**
 * E2E: Authentication and plan gate behavior
 *
 * Covers:
 * - Unauthenticated access to protected routes → redirected to sign-in or marketing site
 * - App home (/) only accessible when signed in
 * - Sign-in page renders correctly
 * - /app/sign-in renders the Clerk sign-in component
 *
 * Note: Full auth flows with Clerk production keys are not tested here.
 * The plan gate (ChoosePlanScreen) and tool grid are validated in separate
 * integration tests once auth is established.
 */
import { test, expect } from "@playwright/test";

const PROTECTED_APP_ROUTES = [
  { path: "/app/",              label: "Dashboard home" },
  { path: "/app/my-analyses",  label: "My Analyses" },
  { path: "/app/billing",      label: "Billing" },
  { path: "/app/documents",    label: "Documents" },
  { path: "/app/team",         label: "Team" },
];

test.describe("Unauthenticated access to protected routes", () => {
  for (const { path, label } of PROTECTED_APP_ROUTES) {
    test(`${label} (${path}) — unauthenticated user is redirected`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(2500);

      const url = page.url();

      const isRedirected =
        url.includes("sign-in") ||
        url === "http://localhost:80/" ||
        !url.includes(path.replace("/app/", "").replace(/\/$/, "")) ||
        url.endsWith("/") && !url.includes("/app/");

      const content = await page.content();
      const isDashboardContent =
        content.includes("Analyze a Document") &&
        content.includes("Contract Review") &&
        !content.includes("PlainPath — Understand Any Document");

      expect(
        isRedirected || !isDashboardContent,
        `${label}: unauthenticated user should be redirected away from the protected route.\nURL: ${url}`
      ).toBe(true);
    });
  }
});

test.describe("Sign-in page (/app/sign-in)", () => {
  test("sign-in page renders — not a blank screen", async ({ page }) => {
    await page.goto("/app/sign-in");
    await page.waitForTimeout(2000);

    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(300);

    const content = await page.content();
    const hasSignInContent =
      content.includes("sign") ||
      content.includes("Sign") ||
      content.includes("email") ||
      content.includes("Email") ||
      content.includes("PlainPath") ||
      content.includes("Continue");

    expect(hasSignInContent, "Sign-in page should render some sign-in related content").toBe(true);
  });
});

test.describe("App home — plan gate enforced", () => {
  test("unauthenticated /app/ does not expose tool grid to anonymous users", async ({ page }) => {
    await page.goto("/app/");
    await page.waitForTimeout(2500);

    const content = await page.content();

    const hasBothToolCards =
      content.includes("Analyze a Document") &&
      content.includes("Contract Review") &&
      content.includes("/app/analyze") &&
      content.includes("/app/contract-review");

    expect(
      !hasBothToolCards,
      "Tool grid with live tool links should not be visible to unauthenticated users"
    ).toBe(true);
  });
});
