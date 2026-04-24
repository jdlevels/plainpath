import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, MessageSquare, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiBaseUrl } from "@/lib/api"
import type { DocumentAnalysis } from "@workspace/api-client-react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface DocumentChatProps {
  analysis: DocumentAnalysis
}

export function DocumentChat({ analysis }: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const analysisContext = {
    title: analysis.title,
    documentType: analysis.documentType,
    summary: analysis.summary,
    risks: (analysis.risks ?? []).map(r => ({ title: r.title, description: r.description, severity: r.severity })),
    deadlines: (analysis.deadlines ?? []).map(d => ({ title: d.title, description: d.description, date: d.date, isHard: d.isHard })),
    keyTerms: (analysis.keyTerms ?? []).map(k => ({ term: k.term, definition: k.definition })),
    actionSteps: (analysis.actionSteps ?? []).map(a => ({ title: a.title, description: a.description, priority: a.priority })),
    plainEnglish: analysis.plainEnglish
      ? { whatItIs: analysis.plainEnglish.whatItIs, obligations: analysis.plainEnglish.obligations, payAttentionTo: analysis.plainEnglish.payAttentionTo }
      : undefined,
  }

  useEffect(() => {
    fetchInitialSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchInitialSuggestions() {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/documents/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    const newMessage: ChatMessage = { role: "user", content: trimmed }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/documents/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          analysisContext,
          message: trimmed,
          history: messages.slice(-12),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as any).message ?? "Something went wrong. Please try again.")
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
      if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a response. Please try again.")
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

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col min-h-[420px] max-h-[620px] rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Ask PlainPath</p>
          <p className="text-xs text-muted-foreground">Questions about your document, answered in plain English</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
              <Bot className="w-7 h-7 text-primary/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground mb-1">Ask anything about this document</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                I've read the full analysis. Ask about risks, deadlines, your rights, what to do next — anything.
              </p>
            </div>
            {suggestedQuestions.length > 0 && (
              <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => void sendMessage(q)}
                    className="text-left px-3.5 py-2.5 rounded-xl border border-border/60 bg-background hover:bg-muted/50 transition-colors text-xs text-foreground/80 font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            }`}>
              {msg.role === "user"
                ? <User className="w-3.5 h-3.5" />
                : <Bot className="w-3.5 h-3.5" />
              }
            </div>
            <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted/60 text-foreground rounded-tl-sm border border-border/40"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/40 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Follow-up chips after first reply */}
      {!isEmpty && !loading && suggestedQuestions.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => void sendMessage(q)}
              className="px-2.5 py-1 rounded-full border border-border/60 bg-background hover:bg-muted/50 transition-colors text-[11px] text-muted-foreground font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border/50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your document…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50"
            style={{ maxHeight: "112px" }}
          />
          <Button
            size="icon"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || loading}
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
          Responses are AI-generated based on your document analysis. Not legal advice.
        </p>
      </div>
    </div>
  )
}
