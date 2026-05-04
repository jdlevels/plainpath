import type { ReactNode } from "react"
import { motion } from "framer-motion"
import {
  ChevronRight,
  ArrowLeft,
  Lock,
  Package,
  FileText,
  Check,
  AlertTriangle,
  Calendar,
  FolderOpen,
  PenLine,
  HelpCircle,
  ListTodo,
  BookOpen,
  type LucideIcon,
} from "lucide-react"
import type { CompletionObject, CompletionObjectType, CompletionPriority } from "@/lib/completionTypes"

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

function packetStatusLabel(pct: number): string {
  if (pct === 0)   return "Not started"
  if (pct < 50)    return "In progress"
  if (pct < 100)   return "Partially complete"
  return "Ready for final review"
}

function packetStatusColor(pct: number): string {
  if (pct === 0)   return "text-muted-foreground/60"
  if (pct < 50)    return "text-blue-600 dark:text-blue-400"
  if (pct < 100)   return "text-amber-600 dark:text-amber-400"
  return "text-emerald-600 dark:text-emerald-400"
}

// ─── PacketSection wrapper ────────────────────────────────────────────────────

function PacketSection({
  label,
  icon: Icon,
  iconColor,
  iconBg,
  count,
  emptyMessage,
  note,
  children,
}: {
  label: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  count: number
  emptyMessage?: string
  note?: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <h3 className="text-sm font-bold text-foreground flex-1 min-w-0 leading-tight">{label}</h3>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0 leading-none">
          {count}
        </span>
      </div>
      {note && count > 0 && (
        <div className="px-4 pt-3 pb-0">
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 rounded-xl px-3 py-2 leading-relaxed">
            {note}
          </p>
        </div>
      )}
      {count === 0 ? (
        <div className="px-4 py-4">
          <p className="text-xs text-muted-foreground/50 italic">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/20">{children}</div>
      )}
    </div>
  )
}

// ─── Read-only packet row (no toggle) ─────────────────────────────────────────

function PacketRow({
  item,
  done,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  onOpenDetails: (item: CompletionObject) => void
}) {
  const displayPriority: CompletionPriority =
    item.type === "risk" ? (item.severity ?? item.priority) : item.priority
  const TypeIcon = typeIcon(item.type)

  return (
    <div className="flex items-center gap-2.5 px-4 py-3">
      {/* Status dot — read-only indicator */}
      <div
        className={`shrink-0 w-2 h-2 rounded-full mt-0.5 ${done ? "bg-emerald-500" : "bg-border/60"}`}
        aria-hidden="true"
      />

      {/* Title + chips */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug truncate ${done ? "text-muted-foreground/55" : "text-foreground"}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          {/* Type label */}
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/45 shrink-0">
            <TypeIcon className="w-2.5 h-2.5 shrink-0" />
            {typeLabel(item.type)}
          </span>
          {/* Done / open badge */}
          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 ${
            done
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40"
              : "bg-secondary/70 text-muted-foreground border-border/50"
          }`}>
            {done ? "Done" : "Open"}
          </span>
          {/* Priority badge */}
          {displayPriority && displayPriority !== "low" && (
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none shrink-0 ${priorityBadgeClass(displayPriority)}`}>
              {displayPriority}
            </span>
          )}
          {/* Source chip */}
          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 ${
            item.sourceQuote
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40"
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40"
          }`}>
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

// ─── Deadline row (shows dueDate + trigger) ───────────────────────────────────

function DeadlineRow({
  item,
  done,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  onOpenDetails: (item: CompletionObject) => void
}) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3">
      <div
        className={`shrink-0 w-2 h-2 rounded-full mt-1 ${done ? "bg-emerald-500" : "bg-border/60"}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className={`text-xs font-semibold leading-snug ${done ? "text-muted-foreground/55" : "text-foreground"}`}>
          {item.title}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {item.dueDate && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/60 bg-secondary/40 rounded-lg px-2 py-0.5">
              <Calendar className="w-2.5 h-2.5 shrink-0" />
              {item.dueDate}
            </span>
          )}
          {item.trigger && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/60 bg-secondary/40 rounded-lg px-2 py-0.5">
              Trigger: {item.trigger}
            </span>
          )}
          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border ${
            done
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50"
              : "bg-secondary/70 text-muted-foreground border-border/50"
          }`}>
            {done ? "Done" : "Open"}
          </span>
          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border ${
            item.sourceQuote
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50"
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50"
          }`}>
            {item.sourceQuote ? "Source-backed" : "Review source"}
          </span>
        </div>
      </div>
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
  )
}

