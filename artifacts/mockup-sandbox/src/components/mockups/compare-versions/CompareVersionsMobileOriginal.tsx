import { FileText, ArrowLeftRight, X, ArrowLeft, Bookmark, Edit3 } from "lucide-react";

export function CompareVersionsMobileOriginal() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="ml-2 text-sm font-semibold text-white/90">PlainPath</span>
        <div className="ml-auto">
          <Bookmark className="w-4 h-4 text-white/22" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-white/[0.06] flex shrink-0">
        {["Summary","Original","Revised"].map((tab, i) => (
          <button key={tab} className={`flex-1 py-3 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            i === 1
              ? "text-white/75 border-b-2 border-white/40"
              : "text-white/28 hover:text-white/45"
          }`}>
            {tab === "Summary"  && <ArrowLeftRight className="w-3.5 h-3.5" />}
            {tab === "Original" && <FileText className="w-3.5 h-3.5" />}
            {tab === "Revised"  && <FileText className="w-3.5 h-3.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Evidence banner (active change) */}
      <div className="border-b border-violet-500/20 bg-violet-500/[0.07] px-4 py-2.5 flex items-start gap-2.5 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-violet-200/85">Change chip active — §7 · Notice Period (modified)</p>
          <p className="text-[10px] text-white/40 mt-0.5 leading-snug">
            Old: <span className="text-amber-300/65">"60 days written notice"</span>
          </p>
        </div>
        <button className="text-white/22 shrink-0 mt-0.5"><X className="w-3.5 h-3.5" /></button>
      </div>

      {/* Back to summary */}
      <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-1.5 shrink-0">
        <ArrowLeft className="w-3.5 h-3.5 text-white/28" />
        <span className="text-[11px] text-white/30">Return to Summary tab</span>
      </div>

      {/* Doc header */}
      <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2 shrink-0">
        <FileText className="w-3.5 h-3.5 text-white/28" />
        <span className="text-[11px] font-medium text-white/55">Lease_Agreement_v1.pdf</span>
        <span className="ml-auto text-[10px] text-white/22">Original</span>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Normal section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
          <p className="text-[10px] text-white/25 font-medium mb-1.5">§1–2 · Parties & Premises</p>
          <p className="text-[11px] text-white/45 leading-relaxed">Lease between Jordan Chen ("Tenant") and Harborview Properties LLC ("Landlord") for Apt 4B, 182 Mercer St, New York, NY 10012, commencing March 1, 2025.</p>
          <p className="mt-2 text-[10px] text-violet-300/35">See this in Summary tab →</p>
        </div>

        {/* Normal section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
          <p className="text-[10px] text-white/25 font-medium mb-1.5">§4 · Rent & Payment</p>
          <p className="text-[11px] text-amber-300/55 leading-relaxed">Monthly rent: <span className="bg-amber-500/15 px-0.5 rounded">$3,200.00</span> due on the 1st. Late fee: <span className="bg-amber-500/15 px-0.5 rounded">5%</span> after 5-day grace period.</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Edit3 className="w-2.5 h-2.5 text-amber-400/50" />
            <span className="text-[10px] text-amber-300/45">Changed in revised</span>
          </div>
          <p className="mt-2 text-[10px] text-violet-300/35">See this in Summary tab →</p>
        </div>

        {/* Active highlighted section */}
        <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/[0.08] ring-2 ring-violet-500/18 p-3.5 relative">
          <div className="absolute -top-2 left-3">
            <span className="h-4 px-1.5 rounded bg-violet-600 border border-violet-400/50 text-[9px] text-white font-semibold">Source — §7·p.3</span>
          </div>
          <p className="text-[10px] text-violet-300/65 font-medium mb-2 mt-1">§7 · Notice to Vacate — Original</p>
          <p className="text-[11px] text-white/62 leading-relaxed">
            Either party must provide{" "}
            <span className="bg-red-500/20 text-red-300/85 px-0.5 rounded line-through decoration-red-400/40">60 days</span>{" "}
            written notice before lease end to avoid automatic month-to-month renewal. Notice must be in writing.
          </p>
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/[0.07] border border-amber-500/18">
            <p className="text-[10px] text-amber-300/55 italic leading-snug">"…either party must provide 60 days written notice before lease end…"</p>
          </div>
          <p className="mt-2 text-[10px] text-violet-300/40">Old language highlighted above · See revised version →</p>
        </div>

        {/* Normal section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
          <p className="text-[10px] text-white/25 font-medium mb-1.5">§9 · Governing Law</p>
          <p className="text-[11px] text-white/42 leading-relaxed">This lease is governed by the laws of the State of New York. Disputes subject to New York jurisdiction.</p>
        </div>

      </div>

      {/* Pagination footer */}
      <div className="h-10 border-t border-white/[0.05] flex items-center justify-between px-4 shrink-0">
        <span className="text-[10px] text-white/20">4 sections</span>
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(n => (
            <button key={n} className={`w-6 h-6 rounded text-[10px] font-medium ${n===2?"bg-violet-600/30 text-violet-300":"text-white/22"}`}>{n}</button>
          ))}
          <span className="text-[10px] text-white/22 ml-1">Jump</span>
        </div>
      </div>
    </div>
  );
}
