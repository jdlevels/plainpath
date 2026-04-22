import { motion } from "framer-motion";
import { Scale, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { DemoShell } from "@/demo/DemoShell";

const CLAUSES = [
  {
    id: "noncompete",
    severity: "critical",
    title: "Non-compete clause — 5 years, global scope",
    section: "Section 8.1",
    originalText: '"Employee agrees not to engage in any business activity competitive with Employer for a period of five (5) years following termination, anywhere in the world."',
    analysis: "Courts in most US states reject non-competes exceeding 1–2 years. A 5-year global restriction is highly unusual and very likely unenforceable. This language would prevent you from working anywhere in your industry for 5 years after leaving.",
    negotiationLanguage: '"Employee agrees not to engage in directly competitive business activities for a period of twelve (12) months following termination, within the specific geographic markets served by Employer during the last 6 months of employment."',
  },
  {
    id: "ip",
    severity: "high",
    title: "IP assignment — includes personal projects",
    section: "Section 9.2",
    originalText: '"Employee assigns to Employer all inventions, discoveries, and works of authorship conceived or developed during the term of employment, whether or not during work hours or using Employer equipment."',
    analysis: "This clause claims ownership of anything you create — including personal projects built on your own time with your own equipment — if it's even tangentially related to the company's business. This is overly broad.",
    negotiationLanguage: '"Employee assigns to Employer inventions developed during work hours using Employer resources that directly relate to Employer\'s current business. This excludes inventions developed solely on personal time using personal equipment and resources."',
  },
  {
    id: "atwill",
    severity: "medium",
    title: "At-will with no severance provision",
    section: "Section 4.1",
    originalText: '"Employment is at-will and may be terminated by either party at any time, with or without cause. No severance will be provided unless required by applicable law."',
    analysis: "At-will employment is standard. However, given the 5-year non-compete you're agreeing to, having no severance provision is particularly one-sided — if terminated without cause, you'd be non-compete-bound with no financial bridge.",
    negotiationLanguage: null,
  },
  {
    id: "arbitration",
    severity: "medium",
    title: "Mandatory arbitration — waives class action rights",
    section: "Section 14.3",
    originalText: '"Any dispute arising from or relating to employment shall be resolved exclusively through binding arbitration. Employee waives the right to jury trial and to participate in any class or collective action."',
    analysis: "Mandatory arbitration clauses are common but limit your legal options. You waive the right to a jury trial and cannot join or lead a class action against the company. Consider requesting a carve-out for discrimination claims.",
    negotiationLanguage: null,
  },
];

const severityConfig = {
  critical: { label: "Critical", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800", badgeBg: "bg-red-100 text-red-700 border-red-300" },
  high: { label: "High", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", badgeBg: "bg-amber-100 text-amber-700 border-amber-300" },
  medium: { label: "Medium", bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800", badgeBg: "bg-yellow-100 text-yellow-700 border-yellow-300" },
};

function ClauseCard({ clause }: { clause: typeof CLAUSES[0] }) {
  const [expanded, setExpanded] = useState(clause.severity === "critical");
  const cfg = severityConfig[clause.severity as keyof typeof severityConfig];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${cfg.border} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center gap-3 p-4 text-left ${cfg.bg} hover:brightness-95 dark:hover:brightness-110 transition-all`}
      >
        <AlertTriangle className={`w-4 h-4 shrink-0 ${cfg.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${cfg.text}`}>{clause.title}</span>
            <Badge className={`text-[10px] px-1.5 py-0 border shrink-0 ${cfg.badgeBg}`}>{cfg.label}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">{clause.section}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-3 bg-card">
          {/* Original text */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Original language</p>
            <blockquote className="border-l-2 border-muted pl-3 text-xs text-muted-foreground italic leading-relaxed">
              {clause.originalText}
            </blockquote>
          </div>

          {/* Analysis */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Why this matters</p>
            <p className="text-sm text-foreground leading-relaxed">{clause.analysis}</p>
          </div>

          {/* Negotiation language */}
          {clause.negotiationLanguage && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Suggested negotiation language</p>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed italic">{clause.negotiationLanguage}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function DemoContractReview() {
  return (
    <DemoShell
      toolName="Contract Review"
      subtitle="PlainPath reads the fine print, flags unfair clauses, and gives you negotiation language — before you sign."
      scenarioLabel="Employment offer · Johnson & Markley · 3 pages · Scored 28/100"
    >
      {/* Score banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/15 mb-6"
      >
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="w-20 h-20 rounded-full border-4 border-amber-500 flex flex-col items-center justify-center bg-white dark:bg-amber-950/40">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">28</span>
            <span className="text-[10px] font-semibold text-amber-500">/ 100</span>
          </div>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Review carefully</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-bold text-amber-800 dark:text-amber-200">4 clauses flagged</span>
            <Badge className="ml-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300">1 critical</Badge>
            <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300">1 high</Badge>
            <Badge className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-300">2 medium</Badge>
          </div>
          <p className="text-sm font-medium text-foreground mb-0.5">Employment_Offer_Johnson_Markley.pdf · 3 pages</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This offer letter contains unusually aggressive restrictions: a 5-year global non-compete and an overly broad IP assignment clause. Negotiation language is provided for the two most critical issues.
          </p>
        </div>
      </motion.div>

      {/* Clause cards */}
      <div className="space-y-4">
        {CLAUSES.map((clause) => (
          <ClauseCard key={clause.id} clause={clause} />
        ))}
      </div>
    </DemoShell>
  );
}
