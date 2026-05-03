import { Check, Sparkles, Calculator, ChevronDown } from "lucide-react"
import { useState } from "react"
import { PRICING_PLANS, type PricingPlan } from "@/data/pricingData"
import { startStripeCheckout } from "@/lib/stripe"
import { isNative } from "@/lib/platform"

const ATTORNEY_COSTS: Record<string, { range: string; low: number; high: number }> = {
  "Lease agreement": { range: "$300–$800", low: 300, high: 800 },
  "Employment contract": { range: "$500–$1,500", low: 500, high: 1500 },
  "Freelance agreement": { range: "$300–$700", low: 300, high: 700 },
  "NDA": { range: "$400–$1,200", low: 400, high: 1200 },
  "Business contract": { range: "$800–$2,500", low: 800, high: 2500 },
  "IRS notice response": { range: "$500–$2,000", low: 500, high: 2000 },
  "Eviction notice": { range: "$400–$1,000", low: 400, high: 1000 },
  "Medical bill dispute": { range: "$200–$600", low: 200, high: 600 },
  "General document review": { range: "$250–$700", low: 250, high: 700 },
}

function AttorneyCostCalculator() {
  const [selected, setSelected] = useState("")
  const [open, setOpen] = useState(false)
  const cost = selected ? ATTORNEY_COSTS[selected] : null

  return (
    <div className="mx-auto max-w-2xl mb-10 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Compare to attorney costs</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-left hover:border-primary/40 transition-colors"
          >
            <span className={selected ? "text-foreground" : "text-muted-foreground"}>{selected || "Select document type…"}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-border/60 bg-background shadow-lg overflow-hidden">
              {Object.keys(ATTORNEY_COSTS).map((type) => (
                <button
                  key={type}
                  onClick={() => { setSelected(type); setOpen(false) }}
                  className="w-full px-3.5 py-2 text-sm text-left hover:bg-secondary transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
        {cost && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
              <p className="text-xs text-muted-foreground mb-0.5">Attorney</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{cost.range}</p>
            </div>
            <span className="text-muted-foreground text-sm font-medium">vs</span>
            <div className="text-center px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
              <p className="text-xs text-muted-foreground mb-0.5">PlainPath Pro</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">$19.99/mo</p>
            </div>
          </div>
        )}
      </div>
      {cost && (
        <p className="text-xs text-muted-foreground mt-3">
          One attorney review of a {selected.toLowerCase()} typically costs <strong className="text-foreground">{cost.range}</strong>. PlainPath Pro gives you unlimited access for <strong className="text-foreground">$19.99/month</strong> — that's a saving of <strong className="text-emerald-600">${cost.low - 20}–${cost.high - 20}</strong> on just the first document.
        </p>
      )}
    </div>
  )
}

function getButtonClasses(plan: PricingPlan) {
  const base =
    "mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
  if (plan.highlight) {
    return `${base} bg-blue-600 text-white hover:bg-blue-700`
  }
  return `${base} bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800`
}

function NativePricingMessage() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          <Sparkles className="h-4 w-4" />
          PlainPath Pro
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Manage your subscription
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Subscription management is handled on the PlainPath website.
        </p>
      </div>
    </section>
  )
}

export default function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isNative()) {
    return <NativePricingMessage />
  }

  async function handlePlanClick(plan: PricingPlan) {
    if (!plan.planKey) return

    try {
      setError(null)
      setLoadingPlan(plan.planKey)
      await startStripeCheckout(plan.planKey)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to start checkout"
      setError(message)
      setLoadingPlan(null)
    }
  }

  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          <Sparkles className="h-4 w-4" />
          Practical launch pricing
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Honest pricing. Simple plans.
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
          Start with document analysis on Starter, or unlock every tool with Pro. No contracts, cancel anytime.
        </p>

      </div>

      <div className="mt-10">
        <AttorneyCostCalculator />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:max-w-3xl lg:mx-auto w-full">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.name}
            className={[
              "relative rounded-3xl border p-6 shadow-sm transition-all",
              "bg-white text-slate-900 dark:bg-slate-950 dark:text-white",
              plan.highlight
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : "border-slate-200 dark:border-slate-800"
            ].join(" ")}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                Most Popular
              </div>
            )}

            <div className="pt-2">
              <h3 className="text-xl font-semibold">{plan.name}</h3>

              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                <div className="pb-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>
              </div>

              <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => void handlePlanClick(plan)}
                disabled={loadingPlan === plan.planKey}
                className={getButtonClasses(plan)}
              >
                {loadingPlan === plan.planKey ? "Redirecting..." : plan.ctaLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <div className="mx-auto mt-6 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
        All plans are single-user. Analysis results are saved to your private history. Document content is not permanently stored.
      </div>
    </section>
  )
}
