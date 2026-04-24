import { useState, useRef, useEffect, useCallback } from "react"
import { useLocation } from "wouter"
import {
  FileText, Upload, ShieldCheck, Zap, ChevronRight, Clock,
  CheckCircle2, AlertCircle, RotateCcw, Scale, Home, FileWarning,
  Mail, Check, Loader2, X, ArrowRight, AlertTriangle,
} from "lucide-react"
import { useAnalysisContext } from "@/context/AnalysisContext"
import { useEntitlements } from "@/hooks/useEntitlements"
import { getApiBaseUrl } from "@/lib/api"
import { beforeRunAnalysis, UsageLimitError } from "@/lib/analysisGate"
import { getAll as getSavedAnalyses } from "@/lib/savedAnalyses"
import { haptic } from "@/lib/native"
import UpgradeModal from "@/components/UpgradeModal"

// ─── Constants ───────────────────────────────────────────────────────────────

const USE_CASES = [
  { icon: <Scale className="w-4 h-4 text-violet-400" />, label: "Contracts & agreements", desc: "Spot renewal traps, liability gaps, and unusual terms" },
  { icon: <Home className="w-4 h-4 text-sky-400" />, label: "Lease agreements", desc: "Find hidden fees, exit clauses, and maintenance duties" },
  { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, label: "Insurance forms", desc: "Understand what's covered, excluded, and when to file" },
  { icon: <FileWarning className="w-4 h-4 text-amber-400" />, label: "Legal & compliance notices", desc: "Decode what's required of you and by what deadline" },
  { icon: <Mail className="w-4 h-4 text-orange-400" />, label: "Financial & legal letters", desc: "Understand demands, disputes, or offer letters" },
  { icon: <FileText className="w-4 h-4 text-rose-400" />, label: "Service agreements", desc: "Clarify scope, payment, IP, and exit terms" },
]

const ANALYZE_STAGES = [
  { label: "Reading document structure", detail: "Parsing pages, identifying headings and sections…" },
  { label: "Extracting important sections", detail: "Found effective dates, obligations, and key clauses…" },
  { label: "Checking for risks", detail: "Reviewing liability, renewal, and unusual terms…" },
  { label: "Generating plain-English summary", detail: "Almost there…" },
]

const WHAT_YOULL_GET = [
  { label: "Plain-English summary", accent: "text-violet-300", bg: "bg-violet-600/6 border-violet-500/12" },
  { label: "Confidence & risk status", accent: "text-red-300", bg: "bg-red-600/6 border-red-500/12" },
  { label: "Required next steps", accent: "text-sky-300", bg: "bg-sky-600/6 border-sky-500/12" },
  { label: "Key deadlines", accent: "text-amber-300", bg: "bg-amber-600/6 border-amber-500/12" },
  { label: "Key parties", accent: "text-emerald-300", bg: "bg-emerald-600/6 border-emerald-500/12" },
  { label: "Source traceability", accent: "text-violet-300", bg: "bg-violet-600/6 border-violet-500/12" },
]

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

// ─── Status badge (recent analyses) ─────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    "needs-action": "bg-red-500/10 border-red-500/25 text-red-300",
    "in-progress": "bg-amber-500/10 border-amber-500/25 text-amber-300",
    "complete": "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
    "new": "bg-white/[0.05] border-white/10 text-white/35",
  }
  const icons: Record<string, React.ReactNode> = {
    "complete": <CheckCircle2 className="w-2.5 h-2.5" />,
    "in-progress": <Clock className="w-2.5 h-2.5" />,
    "needs-action": <AlertCircle className="w-2.5 h-2.5" />,
  }
  const label = status === "complete" ? "Reviewed" : status === "in-progress" ? "In progress" : "Action needed"
  return (
    <div className={`h-5 px-2 rounded-full border flex items-center gap-1 shrink-0 ${variants[status] ?? variants["new"]}`}>
      {icons[status]}
      <span className="text-[9px] font-medium whitespace-nowrap">{label}</span>
    </div>
  )
}

