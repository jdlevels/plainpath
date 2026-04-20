import { useState, useEffect, useRef, useCallback } from "react"
import { useUser } from "@clerk/react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileSignature, Plus, ArrowLeft, Upload, FileText, X,
  Send, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Download, Clock, Eye, ChevronRight, Pen, Mail,
  ClipboardCopy, Lock, Shield, Zap, MousePointer,
} from "lucide-react"
import PrepareAndPlace from "./PrepareAndPlace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useEntitlements } from "@/hooks/useEntitlements"
import { consumeToolUsage } from "@/lib/entitlements"
import {
  listSignatureRequests,
  getSignatureRequest,
  sendSignatureRequest,
  refreshSignatureStatus,
  getSignatureDownloadUrl,
  deleteSignatureRequest,
  STATUS_LABELS,
  STATUS_COLORS,
  EVENT_LABELS,
  type SignatureListItem,
  type SignatureRequest,
  type SignatureStatus,
} from "@/lib/signatureApi"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: SignatureStatus }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// ─── Locked gate for non-Pro users ───────────────────────────────────────────

function LockedGate() {
  const [, setLocation] = useLocation()
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Lock className="w-7 h-7 text-violet-500 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Digital Signature</h1>
          <p className="text-muted-foreground leading-relaxed">
            Send legally binding e-signature requests, track signing status in real time, and download certified signed copies — powered by Dropbox Sign.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground w-full max-w-xs">
          {[
            "Upload any PDF or document",
            "Send secure signing link via email",
            "Real-time status tracking",
            "Full audit trail",
            "Download signed document",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className="border border-border/60 bg-muted/30 rounded-xl px-4 py-3 text-sm w-full">
          <p className="font-semibold mb-0.5">Available on Pro</p>
          <p className="text-muted-foreground text-xs">$19.99/month — all tools included</p>
        </div>
        <Button
          onClick={() => setLocation("/upgrade")}
          className="w-full"
        >
          <Zap className="w-4 h-4 mr-2" /> Upgrade to Pro
        </Button>
        <button
          onClick={() => setLocation("/")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  )
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  onNew,
  onSelect,
}: {
  onNew: () => void
  onSelect: (id: string) => void
}) {
  const [items, setItems] = useState<SignatureListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listSignatureRequests()
      setItems(data)
    } catch {
      setError("Failed to load signature requests. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Digital Signature</h1>
            <p className="text-sm text-muted-foreground">Send and track e-signature requests</p>
          </div>
        </div>
        <Button onClick={onNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-xl px-4 py-3 text-sm mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <button onClick={load} className="mt-1 text-xs underline">Try again</button>
          </div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="border border-dashed border-border/50 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <FileSignature className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold mb-1">No signature requests yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Send your first document for e-signature — the signer receives a secure link by email.
          </p>
          <Button onClick={onNew} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> New Signature Request
          </Button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className="border border-border/60 rounded-xl hover:border-border hover:shadow-sm transition-all cursor-pointer"
                onClick={() => onSelect(item.id)}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400 w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{item.documentName}</p>
                      {item.testMode && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 border border-amber-300/50 rounded-full px-1.5 py-0.5">
                          Test
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      To: {item.signerName} ({item.signerEmail})
                      {item.signerRole && ` — ${item.signerRole}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={item.status} />
                    <div className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                      {timeAgo(item.createdAt)}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── New Request Wizard ───────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3

function NewRequestWizard({
  onBack,
  onSent,
}: {
  onBack: () => void
  onSent: (id: string) => void
}) {
  const { user } = useUser()
  const [step, setStep] = useState<WizardStep>(1)

  // Step 1 state
  const [file, setFile] = useState<File | null>(null)
  const [documentText, setDocumentText] = useState("")
  const [documentName, setDocumentName] = useState("")
  const [inputMode, setInputMode] = useState<"upload" | "text">("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2 state
  const [signerName, setSignerName] = useState("")
  const [signerEmail, setSignerEmail] = useState("")
  const [signerRole, setSignerRole] = useState("")
  const [requestMessage, setRequestMessage] = useState("")

  // Send state
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Pre-load document from My Documents navigation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pp_sig_doc")
      if (raw) {
        sessionStorage.removeItem("pp_sig_doc")
        const doc = JSON.parse(raw) as { title?: string; extractedText?: string | null; originalFilename?: string | null }
        if (doc.extractedText) {
          setDocumentText(doc.extractedText)
          setDocumentName(doc.title ?? doc.originalFilename ?? "Document")
          setInputMode("text")
        } else if (doc.title) {
          setDocumentName(doc.title)
        }
      }
    } catch { /* ignore */ }
  }, [])

  const step1Valid =
    inputMode === "upload" ? Boolean(file) : Boolean(documentText.trim()) && Boolean(documentName.trim())
  const step2Valid = Boolean(signerName.trim()) && Boolean(signerEmail.trim()) && /\S+@\S+\.\S+/.test(signerEmail)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setDocumentName(f.name.replace(/\.[^/.]+$/, ""))
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setFile(f)
    setDocumentName(f.name.replace(/\.[^/.]+$/, ""))
  }

  async function handleSend() {
    setSending(true)
    setSendError(null)
    try {
      const result = await sendSignatureRequest({
        file: inputMode === "upload" ? file : null,
        documentText: inputMode === "text" ? documentText : undefined,
        documentName: documentName.trim() || file?.name || "Document",
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim().toLowerCase(),
        signerRole: signerRole.trim() || undefined,
        requestMessage: requestMessage.trim() || undefined,
      })
      if (result.error && result.error !== "signature_not_configured") {
        setSendError(result.message || "Failed to send. Please try again.")
        return
      }
      // Track tool usage (non-blocking — don't fail the flow if this errors)
      const email = user?.primaryEmailAddress?.emailAddress
      if (email) {
        consumeToolUsage(email, "signature").catch(() => {})
      }
      onSent(result.signatureRequestId)
    } catch (err) {
      setSendError("Network error. Please check your connection and try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Pen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-lg font-bold">New Signature Request</h1>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {([1, 2, 3] as WizardStep[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s
                  ? "bg-violet-600 dark:bg-violet-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`h-px w-12 transition-colors ${step > s ? "bg-violet-500" : "bg-border"}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {step === 1 && "Choose document"}
          {step === 2 && "Signer details"}
          {step === 3 && "Review & send"}
        </span>
      </div>

      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
          {/* ── STEP 1: Document ─────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-base font-semibold mb-1">Choose your document</h2>
                <p className="text-sm text-muted-foreground">Upload a PDF, Word file, or text document. Or paste the document text directly.</p>
              </div>

              {/* Toggle */}
              <div className="flex border border-border/60 rounded-xl p-1 gap-1 w-fit">
                <button
                  onClick={() => { setInputMode("upload"); setDocumentText("") }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    inputMode === "upload" ? "bg-background shadow-sm text-foreground border border-border/40" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Upload file
                </button>
                <button
                  onClick={() => { setInputMode("text"); setFile(null) }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    inputMode === "text" ? "bg-background shadow-sm text-foreground border border-border/40" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Paste text
                </button>
              </div>

              {inputMode === "upload" ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    file
                      ? "border-violet-400/60 bg-violet-50/50 dark:bg-violet-950/20"
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); setDocumentName("") }}
                        className="text-xs text-red-500 hover:text-red-600 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-8 h-8 mb-1 text-muted-foreground/50" />
                      <p className="text-sm font-medium">Drop a file here or click to browse</p>
                      <p className="text-xs">PDF, DOCX, or TXT — max 20 MB</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="docName" className="text-sm">Document name</Label>
                    <Input
                      id="docName"
                      placeholder="e.g. Freelance Services Agreement"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="docText" className="text-sm">Document text</Label>
                    <Textarea
                      id="docText"
                      placeholder="Paste your document content here…"
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                      rows={10}
                      className="resize-y text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      {documentText.length.toLocaleString()} characters
                    </p>
                  </div>
                </div>
              )}

              {/* Name override for upload */}
              {inputMode === "upload" && file && (
                <div className="space-y-1.5">
                  <Label htmlFor="docNameUpload" className="text-sm text-muted-foreground">Document title (optional)</Label>
                  <Input
                    id="docNameUpload"
                    placeholder="e.g. Freelance Services Agreement"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Signer details ────────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-base font-semibold mb-1">Who needs to sign?</h2>
                <p className="text-sm text-muted-foreground">The signer will receive a secure email with a link to review and sign the document.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signerName" className="text-sm">Full name <span className="text-red-500">*</span></Label>
                  <Input
                    id="signerName"
                    placeholder="e.g. Jane Smith"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signerEmail" className="text-sm">Email address <span className="text-red-500">*</span></Label>
                  <Input
                    id="signerEmail"
                    type="email"
                    placeholder="jane@example.com"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signerRole" className="text-sm text-muted-foreground">Role or title (optional)</Label>
                  <Input
                    id="signerRole"
                    placeholder="e.g. Client, Contractor, Tenant"
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="requestMessage" className="text-sm text-muted-foreground">Message to signer (optional)</Label>
                  <Textarea
                    id="requestMessage"
                    placeholder="Add a note for the signer…"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  className="flex-1 gap-2"
                >
                  Review <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Review & Send ─────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-base font-semibold mb-1">Review and send</h2>
                <p className="text-sm text-muted-foreground">Check the details below before sending the signature request.</p>
              </div>

              <Card className="border border-border/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <FileText className="w-4 h-4 text-violet-500" />
                  <span className="font-medium text-sm">{documentName || file?.name || "Document"}</span>
                  {inputMode === "upload" && file && (
                    <span className="text-xs text-muted-foreground ml-auto">{(file.size / 1024).toFixed(0)} KB</span>
                  )}
                  {inputMode === "text" && (
                    <span className="text-xs text-muted-foreground ml-auto">{documentText.length.toLocaleString()} chars</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Signer name</p>
                    <p className="font-medium mt-0.5">{signerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Signer email</p>
                    <p className="font-medium mt-0.5">{signerEmail}</p>
                  </div>
                  {signerRole && (
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="font-medium mt-0.5">{signerRole}</p>
                    </div>
                  )}
                  {requestMessage && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Message</p>
                      <p className="text-sm mt-0.5 text-foreground/80">{requestMessage}</p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5">
                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                Legally binding e-signatures powered by Dropbox Sign · Signer receives a secure email link
              </div>

              {sendError && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {sendError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={sending}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleSend} disabled={sending} className="flex-1 gap-2">
                  {sending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send for Signature</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function DetailView({
  id,
  onBack,
}: {
  id: string
  onBack: () => void
}) {
  const [request, setRequest] = useState<SignatureRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSignatureRequest(id)
      setRequest(data)
    } catch {
      setError("Failed to load request details. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function handleRefresh() {
    if (!request) return
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const result = await refreshSignatureStatus(id)
      if (result.refreshed && result.status !== request.status) {
        setRefreshMsg(`Status updated to: ${STATUS_LABELS[result.status as SignatureStatus]}`)
        void load()
      } else {
        setRefreshMsg("Status is current — no changes.")
        setRequest((prev) => prev ? { ...prev, status: result.status as SignatureStatus } : prev)
      }
    } catch {
      setRefreshMsg("Could not refresh status. Please try again.")
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(null), 4000)
    }
  }

  function handleDownload() {
    setDownloadError(null)
    const url = getSignatureDownloadUrl(id)
    fetch(url, { credentials: "include" }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string }
        setDownloadError(data.message ?? "Download is not available yet.")
        return
      }
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `signed-${request?.documentName ?? "document"}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    }).catch(() => {
      setDownloadError("Download failed. Please try again.")
    })
  }

  function handleCopyEmail() {
    if (!request) return
    void navigator.clipboard.writeText(request.signerEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error ?? "Request not found."}
        </div>
      </div>
    )
  }

  const isSignedComplete = request.status === "signed"
  const isDone = ["signed", "declined", "expired", "failed"].includes(request.status)

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold">{request.documentName}</h1>
              {request.testMode && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 border border-amber-300/50 rounded-full px-1.5 py-0.5">
                  Test mode
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Signature request · {fmtDate(request.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDone && (
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh status
            </Button>
          )}
          {isSignedComplete && (
            <Button size="sm" onClick={handleDownload} className="gap-2">
              <Download className="w-3.5 h-3.5" /> Download signed
            </Button>
          )}
        </div>
      </div>

      {refreshMsg && (
        <div className="flex items-center gap-2 text-sm mb-4 text-muted-foreground bg-muted/30 border border-border/40 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          {refreshMsg}
        </div>
      )}

      {downloadError && (
        <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {downloadError}
        </div>
      )}

      {request.status === "draft" && !request.providerRequestId && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl px-4 py-4 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Provider configuration required</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5 leading-relaxed">
              Digital Signature is enabled, but outbound sending requires a Dropbox Sign API key to be configured. This request has been saved as a draft and will be sent once the provider is set up.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status card */}
          <Card className="border border-border/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status</h2>
              <StatusBadge status={request.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium mt-0.5">{fmtDate(request.createdAt)}</p>
              </div>
              {request.sentAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <p className="font-medium mt-0.5">{fmtDate(request.sentAt)}</p>
                </div>
              )}
              {request.viewedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Opened</p>
                  <p className="font-medium mt-0.5">{fmtDate(request.viewedAt)}</p>
                </div>
              )}
              {request.completedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Signed</p>
                  <p className="font-medium mt-0.5 text-emerald-600 dark:text-emerald-400">{fmtDate(request.completedAt)}</p>
                </div>
              )}
              {request.declinedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Declined</p>
                  <p className="font-medium mt-0.5 text-red-500">{fmtDate(request.declinedAt)}</p>
                </div>
              )}
              {request.expiredAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="font-medium mt-0.5">{fmtDate(request.expiredAt)}</p>
                </div>
              )}
            </div>
            {request.failureReason && (
              <div className="mt-3 pt-3 border-t border-border/40 text-xs text-red-500">
                Failure reason: {request.failureReason}
              </div>
            )}
          </Card>

          {/* Signer card */}
          <Card className="border border-border/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Signer</h2>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <p className="font-medium">{request.signerName}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  {request.signerEmail}
                </div>
                {request.signerRole && (
                  <p className="text-xs text-muted-foreground">{request.signerRole}</p>
                )}
              </div>
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy email"}
              </button>
            </div>
            {request.requestMessage && (
              <div className="mt-3 pt-3 border-t border-border/40 text-sm text-muted-foreground">
                <p className="text-xs font-medium text-muted-foreground/70 mb-1">Message sent to signer</p>
                <p className="italic">"{request.requestMessage}"</p>
              </div>
            )}
          </Card>

          {/* Audit trail */}
          <Card className="border border-border/60 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Audit Trail</h2>
            </div>
            {request.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet. Events will appear here as the signer interacts with the document.</p>
            ) : (
              <div className="space-y-3">
                {request.events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground/90">
                        {EVENT_LABELS[event.providerEventName] ?? event.providerEventName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtDate(event.occurredAt)}
                      </p>
                    </div>
                    {event.appStatusAfterEvent && (
                      <StatusBadge status={event.appStatusAfterEvent as SignatureStatus} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column — meta */}
        <div className="space-y-4">
          <Card className="border border-border/60 rounded-xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Provider Details</h2>
            <div className="space-y-2.5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="font-medium mt-0.5 capitalize">{request.providerName.replace(/_/g, " ")}</p>
              </div>
              {request.providerRequestId ? (
                <div>
                  <p className="text-xs text-muted-foreground">Request ID</p>
                  <p className="font-mono text-xs mt-0.5 break-all text-foreground/70">{request.providerRequestId}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground">Request ID</p>
                  <p className="text-xs mt-0.5 text-muted-foreground italic">Not yet sent to provider</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Mode</p>
                <p className="font-medium mt-0.5">{request.testMode ? "Test / Sandbox" : "Live"}</p>
              </div>
            </div>
          </Card>

          {isSignedComplete && (
            <Card className="border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Document signed</p>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 mt-0.5">
                    The signed document is available to download.
                  </p>
                  <Button size="sm" onClick={handleDownload} className="mt-3 w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Download className="w-3.5 h-3.5" /> Download signed PDF
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!isDone && request.status === "sent" && (
            <Card className="border border-blue-200/60 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4">
              <div className="flex items-start gap-2 text-sm">
                <Eye className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-300">Awaiting signature</p>
                  <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-0.5">
                    The signing link has been emailed to {request.signerEmail}. Click "Refresh status" to check for updates.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mode picker ─────────────────────────────────────────────────────────────

function ModePicker({
  onQuickSend,
  onPrepareAndPlace,
  onBack,
}: {
  onQuickSend: () => void
  onPrepareAndPlace: () => void
  onBack: () => void
}) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <FileSignature className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-lg font-bold">New Signature Request</h1>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-1">Choose a workflow</h2>
          <p className="text-sm text-muted-foreground">
            Select how you want to prepare and send this document.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={onQuickSend}
            className="group text-left border border-border/60 rounded-2xl p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-150"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 group-hover:bg-violet-200/70 dark:group-hover:bg-violet-900/50 transition-colors">
              <Send className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Quick Send</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload any document (PDF, Word, or text) and send it immediately. Dropbox Sign adds a signature block automatically.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["All file types", "Fast", "Auto-placement"].map(t => (
                <span key={t} className="text-[10px] font-medium bg-muted/60 rounded-full px-2 py-0.5 text-muted-foreground">{t}</span>
              ))}
            </div>
          </button>

          <button
            onClick={onPrepareAndPlace}
            className="group text-left border border-border/60 rounded-2xl p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-150"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 group-hover:bg-violet-200/70 dark:group-hover:bg-violet-900/50 transition-colors">
              <MousePointer className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Prepare & Place</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Render your PDF and click to place signature, initials, date, and text fields exactly where you want them.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["PDF only", "Precise placement", "Custom fields"].map(t => (
                <span key={t} className="text-[10px] font-medium bg-muted/60 rounded-full px-2 py-0.5 text-muted-foreground">{t}</span>
              ))}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Signature() {
  const { entitlements, isAdmin, loading } = useEntitlements()
  const [view, setView] = useState<"list" | "mode" | "new" | "prepare" | "detail">("list")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Auto-navigate to Quick Send if arriving from My Documents
  useEffect(() => {
    try {
      if (sessionStorage.getItem("pp_sig_doc")) {
        setView("new")
      }
    } catch { /* ignore */ }
  }, [])

  const canUse =
    isAdmin ||
    (entitlements?.toolAccess?.includes("signature") ?? false)

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center pt-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canUse) {
    return <LockedGate />
  }

  function goToList() {
    setSelectedId(null)
    setView("list")
  }

  function goToDetail(id: string) {
    setSelectedId(id)
    setView("detail")
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {view === "list" && (
        <ListView
          onNew={() => setView("mode")}
          onSelect={(id) => goToDetail(id)}
        />
      )}
      {view === "mode" && (
        <ModePicker
          onBack={goToList}
          onQuickSend={() => setView("new")}
          onPrepareAndPlace={() => setView("prepare")}
        />
      )}
      {view === "new" && (
        <NewRequestWizard
          onBack={() => setView("mode")}
          onSent={goToDetail}
        />
      )}
      {view === "prepare" && (
        <PrepareAndPlace
          onBack={() => setView("mode")}
          onSent={goToDetail}
        />
      )}
      {view === "detail" && selectedId && (
        <DetailView
          id={selectedId}
          onBack={goToList}
        />
      )}
    </div>
  )
}
