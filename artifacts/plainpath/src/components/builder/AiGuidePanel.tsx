import { useState, useCallback } from "react";
import {
  Sparkles, Expand, Minimize2, AlignLeft, CheckSquare, Table2,
  Wand2, BookOpen, SpellCheck, Plus, ListChecks, ArrowRight,
  Loader2, AlertCircle, Copy, Check, X, RefreshCw,
} from "lucide-react";
import type { BuilderBlock } from "@/lib/builderTypes";
import { BLOCK_TYPE_LABELS } from "@/lib/builderTypes";
import type {
  HeadingPayload,
  ParagraphPayload,
  BulletListPayload,
  NumberedListPayload,
  ChecklistPayload,
  KeyValuePayload,
  NotePayload,
  TablePayload,
} from "@/lib/builderTypes";

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

// ─── AI actions ────────────────────────────────────────────────────────────────

const AI_ACTIONS = [
  { label: "Elaborate",           icon: Expand,      desc: "Expand with more detail" },
  { label: "Formalize",           icon: BookOpen,    desc: "Make more formal" },
  { label: "Simplify",            icon: Minimize2,   desc: "Make easier to understand" },
  { label: "Shorten",             icon: AlignLeft,   desc: "Reduce to key points" },
  { label: "Correct spelling",    icon: SpellCheck,  desc: "Fix spelling and grammar" },
  { label: "Make professional",   icon: Wand2,       desc: "Refine tone and vocabulary" },
  { label: "Expand",              icon: Expand,      desc: "Add more information" },
  { label: "Add missing details", icon: ListChecks,  desc: "Fill in gaps automatically" },
  { label: "Turn into checklist", icon: CheckSquare, desc: "Convert to checklist items" },
  { label: "Turn into table",     icon: Table2,      desc: "Restructure as a table" },
  { label: "Create next section", icon: Plus,        desc: "Draft the next section" },
];

// ─── Block content stringifier ─────────────────────────────────────────────────

function stringifyBlockContent(block: BuilderBlock): string {
  const p = block.payload as unknown;
  switch (block.type) {
    case "heading":
      return (p as HeadingPayload).text ?? "";
    case "paragraph":
      return (p as ParagraphPayload).text ?? "";
    case "bullet-list":
      return ((p as BulletListPayload).items ?? []).map((i) => `• ${i}`).join("\n");
    case "numbered-list":
      return ((p as NumberedListPayload).items ?? []).map((i, idx) => `${idx + 1}. ${i}`).join("\n");
    case "checklist":
      return ((p as ChecklistPayload).items ?? []).map((i) => `[ ] ${i.text}`).join("\n");
    case "key-value":
      return ((p as KeyValuePayload).pairs ?? []).map((pair) => `${pair.key}: ${pair.value}`).join("\n");
    case "note":
      return (p as NotePayload).text ?? "";
    case "table": {
      const tp = p as TablePayload;
      const cols = (tp.columns ?? []).join(" | ");
      const rows = (tp.rows ?? []).map((r) => r.join(" | ")).join("\n");
      return [cols, rows].filter(Boolean).join("\n");
    }
    case "divider":
      return "[divider]";
    default:
      return JSON.stringify(p);
  }
}

// ─── Preview state ─────────────────────────────────────────────────────────────

interface PreviewState {
  action: string;
  original: string;
  suggestion: string;
  newBlockType: string | null;
  safe: boolean;
  message: string | null;
}

// ─── Component props ───────────────────────────────────────────────────────────

