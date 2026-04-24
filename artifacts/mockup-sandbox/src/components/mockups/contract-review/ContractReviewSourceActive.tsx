import {
  FileText, AlertTriangle, ChevronRight, ClipboardCheck,
  Bookmark, Scale, X, DollarSign, Info
} from "lucide-react";

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.18)]"
        : "bg-violet-600/10 border border-violet-500/16 text-violet-300/72 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {label}
    </span>
  );
}

function PL({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="shrink-0 text-white/22">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/22 flex-1">{children}</p>
      {right}
    </div>
  );
}

const DOC_SECTIONS = [
  {
    id: "s1", title: "§1–3 · Parties & Services", active: false,
    body: `ClearPoint Digital Services, LLC ("Vendor") agrees to provide Enterprise Software Development & Support Services to Redwood Software Group ("Client") as detailed in Exhibit A (Statement of Work) and Exhibit B (Pricing Schedule).`,
  },
  {
    id: "s2", title: "§4 · Term & Renewal", active: false,
    body: "Initial term: 12 months, May 1 2025. Auto-renews for successive 12-month terms unless written non-renewal notice is provided at least 90 days before term expiration.",
  },
  {
    id: "s3", title: "§5 · Payment & Fees — Active Source", active: true,
    body: "Monthly fee: $14,400.00. Due net 30 from invoice. Late payments accrue interest at 1.5% per month from the due date until paid. Vendor may suspend services after 2 consecutive missed payments.",
    highlight: "Late payments accrue interest at the rate of 1.5% per month from the due date until paid.",
  },
  {
    id: "s4", title: "§6 · Intellectual Property", active: false,
    body: "Custom deliverables assigned to Client on full payment. Vendor retains pre-existing IP and improvements thereto, even if incorporated into deliverables.",
  },
  {
    id: "s5", title: "§8 · Limitation of Liability", active: false,
    body: "Vendor liability capped at the monthly fee preceding the claim ($14,400). Applies to all claims including breach, tort, and negligence.",
  },
];

const RISKS = [
  {
    title: "Auto-renewal — 90-day notice required to cancel",
    sev: "high", chip: "§4.1 · p.3",
    action: "Set reminder 90 days before May 1, 2026.",
    active: false,
  },
  {
    title: "Late payment penalty — 1.5% per month",
    sev: "caution", chip: "§5.4 · p.4",
    detail: "At $14,400/month, a late payment accrues $216/month until paid. Unusual for an enterprise MSA.",
    action: "Confirm payment calendar matches net-30 terms to avoid accrual.",
    active: true,
  },
  {
    title: "Liability cap limited to one month of fees ($14,400)",
    sev: "high", chip: "§8.3 · p.6",
    action: "Negotiate a higher cap before signing.",
    active: false,
  },
];

