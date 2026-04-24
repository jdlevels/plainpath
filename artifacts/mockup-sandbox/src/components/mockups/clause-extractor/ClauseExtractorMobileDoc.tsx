import { FileText, Bookmark, FileSearch, X, ChevronLeft } from "lucide-react";

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
    id: "s1", badge: "§1–2", title: "Parties & Scope", active: false,
    body: `ClearMed Technology Group ("Client") engages Northbridge Digital Solutions LLC ("Provider") to deliver Healthcare Data Management & Analytics Services per Schedule A and Schedule B.`,
    tags: null,
  },
  {
    id: "s2", badge: "§3", title: "Term & Renewal", active: true,
    highlight: { before: "Initial term: 18 months from June 1, 2025. Agreement ", text: "shall auto-renew for successive 12-month periods", after: " unless either party provides written notice of non-renewal at least 60 days before expiry." },
    quote: `"Agreement shall auto-renew for successive 12-month periods unless either party provides written notice of non-renewal at least 60 days prior to expiration."`,
    tags: [{ label: "60-day notice req.", cls: "bg-amber-500/12 border-amber-500/18 text-amber-300/65" }],
  },
  {
    id: "s3", badge: "§4", title: "Fees & Payment", active: false,
    body: "Monthly service fee: $22,500.00. Invoiced on the 1st of each month, due net 30. Late payments accrue 1.5%/month interest.",
    tags: [{ label: "1.5%/mo late fee", cls: "bg-amber-500/10 border-amber-500/16 text-amber-300/55" }],
  },
  {
    id: "s4", badge: "§7", title: "Confidentiality", active: false,
    body: "5-year confidentiality obligation post-termination. Healthcare data subject to HIPAA compliance. Both parties bound.",
    tags: [{ label: "5-yr obligation", cls: "bg-blue-500/10 border-blue-500/16 text-blue-300/55" }],
  },
  {
    id: "s5", badge: "§9", title: "Limitation of Liability", active: false,
    body: "Provider's total aggregate liability capped at $67,500 (3 months of fees). Excludes liability for data breaches caused by Provider negligence.",
    tags: [{ label: "Cap: $67,500", cls: "bg-amber-500/10 border-amber-500/16 text-amber-300/55" }],
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
      <div className="mx-4 mt-3 mb-2 rounded-lg bg-violet-500/[0.09] border border-violet-500/22 px-3 py-2.5 flex items-start gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-violet-200/80 leading-snug">Source: "…shall auto-renew for successive 12-month periods…"</p>
          <p className="text-[9px] text-violet-300/45 mt-0.5">Jumped from Key Clauses · §3 Term &amp; Renewal · p.3</p>
        </div>
        <button className="text-white/25 shrink-0"><X className="w-3 h-3" /></button>
      </div>

      {/* Return to Clauses banner */}
      <div className="mx-4 mb-2 shrink-0">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.015] text-left">
          <ChevronLeft className="w-3 h-3 text-violet-400/60 shrink-0" />
          <p className="text-[10px] text-violet-300/55">Return to Clauses tab</p>
        </button>
      </div>

      {/* Doc file bar */}
      <div className="mx-4 mb-2 flex items-center gap-2 shrink-0">
        <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 flex items-center gap-2">
          <FileText className="w-3 h-3 text-white/28 shrink-0" />
          <span className="text-[11px] text-white/48 font-medium truncate">ClearMed Services Agreement v3</span>
          <span className="ml-auto text-[9px] text-white/20 shrink-0">100%</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {SECTIONS.map(sec => (
          <div key={sec.id} className={`rounded-xl border p-3.5 ${sec.active ? "border-violet-500/40 bg-violet-500/[0.05] ring-1 ring-violet-500/15" : "border-white/[0.06] bg-white/[0.015]"}`}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sec.active ? "bg-violet-600/30 text-violet-300" : "bg-white/[0.06] text-white/32"}`}>{sec.badge}</span>
              <span className={`text-[10px] font-medium ${sec.active ? "text-violet-400/70" : "text-white/28"}`}>{sec.title}</span>
              {sec.tags && sec.tags.map(tag => (
                <span key={tag.label} className={`ml-auto h-4 px-1.5 rounded border text-[9px] font-medium ${tag.cls}`}>{tag.label}</span>
              ))}
              {sec.active && <SChip label="· Source" active />}
            </div>
            {sec.active && sec.highlight ? (
              <>
                <p className="text-[11px] text-white/62 leading-relaxed mb-2.5">
                  {sec.highlight.before}
                  <span className="bg-violet-500/25 text-violet-100 rounded px-0.5">{sec.highlight.text}</span>
                  {sec.highlight.after}
                </p>
                <div className="rounded-lg bg-violet-500/[0.08] border border-violet-500/18 px-2.5 py-2">
                  <p className="text-[10px] text-violet-200/58 italic leading-snug">{sec.quote}</p>
                </div>
              </>
            ) : (
              <>
                <p className={`text-[11px] leading-relaxed ${sec.active ? "text-white/62" : "text-white/42"}`}>{sec.body}</p>
                {!sec.active && (
                  <button className="mt-1.5 text-[10px] text-violet-400/38 hover:text-violet-400/65">
                    See this in Clauses tab →
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="h-10 border-t border-white/[0.05] flex items-center px-4 justify-between shrink-0">
        <span className="text-[10px] text-white/20">5 sections</span>
        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`w-5 h-5 rounded text-[9px] font-medium ${n===2 ? "bg-violet-600/35 text-violet-300" : "text-white/20"}`}>{n}</button>
          ))}
          <span className="text-[10px] text-violet-400/45 ml-1">Jump</span>
        </div>
      </div>
    </div>
  );
}
