import { useEffect } from "react"
import { Link } from "wouter"
import { AlertTriangle, CheckCircle2, ArrowRight, Scale, MapPin, Clock, FileText, Shield } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function NonCompete() {
  useEffect(() => {
    document.title = "Understanding Non-Compete Clauses — PlainPath Guide"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            Understanding non-compete clauses
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A non-compete can limit your ability to work for years after you leave a job. Here's how to read one, what makes it enforceable, and how to push back before you sign.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">Know your state's rules first</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                Non-competes are unenforceable in California, North Dakota, Oklahoma, and Minnesota. The FTC has also moved to ban them federally (currently in litigation). Even in states that allow them, courts often refuse to enforce overbroad ones.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold">The 4 things that determine enforceability</h2>

          {[
            {
              icon: MapPin,
              title: "Geographic scope",
              desc: "A non-compete that covers 'the entire United States' for a regional sales role is almost certainly overbroad and may be thrown out by a court. Reasonable geographic scope is typically limited to the area where you actually worked and competed — a city, state, or defined region.",
            },
            {
              icon: Clock,
              title: "Duration",
              desc: "Courts generally accept 6–12 months for most roles. Non-competes longer than 2 years are frequently found unreasonable. Anything over 3 years for a non-executive is an immediate red flag.",
            },
            {
              icon: Scale,
              title: "Legitimate business interest",
              desc: "The employer must have a real business reason for the restriction — protecting trade secrets, customer relationships, or specialized training they've invested in. A non-compete that prevents you from working in your entire industry, without a legitimate reason, is unlikely to hold up.",
            },
            {
              icon: FileText,
              title: "Scope of restricted activity",
              desc: "Non-competes should be limited to work that directly competes with your employer's actual business. If you're a marketing manager, a clause preventing you from working in 'any marketing role anywhere' is overbroad. It should be limited to roles at direct competitors.",
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
          <h2 className="text-xl font-bold">Common red flag language</h2>
          <div className="space-y-3">
            {[
              { flag: "\"…anywhere in the world\"", explain: "Global non-competes are almost always unenforceable for non-executive roles. Push back immediately." },
              { flag: "\"…for a period of 5 years\"", explain: "Courts rarely enforce non-competes longer than 2 years. Anything over 3 is almost never upheld." },
              { flag: "\"…in any industry related to the Company's business\"", explain: "If your employer makes software, this could cover most of tech. The scope must be narrower." },
              { flag: "\"…includes former employees of any subsidiary or affiliate\"", explain: "If the company has many subsidiaries, this can dramatically expand the list of employers you're barred from working for." },
            ].map((item, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-xl p-4">
                <p className="text-sm font-mono font-semibold text-red-700 dark:text-red-300 mb-1.5">{item.flag}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{item.explain}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold">How to negotiate a non-compete</h2>
          <div className="space-y-3">
            {[
              { label: "Ask for a carve-out for clients you bring", desc: "Negotiate language that lets you work with clients you had before joining the company." },
              { label: "Reduce the duration to 6–12 months", desc: "Most courts find 6–12 months reasonable. Frame it as a compromise, not a rejection." },
              { label: "Narrow the geographic scope", desc: "Limit it to the state or metro where you primarily worked, not a broad region or the whole country." },
              { label: "Limit it to direct competitors only", desc: "Ask for language that restricts you only to companies named in a list, or companies with over $X in revenue competing directly." },
              { label: "Request garden leave pay", desc: "If they insist on a 12-month non-compete, ask them to pay your salary during that period ('garden leave'). This is standard in the UK and increasingly common in the US." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-2">Review this contract with PlainPath</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Paste your employment contract or offer letter into Contract Review. PlainPath will identify overbroad non-compete language, flag missing protections, and give you exact negotiation language to use.
              </p>
              <Link
                href="/contract-review"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Review a contract <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
