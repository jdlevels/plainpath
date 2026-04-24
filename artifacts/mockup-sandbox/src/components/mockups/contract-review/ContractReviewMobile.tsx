import {
  FileText, AlertTriangle, CheckCircle2, ChevronRight,
  DollarSign, CalendarClock, ShieldAlert, ClipboardCheck,
  AlertCircle, Scale, RefreshCcw, Bookmark
} from "lucide-react";

const RISKS = [
  {
    title: "Auto-renewal — 90-day cancellation notice required",
    sev: "high", chip: "§4.1",
    action: "Set reminder by Feb 1, 2026.",
  },
  {
    title: "Liability cap limited to one month ($14,400)",
    sev: "high", chip: "§8.3",
    action: "Negotiate a higher cap before signing.",
  },
  {
    title: "Binding arbitration — no jury trial",
    sev: "high", chip: "§12.2",
    action: "Review arbitration venue provisions with counsel.",
  },
  {
    title: "IP ownership — vendor's prior IP retained",
    sev: "medium", chip: "§6.1",
    action: "Request a schedule of vendor's pre-existing IP.",
  },
  {
    title: "Late payment penalty — 1.5%/month",
    sev: "medium", chip: "§5.4",
    action: "Confirm payment calendar matches net-30 terms.",
  },
];

const NEXT_STEPS = [
  { label: "Confirm both parties' legal names and signing authority",               urgent: true },
  { label: "Set calendar reminder 90 days before renewal date (by Feb 1, 2026)",    urgent: true },
  { label: "Negotiate or accept the $14,400 liability cap",                         urgent: false },
  { label: "Review arbitration clause before signing",                              urgent: false },
  { label: "Request IP schedule from vendor",                                       urgent: false },
];

