import { useState, useRef } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadCloud, ArrowRight, Loader2, AlertCircle,
  Sparkles, Target, Zap, CheckCircle2, FileText, Type, File
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAnalyzeDocument } from "@workspace/api-client-react"
import { useAnalysisContext } from "@/context/AnalysisContext"

const DEMOS = [
  {
    id: "event-permit",
    title: "Small Business Event Permit",
    meta: "Government · 8 steps · 3 deadlines",
    icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50",
  },
  {
    id: "school-enrollment",
    title: "School Enrollment Packet",
    meta: "Education · 9 steps · 2 deadlines",
    icon: Target, color: "text-emerald-500", bg: "bg-emerald-50",
  },
  {
    id: "grant-application",
    title: "Grant Application Checklist",
    meta: "Funding · 10 steps · 4 deadlines",
    icon: Zap, color: "text-amber-500", bg: "bg-amber-50",
  },
]

const FORMATS = [
  { ext: "PDF", icon: FileText, note: "Text-based" },
  { ext: "DOCX", icon: File, note: "Word files" },
  { ext: "TXT", icon: FileText, note: "Plain text" },
  { ext: "Paste", icon: Type, note: "Any format" },
]

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

const EXAMPLES = ["IRS notice", "Lease agreement", "Insurance EOB", "Permit application", "Court summons", "Grant instructions", "HOA violation", "Medicare letter"]

