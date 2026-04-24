import {
  FileText, AlertTriangle, CheckCircle2, ChevronRight,
  Bookmark, RefreshCcw, Scale, X, DollarSign, Users2,
  CalendarClock, ShieldAlert, AlertCircle
} from "lucide-react";

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.20)]"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
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

const DOC_SECTIONS = [
  {
    id: "s1", title: "§1–3 · Parties & Services", active: false,
    body: `ClearPoint Digital Services, LLC ("Vendor") agrees to provide Enterprise Software Development & Support Services to Redwood Software Group ("Client") as detailed in Exhibit A (Statement of Work) and Exhibit B (Pricing Schedule).`,
  },
  {
    id: "s2", title: "§4 · Term & Renewal", active: false,
    body: "The Agreement commences May 1, 2025 for an initial term of twelve (12) months and shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal no less than ninety (90) days prior to the expiration of the then-current term.",
  },
  {
    id: "s3", title: "§5 · Payment & Fees — Active Source", active: true,
    body: "Client shall pay Vendor a monthly service fee of $14,400.00 (Fourteen Thousand Four Hundred US Dollars), due within thirty (30) days of invoice. Payments not received within 30 days shall accrue interest at the rate of 1.5% per month from the due date until paid.",
    highlight: "Payments not received within 30 days shall accrue interest at the rate of 1.5% per month from the due date until paid.",
  },
  {
    id: "s4", title: "§6 · Intellectual Property", active: false,
    body: "All work product created specifically for Client under this Agreement shall be assigned to Client upon full payment. Vendor retains all right, title, and interest in and to Vendor's pre-existing IP and any improvements thereto.",
  },
  {
    id: "s5", title: "§8 · Limitation of Liability", active: false,
    body: "IN NO EVENT SHALL VENDOR'S TOTAL CUMULATIVE LIABILITY TO CLIENT EXCEED THE MONTHLY FEES PAID OR PAYABLE IN THE MONTH IMMEDIATELY PRECEDING THE CLAIM ($14,400).",
  },
];

