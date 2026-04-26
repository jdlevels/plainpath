import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle, UploadCloud, Type, Loader2,
  ArrowLeft, X, AlertCircle, ChevronRight,
} from "lucide-react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { WorkspaceShell } from "@/components/WorkspaceShell"
import { DocumentChat } from "@/components/DocumentChat"
import { getApiBaseUrl } from "@/lib/api"
import type { DocumentAnalysis } from "@workspace/api-client-react"

const EXAMPLE_QUESTIONS = [
  "What does this document require me to do?",
  "What deadlines are listed?",
  "What sections should I review first?",
  "Are there payment terms?",
  "What looks unclear?",
]

type Phase = "upload" | "paste" | "processing" | "ready"

export default function AskDocument() {
  const [, setLocation] = useLocation()
  const [phase, setPhase] = useState<Phase>("upload")
  const [fileName, setFileName] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function safeParseJson(res: Response): Promise<Record<string, unknown>> {
    const ct = res.headers.get("content-type") ?? ""
    if (!ct.includes("application/json")) {
      throw new Error("Could not process this document. Please try again.")
    }
    return res.json() as Promise<Record<string, unknown>>
  }

  async function analyzeFile(file: File) {
    setFileName(file.name)
    setError(null)
    setPhase("processing")
    try {
      const apiBase = getApiBaseUrl()
      const form = new FormData()
      form.append("file", file)
      form.append("documentTypeHint", "")
      const res = await fetch(`${apiBase}/api/documents/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      })
      const data = await safeParseJson(res)
      if (!res.ok) throw new Error((data?.message as string) ?? "Could not read this document. Please try again.")
      setAnalysis(data.analysis as DocumentAnalysis)
      setPhase("ready")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setPhase("upload")
    }
  }

  async function analyzeText() {
    const trimmed = text.trim()
    if (trimmed.length < 20) {
      setError("Please paste at least a few sentences of document text.")
      return
    }
    setFileName("Pasted text")
    setError(null)
    setPhase("processing")
    try {
      const apiBase = getApiBaseUrl()
      const res = await fetch(`${apiBase}/api/documents/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, documentTypeHint: "" }),
        credentials: "include",
      })
      const data = await safeParseJson(res)
      if (!res.ok) throw new Error((data?.message as string) ?? "Could not analyze this text. Please try again.")
      setAnalysis(data.analysis as DocumentAnalysis)
      setPhase("ready")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setPhase("paste")
    }
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void analyzeFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void analyzeFile(file)
    e.target.value = ""
  }

  function reset() {
    setPhase("upload")
    setFileName(null)
    setText("")
    setAnalysis(null)
    setError(null)
  }

  return (
    <WorkspaceShell>
      <div className="min-h-screen flex flex-col">

        {/* ── Header ─────────────────────────────────── */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground leading-none">Ask This Document</h1>
            {fileName && phase === "ready" && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{fileName}</p>
            )}
          </div>
          {phase === "ready" && (
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
            >
              <X className="w-3 h-3" />
              Start over
            </button>
          )}
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">

            {/* Upload / Paste phase */}
            {(phase === "upload" || phase === "paste") && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-lg mx-auto px-4 py-10 space-y-7"
              >
                {/* Icon + title */}
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Ask This Document</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Upload a document and ask plain-English questions about clauses,
                      obligations, deadlines, risks, and confusing language.
                    </p>
                  </div>
                </div>

                {/* Example questions */}
                <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-950/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
                    What you can ask
                  </p>
                  <ul className="space-y-2">
                    {EXAMPLE_QUESTIONS.map((q) => (
                      <li key={q} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground/80">"{q}"</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Upload drop-zone */}
                {phase === "upload" && (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-150 ${
                        isDragging
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.01]"
                          : "border-border hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-muted/40"
                      }`}
                    >
                      <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">Drop your document here</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF or Word (.docx) · or click to browse</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <button
                      onClick={() => { setPhase("paste"); setError(null) }}
                      className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      <Type className="w-4 h-4" />
                      Paste text instead
                    </button>
                  </div>
                )}

                {/* Paste text */}
                {phase === "paste" && (
                  <div className="space-y-3">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your document text here…"
                      autoFocus
                      className="w-full h-48 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/60 transition-all"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => { setPhase("upload"); setError(null) }}
                        className="flex-1 rounded-xl"
                      >
                        Upload a file
                      </Button>
                      <Button
                        onClick={() => void analyzeText()}
                        disabled={text.trim().length < 20}
                        className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Start Asking
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Processing phase */}
            {phase === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Reading your document…</p>
                  {fileName && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">{fileName}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">This usually takes 10–30 seconds</p>
                </div>
              </motion.div>
            )}

            {/* Ready — show DocumentChat */}
            {phase === "ready" && analysis && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <DocumentChat analysis={analysis} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </WorkspaceShell>
  )
}
