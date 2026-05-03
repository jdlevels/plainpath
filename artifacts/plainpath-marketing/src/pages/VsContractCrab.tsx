import { useEffect } from "react"
import { CheckCircle2, XCircle, ArrowRight, Minus } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function VsContractCrab() {
  useEffect(() => {
    document.title = "PlainPath vs ContractCrab — Full Comparison"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "Compare PlainPath and ContractCrab side-by-side. See why PlainPath offers broader document coverage and a lower price for everyday people who need to understand their documents."
    document.head.appendChild(meta)
    return () => {
      document.title = "PlainPath"
      document.head.removeChild(meta)
    }
  }, [])

  const features = [
    { feature: "Starting price",                    plainpath: "$4.99/mo",  contractcrab: "$30/mo" },
    { feature: "Contract analysis",                 plainpath: true,        contractcrab: true },
    { feature: "Lease analysis",                    plainpath: true,        contractcrab: false },
    { feature: "Medical bill analysis",             plainpath: true,        contractcrab: false },
    { feature: "IRS letter analysis",               plainpath: true,        contractcrab: false },
    { feature: "Employment contract analysis",      plainpath: true,        contractcrab: false },
    { feature: "Plain English breakdown",           plainpath: true,        contractcrab: "partial" },
    { feature: "Contract risk identification",      plainpath: true,        contractcrab: true },
    { feature: "Key terms surfaced automatically",  plainpath: true,        contractcrab: "partial" },
    { feature: "No-account demo",                   plainpath: true,        contractcrab: false },
  ]

  function Cell({ value }: { value: boolean | string }) {
    if (value === true) return <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
    if (value === false) return <XCircle className="w-5 h-5 text-muted-foreground/30 mx-auto" />
    if (value === "partial") return <Minus className="w-5 h-5 text-amber-400 mx-auto" />
    return <span className="text-sm font-semibold text-foreground">{value}</span>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">

        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Comparison</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            PlainPath vs ContractCrab
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ContractCrab is a contract-only review tool at $30/month. PlainPath provides document analysis and contract review for everyday people — leases, medical bills, IRS letters, contracts, and more — starting at $4.99/month.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "PlainPath Starter", price: "$4.99/mo", highlight: true,  note: "Document analysis" },
            { label: "PlainPath Pro",     price: "$19.99/mo", highlight: false, note: "Unlimited + both tools" },
            { label: "ContractCrab",      price: "$30/mo",    highlight: false, note: "Contracts only" },
          ].map((plan, i) => (
            <div key={i} className={`rounded-2xl p-5 text-center border ${plan.highlight ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card"}`}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{plan.label}</p>
              <p className={`text-2xl font-bold ${plan.highlight ? "text-primary" : "text-foreground"}`}>{plan.price}</p>
              <p className="text-xs text-muted-foreground mt-1">{plan.note}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/50 overflow-hidden mb-12">
          <div className="grid grid-cols-[1fr_120px_120px] bg-muted/40 border-b border-border/50 px-5 py-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feature</p>
            <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">PlainPath</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">ContractCrab</p>
          </div>
          {features.map((row, i) => (
            <div key={i} className={`grid grid-cols-[1fr_120px_120px] px-5 py-3.5 ${i % 2 === 0 ? "" : "bg-muted/20"} border-b border-border/30 last:border-0`}>
              <p className="text-sm text-foreground/85 flex items-center">{row.feature}</p>
              <div className="flex items-center justify-center">
                <Cell value={row.plainpath} />
              </div>
              <div className="flex items-center justify-center">
                <Cell value={row.contractcrab} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h3 className="text-base font-bold text-foreground mb-3">ContractCrab is good if…</h3>
            <ul className="space-y-2">
              {[
                "You only need to review contracts (nothing else)",
                "Your employer pays for your tools",
                "You're a small legal team or paralegal",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="text-base font-bold text-foreground mb-3">PlainPath is better if…</h3>
            <ul className="space-y-2">
              {[
                "You deal with leases, medical bills, IRS letters, or government notices",
                "You want plain English — not legal jargon",
                "You want one tool that handles your entire document life",
                "You're paying out of pocket and want a fair price",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Try PlainPath free — no credit card required</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-lg mx-auto">
            The demo shows you a real analysis without creating an account. See the difference before you decide.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Try the demo <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted/50 transition-colors"
            >
              View pricing
            </a>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Pricing and features accurate as of April 2026. ContractCrab pricing sourced from their public pricing page.
        </p>
      </div>
      <Footer />
    </div>
  )
}
