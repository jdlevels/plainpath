import { useEffect } from "react"
import { Link } from "wouter"
import { AlertTriangle, CheckCircle2, ArrowRight, Clock, FileText, Shield, Phone } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function EvictionNotice() {
  useEffect(() => {
    document.title = "How to Read an Eviction Notice — PlainPath Guide"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            How to read an eviction notice
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Receiving an eviction notice is stressful — but most eviction processes have strict legal rules. Understanding the notice type and your response deadline can preserve your rights.
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">Act immediately — deadlines are strict</p>
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                Eviction notices have hard deadlines — often 3, 5, or 14 days. Missing these deadlines can waive your right to contest the eviction. Read the notice the same day you receive it and determine your response deadline immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold">Types of eviction notices</h2>

          {[
            {
              icon: FileText,
              title: "Pay or Quit notice",
              desc: "The most common type. You have a short window (typically 3–5 days, depending on your state) to pay the overdue rent or vacate. If you pay the full amount within the notice period, the eviction proceeding generally cannot continue. Keep proof of payment.",
            },
            {
              icon: AlertTriangle,
              title: "Cure or Quit notice",
              desc: "Issued for a lease violation other than non-payment — a pet in a no-pet unit, unauthorized occupants, etc. You have a set period to 'cure' (fix) the violation or move out. Document that you've cured the violation in writing.",
            },
            {
              icon: Clock,
              title: "Unconditional Quit notice",
              desc: "The most serious type — you're ordered to vacate with no option to pay or fix the issue. These are typically issued for repeated violations, major lease breaches, or illegal activity on the premises. If you believe this is wrong, consult a tenant attorney immediately.",
            },
            {
              icon: FileText,
              title: "End of tenancy / No-fault notice",
              desc: "In states with rent control or just-cause eviction protections, landlords must have a reason to evict. A no-fault notice may be issued when the landlord wants to reclaim the unit (for personal use, major renovation, etc.). These notices require longer notice periods — often 30–60 days.",
            },
          ].map((item, i) => (
            <Card key={i} className="p-5 border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold">Check if the notice is valid</h2>
          <p className="text-sm text-muted-foreground mb-4">An eviction notice must meet specific legal requirements. If these are missing, the notice may be invalid and the eviction process must restart.</p>
          <div className="space-y-3">
            {[
              { item: "Your full legal name and address", detail: "The notice must be addressed to you (the tenant of record) at the correct unit address." },
              { item: "The specific reason for eviction", detail: "Pay or Quit notices must state the exact amount owed and the period it covers. Cure or Quit notices must state the specific violation." },
              { item: "The response deadline", detail: "The notice must state clearly how many days you have to respond and when that period begins (typically the day you receive it)." },
              { item: "Proper service method", detail: "In most states, eviction notices must be personally served, posted on your door, or mailed by certified mail. A notice slipped under the door or sent by regular mail may be invalid." },
              { item: "Landlord's signature and contact information", detail: "The notice should include the landlord's or property manager's name and contact details." },
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

        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold">Your immediate action steps</h2>
          <div className="space-y-3">
            {[
              { step: "1", action: "Note the deadline", detail: "Write down when the notice period expires. Set a phone alarm." },
              { step: "2", action: "Read your lease", detail: "Compare the landlord's claims against your actual lease terms. Sometimes notices contain errors." },
              { step: "3", action: "Document everything", detail: "Photograph the notice and save any related communications. If you're paying overdue rent, get a receipt." },
              { step: "4", action: "Contact a tenant rights organization", detail: "Many cities have free tenant rights hotlines. Look up your local housing authority or legal aid society." },
              { step: "5", action: "Respond in writing", detail: "If you're disputing the eviction, send a written response via certified mail before the deadline. Keep a copy." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.action}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-2">Analyze your eviction notice with PlainPath</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Upload or paste your eviction notice. PlainPath will identify the notice type, extract key deadlines and required actions, and flag any missing elements that may make the notice invalid.
              </p>
              <Link
                href="/import"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Analyze this notice <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            <Phone className="w-3 h-3 inline mr-1" />
            For emergency legal help, search for "[your city] tenant legal aid" or contact your local bar association's lawyer referral service.
          </p>
        </div>

      </div>
    </div>
  )
}
