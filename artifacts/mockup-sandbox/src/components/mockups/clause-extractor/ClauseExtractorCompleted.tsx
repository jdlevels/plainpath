import {
  FileText, AlertTriangle, CheckCircle2, ChevronDown,
  DollarSign, RefreshCcw, ShieldAlert, Calendar, Users,
  Info, Scale, FileSearch, BookOpen, Clock, AlertCircle
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

function PL({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="shrink-0 text-white/25">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24 flex-1">{children}</p>
      {right}
    </div>
  );
}

function CollapsedSection({ icon, title, badge, badgeColor = "default" }: { icon: React.ReactNode; title: string; badge: string; badgeColor?: "default" | "amber" | "red" | "green" }) {
  const cls = badgeColor === "red" ? "bg-red-500/10 border-red-500/18 text-red-300/60"
    : badgeColor === "amber" ? "bg-amber-500/10 border-amber-500/18 text-amber-300/60"
    : badgeColor === "green" ? "bg-emerald-500/10 border-emerald-500/18 text-emerald-300/60"
    : "bg-white/[0.05] border-white/[0.08] text-white/28";
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025] transition-colors">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="text-white/20">{icon}</span>
        <p className="text-white/38 text-xs font-medium flex-1">{title}</p>
        <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${cls}`}>{badge}</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/18" />
      </div>
    </div>
  );
}

const DOC_SECTIONS = [
  { id: "s1", title: "§1–2 · Parties & Scope",       body: `ClearMed Technology Group ("Client") engages Northbridge Digital Solutions LLC ("Provider") to deliver Healthcare Data Management & Analytics Services as defined in Schedule A (Statement of Work) and Schedule B (Fee Schedule).` },
  { id: "s2", title: "§3 · Term & Renewal",           body: "Initial term: 18 months commencing June 1, 2025. Agreement auto-renews for successive 12-month periods unless either party provides written notice of non-renewal at least 60 days prior to expiration." },
  { id: "s3", title: "§4 · Fees & Payment",           body: "Monthly service fee: $22,500.00. Invoiced on the 1st of each month, due net 30. Late payments subject to 1.5% per month interest. Provider may suspend services after 45 days of non-payment." },
  { id: "s4", title: "§7 · Confidentiality",         body: "Each party agrees to maintain strict confidentiality of the other party's Proprietary Information for a period of 5 years after termination. Healthcare data subject to HIPAA compliance requirements." },
  { id: "s5", title: "§9 · Limitation of Liability", body: "Provider's total aggregate liability capped at 3 months of fees paid preceding the claim ($67,500). Excludes liability for data breaches caused by Provider negligence." },
];

const KEY_CLAUSES = [
  { id: "c1", title: "Auto-renewal — 60-day written notice required",  category: "Termination/Renewal", plain: "Miss the 60-day window and you're locked in for another 12 months.", risk: "high",  chip: "§3 · p.3",   action: "Set calendar alert for Oct 1, 2026 (60 days before expiry)." },
  { id: "c2", title: "Monthly fee $22,500 — net-30 payment terms",    category: "Payment/Fees",        plain: "Invoice arrives monthly; late payments accrue 1.5%/month until paid.",  risk: "watch", chip: "§4 · p.4",   action: "Confirm AP calendar aligns with net-30 terms." },
  { id: "c3", title: "5-year confidentiality obligation post-termination", category: "Confidentiality", plain: "Both parties must protect each other's data for 5 years after the contract ends.", risk: "ok", chip: "§7 · p.6" },
  { id: "c4", title: "Liability cap — 3 months of fees ($67,500)",    category: "Liability",           plain: "Maximum you can recover from Provider in any claim, regardless of actual damages.", risk: "high",  chip: "§9 · p.7",   action: "Consider requiring professional liability insurance." },
  { id: "c5", title: "HIPAA compliance obligation on Provider",        category: "Regulatory",          plain: "Provider is contractually obligated to comply with HIPAA for all healthcare data.", risk: "ok",   chip: "§7 · p.6" },
];

const RISK_COLORS = {
  high:  { dot: "bg-red-500",    bg: "bg-red-500/[0.07]",   border: "border-red-500/15",   text: "text-red-400/80",   badge: "bg-red-500/10 border-red-500/18 text-red-300/60",   label: "High priority" },
  watch: { dot: "bg-amber-500",  bg: "bg-amber-500/[0.06]", border: "border-amber-500/15", text: "text-amber-400/70", badge: "bg-amber-500/10 border-amber-500/18 text-amber-300/60", label: "Review" },
  ok:    { dot: "bg-emerald-500",bg: "bg-emerald-500/[0.05]",border: "border-emerald-500/12",text:"text-emerald-400/70",badge:"bg-emerald-500/10 border-emerald-500/18 text-emerald-300/60", label: "Extracted" },
};

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
          <div className="h-6 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-300/80 font-medium">Review required · 2 high-priority</span>
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

        {/* Left — Document viewer */}
        <div className="w-[57%] border-r border-white/[0.05] flex flex-col overflow-hidden">
          <div className="h-10 border-b border-white/[0.05] flex items-center px-5 gap-2 shrink-0">
            <FileText className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs text-white/55 font-medium">ClearMed Services Agreement v3</span>
            <span className="text-white/15 text-[10px] mx-1">—</span>
            <span className="text-[10px] text-white/25">Professional Services</span>
            <span className="ml-auto text-[10px] text-white/25">6 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {DOC_SECTIONS.map(sec => (
              <div key={sec.id} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                <p className="text-[10px] text-white/28 font-medium mb-2">{sec.title}</p>
                <p className="text-xs text-white/50 leading-relaxed">{sec.body}</p>
              </div>
            ))}
          </div>
          <div className="h-9 border-t border-white/[0.05] flex items-center px-5 justify-between">
            <span className="text-[10px] text-white/20">5 of 6 sections shown</span>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} className={`w-5 h-5 rounded text-[9px] font-medium ${n <= 3 ? "bg-violet-600/30 text-violet-300" : "text-white/20 hover:text-white/40"}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Clause intel panel */}
        <div className="flex-1 flex flex-col overflow-y-auto">

          {/* Doc identity */}
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.04] shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white/90 truncate">ClearMed — Services Agreement</p>
                  <span className="h-4 px-1.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-300/70 text-[9px] font-medium">Review Required</span>
                </div>
                <p className="text-[11px] text-white/32 mt-0.5">Professional Services Agreement · June 1, 2025 · 6 pages · $22,500/month</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">

            {/* A. Extraction Summary */}
            <div>
              <PL icon={<BookOpen className="w-3 h-3" />}>A. EXTRACTION SUMMARY</PL>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs text-white/60 leading-relaxed">
                This is an 18-month <strong className="text-white/75 font-semibold">professional services agreement</strong> between <strong className="text-white/75 font-semibold">ClearMed Technology Group</strong> (you) and <strong className="text-white/75 font-semibold">Northbridge Digital Solutions</strong> at $22,500/month. PlainPath extracted <strong className="text-white/75 font-semibold">23 clauses</strong> across 7 categories. The two clauses requiring your attention are the <span className="text-amber-300/80 font-semibold">60-day auto-renewal window in §3</span> — a missed deadline means another 12-month commitment — and the <span className="text-amber-300/80 font-semibold">$67,500 liability cap in §9</span>, unusually low for a $270,000-per-year contract. Review with a qualified professional before signing.
              </div>
            </div>

            {/* B. Clause / Confidence Strip */}
            <div>
              <PL icon={<FileSearch className="w-3 h-3" />}>B. CLAUSE / CONFIDENCE STRIP</PL>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-wrap gap-2">
                {[
                  { label: "23 clauses found",     color: "bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
                  { label: "High confidence",       color: "bg-emerald-500/15 border-emerald-500/22 text-emerald-300/80" },
                  { label: "Professional Services", color: "bg-violet-500/15 border-violet-500/22 text-violet-300/80" },
                  { label: "4 deadlines found",     color: "bg-blue-500/15 border-blue-500/22 text-blue-300/80" },
                  { label: "8 obligations",         color: "bg-white/[0.08] border-white/[0.1] text-white/50" },
                  { label: "2 high-priority",       color: "bg-amber-500/15 border-amber-500/22 text-amber-300/80" },
                ].map(c => (
                  <span key={c.label} className={`h-6 px-2.5 rounded-full border text-[10px] font-medium ${c.color}`}>{c.label}</span>
                ))}
              </div>
              <div className="mt-2 px-1 flex items-start gap-1.5">
                <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/28 leading-snug">Clause extraction support — source-backed extracted terms, not legal advice. Review with a qualified professional before signing.</p>
              </div>
            </div>

            {/* C. Key Clauses */}
            <div>
              <PL icon={<AlertCircle className="w-3 h-3" />} right={<span className="h-4 px-1.5 rounded bg-amber-500/10 border border-amber-500/18 text-[9px] font-medium text-amber-300/60">5 shown</span>}>C. KEY CLAUSES</PL>
              <div className="space-y-2.5">
                {KEY_CLAUSES.map(cl => {
                  const r = RISK_COLORS[cl.risk as keyof typeof RISK_COLORS];
                  return (
                    <div key={cl.id} className={`rounded-xl border ${r.border} ${r.bg} p-3.5`}>
                      <div className="flex items-start gap-2 mb-1.5">
                        <div className={`w-2 h-2 rounded-full ${r.dot} shrink-0 mt-1`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-white/82">{cl.title}</p>
                            <SChip label={cl.chip} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${r.badge}`}>{r.label}</span>
                            <span className="h-4 px-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-[9px] font-medium text-white/35">{cl.category}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/48 pl-4 leading-snug">{cl.plain}</p>
                      {cl.action && <p className="text-[10px] text-violet-300/55 pl-4 mt-1.5 flex items-start gap-1"><span className="shrink-0 mt-0.5">›</span>{cl.action}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D–G collapsed */}
            <div className="space-y-2">
              <CollapsedSection icon={<DollarSign className="w-3.5 h-3.5" />}  title="D. Payment & Fee Terms"         badge="4 clauses"   badgeColor="default" />
              <CollapsedSection icon={<RefreshCcw className="w-3.5 h-3.5" />}  title="E. Obligations & Owners"        badge="8 obligations" badgeColor="default" />
              <CollapsedSection icon={<Clock className="w-3.5 h-3.5" />}       title="F. Dates & Deadlines"           badge="4 deadlines" badgeColor="amber" />
              <CollapsedSection icon={<AlertTriangle className="w-3.5 h-3.5" />} title="G. Missing / Unclear Clauses" badge="3 flagged"    badgeColor="amber" />
              <CollapsedSection icon={<ShieldAlert className="w-3.5 h-3.5" />} title="H. Clause Categories"           badge="7 categories" badgeColor="default" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
