import { motion } from "framer-motion";
import { EyeOff, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const PII_ITEMS = [
  {
    type: "Social Security Number",
    found: "234-**-****",
    redacted: "███-██-████",
    location: "Line 4, Patient Information section",
    severity: "critical",
    reason: "SSNs are the highest-value target for identity theft. Redaction strongly recommended before sharing any copy.",
    approved: true,
  },
  {
    type: "Insurance ID Number",
    found: "HMO-8847291",
    redacted: "████-███████",
    location: "Line 12, Insurance Information section",
    severity: "high",
    reason: "Insurance IDs can be used to fraudulently bill your plan or obtain prescription drugs.",
    approved: true,
  },
  {
    type: "Date of Birth",
    found: "03/14/1978",
    redacted: "██/██/████",
    location: "Line 6, Patient Information section",
    severity: "medium",
    reason: "Combined with other personal info, date of birth can be used to verify identity or guess account PINs.",
    approved: true,
  },
];

const severityCfg = {
  critical: { label: "Critical", badge: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300", bar: "bg-red-500" },
  high: { label: "High", badge: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300", bar: "bg-amber-500" },
  medium: { label: "Medium", badge: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400", bar: "bg-yellow-400" },
};

function DocumentMockup({ redacted }: { redacted: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-slate-900 p-5 text-xs font-mono space-y-2 shadow-sm">
      <p className="font-bold text-sm text-foreground text-center mb-3 font-sans">Patient Intake Form</p>
      <p className="text-muted-foreground">Patient Name: <span className="text-foreground">Jane M. Doe</span></p>
      <p className="text-muted-foreground">Date of Birth:{" "}
        {redacted
          ? <span className="bg-slate-800 text-slate-800 rounded px-1 select-none dark:bg-slate-300 dark:text-slate-300">██/██/████</span>
          : <span className="text-foreground">03/14/1978</span>}
      </p>
      <p className="text-muted-foreground">SSN:{" "}
        {redacted
          ? <span className="bg-slate-800 text-slate-800 rounded px-1 select-none dark:bg-slate-300 dark:text-slate-300">███-██-████</span>
          : <span className="text-foreground text-red-600">234-**-****</span>}
      </p>
      <p className="text-muted-foreground">Address: <span className="text-foreground">4821 Maple Ave, Denver CO 80203</span></p>
      <p className="text-muted-foreground">Phone: <span className="text-foreground">(720) 555-0142</span></p>
      <div className="border-t border-border/50 pt-2 mt-2">
        <p className="text-muted-foreground">Insurance Provider: <span className="text-foreground">BlueCross BlueShield</span></p>
        <p className="text-muted-foreground">Insurance ID:{" "}
          {redacted
            ? <span className="bg-slate-800 text-slate-800 rounded px-1 select-none dark:bg-slate-300 dark:text-slate-300">████-███████</span>
            : <span className="text-foreground text-amber-600">HMO-8847291</span>}
        </p>
        <p className="text-muted-foreground">Group Number: <span className="text-foreground">GRP-001234</span></p>
      </div>
      <div className="border-t border-border/50 pt-2 mt-2">
        <p className="text-muted-foreground">Reason for visit: <span className="text-foreground">Annual checkup</span></p>
        <p className="text-muted-foreground">Referring physician: <span className="text-foreground">Dr. S. Patel</span></p>
      </div>
    </div>
  );
}

export default function DemoRedact() {
  return (
    <DemoShell
      toolName="Redact Sensitive Info"
      subtitle="Automatically detect SSNs, insurance numbers, account details, and other personal data — then approve each redaction before you export."
      scenarioLabel="Medical intake form · 1 page · 3 PII items detected"
    >
      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/15 mb-6 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <span className="font-semibold text-sm text-violet-800 dark:text-violet-200">Patient_Intake_Riverdale.pdf</span>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300">3 PII items found</Badge>
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            All 3 approved
          </Badge>
          <Badge variant="outline" className="text-[10px]">Ready to export</Badge>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Before / After */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Before redaction</p>
              <Badge variant="outline" className="text-[10px] ml-auto">Original</Badge>
            </div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <DocumentMockup redacted={false} />
            </motion.div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-foreground">After redaction</p>
              <Badge className="text-[10px] ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">Safe to share</Badge>
            </div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <DocumentMockup redacted={true} />
            </motion.div>
          </div>
        </div>

        {/* PII items panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <p className="text-sm font-semibold text-foreground">Detected items — approval status</p>
          {PII_ITEMS.map((item, i) => {
            const cfg = severityCfg[item.severity as keyof typeof severityCfg];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{item.type}</span>
                      <Badge className={`text-[10px] border ${cfg.badge}`}>{cfg.label}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    Approved
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-muted/60 p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Found</p>
                    <p className="text-sm font-mono text-foreground">{item.found}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900 dark:bg-slate-800 p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">Redacted</p>
                    <p className="text-sm font-mono text-slate-900 dark:text-slate-800 bg-slate-900 dark:bg-slate-800 select-none rounded">{item.redacted}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
                </div>
              </motion.div>
            );
          })}

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/15 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">3 of 3 redactions approved</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">The redacted version is ready. In the full app, export a clean PDF copy.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </DemoShell>
  );
}
