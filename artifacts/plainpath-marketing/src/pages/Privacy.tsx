import { useEffect } from "react"
import { Shield, Lock, Eye, Server, RefreshCw, Mail, CreditCard } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

const LAST_UPDATED = "April 22, 2026"

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 pb-24">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            PlainPath is built on a simple principle: your documents are your business, not ours.
            This policy explains exactly what data we handle, how, and why — including what differs
            between free and paid users.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-10">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Short version
          </h2>
          <ul className="space-y-2 text-sm text-foreground/80 leading-relaxed">
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> Free-tier use requires no account and no personal information.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> Your document text is sent to OpenAI for analysis and is subject to OpenAI's data policies.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> For free-tier analysis, PlainPath does not store your documents or analysis results. Unsaved analyses exist only in your browser session.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> Signed-in users can save analysis results to their account so they can access them across sessions and devices. You can delete saved results at any time.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> When you use the Share feature, your analysis output is stored on PlainPath servers for up to 30 days to generate a shareable link. No document text is attached.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> If you subscribe to a paid plan, your email address is stored on PlainPath servers and processed by Stripe. Payment details are held by Stripe, not PlainPath.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">✓</span> If you use the deadline email reminder feature, your email address is processed by Resend to deliver the reminder. It is not stored by PlainPath beyond the delivery attempt.</li>
          </ul>
        </div>

        <div className="space-y-10 prose prose-sm max-w-none">

          <Section icon={Eye} title="1. What we collect">
            <p>PlainPath's data collection depends on which features you use.</p>

            <p><strong>Document analysis (free tier)</strong></p>
            <ul>
              <li><strong>Uploaded files</strong> are held in server memory only for the duration of processing (typically a few seconds). They are never written to disk, stored in a database, or logged by PlainPath.</li>
              <li><strong>Extracted text</strong> from your document is sent to OpenAI's API to generate your action plan. This text is not stored by PlainPath after the response is returned.</li>
              <li><strong>Analysis results</strong> are returned to your browser. They exist only in your current session unless you choose to save them locally. Saving an analysis writes it to your browser's local storage on your device — it is not uploaded to PlainPath servers.</li>
            </ul>

            <p><strong>Saved analyses (paid plans)</strong></p>
            <p>Signed-in users on paid plans can save analysis results to their account so work persists across sessions and devices. Saved results are stored on PlainPath servers linked to your account. You can delete them at any time from the My Analyses page. Original uploaded document files are not retained after processing.</p>

            <p><strong>Share feature</strong></p>
            <ul>
              <li>When you use the Share feature, the structured analysis output (not your original document text) is stored on PlainPath servers to power the shareable link. Shared analyses are automatically deleted after <strong>30 days</strong>. No personal information or document content is stored alongside the share record.</li>
            </ul>

            <p><strong>Paid subscriptions</strong></p>
            <ul>
              <li>If you subscribe to a paid plan, your <strong>email address</strong> is collected and stored on PlainPath servers to identify your subscription status. This email is processed by <strong>Stripe</strong> for payment and billing. PlainPath does not store your payment card details — those are held by Stripe.</li>
              <li>Subscription records (email address, plan type, subscription status, renewal date) are retained for as long as your subscription is active. After cancellation, these records may be retained for up to 90 days for billing reconciliation, then deleted.</li>
            </ul>

            <p><strong>Email deadline reminders</strong></p>
            <ul>
              <li>If you choose to receive a deadline reminder email, you provide your email address. That address is sent to <strong>Resend</strong> (our email delivery provider) to deliver the reminder. PlainPath does not retain your email address after the delivery attempt is made.</li>
            </ul>

            <p><strong>Usage metering</strong></p>
            <ul>
              <li>For free-tier users, PlainPath tracks the number of analyses run in the current calendar month using your browser's local storage. This data stays on your device and is not transmitted to PlainPath.</li>
            </ul>
          </Section>

          <Section icon={Server} title="2. Third-party services">
            <p>PlainPath uses the following third-party services that receive or process data on your behalf:</p>

            <p><strong>OpenAI</strong> — Document analysis</p>
            <p>When you submit a document, the extracted text is sent to OpenAI's API to generate your action plan. OpenAI's data handling is governed by <a href="https://openai.com/policies/" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAI's policies</a>. As of the date of this policy, OpenAI does not use API-submitted data to train its models by default.</p>
            <p><strong>We recommend you do not upload documents containing sensitive personal information</strong> such as Social Security Numbers, financial account numbers, medical records, or other highly sensitive data.</p>

            <p><strong>Stripe</strong> — Payment processing (paid plans only)</p>
            <p>Subscriptions are processed by Stripe, Inc. When you subscribe, your email address and payment details are handled by Stripe. PlainPath receives only subscription status and the email you used to subscribe. Stripe's privacy practices are described at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">stripe.com/privacy</a>.</p>

            <p><strong>Resend</strong> — Transactional email (deadline reminders only)</p>
            <p>If you request a deadline reminder email, the email is delivered via Resend. Your email address is passed to Resend solely for the purpose of delivering that specific reminder. Resend's privacy policy is available at <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">resend.com/legal/privacy-policy</a>.</p>
          </Section>

          <Section icon={RefreshCw} title="3. Data retention">
            <ul>
              <li><strong>Unsaved analyses</strong> — exist only in your browser's memory for the duration of your session. Refreshing the page or closing the tab removes them permanently.</li>
              <li><strong>Device-saved analyses</strong> — stored in your browser's local storage on your device only. You can delete them at any time from the My Analyses page.</li>
              <li><strong>Shared analyses</strong> — the structured analysis output (not your document) is stored on PlainPath servers to power the shareable link. Automatically deleted after <strong>30 days</strong>.</li>
              <li><strong>Saved analysis results</strong> (paid plans) — analysis output stored on PlainPath servers linked to your account is retained until you delete it or your account is closed.</li>
              <li><strong>Subscriber records</strong> (paid plans only) — your email address and subscription status are stored on PlainPath servers for as long as your plan is active, plus up to 90 days after cancellation for billing reconciliation. After that period, all subscriber data is permanently deleted.</li>
              <li><strong>Deadline reminder emails</strong> — your email address is passed to Resend for a single delivery. It is not stored in PlainPath's database.</li>
            </ul>
            <p>For free-tier document analysis, PlainPath does not retain uploaded files or document text after processing is complete.</p>
          </Section>

          <Section icon={Lock} title="4. Cookies and analytics">
            <p>PlainPath does not use cookies for tracking or advertising. No third-party analytics services are embedded in the product.</p>
            <p>Usage metering for free-tier limits is handled using your browser's <code>localStorage</code> on your device. This data is not transmitted to PlainPath.</p>
            <p>Standard server access logs may record your IP address and request metadata (URL path, HTTP status code, timestamp). These logs are used only for debugging and operational monitoring and are not shared with third parties.</p>
          </Section>

          <Section icon={CreditCard} title="5. Subscriptions and billing">
            <p>PlainPath offers paid subscription plans. Subscriptions are managed externally via Stripe.</p>
            <ul>
              <li>Payment card details are entered directly on Stripe's hosted checkout page. PlainPath never sees, stores, or handles raw card numbers.</li>
              <li>After checkout, Stripe notifies PlainPath of your subscription status. PlainPath stores your email address and plan level to enable the features you've paid for.</li>
              <li>You can cancel your subscription at any time via Stripe's billing portal.</li>
              <li>On iOS and Android apps, subscriptions are managed on the web at plainpathapp.com — in-app payment flows are not available in the native apps.</li>
            </ul>
          </Section>

          <Section icon={Shield} title="6. What PlainPath does not do">
            <ul>
              <li>Does not store uploaded document files after processing is complete. For free-tier analysis, document text is also not retained. Signed-in users on paid plans may save analysis output linked to their account — original document files are never retained.</li>
              <li>Does not share your documents with third parties other than OpenAI (for AI analysis).</li>
              <li>Does not sell data.</li>
              <li>Does not require an account or email address for free-tier use.</li>
              <li>Does not use your documents to train any model.</li>
              <li>Does not submit, file, or act on any document on your behalf.</li>
              <li>Does not store payment card information — all payment processing is delegated to Stripe.</li>
              <li>Does not send marketing emails. Any email you receive from PlainPath will be a transactional message (deadline reminder or subscription receipt) that you explicitly requested.</li>
            </ul>
          </Section>

          <Section icon={Mail} title="7. Contact">
            <p>Questions about this privacy policy? Reach out at <a href="mailto:support@plainpathapp.com" className="text-primary underline underline-offset-2">support@plainpathapp.com</a>.</p>
            <p>We will update this policy as the product evolves. The "Last updated" date at the top reflects the most recent revision.</p>
          </Section>

        </div>
      </div>
      <Footer />
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
        <Icon className="w-5 h-5 text-primary/60" />
        {title}
      </h2>
      <div className="space-y-3 text-foreground/75 leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:underline [&_a]:underline-offset-2 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
        {children}
      </div>
    </div>
  )
}
