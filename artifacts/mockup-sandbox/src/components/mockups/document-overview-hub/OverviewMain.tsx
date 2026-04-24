import { FileText, AlertTriangle, Calendar, Users, ChevronRight, MessageSquare, Search, FileSearch, GitCompare, EyeOff, BookOpen, Bookmark, ExternalLink, CheckCircle2, Clock, Shield } from "lucide-react";

function CitationChip({ page, section }: { page: number; section?: string }) {
  return (
    <span className="inline-flex items-center gap-1 h-4 px-1.5 rounded bg-violet-600/15 border border-violet-500/20 text-violet-300 text-[9px] font-medium leading-none">
      p.{page}{section ? ` · ${section}` : ""}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">{children}</p>;
}

const RISKS = [
  { level: "high", text: "Auto-renewal clause — requires 90-day written notice to cancel", page: 8, section: "§ 7.2" },
  { level: "medium", text: "Unlimited liability for confidentiality breaches", page: 11, section: "§ 12.1" },
  { level: "low", text: "Governing law is Delaware — may affect dispute resolution", page: 12, section: "§ 14" },
];

const DATES = [
  { label: "Effective Date", value: "January 15, 2025", page: 1 },
  { label: "Initial Term", value: "12 months", page: 3, section: "§ 3.1" },
  { label: "Renewal Deadline", value: "October 17, 2025", page: 8, section: "§ 7.2", urgent: true },
  { label: "Payment Due", value: "Net 30 days", page: 5, section: "§ 5.2" },
];

const PARTIES = [
  { role: "Service Provider", name: "Acme Consulting LLC", detail: "Delaware LLC" },
  { role: "Client", name: "Stripe, Inc.", detail: "California Corp." },
];

const OBLIGATIONS = [
  { party: "Provider", text: "Deliver monthly status reports by the 5th of each month", page: 4 },
  { party: "Provider", text: "Maintain professional liability insurance of ≥ $2M", page: 9 },
  { party: "Client", text: "Provide timely access to systems and personnel", page: 4 },
  { party: "Client", text: "Pay invoices within 30 days of receipt", page: 5 },
];

const NEXT_STEPS = [
  { text: "Set a calendar reminder for the October 17 renewal deadline", urgent: true },
  { text: "Review the unlimited liability clause with legal counsel", urgent: true },
  { text: "Confirm insurance certificate is up to date (≥ $2M coverage)" },
  { text: "Verify the payment schedule aligns with your billing cycle" },
];

const TOOLS = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Ask This Document", desc: "Ask anything, get cited answers", color: "violet", href: "#" },
  { icon: <Search className="w-3.5 h-3.5" />, label: "Trust Check", desc: "Verify signatures & authenticity", color: "amber", href: "#" },
  { icon: <FileSearch className="w-3.5 h-3.5" />, label: "Contract Review", desc: "Full legal risk analysis", color: "blue", href: "#" },
  { icon: <Bookmark className="w-3.5 h-3.5" />, label: "Clause Extractor", desc: "Pull specific clauses", color: "green", href: "#" },
  { icon: <GitCompare className="w-3.5 h-3.5" />, label: "Compare Versions", desc: "Diff this against another draft", color: "sky", href: "#" },
  { icon: <EyeOff className="w-3.5 h-3.5" />, label: "Redact Sensitive Info", desc: "Remove PII before sharing", color: "red", href: "#" },
];

const TOOL_COLORS: Record<string, string> = {
  violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  amber: "text-amber-400 bg-amber-600/10 border-amber-500/20",
  blue: "text-blue-400 bg-blue-600/10 border-blue-500/20",
  green: "text-emerald-400 bg-emerald-600/10 border-emerald-500/20",
  sky: "text-sky-400 bg-sky-600/10 border-sky-500/20",
  red: "text-red-400 bg-red-600/10 border-red-500/20",
};

