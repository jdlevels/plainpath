import { useEffect } from "react"
import { Building2, AlertTriangle, CheckCircle2, ArrowRight, Clock, Calendar, FileText, DollarSign, ShieldCheck, Search } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function UnderstandYourIrsLetter() {
  useEffect(() => {
    document.title = "Understand Your IRS Letter in Plain English — PlainPath"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "Received a letter from the IRS? PlainPath explains exactly what it means, what you're required to do, and how much time you have to respond — in plain English."
    document.head.appendChild(meta)
    return () => {
      document.title = "PlainPath"
      document.head.removeChild(meta)
    }
  }, [])

  const letterTypes = [
    { code: "CP2000", name: "Underreported Income Notice", desc: "The IRS thinks your income didn't match what employers and banks reported. Doesn't mean you did anything wrong — information mismatches are common. You have a specific window to agree or dispute." },
    { code: "CP501", name: "Balance Due Reminder", desc: "You owe money and haven't paid yet. These escalate — CP501 → CP503 → CP504 (final notice before levy). Act before CP504 to avoid bank levies or wage garnishment." },
    { code: "CP2501", name: "Return Information Discrepancy", desc: "Your return doesn't match IRS records. More serious than a simple notice — requires a response explaining the discrepancy or documentation to support your figures." },
    { code: "LT11/1058", name: "Final Notice of Intent to Levy", desc: "The most serious IRS letter. They are about to seize assets. You have 30 days to respond and request a hearing. Ignoring this letter has immediate financial consequences." },
    { code: "CP12", name: "Math Error — Overpayment", desc: "Good news: the IRS found an error in your return that means you're owed more money. Review for accuracy and reply if you disagree with their calculation." },
    { code: "Letter 4464C", name: "Delayed Refund Hold", desc: "Your refund is being held while the IRS verifies your return. No action required — but PlainPath can confirm whether a response is expected or if it's purely informational." },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">IRS Letter Analysis</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            What does my IRS letter actually mean?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The IRS sends over 200 million letters per year. Most are routine — but the dense government language makes even minor notices feel alarming. PlainPath reads your IRS letter and tells you exactly what it means, what to do, and how much time you have.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 mb-10">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">IRS letters have real deadlines</p>
              <p className="text-sm text-muted-foreground">Missing the response window on an IRS notice can result in tax assessments becoming final, levies on bank accounts, or loss of appeal rights. PlainPath identifies every deadline in your letter.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Common IRS letters PlainPath can explain</h2>
          {letterTypes.map((letter, i) => (
            <div key={i} className="border border-border/50 rounded-xl p-5 bg-card">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">{letter.code}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1 text-foreground">{letter.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{letter.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-foreground">What PlainPath tells you about your IRS letter</h2>
          {[
            { icon: Search, title: "What they're actually saying", desc: "IRS language is dense and often circular. PlainPath strips it down to a plain-English explanation of exactly what the IRS is claiming and why they sent it." },
            { icon: Calendar, title: "Your exact response deadline", desc: "Every IRS notice has a specific response window — usually 30, 60, or 90 days. Missing it can make an assessment final. PlainPath finds and flags this date." },
            { icon: DollarSign, title: "What you owe (and why)", desc: "If money is owed, PlainPath explains the calculation: the original amount, any penalties, interest accrual, and what happens if it's not paid." },
            { icon: ShieldCheck, title: "Your response options", desc: "You can agree, disagree, request an installment plan, or request a hearing. PlainPath explains each option available to you based on the specific letter type." },
            { icon: FileText, title: "Whether it might be a scam", desc: "IRS scam letters are common and convincing. PlainPath's Trust Check automatically flags suspicious indicators — wrong phone numbers, wire transfer demands, missing notice numbers." },
          ].map((item, i) => (
            <div key={i} className="border border-border/50 rounded-xl p-4 bg-card flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-2 text-foreground">Analyze your IRS letter now</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Paste or upload your IRS letter. PlainPath explains what it means, identifies your response deadline, flags any scam indicators, and tells you your options — in about 90 seconds.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/demo/analyze"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  See demo <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/demo/trust-check"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted/50 transition-colors"
                >
                  Check if it's a scam
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/40 mb-8">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            After the analysis, you can ask PlainPath: "What happens if I don't respond?" "How do I set up a payment plan?" "Can I appeal this?" — answered specifically to your letter.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          This page is general tax information, not tax or legal advice. For complex IRS matters, consult a licensed CPA, enrolled agent, or tax attorney.
        </p>
      </div>
      <Footer />
    </div>
  )
}
