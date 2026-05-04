/**
 * ANALYZE_COMPLETION_FLOW_ENABLED — controls visibility of the new
 * grouped Analyze mode layout (Understand / Plan / Complete / Compile).
 *
 * In production: must be explicitly set via VITE_ANALYZE_COMPLETION_FLOW_ENABLED=true.
 * In development: defaults to true if the env var is not set.
 * Default is production-safe (off unless explicitly enabled).
 */
const isProduction = import.meta.env.PROD
const flagValue = import.meta.env.VITE_ANALYZE_COMPLETION_FLOW_ENABLED

export const ANALYZE_COMPLETION_FLOW_ENABLED: boolean = isProduction
  ? flagValue === "true"
  : flagValue !== "false"

export type AnalyzeMode = "understand" | "plan" | "complete" | "compile"

export const UNDERSTAND_TAB_IDS = [
  "plain-english",
  "source-sections",
  "summary",
  "key-terms",
] as const

export const PLAN_TAB_IDS = [
  "checklist",
  "documents",
  "deadlines",
  "risks",
  "action-pack",
  "missing",
] as const

export const MODE_DEFAULT_TABS: Record<AnalyzeMode, string> = {
  understand: "plain-english",
  plan:       "checklist",
  complete:   "checklist",
  compile:    "checklist",
}