export function ContractReviewMobile() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-6 px-2 rounded-full border flex items-center gap-1 bg-red-600/12 border-red-500/28 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[9px] font-medium">3 critical</span>
          </div>
          <button className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <Bookmark className="w-3 h-3 text-white/30" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="h-10 border-b border-white/[0.06] flex items-end px-1 shrink-0">
        {["Review", "Document"].map((tab, i) => (
          <button key={i} className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-medium pb-0.5 border-b-2 transition-all ${i===0 ? "border-violet-500 text-violet-300" : "border-transparent text-white/28"}`}>
            {i===0 ? <FileText className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Review Tab */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Doc identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-red-400/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/85 text-sm font-semibold truncate">ClearPoint MSA</p>
            <p className="text-white/28 text-[10px]">Master Service Agreement · 8 pages</p>
          </div>
          <span className="h-5 px-1.5 rounded border border-red-500/25 bg-red-500/10 text-red-300/80 text-[9px] font-medium shrink-0">Review Req.</span>
        </div>

        {/* Risk strip */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <p className="text-white/25 text-[9px] uppercase tracking-widest font-semibold mb-2">Risk summary</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "3 critical",  cls: "bg-red-500/12 border-red-500/20 text-red-300",     dot: "bg-red-400" },
              { label: "2 caution",   cls: "bg-amber-500/10 border-amber-500/15 text-amber-300/80", dot: "bg-amber-400" },
              { label: "5 next steps",cls: "bg-white/[0.04] border-white/10 text-white/38",    dot: "bg-white/25" },
              { label: "5 missing",   cls: "bg-white/[0.04] border-white/10 text-white/38",    dot: "bg-white/25" },
            ].map((c,i) => (
              <div key={i} className={`h-5 px-2 rounded-full border flex items-center gap-1 ${c.cls}`}>
                <div className={`w-1 h-1 rounded-full ${c.dot}`} />
                <span className="text-[9px] font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
          <p className="text-white/25 text-[9px] uppercase tracking-widest font-semibold mb-2">Plain-English Summary</p>
          <p className="text-white/65 text-[12px] leading-[1.7]">
            12-month MSA between Redwood Software Group (you) and ClearPoint Digital Services at $14,400/month. Watch the <span className="text-amber-300">90-day cancellation window</span> and the <span className="text-red-300">$14,400 liability cap</span>. Binding arbitration removes your jury trial rights. <span className="text-white/35">Review with a professional before signing.</span>
          </p>
        </div>

        {/* Risks */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-white/22" />
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold flex-1">Contract Risks</p>
            <span className="text-[9px] text-white/22">5 found</span>
          </div>
          <div className="flex flex-col gap-2">
            {RISKS.map((r, i) => {
              const isHigh = r.sev === "high";
              return (
                <div key={i} className={`rounded-xl border px-3 py-2.5 ${isHigh ? "border-red-500/15 bg-red-500/[0.025]" : "border-amber-500/12 bg-amber-500/[0.02]"}`}>
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-[4px] shrink-0 ${isHigh ? "bg-red-400" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className={`text-[11px] font-medium leading-tight flex-1 ${isHigh ? "text-red-200/80" : "text-amber-200/70"}`}>{r.title}</p>
                        <span className="inline-flex items-center h-[16px] px-1 rounded text-[9px] font-mono bg-violet-600/10 border border-violet-500/18 text-violet-300/70 whitespace-nowrap shrink-0">{r.chip}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 pl-3.5">
                    <ChevronRight className="w-2.5 h-2.5 text-violet-400/28 shrink-0 mt-0.5" />
                    <p className="text-violet-300/45 text-[10px]">{r.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next steps */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.06) 0%, rgba(12,12,15,0) 55%)" }}>
          <div className="px-3.5 pt-3.5 pb-3 border-b border-white/[0.07] flex items-center gap-2">
            <ClipboardCheck className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-white/80 text-xs font-semibold flex-1">Next Steps</p>
            <span className="text-red-300/70 text-[9px]">2 urgent</span>
          </div>
          <div className="p-2.5 flex flex-col gap-1">
            {NEXT_STEPS.map((item, i) => (
              <div key={i} className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg border ${item.urgent ? "border-white/[0.10] bg-white/[0.018]" : "border-white/[0.06]"}`}>
                <div className="w-3 h-3 rounded border border-white/[0.18] flex-shrink-0 mt-0.5" />
                <p className={`text-[10px] leading-relaxed flex-1 ${item.urgent ? "text-white/72 font-medium" : "text-white/35"}`}>{item.label}</p>
                {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Payment quick-scan */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-white/22" />
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold">Payment & Fees</p>
          </div>
          {[
            { label: "Monthly fee",  value: "$14,400",     ok: true  },
            { label: "Late penalty", value: "1.5%/month",  ok: false },
            { label: "Liability cap",value: "$14,400",     ok: false },
          ].map((p,i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-none">
              <div className={`w-1.5 h-1.5 rounded-full ${p.ok ? "bg-emerald-400/55" : "bg-amber-400/55"}`} />
              <p className="text-white/30 text-[10px] flex-1">{p.label}</p>
              <p className={`text-[10px] ${p.ok ? "text-white/48" : "text-amber-300/55"}`}>{p.value}</p>
            </div>
          ))}
        </div>

        {/* Termination quick-scan */}
        <div className="rounded-xl border border-amber-500/12 bg-amber-500/[0.02] p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="w-3.5 h-3.5 text-amber-400/45" />
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold">Termination & Renewal</p>
          </div>
          {[
            { label: "Auto-renewal",  value: "12-month terms",  },
            { label: "Cancel notice", value: "90 days written",  },
            { label: "Early exit",    value: "Not provided",     },
          ].map((t,i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-amber-500/[0.08] last:border-none">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400/50 shrink-0" />
              <p className="text-white/28 text-[10px] flex-1">{t.label}</p>
              <p className="text-amber-300/50 text-[10px]">{t.value}</p>
            </div>
          ))}
        </div>

        {/* Missing */}
        <div className="rounded-xl border border-red-500/12 bg-red-500/[0.015] p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400/45" />
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold">Missing Protections</p>
          </div>
          {[
            "No data breach notification clause",
            "No liability cap carve-out for gross negligence",
            "No force majeure provision",
          ].map((m,i) => (
            <div key={i} className="flex items-start gap-1.5 py-1.5 border-b border-red-500/[0.06] last:border-none">
              <AlertCircle className="w-3 h-3 text-red-400/45 shrink-0 mt-0.5" />
              <p className="text-red-200/50 text-[10px]">{m}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-white/[0.06] mb-2">
          <AlertCircle className="w-3 h-3 text-white/20 mt-0.5 shrink-0" />
          <p className="text-white/22 text-[10px] leading-relaxed">Contract review support only. This is not legal advice — consult a qualified professional before signing high-stakes contracts.</p>
        </div>

      </div>
    </div>
  );
}
