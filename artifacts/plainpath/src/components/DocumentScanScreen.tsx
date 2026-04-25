import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText, ShieldCheck, Scale, Check, Loader2,
  AlertTriangle, CheckCircle2, AlertCircle, GitCompare, ListChecks,
} from "lucide-react"

export type ScanMode = "trust-check" | "contract-review" | "analyze" | "compare" | "clause-extractor"

interface Finding {
  text: string
  type: "info" | "success" | "warning" | "danger"
  step: number
}

interface DocRegion {
  top: number
  height: number
  color: string
  chipText?: string
  chipType?: "info" | "success" | "warning" | "danger"
  step: number
}

interface ScanConfig {
  ToolIcon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  accent: string
  accentBg: string
  accentText: string
  scanGlow: string
  scanLineClass: string
  stepInterval: number
  steps: string[]
  findings: Finding[]
  regions: DocRegion[]
  docLines: number
  footerText: string
  progressLabel: string
}

const DOC_LINE_WIDTHS = [85, 72, 90, 65, 80, 88, 70, 75, 92, 68, 83, 77, 60, 88, 74, 81, 65, 90, 72, 85, 78, 63]

const CONFIGS: Record<ScanMode, ScanConfig> = {
  "trust-check": {
    ToolIcon: ShieldCheck,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "Document Trust Check",
    accent: "border-blue-200/60 dark:border-blue-900/40",
    accentBg: "bg-blue-50 dark:bg-blue-950/30",
    accentText: "text-blue-700 dark:text-blue-300",
    scanGlow: "rgb(59 130 246 / 0.5)",
    scanLineClass: "bg-blue-500",
    stepInterval: 5200,
    steps: [
      "Reading document",
      "Checking contact details",
      "Scanning for pressure tactics",
      "Verifying document structure",
      "Finalizing trust verdict",
    ],
    findings: [
      { text: "Document structure mapped", type: "info", step: 0 },
      { text: "Contact details extracted", type: "info", step: 1 },
      { text: "Urgency language detected", type: "danger", step: 2 },
      { text: "Pressure tactics found", type: "warning", step: 2 },
      { text: "Sender identity unverified", type: "warning", step: 3 },
      { text: "Risk indicators tallied", type: "info", step: 3 },
    ],
    regions: [
      { top: 6,  height: 9,  color: "bg-blue-100/50 dark:bg-blue-900/20",   step: 0 },
      { top: 22, height: 8,  color: "bg-amber-100/60 dark:bg-amber-900/20",  chipText: "Contact info",  chipType: "warning", step: 1 },
      { top: 40, height: 11, color: "bg-red-100/70 dark:bg-red-900/25",      chipText: "Pressure lang", chipType: "danger",  step: 2 },
      { top: 60, height: 7,  color: "bg-amber-100/55 dark:bg-amber-900/15",  chipText: "Urgency trigger", chipType: "warning", step: 2 },
      { top: 75, height: 9,  color: "bg-blue-100/45 dark:bg-blue-900/15",    step: 3 },
    ],
    docLines: 18,
    footerText: "This typically takes 20–30 seconds.",
    progressLabel: "Risk Confidence",
  },
  "contract-review": {
    ToolIcon: Scale,
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "Contract Review",
    accent: "border-amber-200/60 dark:border-amber-900/40",
    accentBg: "bg-amber-50 dark:bg-amber-950/30",
    accentText: "text-amber-700 dark:text-amber-300",
    scanGlow: "rgb(245 158 11 / 0.5)",
    scanLineClass: "bg-amber-500",
    stepInterval: 7000,
    steps: [
      "Reading contract",
      "Identifying clauses",
      "Flagging risky language",
      "Checking missing protections",
      "Preparing your review",
    ],
    findings: [
      { text: "Contract clauses mapped", type: "info", step: 0 },
      { text: "Payment clause — Fair", type: "success", step: 1 },
      { text: "IP clause — Red flag", type: "danger", step: 2 },
      { text: "Termination — Watch out", type: "warning", step: 2 },
      { text: "Missing: revision cap", type: "warning", step: 3 },
      { text: "Missing: dispute clause", type: "warning", step: 3 },
    ],
    regions: [
      { top: 6,  height: 10, color: "bg-emerald-100/55 dark:bg-emerald-900/20", chipText: "Fair clause",  chipType: "success",  step: 0 },
      { top: 23, height: 9,  color: "bg-emerald-100/45 dark:bg-emerald-900/15", chipText: "Fair clause",  chipType: "success",  step: 1 },
      { top: 39, height: 11, color: "bg-red-100/70 dark:bg-red-900/25",         chipText: "Red flag",     chipType: "danger",   step: 2 },
      { top: 57, height: 8,  color: "bg-amber-100/65 dark:bg-amber-900/20",     chipText: "Watch out",   chipType: "warning",  step: 2 },
      { top: 72, height: 9,  color: "bg-amber-100/50 dark:bg-amber-900/15",     chipText: "Watch out",   chipType: "warning",  step: 3 },
    ],
    docLines: 20,
    footerText: "Complete reviews typically take 20–40 seconds.",
    progressLabel: "Review Completeness",
  },
  "analyze": {
    ToolIcon: FileText,
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    label: "Document Analysis",
    accent: "border-violet-200/60 dark:border-violet-900/40",
    accentBg: "bg-violet-50 dark:bg-violet-950/30",
    accentText: "text-violet-700 dark:text-violet-300",
    scanGlow: "rgb(139 92 246 / 0.5)",
    scanLineClass: "bg-violet-500",
    stepInterval: 5000,
    steps: [
      "Reading document",
      "Identifying document type",
      "Extracting key terms",
      "Finding deadlines and dates",
      "Detecting missing or required items",
      "Building plain-English summary",
      "Finalizing action plan",
    ],
    findings: [
      { text: "Document structure mapped",  type: "info",    step: 0 },
      { text: "Document type identified",   type: "success", step: 1 },
      { text: "Key terms extracted",        type: "info",    step: 2 },
      { text: "3 key dates detected",       type: "warning", step: 3 },
      { text: "Missing items flagged",      type: "warning", step: 4 },
      { text: "Action plan assembled",      type: "success", step: 5 },
    ],
    regions: [
      { top: 5,  height: 9,  color: "bg-violet-100/50 dark:bg-violet-900/20",   chipText: "Doc type", chipType: "info",    step: 0 },
      { top: 22, height: 8,  color: "bg-blue-100/50 dark:bg-blue-900/20",       chipText: "Key term", chipType: "info",    step: 1 },
      { top: 38, height: 10, color: "bg-amber-100/60 dark:bg-amber-900/20",     chipText: "Deadline", chipType: "warning", step: 2 },
      { top: 55, height: 8,  color: "bg-amber-100/55 dark:bg-amber-900/15",     chipText: "Missing",  chipType: "warning", step: 3 },
      { top: 70, height: 9,  color: "bg-emerald-100/50 dark:bg-emerald-900/20", chipText: "Action",   chipType: "success", step: 4 },
    ],
    docLines: 20,
    footerText: "Analysis typically completes in 20–35 seconds.",
    progressLabel: "Analysis Completeness",
  },
  "compare": {
    ToolIcon: GitCompare,
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    label: "Document Comparison",
    accent: "border-violet-200/60 dark:border-violet-900/40",
    accentBg: "bg-violet-50 dark:bg-violet-950/30",
    accentText: "text-violet-700 dark:text-violet-300",
    scanGlow: "rgb(139 92 246 / 0.5)",
    scanLineClass: "bg-violet-500",
    stepInterval: 6000,
    steps: [
      "Reading both versions",
      "Mapping clause structure",
      "Detecting added & removed clauses",
      "Assessing risk-level changes",
      "Building comparison report",
    ],
    findings: [
      { text: "Version A structure mapped",    type: "info",    step: 0 },
      { text: "Version B structure mapped",    type: "info",    step: 0 },
      { text: "New clause detected",           type: "warning", step: 1 },
      { text: "Removed clause found",          type: "danger",  step: 2 },
      { text: "Risk level change flagged",     type: "warning", step: 3 },
      { text: "Comparison report ready",       type: "success", step: 4 },
    ],
    regions: [
      { top: 5,  height: 9,  color: "bg-violet-100/50 dark:bg-violet-900/20",   chipText: "Version A",  chipType: "info",    step: 0 },
      { top: 22, height: 8,  color: "bg-blue-100/50 dark:bg-blue-900/20",       chipText: "New clause", chipType: "warning", step: 1 },
      { top: 38, height: 10, color: "bg-red-100/60 dark:bg-red-900/20",         chipText: "Removed",    chipType: "danger",  step: 2 },
      { top: 55, height: 8,  color: "bg-amber-100/55 dark:bg-amber-900/15",     chipText: "Risk ↑",     chipType: "warning", step: 3 },
      { top: 70, height: 9,  color: "bg-emerald-100/50 dark:bg-emerald-900/20", chipText: "Version B",  chipType: "info",    step: 4 },
    ],
    docLines: 20,
    footerText: "Comparison typically completes in 15–30 seconds.",
    progressLabel: "Comparison Completeness",
  },
  "clause-extractor": {
    ToolIcon: ListChecks,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    label: "Clause Extractor",
    accent: "border-emerald-200/60 dark:border-emerald-900/40",
    accentBg: "bg-emerald-50 dark:bg-emerald-950/30",
    accentText: "text-emerald-700 dark:text-emerald-300",
    scanGlow: "rgb(16 185 129 / 0.5)",
    scanLineClass: "bg-emerald-500",
    stepInterval: 5500,
    steps: [
      "Reading document",
      "Identifying parties & dates",
      "Extracting financial terms",
      "Finding key legal clauses",
      "Building clause summary",
    ],
    findings: [
      { text: "Document structure mapped",      type: "info",    step: 0 },
      { text: "Parties identified",             type: "success", step: 1 },
      { text: "Key dates extracted",            type: "info",    step: 1 },
      { text: "Payment terms found",            type: "warning", step: 2 },
      { text: "Termination clause detected",    type: "warning", step: 3 },
      { text: "Clause summary ready",           type: "success", step: 4 },
    ],
    regions: [
      { top: 5,  height: 9,  color: "bg-emerald-100/50 dark:bg-emerald-900/20", chipText: "Parties",    chipType: "success", step: 0 },
      { top: 22, height: 8,  color: "bg-blue-100/50 dark:bg-blue-900/20",       chipText: "Key dates",  chipType: "info",    step: 1 },
      { top: 38, height: 10, color: "bg-amber-100/60 dark:bg-amber-900/20",     chipText: "Payment",    chipType: "warning", step: 2 },
      { top: 55, height: 8,  color: "bg-amber-100/55 dark:bg-amber-900/15",     chipText: "Clause",     chipType: "warning", step: 3 },
      { top: 70, height: 9,  color: "bg-emerald-100/50 dark:bg-emerald-900/20", chipText: "Done",       chipType: "success", step: 4 },
    ],
    docLines: 20,
    footerText: "Extraction typically completes in 15–25 seconds.",
    progressLabel: "Extraction Completeness",
  },
}

