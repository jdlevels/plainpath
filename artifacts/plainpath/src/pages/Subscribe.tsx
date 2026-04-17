import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Check, ArrowLeft, Sparkles, Loader2,
  ExternalLink, Lock, Mail, Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { PRICING_PLANS } from "@/data/pricingData"
import { startStripeCheckout } from "@/lib/stripe"
import { getStoredSubscriberEmail } from "@/lib/subscriberStorage"
import { isNative } from "@/lib/platform"
import { BILLING_CONFIG } from "@/lib/billingConfig"

// ─── Native fallback ────────────────────────────────────────────────────────

function NativeMessage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-5">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-3">Manage subscription on web</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-7">
          Subscriptions are managed at plainpathapp.com. Visit from a browser to view plans, subscribe, or manage your existing plan.
        </p>
        <a
          href="https://plainpathapp.com/app/#pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          View plans <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Subscribe() {
  const [email, setEmail] = useState("")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "Subscribe — PlainPath"
    const stored = getStoredSubscriberEmail()
    if (stored) setEmail(stored)
    return () => { document.title = "PlainPath" }
  }, [])

  if (isNative()) return <NativeMessage />

  async function handleSubscribe(planKey?: string) {
    if (!planKey) return
    setError(null)
    setLoadingPlan(planKey)
    try {
      await startStripeCheckout(planKey as "starter" | "pro", email || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout. Please try again.")
      setLoadingPlan(null)
    }
  }

  const emailValid = email.includes("@") && email.includes(".")

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">

        {/* ── Back ── */}
        <a
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </a>

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card shadow-sm text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Simple, clear pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-3">
            Choose your PlainPath plan
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Start with unlimited document analysis on Starter, or unlock all 5 live tools with Pro.
          </p>
        </div>

        {/* ── Pre-launch notice ── */}
        {!BILLING_CONFIG.BILLING_ENABLED && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3.5"
          >
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Subscriptions launching soon
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5 leading-relaxed">
                Live billing is not yet active. You can explore all 5 tools for free during pre-launch — no checkout required. We'll update this page once subscriptions are open.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Email field ── */}
        <div className="max-w-sm mx-auto mb-10">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            <Mail className="w-3 h-3" />
            Your email
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl bg-card border-border/70 text-sm"
            autoComplete="email"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground/60">
            Used to activate your subscription after checkout.
          </p>
        </div>

        {/* ── Plan cards ── */}
        <div className="grid gap-5 md:grid-cols-3">
          {PRICING_PLANS.map((plan, i) => {
            const isLoading = loadingPlan === plan.planKey
            const disabled = isLoading || (!plan.planned && !emailValid)

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`relative rounded-3xl border p-6 shadow-sm bg-card transition-all ${
                  plan.highlight
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/60 hover:border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                    Most Popular
                  </div>
                )}
                {plan.planned && (
                  <div className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    Coming Soon
                  </div>
                )}

                <div className="pt-2">
                  <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>

                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed min-h-[60px]">
                    {plan.description}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </span>
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => void handleSubscribe(plan.planKey)}
                    disabled={disabled}
                    className={`mt-7 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : plan.planned
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-secondary text-foreground hover:bg-muted"
                    }`}
                    style={{ touchAction: "manipulation" }}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe…</>
                    ) : plan.planned ? (
                      <>{plan.ctaLabel} <ExternalLink className="w-3.5 h-3.5" /></>
                    ) : (
                      plan.ctaLabel
                    )}
                  </button>

                  {!plan.planned && !emailValid && (
                    <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
                      Enter your email above to subscribe
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-xl rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        {/* ── Trust signals ── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/50">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Secure checkout via Stripe
          </div>
          <div>Cancel anytime</div>
          <div>Documents never uploaded to PlainPath</div>
          <div>Analyses stored only on your device</div>
        </div>

        {/* ── FAQ row ── */}
        <div className="mt-10 max-w-2xl mx-auto grid gap-4 sm:grid-cols-2 text-sm">
          {[
            {
              q: "How does billing work?",
              a: "Monthly subscription charged via Stripe. You can cancel anytime from your billing portal.",
            },
            {
              q: "How do I activate my plan after checkout?",
              a: "After payment, return to PlainPath and enter the same email on the My Analyses page to restore your plan.",
            },
            {
              q: "Do you store my documents?",
              a: "No. Documents and analyses are stored only in your browser's local storage, never on our servers.",
            },
            {
              q: "What's the difference between plans?",
              a: "Starter covers unlimited document analysis. Pro unlocks all 5 live tools: Document Analysis, Trust Check, Contract Builder, Contract Review, and Redact Sensitive Info.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="font-semibold mb-1.5">{item.q}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
