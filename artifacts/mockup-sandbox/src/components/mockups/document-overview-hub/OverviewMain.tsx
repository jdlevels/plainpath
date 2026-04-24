import { FileText, AlertTriangle, Calendar, Users, ChevronRight, MessageSquare, Shield, BookOpen, Clock, EyeOff, Search, FileSearch, GitCompare, Bookmark, CheckCircle2, ArrowRight } from "lucide-react";

// ──────────────── Citation chip ─────────────────
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

// ──────────────── Fake doc viewer pages ──────────
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
          <div className={`h-3 rounded mb-1.5 ${active ? "bg-violet-400/20" : "bg-white/[0.12]"}`} style={{ width: "60%" }} />
          <div className="h-2 rounded bg-white/[0.07]" style={{ width: "42%" }} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {[90, 78, 68, 84, 72].map((w, i) => (
          <div key={i} className={`h-[7px] rounded-sm ${active && i < 2 ? "bg-violet-400/25" : "bg-white/[0.07]"}`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {active && (
        <div className="mt-1 rounded bg-violet-500/[0.08] border border-violet-500/15 px-2 py-1">
          <p className="text-violet-300/70 text-[9px]">Auto-renewal clause — § 7.2</p>
        </div>
      )}
    </div>
  );
}

const RISKS = [
  { level: "high",   text: "Auto-renewal clause — requires 90-day written notice to cancel.", page: 8, section: "§ 7.2", activeChip: true },
  { level: "medium", text: "Unlimited liability for confidentiality breaches.", page: 11, section: "§ 12.1" },
  { level: "low",    text: "Governing law is Delaware — may affect dispute resolution.", page: 12, section: "§ 14" },
];

const DATES = [
  { label: "Effective Date",      value: "January 15, 2025",  page: 1, urgent: false },
  { label: "Initial Term",        value: "12 months",          page: 3, section: "§ 3.1", urgent: false },
  { label: "Renewal Deadline",    value: "October 17, 2025",   page: 8, section: "§ 7.2", urgent: true },
  { label: "Payment Terms",       value: "Net 30 days",        page: 5, section: "§ 5.2", urgent: false },
];

const PARTIES = [
  { role: "Service Provider", name: "Acme Consulting LLC", detail: "Delaware LLC", page: 1 },
  { role: "Client",           name: "Stripe, Inc.",         detail: "California Corp.", page: 1 },
];

const OBLIGATIONS = [
  { party: "Provider", text: "Deliver monthly status reports by the 5th of each month.", page: 4 },
  { party: "Provider", text: "Maintain professional liability insurance ≥ $2M.",           page: 9 },
  { party: "Client",   text: "Provide timely access to systems and personnel.",             page: 4 },
  { party: "Client",   text: "Pay invoices within 30 days of receipt.",                     page: 5 },
];

const NEXT_ACTIONS = [
  { action: "Review auto-renewal clause now",           tool: "Ask This Document",  color: "violet", icon: <MessageSquare className="w-4 h-4" />, urgent: true,  detail: "Ask when the renewal deadline is and what notice is required." },
  { action: "Check unlimited liability exposure",       tool: "Contract Review",    color: "blue",   icon: <FileSearch className="w-4 h-4" />,  urgent: true,  detail: "Get a full risk assessment of § 12.1 before signing." },
  { action: "Verify insurance certificate on file",     tool: null,                 color: "slate",  icon: <Shield className="w-4 h-4" />,      urgent: false, detail: "Confirm coverage is ≥ $2M as required by § 9.3." },
  { action: "Redact before sharing with third parties", tool: "Redact Sensitive Info", color: "red", icon: <EyeOff className="w-4 h-4" />,     urgent: false, detail: "Remove party names and financial terms." },
];

const TOOL_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  blue:   "text-blue-400 bg-blue-600/10 border-blue-500/20",
  slate:  "text-white/40 bg-white/[0.04] border-white/[0.08]",
  red:    "text-red-400 bg-red-600/10 border-red-500/20",
};

const QUESTIONS = [
  "What happens if I miss the October renewal deadline?",
  "Can the client terminate early without penalty?",
  "What does unlimited liability actually cover?",
];

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document",   desc: "Ask anything, get cited answers", color: "violet" },
  { icon: <Search className="w-3.5 h-3.5" />,        label: "Trust Check",          desc: "Verify signatures & authenticity", color: "amber" },
  { icon: <FileSearch className="w-3.5 h-3.5" />,    label: "Contract Review",      desc: "Full legal risk analysis", color: "blue" },
  { icon: <Bookmark className="w-3.5 h-3.5" />,      label: "Clause Extractor",     desc: "Pull any specific clause", color: "green" },
  { icon: <GitCompare className="w-3.5 h-3.5" />,    label: "Compare Versions",     desc: "Diff against another draft", color: "sky" },
  { icon: <EyeOff className="w-3.5 h-3.5" />,        label: "Redact Sensitive Info", desc: "Remove PII before sharing", color: "red" },
];

const ALL_TOOL_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  amber:  "text-amber-400 bg-amber-600/10 border-amber-500/20",
  blue:   "text-blue-400 bg-blue-600/10 border-blue-500/20",
  green:  "text-emerald-400 bg-emerald-600/10 border-emerald-500/20",
  sky:    "text-sky-400 bg-sky-600/10 border-sky-500/20",
  red:    "text-red-400 bg-red-600/10 border-red-500/20",
};

