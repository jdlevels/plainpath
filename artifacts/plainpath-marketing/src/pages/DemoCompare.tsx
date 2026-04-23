// DemoCompare — visual read-only mirror of the Compare Versions workspace.
// Mimics the split-screen pane layout, per-pane headers, diff zone overlays,
// toolbar, and the right-side summary drawer from the real app.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, BarChart2, StickyNote, Download, Sparkles,
  RefreshCw, FileText, ChevronUp, ChevronDown, ZoomIn, ZoomOut,
  X, ChevronRight, XCircle, Pencil,
} from "lucide-react";
import { DemoShell } from "@/demo/DemoShell";

// ─── Static demo data ──────────────────────────────────────────────────────────

const CHANGES = [
  {
    id: "c1",
    severity: "high" as const,
    label: "Text Modified",
    page: "p.3→3",
    preview: "…in perpetuity, with no time limitation",
    ai_category: "legal_language",
    ai_explanation: "Confidentiality term changed from 2 years to perpetual — a critical risk escalation.",
  },
  {
    id: "c2",
    severity: "high" as const,
    label: "Text Modified",
    page: "p.4→4",
    preview: "…payment terms reduced from Net 60 to Net 15",
    ai_category: "financial_value",
    ai_explanation: "Payment window shortened by 75%. Cash-flow impact is significant.",
  },
  {
    id: "c3",
    severity: "medium" as const,
    label: "Text Modified",
    page: "p.5→5",
    preview: "…State of California → State of Delaware",
    ai_category: "legal_language",
    ai_explanation: "Jurisdiction change. Delaware enforces NDAs more strictly.",
  },
  {
    id: "c4",
    severity: "low" as const,
    label: "Text Added",
    page: "p.7 rev",
    preview: "…Information that becomes generally known…",
    ai_category: null,
    ai_explanation: "Standard public-domain exclusion clause — generally favorable.",
  },
];

// ─── Diff zones: [top%, left%, width%, height%, severity, label] ──────────────

const ORIG_ZONES = [
  { top: 18, left: 8, w: 82, h: 6, sev: "high",   label: "§3 Confidentiality" },
  { top: 54, left: 8, w: 60, h: 5, sev: "medium",  label: "§5 Jurisdiction" },
];

const REV_ZONES = [
  { top: 18, left: 8, w: 82, h: 6, sev: "high",   label: "§3 Confidentiality" },
  { top: 32, left: 8, w: 72, h: 5, sev: "high",   label: "§4 Payment" },
  { top: 54, left: 8, w: 60, h: 5, sev: "medium",  label: "§5 Jurisdiction" },
  { top: 74, left: 8, w: 78, h: 5, sev: "low",    label: "§7 Exclusions (new)" },
];

function sevZoneClass(sev: string) {
  switch (sev) {
    case "high":   return "border-red-500/80 bg-red-400/[0.18] border-dashed"
    case "medium": return "border-amber-500/80 bg-amber-400/[0.18] border-dashed"
    default:       return "border-neutral-400/70 bg-neutral-400/[0.12] border-dashed"
  }
}

function sevBadge(sev: string) {
  switch (sev) {
    case "high":   return "bg-red-100 text-red-700 border border-red-300/60 dark:bg-red-950/60 dark:text-red-300"
    case "medium": return "bg-amber-100 text-amber-700 border border-amber-300/60 dark:bg-amber-950/50 dark:text-amber-300"
    default:       return "bg-neutral-100 text-neutral-600 border border-neutral-300/50 dark:bg-neutral-800/60 dark:text-neutral-400"
  }
}

function aiCatClass(cat: string) {
  switch (cat) {
    case "legal_language": return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50"
    case "financial_value": return "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50"
    default: return "bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 border border-neutral-200/40"
  }
}

// ─── Mock document lines ───────────────────────────────────────────────────────

function DocLines({ side }: { side: "orig" | "rev" }) {
  const lines = [
    { w: "92%", top: 6 },
    { w: "88%", top: 10 },
    { w: "60%", top: 14 },
    { w: "90%", top: 24 }, // §3 zone start
    { w: "84%", top: 28 },
    { w: side === "rev" ? "78%" : "88%", top: 37 }, // payment line — shorter in rev
    { w: "80%", top: 41 },
    { w: "65%", top: 45 },
    { w: "86%", top: 56 }, // §5 zone
    { w: "70%", top: 60 },
    { w: "40%", top: 64 },
    { w: "88%", top: 70 },
    { w: side === "rev" ? "75%" : "0%", top: 75 }, // §7 new clause (only rev)
    { w: side === "rev" ? "60%" : "0%", top: 79 },
    { w: "72%", top: 88 },
    { w: "44%", top: 92 },
  ]
  return (
    <div className="absolute inset-0">
      {lines.map((l, i) => (
        <div
          key={i}
          className={`absolute rounded-sm h-[2px] transition-all ${
            side === "rev" && (i === 6)
              ? "bg-red-300/70 dark:bg-red-700/50"
              : "bg-neutral-300/60 dark:bg-neutral-600/40"
          }`}
          style={{ left: "4%", top: `${l.top}%`, width: l.w }}
        />
      ))}
      {/* Page number */}
      <span className="absolute top-2 right-2 text-[8px] font-mono bg-black/30 text-white px-1 py-0.5 rounded">
        1 / 8
      </span>
    </div>
  )
}

