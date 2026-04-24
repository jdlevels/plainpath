import {
  FileText, AlertTriangle, Calendar, ChevronRight, MessageSquare,
  Upload, ArrowRight, Info, X
} from "lucide-react";

function Chip({ page, section, uncertain }: { page: number; section?: string; uncertain?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded text-[9px] font-mono font-medium cursor-pointer transition-all ${
      uncertain
        ? "bg-amber-500/18 border border-amber-400/28 text-amber-300/75"
        : "bg-violet-600/12 border border-violet-500/18 text-violet-300/80"
    }`}>
      {uncertain && "~"}p.{page}{section ? ` · ${section}` : ""}
    </span>
  );
}

function Label({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/30 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/28 flex-1">{children}</p>
      {right}
    </div>
  );
}

function DocPage({ pg, lines, unclear }: { pg: number; lines: number[]; unclear?: boolean }) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 ${
      unclear ? "border-amber-500/18 bg-amber-500/[0.02]" : "border-white/[0.05] bg-white/[0.012]"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/18 text-[9px] font-mono">Page {pg}</span>
        {unclear && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-amber-500/12 border border-amber-500/22">
            <span className="text-amber-300/60 text-[9px]">low quality</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {lines.map((w, i) => (
          <div
            key={i}
            className={`h-[7px] rounded-sm ${unclear ? "bg-amber-500/12" : "bg-white/[0.065]"}`}
            style={{ width: `${w}%`, opacity: unclear ? 0.6 : 1 }}
          />
        ))}
      </div>
      {unclear && (
        <div className="mt-1.5 rounded border border-amber-500/10 bg-amber-500/[0.04] px-2 py-1">
          <p className="text-amber-300/45 text-[9px]">Scanned image — text extraction limited on this page</p>
        </div>
      )}
    </div>
  );
}

const PARTIAL_RISKS = [
  { level: "high",   text: "Possible auto-renewal clause detected — exact notice period is unclear.",  page: 8,  uncertain: true },
  { level: "medium", text: "Liability clause found on p.11 — scope was partially unreadable.",         page: 11, uncertain: true },
  { level: "low",    text: "Governing law appears to be Delaware.",                                    page: 12  },
];

const PARTIAL_DATES = [
  { label: "Effective Date",    value: "~January 2025",                     page: 1,  uncertain: true },
  { label: "Renewal Deadline",  value: "Could not read — check p.8 manually", page: 8,  uncertain: true },
];

const ACTIONS = [
  { label: "Upload a clearer PDF",          desc: "A text-based PDF gives significantly better results.", icon: <Upload className="w-4 h-4" />,         color: "violet", primary: true },
  { label: "Upload text-based version",     desc: "Export from the original app instead of scanning.",    icon: <FileText className="w-4 h-4" />,        color: "violet", primary: false },
  { label: "Continue with partial analysis",desc: "See what PlainPath could extract from the document.",  icon: <Info className="w-4 h-4" />,            color: "slate",  primary: false },
  { label: "Ask This Document",             desc: "Targeted questions sometimes work on poor scans.",     icon: <MessageSquare className="w-4 h-4" />, color: "blue",   primary: false, tool: true },
];

const ACTION_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  blue:   "text-blue-400   bg-blue-600/10   border-blue-500/20",
  slate:  "text-white/40   bg-white/[0.04]  border-white/[0.08]",
};

export function AnalyzeLowConf() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <span className="text-white/35 text-xs">Analyze a Document</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full bg-amber-600/12 border border-amber-500/25 flex items-center gap-1.5">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-amber-300 text-[10px] font-medium">38% confidence</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-amber-400/50 shrink-0" />
            <span className="text-white/42 text-xs flex-1 truncate">Lease Agreement — scan.pdf</span>
            <span className="text-white/18 text-xs">8 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            <DocPage pg={1} lines={[82, 66, 74, 60, 70]} />
            <DocPage pg={3} lines={[88, 72, 68, 80, 65]} />
            <DocPage pg={8} lines={[55, 40, 62, 38, 52]} unclear />
          </div>
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/18 text-xs">Page 1 of 8</span>
            <div className="flex items-center gap-1">
              {[1, 3, 8].map((p) => (
                <button key={p} className="w-6 h-6 rounded-md text-[9px] flex items-center justify-center text-white/22 hover:text-white/45 hover:bg-white/[0.04]">{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: intelligence panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* Doc header */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/88 text-sm font-semibold">Lease Agreement — scan.pdf</h1>
                  <span className="h-4 px-1.5 rounded border border-amber-500/20 bg-amber-600/8 text-amber-300/70 text-[9px]">Scanned PDF</span>
                </div>
                <p className="text-white/28 text-[10px]">8 pages · text extraction limited</p>
              </div>
            </div>

            {/* Confidence warning */}
            <div className="rounded-xl border border-amber-500/25 bg-amber-600/[0.06] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-300 text-sm font-semibold mb-1.5">Partial analysis — low scan quality</p>
                  <p className="text-white/45 text-xs leading-relaxed">
                    PlainPath could read part of this document, but the scan quality limits confidence.
                    About <strong className="text-white/65">38%</strong> of the text was readable. Items marked with{" "}
                    <span className="text-amber-300 font-mono text-[10px]">~</span> are estimates — verify manually.
                  </p>
                </div>
                <button className="text-white/20 hover:text-white/40 shrink-0 mt-0.5 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* What to do next */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{
              background: "linear-gradient(140deg, rgba(109,40,217,0.07) 0%, rgba(12,12,15,0) 55%)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/28 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <p className="text-white/85 text-sm font-semibold">What would you like to do?</p>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {ACTIONS.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border transition-all cursor-pointer hover:bg-white/[0.03] ${
                    a.primary ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06]"
                  }`}>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${ACTION_COLORS[a.color]}`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-[13px] font-medium ${a.primary ? "text-white/88" : "text-white/50"}`}>{a.label}</p>
                        {a.primary && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                      </div>
                      <p className="text-white/28 text-[10px] leading-relaxed">{a.desc}</p>
                    </div>
                    {(a as any).tool && (
                      <span className={`h-5 px-2 rounded text-[9px] border flex items-center shrink-0 mt-0.5 font-medium ${ACTION_COLORS[a.color]}`}>
                        Ask This Doc
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0 mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Partial plain-English */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Label>Partial Explanation</Label>
              <p className="text-white/50 text-sm leading-relaxed">
                This appears to be a residential lease for 42 Oak Street. The term and rent amount were not clearly readable on this scan. A possible auto-renewal clause was detected on page 8 — <span className="text-amber-300/80">notice period could not be confirmed</span>.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <Chip page={1} />
                <Chip page={8} section="§ 7" uncertain />
              </div>
            </div>

            {/* Partial risks */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Label
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />}
                right={<span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">verify manually</span>}
              >
                Partial Risks
              </Label>
              <div className="flex flex-col gap-2">
                {PARTIAL_RISKS.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${
                    r.level === "high" ? "border-red-500/15 bg-red-500/[0.03]" :
                    r.level === "medium" ? "border-amber-500/12 bg-amber-500/[0.02]" :
                    "border-white/[0.05]"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${
                      r.level === "high" ? "bg-red-400/70" : r.level === "medium" ? "bg-amber-400/70" : "bg-white/22"
                    }`} />
                    <p className="text-white/48 text-xs leading-relaxed flex-1">{r.text}</p>
                    <Chip page={r.page} uncertain={r.uncertain} />
                  </div>
                ))}
              </div>
            </div>

            {/* Partial dates */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Label icon={<Calendar className="w-3.5 h-3.5 text-sky-400/55" />}>Key Dates (partial)</Label>
              <div className="flex flex-col gap-2.5">
                {PARTIAL_DATES.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white/28 text-[10px] mb-0.5">{d.label}</p>
                      <p className={`text-xs font-medium ${d.uncertain ? "text-amber-300/70" : "text-white/65"}`}>{d.value}</p>
                    </div>
                    <Chip page={d.page} uncertain={d.uncertain} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
