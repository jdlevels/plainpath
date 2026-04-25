import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  CreditCard, CheckCircle2, XCircle, Zap, BarChart3,
  ShieldCheck, PenLine, Scale, ArrowRight, ExternalLink,
  AlertTriangle, TestTube, Loader2, RefreshCw, Mail, EyeOff,
  FileScan, MessageCircle, GitCompare, ListChecks,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEntitlements } from "@/hooks/useEntitlements"
import { openBillingPortal } from "@/lib/entitlements"
import { BILLING_CONFIG } from "@/lib/billingConfig"
import { isNative } from "@/lib/platform"
import { trackEvent } from "@/lib/analytics"

// ─── Plan display config ──────────────────────────────────────────────────────

const PLAN_META = {
  starter: {
    label: "Starter",
    price: "$4.99/month",
    icon: BarChart3,
    color: "text-blue-500",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
  },
  pro: {
    label: "Pro",
    price: "$19.99/month",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
  },
} as const

// Source of truth: TOOL_ACCESS in artifacts/api-server/src/lib/planEntitlements.ts
const TOOLS = [
  { icon: FileScan,       key: "analyze",          label: "Analyze a Document",   plans: ["starter", "pro"] },
  { icon: EyeOff,         key: "redact",           label: "Redact Sensitive Info", plans: ["starter", "pro"] },
  { icon: ShieldCheck,    key: "trust-check",      label: "Document Trust Check", plans: ["pro"] },
  { icon: Scale,          key: "contract-review",  label: "Contract Review",      plans: ["pro"] },
  { icon: PenLine,        key: "build-contract",   label: "Build a Contract",     plans: ["pro"] },
  { icon: MessageCircle,  key: "ask-document",     label: "Ask This Document",    plans: ["pro"] },
  { icon: GitCompare,     key: "compare-versions", label: "Compare Versions",     plans: ["pro"] },
  { icon: ListChecks,     key: "clause-extractor", label: "Clause Extractor",     plans: ["pro"] },
] as const

// ─── Native message ───────────────────────────────────────────────────────────

function NativeBillingMessage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-5">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-3">Manage plan on web</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-7">
          Subscriptions are managed at plainpathapp.com. Open in a browser to view your plan, upgrade, or cancel.
        </p>
        <a
          href="https://plainpathapp.com/app/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Open in browser <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

// ─── Subscription not detected card ──────────────────────────────────────────
// Shown when the signed-in user has no active subscription detected.
// Directs users to sign in with their subscription email or contact support.

function SubscriptionNotFoundCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Subscription not showing?</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Your subscription is linked to the account you signed in with. If you subscribed with a
        different email, sign out and sign back in using that address to access your plan.
      </p>
      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Still having trouble?{" "}
        <a href="mailto:support@plainpathapp.com" className="text-primary hover:underline">
          Contact support
        </a>
        {" "}and we'll help you get access.
      </p>
    </div>
  )
}

// ─── Main Billing Page ────────────────────────────────────────────────────────

