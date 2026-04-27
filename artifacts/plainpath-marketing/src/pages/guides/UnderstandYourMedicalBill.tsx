import { useEffect } from "react"
import { HeartPulse, DollarSign, AlertTriangle, CheckCircle2, ArrowRight, FileText, Clock, ShieldCheck, Search, Calculator } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function UnderstandYourMedicalBill() {
  useEffect(() => {
    document.title = "Understand Your Medical Bill in Plain English — PlainPath"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "Medical bills are notoriously confusing. PlainPath breaks down what you actually owe, what to dispute, and what your rights are — in plain English, in seconds."
    document.head.appendChild(meta)
    return () => {
      document.title = "PlainPath"
      document.head.removeChild(meta)
    }
  }, [])

  const concerns = [
    {
      icon: Calculator,
      title: "What you actually owe vs. what they're billing",
      desc: "Medical bills mix 'billed charges' (the sticker price), 'contracted rates' (what your insurer agreed to pay), and your patient responsibility. PlainPath separates these and explains the actual amount you're expected to pay.",
    },
    {
      icon: Search,
      title: "Billing errors and duplicate charges",
      desc: "Studies estimate 30–80% of medical bills contain errors. Common mistakes include duplicate line items, charges for services not received, and upcoded procedures. PlainPath flags unusual or potentially erroneous charges.",
    },
    {
      icon: DollarSign,
      title: "Collections deadlines and payment options",
      desc: "Many bills include a deadline before the account goes to collections. Others offer payment plans that aren't advertised. PlainPath identifies every deadline, payment option mentioned, and what happens if you miss them.",
    },
    {
      icon: ShieldCheck,
      title: "Financial assistance programs",
      desc: "Hospitals with nonprofit status are required to offer charity care or financial assistance. Many bills don't mention this. PlainPath identifies whether financial assistance programs are referenced and what the eligibility criteria are.",
    },
    {
      icon: FileText,
      title: "Insurance claim explanations",
      desc: "Explanation of Benefits (EOB) documents explain what your insurer covered and why certain claims were denied. PlainPath translates denial codes, appeal windows, and coverage determinations into plain language.",
    },
    {
      icon: AlertTriangle,
      title: "Surprise billing and balance billing",
      desc: "If an out-of-network provider treated you at an in-network facility, you may have protections under the No Surprises Act. PlainPath identifies potential surprise billing situations and flags your rights.",
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Medical Bill Analysis</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            Understand your medical bill before you pay it
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Medical bills are intentionally difficult to read. They mix billing codes, insurance adjustments, and payment due dates in a way that obscures what you actually owe. PlainPath makes sense of it all — in plain English.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10 p-5 bg-muted/30 rounded-2xl border border-border/50">
          {[
            { label: "Bills with errors", value: "~50%", sub: "contain billing mistakes" },
            { label: "Average dispute savings", value: "$1,300+", sub: "per successfully disputed bill" },
            { label: "People who just pay", value: "80%", sub: "without checking the bill" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs font-semibold text-foreground/70 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-foreground">What PlainPath explains in your medical bill</h2>
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
          <h2 className="text-xl font-bold text-foreground">Signs your medical bill may have errors</h2>
          {[
            "Services listed that you don't recall receiving during your visit",
            "Generic billing codes with no description of what the service was",
            "The same line item appears more than once",
            "Charges for medical equipment or supplies you never used",
            "The bill amount is significantly higher than your insurance EOB shows as your responsibility",
            "Charges from a provider you don't recognize (out-of-network anesthesiologist, radiologist, etc.)",
            "No itemized breakdown — just a lump sum or category totals",
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
              <h3 className="text-sm font-bold mb-2 text-foreground">Analyze your medical bill now</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Paste or upload your medical bill or Explanation of Benefits. PlainPath breaks down what you owe, flags potential errors, identifies appeal deadlines, and explains your payment options — in about 90 seconds.
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

        <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/40 mb-8">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            After the analysis, you can ask PlainPath follow-up questions: "Am I required to pay this?" "How do I dispute this charge?" "What happens if I can't pay right now?"
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          This page is general health billing information, not medical or legal advice. Billing practices vary by provider and insurer. For serious disputes, consult a patient advocate or healthcare attorney.
        </p>
      </div>
      <Footer />
    </div>
  )
}
