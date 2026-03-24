import { useState, useRef } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadCloud, ArrowRight, Loader2, AlertCircle,
  Sparkles, Target, Zap, CheckCircle2, FileText, Type
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAnalyzeDocument } from "@workspace/api-client-react"
import { useAnalysisContext } from "@/context/AnalysisContext"

const DEMOS = [
  {
    id: "event-permit",
    title: "Small Business Event Permit",
    desc: "Government packet · 8 steps · 3 deadlines",
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: "school-enrollment",
    title: "School Enrollment Packet",
    desc: "Enrollment form · 9 steps · 2 deadlines",
    icon: Target,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    id: "grant-application",
    title: "Grant Application Checklist",
    desc: "Funding guide · 10 steps · 4 deadlines",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
]

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

const EXAMPLES = [
  "IRS notice", "Lease agreement", "Insurance EOB", "Permit application", "Court summons", "Grant instructions",
]

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
    mutate(
      { data: { text } },
      {
        onSuccess: (data) => {
          setAnalysis(data.analysis)
          setLocation("/analyze")
        },
      }
    )
  }

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setUploadError(null)
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.message || "Upload failed. Please try again.")
        setIsUploading(false)
        return
      }
      setAnalysis(data.analysis)
      setLocation("/analyze")
    } catch {
      setUploadError("Network error. Please check your connection and try again.")
      setIsUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileUpload(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFileUpload(f)
  }

  const isWorking = isPending || isUploading

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-28">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 pt-14 space-y-10 relative">

        {/* Header */}
        <div className="text-center space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold tracking-tight"
          >
            Import Your Document
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="text-muted-foreground"
          >
            Upload a file or paste text — your structured action plan is generated from the content.
          </motion.p>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="overflow-hidden bg-white shadow-xl shadow-black/[0.06] rounded-2xl border-border/50">

            {/* Tab switcher */}
            <div className="p-2 bg-secondary/40 border-b border-border/40">
              <div className="flex rounded-xl bg-secondary/60 p-1 gap-1">
                {(["paste", "upload"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setMode(tab); setUploadError(null); setUploadedFile(null) }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === tab
                        ? "bg-white text-foreground shadow-sm shadow-black/5"
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
                {mode === "paste" ? (
                  <motion.div
                    key="paste"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    {/* Example pills */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-semibold text-muted-foreground mr-1 self-center">e.g.</span>
                      {EXAMPLES.map((ex) => (
                        <span key={ex} className="px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground border border-border/50">{ex}</span>
                      ))}
                    </div>

                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste the full text of your document here..."
                        className="w-full min-h-[240px] p-4 rounded-xl border-2 border-border bg-[#FAFAF8] focus:border-primary focus:ring-4 focus:ring-primary/8 resize-none transition-all placeholder:text-muted-foreground/40 text-sm leading-relaxed font-mono outline-none"
                        disabled={isWorking}
                      />
                      {text.length > 0 && (
                        <span className="absolute bottom-3 right-3 text-[11px] text-muted-foreground/50 font-mono">
                          {text.length.toLocaleString()} chars
                        </span>
                      )}
                    </div>

                    {error && (
                      <div className="p-4 rounded-xl bg-destructive/8 text-destructive border border-destructive/15 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-sm">{(error as any)?.message || "An error occurred. Please try again."}</p>
                      </div>
                    )}

                    <Button
                      size="lg"
                      onClick={handlePasteAnalyze}
                      disabled={isWorking || text.trim().length < 50}
                      className="w-full h-12 text-base rounded-xl shadow-sm shadow-primary/20"
                    >
                      {isPending ? (
                        <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Analyzing document…</>
                      ) : (
                        <>Generate Action Plan <ArrowRight className="ml-2 w-4 h-4" /></>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground/60">Minimum 50 characters · Max 60,000 characters</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className={`min-h-[240px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : uploadedFile && !uploadError
                          ? "border-emerald-400 bg-emerald-50/50"
                          : "border-border hover:border-primary/40 hover:bg-secondary/30 bg-[#FAFAF8]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED}
                        className="hidden"
                        onChange={onFileChange}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <div className="text-center space-y-4 p-8">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">Extracting & analyzing…</p>
                            <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">{uploadedFile?.name}</p>
                          </div>
                        </div>
                      ) : uploadedFile && !uploadError ? (
                        <div className="text-center space-y-3 p-8">
                          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                          <p className="font-bold text-foreground">File received</p>
                          <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-5 p-8 pointer-events-none">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-md shadow-black/5">
                            <UploadCloud className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground">Drop file here or click to browse</p>
                            <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text (.txt)</p>
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            {["PDF", "DOCX", "TXT"].map((fmt) => (
                              <span key={fmt} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs font-bold text-muted-foreground shadow-sm">
                                <FileText className="w-3 h-3" /> {fmt}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground/60">Max 20 MB</p>
                        </div>
                      )}
                    </div>

                    {uploadError && (
                      <div className="p-4 rounded-xl bg-destructive/8 text-destructive border border-destructive/15 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-bold mb-0.5">Upload failed</p>
                          <p>{uploadError}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-center text-muted-foreground/60">
                      Text-based PDFs only · Scanned / image PDFs cannot be read — use Paste Text instead
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Demo shortcuts */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Or try a demo</p>
            <div className="flex-1 h-px bg-border/60" />
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
                <Card className="p-4 h-full border-border/50 hover:border-primary/40 hover:shadow-lg transition-all bg-white rounded-xl shadow-sm">
                  <div className={`w-9 h-9 rounded-xl ${demo.bg} flex items-center justify-center mb-3`}>
                    <demo.icon className={`w-4 h-4 ${demo.color}`} />
                  </div>
                  <p className="font-bold text-sm mb-1 group-hover:text-primary transition-colors leading-snug">{demo.title}</p>
                  <p className="text-xs text-muted-foreground">{demo.desc}</p>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
