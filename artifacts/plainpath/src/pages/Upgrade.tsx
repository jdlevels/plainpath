import { useEffect } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  Check, Zap, BarChart3, ShieldCheck, PenLine, Scale, EyeOff,
  ArrowRight, Sparkles, Clock, GitCompare, ListChecks, MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRICING_PLANS } from "@/data/pricingData"
import { BILLING_CONFIG } from "@/lib/billingConfig"

const PLAN_ICONS: Record<string, React.ElementType> = {
  starter: BarChart3,
  pro: Zap,
}

const PLAN_COLORS: Record<string, string> = {
  starter: "text-blue-500",
}

const TOOL_BREAKDOWN = [
  { icon: BarChart3,   name: "Analyze a Document",    starter: true,  pro: true, desc: "Plain-English summary, key terms, deadlines, and required actions" },
  { icon: EyeOff,      name: "Redact Sensitive Info", starter: true,  pro: true, desc: "Automatically remove sensitive info before sharing or review" },
  { icon: ShieldCheck, name: "Document Trust Check",  starter: false, pro: true, desc: "Verify legitimacy, surface red flags, and detect fraud" },
  { icon: PenLine,     name: "Build a Contract",      starter: false, pro: true, desc: "Guided wizard that outputs a professional, ready-to-send draft" },
  { icon: Scale,       name: "Contract Review",       starter: false, pro: true, desc: "Clause-by-clause risk analysis with negotiation language" },
  { icon: GitCompare,    name: "Compare Versions",   starter: false, pro: true, desc: "Side-by-side document comparison with AI-powered change audit" },
  { icon: ListChecks,   name: "Clause Extractor",   starter: false, pro: true, desc: "Extract obligations, key dates, parties, and legal clauses from any contract" },
  { icon: MessageCircle, name: "Ask This Document", starter: false, pro: true, desc: "Ask plain-English questions about any document and get sourced answers" },
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
            Both tools included — Analyze a Document and Contract Review. No commitment — cancel anytime.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14 max-w-2xl mx-auto w-full">
          {PRICING_PLANS.map((plan, i) => {
            const planKey = plan.planKey ?? "starter"
            const Icon = PLAN_ICONS[planKey] ?? BarChart3
            const isHighlight = plan.highlight

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

                {BILLING_CONFIG.BILLING_ENABLED ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation("/subscribe")
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isHighlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "bg-secondary text-foreground hover:bg-muted"
                    }`}
                  >
                    {plan.ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl border border-dashed border-border/60 text-xs text-center text-muted-foreground/60 flex items-center justify-center gap-1.5">
                    <Clock className="w-3 h-3" /> Subscriptions launching soon
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Tool access list */}
        <div className="mb-14">
          <h2 className="text-lg font-bold text-foreground mb-1">What's included in PlainPath Pro</h2>
          <p className="text-sm text-muted-foreground mb-5">All tools available at $19.99/month — both Analyze a Document and Contract Review included.</p>

          <div className="border border-border/50 rounded-2xl overflow-hidden bg-card">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px] border-b border-border/50 bg-muted/30">
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Tool</div>
              <div className="py-3 text-xs font-bold uppercase tracking-widest text-primary text-center">PlainPath Pro</div>
            </div>

            {TOOL_BREAKDOWN.map((tool, i) => (
              <div
                key={tool.name}
                className={`grid grid-cols-[1fr_100px] items-center ${i < TOOL_BREAKDOWN.length - 1 ? "border-b border-border/40" : ""}`}
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
