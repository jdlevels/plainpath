import { useEffect } from "react"
import { Link } from "wouter"
import { AlertTriangle, CheckCircle2, ArrowRight, FileText, DollarSign, Phone, Shield, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function MedicalBillingDispute() {
  useEffect(() => {
    document.title = "How to Dispute a Medical Bill — PlainPath Guide"
    return () => { document.title = "PlainPath" }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">PlainPath Guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
            How to dispute a medical bill
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Medical billing errors are extraordinarily common — studies suggest up to 80% of hospital bills contain a mistake. Here's how to read your bill, spot errors, and dispute charges effectively.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">Always request an itemized bill first</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                You have the legal right to receive an itemized bill listing every charge. Don't pay a summary bill. Request the itemized version in writing — this is your starting point for any dispute.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold">Step 1 — Read and verify your bill</h2>

          {[
            {
              icon: FileText,
              title: "Get an itemized statement",
              desc: "Call the billing department and request an itemized bill. This lists every charge individually with procedure codes (CPT codes). You're entitled to this by law. Keep this document — you'll need it for every step of the dispute process.",
            },
            {
              icon: FileText,
              title: "Request your Explanation of Benefits (EOB)",
              desc: "Your insurance company sends an EOB after a claim is processed. This shows what the insurer paid, what you owe, and what was denied. The amount on the EOB and the amount on your hospital bill should match. If they don't, that's a billing discrepancy.",
            },
            {
              icon: DollarSign,
              title: "Check for common billing errors",
              desc: "The most frequent errors: duplicate charges (same service billed twice), charges for services you didn't receive, upcoding (a more expensive code used instead of the correct one), unbundling (separate charges for a procedure that should be billed together), and incorrect insurance adjustments.",
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
          <h2 className="text-xl font-bold">Common errors to look for</h2>
          <div className="space-y-3">
            {[
              { flag: "Duplicate charges", detail: "The same procedure or medication billed more than once. Look for identical CPT codes and amounts." },
              { flag: "Services you didn't receive", detail: "Cross-reference every line item against your memory of the visit. If you weren't in the hospital on a particular date, you shouldn't be billed for that day." },
              { flag: "Wrong patient or insurance information", detail: "A typo in your DOB, insurance ID, or name can cause claims to be processed incorrectly or denied entirely." },
              { flag: "Out-of-network charges for in-network care", detail: "Common at in-network hospitals where an individual physician (anesthesiologist, radiologist, assistant surgeon) is out-of-network. The No Surprises Act limits your liability for most surprise bills like this." },
              { flag: "Facility fees for routine visits", detail: "Hospital-owned clinics often charge 'facility fees' on top of physician fees for routine office visits. Request these be waived or reduced." },
            ].map((item, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">{item.flag}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold">How to file a dispute</h2>
          <div className="space-y-3">
            {[
              { step: "1", action: "Call the billing department", detail: "Start with a phone call. Ask them to explain each charge you're questioning. Note the name of the representative and the date of the call." },
              { step: "2", action: "Send a written dispute letter", detail: "Follow up in writing via certified mail. List each disputed charge, the reason it's incorrect, and the supporting evidence (EOB, medical records). Keep a copy of everything." },
              { step: "3", action: "File an insurance appeal", detail: "If a claim was denied, you have the right to appeal. Your insurer must respond within 30–60 days. Include a letter of medical necessity from your doctor if needed." },
              { step: "4", action: "Contact your state insurance commissioner", detail: "If the insurer refuses a valid claim, file a complaint with your state insurance commissioner. This is free and often gets results faster than continuing to appeal internally." },
              { step: "5", action: "Request a financial hardship review", detail: "Hospitals (especially nonprofits) often have charity care or financial assistance programs. Even if your income is moderate, ask — many programs have sliding-scale eligibility." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.action}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">Don't let it go to collections</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                Medical debt going to collections can damage your credit. Even if you're disputing a bill, communicate with the billing department and set up a payment plan for any undisputed amounts while the dispute is resolved. In writing, note that your payment does not waive your dispute rights.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-2">Analyze your medical bill with PlainPath</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Upload your Explanation of Benefits or itemized medical bill. PlainPath will extract the key charges, identify deadlines and required actions, and help you understand what each line item means.
              </p>
              <Link
                href="/import"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Analyze this bill <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            <Phone className="w-3 h-3 inline mr-1" />
            Free help: Patient Advocate Foundation (patientadvocate.org) offers free case management for billing disputes.
          </p>
        </div>

      </div>
    </div>
  )
}
