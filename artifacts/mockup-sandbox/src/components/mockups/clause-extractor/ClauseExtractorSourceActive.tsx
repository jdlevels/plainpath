import { FileText, AlertTriangle, RefreshCcw, Scale, X, DollarSign, Clock, AlertCircle, ShieldAlert, ChevronDown, BookOpen, FileSearch } from "lucide-react";

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

function PL({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="shrink-0 text-white/25">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24 flex-1">{children}</p>
      {right}
    </div>
  );
}

function CollapsedSection({ icon, title, badge }: { icon: React.ReactNode; title: string; badge: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025]">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="text-white/20">{icon}</span>
        <p className="text-white/38 text-xs font-medium flex-1">{title}</p>
        <span className="h-4 px-1.5 rounded border bg-white/[0.05] border-white/[0.08] text-[9px] font-medium text-white/28">{badge}</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/18" />
      </div>
    </div>
  );
}

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
          <div className="h-6 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-300/80 font-medium">Review required · 2 high-priority</span>
          </div>
          <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5">
            <RefreshCcw className="w-3 h-3" /> Re-extract
          </button>
        </div>
      </div>

      {/* Split body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — doc viewer with active source highlight */}
        <div className="w-[57%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          {/* Source banner */}
          <div className="h-10 border-b border-white/[0.05] flex items-center px-5 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs text-white/55 font-medium">ClearMed Services Agreement v3</span>
            <span className="ml-auto text-[10px] text-white/25">6 pp.</span>
          </div>

          {/* Active chip banner */}
          <div className="mx-4 mt-3 mb-1 rounded-lg bg-violet-500/[0.09] border border-violet-500/22 px-3.5 py-2.5 flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-violet-200/80">Source: "…shall auto-renew for successive 12-month periods…"</p>
              <p className="text-[10px] text-violet-300/50 mt-0.5">Jumped from key clause · §3 Term &amp; Renewal · p.3</p>
            </div>
            <button className="text-white/25 hover:text-white/50 mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 pt-2 space-y-3">
            {/* non-active sections */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 opacity-50">
              <p className="text-[10px] text-white/28 font-medium mb-2">§1–2 · Parties &amp; Scope</p>
              <p className="text-xs text-white/45 leading-relaxed">ClearMed Technology Group ("Client") engages Northbridge Digital Solutions LLC ("Provider") to deliver Healthcare Data Management &amp; Analytics Services as defined in Schedule A (Statement of Work) and Schedule B (Fee Schedule).</p>
            </div>

            {/* ACTIVE section */}
            <div className="rounded-xl border border-violet-500/40 bg-violet-500/[0.05] p-4 ring-1 ring-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-violet-400/70 font-medium">§3 · Term &amp; Renewal — Active Source</p>
                <SChip label="· Source" active />
              </div>
              <p className="text-xs text-white/62 leading-relaxed mb-3">
                Initial term: 18 months commencing June 1, 2025. Agreement <span className="bg-violet-500/25 text-violet-100 rounded px-0.5">shall auto-renew for successive 12-month periods</span> unless either party provides written notice of non-renewal at least 60 days prior to term expiration. Notice must be provided in writing via certified mail.
              </p>
              <div className="rounded-lg bg-violet-500/[0.08] border border-violet-500/20 px-3 py-2">
                <p className="text-[10px] text-violet-200/65 italic">"Agreement shall auto-renew for successive 12-month periods unless either party provides written notice of non-renewal at least 60 days prior to expiration."</p>
              </div>
            </div>

            {/* remaining sections dimmed */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 opacity-50">
              <p className="text-[10px] text-white/28 font-medium mb-2">§4 · Fees &amp; Payment</p>
              <p className="text-xs text-white/45 leading-relaxed">Monthly service fee: $22,500.00. Invoiced on the 1st of each month, due net 30. Late payments subject to 1.5% per month interest.</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 opacity-50">
              <p className="text-[10px] text-white/28 font-medium mb-2">§7 · Confidentiality</p>
              <p className="text-xs text-white/45 leading-relaxed">5-year confidentiality obligation post-termination for both parties. HIPAA compliance required for all healthcare data.</p>
            </div>
          </div>
          <div className="h-9 border-t border-white/[0.05] flex items-center px-5 justify-between">
            <span className="text-[10px] text-white/20">Section 2 of 5</span>
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(n => (
                <button key={n} className={`w-5 h-5 rounded text-[9px] font-medium ${n===2 ? "bg-violet-600/40 text-violet-300" : "text-white/20"}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — intel panel with active clause */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] shrink-0">
            <div className="rounded-lg bg-violet-500/[0.07] border border-violet-500/20 px-3.5 py-2.5">
              <p className="text-[11px] text-violet-200/75">
                Source chip active — <strong className="font-semibold text-violet-200/90">§3 Term &amp; Renewal</strong>. Document viewer has scrolled to the matching clause. Related clause card active below.
              </p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">
            <div>
              <PL icon={<AlertCircle className="w-3 h-3" />} right={<span className="h-4 px-1.5 rounded bg-amber-500/10 border border-amber-500/18 text-[9px] text-amber-300/60">3 shown</span>}>C. KEY CLAUSES</PL>
              <div className="space-y-2.5">
                {/* Active clause */}
                <div className="rounded-xl border border-violet-500/35 bg-violet-500/[0.06] ring-1 ring-violet-500/15 p-3.5">
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-white/85">Auto-renewal — 60-day written notice required</p>
                        <SChip label="§3 · p.3" active />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="h-4 px-1.5 rounded border bg-red-500/10 border-red-500/18 text-[9px] text-red-300/60">High priority</span>
                        <span className="h-4 px-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-[9px] text-white/35">Termination/Renewal</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/55 pl-4 leading-snug">Miss the 60-day window and you're locked in for another 12 months.</p>
                  <p className="text-[10px] text-violet-300/55 pl-4 mt-1.5 flex items-start gap-1"><span className="shrink-0 mt-0.5">›</span>Clause highlighted in document viewer — §3 Term &amp; Renewal.</p>
                  <p className="text-[10px] text-violet-300/55 pl-4 mt-1 flex items-start gap-1"><span className="shrink-0 mt-0.5">›</span>Set calendar alert for Oct 1, 2026 (60 days before expiry).</p>
                </div>

                {/* Other clauses dimmed */}
                <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3.5 opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <p className="text-xs font-semibold text-white/70">Monthly fee $22,500 — net-30 payment terms</p>
                    <SChip label="§4 · p.4" />
                  </div>
                </div>
                <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3.5 opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <p className="text-xs font-semibold text-white/70">Liability cap — 3 months of fees ($67,500)</p>
                    <SChip label="§9 · p.7" />
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsed sections */}
            <div className="space-y-2">
              <CollapsedSection icon={<DollarSign className="w-3.5 h-3.5" />} title="D. Payment & Fee Terms" badge="4 clauses" />
              <CollapsedSection icon={<RefreshCcw className="w-3.5 h-3.5" />} title="E. Obligations & Owners" badge="8 obligations" />
              <CollapsedSection icon={<Clock className="w-3.5 h-3.5" />} title="F. Dates & Deadlines" badge="4 deadlines" />
              <CollapsedSection icon={<AlertTriangle className="w-3.5 h-3.5" />} title="G. Missing / Unclear Clauses" badge="3 flagged" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
