import { useEffect } from "react"
import { Briefcase, AlertTriangle, CheckCircle2, ArrowRight, Clock, DollarSign, Shield, FileText, Ban, Globe } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function UnderstandYourEmploymentContract() {
  useEffect(() => {
    document.title = "Understand Your Employment Contract in Plain English — PlainPath"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "Before you sign an employment contract, know what you're agreeing to. PlainPath explains non-competes, IP assignments, termination clauses, and every other obligation in plain English."
    document.head.appendChild(meta)
    return () => {
      document.title = "PlainPath"
      document.head.removeChild(meta)
    }
  }, [])

  const clauses = [
    {
      icon: Ban,
      title: "Non-compete clause",
      desc: "The most consequential clause most employees don't read carefully. Scope, geographic area, and duration all determine enforceability. PlainPath identifies whether the restriction is likely enforceable in your state and what industries or roles it would prevent you from joining.",
      flag: true,
    },
    {
      icon: Shield,
      title: "IP assignment and work-for-hire",
      desc: "Many contracts assign all intellectual property you create — including work done on your personal time — to the employer. This can affect side projects, apps, or creative work you build while employed. PlainPath flags overly broad IP clauses.",
      flag: true,
    },
    {
      icon: DollarSign,
      title: "Bonus, commission, and equity terms",
      desc: "Discretionary vs. guaranteed bonuses, clawback provisions, vesting schedules, and cliff periods all affect your total compensation significantly. PlainPath explains the exact conditions under which each payment is earned and can be forfeited.",
      flag: false,
    },
    {
      icon: FileText,
      title: "Termination and severance conditions",
      desc: "What constitutes 'cause' for termination? What severance, if any, are you owed? Does the contract include at-will employment? Does severance require signing a release? PlainPath answers these questions from your specific contract.",
      flag: false,
    },
    {
      icon: Globe,
      title: "Confidentiality and NDA scope",
      desc: "NDAs in employment contracts often extend indefinitely and cover broad categories of information. PlainPath identifies what you cannot disclose during and after employment, to whom, and for how long.",
      flag: false,
    },
    {
      icon: Shield,
      title: "Mandatory arbitration and class-action waiver",
      desc: "Many contracts require you to arbitrate disputes rather than sue in court — and waive your right to join class actions. These clauses limit your legal options significantly. PlainPath flags them clearly.",
      flag: true,
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Employment Contract Analysis</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            Understand your employment contract before you sign
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Employment contracts look standard but contain clauses that can affect your career, income, and legal rights for years after you leave. PlainPath reads your contract and explains every obligation, restriction, and red flag in plain English.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10 p-5 bg-muted/30 rounded-2xl border border-border/50">
          {[
            { label: "Workers who negotiate", value: "37%", sub: "most don't, and could" },
            { label: "With problematic IP clauses", value: "60%+", sub: "of tech contracts" },
            { label: "Non-competes challenged", value: "Many", sub: "are unenforceable as written" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs font-semibold text-foreground/70 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-foreground">Clauses PlainPath checks in your contract</h2>
          {clauses.map((item, i) => (
            <div key={i} className={`border rounded-xl p-5 bg-card ${item.flag ? "border-amber-200/60 dark:border-amber-800/40" : "border-border/50"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.flag ? "bg-amber-50 dark:bg-amber-950/30" : "bg-primary/8"}`}>
                  <item.icon className={`w-4.5 h-4.5 ${item.flag ? "text-amber-600 dark:text-amber-400" : "text-primary"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    {item.flag && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">HIGH IMPACT</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-xl font-bold text-foreground">Red flags to negotiate before signing</h2>
          {[
            "Non-compete that covers your entire industry nationwide for 2+ years",
            "IP assignment clause that covers work done on personal time with personal equipment",
            "Discretionary bonus with no stated formula or baseline — it can be zeroed at will",
            "Unilateral modification clause: employer can change terms without your consent",
            "At-will employment with no severance and mandatory arbitration — you have no protection",
            "Broad confidentiality clause with no carve-out for whistleblower protections",
            "Clawback on signing bonus if you leave before an unstated 'substantial period'",
          ].map((flag, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3.5 border border-amber-200/50 dark:border-amber-900/40 rounded-xl bg-amber-50/40 dark:bg-amber-950/10">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/85">{flag}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-2 text-foreground">Analyze your employment contract now</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Paste or upload your contract. PlainPath identifies every obligation, restriction, and red flag — non-competes, IP clauses, bonus conditions, termination rights — in plain English. Use it to know what you're agreeing to, and what to push back on.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/demo/analyze"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  See demo <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/demo/contract-review"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted/50 transition-colors"
                >
                  Full contract review
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/40 mb-8">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            After the analysis, you can ask PlainPath: "Can I negotiate this clause?" "Is this non-compete enforceable in my state?" "What happens to my equity if I'm laid off?" — answered based on your specific contract.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          This page is general employment information, not legal advice. Enforceability of specific clauses varies significantly by state. Consult a licensed employment attorney for advice specific to your situation.
        </p>
      </div>
      <Footer />
    </div>
  )
}
