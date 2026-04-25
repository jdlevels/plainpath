// ─── PlainPath Identity Model ─────────────────────────────────────────────────
//
// Two separate dimensions stored in Clerk publicMetadata:
//
//   role        = internal privilege  ("admin" | "member")
//   accessTier  = product entitlement ("starter" | "pro")
//
// User types:
//   Admin   → { role: "admin",  accessTier: "pro"     } — full internal + product access
//   Starter → { role: "member", accessTier: "starter" } — Starter plan tools only
//   Pro     → { role: "member", accessTier: "pro"     } — all paid tools, NOT admin
//
// Rules:
//   • role === "admin"  → grants admin-only surfaces; is NOT a billing tier
//   • accessTier        → controls product/tool gating; never grants admin powers
//   • unsafeMetadata    → NEVER used for any privilege or access logic
//
// ─────────────────────────────────────────────────────────────────────────────

export type PlanKey = "starter" | "pro"
export type RoleKey = "admin" | "member"
export type AccessTier = "starter" | "pro"
export type ToolKey = "analyze" | "trust-check" | "contract-review" | "build-contract" | "redact" | "signature" | "compare" | "clause-extractor" | "compare-versions"

export type EntitlementStatus = {
  email: string
  /** Internal privilege. "admin" = internal-only access. NOT a billing/plan tier. */
  role?: RoleKey
  /** Product entitlement. Controls which tools are accessible. */
  accessTier?: AccessTier
  found: boolean
  status: string
  plan: PlanKey
  monthKey: string
  usageCount: number
  usageLimit: number
  usageRemaining: number
  toolAccess: ToolKey[]
  toolUsage: Record<ToolKey, number>
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  billingMode: "test" | "live"
  paywallEnforcement: boolean
  features: {
    plainEnglish: boolean
    sourceSections: boolean
    sectionExplainer: boolean
    checklist: boolean
    requiredDocs: boolean
    deadlines: boolean
    risks: boolean
    whatsMissing: boolean
    keyTerms: boolean
    actionPack: boolean
    savedAnalyses: boolean
    exportShare: boolean
  }
}

// ─── Fetch full entitlements ──────────────────────────────────────────────────

export async function fetchEntitlements(
  email: string,
  clerkUserId?: string | null,
): Promise<EntitlementStatus> {
  const params = new URLSearchParams()
  if (email) params.set("email", email)
  if (clerkUserId) params.set("clerkUserId", clerkUserId)

  const response = await fetch(`/api/entitlements/status?${params.toString()}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || "Unable to load entitlements")
  }

  return data as EntitlementStatus
}

// ─── Consume tool usage (fire-and-forget from gate functions) ─────────────────
// Records server-side usage for analytics and future enforcement.
// Does not block when PAYWALL_ENFORCEMENT is false.

export async function consumeToolUsage(
  email: string,
  tool: ToolKey
): Promise<{ ok: boolean; plan: string; tool: string; enforced: boolean }> {
  const response = await fetch("/api/entitlements/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tool }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || "Unable to record tool usage")
  }

  return data
}

// ─── Legacy: consume analysis (kept for backwards compat) ────────────────────

export async function consumeAnalysis(email: string) {
  const response = await fetch("/api/entitlements/consume-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || "Unable to record analysis usage")
  }

  return data as {
    ok: true
    plan: PlanKey
    usageCount: number
    usageLimit: number
    usageRemaining: number
  }
}

// ─── Open Stripe billing portal ───────────────────────────────────────────────
// Requires an active Clerk session. The server resolves subscriber identity
// from the authenticated session — no caller-supplied email is needed.

export async function openBillingPortal(): Promise<void> {
  const response = await fetch("/api/stripe/billing-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || "Unable to open billing portal")
  }

  if (!data?.url) {
    throw new Error("Missing billing portal URL")
  }

  window.location.href = data.url
}
