import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  "How do I analyze a document?",
  "What does the Trust Check verdict mean?",
  "How do I save an analysis?",
  "What's the difference between plans?",
]

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm the PlainPath Assistant. I can help you understand any feature in the app — just ask.",
        },
      ])
    }
  }, [open])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/help/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter((m) => m.role !== "assistant" || newMessages.indexOf(m) > 0),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Unable to get a response")
      }

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  const showSuggestions = messages.length <= 1 && !loading

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help" : "Open help assistant"}
        className={[
          "fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full shadow-lg",
          "flex items-center justify-center transition-all duration-200",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          open ? "scale-90 opacity-80" : "scale-100 opacity-100",
        ].join(" ")}
        style={{ width: 52, height: 52 }}
      >
        {open ? <ChevronDown className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={[
            "fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96",
            "rounded-2xl border border-border/60 bg-background shadow-2xl",
            "flex flex-col overflow-hidden",
          ].join(" ")}
          style={{ maxHeight: "min(520px, calc(100vh - 8rem))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-muted/30 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none">PlainPath Assistant</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Ask anything about the app</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={["flex gap-2", msg.role === "user" ? "justify-end" : "justify-start"].join(" ")}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={[
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                  ].join(" ")}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-xl text-center">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {showSuggestions && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => void sendMessage(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 bg-muted/50 text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 shrink-0">
            <div className="flex gap-2 items-end bg-muted/40 border border-border/50 rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed min-h-[1.5rem] max-h-24 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
              Not legal advice — for feature help only
            </p>
          </div>
        </div>
      )}
    </>
  )
}
