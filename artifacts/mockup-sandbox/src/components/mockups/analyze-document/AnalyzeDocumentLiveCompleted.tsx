import {
  FileText, AlertTriangle, Calendar, Users, ChevronRight, MessageSquare,
  Shield, CheckCircle2, ArrowRight, GitCompare, FileWarning, Zap, X,
  Bookmark, BookmarkCheck, ListChecks, Info
} from "lucide-react";

// ── Source chip (matches live implementation exactly) ─────────────────────
function SourceChip({ label, active, uncertain }: { label: string; active?: boolean; uncertain?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.22)]"
        : uncertain
        ? "bg-amber-500/12 border border-amber-400/22 text-amber-300/75"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {uncertain && <span className="opacity-60">~</span>}
      {label}
    </span>
  );
}

function SLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/28 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/26 flex-1">{children}</p>
      {right}
    </div>
  );
}

const SECTIONS = [
  { id: "s1", title: "Introduction & Scope", content: "This Consulting Agreement ('Agreement') is entered into as of January 15, 2025, between Acme Consulting LLC ('Consultant') and Stripe, Inc. ('Client'). The Consultant shall provide software development consulting services as outlined in Schedule A." },
  { id: "s6", title: "Intellectual Property", content: "All work product created by Consultant during the term of this Agreement, including but not limited to software, designs, documentation, and inventions, shall be considered works for hire and shall belong exclusively to Client." },
  { id: "s11", title: "Liability Limitations", content: "Provider's aggregate liability shall not be limited. All confidentiality breaches and damages arising from negligence or willful misconduct shall be borne in full by the service provider without cap or limitation on amount.", active: true },
  { id: "s12", title: "Governing Law", content: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States." },
];

function DocPage({ section, highlighted }: { section: typeof SECTIONS[0]; highlighted?: boolean }) {
  return (
    <div className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
      highlighted
        ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
        : "border-white/[0.05] bg-white/[0.015]"
    }`}>
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className={`text-[9px] font-mono ${highlighted ? "text-violet-300/60" : "text-white/18"}`}>
          Section {section.id.slice(1)}
        </span>
        {highlighted && (
          <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
            <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-200/75 text-[9px]">Source</span>
          </div>
        )}
      </div>
      {section.title && (
        <p className={`text-xs font-semibold leading-tight ${highlighted ? "text-violet-300/80" : "text-white/45"}`}>
          {section.title}
        </p>
      )}
      <p className={`text-[11px] leading-relaxed ${highlighted ? "text-white/65" : "text-white/32"}`}>
        {section.content}
      </p>
      {highlighted && (
        <div className="mt-1.5 rounded-lg border border-violet-500/18 bg-violet-500/[0.06] px-2.5 py-1.5">
          <p className="text-violet-200/60 text-[9px] leading-relaxed">Provider's aggregate liability shall not be limited…</p>
        </div>
      )}
    </div>
  );
}

export function AnalyzeDocumentLiveCompleted() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar — LIVE: "Re-analyze" with Zap icon, Save button, confidence badge */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight shrink-0">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5 shrink-0">·</span>
        <span className="text-white/30 text-xs shrink-0">Analyze a Document</span>
        <ChevronRight className="w-3 h-3 text-white/18 shrink-0" />
        <span className="text-white/30 text-xs truncate max-w-[200px]">Consulting Agreement — Acme Corp.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-emerald-600/12 border-emerald-500/25 text-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">91% confidence</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" />
            <span>Save</span>
          </button>
          {/* LIVE CHANGE: "Re-analyze" with Zap (was "New" with Upload) */}
          <a className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>Re-analyze</span>
          </a>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Document viewer */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">

          {/* LIVE CHANGE: Viewer toolbar — zoom controls + pp. count */}
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
            <span className="text-white/45 text-xs flex-1 truncate">Consulting Agreement — Acme Corp.pdf</span>
            <span className="text-white/18 text-xs shrink-0">4 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-0.5">
              {["Fit", "75%", "100%"].map((z, i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
              ))}
            </div>
          </div>

          {/* LIVE CHANGE: Citation banner — shows evidence text */}
          <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-violet-200/85 text-[10px] font-medium truncate">
                Source: Unlimited liability — no cap on damages for confidentiality breaches…
              </p>
              <p className="text-violet-300/40 text-[9px]">Jumped from findings panel — matching text highlighted below</p>
            </div>
            <button className="text-white/20 hover:text-white/45 shrink-0"><X className="w-3 h-3" /></button>
          </div>

          {/* Sections */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {SECTIONS.map(s => <DocPage key={s.id} section={s} highlighted={s.active} />)}
          </div>

          {/* LIVE CHANGE: Page nav footer with section jump buttons */}
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">Section 3 of 4</span>
            <div className="flex items-center gap-1">
              {[1,2,3,4].map(n => (
                <button key={n} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${n === 3 ? "bg-violet-600 text-white" : "text-white/22"}`}>{n}</button>
              ))}
            </div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: Intelligence panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/90 text-sm font-semibold">Consulting Agreement</h1>
                  <span className="h-4 px-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/35 text-[9px]">Contract</span>
                </div>
                <p className="text-white/28 text-[10px]">Acme Consulting LLC · Stripe, Inc. · January 2025 · 14 pages</p>
              </div>
            </div>

            {/* LIVE CHANGE: Plain-English Summary — FileText icon */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
              <SLabel icon={<FileText className="w-3.5 h-3.5" />}>Plain-English Summary</SLabel>
              <p className="text-white/72 text-sm leading-[1.7]">
                Acme will provide consulting to Stripe for <strong className="text-white/90">12 months</strong>, paid on <strong className="text-white/90">Net 30 terms</strong>. The contract <strong className="text-white/90">auto-renews</strong> unless cancelled with <strong className="text-amber-300">90 days' written notice</strong> by October 17. All work created belongs to Stripe. The most urgent issue is a <strong className="text-red-300">liability clause with no cap</strong> — it must be negotiated before signing.
              </p>
            </div>

            {/* LIVE CHANGE: Risk & Confidence — categorized count badges */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />}>Risk & Confidence</SLabel>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-emerald-600/12 border-emerald-500/25 text-emerald-300">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span className="text-[11px] font-medium">High confidence</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 border-red-500/25 bg-red-500/[0.07] text-red-300">
                  <span className="text-[11px] font-medium">Risk score: 72/100</span>
                </div>
              </div>
              {/* LIVE: Risk count pills row */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/22 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  <span className="text-red-300 text-[9px] font-medium">1 critical</span>
                </div>
                <div className="h-5 px-2 rounded-full bg-amber-500/8 border border-amber-500/18 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-300 text-[9px] font-medium">1 high</span>
                </div>
                <div className="h-5 px-2 rounded-full bg-white/[0.05] border border-white/[0.10] flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                  <span className="text-white/38 text-[9px] font-medium">2 low</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { title: "Unlimited liability — no cap on damages for confidentiality breaches.", sev: "high", chip: "source", active: true },
                  { title: "Auto-renewal requires 90-day written notice to cancel.", sev: "medium", chip: "source" },
                  { title: "Broad IP assignment — all work product belongs to client.", sev: "low", chip: "source" },
                ].map((r, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${
                    r.sev === "high" ? "border-red-500/22 bg-red-500/[0.04]" :
                    r.sev === "medium" ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-white/[0.05]"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${r.sev === "high" ? "bg-red-400" : r.sev === "medium" ? "bg-amber-400" : "bg-white/22"}`} />
                    <p className="text-white/58 text-xs leading-relaxed flex-1">{r.title}</p>
                    <SourceChip label="source" active={r.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* Required Next Steps */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.08) 0%, rgba(12,12,15,0) 55%)" }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/28 flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-white/85 text-sm font-semibold flex-1">Required Next Steps</p>
                <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20 flex items-center">
                  <span className="text-red-300/90 text-[9px] font-medium">2 urgent</span>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {[
                  { title: "Review unlimited liability clause before signing", priority: "high" },
                  { title: "Set calendar reminder for Oct 17 auto-renewal deadline", priority: "high" },
                  { title: "Ask lawyer about IP assignment scope", priority: "medium" },
                ].map((s, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border ${s.priority === "high" ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${s.priority === "high" ? "bg-red-400" : "bg-amber-400/60"}`} />
                    <p className={`text-[12px] font-medium ${s.priority === "high" ? "text-white/85" : "text-white/48"}`}>{s.title}</p>
                    <SourceChip label="source" />
                  </div>
                ))}
              </div>
            </div>

            {/* Key Dates */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SLabel icon={<Calendar className="w-3.5 h-3.5 text-sky-400/60" />}
                right={<span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">1 hard deadline</span>}>
                Key Dates
              </SLabel>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 border border-amber-500/14 bg-amber-500/[0.03]">
                  <div>
                    <p className="text-white/28 text-[10px] mb-0.5">Auto-renewal cancellation deadline</p>
                    <p className="text-amber-300 text-xs font-medium">October 17, 2025 <span className="text-amber-400/60 font-normal text-[9px]">⚠ Hard deadline</span></p>
                  </div>
                  <SourceChip label="source" />
                </div>
                <div className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <div>
                    <p className="text-white/28 text-[10px] mb-0.5">Contract effective date</p>
                    <p className="text-white/65 text-xs font-medium">January 15, 2025</p>
                  </div>
                  <SourceChip label="source" />
                </div>
              </div>
            </div>

            {/* LIVE CHANGE: Source Traceability — FileWarning icon */}
            <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
              <SLabel icon={<FileWarning className="w-3.5 h-3.5 text-violet-400/55" />}>Source Traceability</SLabel>
              <p className="text-white/28 text-[11px] leading-relaxed mb-3">
                Every finding links to the exact document section it came from. Click a chip to jump the document viewer.
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Unlimited liability — no cap on damages", active: true },
                  { label: "Auto-renewal 90-day notice requirement" },
                  { label: "Broad IP assignment clause" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer hover:bg-violet-500/[0.04] ${
                    item.active ? "border-violet-500/28 bg-violet-500/[0.06]" : "border-white/[0.05] bg-white/[0.01]"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? "bg-violet-400" : "bg-white/18"}`} />
                    <p className={`text-[11px] flex-1 truncate ${item.active ? "text-white/75" : "text-white/38"}`}>{item.label}</p>
                    <SourceChip label="jump" active={item.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE CHANGE: Follow-up tools — Ask, Trust Check, Clause Extractor, Compare Versions */}
            <div>
              <SLabel>Recommended Follow-up Tools</SLabel>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document", desc: "Ask anything, get cited answers", color: "text-violet-400 border-violet-500/20 bg-violet-600/[0.08]" },
                  { icon: <Shield className="w-3.5 h-3.5" />, label: "Trust Check", desc: "Verify authenticity", color: "text-amber-400 border-amber-500/20 bg-amber-600/[0.08]" },
                  { icon: <ListChecks className="w-3.5 h-3.5" />, label: "Clause Extractor", desc: "Pull key clauses by type", color: "text-sky-400 border-sky-500/20 bg-sky-600/[0.08]" },
                  { icon: <GitCompare className="w-3.5 h-3.5" />, label: "Compare Versions", desc: "Diff two document versions", color: "text-emerald-400 border-emerald-500/20 bg-emerald-600/[0.08]" },
                ].map((tool, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015]">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${tool.color}`}>{tool.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/65 text-[11px] font-medium leading-none mb-0.5">{tool.label}</p>
                      <p className="text-white/22 text-[10px] leading-none truncate">{tool.desc}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-white/15 shrink-0" />
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
