import {
  FileText, AlertTriangle, CheckCircle2, ChevronRight, ChevronDown,
  ClipboardCheck, Scale, DollarSign, RefreshCcw, Bookmark,
  AlertCircle, CalendarClock, ShieldAlert, Users2, Info
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

function CollapsedSection({ icon, title, badge, badgeColor = "default" }: {
  icon: React.ReactNode; title: string; badge: string;
  badgeColor?: "default" | "amber" | "red";
}) {
  const badgeCls = badgeColor === "red"
    ? "bg-red-500/10 border-red-500/18 text-red-300/60"
    : badgeColor === "amber"
    ? "bg-amber-500/10 border-amber-500/18 text-amber-300/60"
    : "bg-white/[0.05] border-white/[0.08] text-white/28";
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] cursor-pointer hover:bg-white/[0.025] transition-colors">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="text-white/20">{icon}</span>
        <p className="text-white/38 text-xs font-medium flex-1">{title}</p>
        <span className={`h-4 px-1.5 rounded border text-[9px] font-medium ${badgeCls}`}>{badge}</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/18" />
      </div>
    </div>
  );
}

const RISKS = [
  {
    title: "Auto-renewal requires 90 days written notice to cancel",
    detail: "Missed deadline in §4.1 = automatic 12-month renewal. Next cancellation window closes around February 1, 2026.",
    sev: "high", chip: "§4.1 · p.3",
    action: "Set a calendar reminder now for 90 days before May 1, 2026.",
  },
  {
    title: "Liability cap is limited to one month of fees ($14,400)",
    detail: "§8.3 caps total vendor liability at a single monthly fee — regardless of losses. Unusually low for a $172,800/year contract.",
    sev: "high", chip: "§8.3 · p.6",
    action: "Negotiate for a higher cap (6 months) or require professional liability insurance.",
  },
  {
    title: "Binding arbitration waives right to jury trial",
    detail: "§12.2 requires private arbitration for all disputes. Class actions are also waived. Initiating party may bear arbitration costs.",
    sev: "high", chip: "§12.2 · p.8",
    action: "Review arbitration venue and cost terms with a qualified professional before signing.",
  },
  {
    title: "Vendor retains pre-existing IP embedded in deliverables",
    detail: "§6.1 assigns custom work to you but excludes vendor's prior IP — which may include core tools embedded in what you receive.",
    sev: "caution", chip: "§6.1 · p.5",
    action: "Request a written list of vendor's pre-existing IP before work begins.",
  },
  {
    title: "Termination for cause requires a 30-day cure period",
    detail: "You cannot terminate immediately for breach — §9.2 requires 30 days written notice to cure. No expedited exit for critical failures.",
    sev: "caution", chip: "§9.2 · p.7",
    action: "Confirm you can tolerate a 30-day disruption before termination would take effect.",
  },
];

const CHECKLIST = [
  { label: "Confirm both parties' legal names and signing authority match the contract header",       urgent: true  },
  { label: "Set a reminder for February 1, 2026 — 90-day cancellation window under §4.1",            urgent: true  },
  { label: "Confirm or negotiate the $14,400 liability cap in §8.3 before signing",                  urgent: false },
  { label: "Review binding arbitration terms in §12.2 — confirm venue and cost allocation",          urgent: false },
  { label: "Request vendor's pre-existing IP list before work begins (§6.1)",                        urgent: false },
  { label: "Confirm Exhibits A and B (SOW and Pricing Schedule) are attached before signing",        urgent: false },
  { label: "Review dispute resolution and termination terms with a qualified professional if high-risk", urgent: false },
];

const SOURCE_ITEMS = [
  { label: "Auto-renewal — 90-day notice window",          chip: "§4.1 · p.3" },
  { label: "Liability cap — $14,400 maximum",              chip: "§8.3 · p.6" },
  { label: "Binding arbitration — no jury trial",          chip: "§12.2 · p.8" },
  { label: "IP ownership — vendor's prior IP retained",    chip: "§6.1 · p.5" },
  { label: "Late payment — 1.5%/month penalty",            chip: "§5.4 · p.4" },
];