// ─── Evidence row ─────────────────────────────────────────────────────────────

function EvidenceRow({
  item,
  onOpenDetails,
}: {
  item: CompletionObject
  onOpenDetails: (item: CompletionObject) => void
}) {
  return (
    <div className="px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40">
            Source-backed
          </span>
        </div>
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
      {item.sourceQuote && (
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-2 italic pl-2 border-l-2 border-border/30">
          "{item.sourceQuote}"
        </p>
      )}
    </div>
  )
}

// ─── Static checklist item ────────────────────────────────────────────────────

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <div
        className="w-4 h-4 rounded border-2 border-border/50 flex items-center justify-center shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface CompileModeViewProps {
  completionObjects: CompletionObject[]
  completionStatus: Record<string, boolean>
  onOpenDetails: (item: CompletionObject) => void
  onGoToComplete: () => void
  onGoToPlan: () => void
  documentTitle: string
  documentType?: string
  summary?: string
}

export function CompileModeView({
  completionObjects,
  completionStatus,
  onOpenDetails,
  onGoToComplete,
  onGoToPlan,
  documentTitle,
  documentType,
  summary,
}: CompileModeViewProps) {
  // Filter to completable types
  const completable = completionObjects.filter((o) => COMPLETABLE_TYPES.includes(o.type))
  const totalItems  = completable.length
  const doneItems   = completable.filter((o) => completionStatus[o.id] === true).length
  const progress    = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)
  const statusLabel = packetStatusLabel(progress)
  const statusColor = packetStatusColor(progress)

  // Section groupings
  const completedItems  = completable.filter((o) => completionStatus[o.id] === true)
  const openList        = completable.filter((o) => completionStatus[o.id] !== true)
  const docItems        = completable.filter((o) => o.type === "required_document" || o.type === "missing_document")
  const sigItems        = completable.filter((o) => o.type === "signature_needed")
  const deadlineItems   = completable.filter((o) => o.type === "deadline")
  const riskItems       = completable.filter((o) => o.type === "risk")
  const questionItems   = completable.filter((o) => o.type === "question_to_ask")
  const evidenceItems   = completionObjects.filter((o) => o.sourceQuote)
  const manualItems     = completable.filter((o) => !o.sourceQuote)
  const sourceBacked    = completable.filter((o) => !!o.sourceQuote)

  const previewDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <motion.div
      key="compile-mode"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.14 }}
      className="no-print mb-6 sm:mb-8 space-y-4"
    >
      {/* ── Header card ────────────────────────────────── */}
      <div className="rounded-3xl border border-border/30 bg-card shadow-lg shadow-black/[0.04] dark:shadow-black/20 overflow-hidden p-6 sm:p-8 space-y-5">

        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-0.5 tracking-tight">
              Document Action Packet
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
              A structured packet of what PlainPath found, what you completed, and what still needs attention.
            </p>
          </div>
        </div>

        {/* ── Section A: Cover / Packet Summary ─────── */}
        <div className="rounded-2xl border border-border/30 bg-secondary/20 p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Packet Summary
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Document</p>
              <p className="text-sm font-semibold text-foreground leading-snug mt-0.5 break-words">{documentTitle}</p>
            </div>
            {documentType && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Type</p>
                <p className="text-sm text-foreground/80 leading-snug mt-0.5">{documentType}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Preview Date</p>
              <p className="text-sm text-foreground/80 leading-snug mt-0.5">{previewDate}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Completion</p>
              <p className={`text-sm font-bold leading-snug mt-0.5 ${statusColor}`}>
                {doneItems}/{totalItems} complete ({progress}%) — {statusLabel}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Source-backed</p>
              <p className="text-sm text-foreground/80 leading-snug mt-0.5">{sourceBacked.length} items</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Needs Manual Review</p>
              <p className="text-sm text-foreground/80 leading-snug mt-0.5">{manualItems.length} items</p>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onGoToComplete}
            style={{ touchAction: "manipulation" }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Complete
          </button>
          <button
            type="button"
            onClick={onGoToPlan}
            style={{ touchAction: "manipulation" }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[38px]"
          >
            Review Open Items
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label="Export Packet — PDF export comes in the next phase"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/25 bg-secondary/25 text-sm font-semibold text-muted-foreground/35 cursor-not-allowed min-h-[38px]"
            >
              <FileText className="w-4 h-4 shrink-0" />
              Export Packet
            </button>
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
              <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
              PDF export comes in the next phase.
            </span>
          </div>
        </div>
      </div>

      {/* ── Packet sections B–M ────────────────────────── */}
      <div className="space-y-3 sm:space-y-4">

        {/* B: Plain-English Summary */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
              <BookOpen className="w-3.5 h-3.5 text-primary/70" />
            </div>
            <h3 className="text-sm font-bold text-foreground flex-1 min-w-0">Plain-English Summary</h3>
          </div>
          <div className="px-4 py-4">
            {summary ? (
              <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">
                PlainPath could not generate a plain-English summary for this document.
              </p>
            )}
          </div>
        </div>

        {/* C: Completed Items */}
        <PacketSection
          label="Completed Items"
          icon={Check}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          count={completedItems.length}
          emptyMessage="No items have been marked complete yet."
        >
          {completedItems.map((item) => (
            <PacketRow key={item.id} item={item} done={true} onOpenDetails={onOpenDetails} />
          ))}
        </PacketSection>

        {/* D: Open Items */}
        <PacketSection
          label="Open Items"
          icon={ListTodo}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          count={openList.length}
          emptyMessage="All items are complete."
        >
          {openList.map((item) => (
            <PacketRow key={item.id} item={item} done={false} onOpenDetails={onOpenDetails} />
          ))}
        </PacketSection>

        {/* E: Required / Missing Documents */}
        <PacketSection
          label="Required / Missing Documents"
          icon={FolderOpen}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-50 dark:bg-violet-950/40"
          count={docItems.length}
          emptyMessage="No required or missing documents were identified."
        >
          {docItems.map((item) => (
            <PacketRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* F: Signatures Needed */}
        <PacketSection
          label="Signatures Needed"
          icon={PenLine}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          count={sigItems.length}
          emptyMessage="No signatures were identified for this document."
        >
          {sigItems.map((item) => (
            <PacketRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* G: Deadlines / Timing */}
        <PacketSection
          label="Deadlines / Timing"
          icon={Calendar}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-950/40"
          count={deadlineItems.length}
          emptyMessage="No deadlines were identified for this document."
        >
          {deadlineItems.map((item) => (
            <DeadlineRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* H: Risks / Review Before Acting */}
        <PacketSection
          label="Risks / Review Before Acting"
          icon={AlertTriangle}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-950/40"
          count={riskItems.length}
          emptyMessage="No risks were identified for this document."
        >
          {riskItems.map((item) => (
            <PacketRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* I: Questions to Ask */}
        <PacketSection
          label="Questions to Ask"
          icon={HelpCircle}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-950/40"
          count={questionItems.length}
          emptyMessage="No follow-up questions were identified."
        >
          {questionItems.map((item) => (
            <PacketRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* J: Source Evidence Index */}
        <PacketSection
          label="Source Evidence Index"
          icon={BookOpen}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          count={evidenceItems.length}
          emptyMessage="No source evidence was found for any items."
        >
          {evidenceItems.map((item) => (
            <EvidenceRow key={item.id} item={item} onOpenDetails={onOpenDetails} />
          ))}
        </PacketSection>

        {/* K: Needs Manual Review */}
        <PacketSection
          label="Needs Manual Review"
          icon={HelpCircle}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          count={manualItems.length}
          emptyMessage="All items have source evidence."
          note="These items did not include a direct source quote. Review the uploaded document manually before acting."
        >
          {manualItems.map((item) => (
            <PacketRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* L: Final Review Checklist */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-secondary/60">
              <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-bold text-foreground flex-1 min-w-0">Final Review Checklist</h3>
          </div>
          <div className="px-4 py-2 divide-y divide-border/15">
            {[
              "I reviewed open items",
              "I verified source evidence",
              "I gathered required documents",
              "I confirmed signatures",
              "I checked deadlines",
              "I understand PlainPath is not legal, financial, or professional advice",
            ].map((text) => (
              <ChecklistItem key={text} text={text} />
            ))}
          </div>
        </div>

        {/* M: Disclaimer */}
        <div className="rounded-2xl border border-border/25 bg-secondary/15 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
            Disclaimer
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            PlainPath helps organize and explain documents. It does not provide legal, financial, medical, or
            professional advice. Always verify requirements with the issuing organization before acting.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