const RISKS = [
  {
    title: "Auto-renewal requires 90-day written notice to cancel",
    sev: "high", chip: "§4.1 · p.3",
    action: "Set a calendar reminder 90 days before May 1, 2026.",
    active: false,
  },
  {
    title: "Late payment penalty — 1.5% per month",
    sev: "high", chip: "§5.4 · p.4",
    action: "Ensure payment calendar matches net-30 invoice terms to avoid accrual.",
    detail: "Late fees of 1.5%/month are unusually high. On a $14,400 invoice, this accrues at $216/month.",
    active: true,
  },
  {
    title: "Liability cap limited to one month's fees ($14,400)",
    sev: "high", chip: "§8.3 · p.6",
    action: "Negotiate for a 6-month fee cap or professional liability coverage.",
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
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-red-600/12 border-red-500/28 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Review required · 3 critical</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer — scrolled to active section */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-red-400/45 shrink-0" />
            <span className="text-white/40 text-xs flex-1 truncate">ClearPoint MSA v2 — Enterprise Software Services</span>
            <span className="text-white/18 text-xs shrink-0">8 pp.</span>
          </div>

          {/* Active citation banner */}
          <div className="mx-3 mt-2 mb-1 shrink-0 rounded-lg border border-violet-500/28 bg-violet-500/[0.07] px-3 py-2 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-violet-200/85 text-[10px] font-medium truncate">
                Source: "…shall accrue interest at the rate of 1.5% per month…"
              </p>
              <p className="text-violet-300/40 text-[9px]">Jumped from contract risk finding — §5 Payment & Fees · p.4</p>
            </div>
            <button className="text-white/20 hover:text-white/45 shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {DOC_SECTIONS.map(s => (
              <div key={s.id} className={`w-full rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${s.active ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.07)]" : "border-white/[0.05] bg-white/[0.015]"}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-[9px] font-mono ${s.active ? "text-violet-300/60" : "text-white/18"}`}>{s.title}</p>
                  {s.active && (
                    <div className="flex items-center gap-1 h-4 px-1.5 rounded-full bg-violet-500/25 border border-violet-500/35">
                      <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-200/75 text-[9px]">+ Source</span>
                    </div>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed ${s.active ? "text-white/60" : "text-white/33"}`}>{s.body}</p>
                {s.active && s.highlight && (
                  <div className="mt-1 rounded-lg border border-violet-500/22 bg-violet-500/[0.07] px-2.5 py-2">
                    <p className="text-violet-200/65 text-[9px] leading-relaxed">"{s.highlight}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">Section 3 of 5</span>
            <div className="flex items-center gap-1">{[1,2,3,4,5].map(n => <button key={n} className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center ${n===3?"bg-violet-600 text-white":"text-white/22"}`}>{n}</button>)}</div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: contract intelligence panel — risk finding active */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-4">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-3 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-red-400/80" />
              </div>
              <div className="flex-1">
                <p className="text-white/85 text-sm font-semibold">ClearPoint MSA — Enterprise Services</p>
                <p className="text-white/28 text-[10px]">Master Service Agreement · May 1, 2025 · 8 pages</p>
              </div>
            </div>

            {/* C. Key Contract Risks — with active finding */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PL icon={<AlertTriangle className="w-3.5 h-3.5" />}
                right={<span className="h-4 px-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-300/70 text-[9px]">3 shown</span>}
              >C. Key Contract Risks</PL>
              <div className="flex flex-col gap-2">
                {RISKS.map((r, i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-3 transition-all ${r.active ? "border-violet-500/30 bg-violet-500/[0.06] ring-1 ring-violet-500/15" : r.sev === "high" ? "border-red-500/15 bg-red-500/[0.025]" : "border-amber-500/12"}`}>
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${r.active ? "bg-violet-400" : r.sev === "high" ? "bg-red-400" : "bg-amber-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-xs font-medium leading-snug flex-1 ${r.active ? "text-violet-200/90" : r.sev==="high" ? "text-red-200/80" : "text-amber-200/75"}`}>{r.title}</p>
                          <SourceChip label={r.chip} active={r.active} />
                        </div>
                        {r.detail && <p className="text-white/38 text-[10px] leading-relaxed">{r.detail}</p>}
                        {r.active && (
                          <p className="text-white/28 text-[10px] leading-relaxed mt-0.5">Highlighted in §5 · Payment & Fees section in document viewer</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 pl-4">
                      <ChevronRight className="w-2.5 h-2.5 text-violet-400/35 shrink-0 mt-0.5" />
                      <p className="text-violet-300/50 text-[10px] leading-relaxed">{r.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* F. Payment & Fees — context relevant */}
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.02] p-4">
              <PL icon={<DollarSign className="w-3.5 h-3.5 text-amber-400/50" />}>F. Payment &amp; Fees</PL>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Monthly fee",   value: "$14,400.00",      ok: true },
                  { label: "Late fee",      value: "1.5% / month",    ok: false, active: true },
                  { label: "Suspension",    value: "2 missed payments",ok: false },
                  { label: "Early exit",    value: "Fees through term",ok: false },
                ].map((p, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${p.active ? "border-violet-500/28 bg-violet-500/[0.06]" : "border-white/[0.04]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.active ? "bg-violet-400 animate-pulse" : p.ok ? "bg-emerald-400/55" : "bg-amber-400/55"}`} />
                    <p className="text-white/28 text-[10px] shrink-0 w-24">{p.label}</p>
                    <p className={`text-[10px] ml-auto ${p.active ? "text-violet-200/80 font-medium" : p.ok ? "text-white/50" : "text-amber-300/60"}`}>{p.value}</p>
                    <SourceChip label="§5" active={p.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* G. Termination */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
              <PL icon={<CalendarClock className="w-3.5 h-3.5" />}>G. Termination &amp; Renewal</PL>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Auto-renewal",  value: "12-month terms",  ok: false },
                  { label: "Cancel notice", value: "90 days written", ok: false },
                  { label: "Early exit",    value: "Not provided",    ok: false },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-amber-500/12">
                    <AlertTriangle className="w-3 h-3 text-amber-400/55 shrink-0" />
                    <p className="text-white/28 text-[10px] w-24">{t.label}</p>
                    <p className="text-amber-300/50 text-[10px] ml-auto">{t.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* H. Missing */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
              <PL icon={<ShieldAlert className="w-3.5 h-3.5 text-red-400/45" />}>H. Missing Protections</PL>
              {[
                { label: "No data breach notification clause", risk: "high" },
                { label: "No liability cap carve-out for negligence", risk: "high" },
                { label: "No force majeure provision", risk: "medium" },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.04] mb-1.5 last:mb-0">
                  <AlertCircle className={`w-3 h-3 shrink-0 ${m.risk === "high" ? "text-red-400/55" : "text-amber-400/50"}`} />
                  <p className={`text-[10px] ${m.risk === "high" ? "text-red-200/55" : "text-amber-200/50"}`}>{m.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
