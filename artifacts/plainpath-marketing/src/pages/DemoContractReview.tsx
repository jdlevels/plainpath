import { motion } from "framer-motion";
import { Scale, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, ClipboardList, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { DemoShell } from "@/demo/DemoShell";

const DEMO_SUMMARY = {
  score: 41,
  verdict: "Several clauses need clarification — review carefully before signing",
  overview: "This employment offer contains unusually broad restrictions: a 5-year global non-compete and an IP assignment clause that covers personal projects. Two clauses need revision before signing. Two others are worth understanding fully.",
  redFlagCount: 2,
  watchOutCount: 2,
};

const CLAUSES = [
  {
    id: "noncompete",
    rating: "red-flag",
    title: "Non-compete clause",
    section: "Section 8.1",
    whatItSays: "Employee agrees not to engage in any business activity competitive with Employer for a period of five (5) years following termination, anywhere in the world.",
    whyItMatters: "Courts in most US states reject non-competes exceeding 1–2 years. A 5-year global restriction is highly unusual and very likely unenforceable — but the risk of a dispute is real even if you'd ultimately win.",
    questionsToAsk: [
      "Can the non-compete term be reduced to 12 months?",
      "Can the scope be limited to the specific markets or regions where I'll actually work?",
      "Does this apply if the company terminates me without cause?",
    ],
    negotiationLanguage: '"Employee agrees not to engage in directly competitive business activities for a period of twelve (12) months following termination, within the specific geographic markets served by Employer during the last 6 months of employment."',
  },
  {
    id: "ip",
    rating: "red-flag",
    title: "IP assignment — includes personal projects",
    section: "Section 9.2",
    whatItSays: "Employee assigns to Employer all inventions, discoveries, and works of authorship conceived or developed during the term of employment, whether or not during work hours or using Employer equipment.",
    whyItMatters: "This clause claims ownership of anything you create — including personal projects built on your own time — if it is even tangentially related to the company's business. This is overly broad and could affect side projects, open-source work, or future ideas.",
    questionsToAsk: [
      "Can personal projects built outside work hours using personal equipment be excluded?",
      "How does the company define 'related to Employer's business'?",
      "Is there a carve-out for projects I was already working on before joining?",
    ],
    negotiationLanguage: '"Employee assigns to Employer inventions developed during work hours using Employer resources that directly relate to Employer\'s current business. Inventions developed solely on personal time using personal equipment are excluded."',
  },
  {
    id: "atwill",
    rating: "watch-out",
    title: "At-will termination with no severance",
    section: "Section 4.1",
    whatItSays: "Employment is at-will and may be terminated by either party at any time, with or without cause. No severance will be provided unless required by applicable law.",
    whyItMatters: "At-will employment is standard, but combined with a 5-year non-compete, having no severance means you could be terminated without cause and still be bound by a lengthy restriction — with no financial bridge.",
    questionsToAsk: [
      "Is severance available if I am terminated without cause?",
      "Does the non-compete remain in force if the company terminates me?",
      "Can a severance provision be added given the non-compete scope?",
    ],
    negotiationLanguage: null,
  },
  {
    id: "arbitration",
    rating: "watch-out",
    title: "Mandatory arbitration — class action waiver",
    section: "Section 14.3",
    whatItSays: "Any dispute arising from or relating to employment shall be resolved exclusively through binding arbitration. Employee waives the right to jury trial and to participate in any class or collective action.",
    whyItMatters: "Mandatory arbitration clauses limit your legal options. You waive the right to a jury trial and cannot join a class action. This is increasingly common, but worth understanding before you sign.",
    questionsToAsk: [
      "Is there a carve-out for discrimination or harassment claims?",
      "Who pays the arbitration fees?",
      "Which arbitration body and rules would apply?",
    ],
    negotiationLanguage: null,
  },
];

const BEFORE_YOU_SIGN = [
  "Negotiate the non-compete to 12 months and limit it to markets where you will actually work",
  "Add an exclusion for personal projects built outside work hours using your own equipment",
  "Request a severance provision given the scope of the non-compete you're agreeing to",
  "Confirm whether the arbitration clause covers discrimination and harassment claims",
  "Ask for a list of any prior IP or projects you should explicitly carve out before signing",
];

const MISSING_ITEMS = [
  "Equity vesting schedule details — not specified in this agreement",
  "Annual review and raise provision — no commitment to salary review",
  "Remote work policy — terms not defined",
];

const ratingConfig = {
  "red-flag":  { label: "Needs Attention", bg: "bg-red-50 dark:bg-red-950/20",    text: "text-red-700 dark:text-red-300",    border: "border-red-200 dark:border-red-800",    badgeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",   Icon: ShieldAlert  },
  "watch-out": { label: "Watch Out",       bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800", Icon: AlertTriangle },
};

function DemoClauseCard({ clause }: { clause: typeof CLAUSES[0] }) {
  const [open, setOpen] = useState(clause.rating === "red-flag");
  const cfg = ratingConfig[clause.rating as keyof typeof ratingConfig];

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <cfg.Icon className={`w-4 h-4 shrink-0 ${cfg.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold text-foreground">{clause.title}</span>
            <Badge className={`text-[10px] px-2 py-0 border shrink-0 ${cfg.badgeClass}`}>{cfg.label}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">{clause.section}</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3 bg-card">
          {/* What it says */}
          <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">What it says</p>
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">"{clause.whatItSays}"</p>
          </div>

          {/* Why it matters */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Why this matters</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{clause.whyItMatters}</p>
          </div>

          {/* Questions to Ask */}
          <div className="bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/40 rounded-lg p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">Questions to Ask Before Signing</p>
            <ul className="space-y-1.5">
              {clause.questionsToAsk.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-violet-400 dark:text-violet-500 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
                  <p className="text-sm text-violet-900 dark:text-violet-100 leading-snug">{q}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested revision */}
          {clause.negotiationLanguage && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1.5">Suggested language to discuss</p>
              <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed font-mono bg-blue-100/50 dark:bg-blue-900/30 rounded p-2 whitespace-pre-wrap">{clause.negotiationLanguage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DemoContractReview() {
  return (
    <DemoShell
      toolName="Contract Review"
      subtitle="PlainPath reads the fine print, flags clauses that need attention, and gives you questions to ask — before you sign."
      scenarioLabel="Employment offer · Johnson & Markley · 3 pages"
    >
      {/* ── Summary banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/15 p-5 mb-5"
      >
        <div className="flex items-start gap-5 flex-wrap mb-3">
          <div className="text-center min-w-[72px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Fairness Score</p>
            <p className="text-5xl font-bold leading-none tabular-nums text-amber-600 dark:text-amber-400">{DEMO_SUMMARY.score}</p>
            <p className="text-xs text-muted-foreground mt-1">/ 100</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-amber-700 dark:text-amber-300 mb-1">{DEMO_SUMMARY.verdict}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{DEMO_SUMMARY.overview}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20">
            <ShieldAlert className="w-3 h-3" /> {DEMO_SUMMARY.redFlagCount} clauses need attention
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> {DEMO_SUMMARY.watchOutCount} watch-outs
          </span>
        </div>
      </motion.div>

      {/* ── Key Clauses ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-foreground">Key Clauses</h3>
          <span className="text-xs text-muted-foreground">— review each before signing</span>
        </div>
        <div className="space-y-3">
          {CLAUSES.map(clause => (
            <DemoClauseCard key={clause.id} clause={clause} />
          ))}
        </div>
      </div>

      {/* ── Before You Sign ── */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/15 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Before You Sign</h3>
          <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">{BEFORE_YOU_SIGN.length} items</Badge>
        </div>
        <ul className="space-y-2.5">
          {BEFORE_YOU_SIGN.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <ClipboardList className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/85 leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Missing Items ── */}
      <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-bold text-violet-800 dark:text-violet-300">Items This Contract Is Missing</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Standard items a balanced employment agreement should include — consider asking for these before signing.</p>
        <ul className="space-y-2">
          {MISSING_ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Lock className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/85 leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Disclaimer ── */}
      <div className="mt-4 px-1">
        <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
          AI-assisted contract review. Not legal advice — consult a qualified attorney before signing any legal agreement.
        </p>
      </div>
    </DemoShell>
  );
}
