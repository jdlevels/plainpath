import {
  FileText, AlertTriangle, CheckCircle2, ChevronRight,
  ClipboardCheck, AlertCircle, Scale, Bookmark, Info
} from "lucide-react";

function SChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-[16px] px-1 rounded text-[9px] font-mono bg-violet-600/10 border border-violet-500/16 text-violet-300/65 whitespace-nowrap">{label}</span>
  );
}

const RISKS = [
  { title: "Auto-renewal — 90-day notice required to cancel", sev: "high", chip: "§4.1", action: "Set reminder by Feb 1, 2026." },
  { title: "Liability cap limited to $14,400",                sev: "high", chip: "§8.3", action: "Negotiate a higher cap before signing." },
  { title: "Binding arbitration — no jury trial",             sev: "high", chip: "§12.2", action: "Review venue and cost terms with a professional." },
  { title: "Vendor retains pre-existing IP in deliverables",  sev: "caution", chip: "§6.1", action: "Request a list of vendor's pre-existing IP." },
  { title: "Late payment — 1.5% per month",                  sev: "caution", chip: "§5.4", action: "Confirm payment calendar matches net-30 terms." },
];

const CHECKLIST = [
  { label: "Confirm parties' legal names and signing authority", urgent: true  },
  { label: "Set calendar alert — 90-day cancellation window closes ~Feb 1, 2026", urgent: true },
  { label: "Confirm or negotiate $14,400 liability cap (§8.3)",  urgent: false },
  { label: "Review binding arbitration venue and costs (§12.2)", urgent: false },
  { label: "Request vendor's pre-existing IP list (§6.1)",       urgent: false },
  { label: "Confirm Exhibits A and B are attached before signing", urgent: false },
];

export function ContractReviewMobile() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-6 px-2 rounded-full border flex items-center gap-1 bg-red-600/12 border-red-500/25 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[9px] font-medium">3 high-risk</span>
          </div>
          <button className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <Bookmark className="w-3 h-3 text-white/28" />
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

      {/* Review tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5">

        {/* Doc identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/18 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-red-400/75" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/82 text-sm font-semibold truncate">ClearPoint MSA</p>
            <p className="text-white/25 text-[10px]">Master Service Agreement · 8 pages · $14,400/mo</p>
          </div>
          <span className="h-5 px-1.5 rounded border border-red-500/22 bg-red-500/10 text-red-300/75 text-[9px] font-medium shrink-0">Review Req.</span>
        </div>

        {/* Risk / Confidence Strip */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold mb-2">Risk summary</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[
              { label: "3 high-risk",    cls: "bg-red-500/12 border-red-500/18 text-red-300",       dot: "bg-red-400"    },
              { label: "2 caution",      cls: "bg-amber-500/10 border-amber-500/14 text-amber-300", dot: "bg-amber-400"  },
              { label: "2 urgent steps", cls: "bg-white/[0.04] border-white/[0.07] text-white/32",  dot: "bg-white/22"   },
              { label: "5 possible gaps",cls: "bg-white/[0.04] border-white/[0.07] text-white/32",  dot: "bg-white/22"   },
            ].map((c,i) => (
              <div key={i} className={`h-5 px-2 rounded-full border flex items-center gap-1 ${c.cls}`}>
                <div className={`w-1 h-1 rounded-full ${c.dot}`} />
                <span className="text-[9px] font-medium">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-6 px-2 rounded-lg border flex items-center gap-1.5 bg-red-600/12 border-red-500/18 text-red-300">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span className="text-[10px] font-medium">High risk</span>
            </div>
            <div className="h-6 px-2 rounded-lg border flex items-center gap-1.5 bg-sky-600/8 border-sky-500/15 text-sky-300/70">
              <span className="text-[10px]">High confidence</span>
            </div>
          </div>
        </div>

        {/* Plain-English Summary */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
          <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold mb-2">Plain-English Summary</p>
          <p className="text-white/65 text-[12px] leading-[1.7]">
            12-month agreement between Redwood Software Group and ClearPoint Digital Services at $14,400/month. Watch the <span className="text-amber-300">90-day cancellation window</span> in §4.1 and the <span className="text-red-300">$14,400 liability cap</span> in §8.3. Binding arbitration waives jury trial rights. <span className="text-white/32">Review with a qualified professional before signing.</span>
          </p>
        </div>

        {/* Key Contract Risks */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-white/20" />
            <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold flex-1">Key Contract Risks</p>
            <span className="text-[9px] text-white/20">5 found</span>
          </div>
          <div className="flex flex-col gap-2">
            {RISKS.map((r,i) => {
              const isHigh = r.sev === "high";
              return (
                <div key={i} className={`rounded-xl border px-3 py-2.5 ${isHigh?"border-red-500/14 bg-red-500/[0.02]":"border-amber-500/12 bg-amber-500/[0.018]"}`}>
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-[4px] shrink-0 ${isHigh?"bg-red-400":"bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[11px] font-medium leading-tight flex-1 ${isHigh?"text-red-200/78":"text-amber-200/70"}`}>{r.title}</p>
                        <SChip label={r.chip} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 pl-3.5">
                    <ChevronRight className="w-2.5 h-2.5 text-violet-400/28 shrink-0 mt-0.5" />
                    <p className="text-violet-300/42 text-[10px]">{r.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Required Next Steps */}
        <div className="rounded-xl overflow-hidden border border-white/[0.07]" style={{ background:"linear-gradient(140deg, rgba(109,40,217,0.05) 0%, rgba(12,12,15,0) 55%)" }}>
          <div className="px-3.5 pt-3.5 pb-3 border-b border-white/[0.06] flex items-center gap-2">
            <ClipboardCheck className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-white/78 text-xs font-semibold flex-1">Required Next Steps</p>
            <span className="text-red-300/65 text-[9px] font-medium">2 urgent</span>
          </div>
          <div className="p-2.5 flex flex-col gap-1">
            {CHECKLIST.map((item,i) => (
              <div key={i} className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg border ${item.urgent?"border-white/[0.09] bg-white/[0.018]":"border-white/[0.05]"}`}>
                <div className="w-3 h-3 rounded border border-white/[0.16] flex-shrink-0 mt-0.5" />
                <p className={`text-[10px] leading-relaxed flex-1 ${item.urgent?"text-white/70 font-medium":"text-white/33"}`}>{item.label}</p>
                {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Source traceability compact */}
        <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.025] p-3.5">
          <p className="text-white/22 text-[9px] uppercase tracking-widest font-semibold mb-2">Source Traceability</p>
          <div className="flex flex-col gap-1.5">
            {[
              { label: "Auto-renewal",        chip: "§4.1" },
              { label: "Liability cap",       chip: "§8.3" },
              { label: "Arbitration clause",  chip: "§12.2" },
              { label: "IP ownership",        chip: "§6.1" },
              { label: "Late payment fee",    chip: "§5.4" },
            ].map((s,i) => (
              <div key={i} className="flex items-center gap-2 cursor-pointer">
                <div className="w-1 h-1 rounded-full bg-violet-400/30 shrink-0" />
                <p className="text-white/30 text-[10px] flex-1">{s.label}</p>
                <SChip label={s.chip} />
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-white/[0.05] mb-2">
          <Info className="w-3 h-3 text-white/18 mt-0.5 shrink-0" />
          <p className="text-white/20 text-[10px] leading-relaxed">Contract review support only — risk indicators and terms to verify. Not legal advice.</p>
        </div>

      </div>
    </div>
  );
}
