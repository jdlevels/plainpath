import {
  FileText, Calendar, ChevronRight, MessageSquare,
  Shield, ArrowRight, GitCompare, FileWarning, Zap,
  ListChecks, Users, Bookmark, CheckCircle2
} from "lucide-react";

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
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

export function AnalyzeDocumentLiveScrolled() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Analyze a Document</span>
        <ChevronRight className="w-3 h-3 text-white/18" />
        <span className="text-white/30 text-xs truncate max-w-[200px]">Consulting Agreement — Acme Corp.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-emerald-600/12 border-emerald-500/25 text-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">91% confidence</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
          <a className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3" /><span>Re-analyse</span>
          </a>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Shows lower sections of document */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
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
          <div className="flex-1 px-3 py-3 flex flex-col gap-2.5 overflow-hidden">
            {/* Showing scrolled view — sections 3 & 4 */}
            {[
              { idx: 3, title: "Liability Limitations", content: "Provider's aggregate liability shall not be limited. All confidentiality breaches and damages arising from negligence or willful misconduct shall be borne in full by the service provider without cap or limitation on amount.", highlight: true },
              { idx: 4, title: "Governing Law", content: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States." },
            ].map(s => (
              <div key={s.idx} className={`w-full rounded-xl border p-4 flex flex-col gap-2 ${
                s.highlight ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20" : "border-white/[0.05] bg-white/[0.015]"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[9px] font-mono ${s.highlight ? "text-violet-300/60" : "text-white/18"}`}>Section {s.idx}</span>
                  {s.highlight && <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35"><div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" /><span className="text-violet-200/75 text-[9px]">Source</span></div>}
                </div>
                <p className={`text-xs font-semibold ${s.highlight ? "text-violet-300/80" : "text-white/45"}`}>{s.title}</p>
                <p className={`text-[11px] leading-relaxed ${s.highlight ? "text-white/65" : "text-white/32"}`}>{s.content}</p>
              </div>
            ))}
          </div>
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

        {/* RIGHT: Scrolled to lower sections — Key Dates, Key Parties, Source Traceability, Follow-up tools */}
        <div className="flex-1 bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* Key Dates */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SLabel icon={<Calendar className="w-3.5 h-3.5 text-sky-400/60" />}
                right={<span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/60 text-[9px]">1 hard deadline</span>}>
                Key Dates
              </SLabel>
              <div className="flex flex-col gap-2.5">
                {[
                  { title: "Auto-renewal cancellation deadline", date: "October 17, 2025", hard: true },
                  { title: "Contract effective date", date: "January 15, 2025", hard: false },
                  { title: "First milestone delivery", date: "March 31, 2025", hard: false },
                ].map((d, i) => (
                  <div key={i} className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 ${d.hard ? "border border-amber-500/14 bg-amber-500/[0.03]" : ""}`}>
                    <div>
                      <p className="text-white/28 text-[10px] mb-0.5">{d.title}</p>
                      <p className={`text-xs font-medium ${d.hard ? "text-amber-300" : "text-white/65"}`}>{d.date} {d.hard && <span className="text-amber-400/60 font-normal text-[9px]">⚠ Hard</span>}</p>
                    </div>
                    <SourceChip label="source" />
                  </div>
                ))}
              </div>
            </div>

            {/* Key Parties */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SLabel icon={<Users className="w-3.5 h-3.5 text-emerald-400/60" />}>Key Parties</SLabel>
              <div className="flex flex-col gap-2.5">
                {[
                  { role: "Consultant", name: "Acme Consulting LLC", detail: "Service provider — all IP transferred to Client" },
                  { role: "Client", name: "Stripe, Inc.", detail: "Receives all deliverables and owns all IP" },
                ].map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-4 px-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-white/30 text-[9px]">{p.role}</span>
                        <p className="text-white/65 text-xs font-medium">{p.name}</p>
                      </div>
                      <p className="text-white/28 text-[10px]">{p.detail}</p>
                    </div>
                    <SourceChip label="source" />
                  </div>
                ))}
              </div>
            </div>

            {/* Source Traceability — FileWarning icon */}
            <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
              <SLabel icon={<FileWarning className="w-3.5 h-3.5 text-violet-400/55" />}>Source Traceability</SLabel>
              <p className="text-white/28 text-[11px] leading-relaxed mb-3">Every finding links to the exact document section it came from. Click a chip to jump the document viewer.</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Unlimited liability — no cap on damages", active: true },
                  { label: "Auto-renewal 90-day notice requirement" },
                  { label: "Broad IP assignment clause" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer ${item.active ? "border-violet-500/28 bg-violet-500/[0.06]" : "border-white/[0.05] bg-white/[0.01]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? "bg-violet-400" : "bg-white/18"}`} />
                    <p className={`text-[11px] flex-1 truncate ${item.active ? "text-white/75" : "text-white/38"}`}>{item.label}</p>
                    <SourceChip label="jump" active={item.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up tools — Clause Extractor + Compare Versions (LIVE changes) */}
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
