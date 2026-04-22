import { motion } from "framer-motion";
import { FileScan, AlertTriangle, ListChecks, HelpCircle, Calendar, FileText, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const RISKS = [
  "Landlord may enter with only 12-hour notice — state law requires 24 hours minimum.",
  "Late fee of $125 applies after the 5-day grace period with no stated cap.",
  "Early termination requires 60 days' written notice plus two months' rent as a penalty.",
  "Lease auto-renews for 12 months if not cancelled in writing at least 60 days before expiration.",
];

const NEXT_STEPS = [
  "Photograph and document all pre-existing damage before move-in and email the list to your landlord.",
  "Confirm the exact renter's insurance requirement (minimum coverage amount and named insured).",
  "Set a calendar reminder 61 days before Feb 1, 2026 if you want the option to not renew.",
  "Request that the landlord's right-of-entry notice period be changed to 24 hours in writing.",
];

const DEADLINES = [
  { date: "Jan 25, 2025", label: "Security deposit due", severity: "high" },
  { date: "Jan 28, 2025", label: "Proof of renter's insurance required", severity: "high" },
  { date: "Feb 1, 2025", label: "Move-in date / lease start", severity: "medium" },
  { date: "Ongoing", label: "Rent due 1st of each month; late after the 5th", severity: "low" },
];

const KEY_TERMS = [
  { term: "Monthly rent", value: "$2,150" },
  { term: "Security deposit", value: "$2,150 (one month)" },
  { term: "Lease term", value: "12 months (Feb 1, 2025 – Jan 31, 2026)" },
  { term: "Utilities", value: "Tenant pays all" },
  { term: "Late fee", value: "$125 after 5-day grace period" },
  { term: "Repair responsibility", value: "Tenant pays repairs under $150" },
];

const severityColor = (s: string) =>
  s === "high" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800"
    : s === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700";

export default function DemoAnalyze() {
  return (
    <DemoShell
      toolName="Analyze a Document"
      subtitle="Plain-English breakdown of what a document says, what to watch for, and what to do next."
      scenarioLabel="Residential lease · Unit 4B, Austin TX · 12 pages"
    >
      {/* Document header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5 mb-6"
      >
        <div className="rounded-xl bg-primary/10 p-3 shrink-0">
          <FileScan className="w-6 h-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Residential Lease Agreement</span>
            <Badge variant="outline" className="text-[10px]">12 pages</Badge>
          </div>
          <p className="text-sm text-foreground font-medium mb-0.5">Lease_Agreement_Unit4B.pdf</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Standard 12-month residential lease for Unit 4B at 2847 Ridgemont Drive, Austin, TX. Monthly rent is $2,150 due on the 1st. Security deposit of $2,150 required before move-in. Tenant bears all utility costs and is responsible for repairs under $150.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Key risks */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/15 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-800 dark:text-red-300">Key risks &amp; concerns</span>
              <span className="ml-auto text-xs text-red-600 dark:text-red-400 font-medium">{RISKS.length} found</span>
            </div>
            <ul className="space-y-3">
              {RISKS.map((risk, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-200">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Next steps */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
            className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/15 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Recommended next steps</span>
            </div>
            <ol className="space-y-3">
              {NEXT_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-blue-900 dark:text-blue-200">
                  <span className="font-bold shrink-0 w-5 text-right text-blue-500">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Deadlines */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/15 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Key deadlines</span>
            </div>
            <div className="space-y-2.5">
              {DEADLINES.map((d, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${severityColor(d.severity)}`}>
                  <span className="text-xs font-semibold w-24 shrink-0">{d.date}</span>
                  <span className="text-xs">{d.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Key terms */}
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="rounded-2xl border border-border bg-card p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Key terms extracted</span>
            </div>
            <div className="space-y-3">
              {KEY_TERMS.map((kv) => (
                <div key={kv.term} className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{kv.term}</span>
                  <span className="text-sm font-medium text-foreground">{kv.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border/60">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Items to ask your landlord</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>· Minimum renter's insurance coverage amount?</li>
                    <li>· Is the $2,150 deposit refundable in full?</li>
                    <li>· Parking or storage included?</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DemoShell>
  );
}
