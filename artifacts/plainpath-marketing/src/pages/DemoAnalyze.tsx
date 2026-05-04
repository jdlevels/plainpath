import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileScan, AlertTriangle, ListChecks, HelpCircle, Calendar,
  Tag, CheckCircle2, Circle, ChevronRight, FileText,
  PenLine, FolderOpen, ClipboardList, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

// ─── Demo data ────────────────────────────────────────────────────────────────

const RISKS = [
  "Landlord may enter with only 12-hour notice — state law requires 24 hours minimum.",
  "Late fee of $125 applies after the 5-day grace period with no stated cap.",
  "Early termination requires 60 days' written notice plus two months' rent as a penalty.",
  "Lease auto-renews for 12 months if not cancelled in writing at least 60 days before expiration.",
];

const KEY_TERMS = [
  { term: "Monthly rent", value: "$2,150" },
  { term: "Security deposit", value: "$2,150 (one month)" },
  { term: "Lease term", value: "12 months (Feb 1, 2025 – Jan 31, 2026)" },
  { term: "Utilities", value: "Tenant pays all" },
  { term: "Late fee", value: "$125 after 5-day grace period" },
  { term: "Repair responsibility", value: "Tenant pays repairs under $150" },
];

const REQUIREMENTS: {
  id: string;
  type: "action_step" | "required_document" | "signature_needed" | "deadline";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  detail: string;
}[] = [
  { id: "r1", type: "deadline", priority: "critical", title: "Security deposit due Jan 25", detail: "Pay $2,150 security deposit before move-in date." },
  { id: "r2", type: "required_document", priority: "critical", title: "Renter's insurance required by Jan 28", detail: "Must provide proof of renter's insurance before move-in." },
  { id: "r3", type: "signature_needed", priority: "high", title: "Both parties must sign lease", detail: "Lease is not enforceable until signed by all parties." },
  { id: "r4", type: "action_step", priority: "high", title: "Document pre-existing damage", detail: "Photograph and email damage list to landlord before move-in to protect deposit." },
  { id: "r5", type: "action_step", priority: "high", title: "Confirm renter's insurance coverage amount", detail: "Lease does not specify minimum coverage — confirm with landlord in writing." },
  { id: "r6", type: "action_step", priority: "medium", title: "Set non-renewal reminder for Dec 1", detail: "Must cancel in writing 60+ days before Feb 1, 2026 to avoid auto-renewal." },
  { id: "r7", type: "action_step", priority: "medium", title: "Negotiate 24-hour notice period", detail: "Request landlord right-of-entry notice be changed to 24 hours in writing." },
  { id: "r8", type: "action_step", priority: "low", title: "Clarify parking and storage", detail: "Lease is silent on parking — confirm in writing whether included." },
];

type Mode = "understand" | "requirements" | "complete" | "summary";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function priorityBadge(p: string) {
  switch (p) {
    case "critical": return "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50";
    case "high":     return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
    case "medium":   return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50";
    default:         return "bg-secondary/60 text-muted-foreground border border-border/50";
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "required_document": return <FolderOpen className="w-4 h-4 text-primary/70" />;
    case "signature_needed":  return <PenLine className="w-4 h-4 text-violet-500" />;
    case "deadline":          return <Calendar className="w-4 h-4 text-red-500" />;
    default:                  return <ClipboardList className="w-4 h-4 text-blue-500" />;
  }
}

// ─── Mode nav ────────────────────────────────────────────────────────────────

const MODES: { id: Mode; label: string; icon: typeof FileText }[] = [
  { id: "understand",   label: "Understand",   icon: FileText },
  { id: "requirements", label: "Requirements", icon: ClipboardList },
  { id: "complete",     label: "Complete",     icon: ListChecks },
  { id: "summary",      label: "Summary",      icon: BarChart3 },
];

