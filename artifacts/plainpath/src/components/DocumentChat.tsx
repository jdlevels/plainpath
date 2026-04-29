import { useState, useRef, useEffect } from "react"
import { Send, Bot, Loader2, MessageSquare, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { getApiBaseUrl } from "@/lib/api"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocumentAnalysis = any

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface SectionItem {
  id: string
  title?: string
  content: string
}

export interface SourceMatch {
  id: string
  title?: string
  snippet: string
}

interface QAPair {
  question: string
  answer: string | null
  sourceMatch?: SourceMatch | null
}

interface DocumentChatProps {
  analysis: DocumentAnalysis
  sections?: SectionItem[]
  onHighlightSection?: (match: SourceMatch | null) => void
  onMessageSent?: () => void
  onScrollToSource?: () => void
  fullHeight?: boolean
}

function findBestSection(reply: string, sections: SectionItem[]): SourceMatch | null {
  if (!sections.length) return null
  const replyWords = reply.toLowerCase().split(/\W+/).filter(w => w.length > 4)
  if (replyWords.length < 3) return null
  const replySet = new Set(replyWords)

  let bestId: string | null = null
  let bestScore = 0
  let bestContent = ""
  let bestTitle: string | undefined

  for (const section of sections) {
    const content = section.content?.trim()
    if (!content) continue
    const sectionWords = content.toLowerCase().split(/\W+/).filter(w => w.length > 4)
    if (sectionWords.length < 5) continue
    const matches = sectionWords.filter(w => replySet.has(w)).length
    if (matches < 2) continue
    const score = matches / Math.max(sectionWords.length, 1)
    if (score > bestScore && score > 0.03) {
      bestScore = score
      bestId = section.id
      bestContent = content
      bestTitle = section.title
    }
  }

  if (!bestId) return null

  const snippet =
    bestContent.replace(/\s+/g, " ").slice(0, 180).trimEnd() +
    (bestContent.length > 180 ? "…" : "")
  return { id: bestId, title: bestTitle, snippet }
}

// ─── Dot pagination ────────────────────────────────────────────────────────────
function DotPagination({
  total,
  active,
  onDotClick,
}: {
  total: number
  active: number
  onDotClick: (idx: number) => void
}) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onDotClick(i)}
          aria-label={`Answer ${i + 1}`}
          className={`rounded-full transition-all duration-200 ${
            i === active
              ? "w-4 h-2 bg-indigo-500"
              : "w-2 h-2 bg-border hover:bg-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  )
}

// ─── Answer card ───────────────────────────────────────────────────────────────
function AnswerCard({
  pair,
  isLoading,
  hasAnySections,
  onScrollToSource,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  pairIndex,
  totalPairs,
}: {
  pair: QAPair
  isLoading?: boolean
  hasAnySections: boolean
  onScrollToSource?: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev: boolean
  hasNext: boolean
  pairIndex: number
  totalPairs: number
}) {
  const { question, answer, sourceMatch } = pair
  const showSource = hasAnySections && !isLoading && answer !== null && sourceMatch !== undefined

  return (
    <div className="flex flex-col gap-3 px-4 py-4 h-full">
      {/* Question */}
      <div className="flex items-start gap-2.5">
        <span className="mt-[5px] w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
        <p className="text-[15px] font-semibold text-foreground leading-snug">{question}</p>
      </div>

      {/* Answer */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {isLoading ? (
          <div className="rounded-2xl bg-indigo-700/90 dark:bg-indigo-800 px-5 py-4 flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-indigo-200 animate-spin shrink-0" />
            <span className="text-sm text-indigo-200">Searching your document…</span>
          </div>
        ) : answer !== null ? (
          <div className="rounded-2xl bg-indigo-700/90 dark:bg-indigo-800 px-5 py-4">
            <p className="text-sm text-white leading-relaxed">{answer}</p>
          </div>
        ) : null}

        {/* Source citation row */}
        {showSource && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[12px] text-muted-foreground truncate">
                  {sourceMatch
                    ? `Source: ${sourceMatch.title ?? "Document text"}`
                    : "No exact source identified"}
                </span>
              </div>
              {sourceMatch && onScrollToSource && (
                <button
                  type="button"
                  onClick={onScrollToSource}
                  className="shrink-0 text-[11px] text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-full px-2.5 py-0.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors font-medium"
                >
                  From document text
                </button>
              )}
            </div>

            {/* Referenced passage */}
            {sourceMatch?.snippet && (
              <div className="rounded-xl bg-zinc-800 dark:bg-zinc-900 px-4 py-3 border border-zinc-700/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Referenced Passage
                </p>
                <p className="text-[12px] text-zinc-300 leading-relaxed italic">
                  &ldquo;{sourceMatch.snippet}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination row */}
      {totalPairs > 1 && (
        <div className="flex items-center justify-between pt-1 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <DotPagination
            total={totalPairs}
            active={pairIndex}
            onDotClick={idx => {
              if (idx < pairIndex && onPrev) onPrev()
              if (idx > pairIndex && onNext) onNext()
            }}
          />
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────
const EXAMPLE_QUESTIONS = [
  "What does this document require me to do?",
  "What deadlines are listed?",
  "Are there any risks I should know about?",
  "What are the payment terms?",
  "What sections should I review first?",
]

function EmptyState({
  suggestedQuestions,
  onSend,
}: {
  suggestedQuestions: string[]
  onSend: (q: string) => void
}) {
  const questions = suggestedQuestions.length > 0 ? suggestedQuestions : EXAMPLE_QUESTIONS
  return (
    <div className="px-4 py-5 space-y-4 flex-1 overflow-y-auto">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary/50" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Ask anything about this document</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xs mx-auto">
            Ask about risks, deadlines, obligations, payment terms, or anything confusing.
          </p>
        </div>
      </div>
      <div className="space-y-1">
        {questions.slice(0, 5).map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSend(q)}
            className="w-full text-left px-3 py-2 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors text-xs text-foreground/80 font-medium"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function DocumentChat({
  analysis,
  sections,
  onHighlightSection,
  onMessageSent,
  onScrollToSource,
  fullHeight,
}: DocumentChatProps) {
  const { getToken } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [activePairIdx, setActivePairIdx] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const analysisContext = {
    title: analysis.title,
    documentType: analysis.documentType,
    summary: analysis.summary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    risks: (analysis.risks ?? []).map((r: any) => ({ title: r.title, description: r.description, severity: r.severity })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deadlines: (analysis.deadlines ?? []).map((d: any) => ({ title: d.title, description: d.description, date: d.date, isHard: d.isHard })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyTerms: (analysis.keyTerms ?? []).map((k: any) => ({ term: k.term, definition: k.definition })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actionSteps: (analysis.actionSteps ?? []).map((a: any) => ({ title: a.title, description: a.description, priority: a.priority })),
    plainEnglish: analysis.plainEnglish
      ? {
          whatItIs: analysis.plainEnglish.whatItIs,
          obligations: analysis.plainEnglish.obligations,
          payAttentionTo: analysis.plainEnglish.payAttentionTo,
        }
      : undefined,
  }

  useEffect(() => {
    fetchInitialSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchInitialSuggestions() {
    try {
      const token = await getToken().catch(() => null)
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      const res = await fetch(`${getApiBaseUrl()}/api/documents/chat`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ analysisContext, message: "Hello", history: [] }),
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
          setSuggestedQuestions(data.suggestedQuestions)
        }
      }
    } catch {
      // silently ignore — suggestions are optional
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    onMessageSent?.()

    const newMessage: ChatMessage = { role: "user", content: trimmed }
    setMessages(prev => [...prev, newMessage])
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const token = await getToken().catch(() => null)
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      const res = await fetch(`${getApiBaseUrl()}/api/documents/chat`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          analysisContext,
          message: trimmed,
          history: messages.slice(-12),
        }),
      })

      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? ""
        const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : {}
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data as any).message ??
            "PlainPath could not answer that question. Please try again."
        )
      }

      const data = await res.json()
      const reply: string = data.reply ?? ""
      setMessages(prev => {
        const updated = [...prev, { role: "assistant" as const, content: reply }]
        // Jump to the new answer once appended
        const newPairs = buildPairs(updated, sections ?? [])
        setActivePairIdx(newPairs.length - 1)
        onHighlightSection?.(newPairs[newPairs.length - 1]?.sourceMatch ?? null)
        return updated
      })

      if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "PlainPath could not answer that question. Please try again."
      )
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  // Build Q&A pairs with source matches baked in
  function buildPairs(msgs: ChatMessage[], sects: SectionItem[]): QAPair[] {
    const pairs: QAPair[] = []
    let mi = 0
    while (mi < msgs.length) {
      if (msgs[mi].role === "user") {
        const question = msgs[mi].content
        if (mi + 1 < msgs.length && msgs[mi + 1].role === "assistant") {
          const answer = msgs[mi + 1].content
          const sourceMatch = findBestSection(answer, sects)
          pairs.push({ question, answer, sourceMatch })
          mi += 2
        } else {
          pairs.push({ question, answer: null, sourceMatch: undefined })
          mi += 1
        }
      } else {
        mi += 1
      }
    }
    return pairs
  }

  const qaPairs = buildPairs(messages, sections ?? [])
  const hasAnySections = (sections ?? []).length > 0
  const isEmpty = qaPairs.length === 0 && !loading

  // Clamp active index
  const clampedIdx = Math.min(activePairIdx, Math.max(0, qaPairs.length - 1))

  // When navigating to a pair, update highlight
  function goToPair(idx: number) {
    const clamped = Math.max(0, Math.min(idx, qaPairs.length - 1))
    setActivePairIdx(clamped)
    onHighlightSection?.(qaPairs[clamped]?.sourceMatch ?? null)
  }

  // The "in-progress" pair — last user question without an answer yet
  const inProgressPair: QAPair | null =
    loading && qaPairs.length === 0
      ? { question: messages[messages.length - 1]?.content ?? "…", answer: null }
      : null

  const activePair = inProgressPair ?? qaPairs[clampedIdx]

  return (
    <div
      className={[
        "flex flex-col bg-card overflow-hidden",
        fullHeight
          ? "h-full"
          : "min-h-[420px] max-h-[620px] rounded-2xl border border-border/50",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50 bg-muted/20 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Ask PlainPath</p>
          <p className="text-xs text-muted-foreground leading-tight">
            Questions about this document, answered in plain English
          </p>
        </div>
      </div>

      {/* Input — pinned near top */}
      <div className="px-4 py-2.5 border-b border-border/40 bg-background/60 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your document…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50"
            style={{ maxHeight: "96px" }}
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || loading}
            className="h-9 w-9 rounded-xl shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/35 mt-1 text-center">
          AI-generated · not legal advice
        </p>
      </div>

      {/* Main area — empty state or answer card */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {isEmpty ? (
          <EmptyState suggestedQuestions={suggestedQuestions} onSend={sendMessage} />
        ) : activePair ? (
          <AnswerCard
            pair={activePair}
            isLoading={loading && clampedIdx === qaPairs.length - 1 && activePair.answer === null}
            hasAnySections={hasAnySections}
            onScrollToSource={() => {
              onHighlightSection?.(activePair.sourceMatch ?? null)
              onScrollToSource?.()
            }}
            onPrev={() => goToPair(clampedIdx - 1)}
            onNext={() => goToPair(clampedIdx + 1)}
            hasPrev={clampedIdx > 0}
            hasNext={clampedIdx < qaPairs.length - 1}
            pairIndex={clampedIdx}
            totalPairs={qaPairs.length}
          />
        ) : null}

        {/* Follow-up chips — shown below answer card when on latest */}
        {!loading && qaPairs.length > 0 && clampedIdx === qaPairs.length - 1 && suggestedQuestions.length > 0 && (
          <div className="px-4 pb-3 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-1.5 pl-0.5">
              Follow-up questions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  className="px-2.5 py-1 rounded-full border border-border/60 bg-background hover:bg-muted/50 transition-colors text-[11px] text-muted-foreground font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mb-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 px-4 py-3 text-xs text-red-600 dark:text-red-400 shrink-0">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
