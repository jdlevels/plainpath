import {
  FileText, AlertTriangle, Calendar, Users, ChevronRight, MessageSquare,
  Shield, BookOpen, EyeOff, FileSearch, GitCompare, Bookmark, CheckCircle2,
  ArrowRight, ClipboardList, FileWarning
} from "lucide-react";

function Chip({ page, section, active }: { page: number; section?: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 h-4 px-1.5 rounded text-[9px] font-medium cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/50 text-violet-200 ring-1 ring-violet-500/30"
        : "bg-violet-600/15 border border-violet-500/20 text-violet-300 hover:bg-violet-500/25 hover:border-violet-400/40"
    }`}>
      p.{page}{section ? ` · ${section}` : ""}
    </span>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      {icon && <span className="text-white/35">{icon}</span>}
      <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">{children}</p>
    </div>
  );
}

function DocPage({ pg, citationLabel, active }: { pg: number; citationLabel?: string; active?: boolean }) {
  return (
    <div className={`w-full rounded-lg border p-3.5 flex flex-col gap-1.5 transition-all ${
      active
        ? "border-violet-500/40 bg-violet-500/[0.04] ring-1 ring-violet-500/20"
        : "border-white/[0.05] bg-white/[0.015]"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/20 text-[9px]">Page {pg}</span>
        {active && citationLabel && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded bg-violet-500/20 border border-violet-500/30">
            <div className="w-1 h-1 rounded-full bg-violet-400" />
            <span className="text-violet-300/80 text-[9px]">{citationLabel}</span>
          </div>
        )}
      </div>
      {pg === 1 && (
        <div className="mb-1">
          <div className={`h-3 rounded mb-1.5 ${active ? "bg-violet-400/20" : "bg-white/[0.12]"}`} style={{ width: "62%" }} />
          <div className="h-2 rounded bg-white/[0.07]" style={{ width: "40%" }} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {[88, 76, 70, 83, 68].map((w, i) => (
          <div key={i} className={`h-[7px] rounded-sm ${active && i < 2 ? "bg-violet-400/25" : "bg-white/[0.07]"}`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {active && (
        <div className="mt-1 rounded bg-violet-500/[0.08] border border-violet-500/15 px-2 py-1">
          <p className="text-violet-300/70 text-[9px]">{citationLabel}</p>
        </div>
      )}
    </div>
  );
}

const RISKS = [
  { level: "high",   text: "Unlimited liability for confidentiality breaches with no cap.", page: 11, section: "§ 12.1", active: true },
  { level: "high",   text: "Auto-renewal clause requires 90-day written notice to cancel.", page: 8,  section: "§ 7.2" },
  { level: "medium", text: "Broad IP assignment — all work product belongs to client.", page: 6, section: "§ 6.0" },
  { level: "low",    text: "Governing law is Delaware — may complicate local disputes.", page: 12, section: "§ 14" },
];

const NEXT_STEPS = [
  { action: "Review unlimited liability exposure",   icon: <FileSearch className="w-4 h-4" />,  color: "red",    urgent: true,  tool: "Contract Review",     detail: "§ 12.1 has no cap on damages — seek a mutual liability limit before signing." },
  { action: "Confirm renewal notice deadline",        icon: <Calendar className="w-4 h-4" />,    color: "amber",  urgent: true,  tool: null,                  detail: "Cancel by October 17 or the contract auto-extends for another 12 months." },
  { action: "Negotiate IP assignment scope",          icon: <ClipboardList className="w-4 h-4" />, color: "blue", urgent: false, tool: "Ask This Document",   detail: "§ 6.0 is unusually broad — consider carving out pre-existing work." },
  { action: "Request insurance certificate",          icon: <Shield className="w-4 h-4" />,       color: "slate", urgent: false, tool: null,                  detail: "Provider must carry ≥ $2M professional liability per § 9.3." },
];

const DEADLINES = [
  { label: "Effective Date",     value: "January 15, 2025",  page: 1,  urgent: false },
  { label: "Initial Term Ends",  value: "January 15, 2026",  page: 3,  section: "§ 3.1", urgent: false },
  { label: "Renewal Cancel By",  value: "October 17, 2025",  page: 8,  section: "§ 7.2", urgent: true },
  { label: "Payment Terms",      value: "Net 30 days",        page: 5,  section: "§ 5.2", urgent: false },
];

const PARTIES = [
  { role: "Service Provider", name: "Acme Consulting LLC", detail: "Delaware LLC", page: 1 },
  { role: "Client",           name: "Stripe, Inc.",         detail: "California Corp.", page: 1 },
];

const MISSING = [
  { item: "Exhibit A — Scope of Work",   note: "Referenced but not attached.",   page: 2 },
  { item: "Insurance Certificate",        note: "Required under § 9.3.",          page: 9 },
  { item: "Form W-9 (provider)",          note: "Needed before first payment.",   page: 5 },
];

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document",    desc: "Get cited answers to any question", color: "violet" },
  { icon: <Shield className="w-3.5 h-3.5" />,        label: "Trust Check",          desc: "Verify authenticity & signatures",  color: "amber" },
  { icon: <Bookmark className="w-3.5 h-3.5" />,      label: "Clause Extractor",     desc: "Pull specific clauses for review",  color: "green" },
  { icon: <GitCompare className="w-3.5 h-3.5" />,    label: "Compare Versions",     desc: "Diff against an updated draft",     color: "sky" },
  { icon: <EyeOff className="w-3.5 h-3.5" />,        label: "Redact Sensitive Info", desc: "Remove PII before sharing",        color: "red" },
];

const TOOL_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  amber:  "text-amber-400  bg-amber-600/10  border-amber-500/20",
  blue:   "text-blue-400   bg-blue-600/10   border-blue-500/20",
  slate:  "text-white/40   bg-white/[0.04]  border-white/[0.08]",
  red:    "text-red-400    bg-red-600/10    border-red-500/20",
  green:  "text-emerald-400 bg-emerald-600/10 border-emerald-500/20",
  sky:    "text-sky-400    bg-sky-600/10    border-sky-500/20",
};

export function AnalyzeCompleted() {
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
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-emerald-600/12 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">91% confidence</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Document viewer ── */}
        <div className="w-[40%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-violet-400/70" />
            <span className="text-white/45 text-xs flex-1 truncate">Consulting Agreement — Acme Corp.pdf</span>
            <span className="text-white/20 text-xs">14 pp.</span>
          </div>
          <div className="mx-3 mt-2 mb-1 rounded-lg border border-violet-500/25 bg-violet-500/[0.07] px-3 py-1.5 flex items-center gap-2 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
            <p className="text-violet-300/80 text-[10px] flex-1">Viewing source for: Unlimited liability · p.11 · § 12.1</p>
            <button className="text-white/25 text-[10px]">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
            <DocPage pg={1} />
            <DocPage pg={8} citationLabel="Auto-renewal · § 7.2" />
            <DocPage pg={11} citationLabel="Unlimited liability · § 12.1" active />
            <DocPage pg={12} />
          </div>
          <div className="h-9 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">Page 11 of 14</span>
            <div className="flex items-center gap-1">
              {[1, 6, 8, 11, 12].map((p) => (
                <button key={p} className={`w-5 h-5 rounded text-[9px] flex items-center justify-center transition-colors ${p === 11 ? "bg-violet-600 text-white" : "text-white/25 hover:text-white/50"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Intelligence panel ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col gap-4">

            {/* Doc header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-white/90 text-sm font-semibold">Consulting Agreement</h1>
                  <div className="h-5 px-2 rounded-full border border-white/[0.08] bg-white/[0.03]">
                    <span className="text-white/35 text-[10px]">Contract</span>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-0.5">Acme Consulting LLC · Stripe, Inc. · Jan 2025 · 14 pages</p>
              </div>
            </div>

            {/* 1. Plain-English explanation */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
              <SectionTitle>Plain-English Explanation</SectionTitle>
              <p className="text-white/70 text-sm leading-relaxed">
                Acme will provide consulting services to Stripe for <strong className="text-white/90 font-medium">12 months</strong>, paid on{" "}
                <strong className="text-white/90 font-medium">Net 30 terms</strong>. The contract{" "}
                <strong className="text-white/90 font-medium">auto-renews</strong> unless cancelled with{" "}
                <strong className="text-white/90 font-medium">90 days' notice</strong> by October 17.{" "}
                All work product belongs to Stripe. There is <strong className="text-red-300 font-medium">no cap on liability</strong> for confidentiality breaches — this is the most important clause to review before signing.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <Chip page={1} />
                <Chip page={3} section="§ 3.1" />
                <Chip page={8} section="§ 7.2" />
                <Chip page={11} section="§ 12.1" active />
              </div>
            </div>

            {/* 2. Required next steps */}
            <div className="rounded-xl overflow-hidden border border-white/[0.10]" style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.08) 0%, rgba(15,15,17,0) 60%)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-violet-400" />
                  </div>
                  <p className="text-white/85 text-sm font-semibold">Required Next Steps</p>
                  <div className="ml-auto h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="text-red-300/90 text-[9px] font-medium">2 urgent</span>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-1 ml-7">Based on what PlainPath found in this document.</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {NEXT_STEPS.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3.5 py-2.5 border transition-all cursor-pointer hover:bg-white/[0.04] ${
                    a.urgent ? "border-white/[0.10] bg-white/[0.03]" : "border-white/[0.06] bg-transparent"
                  }`}>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${TOOL_COLORS[a.color]}`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-medium ${a.urgent ? "text-white/85" : "text-white/55"}`}>{a.action}</p>
                        {a.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                      </div>
                      <p className="text-white/30 text-xs leading-relaxed">{a.detail}</p>
                    </div>
                    {a.tool && (
                      <div className={`h-5 px-2 rounded text-[10px] border flex items-center shrink-0 mt-0.5 ${TOOL_COLORS[a.color]}`}>
                        {a.tool}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Key deadlines + parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <SectionTitle icon={<Calendar className="w-3.5 h-3.5 text-sky-400" />}>Key Deadlines</SectionTitle>
                <div className="flex flex-col gap-2">
                  {DEADLINES.map((d, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/30 text-[10px]">{d.label}</p>
                        <p className={`text-xs font-medium leading-tight ${d.urgent ? "text-amber-300" : "text-white/65"}`}>
                          {d.value}{d.urgent && <span className="ml-1 text-[9px] text-amber-400/70 font-normal">⚠</span>}
                        </p>
                      </div>
                      <Chip page={d.page} section={d.section} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <SectionTitle icon={<Users className="w-3.5 h-3.5 text-emerald-400" />}>Key Parties</SectionTitle>
                <div className="flex flex-col gap-3">
                  {PARTIES.map((p, i) => (
                    <div key={i}>
                      <p className="text-white/25 text-[10px] mb-0.5">{p.role}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-white/70 text-xs font-medium flex-1">{p.name}</p>
                        <Chip page={p.page} />
                      </div>
                      <p className="text-white/25 text-[10px]">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Risks */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SectionTitle icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}>Risks & Watchouts</SectionTitle>
              <div className="flex flex-col gap-2">
                {RISKS.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 border ${
                    r.level === "high"   ? "border-red-500/20 bg-red-500/[0.04]" :
                    r.level === "medium" ? "border-amber-500/18 bg-amber-500/[0.03]" :
                    "border-white/[0.05] bg-transparent"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      r.level === "high" ? "bg-red-400" : r.level === "medium" ? "bg-amber-400" : "bg-white/25"
                    }`} />
                    <p className="text-white/65 text-xs leading-relaxed flex-1">{r.text}</p>
                    <Chip page={r.page} section={r.section} active={r.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Missing items */}
            <div className="rounded-xl border border-orange-500/15 bg-orange-600/[0.04] p-3.5">
              <SectionTitle icon={<FileWarning className="w-3.5 h-3.5 text-orange-400" />}>Missing Documents</SectionTitle>
              <div className="flex flex-col gap-2">
                {MISSING.map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2 border border-orange-500/12 bg-orange-500/[0.03]">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-orange-400/60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs font-medium">{m.item}</p>
                      <p className="text-white/30 text-[10px] mt-0.5">{m.note}</p>
                    </div>
                    <Chip page={m.page} />
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Recommended follow-up tools */}
            <div>
              <SectionTitle icon={<BookOpen className="w-3.5 h-3.5 text-white/30" />}>Recommended Follow-up Tools</SectionTitle>
              <div className="grid grid-cols-1 gap-2">
                {TOOLS.map((tool, i) => (
                  <button key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${TOOL_COLORS[tool.color]}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs font-medium leading-none mb-0.5">{tool.label}</p>
                      <p className="text-white/28 text-[10px] leading-none">{tool.desc}</p>
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
