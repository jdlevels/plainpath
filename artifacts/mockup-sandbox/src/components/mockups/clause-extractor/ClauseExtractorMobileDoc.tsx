import { FileText, AlertTriangle, Bookmark, FileSearch, X } from "lucide-react";

function SChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100"
        : "bg-violet-600/12 border border-violet-500/20 text-violet-300/75"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </span>
  );
}

const SECTIONS = [
  {
    id: "s1", title: "§1–2", fullTitle: "Parties & Scope",
    body: `ClearMed Technology Group ("Client") engages Northbridge Digital Solutions LLC ("Provider") to deliver Healthcare Data Management & Analytics Services as defined in Schedule A (Statement of Work) and Schedule B (Fee Schedule).`,
    badge: null, active: false,
  },
  {
    id: "s2", title: "§3", fullTitle: "Term & Renewal",
    body: `Initial term: 18 months commencing June 1, 2025. Agreement shall auto-renew for successive 12-month periods unless either party provides written notice of non-renewal at least 60 days prior to term expiration. Notice must be provided in writing via certified mail.`,
    badge: { label: "60-day cancel notice", color: "bg-amber-500/15 border-amber-500/25 text-amber-300/75" },
    active: true,
    quote: `"Agreement shall auto-renew for successive 12-month periods unless either party provides written notice of non-renewal at least 60 days prior to expiration."`,
  },
  {
    id: "s3", title: "§4", fullTitle: "Fees & Payment",
    body: "Monthly service fee: $22,500.00. Invoiced on the 1st of each month, due net 30. Late payments subject to 1.5% per month interest. Provider may suspend services after 45 days of non-payment.",
    badge: { label: "1.5%/mo late fee", color: "bg-amber-500/12 border-amber-500/20 text-amber-300/65" },
    active: false,
  },
  {
    id: "s4", title: "§7", fullTitle: "Confidentiality",
    body: "5-year confidentiality obligation post-termination for both parties. All healthcare data subject to HIPAA compliance requirements.",
    badge: { label: "5-yr obligation", color: "bg-blue-500/12 border-blue-500/20 text-blue-300/65" },
    active: false,
  },
  {
    id: "s5", title: "§9", fullTitle: "Limitation of Liability",
    body: "Provider's total aggregate liability capped at 3 months of fees ($67,500). Excludes liability for data breaches caused by Provider negligence.",
    badge: { label: "Low liability cap", color: "bg-red-500/12 border-red-500/20 text-red-300/65" },
    active: false,
  },
];

export function ClauseExtractorMobileDoc() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390 }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-5 px-2 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[10px] text-amber-300/80">2 high-priority</span>
          </div>
          <button className="text-white/30"><Bookmark className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <button className="flex-1 h-10 text-xs font-medium text-white/30 flex items-center justify-center gap-1.5">
          <FileSearch className="w-3.5 h-3.5" /> Clauses
        </button>
        <button className="flex-1 h-10 text-xs font-semibold text-white/85 border-b-2 border-violet-500 flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-violet-400" /> Document
        </button>
      </div>

      {/* Active source banner */}
      <div className="mx-4 mt-3 mb-1 rounded-lg bg-violet-500/[0.09] border border-violet-500/22 px-3 py-2.5 flex items-start gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-violet-200/80 leading-snug">Source: "…shall auto-renew for successive 12-month periods…"</p>
          <p className="text-[9px] text-violet-300/48 mt-0.5">Jumped from key clause · §3 Term &amp; Renewal · p.3</p>
        </div>
        <button className="text-white/25 shrink-0">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Doc identity bar */}
      <div className="mx-4 mt-2 mb-2 flex items-center gap-2 shrink-0">
        <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 flex items-center gap-2">
          <FileText className="w-3 h-3 text-white/30 shrink-0" />
          <span className="text-xs text-white/50 font-medium truncate">ClearMed Services Agreement v3</span>
          <span className="ml-auto text-[10px] text-white/28 shrink-0">Fit</span>
          <span className="text-[9px] text-white/18 ml-1">100%</span>
        </div>
      </div>

      {/* Scrollable document sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {SECTIONS.map(sec => (
          <div key={sec.id} className={`rounded-xl border p-3.5 ${sec.active ? "border-violet-500/40 bg-violet-500/[0.05] ring-1 ring-violet-500/15" : "border-white/[0.06] bg-white/[0.015]"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sec.active ? "bg-violet-600/30 text-violet-300" : "bg-white/[0.06] text-white/35"}`}>{sec.title}</span>
              <span className={`text-[10px] font-medium flex-1 ${sec.active ? "text-violet-400/70" : "text-white/30"}`}>{sec.fullTitle}</span>
              {sec.badge && (
                <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${sec.badge.color}`}>{sec.badge.label}</span>
              )}
              {sec.active && <SChip label="· Source" active />}
            </div>
            <p className={`text-xs leading-relaxed ${sec.active ? "text-white/62" : "text-white/42"}`}>
              {sec.active
                ? <><span>Initial term: 18 months commencing June 1, 2025. Agreement </span><span className="bg-violet-500/25 text-violet-100 rounded px-0.5">shall auto-renew for successive 12-month periods</span><span> unless either party provides written notice of non-renewal at least 60 days prior to term expiration. Notice must be provided in writing via certified mail.</span></>
                : sec.body
              }
            </p>
            {sec.active && sec.quote && (
              <div className="mt-2 rounded-lg bg-violet-500/[0.08] border border-violet-500/18 px-2.5 py-2">
                <p className="text-[10px] text-violet-200/60 italic leading-snug">{sec.quote}</p>
              </div>
            )}
            {!sec.active && (
              <button className="mt-2 text-[10px] text-violet-400/40 flex items-center gap-0.5 hover:text-violet-400/70">
                See this in Clauses tab →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom pagination bar */}
      <div className="h-10 border-t border-white/[0.05] flex items-center px-4 justify-between shrink-0">
        <span className="text-[10px] text-white/20">5 sections</span>
        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`w-5 h-5 rounded text-[9px] font-medium ${n===2 ? "bg-violet-600/35 text-violet-300" : "text-white/20"}`}>{n}</button>
          ))}
          <span className="text-[10px] text-violet-400/50 ml-1">Jump</span>
        </div>
      </div>
    </div>
  );
}