// ─── Pane ─────────────────────────────────────────────────────────────────────

function DocPane({
  label, fileName, accentClass, zones, selectedId, onSelect,
}: {
  label: string
  fileName: string
  accentClass: string
  zones: typeof ORIG_ZONES
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Pane header */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100/95 dark:bg-zinc-800/95 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0 ${accentClass}`}>
          {label}
        </span>
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums mr-0.5">1/8</span>
          <button className="p-0.5 rounded hover:bg-muted/70 opacity-40 cursor-default transition-colors">
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </button>
          <button className="p-0.5 rounded hover:bg-muted/70 transition-colors">
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
        {/* Zoom controls (static/decorative) */}
        <div className="flex items-center gap-0 border border-border/50 rounded-md overflow-hidden flex-shrink-0">
          <div className="px-1 py-0.5 text-muted-foreground/50 cursor-default"><ZoomOut className="w-3 h-3" /></div>
          <div className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-muted/80 text-foreground border-x border-border/40">Fit</div>
          <div className="px-1 py-0.5 text-muted-foreground/50 cursor-default"><ZoomIn className="w-3 h-3" /></div>
        </div>
      </div>

      {/* Document body */}
      <div className="flex-1 overflow-hidden bg-neutral-200/60 dark:bg-zinc-900/70 p-4">
        <div className="w-full h-full rounded-lg overflow-hidden border border-border/30 shadow-sm bg-white dark:bg-zinc-100/5 relative">
          <DocLines side={label.startsWith("Baseline") ? "orig" : "rev"} />
          {/* Diff zone overlays */}
          {zones.map((zone, i) => (
            <div
              key={i}
              className={`absolute border-2 rounded transition-all cursor-pointer pointer-events-auto ${sevZoneClass(zone.sev)}`}
              style={{ top: `${zone.top}%`, left: `${zone.left}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
              title={zone.label}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Summary Drawer ────────────────────────────────────────────────────────────

function SummaryDrawer({
  open, onClose, selectedId, onSelect,
}: {
  open: boolean
  onClose: () => void
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [sevFilter, setSevFilter] = useState<"all" | "high" | "medium" | "low">("all")

  if (!open) return null

  const visible = sevFilter === "all" ? CHANGES : CHANGES.filter((c) => c.severity === sevFilter)
  const counts = { high: 2, medium: 1, low: 1 }

  const tabs = [
    { key: "all", label: "All", count: 4 },
    { key: "high", label: "High", count: 2 },
    { key: "medium", label: "Med", count: 1 },
    { key: "low", label: "Low", count: 1 },
  ] as const

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex flex-col w-[340px] max-w-[92vw] bg-background border-l border-border/60 shadow-xl animate-in slide-in-from-right-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Summary</span>
          <span className="text-[10px] text-muted-foreground font-mono">4 changes</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-md p-0.5">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setSevFilter(key)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  sevFilter === key
                    ? key === "high"   ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                    : key === "medium" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                    : key === "low"    ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    :                   "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}<span className="opacity-60 ml-0.5">({count})</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column header */}
      <div className="flex items-center gap-0 px-2 py-1 bg-muted/20 border-b border-border/20 flex-shrink-0">
        <div className="w-7 flex-shrink-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">☑</span>
        </div>
        <span className="flex-1 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider pl-2">Change</span>
        <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider pr-1">✕</span>
        <div style={{ minWidth: "60px" }} />
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {visible.map((item) => {
          const isSelected = selectedId === item.id
          return (
            <div
              key={item.id}
              className={`flex items-stretch gap-0 transition-colors cursor-pointer ${
                isSelected ? "bg-violet-50 dark:bg-violet-950/30" : "hover:bg-muted/30"
              }`}
              onClick={() => onSelect(item.id)}
            >
              <div className={`w-0.5 flex-shrink-0 rounded-l ${isSelected ? "bg-violet-500" : "bg-transparent"}`} />
              <div className="flex-1 flex items-start gap-2 pr-2 py-2.5">
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${sevBadge(item.severity)}`}>
                  {item.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-foreground truncate">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.page}</span>
                    {item.ai_category && (
                      <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-px rounded font-semibold ${aiCatClass(item.ai_category)}`}>
                        <Sparkles className="w-2 h-2" />
                        {item.ai_category.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.preview}</p>
                  {item.ai_explanation && (
                    <p className="text-[10px] text-violet-600/80 dark:text-violet-400/80 mt-0.5 leading-snug line-clamp-2">
                      {item.ai_explanation}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center px-1 flex-shrink-0 text-muted-foreground/40">
                <XCircle className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center pr-1.5 flex-shrink-0">
                <div className="text-[10px] font-semibold rounded border border-border/50 bg-muted/40 px-1 py-0.5 text-center text-muted-foreground" style={{ minWidth: "52px" }}>
                  {item.severity.slice(0, 3).replace("hig", "High").replace("med", "Med").replace("low", "Low")}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Demo page ─────────────────────────────────────────────────────────────────

export default function DemoCompare() {
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>("c1")

  return (
    <DemoShell
      toolName="Compare Versions"
      subtitle="Upload two PDF versions and see every change — side-by-side, with severity classification, AI context, and diff navigation. Read-only preview."
      scenarioLabel="NDA v1 vs NDA v2 · 4 changes · 2 high"
    >
      {/* ── Workspace shell: thin toolbar + split panes ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/60 overflow-hidden shadow-lg"
        style={{ height: "clamp(440px, 58vh, 640px)" }}
      >
        {/* Thin toolbar */}
        <div className="flex items-center justify-between px-2.5 py-1 border-b border-border/60 bg-background/95 backdrop-blur-sm flex-shrink-0 gap-1.5">
          {/* Left */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1 rounded text-muted-foreground/50">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 leading-none">
              <p className="text-[13px] font-semibold truncate max-w-[180px] leading-tight text-foreground">
                NDA_Draft_v1 vs NDA_Draft_v2
              </p>
              <div className="flex items-center gap-1.5 mt-px">
                <p className="text-[10px] text-muted-foreground leading-none">Compare Versions</p>
                <span className="text-[10px] font-mono text-muted-foreground leading-none">· 4 changes</span>
                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 leading-none">· 2 high</span>
              </div>
            </div>
          </div>

          {/* Right: static toolbar buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Diff nav */}
            <div className="flex items-center gap-0 border border-border/50 rounded-md overflow-hidden">
              <div className="px-1 py-0.5 text-muted-foreground/50"><ChevronUp className="w-3 h-3" /></div>
              <span className="px-1.5 text-[10px] font-mono text-muted-foreground border-x border-border/40 py-0.5">1/4</span>
              <div className="px-1 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer transition-colors"><ChevronDown className="w-3 h-3" /></div>
            </div>

            {/* Density */}
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-border/50 text-muted-foreground">
              Comfy
            </div>

            {/* Rescan */}
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-border/50 text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Rescan</span>
            </div>

            {/* AI Review */}
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-violet-300/60 text-violet-700 dark:text-violet-300 bg-violet-50/40 dark:bg-violet-950/20">
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AI Review</span>
            </div>

            {/* Report */}
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-border/50 text-muted-foreground">
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Report</span>
            </div>

            {/* Summary — active */}
            <button
              onClick={() => setSummaryOpen((o) => !o)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                summaryOpen
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300/60"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <span className="hidden sm:inline">Summary</span>
            </button>

            {/* Notes */}
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-border/50 text-muted-foreground">
              <StickyNote className="w-3 h-3" />
              <span className="hidden sm:inline">Notes</span>
            </div>
          </div>
        </div>

        {/* Split pane area */}
        <div className="flex flex-1 overflow-hidden relative" style={{ height: "calc(100% - 36px)" }}>
          {/* Left — Baseline */}
          <div className="flex flex-col h-full overflow-hidden flex-shrink-0" style={{ width: "50%" }}>
            <DocPane
              label="Baseline · Read only"
              fileName="NDA_Draft_v1.pdf"
              accentClass="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              zones={ORIG_ZONES}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {/* Drag handle (decorative) */}
          <div className="flex items-center justify-center w-2 flex-shrink-0 bg-border/40">
            <div className="w-0.5 h-8 rounded-full bg-border/80" />
          </div>

          {/* Right — Revised */}
          <div className="flex flex-col h-full overflow-hidden flex-1">
            <DocPane
              label="Revised · Read only"
              fileName="NDA_Draft_v2.pdf"
              accentClass="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              zones={REV_ZONES}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {/* Summary drawer */}
          <SummaryDrawer
            open={summaryOpen}
            onClose={() => setSummaryOpen(false)}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setSummaryOpen(true) }}
          />
        </div>
      </motion.div>

      {/* Caption */}
      <p className="text-xs text-muted-foreground/60 text-center mt-4">
        Split-screen PDF comparison · highlighted diff zones · AI-categorized changes · right-side summary — all read-only in this preview.
      </p>
    </DemoShell>
  );
}
