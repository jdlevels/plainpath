import { useEffect } from "react"
import { Link } from "wouter"
import { ArrowRight, ShieldCheck, XCircle, AlertTriangle, CheckCircle2, Phone, Mail, CreditCard } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function ScamNotice() {
  useEffect(() => {
    document.title = "How to Identify a Scam Notice or Fake Document — PlainPath Guide"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            How to identify a scam notice or fake document
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Scammers create convincing fake documents every day — fake IRS letters, fake utility shutoff notices, fake court summons, fake prize notifications. Here's how to spot them before you act.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: XCircle, label: "High scam risk", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", desc: "Multiple red flags present. Do not respond or pay." },
            { icon: AlertTriangle, label: "Suspicious", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", desc: "Verify independently before taking any action." },
            { icon: CheckCircle2, label: "Likely legitimate", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", desc: "No major red flags, but verify contact details." },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} border border-border/30 rounded-2xl p-4 text-center`}>
              <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-2`} />
              <p className={`text-sm font-bold ${item.color} mb-1`}>{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold">Red flags that almost always indicate a scam</h2>
          {[
            { icon: CreditCard, title: "Gift card payment demand", desc: "No legitimate government agency, utility company, or debt collector will ever ask you to pay with iTunes gift cards, Google Play cards, or any other gift card. This is the single most reliable indicator of a scam — full stop." },
            { icon: AlertTriangle, title: "Immediate arrest or legal threats", desc: "Real IRS letters don't threaten immediate arrest. Real utilities give 10–30 days notice before shutoff. Real courts send certified mail. Extreme urgency combined with threats of immediate punishment is a scam tactic designed to prevent you from thinking clearly." },
            { icon: Phone, title: "Suspicious phone numbers", desc: "Check whether the phone number matches the official number on the organization's real website (search independently, don't click a link in the document). Scammers spoof phone numbers and create fake toll-free numbers. A mismatch between the document phone and official website phone is a major red flag." },
            { icon: Mail, title: "Email domain mismatch", desc: "The IRS communicates by mail, not email. But for any organization, check whether the sender's email domain matches the official domain (irs.gov, utilityname.com). 'irs-notice@revenue-dept.org' is not the IRS. Government agencies use .gov domains." },
            { icon: ShieldCheck, title: "Missing identifying information", desc: "Real government documents include your name, partial SSN or account number, and a case or notice reference number. Generic greetings ('Dear Valued Customer'), missing account numbers, or incorrect partial SSNs all indicate a fake." },
          ].map((item, i) => (
            <Card key={i} className="p-5 border-red-200/40 dark:border-red-900/30">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-3 mb-10">
          <h2 className="text-xl font-bold">What to do if you receive a suspicious document</h2>
          {[
            "Do not call any phone number listed in the document — search for the official number independently",
            "Do not click any links in an email version of the document",
            "Do not pay any amount requested until you verify the sender independently",
            "For IRS concerns, call 1-800-829-1040 (the official IRS helpline)",
            "For utility shutoff concerns, call the number on your utility bill or the utility's official website",
            "Report scam documents to the FTC at reportfraud.ftc.gov",
            "If you already paid, contact your bank or card issuer immediately — some transactions can be reversed",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 border border-border/50 rounded-xl bg-card">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <p className="text-sm text-foreground/85 leading-snug">{step}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-2">Run a Trust Check on any suspicious document</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Paste or upload any document and PlainPath's Trust Check will score it for scam indicators, pressure tactics, suspicious contact details, and authenticity markers — giving you a clear verdict in under a minute.
              </p>
              <Link href="/import?mode=trust-check" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                Check this document <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          PlainPath's Trust Check is AI-assisted and for informational purposes. Always independently verify suspicious documents through official channels.
        </p>
      </div>
    </div>
  )
}