// ─── Fake doc page (processing state) ────────────────────────────────────────

function FakeDocPage({ pg, lines, title, scanning }: {
  pg: number; lines: number[]; title?: boolean; scanning?: boolean
}) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 ${
      scanning ? "border-violet-500/25 bg-violet-500/[0.03]" : "border-white/[0.05] bg-white/[0.012]"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/18 text-[9px] font-mono">Page {pg}</span>
        {scanning && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/18 border border-violet-500/25">
            <Loader2 className="w-2 h-2 text-violet-400 animate-spin" />
            <span className="text-violet-300/65 text-[9px]">reading…</span>
          </div>
        )}
      </div>
      {title && (
        <div className="mb-1">
          <div className="h-3 rounded mb-1.5 bg-white/[0.12]" style={{ width: "55%" }} />
          <div className="h-2 rounded bg-white/[0.07]" style={{ width: "38%" }} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {lines.map((w, i) => (
          <div
            key={i}
            className={`h-[7px] rounded-sm ${scanning && i < 2 ? "bg-violet-400/18" : "bg-white/[0.065]"}`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  onFile, isDragging, onDragOver, onDragLeave, onDrop, fileInputRef, isWorking, uploadError,
}: {
  onFile: (f: File) => void
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  isWorking: boolean
  uploadError: string | null
}) {
  const saved = getSavedAnalyses()

  const triggerPicker = () => fileInputRef.current?.click()

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-10 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-lg text-center mb-8">
        <h1 className="text-white text-xl font-semibold tracking-tight mb-2.5">
          Understand what a document means — and what to do next
        </h1>
        <p className="text-white/35 text-sm leading-relaxed max-w-sm mx-auto">
          Upload a document you've received and PlainPath will read it, identify risks, extract key dates, and show you exactly what action is needed.
        </p>
      </div>

      {/* Upload zone */}
      <div className="w-full max-w-lg mb-8">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerPicker}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer group p-10 flex flex-col items-center text-center ${
            isDragging
              ? "border-violet-500/60 bg-violet-500/[0.06]"
              : "border-white/[0.10] bg-white/[0.015] hover:border-violet-500/40 hover:bg-violet-500/[0.03]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
            disabled={isWorking}
          />
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139,92,246,0.07) 0%, transparent 70%)" }}
          />
          <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-white text-base font-semibold mb-1.5">
            {isDragging ? "Drop to upload" : "Drop your document here"}
          </h2>
          <p className="text-white/32 text-sm mb-5 leading-relaxed max-w-xs">
            PlainPath is for reviewing documents you've received — not writing new ones.
          </p>
          <div className="h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Choose file
          </div>
          <p className="text-white/18 text-xs mt-3">PDF, DOCX, TXT · Up to 20 MB</p>
        </div>

        {uploadError && (
          <div className="mt-3 rounded-xl border border-red-500/25 bg-red-600/[0.06] px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300/80 text-sm">{uploadError}</p>
          </div>
        )}

        <div className="mt-3.5 flex items-center justify-center gap-6">
          {[
            { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: "End-to-end encrypted" },
            { icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, label: "Full analysis in ~15 sec" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {item.icon}
              <span className="text-white/28 text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Works well with */}
      <div className="w-full max-w-lg mb-10">
        <p className="text-white/22 text-[10px] uppercase tracking-widest font-semibold mb-3">Works well with</p>
        <div className="grid grid-cols-2 gap-2">
          {USE_CASES.map((uc, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] px-3.5 py-3">
              <div className="mt-0.5 shrink-0">{uc.icon}</div>
              <div>
                <p className="text-white/68 text-xs font-medium leading-none mb-1">{uc.label}</p>
                <p className="text-white/28 text-[10px] leading-relaxed">{uc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent analyses */}
      {saved.length > 0 && (
        <div className="w-full max-w-lg">
          <p className="text-white/22 text-[10px] uppercase tracking-widest font-semibold mb-3">Recent analyses</p>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] overflow-hidden divide-y divide-white/[0.04]">
            {saved.slice(0, 5).map((doc) => (
              <a
                key={doc.id}
                href={`/my-analyses`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-white/32" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white/68 text-sm truncate group-hover:text-white/85 transition-colors font-medium">{doc.title}</p>
                    {doc.documentTypeHint && (
                      <div className="h-4 px-1.5 rounded bg-white/[0.05] border border-white/[0.07] shrink-0">
                        <span className="text-white/28 text-[9px]">{doc.documentTypeHint}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-white/22 text-[10px]">{new Date(doc.savedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status="complete" />
                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/32 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Processing state ─────────────────────────────────────────────────────────

function ProcessingState({ fileName }: { fileName: string }) {
  const [elapsed, setElapsed] = useState(0)
  const [stageIdx, setStageIdx] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const sec = (Date.now() - start) / 1000
      setElapsed(sec)
      const newIdx = sec < 8 ? 0 : sec < 16 ? 1 : sec < 24 ? 2 : 3
      setStageIdx(newIdx)
    }, 300)
    return () => clearInterval(id)
  }, [])

  const doneCount = stageIdx
  const pct = Math.min(Math.round((doneCount / ANALYZE_STAGES.length) * 100 + (elapsed % 8) * 1.5), 92)

  const DOC_PAGES = [
    { pg: 1, lines: [88, 72, 80, 65, 78], title: true },
    { pg: 5, lines: [85, 70, 77, 65, 90] },
    { pg: 9, lines: [88, 68, 75, 82, 60], scanning: stageIdx < 2 },
    { pg: 14, lines: [78, 62, 88, 70, 75] },
  ]

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* LEFT: muted document viewer */}
      <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 hidden md:flex">
        <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
          <FileText className="w-3.5 h-3.5 text-white/25 shrink-0" />
          <span className="text-white/35 text-xs flex-1 truncate">{fileName}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 opacity-55">
          {DOC_PAGES.map((p) => (
            <FakeDocPage key={p.pg} {...p} />
          ))}
        </div>
        <div className="h-10 border-t border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
          <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500/60 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-white/18 text-[10px] whitespace-nowrap">Analysing…</span>
        </div>
      </div>

      {/* RIGHT: progress panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 flex flex-col gap-6">

          {/* File identity */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-white/35" />
            </div>
            <div className="flex-1">
              <p className="text-white/75 text-sm font-semibold truncate">{fileName}</p>
              <p className="text-white/28 text-[10px] mt-0.5">Uploaded just now · Analysing…</p>
            </div>
          </div>

          {/* Overall progress */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/65 text-sm font-medium">Analysis in progress</p>
              <span className="text-white/22 text-xs">{doneCount} of {ANALYZE_STAGES.length} steps</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #6d28d9 0%, #8b5cf6 100%)",
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/20 text-[10px]">
                {elapsed < 8 ? "~25 seconds remaining" : elapsed < 16 ? "~18 seconds remaining" : elapsed < 24 ? "~10 seconds remaining" : "Almost there…"}
              </p>
              <p className="text-violet-400/50 text-[10px] font-mono">{pct}%</p>
            </div>
          </div>

          {/* Stage checklist */}
          <div className="flex flex-col gap-4">
            {ANALYZE_STAGES.map((stage, i) => {
              const done = i < stageIdx
              const active = i === stageIdx
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    done ? "bg-emerald-600/18 border border-emerald-500/30"
                    : active ? "bg-violet-600/22 border border-violet-500/40"
                    : "bg-white/[0.04] border border-white/[0.07]"
                  }`}>
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : active ? (
                      <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/18" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium leading-none mb-1 ${
                      done ? "text-white/40" : active ? "text-white/88" : "text-white/22"
                    }`}>{stage.label}</p>
                    {(done || active) && stage.detail && (
                      <p className={`text-[10px] leading-relaxed ${done ? "text-white/18" : "text-white/35"}`}>
                        {stage.detail}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* What you'll get */}
          <div className="border-t border-white/[0.05] pt-5">
            <p className="text-white/18 text-[10px] uppercase tracking-widest font-semibold mb-3">Your analysis will include</p>
            <div className="grid grid-cols-2 gap-2">
              {WHAT_YOULL_GET.map((item, i) => (
                <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${item.bg}`}>
                  <div className={`w-1 h-1 rounded-full shrink-0 opacity-80 ${item.accent.replace("text-", "bg-")}`} />
                  <p className={`text-[11px] font-medium ${item.accent}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, fileName, onRetry, onUploadDifferent }: {
  message: string
  fileName: string
  onRetry: () => void
  onUploadDifferent: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-red-500/20 bg-red-600/[0.05] p-7 flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/25 flex items-center justify-center mb-5">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-white/90 text-base font-semibold mb-2">Analysis couldn't complete</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-5 max-w-sm">{message}</p>

          {fileName && (
            <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-5 text-left">
              <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">File that failed</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-sm font-medium truncate">{fileName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onRetry}
              className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
            <button
              onClick={onUploadDifferent}
              className="flex-1 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white/50 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload different file
            </button>
          </div>
        </div>

        <p className="text-white/22 text-[10px] uppercase tracking-widest font-semibold mb-3">What you can try instead</p>
        <div className="flex flex-col gap-2">
          {[
            { icon: <Upload className="w-3.5 h-3.5" />, label: "Upload a different version", desc: "Try the original unencrypted file", href: "/analyze", color: "text-violet-400 bg-violet-600/10 border-violet-500/20" },
            { icon: <FileText className="w-3.5 h-3.5" />, label: "Ask This Document", desc: "Works on some encrypted files", href: "/ask-document", color: "text-blue-400 bg-blue-600/10 border-blue-500/20" },
            { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Trust Check", desc: "Verify authenticity without full analysis", href: "/analyze?mode=trust-check", color: "text-amber-400 bg-amber-600/10 border-amber-500/20" },
          ].map((s, i) => (
            <a key={i} href={s.href} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm font-medium leading-none mb-0.5">{s.label}</p>
                <p className="text-white/30 text-[11px]">{s.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/35 shrink-0 transition-colors" />
            </a>
          ))}
        </div>

        <p className="text-white/20 text-[11px] text-center mt-6 leading-relaxed">
          If this keeps happening, <a href="/support" className="text-violet-400/60 hover:text-violet-400/80">contact support</a> — we'll look into it.
        </p>
      </div>
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({ state, fileName }: { state: "empty" | "processing" | "error"; fileName?: string }) {
  return (
    <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-3 shrink-0 bg-[#0c0c0f]">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
      </div>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <span className="text-white/35 text-xs">Analyze a Document</span>
      {fileName && (
        <>
          <ChevronRight className="w-3 h-3 text-white/18" />
          <span className="text-white/30 text-xs truncate max-w-[180px]">{fileName}</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        {state === "processing" && (
          <div className="h-6 px-2.5 rounded-full bg-violet-600/12 border border-violet-500/25 flex items-center gap-1.5">
            <Loader2 className="w-2.5 h-2.5 text-violet-400 animate-spin" />
            <span className="text-violet-300 text-[10px] font-medium">Analysing…</span>
          </div>
        )}
        {state === "error" && (
          <div className="h-6 px-2.5 rounded-full bg-red-600/12 border border-red-500/25 flex items-center gap-1.5">
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            <span className="text-red-300 text-[10px] font-medium">Analysis failed</span>
          </div>
        )}
        {state !== "processing" && (
          <a href="/" className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/28 text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 rotate-180" />
            <span className="hidden sm:inline">Home</span>
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type PageState = "empty" | "processing" | "error"

export default function AnalyzePage() {
  const [pageState, setPageState] = useState<PageState>("empty")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: "analyses" | "trustCheck" | "contractDraft"; used: number; limit: number }>({ open: false, reason: "analyses", used: 0, limit: 2 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setAnalysis, setDocumentTypeHint } = useAnalysisContext()
  const { entitlements } = useEntitlements()
  const [, setLocation] = useLocation()

  useEffect(() => {
    document.title = "Analyze a Document — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  const validateFile = (f: File): string | null => {
    if (f.size === 0) return "This file appears to be empty. Please check the file and try again."
    if (f.size > 20 * 1024 * 1024) return "File is too large. Maximum allowed size is 20 MB."
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
    const allowedExts = [".pdf", ".docx", ".txt"]
    const ext = "." + f.name.split(".").pop()?.toLowerCase()
    if (!allowedTypes.includes(f.type) && !allowedExts.includes(ext)) {
      return "Unsupported file type. Please upload a PDF, Word document (.docx), or plain text file."
    }
    return null
  }

  const handleFile = useCallback(async (f: File) => {
    const err = validateFile(f)
    if (err) { setUploadError(err); return }

    setUploadError(null)
    setFile(f)

    try {
      await beforeRunAnalysis(entitlements?.plan ?? null)
    } catch (e) {
      if (e instanceof UsageLimitError) {
        setUpgradeModal({ open: true, reason: e.reason, used: e.used, limit: e.limit })
        setFile(null)
        return
      }
      setUploadError(e instanceof Error ? e.message : "Unable to start analysis.")
      setFile(null)
      return
    }

    setDocumentTypeHint("General / Unsure")
    setPageState("processing")

    const formData = new FormData()
    formData.append("file", f)
    formData.append("documentTypeHint", "General / Unsure")

    try {
      const apiBase = getApiBaseUrl()
      const res = await fetch(`${apiBase}/api/documents/upload`, { method: "POST", body: formData })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { /* non-JSON */ }

      if (!res.ok) {
        const msg = (data?.message as string) || (
          res.status === 413 ? "File is too large. Maximum allowed size is 20 MB."
          : res.status === 422 ? "Could not extract text from this file. If it's a scanned PDF, try a clearer version."
          : res.status === 503 ? "The analysis service is temporarily busy. Please wait a moment and try again."
          : res.status === 504 ? "Analysis is taking too long. Please try again."
          : "Upload failed. Please try again or use a different file."
        )
        setErrorMessage(msg)
        setPageState("error")
        return
      }

      if (!data?.analysis) {
        setErrorMessage("Analysis returned an unexpected result. Please try again.")
        setPageState("error")
        return
      }

      await haptic("success")
      setAnalysis(data.analysis as any)
      setLocation("/analyze-document")
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.")
      setPageState("error")
    }
  }, [entitlements, setAnalysis, setDocumentTypeHint, setLocation])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f)
  }

  const handleRetry = () => {
    if (file) { void handleFile(file) }
    else { setPageState("empty") }
  }

  const handleUploadDifferent = () => {
    setFile(null)
    setErrorMessage("")
    setUploadError(null)
    setPageState("empty")
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((u) => ({ ...u, open: false }))}
        reason={upgradeModal.reason}
        used={upgradeModal.used}
        limit={upgradeModal.limit}
      />

      <TopBar state={pageState} fileName={file?.name} />

      {pageState === "empty" && (
        <EmptyState
          onFile={(f) => void handleFile(f)}
          isDragging={isDragging}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          fileInputRef={fileInputRef}
          isWorking={false}
          uploadError={uploadError}
        />
      )}

      {pageState === "processing" && (
        <ProcessingState fileName={file?.name ?? "Document"} />
      )}

      {pageState === "error" && (
        <ErrorState
          message={errorMessage}
          fileName={file?.name ?? ""}
          onRetry={handleRetry}
          onUploadDifferent={handleUploadDifferent}
        />
      )}
    </div>
  )
}
