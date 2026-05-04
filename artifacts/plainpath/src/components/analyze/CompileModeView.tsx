import { useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import {
  ChevronRight,
  ArrowLeft,
  Package,
  Check,
  AlertTriangle,
  Calendar,
  FolderOpen,
  PenLine,
  HelpCircle,
  ListTodo,
  BookOpen,
  Printer,
  type LucideIcon,
} from "lucide-react"
import type { CompletionObject, CompletionObjectType, CompletionPriority } from "@/lib/completionTypes"
import { triggerPrint } from "@/lib/print"

// ─── Constants ─────────────────────────────────────────────────────────────────

const COMPLETABLE_TYPES: CompletionObjectType[] = [
  "action_step",
  "required_document",
  "missing_document",
  "signature_needed",
  "deadline",
  "risk",
  "question_to_ask",
]

const PRIORITY_NUM: Record<CompletionPriority, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
}

const TYPE_NUM: Partial<Record<CompletionObjectType, number>> = {
  deadline: 0, signature_needed: 1, required_document: 2,
  missing_document: 3, action_step: 4, risk: 5, question_to_ask: 6,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

function SourceChip({ item }: { item: CompletionObject }) {
  return item.sourceQuote ? (
    <span className="packet-no-print text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40">
      Source-backed
    </span>
  ) : (
    <span className="packet-no-print text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40">
      Review source
    </span>
  )
}

function DoneChip({ done }: { done: boolean }) {
  return done ? (
    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50">
      Done
    </span>
  ) : (
    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 bg-secondary/70 text-muted-foreground border-border/50">
      Open
    </span>
  )
}

// ─── PacketSection wrapper ─────────────────────────────────────────────────────

function PacketSection({
  label,
  icon: Icon,
  iconColor,
  iconBg,
  count,
  emptyMessage,
  note,
  className = "",
  children,
}: {
  label: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  count: number
  emptyMessage?: string
  note?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={`rounded-2xl border border-border/40 bg-card overflow-hidden ${className}`}>
      <div className="packet-print-section-header flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
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
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic">{note}</p>
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

// ─── Details button (screen-only, shared) ─────────────────────────────────────

function DetailsBtn({ item, onOpenDetails }: { item: CompletionObject; onOpenDetails: (i: CompletionObject) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetails(item)}
      aria-label={`Open details for ${item.title}`}
      style={{ touchAction: "manipulation" }}
      className="packet-no-print shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-primary/55 hover:text-primary transition-colors outline-none focus-visible:underline mt-0.5"
    >
      Details <ChevronRight className="w-3 h-3" />
    </button>
  )
}

// ─── "What To Do First" row ────────────────────────────────────────────────────

function DoFirstRow({
  item,
  rank,
  onOpenDetails,
}: {
  item: CompletionObject
  rank: number
  onOpenDetails: (item: CompletionObject) => void
}) {
  const TypeIcon = typeIcon(item.type)
  const displayPriority: CompletionPriority =
    item.type === "risk" ? (item.severity ?? item.priority) : item.priority

  return (
    <div className="packet-print-row flex items-start gap-3 px-4 py-3.5">
      <div className="shrink-0 w-5 h-5 rounded-full bg-secondary/60 flex items-center justify-center mt-0.5">
        <span className="text-[9px] font-bold text-muted-foreground leading-none">{rank}</span>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-bold text-foreground leading-snug">{item.title}</p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {displayPriority && (
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none shrink-0 ${priorityBadgeClass(displayPriority)}`}>
              {displayPriority}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/45 shrink-0">
            <TypeIcon className="w-2.5 h-2.5 shrink-0" />
            {typeLabel(item.type)}
          </span>
          <SourceChip item={item} />
        </div>

        {item.whatToDo && (
          <p className="text-[11px] text-foreground/75 leading-relaxed">{item.whatToDo}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {item.whereToGetThis && (
            <p className="text-[10px] text-muted-foreground/60 leading-snug">
              <span className="font-semibold">Where:</span> {item.whereToGetThis}
            </p>
          )}
          {item.dueDate && (
            <p className="text-[10px] text-muted-foreground/60 leading-snug">
              <span className="font-semibold">Deadline:</span> {item.dueDate}
            </p>
          )}
          {!item.dueDate && item.trigger && (
            <p className="text-[10px] text-muted-foreground/60 leading-snug">
              <span className="font-semibold">Trigger:</span> {item.trigger}
            </p>
          )}
        </div>
      </div>

      <DetailsBtn item={item} onOpenDetails={onOpenDetails} />
    </div>
  )
}

// ─── Document row ──────────────────────────────────────────────────────────────

function DocRow({
  item,
  done,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  onOpenDetails: (item: CompletionObject) => void
}) {
  return (
    <div className="packet-print-row flex items-start gap-2.5 px-4 py-3">
      <div
        className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${done ? "bg-emerald-500" : "bg-border/60"}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <p className={`text-xs font-semibold leading-snug ${done ? "text-muted-foreground/55" : "text-foreground"}`}>
          {item.title}
        </p>
        {(item.whyItMatters || item.plainEnglishExplanation) && (
          <p className="text-[10px] text-muted-foreground/65 leading-snug">
            <span className="font-semibold">Why needed:</span>{" "}
            {item.whyItMatters || item.plainEnglishExplanation}
          </p>
        )}
        {item.whereToGetThis && (
          <p className="text-[10px] text-muted-foreground/60 leading-snug">
            <span className="font-semibold">Where to get:</span> {item.whereToGetThis}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DoneChip done={done} />
          <SourceChip item={item} />
        </div>
      </div>
      <DetailsBtn item={item} onOpenDetails={onOpenDetails} />
    </div>
  )
}

// ─── Signature row ─────────────────────────────────────────────────────────────

function SigRow({
  item,
  done,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  onOpenDetails: (item: CompletionObject) => void
}) {
  return (
    <div className="packet-print-row flex items-start gap-2.5 px-4 py-3">
      <div
        className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${done ? "bg-emerald-500" : "bg-border/60"}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <p className={`text-xs font-semibold leading-snug ${done ? "text-muted-foreground/55" : "text-foreground"}`}>
          {item.title}
        </p>
        {item.plainEnglishExplanation && (
          <p className="text-[10px] text-muted-foreground/65 leading-snug">
            {item.plainEnglishExplanation}
          </p>
        )}
        {item.whereToGetThis && (
          <p className="text-[10px] text-muted-foreground/60 leading-snug">
            <span className="font-semibold">Official form / source:</span> {item.whereToGetThis}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DoneChip done={done} />
          <SourceChip item={item} />
        </div>
      </div>
      <DetailsBtn item={item} onOpenDetails={onOpenDetails} />
    </div>
  )
}

// ─── Deadline row ──────────────────────────────────────────────────────────────

function DeadlineRow({
  item,
  done,
  isHard,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  isHard: boolean
  onOpenDetails: (item: CompletionObject) => void
}) {
  return (
    <div className="packet-print-row flex items-start gap-2.5 px-4 py-3">
      <div
        className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${done ? "bg-emerald-500" : "bg-border/60"}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-xs font-semibold leading-snug ${done ? "text-muted-foreground/55" : "text-foreground"}`}>
            {item.title}
          </p>
          {isHard && (
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none border shrink-0 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200/70 dark:border-red-900/50">
              Hard deadline
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {item.dueDate && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/65">
              <Calendar className="w-2.5 h-2.5 shrink-0" />
              {item.dueDate}
            </span>
          )}
          {item.trigger && (
            <span className="text-[10px] text-muted-foreground/60 leading-snug">
              <span className="font-semibold">Trigger:</span> {item.trigger}
            </span>
          )}
        </div>
        {(item.whyItMatters || item.whatToDo) && (
          <p className="text-[10px] text-muted-foreground/65 leading-snug">
            {item.whyItMatters || item.whatToDo}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DoneChip done={done} />
          <SourceChip item={item} />
        </div>
      </div>
      <DetailsBtn item={item} onOpenDetails={onOpenDetails} />
    </div>
  )
}

// ─── Question row (copy-ready) ─────────────────────────────────────────────────

function QuestionRow({
  item,
  done,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  onOpenDetails: (item: CompletionObject) => void
}) {
  return (
    <div className="packet-print-row flex items-start gap-2.5 px-4 py-3">
      <HelpCircle
        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${done ? "text-muted-foreground/30" : "text-sky-500/60"}`}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <p className={`text-xs font-medium leading-snug ${done ? "text-muted-foreground/55" : "text-foreground/90"}`}>
          <span className="text-[10px] font-bold text-muted-foreground/45 mr-1 uppercase tracking-wider">Ask the issuing organization:</span>
          {item.title}
        </p>
        {item.whereToGetThis && (
          <p className="text-[10px] text-muted-foreground/55 leading-snug">{item.whereToGetThis}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DoneChip done={done} />
          <SourceChip item={item} />
        </div>
      </div>
      <DetailsBtn item={item} onOpenDetails={onOpenDetails} />
    </div>
  )
}

// ─── Risk row ──────────────────────────────────────────────────────────────────

function RiskRow({
  item,
  done,
  onOpenDetails,
}: {
  item: CompletionObject
  done: boolean
  onOpenDetails: (item: CompletionObject) => void
}) {
  const displayPriority: CompletionPriority = item.severity ?? item.priority

  return (
    <div className="packet-print-row flex items-start gap-2.5 px-4 py-3">
      <AlertTriangle
        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${done ? "text-muted-foreground/30" : "text-amber-500/70"}`}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-xs font-semibold leading-snug ${done ? "text-muted-foreground/55" : "text-foreground"}`}>
            {item.title}
          </p>
          {displayPriority && displayPriority !== "low" && (
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none shrink-0 ${priorityBadgeClass(displayPriority)}`}>
              {displayPriority}
            </span>
          )}
        </div>
        {item.whyItMatters && (
          <p className="text-[10px] text-muted-foreground/65 leading-snug">{item.whyItMatters}</p>
        )}
        {item.whatToDo && (
          <p className="text-[10px] text-muted-foreground/55 leading-snug">
            <span className="font-semibold">Caution:</span> {item.whatToDo}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DoneChip done={done} />
          <SourceChip item={item} />
        </div>
      </div>
      <DetailsBtn item={item} onOpenDetails={onOpenDetails} />
    </div>
  )
}

// ─── Appendix evidence row ─────────────────────────────────────────────────────

function AppendixRow({
  item,
  onOpenDetails,
}: {
  item: CompletionObject
  onOpenDetails: (item: CompletionObject) => void
}) {
  const TypeIcon = typeIcon(item.type)

  return (
    <div className="packet-print-row px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <TypeIcon className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40">
            Source-backed
          </span>
        </div>
        <DetailsBtn item={item} onOpenDetails={onOpenDetails} />
      </div>
      {item.sourceQuote && (
        <p className="text-[10px] text-muted-foreground/55 leading-relaxed line-clamp-3 italic pl-2.5 border-l-2 border-border/30">
          "{item.sourceQuote}"
        </p>
      )}
      {(item.sourcePage || item.sourceSection) && (
        <p className="text-[9px] text-muted-foreground/40 pl-2.5 leading-snug">
          {item.sourceSection}
          {item.sourceSection && item.sourcePage && " · "}
          {item.sourcePage && `p. ${item.sourcePage}`}
        </p>
      )}
    </div>
  )
}

// ─── Compact completed row (screen only) ──────────────────────────────────────

function CompletedRow({
  item,
  onOpenDetails,
}: {
  item: CompletionObject
  onOpenDetails: (item: CompletionObject) => void
}) {
  const TypeIcon = typeIcon(item.type)

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground/50 font-medium leading-snug line-through truncate">
          {item.title}
        </p>
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/35">
          <TypeIcon className="w-2.5 h-2.5 shrink-0" />
          {typeLabel(item.type)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onOpenDetails(item)}
        aria-label={`Open details for ${item.title}`}
        style={{ touchAction: "manipulation" }}
        className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-primary/40 hover:text-primary transition-colors outline-none focus-visible:underline"
      >
        Details <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Final checklist item ──────────────────────────────────────────────────────

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

// ─── Main component ────────────────────────────────────────────────────────────

export interface CompileModeViewProps {
  completionObjects: CompletionObject[]
  completionStatus: Record<string, boolean>
  onOpenDetails: (item: CompletionObject) => void
  onGoToComplete: () => void
  onGoToPlan: () => void
  onResetProgress?: () => void
  storageAvailable?: boolean
  saveFlashVisible?: boolean
  documentTitle: string
  documentType?: string
  summary?: string
}

export function CompileModeView({
  completionObjects,
  completionStatus,
  onResetProgress,
  storageAvailable = true,
  saveFlashVisible = false,
  onOpenDetails,
  onGoToComplete,
  onGoToPlan,
  documentTitle,
  documentType,
  summary,
}: CompileModeViewProps) {
  const [printUnavailable, setPrintUnavailable] = useState(false)

  // ── Core tallies ──────────────────────────────────────────────────────────
  const completable   = completionObjects.filter((o) => COMPLETABLE_TYPES.includes(o.type))
  const totalItems    = completable.length
  const doneItems     = completable.filter((o) => completionStatus[o.id] === true).length
  const openItems     = completable.filter((o) => completionStatus[o.id] !== true)
  const progress      = totalItems === 0 ? 100 : Math.round((doneItems / totalItems) * 100)
  const statusLabel   = packetStatusLabel(progress)
  const statusColor   = packetStatusColor(progress)
  const sourceBacked  = completable.filter((o) => !!o.sourceQuote)
  const manualCount   = completable.filter((o) => !o.sourceQuote).length
  const completedItems = completable.filter((o) => completionStatus[o.id] === true)

  // ── "What To Do First": priority × type sort, max 7 open items ───────────
  const whatToDoFirst = [...openItems]
    .sort((a, b) => {
      const ap = PRIORITY_NUM[a.priority] ?? 3
      const bp = PRIORITY_NUM[b.priority] ?? 3
      if (ap !== bp) return ap - bp
      return (TYPE_NUM[a.type] ?? 99) - (TYPE_NUM[b.type] ?? 99)
    })
    .slice(0, 7)
  const wtdfIds = new Set(whatToDoFirst.map((i) => i.id))

  // ── Section groupings ─────────────────────────────────────────────────────
  const docItems       = completable.filter((o) => o.type === "required_document" || o.type === "missing_document")
  const docsDeduped    = docItems.filter((o) => !wtdfIds.has(o.id))
  const sigItems       = completable.filter((o) => o.type === "signature_needed")
  const deadlineItems  = completable.filter((o) => o.type === "deadline")
  const hardDeadlines  = deadlineItems.filter((o) => o.dueDate !== null)
  const refDeadlines   = deadlineItems.filter((o) => o.dueDate === null)
  const riskItems      = completable.filter((o) => o.type === "risk")
  const questionItems  = completable.filter((o) => o.type === "question_to_ask")
  const evidenceItems  = completionObjects.filter((o) => o.sourceQuote)

  const deduped = docItems.length - docsDeduped.length
  const docsNote = docsDeduped.length > 0 && deduped > 0
    ? `${deduped} document item${deduped > 1 ? "s" : ""} already shown in "What To Do First" above.`
    : undefined
  const docsEmpty = docItems.length === 0
    ? "No required or missing documents were identified."
    : `All document items are already shown in "What To Do First" above.`

  const previewDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // ── Print handler ──────────────────────────────────────────────────────────
  function handlePrint() {
    document.body.classList.add("packet-print-active")
    const cleanup = () => {
      document.body.classList.remove("packet-print-active")
      window.removeEventListener("afterprint", cleanup)
    }
    window.addEventListener("afterprint", cleanup)
    const result = triggerPrint()
    if (!result.success) {
      document.body.classList.remove("packet-print-active")
      window.removeEventListener("afterprint", cleanup)
      setPrintUnavailable(true)
    }
  }

  // Cover stats for print
  const coverStatusColor = progress === 100 ? "#059669" : progress > 0 ? "#d97706" : "#6b7280"

  return (
    <motion.div
      key="compile-mode"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.14 }}
      className="packet-print-root mb-6 sm:mb-8 space-y-4"
    >

      {/* ── Print-only cover page ──────────────────────────────────────────── */}
      <div className="packet-print-only" aria-hidden="true">
        <div style={{ borderBottom: "2.5px solid #4F7CAC", paddingBottom: "14pt", marginBottom: "18pt" }}>
          <p style={{ fontSize: "8pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4F7CAC", margin: "0 0 6pt 0" }}>
            PlainPath Completion Packet
          </p>
          <p style={{ fontSize: "20pt", fontWeight: 800, color: "#111827", margin: "0 0 4pt 0", lineHeight: 1.15 }}>
            {documentTitle}
          </p>
          {documentType && (
            <p style={{ fontSize: "11pt", fontWeight: 500, color: "#6b7280", margin: "0 0 6pt 0" }}>
              {documentType}
            </p>
          )}
          <p style={{ fontSize: "9.5pt", fontWeight: 500, color: "#6b7280", margin: "0 0 10pt 0", fontStyle: "italic" }}>
            A checklist generated from your uploaded document to help you complete the paperwork.
          </p>

          {/* Cover stats grid — 2 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8pt", marginTop: "10pt" }}>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6pt", padding: "8pt 10pt" }}>
              <p style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 3pt 0" }}>Generated</p>
              <p style={{ fontSize: "9pt", fontWeight: 600, color: "#374151", margin: 0 }}>{previewDate}</p>
            </div>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6pt", padding: "8pt 10pt" }}>
              <p style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 3pt 0" }}>Completion</p>
              <p style={{ fontSize: "9pt", fontWeight: 700, color: coverStatusColor, margin: 0 }}>
                {doneItems} of {totalItems} items done
              </p>
            </div>
          </div>

          {/* Purpose notice */}
          <div style={{ marginTop: "12pt", background: "#fefce8", border: "1px solid #fde68a", borderRadius: "6pt", padding: "9pt 12pt" }}>
            <p style={{ fontSize: "8.5pt", color: "#78350f", lineHeight: 1.55, margin: 0 }}>
              <strong>This is not the original document.</strong> This packet is a checklist to help you complete, gather, sign, verify, and submit the paperwork from your uploaded document. Keep the original document with this packet.
            </p>
          </div>

          {/* Cover summary */}
          {summary && (
            <div style={{ marginTop: "10pt", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6pt", padding: "9pt 12pt" }}>
              <p style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#15803d", margin: "0 0 4pt 0" }}>
                Plain-English Summary
              </p>
              <p style={{ fontSize: "9pt", color: "#374151", lineHeight: 1.55, margin: 0 }}>{summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Header card (screen) ───────────────────────────────────────────── */}
      <div className="packet-print-header-card rounded-3xl border border-border/30 bg-card shadow-lg shadow-black/[0.04] dark:shadow-black/20 overflow-hidden p-6 sm:p-8 space-y-5">

        {/* Icon + title — screen only */}
        <div className="packet-no-print flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-0.5 tracking-tight">
              Completion Packet
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
              A checklist to help you complete, gather, sign, verify, and submit your paperwork.
            </p>
          </div>
        </div>

        {/* Packet Summary */}
        <div className="rounded-2xl border border-border/30 bg-secondary/20 p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Packet Summary
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
            <div className="sm:col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Document</p>
              <p className="text-sm font-semibold text-foreground leading-snug mt-0.5 break-words">{documentTitle}</p>
              {documentType && (
                <p className="text-xs text-foreground/50 mt-0.5">{documentType}</p>
              )}
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Date</p>
              <p className="text-sm text-foreground/80 leading-snug mt-0.5">{previewDate}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Completion</p>
              <p className={`text-sm font-bold leading-snug mt-0.5 ${statusColor}`}>
                {doneItems}/{totalItems} ({progress}%) — {statusLabel}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Source-backed</p>
              <p className="text-sm text-foreground/80 leading-snug mt-0.5">{sourceBacked.length} items</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Needs Manual Review</p>
              <p className="text-sm text-foreground/80 leading-snug mt-0.5">{manualCount} items</p>
            </div>
          </div>
        </div>

        {/* Navigation + print — screen only */}
        <div className="packet-screen-actions flex flex-wrap items-center gap-3 pt-1">
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
            Review in Plan
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
          {printUnavailable ? (
            <span className="text-xs text-muted-foreground/50 italic">
              Printing not available on this device.
            </span>
          ) : (
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print Completion Checklist"
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[38px]"
            >
              <Printer className="w-4 h-4 shrink-0" />
              Print Completion Checklist
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
          <span className="text-[10px] leading-snug transition-colors duration-300">
            {saveFlashVisible && storageAvailable ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Saved</span>
            ) : (
              <span className="text-muted-foreground/40">
                {storageAvailable ? "Progress saved on this device" : "Progress may reset after refresh"}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── Packet sections ────────────────────────────────────────────────── */}
      <div className="space-y-3 sm:space-y-4">

        {/* 1. What To Do First */}
        <PacketSection
          label="What To Do First"
          icon={ListTodo}
          iconColor="text-primary/70"
          iconBg="bg-primary/10"
          count={whatToDoFirst.length}
          emptyMessage="All items are complete — nothing left to do."
          note={
            openItems.length > 7
              ? `Showing the ${whatToDoFirst.length} highest-priority open items. Go to Complete mode to see all ${openItems.length} open items.`
              : undefined
          }
          className="packet-print-section"
        >
          {whatToDoFirst.map((item, i) => (
            <DoFirstRow key={item.id} item={item} rank={i + 1} onOpenDetails={onOpenDetails} />
          ))}
        </PacketSection>

        {/* 2. Documents To Gather */}
        <PacketSection
          label="Documents To Gather"
          icon={FolderOpen}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-50 dark:bg-violet-950/40"
          count={docsDeduped.length}
          emptyMessage={docsEmpty}
          note={docsNote}
          className="packet-print-section"
        >
          {docsDeduped.map((item) => (
            <DocRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* 3. Signatures Needed */}
        <PacketSection
          label="Signatures Needed"
          icon={PenLine}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          count={sigItems.length}
          emptyMessage="No signatures were identified for this document."
          className="packet-print-section"
        >
          {sigItems.map((item) => (
            <SigRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* 4. Deadlines & Timing */}
        <PacketSection
          label="Deadlines & Timing"
          icon={Calendar}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-950/40"
          count={deadlineItems.length}
          emptyMessage="No deadlines were identified for this document."
          className="packet-print-section"
        >
          {/* Hard deadlines first */}
          {hardDeadlines.length > 0 && refDeadlines.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Hard Deadlines</p>
            </div>
          )}
          {hardDeadlines.map((item) => (
            <DeadlineRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              isHard={true}
              onOpenDetails={onOpenDetails}
            />
          ))}
          {/* Reference dates */}
          {refDeadlines.length > 0 && hardDeadlines.length > 0 && (
            <div className="px-4 pt-3 pb-1 border-t border-border/15">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Reference Dates / Triggers</p>
            </div>
          )}
          {refDeadlines.map((item) => (
            <DeadlineRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              isHard={false}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* 5. Questions To Ask */}
        <PacketSection
          label="Questions To Ask"
          icon={HelpCircle}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-950/40"
          count={questionItems.length}
          emptyMessage="No follow-up questions were identified."
          className="packet-print-section"
        >
          {questionItems.map((item) => (
            <QuestionRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* 6. Risks To Review — screen only (not printed in checklist) */}
        <PacketSection
          label="Risks To Review Before Acting"
          icon={AlertTriangle}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-950/40"
          count={riskItems.length}
          emptyMessage="No risks were identified for this document."
          note="Review any risks with a qualified professional as appropriate. PlainPath does not provide legal, financial, or professional advice."
          className="packet-no-print packet-print-section"
        >
          {riskItems.map((item) => (
            <RiskRow
              key={item.id}
              item={item}
              done={completionStatus[item.id] === true}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </PacketSection>

        {/* 7. Completed Items — screen only ─────────────────────────────── */}
        {completedItems.length > 0 && (
          <div className="packet-no-print rounded-2xl border border-border/30 bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/40">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-foreground flex-1 min-w-0">Completed</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 leading-none">
                {completedItems.length}
              </span>
            </div>
            <div className="divide-y divide-border/15">
              {completedItems.map((item) => (
                <CompletedRow key={item.id} item={item} onOpenDetails={onOpenDetails} />
              ))}
            </div>
          </div>
        )}

        {/* 8. Final Review Checklist */}
        <div className="packet-print-section rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="packet-print-section-header flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-secondary/60">
              <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-bold text-foreground flex-1 min-w-0">Final Review Checklist</h3>
          </div>
          <div className="px-4 py-2 divide-y divide-border/15">
            {[
              "I gathered required documents",
              "I confirmed which signatures are needed and who signs",
              "I checked all deadlines and timing triggers",
              "I asked — or wrote down — my unresolved questions",
              "I reviewed open items and know what to do first",
              "I kept the original document with this packet",
              "I understand PlainPath is not legal, financial, medical, or professional advice",
            ].map((text) => (
              <ChecklistItem key={text} text={text} />
            ))}
          </div>
        </div>

        {/* 9. Source Evidence Appendix — screen only (not printed in checklist) */}
        <PacketSection
          label="Appendix — Source Evidence"
          icon={BookOpen}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          count={evidenceItems.length}
          emptyMessage="No source evidence was found for any items."
          className="packet-no-print packet-print-section"
        >
          {evidenceItems.map((item) => (
            <AppendixRow key={item.id} item={item} onOpenDetails={onOpenDetails} />
          ))}
        </PacketSection>

        {/* 10. Disclaimer */}
        <div className="packet-print-section rounded-2xl border border-border/25 bg-secondary/15 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
            Disclaimer
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            PlainPath helps organize and explain documents. It does not provide legal, financial, medical, or
            professional advice. Always verify requirements with the issuing organization before acting.
          </p>
        </div>

        {/* Print footer */}
        <div className="packet-print-only" aria-hidden="true">
          <p style={{ fontSize: "8pt", color: "#9ca3af", borderTop: "1px solid #e5e7eb", paddingTop: "8pt", marginTop: "8pt", textAlign: "center" }}>
            Generated by PlainPath. Verify all requirements with the issuing organization before acting.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
