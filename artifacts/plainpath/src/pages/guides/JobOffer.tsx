import { useEffect } from "react"
import { Link } from "wouter"
import { ArrowRight, CheckCircle2, AlertTriangle, Shield, Clock, DollarSign, Lock, Briefcase } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function JobOffer() {
  useEffect(() => {
    document.title = "Job Offer Red Flags to Check Before You Sign — PlainPath Guide"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            Job offer red flags to check before you sign
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Employment attorneys see the same costly mistakes repeatedly. These are the clauses most people skip — and the ones that limit you most when you leave.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              <strong>Important:</strong> Once you sign an employment agreement, most of its terms become binding immediately. Non-competes, IP assignment clauses, and arbitration waivers are extremely difficult to renegotiate after signing. Read before you sign.
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold">The 7 clauses most people miss</h2>

          {[
            { icon: Lock, title: "Non-compete clause", desc: "A non-compete restricts where you can work after leaving this employer — sometimes for 1–3 years and across entire industries. Check the geographic scope, duration, and what counts as a 'competing business.' Several states (California, Minnesota, Oklahoma) ban most non-competes. Others heavily restrict them. Even unenforceable non-competes cause real harm because employers threaten litigation." },
            { icon: Shield, title: "IP assignment clause", desc: "Many offer letters include a clause assigning all inventions and creative work you produce to the employer — sometimes including work done on your own time with your own equipment. Check whether the assignment is limited to work-related IP or covers everything you create during employment." },
            { icon: Shield, title: "Arbitration agreement", desc: "Many employment offers include mandatory arbitration, waiving your right to sue in court. This significantly limits your options if you experience discrimination, wage theft, or wrongful termination. Courts increasingly enforce these clauses. Read whether class action is also waived." },
            { icon: DollarSign, title: "Clawback provisions", desc: "Some offers include clawbacks on signing bonuses, relocation assistance, or equity if you leave within 1–2 years. A $20,000 signing bonus that must be repaid if you leave within 18 months is a real liability — calculate the after-tax amount you'd owe." },
            { icon: Clock, title: "At-will modification language", desc: "If the offer is 'at-will' (common in the US), check that other language doesn't promise a specific term ('you'll be employed for at least one year') — these conflict, and you want clarity on which controls." },
            { icon: Briefcase, title: "Commission and bonus structure", desc: "If your compensation includes commission or bonuses, check whether the employer can change the structure unilaterally, whether there's a minimum guarantee, and what happens to earned commissions if you leave before they're paid out." },
            { icon: AlertTriangle, title: "Non-solicitation clause", desc: "Separate from non-competes, non-solicitation clauses prevent you from recruiting former colleagues or contacting former clients. These are often broader and more enforceable than non-competes — even in states that limit non-competes." },
          ].map((item, i) => (
            <Card key={i} className="p-5 border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-2">Run a Contract Review on your offer</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Upload or paste your employment offer and PlainPath will rate every clause Fair, Watch Out, or Red Flag — and provide specific negotiation language for anything problematic. Free to use.
              </p>
              <Link href="/contract-review" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                Review my offer letter <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          This guide is general legal information, not legal advice. Employment law varies significantly by state and country. For high-stakes employment situations, consult an employment attorney before signing.
        </p>
      </div>
    </div>
  )
}
