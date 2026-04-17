import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  CreditCard, CheckCircle2, XCircle, Zap, BarChart3,
  ShieldCheck, PenLine, Scale, ArrowRight, ExternalLink,
  AlertTriangle, TestTube, Loader2, RefreshCw, Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEntitlements } from "@/hooks/useEntitlements"
import { getStoredSubscriberEmail, setStoredSubscriberEmail, clearStoredSubscriberEmail } from "@/lib/subscriberStorage"
import { openBillingPortal } from "@/lib/entitlements"
import { BILLING_CONFIG } from "@/lib/billingConfig"
import { isNative } from "@/lib/platform"

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

const TOOLS = [
  { icon: BarChart3,   key: "analyze",           label: "Analyze a Document",   plans: ["starter", "pro"] },
  { icon: ShieldCheck, key: "trust-check",        label: "Document Trust Check", plans: ["pro"] },
  { icon: Scale,       key: "contract-review",    label: "Contract Review",      plans: ["pro"] },
  { icon: PenLine,     key: "build-contract",     label: "Build a Contract",     plans: ["pro"] },
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

// ─── Email restore card ───────────────────────────────────────────────────────

function EmailRestoreCard({ onRestore }: { onRestore: (email: string) => void }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRestore() {
    const email = input.trim().toLowerCase()
    if (!email.includes("@")) {
      setError("Enter a valid email address.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/entitlements/status?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.found && data.status === "active") {
        setStoredSubscriberEmail(email)
        onRestore(email)
      } else if (data.found) {
        setError(`Subscription found but status is "${data.status}". Contact support if you believe this is an error.`)
      } else {
        setError("No active subscription found for this email.")
      }
    } catch {
      setError("Unable to look up subscription. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Restore existing subscription</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        If you subscribed previously, enter the email you used at checkout to restore your plan.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRestore()}
          placeholder="you@example.com"
          className="flex-1 h-9 rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <Button size="sm" onClick={handleRestore} disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Restore"}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

// ─── Main Billing Page ────────────────────────────────────────────────────────

export default function Billing() {
  const [, navigate] = useLocation()
  const [email, setEmail] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const { entitlements, loading, reload } = useEntitlements()

  useEffect(() => {
    document.title = "Plan & Billing — PlainPath"
    setEmail(getStoredSubscriberEmail())
    return () => { document.title = "PlainPath" }
  }, [])

  if (isNative()) return <NativeBillingMessage />

  const isTestMode = BILLING_CONFIG.BILLING_MODE === "test"
  const isEnforced = BILLING_CONFIG.PAYWALL_ENFORCEMENT

  const hasSub = Boolean(entitlements?.found && entitlements.status === "active")
  const plan = hasSub ? (entitlements!.plan as "starter" | "pro") : null
  const meta = plan ? PLAN_META[plan] : null

  async function handleManageSubscription() {
    if (!email) return
    setPortalLoading(true)
    setPortalError(null)
    try {
      await openBillingPortal(email)
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : "Unable to open billing portal.")
      setPortalLoading(false)
    }
  }

  function handleSignOut() {
    clearStoredSubscriberEmail()
    setEmail(null)
    reload()
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

              {/* Email indicator */}
              {email && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">
                    Subscription email: <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-3"
                  >
                    Unlink
                  </button>
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
              <EmailRestoreCard onRestore={(e) => { setEmail(e); reload() }} />
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
          <div className="space-y-2">
            {TOOLS.map((tool) => {
              const hasAccess = isEnforced
                ? Boolean(plan && (tool.plans as readonly string[]).includes(plan))
                : true // when enforcement is off, all tools are accessible
              const requiresPro = !(tool.plans as readonly string[]).includes("starter")

              return (
                <div
                  key={tool.key}
                  className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <tool.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{tool.label}</span>
                    {requiresPro && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                        Pro
                      </span>
                    )}
                  </div>
                  {hasAccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {isEnforced && plan === "starter" && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upgrade to <span className="font-semibold text-primary">Pro</span> to unlock Trust Check, Contract Review, and Contract Builder.
              </p>
              <Button size="sm" onClick={() => navigate("/subscribe")} className="shrink-0">
                Upgrade <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* ── Upgrade CTA (no active plan or on Starter) ── */}
        {!hasSub && (
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
                  Starter at <strong>$4.99/mo</strong> gives you unlimited document analysis.
                  Pro at <strong>$19.99/mo</strong> unlocks all four tools.
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
                  Add Trust Check, Contract Review, and Contract Builder to your plan.
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
