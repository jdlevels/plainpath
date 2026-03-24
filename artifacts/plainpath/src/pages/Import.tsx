import { useState, useRef } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { UploadCloud, FileText, ArrowRight, Loader2, AlertCircle, Sparkles, Target, Zap, CheckCircle2, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAnalyzeDocument } from "@workspace/api-client-react"
import { useAnalysisContext } from "@/context/AnalysisContext"

const DEMOS = [
  {
    id: "event-permit",
    title: "Small Business Event Permit",
    desc: "A messy local government packet with vague requirements.",
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: "school-enrollment",
    title: "School Enrollment Packet",
    desc: "Multi-page enrollment form with hidden deadlines.",
    icon: Target,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    id: "grant-application",
    title: "Grant Application Checklist",
    desc: "Dense legalese requiring a dozen attachments.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
]

const ACCEPTED_TYPES = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

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
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })
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

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const isWorking = isPending || isUploading

  return (
    <div className="min-h-screen bg-[#F8F7F4] pt-10 pb-24 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold">Import Document</h1>
          <p className="text-muted-foreground">Upload a file or paste text to generate your structured action plan.</p>
        </div>

        <Card className="overflow-hidden bg-white shadow-xl shadow-black/5">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["paste", "upload"] as const).map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  mode === tab
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => { setMode(tab); setUploadError(null); setUploadedFile(null) }}
              >
                {tab === "paste" ? "Paste Text" : "Upload File"}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 min-h-[380px] flex flex-col">
            <AnimatePresence mode="wait">
              {mode === "paste" ? (
                <motion.div
                  key="paste"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col space-y-4"
                >
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the contents of your document here — permit applications, enrollment forms, grant instructions, legal agreements..."
                    className="flex-1 w-full min-h-[280px] p-4 rounded-xl border-2 border-border bg-secondary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all placeholder:text-muted-foreground/50 text-base leading-relaxed"
                    disabled={isWorking}
                  />

                  {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold">Analysis failed</p>
                        <p>{(error as any)?.message || "An unexpected error occurred. Please try again."}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">{text.length > 0 ? `${text.length.toLocaleString()} characters` : "Minimum 50 characters"}</p>
                    <Button
                      size="lg"
                      onClick={handlePasteAnalyze}
                      disabled={isWorking || text.trim().length < 50}
                    >
                      {isPending ? (
                        <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Analyzing…</>
                      ) : (
                        <>Analyze Document <ArrowRight className="ml-2 w-4 h-4" /></>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col space-y-4"
                >
                  {/* Drop zone */}
                  <div
                    className={`flex-1 flex flex-col items-center justify-center min-h-[260px] border-2 border-dashed rounded-2xl transition-all cursor-pointer relative ${
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : uploadedFile
                        ? "border-green-400 bg-green-50"
                        : "border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
                    }`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES}
                      className="hidden"
                      onChange={onFileInputChange}
                      disabled={isUploading}
                    />

                    {isUploading ? (
                      <div className="text-center space-y-3">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                        <div>
                          <p className="font-semibold text-foreground">Extracting & analyzing…</p>
                          <p className="text-sm text-muted-foreground mt-1">{uploadedFile?.name}</p>
                        </div>
                      </div>
                    ) : uploadedFile && !uploadError ? (
                      <div className="text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                        <div>
                          <p className="font-semibold text-foreground">File ready</p>
                          <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4 pointer-events-none px-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                          <UploadCloud className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">Click to upload or drag & drop</p>
                          <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text (.txt)</p>
                        </div>
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><File className="w-3 h-3" /> PDF</span>
                          <span className="flex items-center gap-1"><File className="w-3 h-3" /> DOCX</span>
                          <span className="flex items-center gap-1"><File className="w-3 h-3" /> TXT</span>
                          <span>· Max 20MB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold">Upload failed</p>
                        <p>{uploadError}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    Text-based PDFs only. Scanned / image PDFs cannot be read — use Paste Text instead.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Demos */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="text-sm font-medium text-muted-foreground px-2">Or try a built-in demo</p>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DEMOS.map((demo, i) => (
              <motion.button
                key={demo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3 }}
                onClick={() => setLocation(`/analyze?demo=${demo.id}`)}
                className="text-left group"
              >
                <Card className="p-4 h-full border-border/60 hover:border-primary/40 hover:shadow-md transition-all bg-white">
                  <div className={`w-10 h-10 rounded-xl ${demo.bg} flex items-center justify-center mb-3`}>
                    <demo.icon className={`w-5 h-5 ${demo.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors leading-snug">{demo.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{demo.desc}</p>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
