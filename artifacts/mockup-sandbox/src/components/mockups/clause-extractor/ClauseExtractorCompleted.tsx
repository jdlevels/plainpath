import {
  FileText, Tag, ChevronDown, DollarSign, RefreshCcw,
  Calendar, Users, AlertTriangle, Info, Scale, BookOpen,
  FileSearch, Clock, Layers, ShieldCheck
} from "lucide-react";

function SChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />}
      {label}
    </span>
  );
}

const FILTER_TABS = ["All","Payment","Termination","Obligations","Liability","Confidentiality","Deadlines","Missing"];

const KEY_CLAUSES = [
  {
    id: "c1", title: "Auto-renewal — 60-day written notice required",
    category: "Termination / Renewal", chip: "§3 · p.3",
    plain: "Agreement renews automatically for 12-month terms unless written notice is given at least 60 days before expiry.",
    importance: "attention", action: "Set a calendar reminder: Oct 1, 2026 (60 days before Dec 1 expiry).",
  },
  {
    id: "c2", title: "Monthly fee $22,500 — net-30 payment terms",
    category: "Payment / Fees", chip: "§4 · p.4",
    plain: "Invoiced on the 1st of each month. Late payments accrue 1.5%/month interest until settled.",
    importance: "standard", action: null,
  },
  {
    id: "c3", title: "Liability capped at 3 months of fees ($67,500)",
    category: "Liability", chip: "§9 · p.7",
    plain: "Maximum recoverable from Provider for any claim is $67,500 — regardless of actual damages sustained.",
    importance: "attention", action: "Verify whether this cap is appropriate for the contract scope.",
  },
  {
    id: "c4", title: "5-year confidentiality obligation — both parties",
    category: "Confidentiality", chip: "§7 · p.6",
    plain: "Both parties must protect the other's Proprietary Information for 5 years after the agreement ends.",
    importance: "standard", action: null,
  },
  {
    id: "c5", title: "HIPAA compliance obligation on Provider",
    category: "Obligations", chip: "§7 · p.6",
    plain: "Provider is contractually required to comply with all applicable HIPAA rules for healthcare data.",
    importance: "noted", action: null,
  },
  {
    id: "c6", title: "Services may be suspended after 45 days non-payment",
    category: "Payment / Fees", chip: "§4 · p.5",
    plain: "Provider may suspend delivery of services if invoices remain unpaid for more than 45 days.",
    importance: "standard", action: null,
  },
];

const IMPORTANCE = {
  attention: { dot: "bg-amber-500", border: "border-amber-500/18", bg: "bg-amber-500/[0.04]", badge: "bg-amber-500/12 border-amber-500/20 text-amber-300/70", label: "Needs attention" },
  standard:  { dot: "bg-blue-500",  border: "border-blue-500/15",  bg: "bg-blue-500/[0.03]",  badge: "bg-blue-500/12 border-blue-500/20 text-blue-300/65",   label: "Standard term" },
  noted:     { dot: "bg-white/30",  border: "border-white/[0.07]", bg: "bg-white/[0.01]",     badge: "bg-white/[0.07] border-white/[0.1] text-white/38",     label: "Noted" },
};

const OBLIGATIONS = [
  { obligation: "Provide written non-renewal notice", party: "Either party",       deadline: "60 days before expiry", chip: "§3" },
  { obligation: "Pay monthly service fee",             party: "ClearMed (Client)", deadline: "Net 30 per invoice",    chip: "§4" },
  { obligation: "Comply with HIPAA requirements",      party: "Northbridge (Provider)", deadline: "Ongoing",          chip: "§7" },
  { obligation: "Maintain confidentiality of data",    party: "Both parties",     deadline: "5 yrs post-term",       chip: "§7" },
  { obligation: "Deliver services per Schedule A",     party: "Northbridge (Provider)", deadline: "Per SOW",          chip: "§2" },
  { obligation: "Provide invoices on 1st of month",    party: "Northbridge (Provider)", deadline: "Monthly",          chip: "§4" },
];

const DATES = [
  { date: "June 1, 2025",  event: "Agreement commencement date",         notice: null,               chip: "§3" },
  { date: "Dec 1, 2026",   event: "Initial 18-month term expiry",         notice: "60-day notice req.", chip: "§3" },
  { date: "Oct 1, 2026",   event: "Deadline to give non-renewal notice",  notice: "Triggers auto-renew", chip: "§3" },
  { date: "1st of month",  event: "Monthly invoice date",                 notice: "Net-30 due",        chip: "§4" },
];

