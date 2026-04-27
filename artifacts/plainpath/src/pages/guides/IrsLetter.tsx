import { useEffect } from "react"
import { Link } from "wouter"
import { AlertTriangle, CheckCircle2, ArrowRight, Clock, Phone, FileText, Shield } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function IrsLetter() {
  useEffect(() => {
    document.title = "How to Read an IRS Letter — PlainPath Guide"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            How to read an IRS letter
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Received a letter from the IRS? Don't panic. Most IRS letters are routine. Here's exactly what to look for, what actions are required, and how to tell a real IRS letter from a scam.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">First: check if it's real</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                The IRS sends letters by mail only — never email, text, or social media. Real IRS letters include a notice number (CP or LTR number) in the upper right corner, and list the IRS website as irs.gov. They never demand gift cards, wire transfers, or cryptocurrency.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold">What to look for in any IRS letter</h2>

          {[
            { icon: FileText, title: "Notice number (CP or LTR)", desc: "Every IRS letter has a notice or letter number in the upper right corner (e.g. CP2000, LTR4464C). This tells you exactly why they're writing and what you need to do. Search irs.gov for your specific notice number to get official instructions." },
            { icon: Clock, title: "Response deadline", desc: "Most IRS letters require a response within 30–60 days. Missing this deadline can result in additional penalties or the IRS treating a proposed change as final. Write the deadline on your calendar immediately." },
            { icon: AlertTriangle, title: "Proposed changes vs. final notices", desc: "Many IRS letters are proposals, not final demands. A CP2000 (underreported income notice) is proposing a change — you can agree, partially agree, or disagree. Final demand letters (CP503, CP504) mean you owe money and the IRS is preparing to collect." },
            { icon: Phone, title: "IRS contact number", desc: "Each letter lists a specific IRS phone number for that department. Use this number (verify it matches irs.gov) if you have questions. Never call a number from a pop-up or email about your IRS letter." },
            { icon: Shield, title: "Your Taxpayer ID", desc: "The letter will reference your Social Security Number or EIN (partially masked). Confirm this matches your records. If the TIN doesn't match yours, do not respond — contact the IRS directly to report a potential identity issue." },
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

        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold">Common IRS letter types</h2>
          {[
            { code: "CP2000", label: "Underreported income", severity: "Review", color: "text-amber-600" },
            { code: "CP504", label: "Final notice of intent to levy", severity: "Urgent", color: "text-red-600" },
            { code: "CP05", label: "Identity verification needed", severity: "Action required", color: "text-blue-600" },
            { code: "LTR4464C", label: "Refund hold — 60-day review", severity: "Informational", color: "text-muted-foreground" },
            { code: "CP14", label: "Balance due", severity: "Payment required", color: "text-amber-600" },
            { code: "CP11", label: "Math error — amount due changed", severity: "Review", color: "text-amber-600" },
          ].map((item) => (
            <div key={item.code} className="flex items-center gap-3 p-3.5 border border-border/50 rounded-xl bg-card">
              <span className="font-bold text-sm text-foreground min-w-[70px]">{item.code}</span>
              <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
              <span className={`text-xs font-semibold ${item.color}`}>{item.severity}</span>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-2">Get a plain-English breakdown of your IRS letter</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Paste or upload your IRS letter and PlainPath will extract every required action, deadline, document needed, and risk — in plain English. Sign in to run this analysis.
              </p>
              <Link href="/import" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                Analyze my IRS letter <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          This guide is for general informational purposes. For tax matters with significant financial implications, consult a CPA or tax attorney.
        </p>
      </div>
    </div>
  )
}
