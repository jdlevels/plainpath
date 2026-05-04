import { useState } from "react"
import { motion } from "framer-motion"
import {
  ListTodo,
  FolderOpen,
  PenLine,
  Calendar,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  type LucideIcon,
} from "lucide-react"
import type { CompletionObject, CompletionPriority } from "@/lib/completionTypes"

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlanSummaryViewProps {
  completionObjects: CompletionObject[]
  completionStatus: Record<string, boolean>
  onToggleItem: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
  onTabChange: (tabId: string) => void
}

interface SectionDef {
  id: string
  title: string
  shortLabel: string
  icon: LucideIcon
  items: CompletionObject[]
  tabId: string
  iconColor: string
  iconBg: string
  emptyMessage: string
}

// ─── Priority badge helper ────────────────────────────────────────────────────

function priorityBadgeClass(priority: CompletionPriority): string {
  switch (priority) {
    case "critical":
      return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/70 dark:border-red-900/50"
    case "high":
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/50"
    case "medium":
      return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/50"
    case "low":
      return "bg-secondary/70 text-muted-foreground border border-border/50"
  }
}

// ─── Item card ────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  done,
  onToggle,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  onToggle: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
}) {
  const displayPriority: CompletionPriority =
    item.type === "risk" ? (item.severity ?? item.priority) : item.priority

  return (
    <div className={`px-4 sm:px-5 py-3.5 space-y-2 transition-colors ${done ? "bg-secondary/20" : ""}`}>
      {/* Title row */}
      <div className="flex items-start gap-3">
        {/* Circular toggle button */}
        <button
          type="button"
          onClick={() => onToggle(item.id, !done)}
          title={done ? "Mark this item not done" : "Mark this item complete"}
          aria-label={done ? `Mark "${item.title}" not done` : `Mark "${item.title}" complete`}
          style={{ touchAction: "manipulation" }}
          className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            done
              ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-400 hover:border-emerald-400"
              : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          {done && <Check className="w-2.5 h-2.5 text-white" />}
        </button>

        {/* Title + badge */}
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <p
            className={`text-sm font-semibold leading-snug flex-1 min-w-0 transition-colors ${
              done ? "line-through text-muted-foreground/55" : "text-foreground"
            }`}
          >
            {item.title}
          </p>
          {done ? (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
              Done
            </span>
          ) : displayPriority && displayPriority !== "low" ? (
            <span
              className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none ${priorityBadgeClass(displayPriority)}`}
            >
              {displayPriority}
            </span>
          ) : null}
        </div>
      </div>

      {/* Body — muted when done */}
      <div className={`pl-8 space-y-2 ${done ? "opacity-50" : ""}`}>
        {/* Plain-English explanation */}
        {item.plainEnglishExplanation && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.plainEnglishExplanation}
          </p>
        )}

        {/* What to do */}
        {item.whatToDo && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 shrink-0 pt-0.5 whitespace-nowrap">
              What to do
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed">{item.whatToDo}</p>
          </div>
        )}

        {/* Where to get it */}
        {item.whereToGetThis && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/70 leading-relaxed">{item.whereToGetThis}</p>
          </div>
        )}

        {/* Due date / trigger */}
        {(item.dueDate ?? item.trigger) && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <p className="text-xs text-foreground/70">{item.dueDate ?? item.trigger}</p>
          </div>
        )}

      </div>

      {/* Status label + trust chip + Details button */}
      <div className="pl-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            role="button"
            tabIndex={-1}
            onClick={() => onToggle(item.id, !done)}
            className={`text-[10px] font-semibold cursor-pointer select-none transition-colors shrink-0 ${
              done
                ? "text-emerald-500 hover:text-emerald-600"
                : "text-muted-foreground/38 hover:text-muted-foreground/65"
            }`}
          >
            {done ? "Done" : "Mark done"}
          </span>
          <span
            aria-label={
              item.sourceQuote
                ? "Source-backed recommendation"
                : "No direct source quote — review the document manually"
            }
            className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 ${
              item.sourceQuote
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40"
            }`}
          >
            {item.sourceQuote ? "Source-backed" : "Review source"}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenDetails(item) }}
          style={{ touchAction: "manipulation" }}
          aria-label={`Open details for ${item.title}`}
          className="flex items-center gap-0.5 text-[10px] font-semibold text-primary/55 hover:text-primary transition-colors outline-none focus-visible:underline shrink-0"
        >
          Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

const COLLAPSE_THRESHOLD = 3

function SectionCard({
  section,
  completionStatus,
  onToggleItem,
  onOpenDetails,
  onTabChange,
}: {
  section: SectionDef
  completionStatus: Record<string, boolean>
  onToggleItem: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
  onTabChange: (tabId: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const hasItems = section.items.length > 0
  const doneCount = section.items.filter((item) => completionStatus[item.id] === true).length
  const overflowCount = section.items.length - COLLAPSE_THRESHOLD
  const visibleItems =
    showAll || section.items.length <= COLLAPSE_THRESHOLD
      ? section.items
      : section.items.slice(0, COLLAPSE_THRESHOLD)

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border/25">
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${section.iconBg}`}
        >
          <section.icon className={`w-3.5 h-3.5 ${section.iconColor}`} />
        </div>

        <h3 className="text-sm font-bold text-foreground flex-1 min-w-0 leading-tight">
          {section.title}
        </h3>

        {hasItems && (
          doneCount > 0 ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 shrink-0 leading-none">
              {doneCount}/{section.items.length}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0 leading-none">
              {section.items.length}
            </span>
          )
        )}

        <button
          type="button"
          onClick={() => onTabChange(section.tabId)}
          style={{ touchAction: "manipulation" }}
          className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:text-primary/75 transition-colors whitespace-nowrap"
          aria-label={`View ${section.title} details`}
        >
          Details&nbsp;<ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Items or empty state */}
      <div className="divide-y divide-border/20">
        {hasItems ? (
          <>
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                done={completionStatus[item.id] === true}
                onToggle={onToggleItem}
                onOpenDetails={onOpenDetails}
              />
            ))}

            {overflowCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                style={{ touchAction: "manipulation" }}
                className="w-full px-4 sm:px-5 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show {overflowCount} more
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="px-4 sm:px-5 py-4">
            <p className="text-xs text-muted-foreground/50 italic">{section.emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanSummaryView({
  completionObjects,
  completionStatus,
  onToggleItem,
  onOpenDetails,
  onTabChange,
}: PlanSummaryViewProps) {
  const actions    = completionObjects.filter((o) => o.type === "action_step")
  const docs       = completionObjects.filter(
    (o) => o.type === "required_document" || o.type === "missing_document"
  )
  const signatures = completionObjects.filter((o) => o.type === "signature_needed")
  const deadlines  = completionObjects.filter((o) => o.type === "deadline")
  const risks      = completionObjects.filter((o) => o.type === "risk")
  const questions  = completionObjects.filter((o) => o.type === "question_to_ask")

  const sections: SectionDef[] = [
    {
      id: "actions",
      title: "Actions Required",
      shortLabel: "Actions",
      icon: ListTodo,
      items: actions,
      tabId: "checklist",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      emptyMessage: "No clear action steps were found in this document.",
    },
    {
      id: "docs",
      title: "Documents to Gather",
      shortLabel: "Docs",
      icon: FolderOpen,
      items: docs,
      tabId: "documents",
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      emptyMessage: "No required or missing documents were clearly identified.",
    },
    {
      id: "signatures",
      title: "Signatures Needed",
      shortLabel: "Signatures",
      icon: PenLine,
      items: signatures,
      tabId: "documents",
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-50 dark:bg-violet-950/40",
      emptyMessage: "No signature requirement was clearly found in this document.",
    },
    {
      id: "deadlines",
      title: "Deadlines",
      shortLabel: "Deadlines",
      icon: Calendar,
      items: deadlines,
      tabId: "deadlines",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      emptyMessage:
        "No hard deadline was clearly found. Still review the source document before submitting.",
    },
    {
      id: "risks",
      title: "Risks to Review",
      shortLabel: "Risks",
      icon: AlertTriangle,
      items: risks,
      tabId: "risks",
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-50 dark:bg-red-950/40",
      emptyMessage: "No notable risk was clearly flagged in this document.",
    },
    {
      id: "questions",
      title: "Questions to Ask",
      shortLabel: "Questions",
      icon: HelpCircle,
      items: questions,
      tabId: "action-pack",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      emptyMessage: "No follow-up questions were identified for this document.",
    },
  ]

  // Count chips — click jumps to the corresponding tab
  const chips = [
    { label: "Actions",    count: actions.length,    tabId: "checklist",   icon: ListTodo      },
    { label: "Docs",       count: docs.length,        tabId: "documents",   icon: FolderOpen    },
    { label: "Signatures", count: signatures.length,  tabId: "documents",   icon: PenLine       },
    { label: "Deadlines",  count: deadlines.length,   tabId: "deadlines",   icon: Calendar      },
    { label: "Risks",      count: risks.length,       tabId: "risks",       icon: AlertTriangle },
    { label: "Questions",  count: questions.length,   tabId: "action-pack", icon: HelpCircle    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="no-print mb-6 sm:mb-8"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground mb-0.5 tracking-tight">
          What This Document Requires
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-prose">
          PlainPath identified the actions, documents, signatures, deadlines, risks, and questions
          this document requires from you.
        </p>
      </div>

      {/* ── Count chips ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 mb-5">
        {chips.map(({ label, count, tabId, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onTabChange(tabId)}
            style={{ touchAction: "manipulation" }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              count > 0
                ? "border-border/50 bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
                : "border-border/30 bg-card/60 text-muted-foreground/40"
            }`}
          >
            <Icon className="w-3 h-3" />
            <span className="tabular-nums font-bold">{count}</span>
            <span className={count > 0 ? "" : "opacity-50"}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Section cards ───────────────────────────────────────────────── */}
      <div className="space-y-3 sm:space-y-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            completionStatus={completionStatus}
            onToggleItem={onToggleItem}
            onOpenDetails={onOpenDetails}
            onTabChange={onTabChange}
          />
        ))}
      </div>
    </motion.div>
  )
}
