import { useEffect } from "react"
import { Link } from "wouter"
import { Shield, Scale, Search, Brain, CheckCircle2, ArrowRight, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function Methodology() {
  useEffect(() => {
    document.title = "How PlainPath Works — Analysis Methodology"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20 text-xs font-semibold text-primary mb-4">
            <Shield className="w-3.5 h-3.5" />
            Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            How PlainPath works
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            PlainPath uses a structured AI methodology to turn complex documents into clear, actionable information. Here's exactly how each analysis is produced.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <Card className="p-6 border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-base font-bold mb-2">1. Document extraction</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your document text is extracted from PDFs, Word files, or plain text. No document is stored by PlainPath — extraction happens in memory during your session only, then is discarded.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-base font-bold mb-2">2. Structured AI analysis</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PlainPath sends the document text to a large language model (OpenAI GPT) with a detailed, document-type-specific prompt. The prompt instructs the model to extract action steps, deadlines, required documents, risks, and key terms — not to summarize — returning results in a structured format.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold mb-2">3. Trust check methodology</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Trust Checks score documents on three dimensions: <strong>Authenticity Risk</strong> (does this look like a real document from a legitimate source?), <strong>Document Risk</strong> (are there scam patterns, pressure tactics, or unusual payment demands?), and <strong>Verification Confidence</strong> (how much can the claims in this document be independently verified?). Each score is 0–100. Structural findings check formatting consistency, metadata, and domain/contact plausibility.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-bold mb-2">4. Contract review fairness model</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Contract Review evaluates each clause against standard commercial norms for the contract type. Clauses are rated Fair, Watch Out, or Red Flag based on: whether they're one-sided, whether they restrict the non-drafting party disproportionately, whether standard protections are absent, and whether enforcement terms are unusual or abusive.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-base font-bold mb-2">5. Attorney methodology review</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PlainPath's analysis prompts, scoring models, and output formats have been reviewed by licensed attorneys to ensure the guidance is directionally sound and not misleading. This review does not constitute legal advice — PlainPath's outputs are informational only. For decisions with significant legal or financial consequences, always consult a qualified attorney.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-muted/40 border border-border/40 rounded-2xl p-6 mb-10">
          <h3 className="text-sm font-bold mb-3">What PlainPath is not</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-red-500 shrink-0">✗</span> PlainPath is not a law firm and does not provide legal advice</li>
            <li className="flex items-start gap-2"><span className="text-red-500 shrink-0">✗</span> PlainPath does not store your documents between sessions</li>
            <li className="flex items-start gap-2"><span className="text-red-500 shrink-0">✗</span> PlainPath's Trust Check verdicts are AI-generated assessments, not legal findings</li>
            <li className="flex items-start gap-2"><span className="text-red-500 shrink-0">✗</span> PlainPath is not a substitute for a qualified attorney on high-stakes matters</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/import" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Try it on your document <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/support" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border/60 font-semibold text-sm hover:bg-secondary transition-colors">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
