import { useEffect } from "react"
import { DollarSign, Calendar, AlertTriangle, Shield, Key, FileText, CheckCircle2, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function ReviewingALease() {
  useEffect(() => {
    document.title = "How to Review a Lease Before Signing — PlainPath"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "Learn what to look for in a lease agreement before signing: security deposits, early termination, maintenance responsibilities, and the red flags that tenant attorneys catch every day."
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
            How to review a lease before you sign
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A lease is one of the most consequential documents most people sign. These are the clauses, terms, and red flags that tenant attorneys catch every day — and what to do about them.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-foreground">Clauses to read carefully</h2>
          {[
            {
              icon: DollarSign,
              title: "Security deposit limits and return conditions",
              desc: "Most states cap security deposits at 1–3 months rent. Check exactly what conditions allow the landlord to withhold it — 'normal wear and tear' is legally distinct from damage. The lease should specify the return timeline (typically 14–30 days after move-out) and what happens if they miss it.",
            },
            {
              icon: Calendar,
              title: "Lease end and renewal terms",
              desc: "Check whether the lease auto-renews, and on what terms. Some leases convert to month-to-month; others automatically renew for another full year unless you give 60 days notice. Missing this window can lock you into another year.",
            },
            {
              icon: AlertTriangle,
              title: "Early termination penalty",
              desc: "If you leave early, what's the penalty? Many leases make you responsible for all remaining rent until a replacement tenant is found — but others cap it at 2 months. Some states require landlords to mitigate by actively trying to re-rent.",
            },
            {
              icon: Shield,
              title: "Maintenance and repair responsibility",
              desc: "The lease should specify who handles what repairs. Landlords are typically responsible for habitability (heat, plumbing, structural), but tenants are often responsible for minor items. Vague language like 'tenant keeps property in good condition' can be exploited.",
            },
            {
              icon: Key,
              title: "Entry and inspection rights",
              desc: "Your landlord must give advance notice before entering (typically 24–48 hours). Check whether the lease gives them unlimited access, what constitutes an emergency waiving notice, and whether you can restrict access for professional photos or showings.",
            },
            {
              icon: FileText,
              title: "Subletting restrictions",
              desc: "If you might need to sublet (job change, travel, emergency), check whether subletting is prohibited entirely, requires landlord approval, or requires finding a replacement tenant who meets income requirements. Prohibited subletting with no early termination clause is a significant risk.",
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
          <h2 className="text-xl font-bold text-foreground">Red flags to walk away from</h2>
          {[
            "No written lease — a verbal lease is nearly impossible to enforce in your favor",
            "Waiver of habitability or 'as-is' clause — landlords cannot waive their legal duty to maintain livable conditions",
            "Blanket right of entry without notice",
            "Automatic rent increases without caps",
            "Clause making you responsible for all repairs regardless of cause",
            "Non-refundable 'administrative fees' lumped into the security deposit",
            "No move-in inspection process — you need a dated, signed record of existing damage",
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
              <h3 className="text-sm font-bold mb-2 text-foreground">Let PlainPath read your lease</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Upload or paste your lease and get a complete plain-English breakdown: every required action, deadline, maintenance responsibility, and risk clause. Typically catches 4–7 issues the average renter misses.
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

        <p className="text-xs text-muted-foreground">
          This guide is general legal information, not legal advice. Tenant rights vary by state. Consult a tenant's rights organization or attorney for your specific situation.
        </p>
      </div>
      <Footer />
    </div>
  )
}
