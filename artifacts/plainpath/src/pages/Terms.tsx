import { useEffect } from "react"
import { Link } from "wouter"
import { Scale, AlertTriangle, FileText, ShieldCheck, Mail, CreditCard } from "lucide-react"

const LAST_UPDATED = "April 6, 2026"

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-24">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold">Terms of Service</h1>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            By using PlainPath, you agree to these terms. Please read them — they're written to be straightforward.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-5 mb-10">
          <h2 className="font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Important: PlainPath is not professional advice
          </h2>
          <p className="text-sm text-amber-800/80 dark:text-amber-300/90 leading-relaxed">
            PlainPath analyzes document text and generates structured summaries. It is an organizational tool only.
            It does not provide legal, tax, financial, medical, or any other professional advice.
            Always consult a qualified professional for decisions that affect your legal rights, finances, or health.
          </p>
        </div>

        <div className="space-y-10">

          <Section icon={FileText} title="1. What PlainPath is">
            <p>PlainPath is a document reading and organization tool. You submit a document (PDF, Word file, or plain text), and PlainPath uses AI to extract and structure the requirements, steps, deadlines, and risks mentioned in that document.</p>
            <p>PlainPath is a reading and summarization tool only. It does not:</p>
            <ul>
              <li>Submit, file, or transmit any document on your behalf.</li>
              <li>Provide legal, tax, financial, or medical advice.</li>
              <li>Verify the accuracy or completeness of any document you upload.</li>
              <li>Guarantee that its analysis is complete, correct, or applicable to your specific situation.</li>
            </ul>
          </Section>

          <Section icon={ShieldCheck} title="2. Acceptable use">
            <p>You may use PlainPath for personal, educational, or business purposes, subject to these terms. You agree not to:</p>
            <ul>
              <li>Use PlainPath to process documents you do not have the right to submit.</li>
              <li>Attempt to reverse engineer, scrape, or abuse the service.</li>
              <li>Submit content that is unlawful, harmful, or violates third-party rights.</li>
              <li>Use PlainPath in ways that violate applicable laws in your jurisdiction.</li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="3. No professional advice — limitation of liability">
            <p>The output produced by PlainPath is an AI-generated summary of a document. It may be incomplete, inaccurate, or missing important context. <strong>Do not rely on PlainPath's output to make legal, financial, medical, or other consequential decisions without independent verification.</strong></p>
            <p>To the maximum extent permitted by applicable law, PlainPath and its operators are not liable for:</p>
            <ul>
              <li>Errors, omissions, or inaccuracies in analysis results.</li>
              <li>Decisions made in reliance on PlainPath's output.</li>
              <li>Missed deadlines, rejected applications, or other consequences arising from use of the service.</li>
              <li>Loss of data due to browser session expiry.</li>
            </ul>
            <p>PlainPath is provided "as is" without warranties of any kind, express or implied.</p>
          </Section>

          <Section icon={FileText} title="4. Your content">
            <p>You retain all rights to documents you submit. By submitting a document, you grant PlainPath a temporary, limited license to process that content solely for the purpose of providing you with the analysis you requested.</p>
            <p>PlainPath does not claim ownership over any content you submit. See our <Link href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link> for details on how your content is handled.</p>
          </Section>

          <Section icon={CreditCard} title="5. Subscriptions and billing">
            <p>PlainPath offers optional paid subscription plans. Free-tier use does not require any payment or account creation.</p>
            <ul>
              <li>Subscriptions are processed by <strong>Stripe</strong>. Your payment details are entered on Stripe's secure checkout page and are not stored by PlainPath.</li>
              <li>By subscribing, you authorize recurring monthly charges to your payment method. Your email address is stored by PlainPath to manage your subscription.</li>
              <li>You may cancel your subscription at any time via the Stripe billing portal. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused time.</li>
              <li>PlainPath reserves the right to change subscription prices with reasonable notice. Continued subscription after a price change constitutes acceptance of the new price.</li>
              <li>If a payment fails, your plan may be downgraded to the free tier until payment is resolved.</li>
            </ul>
            <p>On iOS and Android native apps, subscriptions are managed on the web at plainpathapp.com. In-app purchase flows are not available in the native apps.</p>
          </Section>

          <Section icon={Scale} title="6. Changes to the service">
            <p>PlainPath is an evolving product. We may change, suspend, or discontinue features at any time. We will provide notice of material changes where practicable.</p>
            <p>We may update these terms from time to time. The "Last updated" date will reflect the most recent revision. Continued use of PlainPath after an update constitutes acceptance of the revised terms.</p>
          </Section>

          <Section icon={Mail} title="7. Contact">
            <p>Questions about these terms? Contact us at <a href="mailto:support@plainpathapp.com" className="text-primary underline underline-offset-2">support@plainpathapp.com</a>.</p>
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
