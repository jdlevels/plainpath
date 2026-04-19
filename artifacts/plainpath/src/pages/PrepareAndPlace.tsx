// ─── Prepare & Place Wizard ───────────────────────────────────────────────────
// A full document-preparation workspace where the user uploads a PDF,
// places signature fields directly on the document, then sends it.
// Layout: left = PDF workspace (scrollable), right = tool palette + controls.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from "react"
import { useUser } from "@clerk/react"
import {
  ArrowLeft, Upload, FileText, X, Send, Loader2, AlertCircle,
  Shield, Pen, Trash2, MousePointer, ChevronDown, ChevronUp,
  GripVertical, Type, Calendar, User, Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { consumeToolUsage } from "@/lib/entitlements"
import {
  PdfSignatureWorkspace,
  FIELD_TYPE_LABELS,
  FIELD_DEFAULTS,
  type PlacedField,
  type FieldType,
  type PageDimension,
} from "@/components/PdfSignatureWorkspace"
import { sendPreparedSignatureRequest } from "@/lib/signatureApi"

// ─── Field palette config ─────────────────────────────────────────────────────

const FIELD_PALETTE: { type: FieldType; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "signature", icon: Pen },
  { type: "initials",  icon: GripVertical },
  { type: "date_signed", icon: Calendar },
  { type: "name",      icon: User },
  { type: "title",     icon: Briefcase },
  { type: "text",      icon: Type },
]

