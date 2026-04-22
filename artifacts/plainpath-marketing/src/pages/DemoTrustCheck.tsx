import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Phone, Globe, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const FLAGS = [
  {
    severity: "critical",
    icon: Globe,
    title: "Payment portal domain is not irs.gov",
    detail: "The letter directs payment to irs-payment-center.net — this domain is not affiliated with the IRS. The IRS only accepts payment at irs.gov/payments.",
  },
  {
    severity: "critical",
    icon: Clock,
    title: "48-hour payment ultimatum",
    detail: "The IRS never sets 48-hour deadlines for collections. Urgent payment pressure is a hallmark of impersonation scams.",
  },
  {
    severity: "critical",
    icon: Phone,
    title: "Phone number is not an official IRS line",
    detail: "The 'IRS hotline' listed (1-888-247-XXXX) does not match any official IRS toll-free number. The real IRS number is 1-800-829-1040.",
  },
  {
    severity: "high",
    icon: AlertTriangle,
    title: "Threat of 'immediate arrest'",
    detail: "The IRS does not threaten arrest in collection letters. This language is only found in scam communications designed to create fear.",
  },
];

const WHAT_TO_DO = [
  "Do not call the number listed in the letter.",
  "Do not make any payment through the link or address in the letter.",
  "Report the document to the IRS at irs.gov/phishing.",
  "If you are concerned about a real tax debt, call the IRS directly at 1-800-829-1040.",
];

export default function DemoTrustCheck() {
  return (
    <DemoShell
      toolName="Document Trust Check"
      subtitle="Authenticity scoring that surfaces red flags and suspicious patterns before you respond or pay."
      scenarioLabel="IRS collection notice · 2 pages · Scored 18/100"
    >
      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/15 mb-6"
      >
        {/* Score ring */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <div className="w-24 h-24 rounded-full border-4 border-red-500 flex flex-col items-center justify-center bg-white dark:bg-red-950/30">
            <span className="text-3xl font-black text-red-600 dark:text-red-400 leading-none">18</span>
            <span className="text-[11px] font-semibold text-red-500">/ 100</span>
          </div>
          <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">High risk</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">Verdict: Likely Scam</span>
          </div>
          <p className="text-sm text-foreground mb-1.5 font-medium">IRS_Collection_Notice_092847.pdf · 2 pages</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This document presents itself as an IRS collection notice demanding $892 within 48 hours. PlainPath identified 4 hallmarks of IRS impersonation scams, including a fraudulent payment domain and a non-IRS phone number.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm font-semibold text-foreground mb-1">Flags detected ({FLAGS.length})</p>
          {FLAGS.map((flag, i) => {
            const Icon = flag.icon;
            const isCritical = flag.severity === "critical";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-4 ${isCritical
                  ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/15"
                  : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/15"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 shrink-0 ${isCritical ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
                    <Icon className={`w-4 h-4 ${isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-sm font-semibold ${isCritical ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
                        {flag.title}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 border ${isCritical
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300"
                      }`}>
                        {isCritical ? "Critical" : "High"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{flag.detail}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* What to do */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">What to do</span>
            </div>
            <ol className="space-y-2.5">
              {WHAT_TO_DO.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="font-bold shrink-0 text-foreground">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Why it matters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/15 p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Why this matters</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              IRS impersonation is the #1 tax scam in the US. The IRS always contacts taxpayers by postal mail first and never demands payment by wire transfer, gift cards, or third-party websites.
            </p>
            <a
              href="https://www.irs.gov/newsroom/how-to-know-its-really-the-irs-calling-or-knocking-on-your-door"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              IRS guidance on scam detection <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        </div>
      </div>
    </DemoShell>
  );
}
