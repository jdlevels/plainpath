import { useEffect } from "react"
import { CheckCircle2, XCircle, ArrowRight, Minus } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function VsAiLawyer() {
  useEffect(() => {
    document.title = "PlainPath vs AI Lawyer — Full Comparison"
    const meta = document.createElement("meta")
    meta.name = "description"
    meta.content = "Compare PlainPath and AI Lawyer (ailawyer.pro). PlainPath is built specifically for document understanding — not generic legal chat — with focused tools for document analysis and contract review."
    document.head.appendChild(meta)
    return () => {
      document.title = "PlainPath"
      document.head.removeChild(meta)
    }
  }, [])

  const features = [
    { feature: "PlainPath Pro price",                              plainpath: "$19.99/mo", ailawyer: "Free / $10–$30/mo" },
    { feature: "Document-grounded analysis",                       plainpath: true,        ailawyer: "partial" },
    { feature: "Upload and paste documents",                       plainpath: true,        ailawyer: true },
    { feature: "Plain English breakdown",                          plainpath: true,        ailawyer: true },
    { feature: "Structured risk identification",                   plainpath: true,        ailawyer: false },
    { feature: "Lease-specific analysis",                          plainpath: true,        ailawyer: "partial" },
    { feature: "Medical bill analysis",                            plainpath: true,        ailawyer: false },
    { feature: "IRS letter analysis",                              plainpath: true,        ailawyer: "partial" },
    { feature: "Contract clause-by-clause review",                 plainpath: true,        ailawyer: false },
    { feature: "Key terms surfaced automatically",                 plainpath: true,        ailawyer: false },
    { feature: "Free demo available",                              plainpath: true,        ailawyer: true },
  ]

  function Cell({ value }: { value: boolean | string }) {
    if (value === true) return <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
    if (value === false) return <XCircle className="w-5 h-5 text-muted-foreground/30 mx-auto" />
    if (value === "partial") return <Minus className="w-5 h-5 text-amber-400 mx-auto" />
    return <span className="text-sm font-semibold text-foreground">{value}</span>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">

        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Comparison</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            PlainPath vs AI Lawyer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI Lawyer is a legal chatbot that can discuss documents. PlainPath is a specialized document analysis tool that gives you structured findings, specific deadlines, risk identification, and purpose-built tools for every document situation.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 mb-10">
          <h3 className="text-sm font-bold text-foreground mb-3">The core difference</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Lawyer</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A chat-first experience. You describe your situation or paste text and get a conversational response. Great for quick Q&amp;A, but doesn't produce a structured analysis of what your specific document requires of you.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">PlainPath</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Document-first. Upload or paste your document and get a structured breakdown: every required action, hard deadline, risk item, and key term — organized by priority. Then get a full contract review with clause-by-clause analysis and negotiation language.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 overflow-hidden mb-12">
          <div className="grid grid-cols-[1fr_120px_120px] bg-muted/40 border-b border-border/50 px-5 py-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feature</p>
            <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">PlainPath</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">AI Lawyer</p>
          </div>
          {features.map((row, i) => (
            <div key={i} className={`grid grid-cols-[1fr_120px_120px] px-5 py-3.5 ${i % 2 === 0 ? "" : "bg-muted/20"} border-b border-border/30 last:border-0`}>
              <p className="text-sm text-foreground/85 flex items-center">{row.feature}</p>
              <div className="flex items-center justify-center">
                <Cell value={row.plainpath} />
              </div>
              <div className="flex items-center justify-center">
                <Cell value={row.ailawyer} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h3 className="text-base font-bold text-foreground mb-3">AI Lawyer is good if…</h3>
            <ul className="space-y-2">
              {[
                "You want to ask general legal questions in a chat format",
                "You need a quick legal Q&A without a specific document",
                "You're comfortable with conversational AI answers",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="text-base font-bold text-foreground mb-3">PlainPath is better if…</h3>
            <ul className="space-y-2">
              {[
                "You have a specific document and need to know what it requires of you",
                "You want structured risk findings, not just a chat answer",
                "You want a contract reviewed clause by clause with negotiation language",
                "You need plain-English analysis of a lease, medical bill, or IRS letter",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">See it for yourself</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-lg mx-auto">
            Try PlainPath's document analysis demo and see what structured findings look like compared to a chat response.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Try the demo <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted/50 transition-colors"
            >
              View pricing
            </a>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Pricing and features accurate as of April 2026. AI Lawyer features sourced from their public website and app.
        </p>
      </div>
      <Footer />
    </div>
  )
}
