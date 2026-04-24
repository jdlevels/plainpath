import { useState, useEffect, useRef, useCallback } from "react"
import { useUser } from "@clerk/react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileSignature, Plus, ArrowLeft, Upload, FileText, X,
  Send, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Download, Clock, Eye, ChevronRight, Pen, Mail,
  ClipboardCopy, Lock, Shield, Zap, MousePointer, Search,
  Check,
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

function fmtShort(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// Dot-style badge matching the mockup design
const STATUS_DOT: Record<SignatureStatus, string> = {
  draft:   "bg-gray-400",
  sent:    "bg-amber-500",
  viewed:  "bg-amber-500",
  signed:  "bg-emerald-500",
  declined:"bg-red-500",
  failed:  "bg-red-600",
  expired: "bg-gray-400",
}

const STATUS_BADGE: Record<SignatureStatus, string> = {
  draft:   "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  sent:    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
  viewed:  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
  signed:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
  declined:"bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40",
  failed:  "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40",
  expired: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
}

const STATUS_FULL_LABELS: Record<SignatureStatus, string> = {
  draft:   "Draft",
  sent:    "Awaiting Signature",
  viewed:  "Awaiting Signature",
  signed:  "Signed",
  declined:"Declined",
  failed:  "Failed",
  expired: "Expired",
}

function StatusBadge({ status }: { status: SignatureStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-2.5 py-1 ${STATUS_BADGE[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]} flex-shrink-0`} />
      {STATUS_FULL_LABELS[status]}
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

// ─── Avatar initials helper ───────────────────────────────────────────────────

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500",
  "bg-teal-500", "bg-cyan-500", "bg-amber-500", "bg-rose-500",
]

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}

// ─── List view ────────────────────────────────────────────────────────────────

type ListFilter = "all" | "awaiting" | "completed" | "other"

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
  const [filter, setFilter] = useState<ListFilter>("all")
  const [search, setSearch] = useState("")

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

  const awaiting  = items.filter(i => i.status === "sent" || i.status === "draft")
  const completed = items.filter(i => i.status === "signed")
  const other     = items.filter(i => ["declined", "expired", "failed"].includes(i.status))

  const filtered = items.filter(item => {
    const matchesFilter =
      filter === "all" ? true :
      filter === "awaiting" ? (item.status === "sent" || item.status === "draft") :
      filter === "completed" ? item.status === "signed" :
      ["declined", "expired", "failed"].includes(item.status)
    const q = search.toLowerCase()
    const matchesSearch = !q || item.documentName.toLowerCase().includes(q) || item.signerName.toLowerCase().includes(q) || item.signerEmail.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const tabs: { key: ListFilter; label: string; count?: number }[] = [
    { key: "all",       label: "All Documents",    count: items.length },
    { key: "awaiting",  label: "Awaiting Others",  count: awaiting.length },
    { key: "completed", label: "Completed",         count: completed.length },
    { key: "other",     label: "Declined / Expired", count: other.length },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Digital Signature</h1>
            <p className="text-sm text-muted-foreground">Send and track legally binding e-signature requests</p>
          </div>
        </div>
        <Button onClick={onNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Stats bar */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Awaiting Signature", count: awaiting.length,  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40" },
            { label: "Completed",          count: completed.length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/40" },
            { label: "Total Sent",         count: items.length,     color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-950/20 border-violet-200/70 dark:border-violet-800/40" },
            { label: "Declined / Expired", count: other.length,     color: "text-red-500 dark:text-red-400",        bg: "bg-red-50 dark:bg-red-950/20 border-red-200/70 dark:border-red-800/40" },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-3.5 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + search */}
      {!loading && !error && items.length > 0 && (
        <div className="flex items-end justify-between border-b border-border/60 mb-4 gap-4">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  filter === tab.key
                    ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    filter === tab.key ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" : "bg-muted text-muted-foreground"
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative pb-2 flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="text-xs border border-border/60 rounded-lg pl-8 pr-3 py-1.5 w-44 bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 focus:border-violet-300 dark:focus:border-violet-700 transition-all"
            />
          </div>
        </div>
      )}

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

      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <div className="border border-dashed border-border/40 rounded-xl p-8 text-center text-sm text-muted-foreground">
          No requests match your filter.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((item, i) => {
            const initials = avatarInitials(item.signerName)
            const avatarBg = avatarColor(item.signerName)
            const isAwaiting = item.status === "sent" || item.status === "draft"
            const isSigned   = item.status === "signed"
            const isOther    = ["declined", "expired", "failed"].includes(item.status)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div
                  className="bg-background border border-border/60 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm hover:border-border transition-all cursor-pointer group"
                  onClick={() => onSelect(item.id)}
                >
                  {/* File icon */}
                  <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/40 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-[18px] h-[18px] text-violet-500 dark:text-violet-400" />
                  </div>

                  {/* Title + signer meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{item.documentName}</p>
                      {item.testMode && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 border border-amber-300/50 rounded-full px-1.5 py-0.5">Test</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className={`w-5 h-5 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-[9px] font-bold">{initials}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.signerName}</span>
                      {item.signerRole && (
                        <span className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">{item.signerRole}</span>
                      )}
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      {/* Viewed / Not opened chip */}
                      {item.status === "viewed" && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/40 px-1.5 py-0.5 rounded">Viewed</span>
                      )}
                      {item.status === "sent" && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded">Not opened</span>
                      )}
                      {item.completedAt && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Signed {fmtShort(item.completedAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-muted-foreground">Sent {fmtShort(item.sentAt ?? item.createdAt)}</p>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0">
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Hover actions */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAwaiting && (
                      <button
                        onClick={e => { e.stopPropagation(); onSelect(item.id) }}
                        className="text-[11px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 px-2.5 py-1 rounded-lg font-medium transition-colors"
                      >
                        Remind
                      </button>
                    )}
                    {isSigned && (
                      <button
                        onClick={e => { e.stopPropagation(); onSelect(item.id) }}
                        className="text-[11px] text-muted-foreground bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-lg font-medium transition-colors"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); onSelect(item.id) }}
                      className="p-1.5 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Legally binding e-signatures powered by Dropbox Sign
        </p>
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
      <div className="flex items-center gap-0 mb-8">
        {([
          { num: 1 as WizardStep, label: "Document" },
          { num: 2 as WizardStep, label: "Recipients" },
          { num: 3 as WizardStep, label: "Review & Send" },
        ]).map(({ num, label }, i, arr) => (
          <div key={num} className="flex items-center">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                step > num
                  ? "bg-violet-600 dark:bg-violet-500 text-white"
                  : step === num
                  ? "bg-violet-600 dark:bg-violet-500 text-white ring-2 ring-violet-200 dark:ring-violet-800"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step > num ? <Check className="w-3 h-3" /> : num}
              </div>
              <span className={`text-xs font-medium transition-colors ${
                step === num ? "text-violet-700 dark:text-violet-300" :
                step > num ? "text-muted-foreground" : "text-muted-foreground/60"
              }`}>{label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className={`w-8 h-px transition-colors ${step > num ? "bg-violet-400 dark:bg-violet-600" : "bg-border/60"}`} />
            )}
          </div>
        ))}
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

  // Build the signing pipeline for the timeline
  const pipeline = [
    {
      key: "sent",
      label: "Request sent",
      desc: `Sent to ${request.signerEmail}`,
      time: request.sentAt,
      done: !!request.sentAt,
      active: false,
      icon: "send",
    },
    {
      key: "viewed",
      label: request.viewedAt ? "Document viewed" : "Email opened",
      desc: request.viewedAt
        ? `${request.signerName} opened and viewed the document`
        : `Waiting for ${request.signerName} to open the email`,
      time: request.viewedAt,
      done: !!request.viewedAt,
      active: !request.viewedAt && !!request.sentAt && !isDone,
      icon: "eye",
    },
    {
      key: "signing",
      label: isSignedComplete ? "Signature complete" : "Awaiting signature",
      desc: isSignedComplete
        ? `${request.signerName} has signed the document`
        : `Waiting for ${request.signerName} to sign`,
      time: request.completedAt ?? (request.declinedAt || null),
      done: isSignedComplete || !!request.declinedAt,
      active: !!request.viewedAt && !isDone,
      icon: isSignedComplete ? "check" : "clock",
    },
    ...(isSignedComplete ? [{
      key: "cert",
      label: "Audit certificate",
      desc: "Legal audit trail PDF generated by Dropbox Sign",
      time: request.completedAt,
      done: isSignedComplete,
      active: false,
      icon: "cert",
    }] : []),
  ]

  // Also layer in raw events from Dropbox Sign
  const rawEvents = request.events

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-0">
      {/* Top bar — matches mockup header */}
      <div className="sticky top-16 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background border-b border-border/60 flex items-center gap-3 flex-wrap mb-6">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate">{request.documentName}</p>
            <StatusBadge status={request.status} />
            {request.testMode && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 border border-amber-300/50 rounded-full px-1.5 py-0.5">Test</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sent {fmtShort(request.sentAt ?? request.createdAt)}
            {request.expiredAt && ` · Expired ${fmtShort(request.expiredAt)}`}
          </p>
        </div>
        {/* Action buttons matching mockup */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isDone && (
            <>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {refreshing ? "Checking…" : "Send Reminder"}
              </button>
              <button className="text-xs text-muted-foreground border border-border/60 hover:bg-muted/50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                Download
              </button>
              <button className="text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg font-medium transition-colors">
                Void
              </button>
            </>
          )}
          {isSignedComplete && (
            <Button size="sm" onClick={handleDownload} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="w-3.5 h-3.5" /> Download signed
            </Button>
          )}
          {!isDone && (
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {refreshMsg && (
        <div className="flex items-center gap-2 text-sm mb-4 text-muted-foreground bg-muted/30 border border-border/40 rounded-lg px-3 py-2 mx-0">
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
              Outbound sending requires a Dropbox Sign API key. This request is saved as a draft.
            </p>
          </div>
        </div>
      )}

      {/* 5-col grid: main (3) + sidebar (2) — matches mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pb-10">

        {/* Left main — 3 cols */}
        <div className="lg:col-span-3 space-y-4">

          {/* Document preview card */}
          <Card className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-7 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800/40 rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-red-400">PDF</span>
                </div>
                <span className="text-xs font-semibold truncate max-w-[260px]">{request.documentName}</span>
              </div>
              {isSignedComplete && (
                <button onClick={handleDownload} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              )}
            </div>
            <div className="bg-muted/30 p-5 flex items-center justify-center" style={{ minHeight: 160 }}>
              <div className="bg-background shadow border border-border/60 rounded" style={{ width: 240, height: 150 }}>
                <div className="p-4 text-[10px] text-muted-foreground leading-relaxed">
                  <p className="font-bold text-center text-foreground/80 text-[11px] mb-2 truncate">{request.documentName.toUpperCase()}</p>
                  <p className="mb-1 line-clamp-2 text-muted-foreground/70">This document has been sent for e-signature via Dropbox Sign.</p>
                  <div className="mt-3 border-t border-dashed border-violet-300 dark:border-violet-700 pt-2 flex items-center gap-1.5">
                    <div className="h-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-700 rounded text-[8px] text-violet-500 flex items-center justify-center px-1.5">Signature</div>
                    <div className="h-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded text-[8px] text-emerald-500 flex items-center justify-center px-1.5">Date</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Audit trail */}
          <Card className="border border-border/60 rounded-xl">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <p className="text-xs font-bold text-foreground/80">Audit Trail</p>
              {rawEvents.length > 0 && (
                <span className="text-[11px] text-muted-foreground">{rawEvents.length} events recorded</span>
              )}
            </div>
            <div className="px-4 py-4">
              {pipeline.map((step, i) => {
                const isLast = i === pipeline.length - 1
                return (
                  <div key={step.key} className="flex gap-3 relative">
                    {!isLast && (
                      <div
                        className={`absolute left-3.5 top-7 w-px ${step.done ? "bg-violet-200 dark:bg-violet-800/50" : "bg-border/40"}`}
                        style={{ height: 36 }}
                      />
                    )}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${
                      step.done ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" :
                      step.active ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 ring-2 ring-amber-200 dark:ring-amber-800/50" :
                      "bg-muted text-muted-foreground/40"
                    }`}>
                      {step.icon === "send" && <Send className="w-3.5 h-3.5" />}
                      {step.icon === "eye" && <Eye className="w-3.5 h-3.5" />}
                      {step.icon === "clock" && <Clock className="w-3.5 h-3.5" />}
                      {step.icon === "check" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {step.icon === "cert" && <Shield className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`flex-1 min-w-0 ${!isLast ? "pb-5" : ""}`}>
                      <p className={`text-xs font-semibold ${
                        step.done ? "text-foreground/90" :
                        step.active ? "text-amber-700 dark:text-amber-400" :
                        "text-muted-foreground/40"
                      }`}>{step.label}</p>
                      <p className={`text-[11px] mt-0.5 ${step.done || step.active ? "text-muted-foreground" : "text-muted-foreground/30"}`}>{step.desc}</p>
                      {step.time && (
                        <p className={`text-[10px] mt-0.5 font-medium ${
                          step.active ? "text-amber-500 dark:text-amber-400" :
                          step.done ? "text-violet-500 dark:text-violet-400" : "text-muted-foreground/30"
                        }`}>{fmtDate(step.time)}</p>
                      )}
                      {step.active && !step.time && (
                        <p className="text-[10px] mt-0.5 font-medium text-amber-500 dark:text-amber-400">In progress</p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Raw Dropbox Sign events if any */}
              {rawEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Provider Events</p>
                  {rawEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-2 mb-2 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                      <div>
                        <span className="font-medium text-foreground/80">{EVENT_LABELS[event.providerEventName] ?? event.providerEventName}</span>
                        <span className="text-muted-foreground ml-2">{fmtDate(event.occurredAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right sidebar — 2 cols */}
        <div className="lg:col-span-2 space-y-4">

          {/* Signers card */}
          <Card className="border border-border/60 rounded-xl p-4">
            <p className="text-xs font-bold text-foreground/80 mb-3">Signers</p>
            <div className={`border rounded-xl p-3 ${
              isSignedComplete
                ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/10"
                : "border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${avatarColor(request.signerName)}`}>
                  {avatarInitials(request.signerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{request.signerName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{request.signerEmail}</p>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                  isSignedComplete
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40"
                    : "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40"
                }`}>
                  {isSignedComplete ? "Signed" : "Pending"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {request.signerRole && (
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    isSignedComplete
                      ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                  }`}>{request.signerRole}</span>
                )}
                {request.viewedAt && <span>· Viewed the document</span>}
                <button onClick={handleCopyEmail} className="ml-auto flex items-center gap-1 hover:text-foreground transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <ClipboardCopy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy email"}
                </button>
              </div>
              {!isDone && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="mt-2.5 w-full text-[11px] text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 hover:bg-violet-50 dark:hover:bg-violet-950/20 py-1.5 rounded-lg font-medium transition-colors"
                >
                  {refreshing ? "Checking…" : "Send Reminder"}
                </button>
              )}
            </div>
          </Card>

          {/* Request details */}
          <Card className="border border-border/60 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-foreground/80">Request Details</p>
            {[
              { label: "Created by", value: "You" },
              { label: "Sent", value: fmtShort(request.sentAt ?? request.createdAt) },
              ...(request.expiredAt ? [{ label: "Expired", value: fmtShort(request.expiredAt) }] : []),
              ...(request.completedAt ? [{ label: "Signed", value: fmtShort(request.completedAt) }] : []),
              { label: "Document ID", value: request.providerRequestId ? `${request.providerRequestId.slice(0, 14)}…` : "Pending" },
              { label: "Mode", value: request.testMode ? "Test / Sandbox" : "Live" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground/80 font-medium text-right">{value}</span>
              </div>
            ))}
          </Card>

          {/* Message Sent */}
          {request.requestMessage && (
            <Card className="border border-border/60 rounded-xl p-4">
              <p className="text-xs font-bold text-foreground/80 mb-2">Message Sent</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">"{request.requestMessage}"</p>
            </Card>
          )}

          {/* Security badge */}
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">Legally binding</p>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-0.5">Secured by Dropbox Sign · Full audit certificate available after signing</p>
            </div>
          </div>

          {/* Failure reason if any */}
          {request.failureReason && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-xl px-4 py-3 text-xs text-red-600 dark:text-red-400">
              <p className="font-semibold mb-0.5">Failure reason</p>
              {request.failureReason}
            </div>
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

  useEffect(() => {
    document.title = "Digital Signature — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

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
