import { useEffect } from "react"
import { Home, DollarSign, Calendar, AlertTriangle, Shield, Key, CheckCircle2, ArrowRight, FileText, Clock } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function UnderstandYourLease() {
  useEffect(() => {
    document.title = "Understand Your Lease in Plain English — PlainPath"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "PlainPath reads your lease and explains every clause, deadline, and risk in plain English — in seconds. No legal background required. Understand what you're signing before you sign it."
    document.head.appendChild(meta)
    return () => {
      document.title = "PlainPath"
      document.head.removeChild(meta)
    }
  }, [])

  const concerns = [
    {
      icon: DollarSign,
      title: "Hidden fees and deposit traps",
      desc: "Leases often bury non-refundable 'admin fees' inside the security deposit section, or include automatic late fees starting the day after the 1st. PlainPath surfaces every dollar amount and tells you exactly when it applies.",
    },
    {
      icon: Calendar,
      title: "Auto-renewal you didn't see coming",
      desc: "Many leases auto-renew for another 12 months if you don't give 60 days notice before the end date. Miss that window and you're legally locked in. PlainPath flags every deadline with the exact notice period required.",
    },
    {
      icon: AlertTriangle,
      title: "Early termination penalties",
      desc: "Some leases make you responsible for all remaining rent until a replacement tenant is found — with no cap. Others cap it at 2 months. The wording matters enormously. PlainPath explains exactly what you owe if you need to leave early.",
    },
    {
      icon: Shield,
      title: "Maintenance responsibilities",
      desc: "Vague lease language like 'tenant shall maintain property in good condition' can be interpreted to put major repairs on your tab. PlainPath identifies every maintenance obligation and who bears it.",
    },
    {
      icon: Key,
      title: "Landlord entry rights",
      desc: "Your lease should specify advance notice before entry (typically 24–48 hours). Some leases grant unlimited access for inspections, photos, or showings — rights you may not want. PlainPath flags clauses that exceed standard tenant protections.",
    },
    {
      icon: FileText,
      title: "Subletting and guest restrictions",
      desc: "If your plans change and you need to sublet, a single clause could make it impossible. PlainPath identifies subletting restrictions, guest policies, and occupancy limits before they surprise you.",
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Lease Analysis</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            Understand your lease before you sign
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A lease is one of the most consequential documents most people sign — and most people sign it without reading it carefully. PlainPath reads it for you and explains every obligation, deadline, and risk in plain English.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10 p-5 bg-muted/30 rounded-2xl border border-border/50">
          {[
            { label: "Average read time", value: "45 min", sub: "without PlainPath" },
            { label: "With PlainPath", value: "90 sec", sub: "to full breakdown" },
            { label: "Issues typically found", value: "4–7", sub: "per residential lease" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs font-semibold text-foreground/70 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-foreground">What PlainPath checks in your lease</h2>
          {concerns.map((item, i) => (
            <div key={i} className="border border-border/50 rounded-xl p-5 bg-card">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-xl font-bold text-foreground">Red flags PlainPath automatically catches</h2>
          {[
            "No written move-in inspection — without a signed record of existing damage, you can be billed for it on move-out",
            "Waiver of habitability or 'as-is' clause — landlords cannot legally waive their duty to maintain livable conditions",
            "Blanket right of entry without required notice period",
            "Rent increases with no cap or formula",
            "Clause making you responsible for all repairs regardless of cause",
            "Auto-renewal with a long notice window (60+ days) buried in the middle of the lease",
            "Non-refundable fees disguised within the security deposit section",
          ].map((flag, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3.5 border border-red-200/50 dark:border-red-900/40 rounded-xl bg-red-50/40 dark:bg-red-950/10">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/85">{flag}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-2 text-foreground">Analyze your lease now — free to try</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Paste or upload your lease. PlainPath generates a complete plain-English breakdown: every required action, hard deadline, maintenance responsibility, and risk clause — in about 90 seconds.
              </p>
              <a
                href="/app/analyze"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Analyze my lease <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/40 mb-8">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            After the analysis, you can also ask PlainPath follow-up questions about your specific lease — like "Can my landlord do this?" or "What's my liability if I break the lease early?"
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          This page is general legal information, not legal advice. Tenant rights vary significantly by state and city. Consult a licensed attorney or tenant's rights organization for advice specific to your situation.
        </p>
      </div>
      <Footer />
    </div>
  )
}
