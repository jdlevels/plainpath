import { useState, useRef, useEffect } from "react"
import { useAuth } from "@clerk/react"
import { useLocation } from "wouter"
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown, Zap } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
}

// ── Context-aware quick action chips per route ────────────────────────────────
const PAGE_ACTIONS: Record<string, { label: string; message: string }[]> = {
  "/": [
    { label: "What can PlainPath do?", message: "What can PlainPath do?" },
    { label: "How do I get started?", message: "How do I analyze my first document?" },
    { label: "Which plan fits me?", message: "What's the difference between the plans?" },
  ],
  "/import": [
    { label: "What file types work?", message: "What file formats does PlainPath support?" },
    { label: "How much text do I need?", message: "How long does my text need to be for a good analysis?" },
    { label: "What happens after I submit?", message: "What happens after I submit my document?" },
  ],
  "/analyze": [
    { label: "What file types work?", message: "What file formats does PlainPath support?" },
    { label: "How much text do I need?", message: "How long does my text need to be for a good analysis?" },
    { label: "What happens after I submit?", message: "What happens after I submit my document?" },
  ],
  "/results": [
    { label: "Next Steps", message: "What are the most important next steps from my analysis?" },
    { label: "Deadlines", message: "What deadlines should I be aware of from my document?" },
    { label: "Required Docs", message: "What documents do I need to gather?" },
    { label: "Risks", message: "What are the biggest risks in my document?" },
    { label: "Summarize", message: "Give me a plain-English summary of what this document means." },
  ],
  "/trust-check": [
    { label: "What does this verdict mean?", message: "What does the Trust Check verdict mean?" },
    { label: "Why is this risky?", message: "Why might a document be flagged as risky by Trust Check?" },
    { label: "What should I verify?", message: "What steps should I take to verify a suspicious document?" },
    { label: "Explain the scores", message: "What do the Authenticity Risk, Document Risk, and Verification Confidence scores mean?" },
  ],
  "/contract-builder": [
    { label: "What contracts can I make?", message: "What types of contracts can I create with the Contract Builder?" },
    { label: "What should I review?", message: "What should I look for before signing a contract?" },
    { label: "What does each step do?", message: "Can you walk me through the Contract Builder steps?" },
  ],
  "/my-analyses": [
    { label: "How do I search?", message: "How do I search through my saved analyses?" },
    { label: "How do I share one?", message: "How do I share an analysis with someone else?" },
    { label: "How long are they saved?", message: "How long are my analyses stored?" },
  ],
  "/subscribe": [
    { label: "Plan differences", message: "What's the difference between Free, Starter, and Pro?" },
    { label: "Can I cancel?", message: "Can I cancel my subscription at any time?" },
    { label: "What does Pro unlock?", message: "What extra features does the Pro plan unlock?" },
  ],
  "/support": [
    { label: "How do I get help?", message: "What's the fastest way to get support?" },
    { label: "Report a problem", message: "How do I report a bug or problem with PlainPath?" },
  ],
  "/compare-versions": [
    { label: "What do I upload?", message: "What should I upload to Compare Versions? What's the difference between the original and revised PDF?" },
    { label: "What do the colors mean?", message: "What do the red, amber, and grey severity colors mean in Compare Versions?" },
    { label: "How do I use manager notes?", message: "How do I use the Manager Notes and Watchlist in Compare Versions?" },
    { label: "How do I open a session?", message: "How do I reopen a previous comparison session?" },
  ],
  "/clause-extractor": [
    { label: "What does it extract?", message: "What does the Clause Extractor pull from a contract? What sections does it identify?" },
    { label: "What file types work?", message: "What file types does Clause Extractor support? Can I upload a Word document?" },
    { label: "How do I export results?", message: "How do I copy or export the Clause Extractor results? Is there a CSV export?" },
    { label: "How does it handle missing fields?", message: "What happens when the Clause Extractor can't find a field like a termination clause or expiration date?" },
  ],
  "/redact": [
    { label: "What gets detected?", message: "What types of personal information does the Redact tool automatically detect?" },
    { label: "What file types work?", message: "What file types can I upload to Redact Sensitive Info?" },
    { label: "How do I download the result?", message: "How do I download my redacted document after I'm done?" },
    { label: "Can I redact a PDF?", message: "Can I redact a PDF file and download a redacted PDF?" },
  ],
  "/build-contract": [
    { label: "What contracts can I build?", message: "What types of contracts can I create with Build a Contract?" },
    { label: "What does each step do?", message: "Can you walk me through each step of the contract builder?" },
    { label: "Can I save my progress?", message: "Is my progress saved as I go through the contract builder steps?" },
    { label: "What happens at the end?", message: "What do I get at the end of the contract builder? Can I download it?" },
  ],
}

const DEFAULT_ACTIONS = [
  { label: "How do I analyze a document?", message: "How do I analyze a document?" },
  { label: "What does Trust Check do?", message: "What does the Document Trust Check feature do?" },
  { label: "How do I save an analysis?", message: "How do I save an analysis?" },
  { label: "Plan differences", message: "What's the difference between the Free, Starter, and Pro plans?" },
]

