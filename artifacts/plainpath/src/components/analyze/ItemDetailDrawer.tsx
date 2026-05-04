import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  X,
  Check,
  Copy,
  MapPin,
  Clock,
  MessageSquare,
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

// ─── Type metadata ────────────────────────────────────────────────────────────

function typeLabel(type: CompletionObjectType): string {
  switch (type) {
    case "action_step":        return "Action Step"
    case "required_document":  return "Required Document"
    case "missing_document":   return "Missing Document"
    case "signature_needed":   return "Signature Needed"
    case "deadline":           return "Deadline"
    case "risk":               return "Risk"
    case "question_to_ask":    return "Question to Ask"
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

function typeIconColors(type: CompletionObjectType): { color: string; bg: string } {
  switch (type) {
    case "action_step":        return { color: "text-primary",                             bg: "bg-primary/10" }
    case "required_document":  return { color: "text-blue-600 dark:text-blue-400",         bg: "bg-blue-50 dark:bg-blue-950/40" }
    case "missing_document":   return { color: "text-amber-600 dark:text-amber-400",       bg: "bg-amber-50 dark:bg-amber-950/40" }
    case "signature_needed":   return { color: "text-violet-600 dark:text-violet-400",     bg: "bg-violet-50 dark:bg-violet-950/40" }
    case "deadline":           return { color: "text-amber-600 dark:text-amber-400",       bg: "bg-amber-50 dark:bg-amber-950/40" }
    case "risk":               return { color: "text-red-600 dark:text-red-400",           bg: "bg-red-50 dark:bg-red-950/40" }
    case "question_to_ask":    return { color: "text-emerald-600 dark:text-emerald-400",   bg: "bg-emerald-50 dark:bg-emerald-950/40" }
    default:                   return { color: "text-muted-foreground",                    bg: "bg-secondary/60" }
  }
}

// ─── Priority badge ───────────────────────────────────────────────────────────

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

// ─── What-to-do fallbacks ─────────────────────────────────────────────────────

function whatToDoFallback(type: CompletionObjectType): string {
  switch (type) {
    case "action_step":       return "Complete this action before submitting or relying on the document."
    case "required_document": return "Gather or confirm this document before submitting."
    case "missing_document":  return "This document appears to be needed but was not included in the upload."
    case "signature_needed":  return "Confirm who must sign and whether the signature must be on the official form."
    case "deadline":          return "Confirm this date and complete any required step before the deadline."
    case "risk":              return "Review this risk and decide whether you need clarification before proceeding."
    case "question_to_ask":   return "Ask this question to the issuing party or responsible office before submitting."
    default:                  return "Review this item before proceeding."
  }
}

// ─── Copy message generator ───────────────────────────────────────────────────

function generateCopyMessage(item: CompletionObject, documentTitle: string): string {
  const doc = documentTitle?.trim() || "this document"
  switch (item.type) {
    case "missing_document":
      return `Hello, I'm reviewing ${doc}. It appears I may need ${item.title}, but it was not included with the documents I received. Can you confirm whether this is required and where I can get the correct version?`
    case "signature_needed":
      return `Hello, I'm reviewing ${doc}. Can you confirm who needs to sign ${item.title}, whether the signature must be on an official form, and where I should submit it?`
    case "deadline": {
      const timing = item.trigger ? ` — specifically the requirement ${item.trigger}` : ""
      const due    = item.dueDate ? ` (${item.dueDate})` : ""
      return `Hello, I'm reviewing ${doc}. Can you confirm the deadline or timing for ${item.title}${due}${timing}? What must be completed before that date? Thank you.`
    }
    case "risk":
      return `Hello, I'm reviewing ${doc}. I have a question about a risk identified in the document: ${item.title}. Can you help me understand what this means and whether I need to take any action before proceeding? Thank you.`
    default: {
      const source = item.whereToGetThis ? ` The document suggests I may be able to confirm this through: ${item.whereToGetThis}` : ""
      return `Hello, I'm reviewing ${doc}. Can you confirm ${item.title} and tell me what I need to provide or where to get the correct form/document?${source} Thank you.`
    }
  }
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45 mb-2">
      {children}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ItemDetailDrawerProps {
  item: CompletionObject
  documentTitle: string
  done: boolean
  onToggle: (id: string, done: boolean) => void
  onClose: () => void
}

export function ItemDetailDrawer({
  item,
  documentTitle,
  done,
  onToggle,
  onClose,
}: ItemDetailDrawerProps) {
  const [copied, setCopied] = useState(false)

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // Reset copied state when item changes
  useEffect(() => { setCopied(false) }, [item.id])

  const TypeIcon = typeIcon(item.type)
  const { color: iconColor, bg: iconBg } = typeIconColors(item.type)
  const displayPriority: CompletionPriority =
    item.type === "risk" ? (item.severity ?? item.priority) : item.priority
  const explanation =
    item.plainEnglishExplanation ||
    "PlainPath identified this as an item to review before submission."
  const whatToDo = item.whatToDo || whatToDoFallback(item.type)
  const copyMessage = generateCopyMessage(item, documentTitle)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/20 sm:bg-black/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <motion.div
        role="dialog"
        aria-label={`Item details: ${item.title}`}
        aria-modal="true"
        tabIndex={-1}
        className={[
          "fixed z-50 overflow-y-auto bg-background",
          // Mobile: bottom sheet
          "bottom-0 left-0 right-0 max-h-[88vh] rounded-t-3xl border-t border-border/50 shadow-2xl shadow-black/20",
          // Desktop: right-side drawer
          "sm:top-0 sm:left-auto sm:max-h-none sm:h-full sm:w-[430px]",
          "sm:rounded-none sm:rounded-l-3xl sm:border-l sm:border-t-0",
        ].join(" ")}
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 48 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ willChange: "transform" }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-border/40" />
        </div>

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-border/20 flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
            <TypeIcon className={`w-4 h-4 ${iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45 mb-0.5 leading-none">
              {typeLabel(item.type)}
            </p>
            <h2 className="text-[15px] font-bold text-foreground leading-snug">
              {item.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            style={{ touchAction: "manipulation" }}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 py-5 space-y-6">

          {/* Priority + Done toggle row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {displayPriority && displayPriority !== "low" && (
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg leading-none ${priorityBadgeClass(displayPriority)}`}
              >
                {displayPriority} priority
              </span>
            )}
            <button
              type="button"
              onClick={() => onToggle(item.id, !done)}
              aria-label={done ? `Mark "${item.title}" not done` : `Mark "${item.title}" complete`}
              style={{ touchAction: "manipulation" }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[32px] ${
                done
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {done ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border-2 border-current shrink-0" />
              )}
              {done ? "Done" : "Mark done"}
            </button>
          </div>

          {/* What this means */}
          <section>
            <SectionHeading>What this means</SectionHeading>
            <p className="text-sm text-foreground/85 leading-relaxed">{explanation}</p>
          </section>

          {/* What to do */}
          <section>
            <SectionHeading>What to do</SectionHeading>
            <p className="text-sm text-foreground/85 leading-relaxed">{whatToDo}</p>
          </section>

          {/* Where to get this */}
          <section>
            <SectionHeading>Where to get this</SectionHeading>
            {item.whereToGetThis ? (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/85 leading-relaxed">{item.whereToGetThis}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/55 leading-relaxed italic">
                PlainPath did not find a specific source for where to get this. Contact the issuing
                office, provider, school, employer, agency, or organization listed in the document.
              </p>
            )}
          </section>

          {/* Deadline / trigger */}
          {(item.dueDate || item.trigger) && (
            <section>
              <SectionHeading>Timing</SectionHeading>
              <div className="space-y-1">
                {item.dueDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    <p className="text-sm text-foreground/85">Due date: {item.dueDate}</p>
                  </div>
                )}
                {item.trigger && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    <p className="text-sm text-foreground/85">Trigger: {item.trigger}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Source evidence */}
          <section>
            <SectionHeading>Source</SectionHeading>
            {item.sourceQuote ? (
              <>
                <p className="text-[10px] font-semibold text-muted-foreground/45 mb-2">
                  Source found in your document
                </p>
                <blockquote className="pl-3 border-l-2 border-border/50 space-y-1">
                  <p className="text-xs text-muted-foreground/65 leading-relaxed italic">
                    &ldquo;{item.sourceQuote}&rdquo;
                  </p>
                  {(item.sourceSection || item.sourcePage != null) && (
                    <span className="inline-block text-[9px] font-medium text-muted-foreground/38">
                      {[
                        item.sourceSection,
                        item.sourcePage != null && `p.\u00a0${item.sourcePage}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </blockquote>
              </>
            ) : (
              <p className="text-xs text-muted-foreground/50 leading-relaxed italic">
                PlainPath did not find a direct quote for this item. Review the document manually
                before acting.
              </p>
            )}
          </section>

          {/* Copy request message */}
          <section className="rounded-2xl border border-border/40 bg-secondary/25 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/45 shrink-0" />
              <SectionHeading>Copy request message</SectionHeading>
            </div>
            <p className="text-xs text-foreground/65 leading-relaxed">{copyMessage}</p>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy request message to clipboard"
              style={{ touchAction: "manipulation" }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-[34px] ${
                copied
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                  : "bg-card border-border/50 text-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {copied ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 shrink-0" />
              )}
              {copied ? "Copied!" : "Copy message"}
            </button>
          </section>

          {/* Safe-area bottom padding */}
          <div className="h-6 sm:h-3" aria-hidden="true" />
        </div>
      </motion.div>
    </>
  )
}
