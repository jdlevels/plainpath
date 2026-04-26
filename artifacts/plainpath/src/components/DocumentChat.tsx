import { useState, useRef, useEffect } from "react"
import { Send, Bot, Loader2, MessageSquare } from "lucide-react"
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

// ─── Source banner (inline in Q&A card) ───────────────────────────────────────
function QASourceBanner({ match }: { match: SourceMatch | null }) {
  if (match === null) {
    return (
      <p className="text-[11px] text-muted-foreground/50 italic pl-1 pt-1">
        No exact source location identified for this answer.
      </p>
    )
  }
  return (
    <div className="flex items-start gap-2 pt-1">
      <div className="w-0.5 self-stretch rounded-full bg-indigo-400/60 shrink-0" />
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Source
        </p>
        {match.title && (
          <p className="text-[11px] font-medium text-foreground/80">{match.title}</p>
        )}
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
          "{match.snippet}"
        </p>
      </div>
    </div>
  )
}

// ─── Individual Q&A card ───────────────────────────────────────────────────────
function QACard({
  question,
  answer,
  isLoading,
  sourceMatch,
}: {
  question: string
  answer: string | null
  isLoading?: boolean
  sourceMatch?: SourceMatch | null
}) {
  return (
    <div className="space-y-2">
      {/* Question row */}
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 rounded bg-primary/15 flex items-center justify-center shrink-0 mt-[3px]">
          <span className="text-[9px] font-bold text-primary leading-none">Q</span>
        </div>
        <p className="text-sm font-semibold text-foreground flex-1 leading-relaxed">
          {question}
        </p>
      </div>

      {/* Answer card or loading */}
      <div className="ml-7">
        {isLoading ? (
          <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
            <span className="text-xs text-muted-foreground">Thinking…</span>
          </div>
        ) : answer !== null ? (
          <div className="space-y-2.5">
            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3.5">
              <p className="text-sm text-foreground leading-relaxed">{answer}</p>
            </div>
            {/* Source banner — shown only when sourceMatch is not undefined */}
            {sourceMatch !== undefined && (
              <div className="px-1">
                <QASourceBanner match={sourceMatch} />
              </div>
            )}
          </div>
        ) : null}
      </div>
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
    <div className="px-4 py-6 space-y-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
          <Bot className="w-6 h-6 text-primary/50" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Ask anything about this document</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
            Ask about risks, deadlines, obligations, payment terms, or anything confusing.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {questions.slice(0, 5).map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSend(q)}
            className="w-full text-left px-3.5 py-2.5 rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-colors text-xs text-foreground/80 font-medium"
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
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Ask PlainPath</p>
          <p className="text-xs text-muted-foreground">
            Questions about this document, answered in plain English
          </p>
        </div>
      </div>

      {/* Input — pinned near top */}
      <div className="px-4 py-3 border-b border-border/40 bg-background/60 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your document…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50"
            style={{ maxHeight: "96px" }}
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || loading}
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center">
          AI-generated from your document analysis. Not legal advice.
        </p>
      </div>

      {/* Scrollable Q&A area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isEmpty ? (
          <EmptyState suggestedQuestions={suggestedQuestions} onSend={sendMessage} />
        ) : (
          <div className="px-4 py-5 space-y-6">
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
                />
              )
            })}

            {/* Follow-up chips */}
            {!loading && hasAnswers && suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
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