const PAGE_CONTEXT_LABELS: Record<string, string> = {
  "/": "Home screen — the user is on the landing/home page",
  "/import": "Analyze a Document page — the user is preparing to upload or paste a document for analysis",
  "/analyze": "Analyze a Document page — the user is preparing to upload or paste a document for analysis",
  "/results": "Analysis results page — the user is viewing the results of a completed document analysis",
  "/trust-check": "Document Trust Check page — the user is analyzing a document for authenticity and scam indicators",
  "/contract-builder": "Contract Builder page — the user is creating a legal document from a guided template",
  "/my-analyses": "My Analyses page — the user is browsing their saved analysis history",
  "/subscribe": "Subscribe / Pricing page — the user is reviewing plan options",
  "/support": "Support page — the user is looking for help or contact information",
  "/compare-versions": "Compare Versions page — the user is uploading two PDF versions to compare changes, or reviewing a previous comparison session",
  "/clause-extractor": "Clause Extractor page — the user is uploading a PDF or DOCX contract to extract key dates, parties, financial terms, legal clauses, and obligations in a structured format",
  "/redact": "Redact Sensitive Info page — the user is reviewing and removing personally identifiable information from a document before sharing it",
  "/build-contract": "Build a Contract page — the user is creating a legal document using a multi-step guided wizard covering contract type, parties, scope, payment, and protections",
}

// ── Lightweight inline markdown renderer ────────────────────────────────────
type InlineSegment = { bold?: boolean; italic?: boolean; text: string }

function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) })
    if (m[0].startsWith("**")) segments.push({ bold: true, text: m[2] })
    else segments.push({ italic: true, text: m[3] })
    last = m.index + m[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}

function renderInline(text: string, key: string | number) {
  const segments = parseInline(text)
  return (
    <span key={key}>
      {segments.map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-semibold">{s.text}</strong>
        ) : s.italic ? (
          <em key={i}>{s.text}</em>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </span>
  )
}

function renderMarkdown(content: string) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === "") { i++; continue }

    // Bullet list block
    if (/^[\-\*•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[\-\*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\-\*•]\s+/, ""))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 pl-4 space-y-0.5 list-disc list-outside">
          {items.map((item, j) => (
            <li key={j} className="leading-relaxed">{renderInline(item, j)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list block
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-1.5 pl-4 space-y-0.5 list-decimal list-outside">
          {items.map((item, j) => (
            <li key={j} className="leading-relaxed">{renderInline(item, j)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Heading line (### …)
    if (/^#{1,3}\s/.test(line)) {
      const text = line.replace(/^#{1,3}\s+/, "")
      elements.push(
        <p key={`h-${i}`} className="font-semibold mt-2 mb-0.5 leading-snug">
          {renderInline(text, `h-${i}`)}
        </p>
      )
      i++
      continue
    }

    // Regular paragraph — collect consecutive non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^[\-\*•]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^#{1,3}\s/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed">
          {paraLines.map((l, j) => (
            <span key={j}>
              {renderInline(l, j)}
              {j < paraLines.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      )
    }
  }

  return <div className="text-sm space-y-1">{elements}</div>
}
// ─────────────────────────────────────────────────────────────────────────────

export function HelpWidget() {
  const { getToken } = useAuth()
  const [location] = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Derive the base path (strip query params and trailing slash)
  const basePath = location.split("?")[0].replace(/\/$/, "") || "/"

  const pageActions = PAGE_ACTIONS[basePath] ?? DEFAULT_ACTIONS
  const pageContextLabel = PAGE_CONTEXT_LABELS[basePath] ?? ""

  const showInitialChips = messages.length <= 1 && !loading
  const showQuickActions = messages.length > 1 && !loading && !input.trim()

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm the PlainPath Assistant — I can help you understand any feature. Ask a question or tap a quick action below.",
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
      const tok = await getToken().catch(() => null)
      const res = await fetch(`${getApiBaseUrl()}/api/help/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.filter((m) => m.role !== "assistant" || newMessages.indexOf(m) > 0),
          pageContext: pageContextLabel,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || "Unable to get a response")
      }

      const data = await res.json() as { reply: string }
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

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open PlainPath Assistant"}
        className={[
          "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
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
          style={{ maxHeight: "min(560px, calc(100vh - 8rem))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-muted/30 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none">PlainPath Assistant</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Feature help · not legal advice</p>
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
                    "max-w-[84%] rounded-2xl px-3 py-2",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm text-sm leading-relaxed"
                      : "bg-muted text-foreground rounded-bl-sm",
                  ].join(" ")}
                >
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
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

          {/* Initial quick action chips */}
          {showInitialChips && (
            <div className="px-4 pb-2 shrink-0">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide font-medium mb-1.5">
                Quick actions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pageActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => void sendMessage(action.message)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 bg-muted/50 text-foreground/70 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mid-conversation quick action chips */}
          {showQuickActions && (
            <div className="px-4 pt-2 pb-2 shrink-0 border-t border-border/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3 h-3 text-muted-foreground/40" />
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wide font-medium">
                  Quick actions
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pageActions.slice(0, 4).map((action) => (
                  <button
                    key={action.label}
                    onClick={() => void sendMessage(action.message)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border/40 bg-muted/30 text-foreground/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="px-3 pb-3 pt-1 shrink-0">
            <div className="flex gap-2 items-end bg-muted/40 border border-border/50 rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
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
            <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
              Not legal advice · Feature help only
            </p>
          </div>
        </div>
      )}
    </>
  )
}
