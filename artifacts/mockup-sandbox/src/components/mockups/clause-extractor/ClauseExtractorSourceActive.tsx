import { FileText, RefreshCcw, X, Tag, Users, Calendar, AlertTriangle, ChevronDown, Layers } from "lucide-react";

function SChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.22)]"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </span>
  );
}

const FILTER_TABS = ["All","Payment","Termination","Obligations","Liability","Confidentiality","Deadlines","Missing"];

export function ClauseExtractorSourceActive() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/40 text-xs">Clause Extractor</span>
        <span className="text-white/15 text-xs mx-0.5">›</span>
        <span className="text-white/55 text-xs truncate max-w-[200px]">ClearMed_ServicesAgreement_v3.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full bg-violet-600/15 border border-violet-500/22 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-[11px] text-violet-300/80 font-medium">Source chip active — §3</span>
          </div>
          <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5">
            <RefreshCcw className="w-3 h-3" /> Re-extract
          </button>
        </div>
      </div>

      {/* Split body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — doc viewer with active highlight */}
        <div className="w-[44%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-10 border-b border-white/[0.05] flex items-center px-5 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs text-white/55 font-medium">ClearMed Services Agreement v3</span>
            <span className="ml-auto text-[10px] text-white/25">6 pp.</span>
          </div>

          {/* Evidence banner */}
          <div className="mx-4 mt-3 mb-2 rounded-lg bg-violet-500/[0.09] border border-violet-500/22 px-3.5 py-2.5 flex items-start gap-2.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-violet-200/80">Source: "…shall auto-renew for successive 12-month periods…"</p>
              <p className="text-[10px] text-violet-300/45 mt-0.5">Jumped from Key Clauses · §3 Term &amp; Renewal · p.3</p>
            </div>
            <button className="text-white/25 hover:text-white/50 mt-0.5"><X className="w-3.5 h-3.5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-3">
            {/* Dimmed — §1 */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5 opacity-40">
              <p className="text-[10px] text-white/28 font-medium mb-2">§1–2 · Parties &amp; Scope</p>
              <p className="text-[11px] text-white/45 leading-relaxed">ClearMed Technology Group engages Northbridge Digital Solutions LLC to deliver Healthcare Data Management &amp; Analytics Services per Schedule A and Schedule B.</p>
            </div>

            {/* ACTIVE — §3 */}
            <div className="rounded-xl border border-violet-500/40 bg-violet-500/[0.05] p-3.5 ring-1 ring-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-violet-400/70 font-medium">§3 · Term &amp; Renewal — Source</p>
                <SChip label="· Source" active />
              </div>
              <p className="text-[11px] text-white/62 leading-relaxed mb-3">
                Initial term: 18 months from June 1, 2025. Agreement <span className="bg-violet-500/25 text-violet-100 rounded px-0.5">shall auto-renew for successive 12-month periods</span> unless either party provides written notice of non-renewal at least 60 days before expiry. Notice must be via certified mail.
              </p>
              <div className="rounded-lg bg-violet-500/[0.08] border border-violet-500/20 px-3 py-2">
                <p className="text-[10px] text-violet-200/60 italic">"Agreement shall auto-renew for successive 12-month periods unless either party provides written notice of non-renewal at least 60 days prior to expiration."</p>
              </div>
            </div>

            {/* Dimmed — §4 */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5 opacity-40">
              <p className="text-[10px] text-white/28 font-medium mb-2">§4 · Fees &amp; Payment</p>
              <p className="text-[11px] text-white/45 leading-relaxed">Monthly service fee: $22,500.00. Net 30. Late payments 1.5%/month.</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5 opacity-40">
              <p className="text-[10px] text-white/28 font-medium mb-2">§7 · Confidentiality</p>
              <p className="text-[11px] text-white/45 leading-relaxed">5-year confidentiality obligation. HIPAA compliance required.</p>
            </div>
          </div>
          <div className="h-9 border-t border-white/[0.05] flex items-center px-5 justify-between">
            <span className="text-[10px] text-white/20">Section 2 of 5</span>
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(n => (
                <button key={n} className={`w-5 h-5 rounded text-[9px] font-medium ${n===2?"bg-violet-600/40 text-violet-300":"text-white/20"}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — extraction panel with active clause */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] shrink-0">
            <div className="rounded-lg bg-violet-500/[0.07] border border-violet-500/18 px-3.5 py-2.5">
              <p className="text-[11px] text-violet-200/70">
                Source chip active — <strong className="font-semibold text-violet-200/90">§3 Term &amp; Renewal</strong>. Document scrolled to the matching clause. Active clause card highlighted below.
              </p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TABS.map((t,i) => (
                <button key={t} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium ${i===2 ? "bg-white/[0.1] border-white/[0.15] text-white/75" : "border-white/[0.07] text-white/32 hover:bg-white/[0.04]"}`}>{t}</button>
              ))}
            </div>

            {/* C. Key Extracted Clauses */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Tag className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">C. KEY EXTRACTED CLAUSES</p>
                <span className="ml-auto text-[10px] text-white/25">Termination filter</span>
              </div>

              <div className="space-y-2.5">
                {/* Active clause */}
                <div className="rounded-xl border border-violet-500/35 bg-violet-500/[0.06] ring-1 ring-violet-500/15 p-3.5">
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-white/88">Auto-renewal — 60-day written notice required</p>
                        <SChip label="§3 · p.3" active />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="h-4 px-1.5 rounded border bg-amber-500/12 border-amber-500/20 text-[9px] font-medium text-amber-300/70">Needs attention</span>
                        <span className="h-4 px-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-[9px] text-white/32">Termination / Renewal</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/55 pl-4 leading-snug">Agreement renews automatically for 12-month terms unless written notice is given at least 60 days before expiry.</p>
                  <p className="text-[10px] text-violet-300/55 pl-4 mt-1.5">› Clause highlighted in document viewer — §3 Term &amp; Renewal.</p>
                  <p className="text-[10px] text-violet-300/50 pl-4 mt-1">› Set a calendar reminder: Oct 1, 2026 (60 days before Dec 1 expiry).</p>
                </div>

                {/* Other clauses dimmed */}
                {[
                  { title: "Monthly fee $22,500 — net-30 terms", chip: "§4 · p.4", dot: "bg-blue-500", cat: "Payment / Fees" },
                  { title: "Liability capped at $67,500 (3 months)", chip: "§9 · p.7", dot: "bg-amber-500", cat: "Liability" },
                ].map(cl => (
                  <div key={cl.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 opacity-55">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cl.dot} shrink-0`} />
                      <p className="text-xs font-semibold text-white/72 flex-1">{cl.title}</p>
                      <SChip label={cl.chip} />
                    </div>
                    <p className="text-[9px] text-white/28 pl-4 mt-1">{cl.cat}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* E. Obligations (compact) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Users className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">E. OBLIGATIONS & OWNERS</p>
                <ChevronDown className="w-3 h-3 text-white/18 ml-auto" />
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
                {[
                  { ob: "Provide 60-day written non-renewal notice", party: "Either party", chip: "§3" },
                  { ob: "Pay $22,500/month — net 30",                party: "ClearMed",    chip: "§4" },
                  { ob: "Comply with HIPAA",                          party: "Northbridge", chip: "§7" },
                ].map((r,i) => (
                  <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                    <p className="text-[11px] text-white/50 flex-1">{r.ob}</p>
                    <p className="text-[10px] text-white/30 whitespace-nowrap">{r.party}</p>
                    <SChip label={r.chip} />
                  </div>
                ))}
              </div>
            </div>

            {/* F. Dates (compact) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Calendar className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">F. DATES & DEADLINES</p>
                <ChevronDown className="w-3 h-3 text-white/18 ml-auto" />
              </div>
              <div className="space-y-1.5">
                {[
                  { date: "Oct 1, 2026",  event: "Deadline to give non-renewal notice", notice: "60-day notice required", chip: "§3", amber: true },
                  { date: "Dec 1, 2026",  event: "Initial 18-month term expiry",        notice: null,                     chip: "§3" },
                  { date: "1st of month", event: "Monthly invoice date — net 30 due",   notice: null,                     chip: "§4" },
                ].map((d,i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-3 ${d.amber ? "border-amber-500/18 bg-amber-500/[0.04]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                    <p className="text-[11px] font-semibold text-white/60 w-20 shrink-0">{d.date}</p>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/48 truncate">{d.event}</p>
                      {d.notice && <p className="text-[10px] text-amber-300/55 mt-0.5">{d.notice}</p>}
                    </div>
                    <SChip label={d.chip} />
                  </div>
                ))}
              </div>
            </div>

            {/* G. Missing */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025]">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <AlertTriangle className="w-3.5 h-3.5 text-white/20" />
                <p className="text-white/38 text-xs font-medium flex-1">G. Missing / Unclear Clauses</p>
                <span className="h-4 px-1.5 rounded border bg-amber-500/10 border-amber-500/18 text-[9px] text-amber-300/55">3 flagged</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/18" />
              </div>
            </div>

            {/* H. Source */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025]">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Layers className="w-3.5 h-3.5 text-white/20" />
                <p className="text-white/38 text-xs font-medium flex-1">H. Source Traceability</p>
                <span className="h-4 px-1.5 rounded border bg-violet-500/10 border-violet-500/18 text-[9px] text-violet-300/55">23 chips</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/18" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