const FINDING_CHIP_STYLES: Record<string, string> = {
  info:    "bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300",
  success: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300",
  danger:  "bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-900/40 text-red-700 dark:text-red-300",
}

const FINDING_ICONS: Record<string, React.ElementType> = {
  info:    AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger:  AlertTriangle,
}

const REGION_CHIP_STYLES: Record<string, string> = {
  success: "bg-emerald-500/90 text-white",
  warning: "bg-amber-500/90 text-white",
  danger:  "bg-red-500/90 text-white",
  info:    "bg-blue-500/90 text-white",
}

interface Props {
  mode: ScanMode
  fileName?: string
}

export function DocumentScanScreen({ mode, fileName }: Props) {
  const cfg = CONFIGS[mode]
  const [step, setStep] = useState(0)
  const [visibleRegions, setVisibleRegions] = useState<Set<number>>(new Set())
  const [visibleFindings, setVisibleFindings] = useState<number[]>([])

  useEffect(() => {
    const t = setInterval(() => {
      setStep(prev => Math.min(prev + 1, cfg.steps.length - 1))
    }, cfg.stepInterval)
    return () => clearInterval(t)
  }, [cfg.stepInterval, cfg.steps.length])

  useEffect(() => {
    const newRegions = new Set<number>()
    cfg.regions.forEach((r, i) => {
      if (r.step < step) newRegions.add(i)
    })
    setVisibleRegions(newRegions)

    const newFindings = cfg.findings
      .map((f, i) => ({ ...f, i }))
      .filter(f => f.step < step)
      .map(f => f.i)
    setVisibleFindings(newFindings)
  }, [step, cfg.regions, cfg.findings])

  const score = Math.min(12 + step * 18, 90)
  const { ToolIcon } = cfg

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-background/95 border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
            <ToolIcon className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-28 rounded-full bg-secondary animate-pulse" />
            <div className="h-4 w-52 rounded-full bg-secondary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

        {/* LEFT — document preview */}
        <div className="w-full lg:w-[44%] lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">

            {/* Viewer header bar */}
            <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30 flex items-center gap-2.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground/60 truncate font-mono flex-1">
                {fileName ?? (mode === "contract-review" ? "contract.pdf" : "document.pdf")}
              </span>
              <div className="flex gap-1.5 ml-auto">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-border/60" />
                ))}
              </div>
            </div>

            {/* Document body */}
            <div className="relative overflow-hidden bg-white dark:bg-zinc-950/50" style={{ height: 340 }}>

              {/* Highlighted regions */}
              {cfg.regions.map((region, i) => (
                <AnimatePresence key={i}>
                  {visibleRegions.has(i) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className={`absolute left-0 right-0 ${region.color}`}
                      style={{ top: `${region.top}%`, height: `${region.height}%` }}
                    >
                      {region.chipText && region.chipType && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, duration: 0.25 }}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${REGION_CHIP_STYLES[region.chipType]}`}
                        >
                          {region.chipText}
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}

              {/* Text line bars */}
              <div className="absolute inset-0 flex flex-col justify-start gap-0 px-5 pt-4">
                {Array.from({ length: cfg.docLines }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 mb-[9px]"
                    style={{ width: `${DOC_LINE_WIDTHS[i % DOC_LINE_WIDTHS.length]}%` }}
                  >
                    <div className="h-[6px] rounded-full bg-zinc-200/80 dark:bg-zinc-700/50" />
                  </div>
                ))}
              </div>

              {/* Moving scan line */}
              <motion.div
                className={`absolute left-0 right-0 h-[2px] ${cfg.scanLineClass} z-20 pointer-events-none`}
                style={{ boxShadow: `0 0 8px 3px ${cfg.scanGlow}` }}
                animate={{ top: ["2%", "97%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />

              {/* Scan sweep gradient following the line */}
              <motion.div
                className="absolute left-0 right-0 h-20 z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${cfg.scanGlow.replace("0.5", "0.06")}, transparent)`,
                }}
                animate={{ top: ["-5%", "82%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Viewer footer */}
            <div className={`px-4 py-2.5 border-t border-border/30 ${cfg.accentBg} flex items-center gap-2`}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${cfg.scanLineClass} flex-shrink-0`}
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={step}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`text-[11px] font-medium ${cfg.accentText}`}
                >
                  {cfg.steps[Math.min(step, cfg.steps.length - 1)]}…
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT — progress + findings */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Steps */}
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
              Analysis Progress
            </p>
            <div className="space-y-1">
              {cfg.steps.map((s, i) => {
                const done = i < step
                const current = i === step
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all duration-300 ${
                      current ? `${cfg.accentBg} border ${cfg.accent}` : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                        done
                          ? "bg-emerald-500"
                          : current
                          ? cfg.scanLineClass
                          : "bg-border/50"
                      }`}
                    >
                      {done ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : current ? (
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-300 ${
                        done
                          ? "text-muted-foreground"
                          : current
                          ? `font-semibold ${cfg.accentText}`
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {s}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live findings */}
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
              Live Findings
            </p>
            {visibleFindings.length === 0 ? (
              <p className="text-sm text-muted-foreground/35 italic">Scanning…</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {visibleFindings.map(fi => {
                    const finding = cfg.findings[fi]
                    const FIcon = FINDING_ICONS[finding.type]
                    return (
                      <motion.div
                        key={fi}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${FINDING_CHIP_STYLES[finding.type]}`}
                      >
                        <FIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {finding.text}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Score / confidence buildup */}
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                {cfg.progressLabel}
              </p>
              <motion.span
                key={score}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                className={`text-sm font-bold tabular-nums ${cfg.accentText}`}
              >
                {score}%
              </motion.span>
            </div>
            <div className="h-2 rounded-full bg-border/30 overflow-hidden">
              <motion.div
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`h-full rounded-full ${cfg.scanLineClass}`}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/45 mt-2.5">{cfg.footerText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