const FIELD_COLORS_DOT: Record<FieldType, string> = {
  signature: "bg-violet-500",
  initials:  "bg-blue-500",
  date_signed: "bg-emerald-500",
  name:      "bg-amber-500",
  title:     "bg-orange-500",
  text:      "bg-gray-500",
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(
  fields: PlacedField[],
  signer: { name: string; email: string },
): string[] {
  const errors: string[] = []
  if (fields.length === 0) errors.push("Place at least one field on the document.")
  const hasSig = fields.some(f => f.type === "signature" || f.type === "initials")
  if (!hasSig) errors.push("Add at least one Signature or Initials field.")
  if (!signer.name.trim()) errors.push("Signer name is required.")
  if (!signer.email.trim() || !/\S+@\S+\.\S+/.test(signer.email))
    errors.push("A valid signer email is required.")
  return errors
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void
  onSent: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

type WizardStep = "upload" | "workspace"

export default function PrepareAndPlace({ onBack, onSent }: Props) {
  const { user } = useUser()

  const [step, setStep] = useState<WizardStep>("upload")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Field placement state
  const [fields, setFields] = useState<PlacedField[]>([])
  const [activeFieldType, setActiveFieldType] = useState<FieldType | null>("signature")
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [pageDimensions, setPageDimensions] = useState<PageDimension[]>([])

  // Signer details (live in the right sidebar)
  const [signerName, setSignerName] = useState("")
  const [signerEmail, setSignerEmail] = useState("")
  const [signerRole, setSignerRole] = useState("")
  const [requestMessage, setRequestMessage] = useState("")

  // Send state
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Right panel accordion sections
  const [showSigner, setShowSigner] = useState(true)
  const [showFields, setShowFields] = useState(true)

  // ── File upload ─────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      return
    }
    setPdfFile(f)
    setDocumentName(f.name.replace(/\.[^/.]+$/, ""))
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f || !f.name.toLowerCase().endsWith(".pdf")) return
    setPdfFile(f)
    setDocumentName(f.name.replace(/\.[^/.]+$/, ""))
  }

  // ── Field management ────────────────────────────────────────────────────────

  const handleFieldsChange = useCallback((updated: PlacedField[]) => {
    setFields(updated)
  }, [])

  const handleFieldSelect = useCallback((id: string | null) => {
    setSelectedFieldId(id)
    if (id) setActiveFieldType(null)
  }, [])

  function deleteField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  function deleteSelectedField() {
    if (selectedFieldId) deleteField(selectedFieldId)
  }

  // ── Send ────────────────────────────────────────────────────────────────────

  const validationErrors = validate(fields, { name: signerName, email: signerEmail })
  const canSend = validationErrors.length === 0

  async function handleSend() {
    if (!pdfFile || !canSend) return
    setSending(true)
    setSendError(null)
    try {
      const result = await sendPreparedSignatureRequest({
        file: pdfFile,
        documentName: documentName.trim() || pdfFile.name,
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim().toLowerCase(),
        signerRole: signerRole.trim() || undefined,
        requestMessage: requestMessage.trim() || undefined,
        fields,
        pageDimensions,
      })
      if (result.error && result.error !== "signature_not_configured") {
        setSendError(result.message || "Failed to send. Please try again.")
        return
      }
      const email = user?.primaryEmailAddress?.emailAddress
      if (email) consumeToolUsage(email, "signature").catch(() => {})
      onSent(result.signatureRequestId)
    } catch {
      setSendError("Network error. Please check your connection and try again.")
    } finally {
      setSending(false)
    }
  }

  // ── Step 1: Upload ──────────────────────────────────────────────────────────

  if (step === "upload") {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div>
              <h1 className="text-lg font-bold">Prepare & Place</h1>
              <p className="text-sm text-muted-foreground">Upload a PDF and place fields directly on the document</p>
            </div>
          </div>
        </div>

        <div className="max-w-xl space-y-5">
          <div>
            <h2 className="text-base font-semibold mb-1">Upload your PDF</h2>
            <p className="text-sm text-muted-foreground">
              Only PDF files are supported in Prepare & Place mode. Use Quick Send for other formats.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              pdfFile
                ? "border-violet-400/60 bg-violet-50/50 dark:bg-violet-950/20"
                : "border-border/50 hover:border-border hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {pdfFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="font-medium text-sm">{pdfFile.name}</p>
                <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(0)} KB · PDF</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setPdfFile(null); setDocumentName("") }}
                  className="text-xs text-red-500 hover:text-red-600 mt-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-8 h-8 mb-1 text-muted-foreground/50" />
                <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
                <p className="text-xs">PDF only — max 20 MB</p>
              </div>
            )}
          </div>

          {pdfFile && (
            <div className="space-y-1.5">
              <Label htmlFor="docTitle" className="text-sm">Document title</Label>
              <Input
                id="docTitle"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g. Service Agreement"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setStep("workspace")}
              disabled={!pdfFile}
              className="gap-2"
            >
              Open in Workspace <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Workspace ───────────────────────────────────────────────────────

  const selectedField = fields.find(f => f.id === selectedFieldId) ?? null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Workspace header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/95 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("upload")}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Pen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight truncate max-w-[200px]">
                {documentName || pdfFile?.name || "Document"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {fields.length} field{fields.length !== 1 ? "s" : ""} placed
              </p>
            </div>
          </div>
        </div>

        {/* Active tool indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {activeFieldType ? (
            <span className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 rounded-full px-2.5 py-1 font-medium">
              <MousePointer className="w-3 h-3" />
              Placing: {FIELD_TYPE_LABELS[activeFieldType]}
            </span>
          ) : selectedField ? (
            <span className="flex items-center gap-1.5 bg-muted/60 rounded-full px-2.5 py-1">
              <span className={`w-2 h-2 rounded-full ${FIELD_COLORS_DOT[selectedField.type]}`} />
              {FIELD_TYPE_LABELS[selectedField.type]} selected
            </span>
          ) : (
            <span className="text-muted-foreground/60 text-[11px]">Select a field type to place</span>
          )}
        </div>
      </div>

      {/* Main workspace: left = PDF, right = sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: PDF viewer */}
        <div className="flex-1 overflow-y-auto bg-muted/20">
          {pdfFile && (
            <PdfSignatureWorkspace
              pdfFile={pdfFile}
              fields={fields}
              activeFieldType={activeFieldType}
              selectedFieldId={selectedFieldId}
              onFieldsChange={handleFieldsChange}
              onFieldSelect={handleFieldSelect}
              onPageDimensionsLoaded={setPageDimensions}
            />
          )}
        </div>

        {/* Right: sidebar */}
        <div className="w-72 xl:w-80 flex-shrink-0 border-l border-border/60 flex flex-col overflow-y-auto bg-background">

          {/* Field type palette */}
          <div className="p-3 border-b border-border/40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              Field Types — click page to place
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {FIELD_PALETTE.map(({ type, icon: Icon }) => {
                const isActive = activeFieldType === type
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveFieldType(isActive ? null : type)
                      if (!isActive) setSelectedFieldId(null)
                    }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                      isActive
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                        : "bg-background text-foreground border-border/60 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{FIELD_TYPE_LABELS[type]}</span>
                  </button>
                )
              })}
            </div>

            {activeFieldType && (
              <button
                onClick={() => setActiveFieldType(null)}
                className="mt-2 w-full text-[11px] text-muted-foreground hover:text-foreground text-center py-1"
              >
                Cancel placement (Esc)
              </button>
            )}
          </div>

          {/* Placed fields list */}
          <div className="border-b border-border/40">
            <button
              onClick={() => setShowFields(!showFields)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Placed Fields ({fields.length})
              </span>
              {showFields ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>

            {showFields && (
              <div className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
                {fields.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 text-center py-3">
                    Click the document to place fields
                  </p>
                ) : (
                  fields.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => { setSelectedFieldId(f.id); setActiveFieldType(null) }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                        f.id === selectedFieldId
                          ? "bg-violet-50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800/40"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${FIELD_COLORS_DOT[f.type]}`} />
                      <span className="flex-1 font-medium truncate">{FIELD_TYPE_LABELS[f.type]}</span>
                      <span className="text-[10px] text-muted-foreground">p.{f.page}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteField(f.id) }}
                        className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedField && (
              <div className="px-3 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedField}
                  className="w-full gap-2 text-red-600 hover:text-red-700 border-red-200/60 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected Field
                </Button>
              </div>
            )}
          </div>

          {/* Signer panel */}
          <div className="border-b border-border/40">
            <button
              onClick={() => setShowSigner(!showSigner)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Signer Details
              </span>
              {showSigner ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>

            {showSigner && (
              <div className="px-3 pb-3 space-y-2.5">
                <div className="space-y-1">
                  <Label htmlFor="pp-signerName" className="text-[11px] text-muted-foreground">
                    Full name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pp-signerName"
                    placeholder="Jane Smith"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pp-signerEmail" className="text-[11px] text-muted-foreground">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pp-signerEmail"
                    type="email"
                    placeholder="jane@example.com"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pp-signerRole" className="text-[11px] text-muted-foreground">Role (optional)</Label>
                  <Input
                    id="pp-signerRole"
                    placeholder="e.g. Client, Contractor"
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pp-msg" className="text-[11px] text-muted-foreground">Message (optional)</Label>
                  <Textarea
                    id="pp-msg"
                    placeholder="Add a note for the signer…"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation + Send */}
          <div className="p-3 mt-auto">
            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="mb-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2.5 space-y-1">
                {validationErrors.map((err) => (
                  <div key={err} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {err}
                  </div>
                ))}
              </div>
            )}

            {sendError && (
              <div className="mb-3 flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {sendError}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2.5">
              <Shield className="w-3 h-3 flex-shrink-0" />
              Legally binding · powered by Dropbox Sign
            </div>

            <Button
              onClick={handleSend}
              disabled={!canSend || sending}
              className="w-full gap-2"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send for Signature</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