const QUESTIONS = [
  "What happens if I miss the October renewal deadline?",
  "Can the client terminate early without penalty?",
  "What does the confidentiality clause actually cover?",
];

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
        <div className="ml-auto flex items-center gap-3">
          <div className="h-6 px-2.5 rounded-full bg-emerald-600/12 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300 text-[10px] font-medium">High confidence</span>
          </div>
          <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/60 text-xs flex items-center gap-1.5 transition-colors">
            <ExternalLink className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: doc viewer */}
        <div className="w-[40%] border-r border-white/[0.06] flex flex-col bg-[#0e0e12] shrink-0">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-violet-400/70" />
            <span className="text-white/50 text-xs truncate flex-1">NDA — Stripe Inc.pdf</span>
            <span className="text-white/25 text-xs">12 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scroll">
            {/* Simulated PDF pages */}
            {[1, 2, 3].map((pg) => (
              <div
                key={pg}
                className={`rounded-lg border p-4 flex flex-col gap-1.5 ${pg === 1 ? "border-violet-500/30 bg-violet-500/[0.03]" : "border-white/[0.05] bg-white/[0.015]"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/20 text-[9px]">Page {pg}</span>
                  {pg === 1 && <CitationChip page={1} />}
                </div>
                {pg === 1 && (
                  <div className="mb-1">
                    <div className="h-3 rounded bg-white/[0.15] w-[60%] mb-1.5" />
                    <div className="h-2 rounded bg-white/[0.07] w-[45%]" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {[90, 80, 70, 85, 75, 65].map((w, i) => (
                    <div key={i} className="h-[7px] rounded-sm bg-white/[0.08]" style={{ width: `${w}%` }} />
                  ))}
                </div>
                {pg === 1 && (
                  <div className="mt-1.5 rounded-md bg-violet-500/[0.06] border border-violet-500/15 px-2 py-1 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                    <span className="text-violet-300/70 text-[9px]">Parties defined here</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Page nav */}
          <div className="h-9 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/25 text-xs">Page 1 of 12</span>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((p) => (
                <button key={p} className={`w-5 h-5 rounded text-[9px] flex items-center justify-center transition-colors ${p === 1 ? "bg-violet-600 text-white" : "text-white/25 hover:text-white/50"}`}>{p}</button>
              ))}
              <span className="text-white/25 text-[9px] px-1">…</span>
            </div>
          </div>
        </div>

        {/* Right: intelligence panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col gap-4">

            {/* Doc header */}
            <div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-white/90 text-base font-semibold leading-tight">Non-Disclosure Agreement</h1>
                    <div className="h-5 px-2 rounded-full border border-white/[0.1] bg-white/[0.03] flex items-center">
                      <span className="text-white/40 text-[10px]">NDA</span>
                    </div>
                  </div>
                  <p className="text-white/35 text-xs mt-0.5">Acme Consulting LLC · Stripe, Inc. · January 2025 · 12 pages</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400/80 text-xs">94% confidence</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-600/[0.05] p-4">
              <SectionLabel>Plain-English Summary</SectionLabel>
              <p className="text-white/75 text-sm leading-relaxed">
                This is a mutual non-disclosure agreement between Acme Consulting (the service provider) and Stripe (the client). Both parties agree not to share each other's confidential information for <strong className="text-white/90 font-medium">3 years</strong> after the agreement ends. The agreement lasts <strong className="text-white/90 font-medium">12 months</strong> and <strong className="text-white/90 font-medium">auto-renews</strong> unless you give 90 days' written notice. Stripe pays for services on Net 30 terms.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <CitationChip page={1} />
                <CitationChip page={3} section="§ 3.1" />
                <CitationChip page={8} section="§ 7.2" />
              </div>
            </div>

            {/* Risks */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <SectionLabel>Risks & Watchouts</SectionLabel>
              </div>
              <div className="flex flex-col gap-2">
                {RISKS.map((r, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3 py-2 border ${
                    r.level === "high" ? "border-red-500/20 bg-red-500/[0.04]" :
                    r.level === "medium" ? "border-amber-500/20 bg-amber-500/[0.04]" :
                    "border-white/[0.06] bg-transparent"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      r.level === "high" ? "bg-red-400" : r.level === "medium" ? "bg-amber-400" : "bg-white/30"
                    }`} />
                    <p className="text-white/65 text-xs leading-relaxed flex-1">{r.text}</p>
                    <CitationChip page={r.page} section={r.section} />
                  </div>
                ))}
              </div>
            </div>

            {/* Key dates + parties side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <SectionLabel>Key Dates</SectionLabel>
                </div>
                <div className="flex flex-col gap-2">
                  {DATES.map((d, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/40 text-[10px]">{d.label}</p>
                        <p className={`text-xs font-medium ${d.urgent ? "text-amber-300" : "text-white/70"}`}>
                          {d.value}
                          {d.urgent && <span className="ml-1.5 text-[9px] text-amber-400/80 font-normal">⚠ Deadline</span>}
                        </p>
                      </div>
                      <CitationChip page={d.page} section={d.section} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <SectionLabel>Key Parties</SectionLabel>
                </div>
                <div className="flex flex-col gap-3">
                  {PARTIES.map((p, i) => (
                    <div key={i}>
                      <p className="text-white/30 text-[10px] mb-0.5">{p.role}</p>
                      <p className="text-white/75 text-sm font-medium">{p.name}</p>
                      <p className="text-white/30 text-xs">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Obligations */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <SectionLabel>Key Obligations</SectionLabel>
              </div>
              <div className="flex flex-col gap-2">
                {OBLIGATIONS.map((o, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`h-4 px-1.5 rounded text-[9px] font-medium shrink-0 mt-0.5 flex items-center ${o.party === "Provider" ? "bg-blue-600/15 text-blue-300 border border-blue-500/20" : "bg-emerald-600/15 text-emerald-300 border border-emerald-500/20"}`}>
                      {o.party}
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed flex-1">{o.text}</p>
                    <CitationChip page={o.page} />
                  </div>
                ))}
              </div>
            </div>

            {/* Required next steps */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <SectionLabel>Required Next Steps</SectionLabel>
              </div>
              <div className="flex flex-col gap-2">
                {NEXT_STEPS.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${s.urgent ? "bg-red-500/15 border border-red-500/25" : "bg-white/[0.04] border border-white/[0.08]"}`}>
                      {s.urgent ? <AlertTriangle className="w-2.5 h-2.5 text-red-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                    </div>
                    <p className={`text-xs leading-relaxed ${s.urgent ? "text-white/80" : "text-white/50"}`}>{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested questions */}
            <div>
              <SectionLabel>Suggested Questions</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {QUESTIONS.map((q, i) => (
                  <button key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all text-left group">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400/60 group-hover:text-violet-400 shrink-0 transition-colors" />
                    <span className="text-white/55 text-xs group-hover:text-white/75 transition-colors flex-1">{q}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-violet-400/60 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tool actions */}
            <div>
              <SectionLabel>Dig Deeper</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS.map((tool, i) => (
                  <button key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${TOOL_COLORS[tool.color]}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/75 text-xs font-medium leading-none mb-0.5">{tool.label}</p>
                      <p className="text-white/30 text-[10px] leading-none truncate">{tool.desc}</p>
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
