import { useState } from "react"
import { motion } from "framer-motion"
import {
  Check,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Package,
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
    case "required_document":
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
  if (pct < 100)   return "Not ready yet"
  return "Ready for final review"
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

// ─── ItemCard (mobile-first completion card) ──────────────────────────────────

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
  const TypeIcon = typeIcon(item.type)
  const bodyText = item.plainEnglishExplanation || item.whatToDo || item.whyItMatters

  return (
    <div className={`px-4 py-4 transition-colors ${done ? "bg-secondary/10" : ""}`}>
      <div className="flex items-start gap-3">

        {/* Done toggle — w-6 h-6 for comfortable mobile tap */}
        <button
          type="button"
          onClick={() => onToggle(item.id, !done)}
          aria-label={done ? `Mark "${item.title}" not done` : `Mark "${item.title}" done`}
          style={{ touchAction: "manipulation" }}
          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 mt-0.5 ${
            done
              ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-400 hover:border-emerald-400"
              : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          {done && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">

          {/* Title — text-sm for readability */}
          <p
            className={`text-sm font-semibold leading-snug ${
              done ? "line-through text-muted-foreground/45" : "text-foreground"
            }`}
          >
            {item.title}
          </p>

          {/* Type + priority + source chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/45 shrink-0">
              <TypeIcon className="w-2.5 h-2.5 shrink-0" />
              {typeLabel(item.type)}
            </span>
            {displayPriority && displayPriority !== "low" && (
              <span
                className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none shrink-0 ${priorityBadgeClass(displayPriority)}`}
              >
                {displayPriority}
              </span>
            )}
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

          {/* Plain-language body — only for open items */}
          {bodyText && !done && (
            <p className="text-xs text-foreground/65 leading-relaxed line-clamp-2">
              {bodyText}
            </p>
          )}

          {/* Where to get it — only for open items */}
          {item.whereToGetThis && !done && (
            <p className="text-[11px] text-muted-foreground/55 leading-snug">
              <span className="font-semibold">Where:</span> {item.whereToGetThis}
            </p>
          )}
        </div>

        {/* Details button */}
        <button
          type="button"
          onClick={() => onOpenDetails(item)}
          aria-label={`Open details for ${item.title}`}
          style={{ touchAction: "manipulation" }}
          className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-primary/55 hover:text-primary transition-colors outline-none focus-visible:underline mt-0.5"
        >
          Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── CheckSection: open items of a given type ─────────────────────────────────

const SECTION_SHOW_MORE = 5

function CheckSection({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  items,
  completionStatus,
  onToggleItem,
  onOpenDetails,
}: {
  title: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  items: CompletionObject[]
  completionStatus: Record<string, boolean>
  onToggleItem: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
}) {
  const [showAll, setShowAll] = useState(false)

  const openItems = items.filter((o) => completionStatus[o.id] !== true)
  if (openItems.length === 0) return null

  const overflow = openItems.length - SECTION_SHOW_MORE
  const visible =
    showAll || openItems.length <= SECTION_SHOW_MORE
      ? openItems
      : openItems.slice(0, SECTION_SHOW_MORE)

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <h3 className="text-sm font-bold text-foreground flex-1 min-w-0 leading-tight">{title}</h3>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0 leading-none">
          {openItems.length}
        </span>
      </div>

      <div className="divide-y divide-border/20">
        {visible.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            done={completionStatus[item.id] === true}
            onToggle={onToggleItem}
            onOpenDetails={onOpenDetails}
          />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={{ touchAction: "manipulation" }}
            className="w-full px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showAll ? "rotate-180" : ""}`}
            />
            {showAll ? "Show less" : `Show ${overflow} more`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── CompletedSection (collapsible when many) ─────────────────────────────────

const COMPLETED_SHOW_THRESHOLD = 3

function CompletedSection({
  items,
  completionStatus,
  onToggleItem,
  onOpenDetails,
}: {
  items: CompletionObject[]
  completionStatus: Record<string, boolean>
  onToggleItem: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
}) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null

  const collapsible = items.length > COMPLETED_SHOW_THRESHOLD
  const visible = collapsible && !expanded ? items.slice(0, COMPLETED_SHOW_THRESHOLD) : items

  return (
    <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setExpanded((v) => !v)}
        style={{ touchAction: "manipulation" }}
        className={`w-full flex items-center gap-2.5 px-4 py-3 border-b border-border/20 text-left ${
          collapsible
            ? "cursor-pointer hover:bg-secondary/20 transition-colors"
            : "cursor-default"
        }`}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/40">
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-sm font-bold text-muted-foreground/70 flex-1 min-w-0 leading-tight">
          Completed
        </h3>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 leading-none">
          {items.length}
        </span>
        {collapsible && (
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground/40 shrink-0 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      <div className="divide-y divide-border/20">
        {visible.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            done={completionStatus[item.id] === true}
            onToggle={onToggleItem}
            onOpenDetails={onOpenDetails}
          />
        ))}
        {collapsible && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{ touchAction: "manipulation" }}
            className="w-full px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            Show {items.length - COMPLETED_SHOW_THRESHOLD} more completed
          </button>
        )}
      </div>
    </div>
  )
}

// ─── OpenSummaryStrip ─────────────────────────────────────────────────────────

function OpenSummaryStrip({ openItems }: { openItems: CompletionObject[] }) {
  if (openItems.length === 0) return null

  const chips: { label: string; count: number; color: string; bg: string }[] = [
    {
      label: "Documents",
      count: openItems.filter(
        (o) => o.type === "required_document" || o.type === "missing_document"
      ).length,
      color: "text-violet-700 dark:text-violet-400",
      bg:    "bg-violet-100 dark:bg-violet-950/40",
    },
    {
      label: "Signatures",
      count: openItems.filter((o) => o.type === "signature_needed").length,
      color: "text-indigo-700 dark:text-indigo-400",
      bg:    "bg-indigo-100 dark:bg-indigo-950/40",
    },
    {
      label: "Deadlines",
      count: openItems.filter((o) => o.type === "deadline").length,
      color: "text-orange-700 dark:text-orange-400",
      bg:    "bg-orange-100 dark:bg-orange-950/40",
    },
    {
      label: "Questions",
      count: openItems.filter((o) => o.type === "question_to_ask").length,
      color: "text-sky-700 dark:text-sky-400",
      bg:    "bg-sky-100 dark:bg-sky-950/40",
    },
    {
      label: "Actions",
      count: openItems.filter((o) => o.type === "action_step").length,
      color: "text-primary/80",
      bg:    "bg-primary/8",
    },
    {
      label: "Risks",
      count: openItems.filter((o) => o.type === "risk").length,
      color: "text-red-700 dark:text-red-400",
      bg:    "bg-red-100 dark:bg-red-950/40",
    },
  ].filter((c) => c.count > 0)

  if (chips.length === 0) return null

  return (
    <div className="rounded-2xl border border-blue-200/50 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/15 px-4 py-3.5">
      <div className="flex items-start gap-2.5 flex-wrap">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700/60 dark:text-blue-400/60 shrink-0 leading-none pt-0.5 mr-1">
          Still open:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}
            >
              {c.count} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Props + main component ───────────────────────────────────────────────────

export interface CompleteModeViewProps {
  completionObjects: CompletionObject[]
  completionStatus: Record<string, boolean>
  onToggleItem: (id: string, done: boolean) => void
  onOpenDetails: (item: CompletionObject) => void
  onGoToPlan: () => void
  onGoToCompile?: () => void
  onResetProgress?: () => void
  storageAvailable?: boolean
  saveFlashVisible?: boolean
  documentTitle?: string
}

export function CompleteModeView({
  completionObjects,
  completionStatus,
  onToggleItem,
  onOpenDetails,
  onGoToPlan,
  onGoToCompile,
  onResetProgress,
  storageAvailable = true,
  saveFlashVisible = false,
}: CompleteModeViewProps) {
  const completable = completionObjects.filter((o) => COMPLETABLE_TYPES.includes(o.type))

  const totalItems    = completable.length
  const doneItems     = completable.filter((o) => completionStatus[o.id] === true).length
  const openItems     = completable.filter((o) => completionStatus[o.id] !== true)
  const openCount     = openItems.length
  const completedItems = completable.filter((o) => completionStatus[o.id] === true)

  // Manual review = open items with no source quote
  const needsManualReview = openItems.filter((o) => !o.sourceQuote)

  const progress    = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)
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

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">
            Complete Before Submission
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
            Track what is required, what is missing, and what must be verified before you submit or act on this document.
          </p>
        </div>

        {/* Progress bar */}
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
              className="h-2.5 w-full rounded-full bg-secondary overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
          </div>
        )}

        {/* 3 key summary cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="rounded-2xl border border-blue-200/50 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/25 px-3 py-3.5 sm:px-4 sm:py-4">
            <p className="text-2xl font-bold tabular-nums leading-none mb-1 text-blue-700 dark:text-blue-400">
              {openCount}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider leading-none text-blue-700 dark:text-blue-400 opacity-80">
              Still Open
            </p>
            <p className="text-[9px] text-muted-foreground/55 mt-1.5 leading-snug hidden sm:block">
              Items remaining
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/25 px-3 py-3.5 sm:px-4 sm:py-4">
            <p className="text-2xl font-bold tabular-nums leading-none mb-1 text-emerald-700 dark:text-emerald-400">
              {doneItems}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider leading-none text-emerald-700 dark:text-emerald-400 opacity-80">
              Completed
            </p>
            <p className="text-[9px] text-muted-foreground/55 mt-1.5 leading-snug hidden sm:block">
              Items marked done
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/25 px-3 py-3.5 sm:px-4 sm:py-4">
            <p className="text-2xl font-bold tabular-nums leading-none mb-1 text-amber-700 dark:text-amber-400">
              {needsManualReview.length}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider leading-none text-amber-700 dark:text-amber-400 opacity-80">
              Review
            </p>
            <p className="text-[9px] text-muted-foreground/55 mt-1.5 leading-snug hidden sm:block">
              Needs manual check
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onGoToPlan}
            style={{ touchAction: "manipulation" }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Plan
          </button>

          {onGoToCompile && (
            <button
              type="button"
              onClick={onGoToCompile}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[38px]"
            >
              <Package className="w-4 h-4 shrink-0" />
              View Summary
            </button>
          )}

          {onResetProgress && (
            <button
              type="button"
              onClick={onResetProgress}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-muted-foreground/50 hover:text-red-500 dark:hover:text-red-400 transition-colors outline-none focus-visible:underline min-h-[38px]"
              aria-label="Reset all completion progress for this document"
            >
              Reset progress
            </button>
          )}

          {/* Saved-state indicator */}
          <span className="no-print text-[10px] leading-snug transition-colors duration-300">
            {saveFlashVisible && storageAvailable ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Saved</span>
            ) : (
              <span className="text-muted-foreground/40">
                {storageAvailable
                  ? "Progress saved on this device"
                  : "Progress may reset after refresh"}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── Open items ───────────────────────────────────── */}
      <div className="space-y-3 sm:space-y-4">

        {/* "Still open" type-count strip */}
        <OpenSummaryStrip openItems={openItems} />

        {/* B: To Do (action_step open items) */}
        <CheckSection
          title="To Do"
          icon={ListTodo}
          iconColor="text-primary/70"
          iconBg="bg-primary/10"
          items={completable.filter((o) => o.type === "action_step")}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
        />

        {/* C: Documents Needed */}
        <CheckSection
          title="Documents Needed"
          icon={FolderOpen}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-50 dark:bg-violet-950/40"
          items={completable.filter(
            (o) => o.type === "required_document" || o.type === "missing_document"
          )}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
        />

        {/* D: Signatures Needed */}
        <CheckSection
          title="Signatures Needed"
          icon={PenLine}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          items={completable.filter((o) => o.type === "signature_needed")}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
        />

        {/* E: Deadlines */}
        <CheckSection
          title="Deadlines"
          icon={Calendar}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-950/40"
          items={completable.filter((o) => o.type === "deadline")}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
        />

        {/* F: Questions To Ask */}
        <CheckSection
          title="Questions To Ask"
          icon={HelpCircle}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-950/40"
          items={completable.filter((o) => o.type === "question_to_ask")}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
        />

        {/* Risks To Review */}
        <CheckSection
          title="Risks To Review"
          icon={AlertTriangle}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-950/40"
          items={completable.filter((o) => o.type === "risk")}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
        />

        {/* G: Manual Review Needed — open items without source evidence */}
        {needsManualReview.length > 0 && (
          <div className="rounded-2xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/15 px-4 py-4">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-950/50">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-foreground flex-1 min-w-0">
                Needs Manual Review
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shrink-0 leading-none">
                {needsManualReview.length}
              </span>
            </div>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 leading-relaxed">
              {needsManualReview.length === 1
                ? "This item could"
                : `These ${needsManualReview.length} items could`}{" "}
              not be confirmed against source text in your document. Check{" "}
              {needsManualReview.length === 1 ? "it" : "them"} directly with the issuing
              organization before acting.
            </p>
          </div>
        )}

        {/* H: Completed Items */}
        <CompletedSection
          items={completedItems}
          completionStatus={completionStatus}
          onToggleItem={onToggleItem}
          onOpenDetails={onOpenDetails}
        />

        {/* All done state */}
        {openCount === 0 && totalItems > 0 && (
          <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-5 py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              All {totalItems} items complete
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review the source evidence and complete your final checklist in Summary view.
            </p>
            {onGoToCompile && (
              <button
                type="button"
                onClick={onGoToCompile}
                style={{ touchAction: "manipulation" }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                <Package className="w-4 h-4 shrink-0" />
                View Summary
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