const DOC_SECTIONS = [
  { id: "s1", title: "§1–3 · Parties & Services",    body: `ClearPoint Digital Services, LLC ("Vendor") agrees to provide Enterprise Software Development & Support Services to Redwood Software Group ("Client") as detailed in Exhibit A (Statement of Work) and Exhibit B (Pricing Schedule).` },
  { id: "s2", title: "§4 · Term & Renewal",          body: "Initial term: 12 months, May 1 2025 – Apr 30 2026. Auto-renews for successive 12-month periods unless written non-renewal notice is provided at least 90 days before term end." },
  { id: "s3", title: "§5 · Payment & Fees",          body: "Monthly fee: $14,400.00. Due net 30 from invoice. Late payments accrue interest at 1.5% per month. Vendor may suspend services after 2 missed payments." },
  { id: "s4", title: "§6 · Intellectual Property",   body: `Custom deliverables assigned to Client on full payment. Vendor retains all pre-existing IP and improvements thereto, even if incorporated into deliverables.` },
  { id: "s5", title: "§8 · Limitation of Liability", body: "Total vendor liability capped at the monthly fee paid in the month preceding the claim ($14,400). Applies to all claims including breach, tort, and negligence." },
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
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-red-600/12 border-red-500/25 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Review required · 3 high-risk</span>
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
        <div className="w-[57%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-red-400/40 shrink-0" />
            <span className="text-white/38 text-xs flex-1 truncate">ClearPoint MSA v2 — Enterprise Software Services</span>
            <span className="text-white/18 text-xs shrink-0">8 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-0.5">
              {["Fit","75%","100%"].map((z,i)=>(
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
            <span className="text-white/20 text-xs">5 of 8 sections</span>
            <div className="flex items-center gap-1">{[1,2,3,4,5,6,7,8].map(n=><button key={n} className="w-6 h-6 rounded-md text-[9px] flex items-center justify-center text-white/22">{n}</button>)}</div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: decision dashboard */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-3.5">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-3.5 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/18 flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-4 h-4 text-red-400/80" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/88 text-sm font-semibold">ClearPoint MSA — Enterprise Services</h1>
                  <span className="h-4 px-1.5 rounded border border-red-500/25 bg-red-500/10 text-red-300/80 text-[9px] font-medium">Review Required</span>
                </div>
                <p className="text-white/28 text-[10px]">Master Service Agreement · May 1, 2025 · 8 pages · $14,400/month</p>
              </div>
            </div>

            {/* A. Plain-English Summary */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL icon={<FileText className="w-3.5 h-3.5" />}>A. Plain-English Summary</PL>
              <p className="text-white/68 text-[12.5px] leading-[1.75]">
                This is a 12-month service agreement between <strong className="text-white/85">Redwood Software Group</strong> (you) and <strong className="text-white/85">ClearPoint Digital Services</strong> at $14,400/month. Three terms need your attention before signing: the <strong className="text-amber-300">90-day auto-renewal window in §4.1</strong> — a missed deadline means another 12-month commitment; the <strong className="text-red-300">$14,400 liability cap in §8.3</strong> — unusually low for a $172,800/year contract; and <strong className="text-amber-300">binding arbitration in §12.2</strong>, which waives your jury trial rights. Exhibits A and B are referenced but not attached. <span className="text-white/35">Review with a qualified professional before signing.</span>
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
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-sky-600/10 border-sky-500/18 text-sky-300/80">
                  <span className="text-[10px]">High confidence</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-white/[0.04] border-white/[0.07] text-white/38">
                  <span className="text-[10px]">Master Service Agreement</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                {[
                  { label: "3 high-risk terms", cls: "bg-red-500/10 border-red-500/18 text-red-300",       dot: "bg-red-400"    },
                  { label: "2 caution terms",   cls: "bg-amber-500/10 border-amber-500/15 text-amber-300", dot: "bg-amber-400"  },
                  { label: "2 urgent actions",  cls: "bg-white/[0.04] border-white/[0.08] text-white/35",  dot: "bg-white/25"   },
                  { label: "5 possible gaps",   cls: "bg-white/[0.04] border-white/[0.08] text-white/35",  dot: "bg-white/25"   },
                ].map((c,i) => (
                  <div key={i} className={`h-5 px-2 rounded-full border flex items-center gap-1 ${c.cls}`}>
                    <div className={`w-1 h-1 rounded-full shrink-0 ${c.dot}`} />
                    <span className="text-[9px] font-medium">{c.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <Info className="w-2.5 h-2.5 text-white/20 mt-[2px] shrink-0" />
                <p className="text-white/22 text-[9px] leading-relaxed">Contract review support — risk indicators, terms to verify, and possible missing protections. Not legal advice. Review with a qualified professional before signing high-risk contracts.</p>
              </div>
            </div>

            {/* C. Key Contract Risks */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                right={<span className="h-4 px-1.5 rounded bg-red-500/10 border border-red-500/18 text-red-300/65 text-[9px]">5 risks</span>}
              >C. Key Contract Risks</PL>
              <div className="flex flex-col gap-2">
                {RISKS.map((r, i) => {
                  const isHigh = r.sev === "high";
                  return (
                    <div key={i} className={`rounded-xl border px-3.5 py-3 ${isHigh ? "border-red-500/16 bg-red-500/[0.025]" : "border-amber-500/14 bg-amber-500/[0.02]"}`}>
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${isHigh ? "bg-red-400" : "bg-amber-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-[11.5px] font-medium leading-snug flex-1 ${isHigh ? "text-red-200/80" : "text-amber-200/75"}`}>{r.title}</p>
                            <SourceChip label={r.chip} />
                          </div>
                          <p className="text-white/35 text-[10px] leading-relaxed">{r.detail}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 pl-4">
                        <ChevronRight className="w-2.5 h-2.5 text-violet-400/32 shrink-0 mt-0.5" />
                        <p className="text-violet-300/48 text-[10px] leading-relaxed">{r.action}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. Required Next Steps */}
            <div className="rounded-xl overflow-hidden border border-white/[0.08]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.055) 0%, rgba(12,12,15,0) 55%)" }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/25 flex items-center justify-center">
                  <ClipboardCheck className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-white/82 text-sm font-semibold flex-1">D. Required Next Steps</p>
                <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/18">
                  <span className="text-red-300/75 text-[9px] font-medium">2 urgent</span>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {CHECKLIST.map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-white/[0.02] ${item.urgent ? "border-white/[0.10] bg-white/[0.018]" : "border-white/[0.06]"}`}>
                    <div className="w-3.5 h-3.5 rounded border border-white/[0.18] flex-shrink-0 mt-0.5" />
                    <p className={`text-[10px] leading-relaxed flex-1 ${item.urgent ? "text-white/72 font-medium" : "text-white/36"}`}>{item.label}</p>
                    {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* E. Source Traceability */}
            <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
              <PL icon={<FileText className="w-3.5 h-3.5 text-violet-400/45" />}>E. Source Traceability</PL>
              <p className="text-white/22 text-[10px] leading-relaxed mb-3">Each risk finding links to the clause where PlainPath found it. Click a chip to jump to that section in the document viewer.</p>
              <div className="flex flex-col gap-1.5">
                {SOURCE_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.05] bg-white/[0.01] cursor-pointer hover:bg-violet-500/[0.04] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/15" />
                    <p className="text-white/33 text-[10px] flex-1 truncate">{item.label}</p>
                    <SourceChip label={item.chip} />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <p className="text-white/18 text-[9px] uppercase tracking-widest font-semibold">More details</p>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Collapsed deeper sections */}
            <CollapsedSection icon={<Users2 className="w-3.5 h-3.5" />}        title="Obligations & Responsibilities" badge="5 items"            />
            <CollapsedSection icon={<DollarSign className="w-3.5 h-3.5" />}    title="Payment, Fees & Penalties"     badge="6 items" badgeColor="amber" />
            <CollapsedSection icon={<CalendarClock className="w-3.5 h-3.5" />} title="Termination & Renewal"         badge="5 items" badgeColor="amber" />
            <CollapsedSection icon={<ShieldAlert className="w-3.5 h-3.5" />}   title="Possible Missing Protections"  badge="5 possible gaps" badgeColor="red" />

            <div className="pb-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
