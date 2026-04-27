import { useEffect } from "react"
import { DollarSign, Ban, Clock, AlertTriangle, FileText, Briefcase, CheckCircle2, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function EmploymentContractRedFlags() {
  useEffect(() => {
    document.title = "Red Flags in Employment Contracts — PlainPath"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "Before you sign an employment contract or offer letter, check for these common red flags: non-competes, vague compensation, forced arbitration, and clauses that strip your rights."
    document.head.appendChild(meta)
    return () => {
      document.title = "PlainPath"
      document.head.removeChild(meta)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            Red flags in employment contracts
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Most people sign employment contracts without reading them carefully. These are the clauses that can limit your career, cost you money, or strip your rights — and what to negotiate before you start.
          </p>
        </div>

        <div className="bg-secondary/50 border border-border/50 rounded-xl p-4 mb-10 text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Offer letters vs. employment contracts.</strong> An offer letter is usually a summary of terms. An employment contract is a binding legal document. Both can contain clauses that limit your rights. Always ask for the full contract before your start date — not on it.
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-foreground">Clauses to review before signing</h2>
          {[
            {
              icon: Ban,
              title: "Non-compete clause",
              desc: "A non-compete can prevent you from working for a competitor — sometimes for years after leaving, and within a broad geographic area. Check the duration (6–12 months is more defensible than 2+ years), geographic scope (your city vs. the entire country), and industry scope. Note: many states have restricted or banned non-competes entirely. Even if unenforceable, they can scare you away from good opportunities.",
            },
            {
              icon: DollarSign,
              title: "Compensation structure and variable pay",
              desc: "If any part of your compensation is variable (bonus, commission, equity), read the exact language. Look for: 'at-will bonus' (can be changed or eliminated at any time), 'must be employed on payment date' clauses that let the company avoid paying a bonus you earned, and vesting cliffs for equity that reset if you leave before a specific date.",
            },
            {
              icon: Clock,
              title: "At-will vs. fixed-term employment",
              desc: "At-will employment means either party can end the relationship at any time for any legal reason. Fixed-term contracts offer more protection. If the contract is at-will, check whether there's any severance provision — many don't include one. If there is a termination-for-cause clause, understand exactly what qualifies as 'cause.'",
            },
            {
              icon: FileText,
              title: "Intellectual property assignment",
              desc: "Most employment contracts include an IP assignment clause — anything you create during employment belongs to the company. The risk is when the clause is too broad: some attempt to claim ownership of work you did outside work hours, on personal equipment, in a completely unrelated field. Look for (or ask for) a personal projects carve-out.",
            },
            {
              icon: Briefcase,
              title: "Mandatory arbitration",
              desc: "Arbitration clauses require you to resolve disputes through private arbitration rather than the court system. This limits your ability to join class action lawsuits and often favors the employer. Check whether the clause waives your right to a jury trial and whether you can appeal arbitration decisions.",
            },
            {
              icon: AlertTriangle,
              title: "Garden leave and notice periods",
              desc: "Some contracts include 'garden leave' — a period after you resign during which you're still technically employed (and paid) but barred from working. This can delay your start at a new job. Also check the required notice period: 2 weeks is standard, but some contracts require 30–90 days, and breach of this clause can have financial consequences.",
            },
          ].map((item, i) => (
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
          <h2 className="text-xl font-bold text-foreground">Hard red flags worth pushing back on</h2>
          {[
            "Nationwide non-compete for a role with no special competitive advantage",
            "Bonus language that says 'at company's sole discretion' with no formula or target",
            "Clause allowing the company to claw back compensation already paid",
            "IP assignment that doesn't carve out personal projects on your own time and equipment",
            "Forced arbitration combined with a class-action waiver",
            "Probationary period longer than 90 days with no stated criteria for passing",
            "No written description of your role, title, or responsibilities — scope creep is almost guaranteed",
          ].map((flag, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3.5 border border-red-200/50 dark:border-red-900/40 rounded-xl bg-red-50/40 dark:bg-red-950/10">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/85">{flag}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-xl font-bold text-foreground">Things worth negotiating</h2>
          {[
            "Remove or narrow the geographic scope of any non-compete",
            "Add a personal projects carve-out to the IP assignment clause",
            "Ask for severance language — even 2–4 weeks is better than nothing",
            "Request a written bonus formula tied to measurable targets",
            "Ask for a start date that gives you time to read everything carefully",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3.5 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/85">{item}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-2 text-foreground">Read your employment contract with PlainPath</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Upload or paste your job offer or employment contract and get a complete plain-English breakdown: every obligation, restriction, and risk clause — so you know exactly what you're agreeing to before day one.
              </p>
              <a
                href="/demo/analyze"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                See demo <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          This guide is general legal information, not legal advice. Employment law varies significantly by state and country. Consult an employment attorney for guidance on your specific situation.
        </p>
      </div>
      <Footer />
    </div>
  )
}
