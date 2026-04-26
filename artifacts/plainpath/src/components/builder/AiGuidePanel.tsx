import { Sparkles, Expand, Minimize2, AlignLeft, CheckSquare, Table2, Wand2, BookOpen, SpellCheck, Plus, ListChecks } from "lucide-react";
import type { BuilderBlock } from "@/lib/builderTypes";
import { BLOCK_TYPE_LABELS } from "@/lib/builderTypes";

interface Props {
  selectedBlock: BuilderBlock | null;
}

const AI_ACTIONS = [
  { label: "Elaborate", icon: Expand,      desc: "Expand with more detail" },
  { label: "Formalize", icon: BookOpen,    desc: "Make more professional" },
  { label: "Simplify",  icon: Minimize2,   desc: "Make easier to understand" },
  { label: "Shorten",   icon: AlignLeft,   desc: "Reduce to key points" },
  { label: "Correct spelling", icon: SpellCheck, desc: "Fix spelling and grammar" },
  { label: "Turn into checklist", icon: CheckSquare, desc: "Convert to checklist items" },
  { label: "Turn into table",     icon: Table2,      desc: "Restructure as a table" },
  { label: "Add missing details", icon: ListChecks,  desc: "Fill in gaps automatically" },
  { label: "Create next section", icon: Plus,        desc: "Draft the next section" },
  { label: "Make professional",   icon: Wand2,       desc: "Refine tone and vocabulary" },
];

export function AiGuidePanel({ selectedBlock }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
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

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {AI_ACTIONS.map(({ label, icon: Icon, desc }) => (
          <button
            key={label}
            disabled
            title="AI guide is coming soon"
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border border-border/50 bg-card text-left opacity-60 cursor-not-allowed transition-colors"
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border/60 bg-muted/20">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          AI actions will be available in an upcoming update. No content is sent until AI is enabled.
        </p>
      </div>
    </div>
  );
}
