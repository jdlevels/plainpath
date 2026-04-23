import { motion } from "framer-motion";
import { GitCompare, AlertTriangle, Plus, Minus, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const CHANGES = [
  {
    id: "confidentiality-term",
    section: "Section 3",
    title: "Confidentiality Term",
    type: "modified",
    severity: "critical",
    removed: "for a period of two (2) years from the Effective Date",
    added: "in perpetuity, with no time limitation",
    context: "This Agreement shall remain in effect [CHANGE].",
    analysis: "This is the most significant change in the revision. The receiving party was previously bound to a 2-year confidentiality obligation. In v2, this obligation has no end date — you would be bound forever. This dramatically changes the risk profile of signing.",
    action: "Negotiate back to a defined term — 2–5 years is standard. Perpetual NDAs are unusual and may signal aggressive legal posture.",
  },
  {
    id: "jurisdiction",
    section: "Section 5",
    title: "Governing Law & Jurisdiction",
    type: "modified",
    severity: "medium",
    removed: "State of California",
    added: "State of Delaware",
    context: "This Agreement shall be governed by and construed under the laws of the [CHANGE].",
    analysis: "Disputes will now be resolved under Delaware law rather than California law. Delaware tends to enforce NDAs more strictly and is generally more favorable to corporate interests in contract disputes.",
    action: "If you are based in another state, request that jurisdiction remain in your state, or at minimum that disputes be handled remotely.",
  },
  {
    id: "exclusions",
    section: "Section 7",
    title: "Exclusions from Confidentiality",
    type: "added",
    severity: "low",
    removed: null,
    added: "Information that is or becomes generally known to the public through no fault of the receiving party",
    context: "The following shall not be considered Confidential Information: [NEW CLAUSE].",
    analysis: "This new exclusion clause clarifies that truly public information cannot be claimed as confidential. This is a standard and reasonable protective provision that actually benefits the receiving party.",
    action: "No action needed — this change is in your favor.",
  },
];

const severityCfg = {
  critical: { label: "Critical", badge: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300", headerBg: "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800" },
  medium: { label: "Medium", badge: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300", headerBg: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" },
  low: { label: "Low", badge: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/30 dark:text-slate-400", headerBg: "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700" },
};

const typeIcon = {
  modified: { Icon: Edit3, label: "Modified", color: "text-amber-500" },
  added: { Icon: Plus, label: "Added", color: "text-emerald-500" },
  removed: { Icon: Minus, label: "Removed", color: "text-red-500" },
};

export default function DemoCompare() {
  return (
    <DemoShell
      toolName="Compare Versions"
      subtitle="Upload two versions of a document and see exactly what changed — every addition, deletion, and modification — with an explanation of what each change means for you."
      scenarioLabel="NDA v1 vs NDA v2 · 3 changes · 1 critical"
    >
      {/* File pair banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/15 mb-6"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="rounded-xl bg-teal-100 dark:bg-teal-950/50 p-3 shrink-0">
            <GitCompare className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="grid sm:grid-cols-2 gap-2 flex-1">
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-border px-3 py-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">Version A (original)</p>
              <p className="text-sm font-medium text-foreground">NDA_Draft_v1.pdf</p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-border px-3 py-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">Version B (revised)</p>
              <p className="text-sm font-medium text-foreground">NDA_Draft_v2.pdf</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300">1 critical</Badge>
          <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300">1 medium</Badge>
          <Badge className="text-[10px] bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/30 dark:text-slate-400">1 low</Badge>
          <Badge variant="outline" className="text-[10px]">3 changes</Badge>
        </div>
      </motion.div>

      {/* Change cards */}
      <div className="space-y-5">
        {CHANGES.map((change, i) => {
          const cfg = severityCfg[change.severity as keyof typeof severityCfg];
          const type = typeIcon[change.type as keyof typeof typeIcon];
          const TypeIcon = type.Icon;

          return (
            <motion.div
              key={change.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border overflow-hidden`}
            >
              {/* Header */}
              <div className={`flex items-center gap-3 px-5 py-3 border-b ${cfg.headerBg}`}>
                <TypeIcon className={`w-4 h-4 shrink-0 ${type.color}`} />
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-muted-foreground">{change.section}</span>
                  <span className="text-sm font-semibold text-foreground">{change.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-[10px] border ${cfg.badge}`}>{cfg.label}</Badge>
                  <span className={`text-[10px] font-semibold ${type.color}`}>{type.label}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 bg-card space-y-4">
                {/* Diff view */}
                <div className="rounded-xl overflow-hidden border border-border text-xs font-mono">
                  {change.removed && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-red-800 dark:text-red-200">
                      <Minus className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                      <span className="line-through opacity-80">{change.removed}</span>
                    </div>
                  )}
                  {change.added && (
                    <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-emerald-800 dark:text-emerald-200">
                      <Plus className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                      <span>{change.added}</span>
                    </div>
                  )}
                  <div className="px-3 py-2 bg-muted/30 text-muted-foreground text-[10px] italic">{change.context}</div>
                </div>

                {/* Analysis */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">What this means</p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{change.analysis}</p>
                </div>

                {/* Action */}
                <div className={`rounded-lg px-3 py-2.5 ${change.severity === "low" ? "bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-800" : "bg-blue-50 dark:bg-blue-950/15 border border-blue-200 dark:border-blue-800"}`}>
                  <p className={`text-xs font-semibold mb-0.5 ${change.severity === "low" ? "text-emerald-700 dark:text-emerald-400" : "text-blue-700 dark:text-blue-400"}`}>Recommended action</p>
                  <p className={`text-xs ${change.severity === "low" ? "text-emerald-800 dark:text-emerald-300" : "text-blue-800 dark:text-blue-300"}`}>{change.action}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DemoShell>
  );
}
