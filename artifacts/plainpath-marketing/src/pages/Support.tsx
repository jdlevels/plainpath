import { useEffect } from "react"
import { Mail, MessageCircle, FileText, ShieldCheck, CreditCard, HelpCircle } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function Support() {
  useEffect(() => {
    document.title = "Support — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 pb-24">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Support</h1>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Have a question, ran into an issue, or want to send feedback? We're here to help.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-10 flex items-start gap-4">
          <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground mb-1">Email support</p>
            <p className="text-sm text-muted-foreground mb-3">
              Send us an email and we'll get back to you as quickly as we can, typically within one business day.
            </p>
            <a
              href="mailto:support@plainpathapp.com"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              support@plainpathapp.com
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <HelpCircle className="w-4 h-4 text-primary/60" />
            Common questions
          </h2>

          <Item icon={FileText} title="How does PlainPath analyze my document?">
            You paste or upload a document (PDF, Word, or plain text). PlainPath sends the text to an AI service which extracts
            action steps, key terms, deadlines, and risks — then returns them to you structured and plain-English. Your document text
            is never stored by PlainPath; it is discarded after processing.
          </Item>

          <Item icon={ShieldCheck} title="Is my document stored or shared?">
            No. PlainPath does not store your document text. It is sent to OpenAI for analysis and immediately discarded. Your analysis results
            are saved only on your device unless you choose to use the Share feature, which stores the analysis output (not the document text)
            for up to 30 days.
          </Item>

          <Item icon={CreditCard} title="How do I manage or cancel my subscription?">
            Subscriptions are managed through Stripe. To cancel or update your plan, email us at{" "}
            <a href="mailto:support@plainpathapp.com" className="text-primary underline underline-offset-2">support@plainpathapp.com</a>{" "}
            and we'll send you a direct link to the billing portal. On iOS and Android, subscriptions are managed on the web
            at <a href="https://plainpathapp.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">plainpathapp.com</a>.
          </Item>

          <Item icon={FileText} title="What file types does PlainPath support?">
            PlainPath accepts PDF files (text-based, not scanned), Word documents (.docx), plain text files (.txt),
            and direct text paste. Scanned images inside PDFs are not supported — if your PDF is a scan, try copying
            and pasting the text directly.
          </Item>

          <Item icon={HelpCircle} title="The analysis doesn't look right — what should I do?">
            AI analysis isn't perfect. If you think something was missed or misread, try pasting a shorter, cleaner section
            of your document for a more focused result. If you're seeing a persistent issue, please email us with details —
            your feedback helps improve the product.
          </Item>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Still need help?
          </p>
          <a
            href="mailto:support@plainpathapp.com"
            className="text-sm font-semibold text-primary hover:underline"
          >
            support@plainpathapp.com
          </a>
        </div>

      </div>
      <Footer />
    </div>
  )
}

function Item({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border/50 rounded-2xl p-5 bg-card">
      <h3 className="font-semibold text-foreground mb-2 flex items-start gap-2">
        <Icon className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed pl-6">{children}</p>
    </div>
  )
}