export function ContractReviewSourceActive() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/15 text-[10px] mx-0.5">·</span>
        <span className="text-white/28 text-xs">Contract Review</span>
        <ChevronRight className="w-3 h-3 text-white/15" />
        <span className="text-white/28 text-xs truncate max-w-[160px]">ClearPoint_MSA_v2.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-red-600/12 border-red-500/22 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Review required · 3 high-risk</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/28 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer — source active */}
        <div className="w-[57%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-red-400/38 shrink-0" />
            <span className="text-white/38 text-xs flex-1 truncate">ClearPoint MSA v2 — Enterprise Software Services</span>
            <span className="text-white/16 text-xs shrink-0">8 pp.</span>
          </div>

          {/* Evidence banner */}
          <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/30 bg-violet-500/[0.07] px-3 py-2 flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-violet-200/82 text-[10px] font-medium">
                Source: "…shall accrue interest at the rate of 1.5% per month…"
              </p>
              <p className="text-violet-300/38 text-[9px] mt-0.5">Jumped from risk finding — §5 Payment &amp; Fees · p.4</p>
            </div>
            <button className="text-white/18 hover:text-white/42 shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2.5">
            {DOC_SECTIONS.map(s => (
              <div key={s.id} className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${s.active ? "border-violet-500/42 bg-violet-500/[0.06] ring-1 ring-violet-500/18 shadow-[0_0_18px_rgba(139,92,246,0.06)]" : "border-white/[0.05] bg-white/[0.015]"}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-[9px] font-mono ${s.active?"text-violet-300/55":"text-white/16"}`}>{s.title}</p>
                  {s.active && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/22 border border-violet-500/32">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-200/70 text-[9px]">+ Source</span>
                    </div>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed ${s.active?"text-white/55":"text-white/30"}`}>{s.body}</p>
                {s.active && (s as any).highlight && (
                  <div className="mt-1 rounded-lg border border-violet-500/22 bg-violet-500/[0.07] px-2.5 py-2">
                    <p className="text-violet-200/62 text-[9px] leading-relaxed">"{(s as any).highlight}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/18 text-xs">Section 3 of 5</span>
            <div className="flex items-center gap-1">{[1,2,3,4,5].map(n=><button key={n} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${n===3?"bg-violet-600 text-white":"text-white/20"}`}>{n}</button>)}</div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: intelligence panel — active risk highlighted */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-3.5">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-3 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/16 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-red-400/75" />
              </div>
              <div className="flex-1">
                <p className="text-white/82 text-sm font-semibold">ClearPoint MSA — Enterprise Services</p>
                <p className="text-white/25 text-[10px]">Master Service Agreement · May 1, 2025 · 8 pages</p>
              </div>
            </div>

            {/* Active context note */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-violet-500/18 bg-violet-500/[0.04]">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0 mt-0.5" />
              <p className="text-violet-300/60 text-[10px] leading-relaxed">Source chip active — §5.4 Payment & Fees. Document viewer has scrolled to the matching clause. Related risk finding highlighted below.</p>
            </div>

            {/* C. Key Contract Risks — with active finding */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <PL icon={<AlertTriangle className="w-3.5 h-3.5" />}
                right={<span className="h-4 px-1.5 rounded bg-red-500/10 border border-red-500/16 text-red-300/60 text-[9px]">3 shown</span>}
              >C. Key Contract Risks</PL>
              <div className="flex flex-col gap-2">
                {RISKS.map((r,i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-3 transition-all ${r.active?"border-violet-500/30 bg-violet-500/[0.06] ring-1 ring-violet-500/14":r.sev==="high"?"border-red-500/14 bg-red-500/[0.02]":"border-amber-500/12 bg-amber-500/[0.018]"}`}>
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${r.active?"bg-violet-400":r.sev==="high"?"bg-red-400":"bg-amber-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-[11.5px] font-medium leading-snug flex-1 ${r.active?"text-violet-200/88":r.sev==="high"?"text-red-200/78":"text-amber-200/72"}`}>{r.title}</p>
                          <SourceChip label={r.chip} active={r.active} />
                        </div>
                        {r.detail && <p className="text-white/35 text-[10px] leading-relaxed">{r.detail}</p>}
                        {r.active && <p className="text-white/25 text-[10px] mt-0.5">Clause highlighted in document viewer — §5 Payment &amp; Fees</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 pl-4">
                      <ChevronRight className="w-2.5 h-2.5 text-violet-400/30 shrink-0 mt-0.5" />
                      <p className="text-violet-300/45 text-[10px] leading-relaxed">{r.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* F. Payment — active context */}
            <div className="rounded-xl border border-amber-500/14 bg-amber-500/[0.02] p-4">
              <PL icon={<DollarSign className="w-3.5 h-3.5 text-amber-400/45" />}>F. Payment &amp; Fees</PL>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Monthly fee",   value: "$14,400.00",       ok: true,  active: false },
                  { label: "Late fee",      value: "1.5% per month",   ok: false, active: true  },
                  { label: "Suspension",    value: "2 missed payments", ok: false, active: false },
                  { label: "Early exit",    value: "Fees through term", ok: false, active: false },
                ].map((p,i) => (
                  <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${p.active?"border-violet-500/25 bg-violet-500/[0.06]":"border-white/[0.04]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.active?"bg-violet-400 animate-pulse":p.ok?"bg-emerald-400/50":"bg-amber-400/50"}`} />
                    <p className="text-white/25 text-[10px] shrink-0 w-24">{p.label}</p>
                    <p className={`text-[10px] ml-auto ${p.active?"text-violet-200/78 font-medium":p.ok?"text-white/48":"text-amber-300/55"}`}>{p.value}</p>
                    <SourceChip label="§5" active={p.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* D. Required Next Steps — compact */}
            <div className="rounded-xl overflow-hidden border border-white/[0.07]" style={{ background:"linear-gradient(140deg, rgba(109,40,217,0.04) 0%, rgba(12,12,15,0) 50%)" }}>
              <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.06] flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-violet-400/70" />
                <p className="text-white/78 text-xs font-semibold flex-1">D. Required Next Steps</p>
                <span className="text-red-300/60 text-[9px]">2 urgent</span>
              </div>
              <div className="p-3 flex flex-col gap-1">
                {[
                  { label: "Set calendar alert — 90-day cancel window closes ~Feb 1, 2026",  urgent: true },
                  { label: "Confirm payment calendar matches net-30 to avoid 1.5%/month",   urgent: true },
                  { label: "Confirm or negotiate the $14,400 liability cap",                urgent: false },
                ].map((item,i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg border ${item.urgent?"border-white/[0.09] bg-white/[0.018]":"border-white/[0.05]"}`}>
                    <div className="w-3.5 h-3.5 rounded border border-white/[0.16] flex-shrink-0 mt-0.5" />
                    <p className={`text-[10px] leading-relaxed flex-1 ${item.urgent?"text-white/70 font-medium":"text-white/32"}`}>{item.label}</p>
                    {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg border border-white/[0.05]">
              <Info className="w-3 h-3 text-white/16 shrink-0 mt-0.5" />
              <p className="text-white/18 text-[9px] leading-relaxed">Contract review support — risk indicators and terms to verify. Not legal advice.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
