# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: actionable-button-audit.spec.ts >> Hidden tool route enforcement >> /app/builder redirects away from hidden tool
- Location: e2e/actionable-button-audit.spec.ts:520:9

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected: not "http://localhost/app/builder"
Received: "http://localhost/app/builder"
Timeout:  5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    8 × unexpected value "http://localhost/app/builder"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "PlainPath — go to dashboard" [ref=e6] [cursor=pointer]:
          - /url: /app/
          - generic [ref=e7]:
            - img [ref=e8]
            - generic [ref=e9]: PlainPath
        - navigation [ref=e10]:
          - button "Tools" [ref=e12]:
            - img [ref=e13]
            - text: Tools
            - img [ref=e18]
          - link "My Documents" [ref=e20] [cursor=pointer]:
            - /url: /app/documents
            - img [ref=e21]
            - text: My Documents
          - link "My Analyses" [ref=e23] [cursor=pointer]:
            - /url: /app/my-analyses
            - img [ref=e24]
            - text: My Analyses
        - generic [ref=e27]:
          - button "What's new in PlainPath" [ref=e28] [cursor=pointer]:
            - img [ref=e29]
          - button "Toggle theme" [ref=e33]:
            - img [ref=e34]
          - link "Website" [ref=e36] [cursor=pointer]:
            - /url: /
            - img [ref=e37]
            - text: Website
          - button "Account menu" [ref=e43]:
            - generic [ref=e44]:
              - text: QT
              - generic "Admin" [ref=e45]
            - generic [ref=e46]: QA
            - img [ref=e47]
    - main [ref=e49]:
      - generic [ref=e50]:
        - generic [ref=e51]:
          - generic [ref=e52]:
            - heading "Document Builder" [level=1] [ref=e53]
            - paragraph [ref=e54]: Create structured documents from scratch or a template.
          - link "New document" [ref=e55] [cursor=pointer]:
            - /url: /app/builder/new
            - img [ref=e56]
            - text: New document
        - img [ref=e58]
    - contentinfo [ref=e60]:
      - generic [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]:
              - img [ref=e65]
              - generic [ref=e68]: PlainPath
            - paragraph [ref=e69]: Making paperwork clear, actionable, and less stressful.
            - paragraph [ref=e70]:
              - text: Questions or feedback?
              - link "support@plainpathapp.com" [ref=e71] [cursor=pointer]:
                - /url: mailto:support@plainpathapp.com
          - generic [ref=e72]:
            - generic [ref=e73]:
              - generic [ref=e74]:
                - img [ref=e75]
                - generic [ref=e78]: PlainPath never stores your documents
              - generic [ref=e79]:
                - img [ref=e80]
                - generic [ref=e82]: PlainPath reads only — never files or advises
            - paragraph [ref=e83]: Document text is processed by an AI service for analysis. No document data is retained by PlainPath between sessions.
        - generic [ref=e84]:
          - paragraph [ref=e85]: © 2026 PlainPath. All rights reserved.
          - generic [ref=e86]:
            - link "Privacy Policy" [ref=e87] [cursor=pointer]:
              - /url: /app/privacy
            - link "Terms of Service" [ref=e88] [cursor=pointer]:
              - /url: /app/terms
            - link "Support" [ref=e89] [cursor=pointer]:
              - /url: /app/support
    - button "Open PlainPath Assistant" [ref=e90]:
      - img [ref=e91]
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  423 |   test.beforeEach(async ({ page }) => {
  424 |     await setupAuthMocks(page);
  425 |     await page.route("**/api/analyses*", (route) =>
  426 |       route.fulfill({ status: 200, body: JSON.stringify([]) })
  427 |     );
  428 |   });
  429 | 
  430 |   test("my-analyses renders at /app/my-analyses", async ({ page }) => {
  431 |     await page.goto("/app/my-analyses");
  432 |     await expect(page).toHaveURL(/my-analyses/);
  433 |   });
  434 | });
  435 | 
  436 | // ─────────────────────────────────────────────────────────────────────────────
  437 | // 12. BILLING PAGE
  438 | // ─────────────────────────────────────────────────────────────────────────────
  439 | 
  440 | test.describe("Billing page", () => {
  441 |   test.beforeEach(async ({ page }) => {
  442 |     await setupAuthMocks(page);
  443 |     await page.route("**/api/entitlements*", (route) =>
  444 |       route.fulfill({
  445 |         status: 200,
  446 |         body: JSON.stringify({
  447 |           found: true,
  448 |           status: "active",
  449 |           plan: "pro",
  450 |           accessTier: "pro",
  451 |           source: "stripe",
  452 |         }),
  453 |       })
  454 |     );
  455 |   });
  456 | 
  457 |   test("billing page renders at /app/billing", async ({ page }) => {
  458 |     await page.goto("/app/billing");
  459 |     await expect(page).toHaveURL(/billing/);
  460 |   });
  461 | 
  462 |   test("billing page shows support link", async ({ page }) => {
  463 |     await page.goto("/app/billing");
  464 |     await expect(page.locator("a[href='mailto:support@plainpathapp.com']").first()).toBeVisible();
  465 |   });
  466 | });
  467 | 
  468 | // ─────────────────────────────────────────────────────────────────────────────
  469 | // 13. SUPPORT & LEGAL PAGES
  470 | // ─────────────────────────────────────────────────────────────────────────────
  471 | 
  472 | test.describe("Support and legal pages", () => {
  473 |   test.beforeEach(async ({ page }) => {
  474 |     await setupAuthMocks(page);
  475 |   });
  476 | 
  477 |   test("support page renders at /app/support", async ({ page }) => {
  478 |     await page.goto("/app/support");
  479 |     await expect(page).toHaveURL(/support/);
  480 |   });
  481 | 
  482 |   test("support page has mailto link", async ({ page }) => {
  483 |     await page.goto("/app/support");
  484 |     await expect(
  485 |       page.locator("a[href='mailto:support@plainpathapp.com']").first()
  486 |     ).toBeVisible();
  487 |   });
  488 | 
  489 |   test("marketing /support page renders", async ({ page }) => {
  490 |     await page.goto("/support");
  491 |     await expect(page).not.toHaveURL(/error/i);
  492 |   });
  493 | 
  494 |   test("marketing /privacy page renders", async ({ page }) => {
  495 |     await page.goto("/privacy");
  496 |     await expect(page).not.toHaveURL(/error/i);
  497 |   });
  498 | 
  499 |   test("marketing /terms page renders", async ({ page }) => {
  500 |     await page.goto("/terms");
  501 |     await expect(page).not.toHaveURL(/error/i);
  502 |   });
  503 | });
  504 | 
  505 | // ─────────────────────────────────────────────────────────────────────────────
  506 | // 14. HIDDEN TOOL ROUTES — all redirect to home
  507 | // ─────────────────────────────────────────────────────────────────────────────
  508 | 
  509 | test.describe("Hidden tool route enforcement", () => {
  510 |   const HIDDEN_ROUTES = [
  511 |     "/app/trust-check",
  512 |     "/app/clause-extractor",
  513 |     "/app/compare-versions",
  514 |     "/app/redact",
  515 |     "/app/ask-document",
  516 |     "/app/builder",
  517 |   ];
  518 | 
  519 |   for (const route of HIDDEN_ROUTES) {
  520 |     test(`${route} redirects away from hidden tool`, async ({ page }) => {
  521 |       await setupAuthMocks(page);
  522 |       await page.goto(route);
> 523 |       await expect(page).not.toHaveURL(route);
      |                              ^ Error: expect(page).not.toHaveURL(expected) failed
  524 |     });
  525 |   }
  526 | });
  527 | 
  528 | // ─────────────────────────────────────────────────────────────────────────────
  529 | // 15. MOBILE VIEWPORT — marketing navbar hamburger
  530 | // ─────────────────────────────────────────────────────────────────────────────
  531 | 
  532 | test.describe("Mobile viewport — marketing navbar", { tag: "@mobile" }, () => {
  533 |   test.use({ viewport: { width: 390, height: 844 } });
  534 | 
  535 |   test("hamburger menu opens and shows Log in", async ({ page }) => {
  536 |     await page.goto("/");
  537 |     const hamburger = page.locator("button[aria-label='Open menu']");
  538 |     await hamburger.click();
  539 |     await expect(page.getByRole("link", { name: /Log in/i }).first()).toBeVisible();
  540 |   });
  541 | 
  542 |   test("mobile menu Open App → /app/sign-in", async ({ page }) => {
  543 |     await page.goto("/");
  544 |     const hamburger = page.locator("button[aria-label='Open menu']");
  545 |     await hamburger.click();
  546 |     const openApp = page.getByRole("link", { name: /Open App/i }).first();
  547 |     await expect(openApp).toHaveAttribute("href", "/app/sign-in");
  548 |   });
  549 | 
  550 |   test("mobile Tools accordion shows demo tool links", async ({ page }) => {
  551 |     await page.goto("/");
  552 |     const hamburger = page.locator("button[aria-label='Open menu']");
  553 |     await hamburger.click();
  554 |     const toolsAccordion = page.getByRole("button", { name: /Tools/i }).first();
  555 |     await toolsAccordion.click();
  556 |     await expect(page.getByRole("link", { name: /Analyze a Document/i }).first()).toBeVisible();
  557 |     await expect(page.getByRole("link", { name: /Contract Review/i }).first()).toBeVisible();
  558 |   });
  559 | });
  560 | 
  561 | // ─────────────────────────────────────────────────────────────────────────────
  562 | // 16. APP NAVBAR — authenticated user links
  563 | // ─────────────────────────────────────────────────────────────────────────────
  564 | 
  565 | test.describe("App Navbar (authenticated)", () => {
  566 |   test.beforeEach(async ({ page }) => {
  567 |     await setupAuthMocks(page);
  568 |   });
  569 | 
  570 |   test("Analyze a Document nav link present", async ({ page }) => {
  571 |     await page.goto("/app/");
  572 |     await expect(page.getByRole("link", { name: /Analyze a Document/i }).first()).toBeVisible();
  573 |   });
  574 | 
  575 |   test("Contract Review nav link present", async ({ page }) => {
  576 |     await page.goto("/app/");
  577 |     await expect(page.getByRole("link", { name: /Contract Review/i }).first()).toBeVisible();
  578 |   });
  579 | 
  580 |   test("Documents nav link → /documents", async ({ page }) => {
  581 |     await page.goto("/app/");
  582 |     const docLink = page.locator("a[href='/documents']").first();
  583 |     await expect(docLink).toBeVisible();
  584 |   });
  585 | 
  586 |   test("My Analyses nav link → /my-analyses", async ({ page }) => {
  587 |     await page.goto("/app/");
  588 |     const myAnalyses = page.locator("a[href='/my-analyses']").first();
  589 |     await expect(myAnalyses).toBeVisible();
  590 |   });
  591 | 
  592 |   test("nav does NOT show hidden tool labels", async ({ page }) => {
  593 |     await page.goto("/app/");
  594 |     await expect(page.getByText(/Trust Check/i)).toHaveCount(0);
  595 |     await expect(page.getByText(/Clause Extractor/i)).toHaveCount(0);
  596 |     await expect(page.getByText(/Compare Versions/i)).toHaveCount(0);
  597 |     await expect(page.getByText(/Redact/i)).toHaveCount(0);
  598 |   });
  599 | });
  600 | 
```