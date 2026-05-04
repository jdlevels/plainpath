import { useState } from "react"
import { motion } from "framer-motion"
import {
  Check,
  ChevronRight,
  ArrowLeft,
  Package,
  Lock,
  ListTodo,
  FolderOpen,
  PenLine,
  Calendar,
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
} from "lucide-react"
import type {
  CompletionObject,
  CompletionObjectType,
  CompletionPriority,
} from "@/lib/completionTypes"

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPLETABLE_TYPES: CompletionObjectType[] = [
  "action_step",
  "required_document",
  "missing_document",
  "signature_needed",
  "deadline",
  "risk",
  "question_to_ask",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(type: CompletionObjectType): string {
  switch (type) {
    case "action_step":        return "Action Step"
    case "required_document":  return "Required Doc"
    case "missing_document":   return "Missing Doc"
    case "signature_needed":   return "Signature"
    case "deadline":           return "Deadline"
    case "risk":               return "Risk"
    case "question_to_ask":    return "Question"
    default:                   return "Item"
  }
}

function typeIcon(type: CompletionObjectType): LucideIcon {
  switch (type) {
    case "action_step":        return ListTodo
    case "required_document":  return FolderOpen
    case "missing_document":   return FolderOpen
    case "signature_needed":   return PenLine
    case "deadline":           return Calendar
    case "risk":               return AlertTriangle
    case "question_to_ask":    return HelpCircle
    default:                   return ListTodo
  }
}

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

function progressStatusLabel(pct: number): string {
  if (pct === 0)   return "Not started"
  if (pct < 50)    return "In progress"
  if (pct < 100)   return "Almost ready"
  return "Ready to compile"
}

function progressStatusColor(pct: number): string {
  if (pct === 0)   return "text-muted-foreground/60"
  if (pct < 50)    return "text-blue-600 dark:text-blue-400"
  if (pct < 100)   return "text-amber-600 dark:text-amber-400"
  return "text-emerald-600 dark:text-emerald-400"
}

function progressBarColor(pct: number): string {
  if (pct === 100) return "bg-emerald-500"
  if (pct >= 50)   return "bg-primary"
  return "bg-blue-500"
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  count,
  description,
  color,
  bg,
  border,
}: {
  label: string
  count: number
  description: string
  color: string
  bg: string
  border: string
}) {
  return (
    <div className={`rounded-2xl border ${border} ${bg} px-4 py-4`}>
      <p className={`text-2xl font-bold tabular-nums leading-none mb-1 ${color}`}>{count}</p>
      <p className={`text-[10px] font-bold uppercase tracking-wider leading-none ${color} opacity-80`}>
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground/55 mt-1.5 leading-snug">{description}</p>
    </div>
  )
}

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
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
  const TypeIcon = typeIcon(item.type)

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 transition-colors ${
        done ? "bg-secondary/15" : ""
      }`}
    >
      {/* Done toggle */}
      <button
        type="button"
        onClick={() => onToggle(item.id, !done)}
        aria-label={done ? `Mark "${item.title}" not done` : `Mark "${item.title}" complete`}
        style={{ touchAction: "manipulation" }}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          done
            ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-400 hover:border-emerald-400"
            : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        {done && <Check className="w-2.5 h-2.5 text-white" />}
      </button>

      {/* Title + chips */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-semibold leading-snug truncate transition-colors ${
            done ? "line-through text-muted-foreground/50" : "text-foreground"
          }`}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          {/* Type label */}
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/45 shrink-0">
            <TypeIcon className="w-2.5 h-2.5 shrink-0" />
            {typeLabel(item.type)}
          </span>
          {/* Priority badge */}
          {displayPriority && displayPriority !== "low" && (
            <span
              className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none shrink-0 ${priorityBadgeClass(displayPriority)}`}
            >
              {displayPriority}
            </span>
          )}
          {/* Source chip */}
          <span
            aria-label={item.sourceQuote ? "Source-backed" : "Needs manual source review"}
            className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 ${
              item.sourceQuote
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40"
            }`}
          >
            {item.sourceQuote ? "Source-backed" : "Review source"}
          </span>
        </div>
      </div>

      {/* Details button */}
      <button
        type="button"
        onClick={() => onOpenDetails(item)}
        aria-label={`Open details for ${item.title}`}
        style={{ touchAction: "manipulation" }}
        className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-primary/55 hover:text-primary transition-colors outline-none focus-visible:underline"
      >
        Details <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Section block ────────────────────────────────────────────────────────────

const SECTION_COLLAPSE_THRESHOLD = 4

function SectionBlock({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  items,
  completionStatus,
  onToggleItem,
  onOpenDetails,
  emptyMessage,
}: {
  title: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  items: CompletionObject[]
  completionStatus: Record<string, boolean>
  onToggleItem: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
  emptyMessage: string
}) {
  const [showAll, setShowAll] = useState(false)
  const overflowCount = items.length - SECTION_COLLAPSE_THRESHOLD
  const visible =
    showAll || items.length <= SECTION_COLLAPSE_THRESHOLD
      ? items
      : items.slice(0, SECTION_COLLAPSE_THRESHOLD)

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <h3 className="text-sm font-bold text-foreground flex-1 min-w-0 leading-tight">
          {title}
        </h3>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0 leading-none">
          {items.length}
        </span>
      </div>

      {/* Rows / empty state */}
      <div className="divide-y divide-border/20">
        {items.length === 0 ? (
          <div className="px-4 py-4">
            <p className="text-xs text-muted-foreground/50 italic">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {visible.map((item) => (
              <ItemRow
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
                onClick={() => setShowAll((v) => !v)}
                style={{ touchAction: "manipulation" }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAll ? "Show less" : `Show ${overflowCount} more`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface CompleteModeViewProps {
  completionObjects: CompletionObject[]
  completionStatus: Record<string, boolean>
  onToggleItem: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
  onGoToPlan: () => void
  documentTitle?: string
}

export function CompleteModeView({
  completionObjects,
  completionStatus,
  onToggleItem,
  onOpenDetails,
  onGoToPlan,
}: CompleteModeViewProps) {
  // All completable items (the 7 types that appear in Plan mode)
  const completable = completionObjects.filter((o) =>
    COMPLETABLE_TYPES.includes(o.type)
  )

  const totalItems = completable.length
  const doneItems  = completable.filter((o) => completionStatus[o.id] === true).length
  const openItems  = completable.filter((o) => completionStatus[o.id] !== true)
  const openCount  = openItems.length

  const completedItems    = completable.filter((o) => completionStatus[o.id] === true)
  const sourceBacked      = completable.filter((o) => !!o.sourceQuote)
  const needsManualReview = completable.filter((o) => !o.sourceQuote)
  const criticalHighOpen  = openItems.filter((o) => {
    const p = o.type === "risk" ? (o.severity ?? o.priority) : o.priority
    return p === "critical" || p === "high"
  })

  const progress = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)
  const statusLabel = progressStatusLabel(progress)
  const statusColor = progressStatusColor(progress)
  const barColor    = progressBarColor(progress)

  return (
    <motion.div
      key="complete-mode"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.14 }}
      className="no-print mb-6 sm:mb-8 space-y-4"
    >
      {/* ── Header card ──────────────────────────────────── */}
      <div className="rounded-3xl border border-border/30 bg-card shadow-lg shadow-black/[0.04] dark:shadow-black/20 overflow-hidden p-6 sm:p-8 space-y-5">

        {/* Title + subtitle */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">
            Complete Your Document Plan
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
            Review what is done, what is still open, and what needs manual confirmation before
            you submit or rely on this document.
          </p>
        </div>

        {/* Progress block */}
        {totalItems > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-foreground leading-none">
                  {doneItems}
                </span>
                <span className="text-sm text-muted-foreground">
                  of {totalItems} complete
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums text-foreground">{progress}%</span>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${statusColor}`}>
                  {statusLabel}
                </p>
              </div>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% complete — ${statusLabel}`}
              className="h-2 w-full rounded-full bg-secondary overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Completed"
            count={doneItems}
            description="Items marked done"
            color="text-emerald-700 dark:text-emerald-400"
            bg="bg-emerald-50/70 dark:bg-emerald-950/25"
            border="border-emerald-200/50 dark:border-emerald-900/40"
          />
          <SummaryCard
            label="Still Open"
            count={openCount}
            description="Items remaining"
            color="text-blue-700 dark:text-blue-400"
            bg="bg-blue-50/70 dark:bg-blue-950/25"
            border="border-blue-200/50 dark:border-blue-900/40"
          />
          <SummaryCard
            label="Manual Review"
            count={needsManualReview.length}
            description="No source quote found"
            color="text-amber-700 dark:text-amber-400"
            bg="bg-amber-50/70 dark:bg-amber-950/25"
            border="border-amber-200/50 dark:border-amber-900/40"
          />
          <SummaryCard
            label="Source-backed"
            count={sourceBacked.length}
            description="Confirmed in document"
            color="text-foreground"
            bg="bg-secondary/40"
            border="border-border/40"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Primary */}
          <button
            type="button"
            onClick={onGoToPlan}
            style={{ touchAction: "manipulation" }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[38px]"
          >
            Review Open Items
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>

          {/* Secondary */}
          <button
            type="button"
            onClick={onGoToPlan}
            style={{ touchAction: "manipulation" }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Plan
          </button>

          {/* Disabled future action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label="Generate Packet — coming in the next phase"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/25 bg-secondary/25 text-sm font-semibold text-muted-foreground/35 cursor-not-allowed min-h-[38px]"
            >
              <Package className="w-4 h-4 shrink-0" />
              Generate Packet
            </button>
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
              <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
              Packet compiler coming in the next phase.
            </span>
          </div>
        </div>
      </div>

      {/* ── Grouped checklist sections ───────────────────── */}
      <div className="space-y-3 sm:space-y-4">

        {/* A: Completed items */}
        <SectionBlock
          title="Completed Items"
          icon={Check}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          items={completedItems}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
          emptyMessage="Nothing has been marked complete yet. Go to Plan mode and start working through your document checklist."
        />

        {/* B: Still open */}
        <SectionBlock
          title="Still Open"
          icon={ListTodo}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          items={openItems}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
          emptyMessage="All checklist items are marked complete. Review the source evidence and generate your packet in the next step."
        />

        {/* C: Critical / high open */}
        <SectionBlock
          title="Critical & High Priority Open Items"
          icon={AlertTriangle}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-950/40"
          items={criticalHighOpen}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
          emptyMessage="No critical or high-priority open items remain."
        />

        {/* D: Needs manual review */}
        <SectionBlock
          title="Needs Manual Review"
          icon={HelpCircle}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          items={needsManualReview}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
          emptyMessage="All items currently shown have source evidence."
        />
      </div>
    </motion.div>
  )
}
