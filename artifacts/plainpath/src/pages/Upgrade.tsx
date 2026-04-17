import { useEffect } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  Check, Zap, BarChart3, ShieldCheck, PenLine, Scale,
  ArrowRight, Sparkles, Users, Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRICING_PLANS } from "@/data/pricingData"

const PLAN_ICONS: Record<string, React.ElementType> = {
  starter: BarChart3,
  pro: Zap,
  team: Users,
}

const PLAN_COLORS: Record<string, string> = {
  starter: "text-blue-500",
  team: "text-emerald-500",
}

const TOOL_BREAKDOWN = [
  { icon: BarChart3,  name: "Analyze a Document",     starter: true,  pro: true, desc: "Plain-English breakdown of any document" },
  { icon: ShieldCheck, name: "Document Trust Check",  starter: false, pro: true, desc: "Verify legitimacy, detect scams and fraud" },
  { icon: PenLine,   name: "Contract Builder",        starter: false, pro: true, desc: "Generate professional agreements in minutes" },
  { icon: Scale,     name: "Contract Review",         starter: false, pro: true, desc: "Catch unfair clauses before you sign" },
]

export default function Upgrade() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    document.title = "Plans & Pricing — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Plans &amp; Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            Simple pricing. Powerful tools.
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Start free with two analyses per month. Upgrade to unlock the full PlainPath toolkit — no contracts, cancel anytime.
          </p>
        </motion.div>

        {/* Coming Soon Banner */}
        <div className="mb-10 flex items-center justify-center gap-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-5 py-3">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            Paid plans are launching soon. All tools are available to try while we finalize payments.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {PRICING_PLANS.map((plan, i) => {
            const planKey = plan.planKey ?? "team"
            const Icon = PLAN_ICONS[planKey] ?? Users
            const isHighlight = plan.highlight
            const isPlanned = plan.planned

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`relative rounded-2xl border p-5 flex flex-col ${
                  isHighlight
                    ? "border-primary bg-primary/4 dark:bg-primary/5 shadow-md"
                    : "border-border/60 bg-card"
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                      Most popular
                    </span>
                  </div>
                )}
                {isPlanned && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-border/50">
                      Planned
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isHighlight ? "bg-primary/12" : "bg-secondary"}`}>
                    <Icon className={`w-4 h-4 ${isHighlight ? "text-primary" : PLAN_COLORS[planKey] ?? "text-muted-foreground"}`} />
                  </div>
                  <span className="font-bold text-base text-foreground">{plan.name}</span>
                </div>

                <div className="mb-3">
                  <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
                  {plan.description}
                </p>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHighlight ? "text-primary" : "text-emerald-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isPlanned ? (
                  <button
                    onClick={() => setLocation("/support")}
                    className="w-full py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Join waitlist
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl border border-dashed border-border/60 text-xs text-center text-muted-foreground/60">
                    Coming soon
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Tool access comparison */}
        <div className="mb-14">
          <h2 className="text-lg font-bold text-foreground mb-1">What's included in each plan</h2>
          <p className="text-sm text-muted-foreground mb-5">All plans include access to start immediately. Some tools require Pro.</p>

          <div className="border border-border/50 rounded-2xl overflow-hidden bg-card">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px] border-b border-border/50 bg-muted/30">
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Tool</div>
              <div className="py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Starter</div>
              <div className="py-3 text-xs font-bold uppercase tracking-widest text-primary text-center">Pro</div>
            </div>

            {TOOL_BREAKDOWN.map((tool, i) => (
              <div
                key={tool.name}
                className={`grid grid-cols-[1fr_80px_80px] items-center ${i < TOOL_BREAKDOWN.length - 1 ? "border-b border-border/40" : ""}`}
              >
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <tool.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                  </div>
                </div>
                <div className="text-center py-4">
                  {tool.starter
                    ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    : <span className="text-muted-foreground/30 text-lg">—</span>
                  }
                </div>
                <div className="text-center py-4">
                  <Check className="w-4 h-4 text-primary mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free tier reminder */}
        <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-center mb-10">
          <p className="text-sm font-semibold text-foreground mb-1">Already have access right now</p>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            You can run 2 free document analyses per month — no payment needed. Upgrade when you need more.
          </p>
          <Button
            onClick={() => setLocation("/analyze")}
            className="gap-2 rounded-full px-8"
          >
            Analyze a document
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Questions about pricing? <a href="/support" className="text-primary hover:underline">Contact us</a> — we reply to every message.
        </p>

      </div>
    </div>
  )
}
