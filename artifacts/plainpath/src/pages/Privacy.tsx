import { useEffect } from "react"
import { Link } from "wouter"
import { ArrowLeft, Shield, Lock, Eye, Server, RefreshCw, Mail } from "lucide-react"

const LAST_UPDATED = "March 29, 2026"

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-24">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to PlainPath
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            PlainPath is built on a simple principle: your documents are your business, not ours.
            This policy explains exactly what data we handle, how, and why.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-10">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Short version
          </h2>
          <ul className="space-y-2 text-sm text-foreground/80 leading-relaxed">
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> PlainPath does not store your documents.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> PlainPath does not require an account or collect personal information.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> Your document text is sent to an AI service (OpenAI) for analysis and is subject to OpenAI's data use policies.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> Unsaved analyses exist only in your browser session. If you choose to save, results are stored on your device only — never on PlainPath servers.</li>
          </ul>
        </div>

        <div className="space-y-10 prose prose-sm max-w-none">

          <Section icon={Eye} title="1. What we collect">
            <p>PlainPath does not collect personal information. We do not ask for your name, email, or any identifying information to use the service.</p>
            <p>When you upload or paste a document, the following occurs:</p>
            <ul>
              <li><strong>Uploaded files</strong> are held in server memory only for the duration of processing (typically a few seconds). They are never written to disk, stored in a database, or logged by PlainPath.</li>
              <li><strong>Extracted text</strong> from your document is sent to OpenAI's API to generate your action plan. This text is not stored by PlainPath.</li>
              <li><strong>Analysis results</strong> are returned to your browser and exist only in your current session unless you save them. If you use the Save feature, results are written to your browser's local storage on your device only — they are never transmitted to or stored by PlainPath.</li>
            </ul>
            <p>Checklist interactions (checking off items) and saved analyses are handled entirely on your device using browser storage. Nothing is transmitted to PlainPath after the initial analysis.</p>
          </Section>

          <Section icon={Server} title="2. Third-party AI processing">
            <p>PlainPath uses <strong>OpenAI</strong> to analyze document text and extract structured action plans. When you submit a document, the text content is sent to OpenAI's API.</p>
            <p>OpenAI's data handling is governed by <a href="https://openai.com/policies/" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAI's policies</a>. As of the date of this policy, OpenAI does not use API-submitted data to train its models by default.</p>
            <p><strong>We recommend you do not upload documents containing sensitive personal information</strong> such as Social Security Numbers, financial account numbers, medical records, or other highly sensitive data.</p>
          </Section>

          <Section icon={RefreshCw} title="3. Data retention">
            <p>PlainPath retains <strong>no user data</strong>. There is no database of documents, analyses, or user activity.</p>
            <p>Unsaved analysis results live only in your browser's memory for the duration of your session. Refreshing the page or closing the tab removes them. If you use the Save feature, your analysis is stored in your browser's local storage on your device only — it is not uploaded to or stored by PlainPath. You can delete saved analyses at any time from the My Analyses page.</p>
          </Section>

          <Section icon={Lock} title="4. Cookies and analytics">
            <p>PlainPath does not currently use cookies for tracking or advertising purposes. No third-party analytics services are embedded in the product.</p>
            <p>Standard server access logs may record your IP address and request metadata (URL path, HTTP status code, timestamp). These logs are used only for debugging and operational monitoring and are not shared with third parties.</p>
          </Section>

          <Section icon={Shield} title="5. What PlainPath does not do">
            <ul>
              <li>Does not store your documents or document text.</li>
              <li>Does not share your documents with third parties other than OpenAI for processing.</li>
              <li>Does not sell data.</li>
              <li>Does not require an account or email address.</li>
              <li>Does not use your documents to train any model.</li>
              <li>Does not submit, file, or act on any document on your behalf.</li>
            </ul>
          </Section>

          <Section icon={Mail} title="6. Contact">
            <p>Questions about this privacy policy? Reach out at <a href="mailto:hello@plainpath.app" className="text-primary underline underline-offset-2">hello@plainpath.app</a>.</p>
            <p>We will update this policy as the product evolves. The "Last updated" date at the top reflects the most recent revision.</p>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary/60" />
        {title}
      </h2>
      <div className="space-y-3 text-foreground/75 leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </div>
  )
}
