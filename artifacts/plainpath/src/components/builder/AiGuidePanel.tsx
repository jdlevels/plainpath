import {
  Sparkles, Expand, Minimize2, AlignLeft, CheckSquare, Table2,
  Wand2, BookOpen, SpellCheck, Plus, ListChecks, ArrowRight,
} from "lucide-react";
import type { BuilderBlock } from "@/lib/builderTypes";
import { BLOCK_TYPE_LABELS } from "@/lib/builderTypes";

// ─── Contextual guide data ─────────────────────────────────────────────────────

interface GuideContext {
  headline: string;
  nextSteps: string[];
  tips: string[];
}

const GUIDE_BY_CATEGORY: Record<string, GuideContext> = {
  sop: {
    headline: "You are building a Standard Operating Procedure.",
    nextSteps: [
      "Complete Purpose and Scope first so the intent is clear.",
      "Fill in the Step-by-Step Procedure with numbered steps.",
      "Add caution notes using the Note block in any section.",
      "Complete the Revision History table before publishing.",
    ],
    tips: [
      "Use the Edit tab to improve a selected block's content.",
      "Use the Outline tab to reorder sections or add new ones.",
      "Keep each step short — one action per step.",
    ],
  },
  handbook: {
    headline: "You are building an Employee Handbook or Training Manual.",
    nextSteps: [
      "Complete the Welcome section with a warm, direct message.",
      "Fill in the First-Day or Training checklists.",
      "Add key contacts using the Key-Value block.",
      "Complete the Completion Checklist before publishing.",
    ],
    tips: [
      "Use Checklist blocks for action items employees need to complete.",
      "Use the Edit tab to rewrite any block in a friendlier tone.",
      "Break long sections into smaller sub-sections.",
    ],
  },
  policy: {
    headline: "You are building an Internal Policy or Safety Manual.",
    nextSteps: [
      "Define the Policy Statement clearly in the first paragraph.",
      "List required and prohibited actions using Bullet List blocks.",
      "Specify enforcement consequences explicitly.",
      "Set a review date in the Review Cycle section.",
    ],
    tips: [
      "Use plain language — avoid legalese where possible.",
      "Use the Note (warning) block for mandatory requirements.",
      "Add a document control section with version and approval date.",
    ],
  },
  "incident-report": {
    headline: "You are building an Incident Report.",
    nextSteps: [
      "Complete the Incident Overview with date, time, and location.",
      "Write a factual, chronological description of events.",
      "Document all immediate actions taken.",
      "Assign corrective actions with a responsible owner and due date.",
    ],
    tips: [
      "Be specific and factual — avoid speculation or blame.",
      "Use the Key-Value block for structured data like names and dates.",
      "Attach evidence references in the Attachments Checklist section.",
    ],
  },
  checklist: {
    headline: "You are building a Checklist.",
    nextSteps: [
      "Complete the Objective so the purpose is clear.",
      "Add all required items to the Required Items checklist.",
      "Assign a responsible person and set a deadline.",
      "Define what confirms the checklist is complete.",
    ],
    tips: [
      "Keep each checklist item as a single, actionable task.",
      "Use the Edit tab to modify checklist items.",
      "Add a Notes section for anything that doesn't fit a checkbox.",
    ],
  },
  proposal: {
    headline: "You are building a Business Proposal.",
    nextSteps: [
      "Write a compelling Executive Summary first.",
      "Define the Problem Statement clearly and specifically.",
      "Detail your Proposed Solution with concrete deliverables.",
      "Include a realistic timeline and budget.",
    ],
    tips: [
      "Focus on the client's needs, not your capabilities.",
      "Use tables for pricing and timeline information.",
      "Proofread the final document before exporting.",
    ],
  },
  prd: {
    headline: "You are building a Product Requirements Document.",
    nextSteps: [
      "Start with a clear Overview and Problem Statement.",
      "Define Goals & Success Metrics with measurable targets.",
      "List requirements in priority order.",
      "Explicitly document out-of-scope items.",
    ],
    tips: [
      "Use Key-Value blocks for structured requirement metadata.",
      "Use numbered lists for ordered requirements or user stories.",
      "Include a Launch Checklist at the end.",
    ],
  },
  other: {
    headline: "You are building a business document.",
    nextSteps: [
      "Complete the first section to establish context.",
      "Use the Outline tab to add and reorder sections.",
      "Use block types that match your content (lists, tables, notes).",
      "Review the full document before exporting.",
    ],
    tips: [
      "Use the Edit tab to improve the content of any selected block.",
      "Use Note blocks to highlight important information.",
      "Export to .txt when your document is ready.",
    ],
  },
};

const DEFAULT_GUIDE: GuideContext = GUIDE_BY_CATEGORY["other"];

// ─── AI actions (Coming Soon) ──────────────────────────────────────────────────

const AI_ACTIONS = [
  { label: "Elaborate",             icon: Expand,      desc: "Expand with more detail" },
  { label: "Formalize",             icon: BookOpen,    desc: "Make more professional" },
  { label: "Simplify",              icon: Minimize2,   desc: "Make easier to understand" },
  { label: "Shorten",               icon: AlignLeft,   desc: "Reduce to key points" },
  { label: "Correct spelling",      icon: SpellCheck,  desc: "Fix spelling and grammar" },
  { label: "Turn into checklist",   icon: CheckSquare, desc: "Convert to checklist items" },
  { label: "Turn into table",       icon: Table2,      desc: "Restructure as a table" },
  { label: "Add missing details",   icon: ListChecks,  desc: "Fill in gaps automatically" },
  { label: "Create next section",   icon: Plus,        desc: "Draft the next section" },
  { label: "Make professional",     icon: Wand2,       desc: "Refine tone and vocabulary" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  selectedBlock: BuilderBlock | null;
  category?: string;
}

export function AiGuidePanel({ selectedBlock, category }: Props) {
  const guide = (category ? GUIDE_BY_CATEGORY[category] : null) ?? DEFAULT_GUIDE;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-foreground">AI Document Guide</span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
            Coming soon
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedBlock
            ? `Actions for: ${BLOCK_TYPE_LABELS[selectedBlock.type as keyof typeof BLOCK_TYPE_LABELS] ?? selectedBlock.type}`
            : "Click any block in the document to use AI actions on it."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Contextual guide section */}
        <div className="px-4 py-4 border-b border-border/40 space-y-3">
          {/* Headline */}
          <p className="text-xs font-semibold text-foreground">{guide.headline}</p>

          {/* Recommended next steps */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Recommended next steps</p>
            <div className="space-y-1.5">
              {guide.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Tips</p>
            <div className="space-y-1">
              {guide.tips.map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-snug">· {tip}</p>
              ))}
            </div>
          </div>
        </div>

        {/* AI actions */}
        <div className="px-3 py-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">AI writing actions</p>
          {AI_ACTIONS.map(({ label, icon: Icon, desc }) => (
            <button
              key={label}
              type="button"
              disabled
              title="AI writing actions are coming soon"
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border border-border/50 bg-card text-left opacity-55 cursor-not-allowed transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border/60 bg-muted/20 shrink-0">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          AI actions will be available in an upcoming update. No content is sent until AI is enabled.
        </p>
      </div>
    </div>
  );
}