function ModeNav({ active, onSelect, doneCount }: { active: Mode; onSelect: (m: Mode) => void; doneCount: number }) {
  return (
    <div className="flex items-center gap-1 bg-secondary/50 dark:bg-secondary/30 rounded-2xl p-1 mb-6 border border-border/40 overflow-x-auto hide-scrollbar">
      {MODES.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
              isActive
                ? "bg-background shadow-sm text-foreground border border-border/30"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{label}</span>
            {id === "complete" && doneCount > 0 && (
              <span className="ml-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {doneCount}/{REQUIREMENTS.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Understand tab ───────────────────────────────────────────────────────────

function UnderstandTab() {
  return (
    <motion.div key="understand" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/15 p-5">
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
          </div>

          <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/15 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Recommended next steps</span>
            </div>
            <ol className="space-y-3">
              {["Photograph all pre-existing damage before move-in and email the list to your landlord.", "Confirm the renter's insurance minimum coverage amount with the landlord in writing.", "Set a calendar reminder 61 days before Feb 1, 2026 if you may not renew.", "Request that the landlord's right-of-entry notice be changed to 24 hours in writing."].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-blue-900 dark:text-blue-200">
                  <span className="font-bold shrink-0 w-5 text-right text-blue-500">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-24">
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
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Requirements tab ─────────────────────────────────────────────────────────

function RequirementsTab() {
  const critical = REQUIREMENTS.filter(r => r.priority === "critical");
  const high     = REQUIREMENTS.filter(r => r.priority === "high");
  const rest     = REQUIREMENTS.filter(r => r.priority === "medium" || r.priority === "low");

  const Section = ({ label, items }: { label: string; items: typeof REQUIREMENTS }) => (
    <div className="space-y-2.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
          <div className="mt-0.5 shrink-0">{typeIcon(item.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">{item.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${priorityBadge(item.priority)}`}>
            {item.priority}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div key="requirements" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
      className="space-y-6">
      <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4">
        <p className="text-sm font-semibold text-foreground mb-0.5">What this document requires</p>
        <p className="text-xs text-muted-foreground">
          {REQUIREMENTS.length} items identified — complete these before submission.
        </p>
      </div>
      <Section label="Critical" items={critical} />
      <Section label="High priority" items={high} />
      <Section label="Other" items={rest} />
    </motion.div>
  );
}

// ─── Complete tab ─────────────────────────────────────────────────────────────

function CompleteTab({ done, onToggle }: { done: Record<string, boolean>; onToggle: (id: string) => void }) {
  const total     = REQUIREMENTS.length;
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct       = Math.round((doneCount / total) * 100);

  const open     = REQUIREMENTS.filter(r => !done[r.id]);
  const complete = REQUIREMENTS.filter(r => done[r.id]);

  return (
    <motion.div key="complete" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
      className="space-y-5">
      {/* Progress header */}
      <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">{doneCount} of {total} items complete</span>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {doneCount === total && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> All items complete — ready to submit!
          </p>
        )}
      </div>

      {/* Open items */}
      {open.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">To do</p>
          {open.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="w-full flex items-start gap-3 rounded-2xl border border-border/40 bg-card p-4 text-left active:scale-[0.99] transition-transform shadow-sm hover:border-primary/30 hover:bg-primary/3"
            >
              <Circle className="w-5 h-5 mt-0.5 text-border shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5 leading-snug">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${priorityBadge(item.priority)}`}>
                {item.priority}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Done items */}
      {complete.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Done</p>
          {complete.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="w-full flex items-center gap-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/15 p-3.5 text-left active:scale-[0.99] transition-transform"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-sm text-muted-foreground line-through flex-1 leading-snug">{item.title}</p>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Summary tab ──────────────────────────────────────────────────────────────

function SummaryTab({ done }: { done: Record<string, boolean> }) {
  const doneCount = Object.values(done).filter(Boolean).length;
  const total     = REQUIREMENTS.length;
  const open      = REQUIREMENTS.filter(r => !done[r.id]);

  const byType = {
    deadline:          REQUIREMENTS.filter(r => r.type === "deadline"),
    required_document: REQUIREMENTS.filter(r => r.type === "required_document"),
    signature_needed:  REQUIREMENTS.filter(r => r.type === "signature_needed"),
    action_step:       REQUIREMENTS.filter(r => r.type === "action_step"),
  };

  return (
    <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
      className="space-y-5">
      <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-3">Completion overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Complete", value: doneCount, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Remaining", value: total - doneCount, color: "text-amber-600 dark:text-amber-400" },
            { label: "Total items", value: total, color: "text-foreground" },
            { label: "Progress", value: `${Math.round((doneCount / total) * 100)}%`, color: "text-primary" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-secondary/40 p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {open.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/15 p-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Still open
          </p>
          <ul className="space-y-2">
            {open.map(item => (
              <li key={item.id} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-foreground">Items by type</p>
        {Object.entries(byType).map(([type, items]) => (
          <div key={type} className="flex items-center gap-3">
            <div className="shrink-0">{typeIcon(type)}</div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground capitalize">{type.replace(/_/g, " ")}</p>
              <p className="text-[11px] text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {items.filter(i => done[i.id]).length}/{items.length}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DemoAnalyze() {
  const [mode, setMode]   = useState<Mode>("understand");
  const [done, setDone]   = useState<Record<string, boolean>>({});

  const doneCount = Object.values(done).filter(Boolean).length;

  const toggle = (id: string) =>
    setDone(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <DemoShell
      toolName="Analyze a Document"
      subtitle="Plain-English breakdown of what a document says, what it requires, what's done, and what's still open."
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
            Standard 12-month residential lease for Unit 4B at 2847 Ridgemont Drive, Austin, TX. Monthly rent is $2,150 due on the 1st.
          </p>
        </div>
      </motion.div>

      {/* Mode tabs */}
      <ModeNav active={mode} onSelect={setMode} doneCount={doneCount} />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {mode === "understand"   && <UnderstandTab key="understand" />}
        {mode === "requirements" && <RequirementsTab key="requirements" />}
        {mode === "complete"     && <CompleteTab key="complete" done={done} onToggle={toggle} />}
        {mode === "summary"      && <SummaryTab key="summary" done={done} />}
      </AnimatePresence>
    </DemoShell>
  );
}