export function OverviewMain() {
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
        <span className="text-white/35 text-xs">Document Overview</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-emerald-600/12 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">94% confidence</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Document viewer ── */}
        <div className="w-[40%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-violet-400/70" />
            <span className="text-white/45 text-xs flex-1 truncate">NDA — Stripe Inc.pdf</span>
            <span className="text-white/20 text-xs">12 pp.</span>
          </div>
          {/* Active citation banner */}
          <div className="mx-3 mt-2 mb-1 rounded-lg border border-violet-500/25 bg-violet-500/[0.07] px-3 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
            <p className="text-violet-300/80 text-[10px] flex-1">Viewing source for: Auto-renewal clause · p.8 · § 7.2</p>
            <button className="text-white/25 text-[10px] hover:text-white/45">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
            <DocPage pg={1} />
            <DocPage pg={8} citationLabel="Auto-renewal · § 7.2" active />
            <DocPage pg={9} />
          </div>
          <div className="h-9 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">Page 8 of 12</span>
            <div className="flex items-center gap-1">
              {[1,8,9,11,12].map((p) => (
                <button key={p} className={`w-5 h-5 rounded text-[9px] flex items-center justify-center transition-colors ${p === 8 ? "bg-violet-600 text-white" : "text-white/25 hover:text-white/50"}`}>{p}</button>
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
                  <h1 className="text-white/90 text-sm font-semibold">Non-Disclosure Agreement</h1>
                  <div className="h-5 px-2 rounded-full border border-white/[0.08] bg-white/[0.03]">
                    <span className="text-white/35 text-[10px]">NDA</span>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-0.5">Acme Consulting LLC · Stripe, Inc. · January 2025 · 12 pages</p>
              </div>
            </div>

            {/* 1. Plain-English summary */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
              <SectionTitle>Plain-English Summary</SectionTitle>
              <p className="text-white/70 text-sm leading-relaxed">
                A mutual NDA where both Acme and Stripe agree not to share each other's confidential information.
                The agreement lasts <strong className="text-white/90 font-medium">12 months</strong> and{" "}
                <strong className="text-white/90 font-medium">auto-renews</strong> unless you cancel with{" "}
                <strong className="text-white/90 font-medium">90 days' written notice</strong>. Stripe pays on Net 30 terms.
                Confidentiality obligations survive termination for 3 years.
              </p>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <Chip page={1} />
                <Chip page={3} section="§ 3.1" />
                <Chip page={8} section="§ 7.2" active />
              </div>
            </div>

            {/* 2. Urgent watchouts */}
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
                    <Chip page={r.page} section={r.section} active={r.activeChip} />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Key dates + parties + obligations */}
            <div className="grid grid-cols-2 gap-3">
              {/* Dates */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <SectionTitle icon={<Calendar className="w-3.5 h-3.5 text-sky-400" />}>Key Dates</SectionTitle>
                <div className="flex flex-col gap-2">
                  {DATES.map((d, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/30 text-[10px]">{d.label}</p>
                        <p className={`text-xs font-medium leading-tight ${d.urgent ? "text-amber-300" : "text-white/65"}`}>
                          {d.value}
                          {d.urgent && <span className="ml-1 text-[9px] text-amber-400/70 font-normal">⚠</span>}
                        </p>
                      </div>
                      <Chip page={d.page} section={d.section} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Parties */}
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

            {/* Obligations */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <SectionTitle icon={<BookOpen className="w-3.5 h-3.5 text-blue-400" />}>Key Obligations</SectionTitle>
              <div className="flex flex-col gap-2">
                {OBLIGATIONS.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-4 px-1.5 rounded text-[9px] font-medium shrink-0 flex items-center ${
                      o.party === "Provider"
                        ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
                        : "bg-emerald-600/15 text-emerald-300 border border-emerald-500/20"
                    }`}>
                      {o.party}
                    </div>
                    <p className="text-white/55 text-xs leading-relaxed flex-1">{o.text}</p>
                    <Chip page={o.page} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── 4. Recommended Next Actions (hero area) ── */}
            <div className="rounded-xl overflow-hidden border border-white/[0.10]" style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.08) 0%, rgba(15,15,17,0) 60%)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-violet-400" />
                  </div>
                  <p className="text-white/85 text-sm font-semibold">Recommended Next Actions</p>
                  <div className="ml-auto h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="text-red-300/90 text-[9px] font-medium">2 urgent</span>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-1 ml-7">Based on what PlainPath found in this document.</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {NEXT_ACTIONS.map((a, i) => (
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
                      <div className="shrink-0 mt-0.5">
                        <div className={`h-5 px-2 rounded text-[10px] border flex items-center ${TOOL_COLORS[a.color]}`}>
                          {a.tool}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Suggested questions */}
            <div>
              <SectionTitle icon={<MessageSquare className="w-3.5 h-3.5 text-violet-400/60" />}>Suggested Follow-up Questions</SectionTitle>
              <div className="flex flex-col gap-1.5">
                {QUESTIONS.map((q, i) => (
                  <button key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.015] hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all text-left group">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400/50 group-hover:text-violet-400 shrink-0 transition-colors" />
                    <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors flex-1">{q}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-violet-400/50 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Tool actions */}
            <div>
              <SectionTitle>All Tools</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS.map((tool, i) => (
                  <button key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${ALL_TOOL_COLORS[tool.color]}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs font-medium leading-none mb-0.5">{tool.label}</p>
                      <p className="text-white/28 text-[10px] leading-none truncate">{tool.desc}</p>
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
