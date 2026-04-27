import { useEffect } from "react"
import { Lock, Clock, AlertTriangle, Globe, Users, FileText, CheckCircle2, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function UnderstandingAnNDA() {
  useEffect(() => {
    document.title = "What to Check in an NDA Before Signing — PlainPath"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "NDAs protect confidential information — but a one-sided NDA can expose you to serious risk. Learn what to check before signing any non-disclosure agreement."
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
            What to check in an NDA before you sign
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            NDAs protect confidential information — but a poorly drafted or one-sided NDA can expose you to serious legal risk. Here's what to look for before you put your name on one.
          </p>
        </div>

        <div className="bg-secondary/50 border border-border/50 rounded-xl p-4 mb-10 text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">What is an NDA?</strong> A non-disclosure agreement (also called a confidentiality agreement) is a contract that restricts one or both parties from sharing certain information with others. They're common in employment, business partnerships, investor conversations, and contractor relationships.
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-foreground">The five things to check in every NDA</h2>
          {[
            {
              icon: Lock,
              title: "How 'confidential information' is defined",
              desc: "The most important clause in any NDA. An overly broad definition (e.g., 'all information shared between the parties') could cover things you didn't intend to protect — or restrict you from using knowledge you already had. Look for a specific, limited definition that excludes publicly available information, information you already knew, and information you receive from third parties.",
            },
            {
              icon: Clock,
              title: "Duration and expiration",
              desc: "How long does the NDA last? Most NDAs run 1–3 years; perpetual NDAs are a red flag unless the information is genuinely a trade secret. Check whether the obligation ends automatically or requires a written release, and whether some categories (like trade secrets) are carved out with longer protection.",
            },
            {
              icon: Globe,
              title: "Scope of restriction",
              desc: "What are you prohibited from doing? Some NDAs only prohibit disclosure; others also restrict you from using the information for your own purposes. An overly broad 'use restriction' can prevent you from working in your own field. If an NDA prevents you from building competing products using general knowledge from your industry, push back.",
            },
            {
              icon: Users,
              title: "Mutual vs. one-way",
              desc: "A mutual NDA protects both parties equally. A one-way NDA only protects the disclosing party (almost always the company asking you to sign). In most employment and contractor contexts, one-way is standard — but the asymmetry means you're taking on all the obligation. Make sure you're at least clear on which type you're signing.",
            },
            {
              icon: AlertTriangle,
              title: "Remedies and damages clauses",
              desc: "What happens if you breach? Some NDAs include liquidated damages clauses specifying a fixed penalty (e.g., $50,000 per breach). Others give the disclosing party the right to seek injunctive relief without posting a bond. Understand exactly what your exposure is before signing.",
            },
            {
              icon: FileText,
              title: "Return or destruction of materials",
              desc: "Most NDAs require you to return or destroy confidential materials when the agreement ends. Check the timeline (typically 10–30 days after written request) and whether you're allowed to retain copies for legal compliance purposes — some industries require you to maintain records.",
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
          <h2 className="text-xl font-bold text-foreground">NDA red flags to negotiate or reject</h2>
          {[
            "Unlimited duration with no expiration date — especially for general business information",
            "Definition of 'confidential' that includes publicly available information",
            "Clause preventing you from working for competitors after the engagement ends (non-compete elements in NDAs)",
            "No carve-out for information you independently developed",
            "Assignment clause allowing the other party to transfer the NDA to a new owner without your consent",
            "Venue clause requiring disputes to be resolved in a different state or country",
            "No mutual protection — you're protecting their information, but they owe you nothing",
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
              <h3 className="text-sm font-bold mb-2 text-foreground">PlainPath can review your NDA</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Paste or upload your NDA and get a plain-English breakdown of every clause, obligation, and risk. See exactly what you're agreeing to before you sign — in under two minutes.
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
          This guide is general legal information, not legal advice. NDA enforceability varies by jurisdiction and context. Consult an attorney for guidance on your specific agreement.
        </p>
      </div>
      <Footer />
    </div>
  )
}
