/**
 * E2E: Hidden tool route enforcement
 *
 * Covers:
 * - /app/trust-check         → redirect, no usable UI
 * - /app/clause-extractor    → redirect, no usable UI
 * - /app/compare-versions    → redirect, no usable UI
 * - /app/redact              → redirect, no usable UI
 * - /app/contract-builder    → redirect, no usable UI
 * - /app/builder             → not-found or redirect (BUILDER_ENABLED=false)
 * - /app/ask-document        → redirect, no usable UI
 * - /app/ask-this-document   → redirect, no usable UI
 *
 * All hidden tool routes call window.location.replace(basePath + '/') in App.tsx.
 * Unauthenticated users then get redirected by RequireAuth to '/' (marketing site).
 * /app/builder has no explicit redirect — falls to NotFound (BUILDER_ENABLED=false).
 */
import { test, expect } from "@playwright/test";

const HIDDEN_ROUTES = [
  { path: "/app/trust-check",         label: "Trust Check" },
  { path: "/app/clause-extractor",    label: "Clause Extractor" },
  { path: "/app/compare-versions",    label: "Compare Versions" },
  { path: "/app/redact",              label: "Redact" },
  { path: "/app/contract-builder",    label: "Contract Builder" },
  { path: "/app/build-contract",      label: "Build Contract" },
  { path: "/app/builder",             label: "Document Builder" },
  { path: "/app/ask-document",        label: "Ask Document" },
  { path: "/app/ask-this-document",   label: "Ask This Document" },
  { path: "/app/compare",             label: "Compare" },
];

const TOOL_UPLOAD_INDICATORS = [
  "Drag and drop",
  "drop here",
  "Select file",
  "Choose file",
  "paste text",
  "Start analyzing",
  "Start reviewing",
];

test.describe("Hidden tool routes — unauthenticated enforcement", () => {
  for (const { path, label } of HIDDEN_ROUTES) {
    test(`${label} (${path}) — not accessible to unauthenticated users`, async ({ page }) => {
      await page.goto(path);

      await page.waitForTimeout(2000);

      const url = page.url();
      const isRedirected =
        !url.includes(path) ||
        url.endsWith("/app/") ||
        url === "http://localhost:80/" ||
        url.endsWith("/app");

      const content = await page.content();
      const hasToolUI = TOOL_UPLOAD_INDICATORS.some(indicator =>
        content.toLowerCase().includes(indicator.toLowerCase())
      );

      expect(
        isRedirected || !hasToolUI,
        `${label}: user should be redirected or not shown a usable upload/tool UI.\nCurrent URL: ${url}`
      ).toBe(true);
    });
  }
});

test.describe("Hidden tool routes — confirm no leaked tool content", () => {
  test("No Trust Check scam-analysis UI visible at /app/trust-check", async ({ page }) => {
    await page.goto("/app/trust-check");
    await page.waitForTimeout(1500);
    const content = await page.content();
    expect(content).not.toMatch(/scam.*detector|verify.*document.*legitimacy|Trust Check tool/i);
  });

  test("No Clause Extractor UI visible at /app/clause-extractor", async ({ page }) => {
    await page.goto("/app/clause-extractor");
    await page.waitForTimeout(1500);
    const content = await page.content();
    expect(content).not.toMatch(/Extract clauses|Clause Extractor tool|upload.*extract/i);
  });

  test("No Compare Versions UI visible at /app/compare-versions", async ({ page }) => {
    await page.goto("/app/compare-versions");
    await page.waitForTimeout(1500);
    const content = await page.content();
    expect(content).not.toMatch(/Compare.*Versions.*tool|upload.*compare.*version/i);
  });

  test("No Redact PII UI visible at /app/redact", async ({ page }) => {
    await page.goto("/app/redact");
    await page.waitForTimeout(1500);
    const content = await page.content();
    expect(content).not.toMatch(/Redact.*PII.*tool|remove.*sensitive.*info.*upload/i);
  });

  test("No Document Builder UI at /app/builder — BUILDER_ENABLED=false", async ({ page }) => {
    await page.goto("/app/builder");
    await page.waitForTimeout(1500);

    const content = await page.content();
    const url = page.url();

    const hasBuilderUI =
      content.includes("My Contracts") ||
      content.includes("New Contract") ||
      content.includes("Template Library") ||
      content.includes("Start from template") ||
      content.includes("Create a new document");

    expect(
      !hasBuilderUI,
      `Document Builder UI should not be accessible when BUILDER_ENABLED=false.\nURL: ${url}`
    ).toBe(true);
  });
});