const MISSING = [
  { title: "Dispute resolution / governing law",  note: "No clause identified — verify whether this applies to your situation.", level: "note" },
  { title: "IP ownership for deliverables",       note: "Ownership of custom deliverables is not explicitly defined. Possible gap.", level: "flag" },
  { title: "Force majeure",                        note: "No force majeure clause identified. May be standard for your jurisdiction.", level: "note" },
];

export function ClauseExtractorCompleted() {
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
          <div className="h-6 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center gap-1.5">
            <FileSearch className="w-3 h-3 text-white/40" />
            <span className="text-[11px] text-white/50 font-medium">Clause Extraction Overview</span>
          </div>
          <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04] transition-colors">
            <FileText className="w-3 h-3" /> Save
          </button>
          <button className="h-7 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 flex items-center gap-1.5 hover:bg-white/[0.04] transition-colors">
            <RefreshCcw className="w-3 h-3" /> Re-extract
          </button>
        </div>
      </div>

      {/* Split body */}
      <div className="flex-1 flex min-h-0">

        {/* Left — Doc viewer */}
        <div className="w-[44%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-10 border-b border-white/[0.05] flex items-center px-5 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs text-white/55 font-medium">ClearMed Services Agreement v3</span>
            <span className="ml-auto text-[10px] text-white/25">6 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              { id:"s1", title:"§1–2 · Parties & Scope",       body:"ClearMed Technology Group (\"Client\") engages Northbridge Digital Solutions LLC (\"Provider\") to deliver Healthcare Data Management & Analytics Services per Schedule A (SOW) and Schedule B (Fee Schedule)." },
              { id:"s2", title:"§3 · Term & Renewal",           body:"Initial term: 18 months from June 1, 2025. Auto-renews for successive 12-month periods unless either party provides written non-renewal notice at least 60 days before expiry." },
              { id:"s3", title:"§4 · Fees & Payment",           body:"Monthly service fee: $22,500.00. Invoiced on the 1st of each month, due net 30. Late payments subject to 1.5%/month interest. Services may be suspended after 45 days non-payment." },
              { id:"s4", title:"§7 · Confidentiality",         body:"5-year confidentiality obligation post-termination. Healthcare data subject to HIPAA compliance. Both parties bound." },
              { id:"s5", title:"§9 · Limitation of Liability", body:"Provider's total aggregate liability capped at 3 months of fees paid ($67,500). Excludes liability for data breaches caused by Provider negligence." },
            ].map(sec => (
              <div key={sec.id} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
                <p className="text-[10px] text-white/28 font-medium mb-2">{sec.title}</p>
                <p className="text-[11px] text-white/48 leading-relaxed">{sec.body}</p>
              </div>
            ))}
          </div>
          <div className="h-9 border-t border-white/[0.05] flex items-center px-5 justify-between">
            <span className="text-[10px] text-white/20">5 of 6 sections shown</span>
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} className={`w-5 h-5 rounded text-[9px] font-medium ${n<=3?"bg-violet-600/30 text-violet-300":"text-white/20"}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Extraction panel */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Doc identity */}
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/90">ClearMed — Services Agreement</p>
                <p className="text-[11px] text-white/30 mt-0.5">Professional Services · June 1, 2025 · 6 pages · $22,500/month</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">

            {/* A. Extraction Summary */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <BookOpen className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">A. EXTRACTION SUMMARY</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-[12px] text-white/58 leading-relaxed space-y-1.5">
                <p><strong className="text-white/72 font-semibold">Document type:</strong> Professional Services Agreement — 6 pages, 18-month term.</p>
                <p><strong className="text-white/72 font-semibold">Clauses found:</strong> 23 clauses extracted across 7 categories with high confidence.</p>
                <p><strong className="text-white/72 font-semibold">Categories:</strong> Payment/Fees, Termination/Renewal, Obligations, Liability, Confidentiality, Regulatory, Scope.</p>
                <p><strong className="text-white/72 font-semibold">Inspect first:</strong> The <span className="text-amber-300/80 font-semibold">60-day renewal window (§3)</span> — a missed deadline triggers automatic 12-month renewal — and the <span className="text-amber-300/80 font-semibold">$67,500 liability cap (§9)</span>, which is low relative to the contract value.</p>
              </div>
              <div className="mt-2 flex items-start gap-1.5 px-1">
                <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/28">Clause extraction support — source-backed terms, not legal advice. Review with a qualified professional before signing.</p>
              </div>
            </div>

            {/* B. Clause / Confidence Strip */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <FileSearch className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">B. CONFIDENCE STRIP</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-wrap gap-2">
                {[
                  { label: "23 clauses found",          cls: "bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
                  { label: "High extraction confidence", cls: "bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
                  { label: "7 categories",               cls: "bg-violet-500/15 border-violet-500/22 text-violet-300/80" },
                  { label: "6 obligations",              cls: "bg-blue-500/15 border-blue-500/22 text-blue-300/80" },
                  { label: "4 deadlines",                cls: "bg-blue-500/15 border-blue-500/22 text-blue-300/80" },
                  { label: "3 unclear terms",            cls: "bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
                ].map(c => (
                  <span key={c.label} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium ${c.cls}`}>{c.label}</span>
                ))}
              </div>
            </div>

            {/* C. Key Extracted Clauses */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-white/25" />
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">C. KEY EXTRACTED CLAUSES</p>
                </div>
                <span className="text-[10px] text-white/28">6 of 23</span>
              </div>

              {/* D. Category Filters */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {FILTER_TABS.map((t,i) => (
                  <button key={t} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium transition-colors ${i===0 ? "bg-white/[0.1] border-white/[0.15] text-white/75" : "border-white/[0.07] text-white/35 hover:bg-white/[0.04]"}`}>{t}</button>
                ))}
              </div>

              <div className="space-y-2">
                {KEY_CLAUSES.map(cl => {
                  const imp = IMPORTANCE[cl.importance as keyof typeof IMPORTANCE];
                  return (
                    <div key={cl.id} className={`rounded-xl border ${imp.border} ${imp.bg} p-3`}>
                      <div className="flex items-start gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${imp.dot} shrink-0 mt-1`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-white/82">{cl.title}</p>
                            <SChip label={cl.chip} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${imp.badge}`}>{imp.label}</span>
                            <span className="h-4 px-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-[9px] text-white/32">{cl.category}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/48 pl-4 leading-snug">{cl.plain}</p>
                      {cl.action && <p className="text-[10px] text-violet-300/50 pl-4 mt-1.5">› {cl.action}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* E. Obligations & Owners */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Users className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">E. OBLIGATIONS & OWNERS</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-[9px] uppercase tracking-[0.1em] text-white/22 font-semibold px-3.5 py-2 border-b border-white/[0.05]">
                  <span>Obligation</span><span className="text-center px-2">Who</span><span className="text-center px-2">By when</span><span className="text-center px-2">Source</span>
                </div>
                {OBLIGATIONS.map((ob,i) => (
                  <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto] gap-0 px-3.5 py-2.5 items-center ${i<OBLIGATIONS.length-1?"border-b border-white/[0.04]":""}`}>
                    <p className="text-[11px] text-white/55 leading-snug">{ob.obligation}</p>
                    <p className="text-[10px] text-white/35 px-2 text-center whitespace-nowrap">{ob.party}</p>
                    <p className="text-[10px] text-white/30 px-2 text-center whitespace-nowrap">{ob.deadline}</p>
                    <div className="px-2 flex justify-center"><SChip label={ob.chip} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* F. Dates & Deadlines */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Calendar className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">F. DATES & DEADLINES</p>
              </div>
              <div className="space-y-2">
                {DATES.map((d,i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5 flex items-center gap-3">
                    <div className="w-20 shrink-0">
                      <p className="text-[11px] font-semibold text-white/65">{d.date}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/52 truncate">{d.event}</p>
                      {d.notice && <p className="text-[10px] text-amber-300/50 mt-0.5">{d.notice}</p>}
                    </div>
                    <SChip label={d.chip} />
                  </div>
                ))}
              </div>
            </div>

            {/* G. Missing / Unclear */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="w-3 h-3 text-white/25" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24">G. MISSING / UNCLEAR CLAUSES</p>
              </div>
              <div className="space-y-2">
                {MISSING.map((m,i) => (
                  <div key={i} className={`rounded-xl border p-3.5 ${m.level==="flag" ? "border-amber-500/18 bg-amber-500/[0.04]" : "border-white/[0.07] bg-white/[0.015]"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.level==="flag" ? "bg-amber-400/60" : "bg-white/25"}`} />
                      <p className="text-[11px] font-semibold text-white/65">{m.title}</p>
                      <span className={`ml-auto h-4 px-1.5 rounded border text-[9px] font-medium ${m.level==="flag" ? "bg-amber-500/10 border-amber-500/18 text-amber-300/55" : "bg-white/[0.05] border-white/[0.08] text-white/30"}`}>
                        {m.level==="flag" ? "Possible gap" : "Not found"}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/38 pl-3.5 leading-snug">{m.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* H. Source Traceability — collapsed */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025]">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Layers className="w-3.5 h-3.5 text-white/20" />
                <p className="text-white/38 text-xs font-medium flex-1">H. Source Traceability</p>
                <span className="h-4 px-1.5 rounded border bg-violet-500/10 border-violet-500/18 text-[9px] text-violet-300/55">23 source chips</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/18" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
