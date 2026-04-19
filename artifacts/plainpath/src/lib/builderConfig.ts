/**
 * BUILDER_ENABLED — controls visibility of all Builder nav items, routes,
 * and gating surfaces in the frontend.
 *
 * In production: must be explicitly set via VITE_BUILDER_ENABLED=true.
 * In development: defaults to true if the env var is not set.
 */
const isProduction = import.meta.env.PROD;
const flagValue = import.meta.env.VITE_BUILDER_ENABLED;

export const BUILDER_ENABLED: boolean = isProduction
  ? flagValue === "true"
  : flagValue !== "false";

export const BUILDER_CATEGORIES = [
  { value: "sop", label: "Standard Operating Procedure" },
  { value: "handbook", label: "Employee Handbook" },
  { value: "policy", label: "Internal Policy" },
  { value: "checklist", label: "Checklist" },
  { value: "incident-report", label: "Incident Report" },
  { value: "proposal", label: "Business Proposal" },
  { value: "prd", label: "Product Requirements Document" },
  { value: "other", label: "Other" },
] as const;

export type BuilderCategory = (typeof BUILDER_CATEGORIES)[number]["value"];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BUILDER_CATEGORIES.map((c) => [c.value, c.label]),
);
