import { Check, Sparkles } from "lucide-react"
import { useState } from "react"
import { PRICING_PLANS, type PricingPlan } from "@/data/pricingData"
import { startStripeCheckout } from "@/lib/stripe"

function getButtonClasses(plan: PricingPlan) {
  const base =
    "mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
  if (plan.highlight) {
    return `${base} bg-blue-600 text-white hover:bg-blue-700`
  }
  if (plan.planned) {
    return `${base} bg-amber-500 text-white hover:bg-amber-600`
  }
  return `${base} bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800`
}

function PlanCTA({ plan }: { plan: PricingPlan }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const className = getButtonClasses(plan)

  if (plan.planned) {
    return (
      <a
        href="mailto:hello@plainpath.app?subject=PlainPath%20Team%20Waitlist"
        className={className}
      >
        {plan.ctaLabel}
      </a>
    )
  }

  if (plan.planKey) {
    return (
      <div>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setError(null)
            setLoading(true)
            try {
              await startStripeCheckout(plan.planKey!)
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to start checkout")
              setLoading(false)
            }
          }}
          className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? "Redirecting…" : plan.ctaLabel}
        </button>
        {error && (
          <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
        )}
      </div>
    )
  }

  return (
    <button type="button" className={className}>
      {plan.ctaLabel}
    </button>
  )
}

export default function PricingSection() {
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
          Simple pricing for real document work
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
          Start with a low monthly plan, then move up when you need more
          analyses and the full PlainPath workflow.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
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

            {plan.planned && (
              <div className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
                Coming Soon
              </div>
            )}

            <div className="pt-2">
              <h3 className="text-xl font-semibold">{plan.name}</h3>

              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">
                  {plan.period}
                </span>
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

              <PlanCTA plan={plan} />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
        Team pricing is shown as a forward-looking option. Current V1 is best
        positioned for single-user use with local saved analyses on the current
        device/browser.
      </div>
    </section>
  )
}