interface Props {
  selectedBlock: BuilderBlock | null;
  category?: string;
  documentTitle?: string;
  sectionTitle?: string;
  onRunAction: (data: {
    action: string;
    blockType: string;
    blockContent: string;
    documentTitle?: string;
    category?: string;
    sectionTitle?: string;
  }) => Promise<{
    suggestion: string;
    newBlockType: string | null;
    safe: boolean;
    message: string | null;
  }>;
  onApply: (suggestion: string, newBlockType: string | null, action: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AiGuidePanel({
  selectedBlock,
  category,
  documentTitle,
  sectionTitle,
  onRunAction,
  onApply,
}: Props) {
  const guide = (category ? GUIDE_BY_CATEGORY[category] : null) ?? DEFAULT_GUIDE;

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [copied, setCopied] = useState(false);

  const isRunning = loadingAction !== null;

  const handleAction = useCallback(async (actionLabel: string) => {
    if (!selectedBlock || isRunning) return;
    const blockContent = stringifyBlockContent(selectedBlock);
    if (!blockContent.trim() || blockContent === "[divider]") {
      setError("This block has no text content to improve. Select a block with text.");
      return;
    }
    setLoadingAction(actionLabel);
    setError(null);
    setPreview(null);
    try {
      const result = await onRunAction({
        action: actionLabel,
        blockType: selectedBlock.type,
        blockContent,
        documentTitle,
        category,
        sectionTitle,
      });
      setPreview({
        action: actionLabel,
        original: blockContent,
        suggestion: result.suggestion,
        newBlockType: result.newBlockType,
        safe: result.safe,
        message: result.message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI request failed. Please try again.";
      setError(msg);
    } finally {
      setLoadingAction(null);
    }
  }, [selectedBlock, isRunning, onRunAction, documentTitle, category, sectionTitle]);

  const handleApply = useCallback(() => {
    if (!preview) return;
    onApply(preview.suggestion, preview.newBlockType, preview.action);
    setPreview(null);
    setError(null);
  }, [preview, onApply]);

  const handleCancel = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!preview?.suggestion) return;
    try {
      await navigator.clipboard.writeText(preview.suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }, [preview]);

  const handleRetry = useCallback(() => {
    if (!preview) return;
    const action = preview.action;
    setPreview(null);
    setError(null);
    handleAction(action);
  }, [preview, handleAction]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-foreground">AI Document Guide</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedBlock
            ? `Actions for: ${BLOCK_TYPE_LABELS[selectedBlock.type as keyof typeof BLOCK_TYPE_LABELS] ?? selectedBlock.type}`
            : "Click any block in the document to use AI actions on it."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Contextual guide */}
        <div className="px-4 py-4 border-b border-border/40 space-y-3">
          <p className="text-xs font-semibold text-foreground">{guide.headline}</p>
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
            AI writing actions
          </p>

          {!selectedBlock && (
            <div className="px-3 py-3 rounded-xl border border-dashed border-border/60 bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a block in the document preview or Outline before using AI actions.
              </p>
            </div>
          )}

          {AI_ACTIONS.map(({ label, icon: Icon, desc }) => {
            const isThisLoading = loadingAction === label;
            const disabled = !selectedBlock || isRunning;
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => handleAction(label)}
                title={!selectedBlock ? "Select a block first" : desc}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  disabled
                    ? "border-border/40 bg-card opacity-50 cursor-not-allowed"
                    : "border-border/60 bg-card hover:bg-muted/40 hover:border-primary/30 cursor-pointer"
                }`}
              >
                {isThisLoading ? (
                  <Loader2 className="w-4 h-4 shrink-0 mt-0.5 text-violet-500 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error state */}
        {error && (
          <div className="mx-3 mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-snug">{error}</p>
            </div>
            {preview && (
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Preview card */}
        {preview && (
          <div className="mx-3 mb-4 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                AI Suggestion — {preview.action}
              </span>
              <button type="button" onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {!preview.safe ? (
              <div className="px-3 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{preview.message}</p>
              </div>
            ) : (
              <>
                {/* Original */}
                <div className="px-3 py-2.5 border-b border-border/40 bg-muted/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Original</p>
                  <p className="text-xs text-foreground/70 leading-relaxed line-clamp-4 whitespace-pre-wrap">{preview.original}</p>
                </div>

                {/* Suggestion */}
                <div className="px-3 py-2.5 border-b border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Suggested</p>
                  {preview.newBlockType === "checklist" ? (
                    <ul className="space-y-0.5">
                      {preview.suggestion.split("\n").filter(Boolean).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground leading-snug">
                          <CheckSquare className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{preview.suggestion}</p>
                  )}
                  {preview.newBlockType === "checklist" && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">Will convert block to Checklist</p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-3 py-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border/60 bg-muted/20 shrink-0">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          AI actions work on the selected block only. Review suggestions before applying.
        </p>
      </div>
    </div>
  );
}
