import { useEffect } from "react"
import { Link } from "wouter"
import { AlertTriangle, CheckCircle2, ArrowRight, FileText, DollarSign, Shield, Users, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function IndependentContractor() {
  useEffect(() => {
    document.title = "What to Include in an Independent Contractor Agreement — PlainPath Guide"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            What to include in an independent contractor agreement
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A handshake deal or a one-paragraph email is not enough. Here's every clause your independent contractor agreement should include — and what can go wrong if it's missing.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">Without a contract, you have no leverage</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                Scope creep, non-payment, and IP disputes are the three most common freelancer problems — and all three are preventable with clear contract language. Don't start work without a signed agreement.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold">The 8 essential sections</h2>

          {[
            {
              icon: FileText,
              title: "1. Scope of work and deliverables",
              desc: "Define exactly what you will deliver — and what you won't. List each deliverable, the format it will be delivered in, and acceptance criteria. Vague scope is the single biggest cause of freelancer disputes. If it's not in the contract, the client can claim you didn't deliver it.",
            },
            {
              icon: DollarSign,
              title: "2. Payment terms",
              desc: "Specify the total fee (or hourly rate), payment structure (flat fee, milestones, hourly), invoice schedule, and due date. Include a late payment clause — typically 1.5% per month on overdue invoices. Require a deposit (20–50%) before starting work.",
            },
            {
              icon: Clock,
              title: "3. Timeline and deadlines",
              desc: "Include a project start date, milestone dates, and a final delivery deadline. Specify what happens if the client delays feedback and pushes the timeline — your deadline should extend accordingly, without penalty to you.",
            },
            {
              icon: Shield,
              title: "4. Intellectual property and ownership",
              desc: "State that all IP transfers to the client only upon receipt of full payment. Until paid, you retain ownership. Also specify what materials you're licensed to use from the client and whether you can display the finished work in your portfolio.",
            },
            {
              icon: Users,
              title: "5. Contractor status / no employment relationship",
              desc: "Confirm that you are an independent contractor, not an employee. This means no withholding taxes, no benefits, and you retain the right to work for other clients. Include a clause stating neither party is the other's employee, partner, or agent.",
            },
            {
              icon: AlertTriangle,
              title: "6. Revision rounds",
              desc: "Cap the number of included revision rounds (2–3 is standard). Define what counts as a revision vs. a new request. Beyond the included rounds, additional revisions are billed at your hourly rate. Without this clause, clients can request unlimited changes.",
            },
            {
              icon: FileText,
              title: "7. Kill fee / early termination",
              desc: "If the client cancels after work has started, you're entitled to a kill fee — typically 25–50% of the remaining project value, plus 100% of completed work. This protects you from lost opportunity cost. Without a kill fee clause, you may receive nothing for weeks of work.",
            },
            {
              icon: Scale,
              title: "8. Dispute resolution and governing law",
              desc: "Specify which state's law governs the contract and how disputes will be resolved — negotiation, mediation, or arbitration. Including a clause that the prevailing party in any dispute is entitled to attorney's fees incentivizes the other side to settle rather than litigate.",
            },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <Card key={i} className="p-5 border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1.5">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold">Commonly missed protections</h2>
          <div className="space-y-3">
            {[
              { item: "Feedback deadline clause", detail: "If the client takes 6 weeks to review your work, your timeline should extend accordingly — or you can bill for the idle time." },
              { item: "Subcontracting rights", detail: "Clarify whether you can use subcontractors. If you do use them, you remain responsible for the quality of deliverables." },
              { item: "Confidentiality", detail: "If you'll have access to sensitive client information, include a mutual NDA. This protects both parties." },
              { item: "Portfolio / credit clause", detail: "Confirm that you can display the finished work in your portfolio and credit yourself as the creator." },
              { item: "File release clause", detail: "Working files (source files, editable documents) are released to the client only upon receipt of full payment." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{item.item}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-2">Build your contract with PlainPath</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                PlainPath's Contract Builder walks you through every section — scope, payment, IP, and protection clauses — and generates a complete, professional agreement you can download and use.
              </p>
              <Link
                href="/contract-builder"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Build a contract <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

