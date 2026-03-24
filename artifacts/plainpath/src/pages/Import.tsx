import { useState } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { UploadCloud, FileText, ArrowRight, Loader2, AlertCircle, Sparkles, Target, Zap } from "lucide-react"
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
    title: "Small Business Grant",
    desc: "Dense legalese requiring a dozen attachments.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
]

export default function Import() {
  const [, setLocation] = useLocation();
  const { setAnalysis } = useAnalysisContext();
  const [mode, setMode] = useState<"upload" | "paste">("paste");
  const [text, setText] = useState("");
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);

  const { mutate, isPending, error } = useAnalyzeDocument();

  const handleAnalyze = (contentToAnalyze: string) => {
    if (!contentToAnalyze.trim()) return;
    
    mutate({ data: { text: contentToAnalyze } }, {
      onSuccess: (data) => {
        setAnalysis(data.analysis);
        setLocation("/analyze");
      }
    });
  };

  const handleSimulatedDrop = (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsSimulatingUpload(true);
    setTimeout(() => {
      setIsSimulatingUpload(false);
      setMode("paste");
      setText("SAMPLE EXTRACTED TEXT\n\nThis is simulated extracted text from your PDF. In a production build, the backend would parse the actual PDF contents using a library like pdf-parse.\n\nFor this demo, paste your document text directly in the Paste Text tab to analyze it with AI.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-secondary/30 pt-10 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold">Import Document</h1>
          <p className="text-muted-foreground">Upload a file or paste text to generate your action plan.</p>
        </div>

        <Card className="overflow-hidden bg-white shadow-xl shadow-black/5">
          <div className="flex border-b border-border">
            <button
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'paste' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-secondary'}`}
              onClick={() => setMode('paste')}
            >
              Paste Text
            </button>
            <button
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'upload' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-secondary'}`}
              onClick={() => setMode('upload')}
            >
              Upload PDF
            </button>
          </div>

          <div className="p-6 md:p-8 min-h-[400px] flex flex-col">
            <AnimatePresence mode="wait">
              {mode === 'paste' ? (
                <motion.div 
                  key="paste"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col space-y-4"
                >
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the contents of your confusing document here..."
                    className="flex-1 w-full min-h-[300px] p-4 rounded-xl border-2 border-border bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all placeholder:text-muted-foreground/50 text-base"
                  />
                  
                  {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold">Analysis Failed</p>
                        <p>{(error as any)?.message || "An unexpected error occurred. Please try again."}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button 
                      size="lg" 
                      onClick={() => handleAnalyze(text)}
                      disabled={isPending || text.trim().length < 10}
                      className="w-full sm:w-auto"
                    >
                      {isPending ? (
                        <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Analyzing...</>
                      ) : (
                        <>Generate Action Plan <ArrowRight className="ml-2 w-5 h-5" /></>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col items-center justify-center border-3 border-dashed border-border rounded-2xl bg-secondary/30 relative hover:bg-secondary/50 transition-colors group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleSimulatedDrop}
                >
                  <input 
                    type="file" 
                    accept=".pdf,.txt,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleSimulatedDrop}
                    disabled={isSimulatingUpload}
                  />
                  
                  {isSimulatingUpload ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                      <p className="text-lg font-medium text-foreground">Extracting text...</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 pointer-events-none">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold mb-1">Click to upload or drag & drop</p>
                        <p className="text-sm text-muted-foreground">PDF, TXT, or DOCX (max. 10MB)</p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white px-3 py-1.5 rounded-full border border-border mt-4">
                        <FileText className="w-3.5 h-3.5" /> Text extraction demo
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Demo Documents */}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                onClick={() => setLocation(`/analyze?demo=${demo.id}`)}
                className="text-left group"
              >
                <Card className="p-4 h-full border-border/60 hover:border-primary/40 hover:shadow-md transition-all bg-white">
                  <div className={`w-10 h-10 rounded-xl ${demo.bg} flex items-center justify-center mb-3`}>
                    <demo.icon className={`w-5 h-5 ${demo.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{demo.title}</h3>
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
