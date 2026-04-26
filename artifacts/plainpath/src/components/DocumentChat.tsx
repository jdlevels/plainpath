import { useState, useRef, useEffect } from "react"
import { Send, Bot, Loader2, MessageSquare, ArrowUpRight } from "lucide-react"
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
    bestContent.replace(/\s+/g, " ").slice(0, 140).trimEnd() +
    (bestContent.length > 140 ? "…" : "")
  return { id: bestId, title: bestTitle, snippet }
}

// ─── Source card ──────────────────────────────────────────────────────────────
function QASourceBanner({
  match,
  onScrollTo,
}: {
  match: SourceMatch | null
  onScrollTo?: () => void
}) {
  if (match === null) {
    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-0.5">
          Source
        </p>
        <p className="text-[11px] text-muted-foreground/50 italic">
          No exact source location identified for this answer.
        </p>
      </div>
    )
  }

  const inner = (
    <div className="flex items-start gap-2">
      <div className="w-0.5 self-stretch rounded-full bg-indigo-400/60 shrink-0 mt-0.5" />
      <div className="space-y-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Source
          </p>
          {onScrollTo && (
            <ArrowUpRight className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
          )}
        </div>
        {match.title && (
          <p className="text-[11px] font-medium text-foreground/80">{match.title}</p>
        )}
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
          "{match.snippet}"
        </p>
      </div>
    </div>
  )

  if (onScrollTo) {
    return (
      <button
        type="button"
        onClick={onScrollTo}
        className="w-full text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 transition-colors"
        title="Click to jump to this section in the document"
      >
        {inner}
      </button>
    )
  }

  return <div className="px-0">{inner}</div>
}

// ─── Individual Q&A card ───────────────────────────────────────────────────────
function QACard({
  question,
  answer,
  isLoading,
  sourceMatch,
  onScrollToSource,
}: {
  question: string
  answer: string | null
  isLoading?: boolean
  sourceMatch?: SourceMatch | null
  onScrollToSource?: () => void
}) {
  return (
    <div className="space-y-2">
      {/* Question */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1 pl-0.5">
          Question
        </p>
        <div className="rounded-xl border border-border/40 bg-background px-3.5 py-2.5">
          <p className="text-sm font-medium text-foreground leading-relaxed">{question}</p>
        </div>
      </div>

      {/* Answer */}
      {(isLoading || answer !== null) && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1 pl-0.5">
            PlainPath Answer
          </p>
          {isLoading ? (
            <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3.5">
              <p className="text-sm text-foreground leading-relaxed">{answer}</p>
            </div>
          )}
        </div>
      )}

      {/* Source */}
      {sourceMatch !== undefined && !isLoading && answer !== null && (
        <div className="pl-0.5 pt-0.5">
          <QASourceBanner match={sourceMatch} onScrollTo={sourceMatch ? onScrollToSource : undefined} />
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
    <div className="px-4 py-5 space-y-4">
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
  const [lastSourceMatch, setLastSourceMatch] = useState<SourceMatch | null | undefined>(undefined)
  const bottomRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    onMessageSent?.()
    setLastSourceMatch(undefined)

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
        if (res.status === 401)
          throw new Error("PlainPath could not answer that question. Please try again or paste the document text manually.")
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data as any).message ??
            "PlainPath could not answer that question. Please try again or paste the document text manually."
        )
      }

      const data = await res.json()
      const reply: string = data.reply ?? ""
      setMessages(prev => [...prev, { role: "assistant", content: reply }])

      if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions)
      }

      const match = findBestSection(reply, sections ?? [])
      setLastSourceMatch(match)
      onHighlightSection?.(match)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "PlainPath could not answer that question. Please try again or paste the document text manually."
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

  // Group flat message array into Q&A pairs
  const qaPairs: QAPair[] = []
  let mi = 0
  while (mi < messages.length) {
    if (messages[mi].role === "user") {
      const question = messages[mi].content
      if (mi + 1 < messages.length && messages[mi + 1].role === "assistant") {
        qaPairs.push({ question, answer: messages[mi + 1].content })
        mi += 2
      } else {
        qaPairs.push({ question, answer: null })
        mi += 1
      }
    } else {
      mi += 1
    }
  }

  const hasAnySections = (sections ?? []).length > 0
  const isEmpty = qaPairs.length === 0 && !loading
  const hasAnswers = qaPairs.some(p => p.answer !== null)

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

      {/* Scrollable Q&A area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isEmpty ? (
          <EmptyState suggestedQuestions={suggestedQuestions} onSend={sendMessage} />
        ) : (
          <div className="px-4 py-4 space-y-5">
            {qaPairs.map((pair, idx) => {
              const isLatest = idx === qaPairs.length - 1
              const isLoading = loading && pair.answer === null && isLatest
              const showSource = isLatest && !isLoading && pair.answer !== null && hasAnySections
              return (
                <QACard
                  key={idx}
                  question={pair.question}
                  answer={pair.answer}
                  isLoading={isLoading}
                  sourceMatch={showSource ? lastSourceMatch : undefined}
                  onScrollToSource={onScrollToSource}
                />
              )
            })}

            {/* Follow-up chips — below source, not between Q&A */}
            {!loading && hasAnswers && suggestedQuestions.length > 0 && (
              <div>
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
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 px-4 py-3 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
