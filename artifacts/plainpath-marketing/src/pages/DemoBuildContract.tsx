import { motion } from "framer-motion";
import { PenLine, CheckCircle2, FileText, DollarSign, Calendar, Shield, RotateCcw, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const ANSWERS = [
  { q: "What services will you provide?", a: "Full website redesign including UI/UX design, front-end development (React), and WordPress CMS setup — up to 4 pages." },
  { q: "Who is the client?", a: "Meridian Coffee Roasters, LLC" },
  { q: "What is the total payment?", a: "$4,800 — 50% ($2,400) at signing, 50% ($2,400) on final delivery." },
  { q: "What is the project deadline?", a: "March 15, 2025" },
  { q: "What happens if the client requests changes after delivery?", a: "Up to 2 revision rounds included at no charge. Additional rounds billed at $150/hour." },
  { q: "Who owns the final work?", a: "Client owns all final deliverables upon receipt of full payment. Contractor retains rights to portfolio use." },
];

const SECTIONS = [
  {
    icon: FileText,
    title: "Services & Scope",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    content: "Contractor agrees to deliver: (1) UI/UX design mockups for up to 4 pages; (2) front-end development in React; (3) WordPress CMS integration and training session. Scope changes must be agreed in writing.",
  },
  {
    icon: DollarSign,
    title: "Payment Terms",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    content: "Total: $4,800. Deposit of $2,400 due at contract signing. Final payment of $2,400 due within 5 business days of final delivery. Invoices unpaid after 14 days accrue 1.5% monthly interest.",
  },
  {
    icon: Shield,
    title: "Intellectual Property",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    content: "All deliverables and associated rights transfer to the client upon receipt of final payment. Until then, the contractor retains full ownership. The contractor may reference the project in their portfolio.",
  },
  {
    icon: RotateCcw,
    title: "Revision Policy",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    content: "Two (2) rounds of revisions included after delivery. Each additional round is billed at $150/hour with a minimum of 1 hour. Major scope changes are billed separately at the same rate.",
  },
  {
    icon: Calendar,
    title: "Delivery & Deadline",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    content: "Final delivery by March 15, 2025. Timeline assumes timely client feedback within 3 business days per review cycle. Delays caused by client feedback beyond 5 business days may extend the deadline proportionally.",
  },
  {
    icon: UserCheck,
    title: "Termination",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    content: "Either party may terminate with 14 days' written notice. Upon termination, the client owes payment for all work completed to date, calculated pro-rata against the total project fee.",
  },
];

export default function DemoBuildContract() {
  return (
    <DemoShell
      toolName="Build a Contract"
      subtitle="Answer plain-English questions about your deal — get a complete, ready-to-sign contract in minutes."
      scenarioLabel="Freelance web design · Meridian Coffee Roasters · 6 questions answered"
    >
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Q&A summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-foreground">Your answers</span>
              <Badge className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">
                6 / 6 complete
              </Badge>
            </div>
            <div className="space-y-4">
              {ANSWERS.map((qa, i) => (
                <div key={i} className="border-b border-border/50 last:border-0 pb-3 last:pb-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Q{i + 1}</p>
                  <p className="text-xs text-muted-foreground mb-1.5">{qa.q}</p>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-foreground leading-snug">{qa.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Contract preview */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/40 p-2.5">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Freelance Services Agreement</p>
              <p className="text-xs text-muted-foreground">Meridian Coffee Roasters, LLC · Generated March 2025</p>
            </div>
            <Badge className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 shrink-0">
              PDF ready
            </Badge>
          </div>

          {SECTIONS.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.07 }}
                className={`rounded-xl border ${sec.border} ${sec.bg} p-4`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${sec.color} shrink-0`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${sec.color}`}>{sec.title}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{sec.content}</p>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground"
          >
            + Signature blocks · Governing law clause · Entire agreement clause — included in the full document
          </motion.div>
        </div>
      </div>
    </DemoShell>
  );
}