export default function Billing() {
  const [, navigate] = useLocation()
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const { entitlements, loading, reload, isAdmin } = useEntitlements()

  useEffect(() => {
    document.title = "Plan & Billing — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  if (isNative()) return <NativeBillingMessage />

  const isTestMode = BILLING_CONFIG.BILLING_MODE === "test"
  const isEnforced = BILLING_CONFIG.PAYWALL_ENFORCEMENT

  // Admin is an internal role, not a billing tier. They always have Pro-equivalent access
  // but are NOT shown as having a Stripe subscription.
  const hasSub = !isAdmin && Boolean(entitlements?.found && entitlements.status === "active")
  const plan = hasSub ? (entitlements!.plan as "starter" | "pro") : null
  const meta = plan ? PLAN_META[plan] : null

  async function handleManageSubscription() {
    setPortalLoading(true)
    setPortalError(null)
    trackEvent("portal_opened", { plan: plan ?? "unknown" })
    try {
      await openBillingPortal()
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : "Unable to open billing portal.")
      setPortalLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
              Plan &amp; Billing
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-8">
            Manage your subscription, view your plan, and upgrade.
          </p>
        </motion.div>

        {/* ── Test-mode notice ── */}
        {isTestMode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 mb-6"
          >
            <TestTube className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Test mode — no real charges
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5 leading-relaxed">
                PlainPath is in pre-launch test mode. All tools are open for use.
                {!isEnforced && " Plan gating is not yet active."}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Current plan card ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="rounded-2xl border border-border/60 bg-card p-5 mb-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Current plan
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading subscription…
            </div>
          ) : isAdmin ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 bg-amber-500/8 border border-amber-500/20">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Admin Access</span>
                <span className="text-xs text-muted-foreground">Internal role</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You have full product access as an internal admin. Admin is a privilege, not a billing plan.
              </p>
            </div>
          ) : hasSub && meta ? (
            <>
              <div className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 ${meta.bg} border ${meta.border} mb-4`}>
                <meta.icon className={`w-4 h-4 ${meta.color}`} />
                <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
                <span className="text-xs text-muted-foreground">{meta.price}</span>
              </div>

              {/* Period info */}
              {entitlements?.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mb-1">
                  {entitlements.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(entitlements.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews ${new Date(entitlements.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}

              {entitlements?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 mt-2 rounded-lg border border-amber-400/30 bg-amber-400/8 px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Subscription will not renew. Reactivate in your billing portal to keep access.
                  </p>
                </div>
              )}

              {/* Manage button */}
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-fit"
                >
                  {portalLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  )}
                  Manage subscription
                </Button>
                {portalError && (
                  <p className="text-xs text-destructive">{portalError}</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 py-2">
                <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">No active subscription</span>
                <button onClick={() => { reload() }} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <SubscriptionNotFoundCard />
            </div>
          )}
        </motion.div>

        {/* ── Tool access grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-border/60 bg-card p-5 mb-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Tool access
          </p>
          <div className="space-y-0">
            {TOOLS.map((tool) => {
              // Admin (role) always has full access — accessTier is "pro" for admins
              const hasAccess = isAdmin || (isEnforced
                ? Boolean(plan && (tool.plans as readonly string[]).includes(plan))
                : true)
              const isStarterTool = (tool.plans as readonly string[]).includes("starter")
              const planBadge = isStarterTool ? "Starter + Pro" : "Pro"
              const planBadgeClass = isStarterTool
                ? "text-blue-600 dark:text-blue-400 bg-blue-500/10"
                : "text-primary bg-primary/10"

              return (
                <div
                  key={tool.key}
                  className="flex items-center justify-between py-2.5 border-b border-border/25 last:border-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <tool.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{tool.label}</span>
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${planBadgeClass}`}>
                      {planBadge}
                    </span>
                  </div>
                  {hasAccess ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Included</span>
                    </div>
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground/35 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {isEnforced && plan === "starter" && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upgrade to <span className="font-semibold text-primary">Pro</span> to unlock all 8 tools — including Contract Review, Ask This Document, Compare Versions, and more.
              </p>
              <Button size="sm" onClick={() => navigate("/subscribe")} className="shrink-0">
                Upgrade <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* ── Upgrade CTA (no active plan or on Starter; never for admins) ── */}
        {!isAdmin && !hasSub && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl border border-primary/20 bg-primary/4 p-5 mb-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Subscribe to PlainPath
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Starter at <strong>$4.99/mo</strong> gives you Analyze and Redact.
                  Pro at <strong>$19.99/mo</strong> unlocks all 8 tools.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate("/subscribe")} className="shrink-0">
                View plans <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {hasSub && plan === "starter" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl border border-primary/20 bg-primary/4 p-5 mb-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Upgrade to Pro — $19.99/mo
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unlock all 8 tools — Trust Check, Contract Review, Signature, Compare Versions, Clause Extractor, and more.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate("/subscribe")} className="shrink-0">
                Upgrade <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Support link ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="text-center mt-2"
        >
          <p className="text-xs text-muted-foreground">
            Billing questions?{" "}
            <a
              href="/support"
              className="text-primary hover:underline"
            >
              Contact support
            </a>
            {" "}or email{" "}
            <a
              href="mailto:support@plainpathapp.com"
              className="text-primary hover:underline"
            >
              support@plainpathapp.com
            </a>
          </p>
        </motion.div>

      </div>
    </div>
  )
}
