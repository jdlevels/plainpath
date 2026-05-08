/**
 * Playwright auth helpers for PlainPath E2E tests.
 *
 * STRATEGY:
 * @clerk/react v6 with proxyUrl loads Clerk JS as a separate <script> tag:
 *   https://clerk.plainpathapp.com/npm/@clerk/clerk-js@6/dist/clerk.browser.js
 *
 * Before inserting the script tag, it checks: if (window.Clerk) { skip loading }
 *
 * We exploit this via page.addInitScript({ path: 'clerk-mock.js' }):
 *   - Sets window.Clerk = MockClerk BEFORE React hydrates
 *   - @clerk/react sees window.Clerk is defined, skips the script tag entirely
 *   - Creates new window.Clerk(publishableKey) → our MockClerk instance
 *   - Calls clerk.load() → our mock returns isSignedIn=true, user=admin, plan=pro
 *
 * We also intercept Clerk's v1 API calls (just in case) and the entitlements API.
 *
 * Usage:
 *   import { setupAuthMocks } from "./fixtures/auth-helpers";
 *   test.beforeEach(async ({ page }) => { await setupAuthMocks(page); });
 */
import type { Page } from "@playwright/test";
import * as path from "path";

const CLERK_MOCK_PATH = path.join(__dirname, "clerk-mock.js");

const MOCK_ENTITLEMENTS = {
  found: true,
  status: "active",
  plan: "pro",
  role: "admin",
  accessTier: "pro",
  source: "test",
};

/**
 * Sets up all interceptions required for a simulated authenticated admin user.
 * Call this in test.beforeEach BEFORE page.goto().
 */
export async function setupAuthMocks(page: Page): Promise<void> {
  // ── 1. Inject Clerk mock BEFORE the page loads ──────────────────────────
  // addInitScript runs before any page JS, so window.Clerk is set before
  // @clerk/react can check it. This prevents the <script> tag from being
  // inserted and uses our MockClerk directly.
  await page.addInitScript({ path: CLERK_MOCK_PATH });

  // ── 1b. Suppress first-run onboarding modal ───────────────────────────────
  // FirstRunOnboarding checks localStorage("pp-onboarded-v1") before showing.
  // Marking it complete prevents the full-screen overlay from blocking tests.
  await page.addInitScript(() => {
    localStorage.setItem("pp-onboarded-v1", "1");
  });

  // ── 2. Block / stub any remaining Clerk network requests ─────────────────
  // These are safety interceptors for Clerk API calls that may still fire.
  await Promise.all([
    // Clerk JS script (defense in depth — intercept even if window.Clerk check fails)
    page.route(
      (url) =>
        url.hostname.includes("clerk.plainpathapp.com") &&
        (url.pathname.includes("clerk.browser.js") ||
          url.pathname.includes("clerk-js")),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript; charset=utf-8",
          body: "/* clerk mock already loaded via addInitScript */",
        })
    ),

    // Clerk UI JS (sign-in / sign-up modal components — not needed when signed in)
    page.route(
      (url) =>
        url.hostname.includes("clerk.plainpathapp.com") &&
        url.pathname.includes("ui.browser.js"),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript; charset=utf-8",
          body: "/* clerk ui mock — not needed in e2e */",
        })
    ),

    // Clerk v1/environment
    page.route(
      (url) =>
        url.hostname.includes("clerk.plainpathapp.com") &&
        url.pathname.startsWith("/v1/environment"),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            auth_config: {},
            display_config: { application_name: "PlainPath" },
            user_settings: {
              attributes: {},
              social: {},
              saml: { enabled: false },
              actions: { delete_self: true, create_organization: false },
              restrictions: {},
              sign_in: { second_factor: { required: false } },
              sign_up: { progressive: true, mode: "public" },
              attack_protection: {},
              passkey_settings: {},
            },
            organization_settings: { enabled: false },
            maintenance_mode: false,
          }),
        })
    ),

    // Clerk v1/client and sub-paths
    page.route(
      (url) =>
        url.hostname.includes("clerk.plainpathapp.com") &&
        url.pathname.startsWith("/v1/client"),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            response: {
              id: "client_qa_test",
              object: "client",
              sessions: [],
              sign_in: null,
              sign_up: null,
              last_active_session_id: null,
            },
            client: null,
          }),
        })
    ),

    // Any other Clerk API calls
    page.route(
      (url) =>
        url.hostname.includes("clerk.plainpathapp.com") &&
        url.pathname.startsWith("/v1/"),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ response: null, client: null }),
        })
    ),

    // npm package requests (clerk-js, etc.) through the custom domain
    page.route(
      (url) =>
        url.hostname.includes("clerk.plainpathapp.com") &&
        url.pathname.startsWith("/npm/"),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript; charset=utf-8",
          body: "/* mocked npm package */",
        })
    ),

    // Clerk JS loaded through the production proxy URL
    // (plain-path.replit.app/api/__clerk/npm/@clerk/clerk-js@6/...)
    // In dev VITE_CLERK_PROXY_URL is unset so this URL never appears, but
    // this intercept future-proofs the fixture if the proxy URL is ever
    // active in a dev build.
    page.route(
      (url) =>
        url.pathname.includes("/api/__clerk/npm/") &&
        url.pathname.includes("clerk"),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript; charset=utf-8",
          body: "/* clerk mock — proxy npm package intercepted */",
        })
    ),

    // ── 3. Entitlements API → active admin subscription ────────────────────
    page.route("**/api/entitlements/status**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ENTITLEMENTS),
      })
    ),

    page.route("**/api/entitlements/bootstrap**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      })
    ),

    page.route("**/api/entitlements/consume**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, remaining: 999 }),
      })
    ),

    page.route("**/api/entitlements/consume-analysis**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, remaining: 999 }),
      })
    ),
  ]);
}

/**
 * Navigate to a protected app route with auth mocks active.
 * Waits long enough for Clerk to initialize and gates to pass.
 */
export async function gotoAuthenticated(
  page: Page,
  appPath: string,
  waitMs = 6000
): Promise<void> {
  await page.goto(appPath);
  await page.waitForTimeout(waitMs);
}
