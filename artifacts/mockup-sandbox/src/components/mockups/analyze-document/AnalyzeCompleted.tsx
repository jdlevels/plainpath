import {
  FileText, AlertTriangle, Calendar, Users, ChevronRight, MessageSquare,
  Shield, EyeOff, FileSearch, Bookmark, CheckCircle2, ArrowRight,
  GitCompare, FileWarning, Zap, X
} from "lucide-react";

// ─── Shared primitives ──────────────────────────────────────────────────────

function Chip({ page, section, active, onClick }: {
  page: number; section?: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded text-[9px] font-mono font-medium cursor-pointer transition-all ${
        active
          ? "bg-violet-500/35 border border-violet-400/60 text-violet-100 ring-1 ring-violet-500/40 shadow-[0_0_8px_rgba(139,92,246,0.25)]"
          : "bg-violet-600/12 border border-violet-500/18 text-violet-300/80 hover:bg-violet-500/22 hover:border-violet-400/35 hover:text-violet-200"
      }`}
    >
      p.{page}{section ? ` · ${section}` : ""}
    </button>
  );
}

function Label({ children, icon, right }: {
  children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/30 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/28 flex-1">{children}</p>
      {right}
    </div>
  );
}

// ─── Fake PDF pages ──────────────────────────────────────────────────────────

const PAGES_DATA = [
  { pg: 1,  lines: [88, 72, 80, 65, 78], title: true,  active: false },
  { pg: 6,  lines: [85, 70, 77, 65, 90], active: false },
  { pg: 11, lines: [90, 68, 75, 82, 60], active: true, citationLabel: "Unlimited liability · § 12.1" },
  { pg: 12, lines: [78, 62, 88, 70, 75], active: false },
];

function DocPage({ pg, lines, title, active, citationLabel }: {
  pg: number; lines: number[]; title?: boolean; active?: boolean; citationLabel?: string;
}) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 transition-all duration-300 ${
      active
        ? "border-violet-500/45 bg-violet-500/[0.05] ring-1 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
        : "border-white/[0.05] bg-white/[0.012]"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[9px] font-mono ${active ? "text-violet-300/60" : "text-white/20"}`}>
          Page {pg}
        </span>
        {active && citationLabel && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
            <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-200/80 text-[9px]">{citationLabel}</span>
          </div>
        )}
      </div>
      {title && (
        <div className="mb-1.5">
          <div className="h-3 rounded mb-1.5 bg-white/[0.12]" style={{ width: "58%" }} />
          <div className="h-2 rounded bg-white/[0.07]" style={{ width: "38%" }} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {lines.map((w, i) => (
          <div
            key={i}
            className={`h-[7px] rounded-sm transition-all duration-300 ${
              active && i < 3 ? "bg-violet-400/28" : "bg-white/[0.065]"
            }`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      {active && (
        <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.07] px-2.5 py-1.5">
          <p className="text-violet-200/65 text-[9px] leading-relaxed">
            § 12.1 — Liability: Provider's aggregate liability shall not be limited. All confidentiality breaches…
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Risk rows ───────────────────────────────────────────────────────────────

const RISKS = [
  { level: "critical", text: "Unlimited liability — no cap on damages for confidentiality breaches.", page: 11, section: "§ 12.1", active: true },
  { level: "high",     text: "Auto-renewal requires 90-day written notice to cancel.",               page: 8,  section: "§ 7.2" },
  { level: "medium",   text: "Broad IP assignment — all work product belongs to client.",            page: 6,  section: "§ 6.0" },
  { level: "low",      text: "Governing law is Delaware — may complicate local disputes.",           page: 12, section: "§ 14"  },
];

const RISK_STYLES: Record<string, { row: string; dot: string; label: string; badge: string }> = {
  critical: { row: "border-red-500/25 bg-red-500/[0.05]",   dot: "bg-red-400",    label: "text-red-300",   badge: "bg-red-600/12 text-red-300 border-red-500/20" },
  high:     { row: "border-red-500/15 bg-red-500/[0.03]",   dot: "bg-red-400/70", label: "text-red-300/70",badge: "bg-red-600/8 text-red-300/70 border-red-500/15" },
  medium:   { row: "border-amber-500/15 bg-amber-500/[0.02]",dot: "bg-amber-400",  label: "text-amber-300/70",badge: "" },
  low:      { row: "border-white/[0.05] bg-transparent",    dot: "bg-white/25",   label: "",               badge: "" },
};

// ─── Next steps ──────────────────────────────────────────────────────────────

const NEXT_STEPS = [
  { action: "Review unlimited liability clause",   icon: <FileSearch className="w-4 h-4" />,  color: "red",    urgent: true,  tool: "Contract Review",     detail: "§ 12.1 has no damage cap — negotiate a mutual limit before signing." },
  { action: "Set calendar alert for Oct 17 renewal", icon: <Calendar className="w-4 h-4" />, color: "amber",  urgent: true,  tool: null,                  detail: "Cancel by October 17 or the contract auto-extends 12 months." },
  { action: "Clarify IP assignment scope",          icon: <MessageSquare className="w-4 h-4" />, color: "violet", urgent: false, tool: "Ask This Document", detail: "§ 6.0 is broader than standard — ask if pre-existing work is excluded." },
];

const TOOL_COLORS: Record<string, string> = {
  red:    "text-red-400    bg-red-600/10    border-red-500/20",
  amber:  "text-amber-400  bg-amber-600/10  border-amber-500/20",
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  blue:   "text-blue-400   bg-blue-600/10   border-blue-500/20",
  slate:  "text-white/40   bg-white/[0.04]  border-white/[0.08]",
};

// ─── Key dates ───────────────────────────────────────────────────────────────

const DATES = [
  { label: "Effective Date",      value: "January 15, 2025",  page: 1,  urgent: false },
  { label: "Initial Term Ends",   value: "January 15, 2026",  page: 3,  section: "§ 3.1", urgent: false },
  { label: "Renewal Cancel By",   value: "Oct 17, 2025",      page: 8,  section: "§ 7.2", urgent: true },
  { label: "Payment Terms",       value: "Net 30 days",        page: 5,  section: "§ 5.2", urgent: false },
];

// ─── Parties ─────────────────────────────────────────────────────────────────

const PARTIES = [
  { role: "Service Provider", name: "Acme Consulting LLC", detail: "Delaware LLC", page: 1 },
  { role: "Client",           name: "Stripe, Inc.",         detail: "California Corp.", page: 1 },
];

// ─── Follow-up tools ─────────────────────────────────────────────────────────

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document",   desc: "Ask anything, get cited answers",  color: "violet" },
  { icon: <Shield className="w-3.5 h-3.5" />,        label: "Trust Check",          desc: "Verify authenticity & signatures", color: "amber" },
  { icon: <Bookmark className="w-3.5 h-3.5" />,      label: "Clause Extractor",     desc: "Pull any specific clause",         color: "green" },
  { icon: <GitCompare className="w-3.5 h-3.5" />,    label: "Compare Versions",     desc: "Diff against another draft",       color: "sky" },
];

const TOOL_BADGE_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  amber:  "text-amber-400  bg-amber-600/10  border-amber-500/20",
  green:  "text-emerald-400 bg-emerald-600/10 border-emerald-500/20",
  sky:    "text-sky-400    bg-sky-600/10    border-sky-500/20",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyzeCompleted() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <span className="text-white/35 text-xs">Analyze a Document</span>
        <div className="flex items-center gap-1 ml-1 text-white/20">
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/35 text-xs">Consulting Agreement — Acme Corp.pdf</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-emerald-600/12 border border-emerald-500/25 flex items-center gap-1.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">91% confidence</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Re-analyse
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Document viewer — 58% ── */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0">

          {/* Viewer toolbar */}
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
            <FileText className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
            <span className="text-white/50 text-xs flex-1 truncate">Consulting Agreement — Acme Corp.pdf</span>
            <span className="text-white/20 text-xs shrink-0">14 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-1">
              {["Fit", "75%", "100%"].map((z, i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium transition-colors ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/25 hover:text-white/45"}`}>{z}</button>
              ))}
            </div>
          </div>

          {/* Active source citation banner */}
          <div className="mx-3 mt-2 mb-1.5 rounded-lg border border-violet-500/30 bg-violet-500/[0.08] px-3 py-2 flex items-center gap-2.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-violet-200/90 text-[10px] font-medium">Source: Unlimited liability · p.11 · § 12.1</p>
              <p className="text-violet-300/45 text-[9px]">Jumped from Risk panel — relevant text highlighted below</p>
            </div>
            <button className="w-4 h-4 flex items-center justify-center text-white/25 hover:text-white/45 shrink-0 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Pages */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2.5">
            {PAGES_DATA.map((p) => (
              <DocPage key={p.pg} {...p} />
            ))}
          </div>

          {/* Page nav */}
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">Page 11 of 14</span>
            <div className="flex items-center gap-1">
              {[1, 6, 8, 11, 12].map((p) => (
                <button key={p} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center transition-colors ${
                  p === 11 ? "bg-violet-600 text-white" : "text-white/25 hover:text-white/50 hover:bg-white/[0.05]"
                }`}>{p}</button>
              ))}
            </div>
            <span className="text-white/15 text-[10px]">Jump to page</span>
          </div>
        </div>

        {/* ── RIGHT: Intelligence panel — 42% ── */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* Doc identity header */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/90 text-sm font-semibold">Consulting Agreement</h1>
                  <span className="h-4 px-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/35 text-[9px]">Contract</span>
                </div>
                <p className="text-white/28 text-[10px]">Acme Consulting LLC · Stripe, Inc. · January 2025 · 14 pages</p>
              </div>
            </div>

            {/* ── 1. Plain-English Summary ── */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
              <Label icon={<FileText className="w-3.5 h-3.5" />}>Plain-English Summary</Label>
              <p className="text-white/72 text-sm leading-[1.7]">
                Acme will provide consulting to Stripe for{" "}
                <strong className="text-white/92 font-semibold">12 months</strong>, paid on{" "}
                <strong className="text-white/92 font-semibold">Net 30 terms</strong>. The contract{" "}
                <strong className="text-white/92 font-semibold">auto-renews</strong> unless cancelled with{" "}
                <strong className="text-white/92 font-semibold">90 days' written notice</strong> by October 17.
                All work created under the contract belongs to Stripe.
                The most urgent issue is a{" "}
                <strong className="text-red-300 font-semibold">liability clause with no cap</strong> — it must be negotiated before signing.
              </p>
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <Chip page={1} />
                <Chip page={3} section="§ 3.1" />
                <Chip page={8} section="§ 7.2" />
                <Chip page={11} section="§ 12.1" active />
              </div>
            </div>

            {/* ── 2. Confidence & Risk Status ── */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <Label icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />}
                right={<span className="text-[9px] text-white/20">4 findings</span>}>
                Risks & Confidence
              </Label>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-7 px-3 rounded-lg border border-red-500/25 bg-red-500/[0.07] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-300 text-xs font-medium">1 critical risk</span>
                </div>
                <div className="h-7 px-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-amber-300 text-xs font-medium">1 high</span>
                </div>
                <div className="h-7 px-3 rounded-lg border border-white/[0.07] bg-white/[0.02] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/25" />
                  <span className="text-white/40 text-xs">2 low</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {RISKS.map((r, i) => {
                  const s = RISK_STYLES[r.level];
                  return (
                    <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border transition-all cursor-pointer hover:brightness-110 ${s.row}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${s.dot}`} />
                      <p className="text-white/62 text-xs leading-relaxed flex-1">{r.text}</p>
                      <Chip page={r.page} section={r.section} active={r.active} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 3. Required Next Steps ── */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{
              background: "linear-gradient(140deg, rgba(109,40,217,0.09) 0%, rgba(12,12,15,0) 55%)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/88 text-sm font-semibold leading-none mb-0.5">Required Next Steps</p>
                    <p className="text-white/28 text-[10px]">Based on what PlainPath found in this document.</p>
                  </div>
                  <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="text-red-300/90 text-[9px] font-medium">2 urgent</span>
                  </div>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {NEXT_STEPS.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border transition-all cursor-pointer hover:bg-white/[0.03] ${
                    a.urgent ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06] bg-transparent"
                  }`}>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${TOOL_COLORS[a.color]}`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-[13px] font-medium ${a.urgent ? "text-white/88" : "text-white/50"}`}>{a.action}</p>
                        {a.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                      </div>
                      <p className="text-white/28 text-[10px] leading-relaxed">{a.detail}</p>
                    </div>
                    {a.tool && (
                      <span className={`h-5 px-2 rounded text-[9px] border flex items-center shrink-0 mt-0.5 font-medium ${TOOL_COLORS[a.color]}`}>
                        {a.tool}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 4. Key Deadlines ── */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Label icon={<Calendar className="w-3.5 h-3.5 text-sky-400/70" />}>Key Deadlines</Label>
              <div className="flex flex-col gap-2.5">
                {DATES.map((d, i) => (
                  <div key={i} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                    d.urgent ? "border border-amber-500/15 bg-amber-500/[0.03]" : ""
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/28 text-[10px] mb-0.5">{d.label}</p>
                      <p className={`text-xs font-medium ${d.urgent ? "text-amber-300" : "text-white/68"}`}>
                        {d.value}
                        {d.urgent && <span className="ml-1.5 text-amber-400/70 font-normal text-[9px]">⚠ Upcoming</span>}
                      </p>
                    </div>
                    <Chip page={d.page} section={d.section} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── 5. Key Parties ── */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Label icon={<Users className="w-3.5 h-3.5 text-emerald-400/70" />}>Key Parties</Label>
              <div className="flex flex-col gap-3">
                {PARTIES.map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg border border-white/[0.07] bg-white/[0.03] flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-white/30" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/28 text-[10px] mb-0.5">{p.role}</p>
                      <p className="text-white/72 text-xs font-medium">{p.name}</p>
                      <p className="text-white/25 text-[10px]">{p.detail}</p>
                    </div>
                    <Chip page={p.page} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── 6. Source Traceability ── */}
            <div className="rounded-xl border border-violet-500/12 bg-violet-600/[0.03] p-4">
              <Label icon={<FileWarning className="w-3.5 h-3.5 text-violet-400/60" />}>Source Traceability</Label>
              <p className="text-white/35 text-xs leading-relaxed mb-3">
                Every finding links back to the exact page and section it came from. Click any chip below to jump the viewer.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Auto-renewal clause",     page: 8,  section: "§ 7.2" },
                  { label: "Unlimited liability",      page: 11, section: "§ 12.1", active: true },
                  { label: "IP assignment",            page: 6,  section: "§ 6.0" },
                  { label: "Payment & Net 30 terms",   page: 5,  section: "§ 5.2" },
                  { label: "Governing law / Delaware", page: 12, section: "§ 14" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all cursor-pointer hover:bg-violet-500/[0.05] ${
                    item.active
                      ? "border-violet-500/30 bg-violet-500/[0.07]"
                      : "border-white/[0.06] bg-white/[0.015]"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? "bg-violet-400" : "bg-white/20"}`} />
                    <p className={`text-xs flex-1 ${item.active ? "text-white/80" : "text-white/45"}`}>{item.label}</p>
                    <Chip page={item.page} section={item.section} active={item.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Follow-up tools ── */}
            <div>
              <Label>Recommended Follow-up Tools</Label>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS.map((tool, i) => (
                  <button key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${TOOL_BADGE_COLORS[tool.color]}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/68 text-xs font-medium leading-none mb-0.5">{tool.label}</p>
                      <p className="text-white/25 text-[10px] leading-none truncate">{tool.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
