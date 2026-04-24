import {
  FileText, AlertTriangle, CheckCircle2, ChevronRight, Info,
  ClipboardCheck, Scale, DollarSign, RefreshCcw, Bookmark,
  AlertCircle, CalendarClock, ShieldAlert, Users2
} from "lucide-react";

function SourceChip({ label, active }: { label: string; active?: boolean }) {
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

const RISKS = [
  {
    title: "Auto-renewal requires 90-day written notice to cancel",
    detail: "The agreement renews automatically for successive 12-month terms unless either party gives written notice at least 90 days before the renewal date. This is a tighter window than standard 30-day terms.",
    sev: "high", chip: "§4.1 · p.3", action: "Set a calendar reminder 90 days before May 1, 2026 to send written cancellation notice if you do not wish to renew.",
  },
  {
    title: "Liability cap is limited to one month's fees ($14,400)",
    detail: "Section 8.3 caps the vendor's total liability to a single month of service fees — regardless of losses incurred. For a contract worth $172,800/year, this is a significant limitation.",
    sev: "high", chip: "§8.3 · p.6", action: "Negotiate for a higher cap (e.g. 6 months' fees) or request professional liability coverage for high-stakes deliverables.",
  },
  {
    title: "Dispute resolution requires binding arbitration only",
    detail: "Section 12.2 mandates private binding arbitration for all disputes. You waive the right to a jury trial and class action. Arbitration costs may be borne by the claiming party.",
    sev: "high", chip: "§12.2 · p.8", action: "Review arbitration terms with counsel if this contract governs critical services. Confirm arbitration venue and cost-sharing provisions.",
  },
  {
    title: "IP ownership retains vendor's prior IP",
    detail: "Section 6.1 assigns custom deliverables to you, but explicitly excludes the vendor's pre-existing IP and any improvements to it — which may include core tools embedded in deliverables.",
    sev: "medium", chip: "§6.1 · p.5", action: "Request a schedule listing the vendor's pre-existing IP so you know exactly what you do and do not own in each deliverable.",
  },
  {
    title: "Termination for cause requires 30-day cure period",
    detail: "You must give 30 days written notice and wait for the vendor to remedy a breach before termination takes effect. Material breaches cannot trigger immediate termination.",
    sev: "medium", chip: "§9.2 · p.7", action: "Confirm your team can tolerate a 30-day disruption if the vendor fails to deliver. Consider negotiating for expedited termination rights on critical failures.",
  },
];

const CHECKLIST = [
  { label: "Confirm both parties are named correctly — check legal names, state of incorporation, and signing authority", urgent: true },
  { label: "Set a calendar alert for 90 days before renewal date (by ~February 1, 2026) to decide on cancellation", urgent: true },
  { label: "Negotiate or confirm the $14,400 liability cap is acceptable for the services and risk exposure", urgent: false },
  { label: "Review arbitration venue and cost provisions in Section 12.2 before signing", urgent: false },
  { label: "Request a schedule of vendor's pre-existing IP referenced in Section 6.1", urgent: false },
  { label: "Confirm payment schedule and late fee treatment with your accounts payable team", urgent: false },
  { label: "Verify any exhibits or attachments referenced in the agreement are attached", urgent: false },
  { label: "Review with a qualified professional before signing if this contract governs mission-critical services", urgent: false },
];

const OBLIGATIONS = [
  { party: "Client", what: "Monthly payment of $14,400", when: "1st of each month", chip: "§5.1" },
  { party: "Client", what: "90-day written cancellation notice", when: "Before Feb 1, 2026", chip: "§4.1" },
  { party: "Vendor", what: "Enterprise software deliverables per SOW", when: "Per agreed milestones", chip: "§2.1" },
  { party: "Vendor", what: "Respond to support tickets within 4 hours", when: "Business hours", chip: "§3.2" },
  { party: "Both",   what: "Mutual NDA provisions survive termination", when: "3 years post-term", chip: "§7.4" },
];

const PAYMENT = [
  { label: "Monthly fee",        value: "$14,400.00",         ok: true  },
  { label: "Annual total",       value: "$172,800.00",        ok: true  },
  { label: "Payment due",        value: "Net 30 from invoice",ok: true  },
  { label: "Late fee",           value: "1.5% per month",     ok: false },
  { label: "Suspension right",   value: "After 2 missed payments", ok: false },
  { label: "Early termination",  value: "Fees due through end of term", ok: false },
];

const TERMINATION = [
  { label: "Initial term",        value: "12 months (May 1, 2025 – Apr 30, 2026)", ok: true },
  { label: "Auto-renewal",        value: "Yes — successive 12-month terms",         ok: false },
  { label: "Cancel notice",       value: "90 days written notice required",         ok: false },
  { label: "Termination for cause", value: "30-day cure period before effective",   ok: false },
  { label: "Mutual early exit",   value: "Not provided — negotiate separately",     ok: false },
  { label: "Post-term obligations", value: "Confidentiality survives 3 years",      ok: true },
];

const MISSING = [
  { label: "No data breach notification requirement", risk: "high", note: "No obligation for vendor to notify client of a data breach within a specified window." },
  { label: "No explicit service level agreement (SLA)", risk: "medium", note: "Section 3.2 references response times but no formal SLA, penalties, or uptime guarantees." },
  { label: "No liability cap carve-out for gross negligence", risk: "high", note: "§8.3 cap of $14,400 appears to apply even to gross negligence or willful misconduct." },
  { label: "No force majeure clause", risk: "medium", note: "No provision addressing what happens if either party cannot perform due to events outside their control." },
  { label: "Exhibits referenced but not attached", risk: "low", note: "Exhibits A and B (SOW and Pricing Schedule) are referenced throughout but not visible in this version." },
];

const DOC_SECTIONS = [
  { id: "s1", title: "§1–3 · Parties & Services",    body: `ClearPoint Digital Services, LLC ("Vendor") agrees to provide Enterprise Software Development & Support Services to Redwood Software Group ("Client") as detailed in Exhibit A (Statement of Work) and Exhibit B (Pricing Schedule).` },
  { id: "s2", title: "§4 · Term & Renewal",          body: "The Agreement commences May 1, 2025 for an initial term of twelve (12) months and shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal no less than ninety (90) days prior to the expiration of the then-current term." },
  { id: "s3", title: "§5 · Payment & Fees",          body: "Client shall pay Vendor a monthly service fee of $14,400.00 (Fourteen Thousand Four Hundred US Dollars), due within thirty (30) days of invoice. Payments not received within 30 days shall accrue interest at the rate of 1.5% per month from the due date until paid." },
  { id: "s4", title: "§6 · Intellectual Property",   body: `All work product created specifically for Client under this Agreement shall be assigned to Client upon full payment. Notwithstanding the foregoing, Vendor retains all right, title, and interest in and to Vendor's pre-existing IP and any improvements thereto, even if incorporated into deliverables.` },
  { id: "s5", title: "§8 · Limitation of Liability", body: "IN NO EVENT SHALL VENDOR'S TOTAL CUMULATIVE LIABILITY TO CLIENT EXCEED THE MONTHLY FEES PAID OR PAYABLE IN THE MONTH IMMEDIATELY PRECEDING THE CLAIM ($14,400). THIS LIMITATION APPLIES TO ALL CLAIMS INCLUDING BREACH OF CONTRACT, TORT, AND NEGLIGENCE." },
];

export function ContractReviewCompleted() {
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
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-red-600/12 border-red-500/28 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Review required · 3 critical</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <RefreshCcw className="w-3 h-3" /><span>Re-analyze</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-red-400/45 shrink-0" />
            <span className="text-white/40 text-xs flex-1 truncate">ClearPoint MSA v2 — Enterprise Software Services</span>
            <span className="text-white/18 text-xs shrink-0">8 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-0.5">
              {["Fit","75%","100%"].map((z,i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i===1?"bg-white/[0.07] text-white/55":"text-white/22"}`}>{z}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {DOC_SECTIONS.map(s => (
              <div key={s.id} className="w-full rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 flex flex-col gap-2">
                <p className="text-[9px] font-mono text-white/18">{s.title}</p>
                <p className="text-[11px] text-white/33 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">5 sections shown</span>
            <div className="flex items-center gap-1">{[1,2,3,4,5,6,7,8].map(n=><button key={n} className="w-6 h-6 rounded-md text-[9px] flex items-center justify-center text-white/22">{n}</button>)}</div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: contract intelligence panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-4">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-4 h-4 text-red-400/80" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/90 text-sm font-semibold">ClearPoint MSA — Enterprise Services</h1>
                  <span className="h-4 px-1.5 rounded border border-red-500/28 bg-red-500/10 text-red-300/80 text-[9px] font-medium">Review Required</span>
                </div>
                <p className="text-white/28 text-[10px]">Master Service Agreement · May 1, 2025 · 8 pages · $14,400/mo</p>
              </div>
            </div>

            {/* A. Plain-English Summary */}
            <div className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-4">
              <PL icon={<FileText className="w-3.5 h-3.5" />}>A. Plain-English Contract Summary</PL>
              <p className="text-white/70 text-sm leading-[1.75]">
                This is a 12-month Master Service Agreement between <strong className="text-white/85">Redwood Software Group</strong> (client) and <strong className="text-white/85">ClearPoint Digital Services</strong> (vendor) for enterprise software development at $14,400/month. Pay attention to the <strong className="text-amber-300">auto-renewal clause</strong> — 90 days notice is required to cancel. The <strong className="text-red-300">liability cap of $14,400</strong> is unusually low for a $172,800/year contract. Binding arbitration removes your right to a jury trial. These are <strong className="text-white/80">risk indicators, not legal determinations</strong> — review with a qualified professional before signing.
              </p>
            </div>

            {/* B. Risk / Confidence Strip */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL icon={<AlertTriangle className="w-3.5 h-3.5" />}>B. Risk &amp; Confidence</PL>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-red-600/12 border-red-500/22 text-red-300">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[11px] font-semibold">High risk</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-sky-600/10 border-sky-500/20 text-sky-300">
                  <span className="text-[10px]">High confidence</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-white/[0.04] border-white/[0.08] text-white/42">
                  <span className="text-[10px]">Service agreement</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                {[
                  { label: "3 critical risks",   cls: "bg-red-500/10 border-red-500/20 text-red-300",    dot: "bg-red-400" },
                  { label: "2 caution terms",    cls: "bg-amber-500/10 border-amber-500/20 text-amber-300", dot: "bg-amber-400" },
                  { label: "5 obligations",      cls: "bg-white/[0.04] border-white/[0.08] text-white/35",  dot: "bg-white/25" },
                  { label: "2 key deadlines",    cls: "bg-white/[0.04] border-white/[0.08] text-white/35",  dot: "bg-white/25" },
                  { label: "5 missing/weak",     cls: "bg-white/[0.04] border-white/[0.08] text-white/35",  dot: "bg-white/25" },
                ].map((c,i) => (
                  <div key={i} className={`h-5 px-2 rounded-full border flex items-center gap-1 ${c.cls}`}>
                    <div className={`w-1 h-1 rounded-full shrink-0 ${c.dot}`} />
                    <span className="text-[9px] font-medium">{c.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <Info className="w-2.5 h-2.5 text-white/20 mt-[2px] shrink-0" />
                <p className="text-white/22 text-[9px] leading-relaxed">PlainPath provides contract review support — risk indicators, terms to verify, and source-backed findings. This is not legal advice.</p>
              </div>
            </div>

            {/* C. Key Contract Risks */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                right={<span className="h-4 px-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-300/70 text-[9px]">5 risks found</span>}
              >
                C. Key Contract Risks
              </PL>
              <div className="flex flex-col gap-2">
                {RISKS.map((r, i) => {
                  const isHigh = r.sev === "high";
                  return (
                    <div key={i} className={`rounded-xl border px-3.5 py-3 ${isHigh ? "border-red-500/18 bg-red-500/[0.03]" : "border-amber-500/15 bg-amber-500/[0.025]"}`}>
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${isHigh ? "bg-red-400" : "bg-amber-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-xs font-medium leading-snug flex-1 ${isHigh ? "text-red-200/80" : "text-amber-200/75"}`}>{r.title}</p>
                            <SourceChip label={r.chip} />
                          </div>
                          <p className="text-white/35 text-[10px] leading-relaxed">{r.detail}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 pl-4">
                        <ChevronRight className="w-2.5 h-2.5 text-violet-400/35 shrink-0 mt-0.5" />
                        <p className="text-violet-300/50 text-[10px] leading-relaxed">{r.action}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. Required Next Steps */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.06) 0%, rgba(12,12,15,0) 55%)" }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/28 flex items-center justify-center">
                  <ClipboardCheck className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-white/85 text-sm font-semibold flex-1">D. Required Next Steps</p>
                <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20">
                  <span className="text-red-300/80 text-[9px] font-medium">2 urgent</span>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {CHECKLIST.map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-white/[0.02] ${item.urgent ? "border-white/[0.10] bg-white/[0.018]" : "border-white/[0.06]"}`}>
                    <div className="w-3.5 h-3.5 rounded border border-white/[0.18] flex-shrink-0 mt-0.5" />
                    <p className={`text-[10px] leading-relaxed flex-1 ${item.urgent ? "text-white/75 font-medium" : "text-white/38"}`}>{item.label}</p>
                    {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* E. Obligations & Responsibilities */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL icon={<Users2 className="w-3.5 h-3.5" />}>E. Obligations &amp; Responsibilities</PL>
              <div className="flex flex-col gap-1.5">
                {OBLIGATIONS.map((ob, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.05] bg-white/[0.01]">
                    <span className={`h-4 px-1.5 rounded text-[9px] font-medium shrink-0 mt-0.5 ${ob.party==="Client" ? "bg-sky-500/15 border border-sky-500/20 text-sky-300" : ob.party==="Vendor" ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-300" : "bg-white/[0.06] border border-white/10 text-white/35"}`}>{ob.party}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/58 text-[11px] font-medium leading-tight">{ob.what}</p>
                      {ob.when && <p className="text-white/28 text-[10px] mt-0.5">Due: {ob.when}</p>}
                    </div>
                    <SourceChip label={ob.chip} />
                  </div>
                ))}
              </div>
            </div>

            {/* F. Payment / Fees / Penalties */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL icon={<DollarSign className="w-3.5 h-3.5" />}>F. Payment &amp; Fees</PL>
              <div className="flex flex-col gap-1.5">
                {PAYMENT.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.ok ? "bg-emerald-400/55" : "bg-amber-400/65"}`} />
                    <p className="text-white/28 text-[10px] shrink-0 w-28">{p.label}</p>
                    <p className={`text-[10px] ml-auto ${p.ok ? "text-white/50" : "text-amber-300/60"}`}>{p.value}</p>
                    {!p.ok && <SourceChip label="§5" />}
                  </div>
                ))}
              </div>
            </div>

            {/* G. Termination / Renewal */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL icon={<CalendarClock className="w-3.5 h-3.5" />}>G. Termination &amp; Renewal</PL>
              <div className="flex flex-col gap-1.5">
                {TERMINATION.map((t, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border ${t.ok ? "border-white/[0.04]" : "border-amber-500/12 bg-amber-500/[0.02]"}`}>
                    {t.ok
                      ? <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0" />
                      : <AlertTriangle className="w-3 h-3 text-amber-400/60 shrink-0" />
                    }
                    <p className="text-white/28 text-[10px] shrink-0 w-28">{t.label}</p>
                    <p className={`text-[10px] ml-auto ${t.ok ? "text-white/48" : "text-amber-300/55"}`}>{t.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* H. Missing / Weak Protections */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
              <PL icon={<ShieldAlert className="w-3.5 h-3.5 text-red-400/50" />}
                right={<span className="h-4 px-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-300/70 text-[9px]">5 gaps</span>}
              >
                H. Missing or Weak Protections
              </PL>
              <div className="flex flex-col gap-1.5">
                {MISSING.map((m, i) => (
                  <div key={i} className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${m.risk === "high" ? "border-red-500/15 bg-red-500/[0.02]" : m.risk === "medium" ? "border-amber-500/12 bg-amber-500/[0.015]" : "border-white/[0.05]"}`}>
                    <AlertCircle className={`w-3 h-3 shrink-0 mt-0.5 ${m.risk === "high" ? "text-red-400/60" : m.risk === "medium" ? "text-amber-400/55" : "text-white/22"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-medium leading-tight mb-0.5 ${m.risk === "high" ? "text-red-200/65" : m.risk === "medium" ? "text-amber-200/60" : "text-white/38"}`}>{m.label}</p>
                      <p className="text-white/28 text-[10px] leading-relaxed">{m.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* I. Source Traceability */}
            <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
              <PL icon={<FileText className="w-3.5 h-3.5 text-violet-400/50" />}>I. Source Traceability</PL>
              <p className="text-white/25 text-[10px] leading-relaxed mb-3">Each contract finding links to the clause where PlainPath found it. Click a chip to jump to that section in the viewer.</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Auto-renewal — 90-day notice required",       chip: "§4.1 · p.3" },
                  { label: "Liability cap — $14,400 maximum",             chip: "§8.3 · p.6" },
                  { label: "Binding arbitration — no jury trial",         chip: "§12.2 · p.8" },
                  { label: "IP ownership — vendor's prior IP excluded",   chip: "§6.1 · p.5" },
                  { label: "Late payment — 1.5%/month penalty",           chip: "§5.4 · p.4" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.05] bg-white/[0.01] cursor-pointer hover:bg-violet-500/[0.04] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/15" />
                    <p className="text-white/35 text-[10px] flex-1 truncate">{item.label}</p>
                    <SourceChip label={item.chip} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