export default function Import() {
  const [, setLocation] = useLocation()
  const { setAnalysis } = useAnalysisContext()
  const [mode, setMode] = useState<"paste" | "upload">("paste")
  const [text, setText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mutate, isPending, error } = useAnalyzeDocument()

  const handlePasteAnalyze = () => {
    if (!text.trim()) return
    mutate({ data: { text } }, {
      onSuccess: (data) => { setAnalysis(data.analysis); setLocation("/analyze") },
    })
  }

  const handleFileUpload = async (file: File) => {
    if (file.size === 0) {
      setUploadError("This file appears to be empty. Please check the file and try again.")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File is too large. Maximum allowed size is 20 MB.")
      return
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    const allowedExts = [".pdf", ".docx", ".txt"]
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      setUploadError("Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file.")
      return
    }

    setUploadedFile(file); setUploadError(null); setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData })
      let data: any = {}
      try { data = await res.json() } catch { /* non-JSON response */ }

      if (!res.ok) {
        const msg = data?.message || (res.status === 413
          ? "File is too large. Maximum allowed size is 20 MB."
          : res.status === 422
          ? "Could not extract text from this file. If it's a scanned PDF, please copy and paste the text instead."
          : "Upload failed. Please try again.")
        setUploadError(msg); setIsUploading(false); return
      }
      if (!data?.analysis) {
        setUploadError("Analysis returned an unexpected result. Please try again."); setIsUploading(false); return
      }
      setAnalysis(data.analysis); setLocation("/analyze")
    } catch {
      setUploadError("Network error. Please check your connection and try again."); setIsUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFileUpload(f)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) handleFileUpload(f)
  }
  const isWorking = isPending || isUploading

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-28">
      <div className="absolute top-0 inset-x-0 h-52 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 pt-12 relative">

        {/* ── Header ─────────────────────────────────── */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold tracking-tight mb-2"
          >
            Import Your Document
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="text-muted-foreground"
          >
            PlainPath reads the content and returns a structured action plan — not a summary.
          </motion.p>
        </div>

        {/* ── Format chips ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2.5 mb-8"
        >
          {FORMATS.map((f) => (
            <div key={f.ext} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-border/50 shadow-sm">
              <f.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">{f.ext}</span>
              <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{f.note}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Main card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <Card className="overflow-hidden bg-white shadow-xl shadow-black/[0.07] rounded-2xl border-border/40">

            {/* Tab switcher */}
            <div className="p-2 border-b border-border/30 bg-[#FAFAF8]">
              <div className="grid grid-cols-2 rounded-xl bg-secondary/70 p-1 gap-1">
                {(["paste", "upload"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setMode(tab); setUploadError(null); setUploadedFile(null) }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === tab
                        ? "bg-white text-foreground shadow-sm shadow-black/[0.06]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "paste" ? <Type className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                    {tab === "paste" ? "Paste Text" : "Upload File"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-7">
              <AnimatePresence mode="wait">

                {/* ── PASTE mode ─────────────────────── */}
                {mode === "paste" && (
                  <motion.div
                    key="paste"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.14 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs text-muted-foreground/50 font-medium mr-0.5">e.g.</span>
                      {EXAMPLES.map(ex => (
                        <span key={ex} className="px-2.5 py-1 rounded-full bg-secondary/60 border border-border/40 text-[11px] font-medium text-muted-foreground">{ex}</span>
                      ))}
                    </div>

                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste the full text of your document here..."
                        className="w-full min-h-[220px] p-4 rounded-xl border-2 border-border/50 bg-[#FAFAF8] focus:border-primary focus:ring-4 focus:ring-primary/8 resize-none transition-all placeholder:text-muted-foreground/35 text-sm leading-relaxed font-mono outline-none"
                        disabled={isWorking}
                      />
                      {text.length > 0 && (
                        <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/40 font-mono select-none">
                          {text.length.toLocaleString()} / 60,000
                        </span>
                      )}
                    </div>

                    {error && (
                      <ErrorBanner message={(error as any)?.message || "An error occurred. Please try again."} />
                    )}

                    <Button
                      size="lg"
                      onClick={handlePasteAnalyze}
                      disabled={isWorking || text.trim().length < 50}
                      className="w-full h-12 text-base rounded-xl"
                    >
                      {isPending
                        ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Analyzing document…</>
                        : <>Generate Action Plan <ArrowRight className="ml-2 w-4 h-4" /></>
                      }
                    </Button>

                    <p className="text-[11px] text-center text-muted-foreground/50">
                      Minimum 50 characters · Your text is processed by AI for analysis and not stored by PlainPath
                    </p>
                  </motion.div>
                )}

                {/* ── UPLOAD mode ────────────────────── */}
                {mode === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.14 }}
                    className="space-y-4"
                  >
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className={`min-h-[220px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : uploadedFile && !uploadError
                          ? "border-emerald-400 bg-emerald-50/40"
                          : "border-border/50 hover:border-primary/40 hover:bg-secondary/20 bg-[#FAFAF8]"
                      }`}
                    >
                      <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onFileChange} disabled={isUploading} />

                      {isUploading ? (
                        <div className="text-center space-y-3 p-8">
                          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto">
                            <Loader2 className="w-7 h-7 text-primary animate-spin" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">Extracting & analyzing…</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[240px]">{uploadedFile?.name}</p>
                          </div>
                        </div>
                      ) : uploadedFile && !uploadError ? (
                        <div className="text-center space-y-3 p-8">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                          <div>
                            <p className="font-bold text-foreground text-sm">File received</p>
                            <p className="text-xs text-muted-foreground mt-1">{uploadedFile.name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 p-8 pointer-events-none">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-border shadow-md flex items-center justify-center mx-auto">
                            <UploadCloud className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground sm:hidden">Tap to choose a file</p>
                            <p className="font-bold text-foreground hidden sm:block">Drop file here or click to browse</p>
                            <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text (.txt)</p>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            {["PDF", "DOCX", "TXT"].map(fmt => (
                              <span key={fmt} className="px-3 py-1.5 rounded-lg bg-white border border-border text-xs font-bold text-muted-foreground shadow-sm">{fmt}</span>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground/50">Max 20 MB · Text-based PDFs only</p>
                        </div>
                      )}
                    </div>

                    {uploadError && <ErrorBanner message={uploadError} />}

                    <div className="rounded-xl bg-amber-50/60 border border-amber-200/50 p-3.5 flex gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800/80 leading-relaxed">
                        <span className="font-semibold">Scanned or image PDFs</span> cannot be read — the text must be selectable in your PDF viewer. Use Paste Text instead for scanned documents.
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* ── Demo shortcuts ─────────────────────────── */}
        <div className="mt-10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/50" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Or try a built-in demo</p>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMOS.map((demo, i) => (
              <motion.button
                key={demo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 + 0.2 }}
                whileHover={{ y: -3 }}
                onClick={() => setLocation(`/analyze?demo=${demo.id}`)}
                className="text-left group"
              >
                <Card className="p-4 h-full border-border/40 hover:border-primary/40 hover:shadow-lg transition-all bg-white rounded-xl shadow-sm">
                  <div className={`w-9 h-9 rounded-xl ${demo.bg} flex items-center justify-center mb-3`}>
                    <demo.icon className={`w-4 h-4 ${demo.color}`} />
                  </div>
                  <p className="font-bold text-sm leading-snug group-hover:text-primary transition-colors mb-1">{demo.title}</p>
                  <p className="text-[11px] text-muted-foreground">{demo.meta}</p>
                  <div className="flex items-center gap-1 mt-2.5 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open instantly <ArrowRight className="w-3 h-3" />
                  </div>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-destructive/8 border border-destructive/15 flex items-start gap-2.5 text-destructive">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
