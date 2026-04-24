import {
  ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, FileText,
  FileWarning, Zap, Bookmark, Info, ClipboardCheck, BarChart2,
  AlertCircle
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

function PanelLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="shrink-0 text-white/25">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24 flex-1">{children}</p>
      {right}
    </div>
  );
}

const CONCERNS = [
  {
    title: "Sender email domain may not match the claimed sender",
    detail: "Sent from northstar-billing.net — the stated company typically uses northstarcloudsvc.com. This is a possible impersonation signal.",
    sev: "critical",
    chip: "p.1 · Header",
    action: "Confirm sender identity directly through a known contact at the company before responding.",
  },
  {
    title: "Wire transfer destination is unusual for this vendor type",
    detail: "Payment directed to an overseas account. This pattern requires independent verification of the payment destination.",
    sev: "critical",
    chip: "p.2 · §4",
    action: "Verify the payment account independently — call or email the vendor using a contact you already have on file.",
  },
  {
    title: "Invoice date and service period appear inconsistent",
    detail: "Invoice is dated April 10 but the stated service period ended March 31. This internal inconsistency warrants clarification.",
    sev: "caution",
    chip: "p.1 · §1",
    action: "Request an explanation and a corrected, re-dated version from the sender.",
  },
  {
    title: "Document header identifiers appear incomplete",
    detail: "No document ID or reference number visible in the header. Consistent with some invoice formats, but worth confirming.",
    sev: "caution",
    chip: "p.1",
    action: "Ask the sender to re-send with a full document reference or purchase order number.",
  },
];

const CHECKLIST = [
  { label: "Confirm sender using a known phone number or email address — not the contact info in this document", urgent: true, done: false },
  { label: "Verify payment destination independently before transferring any funds", urgent: true, done: false },
  { label: "Cross-check invoice number with your own records or PO system", urgent: false, done: false },
  { label: "Request the original source file (not a scan or forwarded copy)", urgent: false, done: false },
  { label: "Confirm any signatures or official identifiers with the issuing party", urgent: false, done: false },
  { label: "Do not pay or act on this document until high-risk signals are resolved", urgent: false, done: false },
];

const CONSISTENCY = [
  { label: "Company name", status: "ok" },
  { label: "Invoice number format", status: "warn" },
  { label: "Sender email domain", status: "warn" },
  { label: "Payment instructions", status: "warn" },
  { label: "Dates — invoice vs. service period", status: "warn" },
  { label: "Document header identifiers", status: "warn" },
  { label: "Referenced attachments", status: "ok" },
];

const DOC_SECTIONS = [
  { id: "s1", title: "Invoice Header", body: "NORTHSTAR CLOUD SERVICES\nINVOICE NCS-2025-10847\nDate: April 10, 2025\nBill To: Meridian Group LLC, 88 Commerce Drive, Austin, TX" },
  { id: "s2", title: "Service Items", body: "IT Infrastructure — Q1 2025\nManaged services: Jan 1 – Mar 31, 2025\nEnterprise tier renewal — $31,200.00" },
  { id: "s3", title: "Payment Instructions", body: "Wire Transfer to:\nCoastal Pacific Bank, Singapore\nAccount: 4817-2930-1055\nRef: NCS-2025-10847" },
];

const SEV: Record<string, string> = {
  critical: "border-amber-500/22 bg-amber-500/[0.04]",
  caution:  "border-white/[0.08] bg-white/[0.015]",
};
const DOT: Record<string, string> = {
  critical: "bg-amber-400",
  caution:  "bg-white/28",
};
const STAT: Record<string, React.ReactNode> = {
  ok:   <CheckCircle2 className="w-3 h-3 text-emerald-400/80" />,
  warn: <AlertTriangle className="w-3 h-3 text-amber-400/80" />,
  crit: <AlertCircle className="w-3 h-3 text-red-400/80" />,
};

export function TrustCheckCompleted() {
  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/90 text-sm font-semibold tracking-tight">PlainPath</span>
        <span className="text-white/18 text-[10px] mx-0.5">·</span>
        <span className="text-white/30 text-xs">Document Trust Check</span>
        <ChevronRight className="w-3 h-3 text-white/18" />
        <span className="text-white/30 text-xs truncate max-w-[180px]">NCS Invoice NCS-2025-10847.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/28 text-amber-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">Needs review · 31/100</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3" /><span>Re-analyze</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileWarning className="w-3.5 h-3.5 text-amber-400/55 shrink-0" />
            <span className="text-white/45 text-xs flex-1 truncate">Northstar Cloud Services — Invoice NCS-2025-10847.pdf</span>
            <span className="text-white/18 text-xs shrink-0">3 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-0.5">
              {["Fit", "75%", "100%"].map((z, i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {DOC_SECTIONS.map(s => (
              <div key={s.id} className="w-full rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 flex flex-col gap-2">
                <p className="text-[9px] font-mono text-white/18">{s.title}</p>
                <p className="text-[11px] text-white/35 leading-relaxed whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">3 sections</span>
            <div className="flex items-center gap-1">{[1,2,3].map(n => <button key={n} className="w-6 h-6 rounded-md text-[9px] flex items-center justify-center text-white/22">{n}</button>)}</div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: trust intelligence panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-4">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileWarning className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/90 text-sm font-semibold">Northstar Cloud Services Invoice</h1>
                  <span className="h-4 px-1.5 rounded border border-amber-500/28 bg-amber-500/10 text-amber-300/80 text-[9px] font-medium">Needs Review</span>
                </div>
                <p className="text-white/28 text-[10px]">Claimed: Northstar Cloud Services · Invoice · April 10, 2025 · 3 pages</p>
              </div>
            </div>

            {/* A. Trust Summary */}
            <div className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-4">
              <PanelLabel icon={<ShieldCheck className="w-3.5 h-3.5" />}>A. Trust Summary</PanelLabel>
              <p className="text-white/70 text-sm leading-[1.75]">
                This document has <strong className="text-amber-300">several signals that require verification</strong> before acting. PlainPath identified a possible sender domain mismatch, an unusual payment destination, and an internal date inconsistency. These are <strong className="text-white/80">risk indicators, not proof of fraud</strong>. Confirm with the original source before responding or paying.
              </p>
            </div>

            {/* B. Trust Score / Confidence Strip */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PanelLabel icon={<BarChart2 className="w-3.5 h-3.5" />}>B. Trust Score &amp; Confidence</PanelLabel>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/25 text-amber-300">
                  <span className="text-[11px] font-semibold">31 / 100</span>
                  <span className="text-[9px] text-amber-300/55">trust score</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-sky-600/10 border-sky-500/20 text-sky-300">
                  <span className="text-[11px] font-medium">Medium confidence</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-white/[0.04] border-white/[0.08] text-white/42">
                  <span className="text-[10px]">Invoice · 81% type match</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="h-5 px-2 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-300 text-[9px] font-medium">2 possible critical signals</span>
                </div>
                <div className="h-5 px-2 rounded-full bg-amber-500/6 border border-amber-500/12 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400/50 shrink-0" />
                  <span className="text-amber-300/65 text-[9px]">2 caution signals</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <Info className="w-2.5 h-2.5 text-white/20 mt-[2px] shrink-0" />
                <p className="text-white/22 text-[9px] leading-relaxed">Trust score reflects document consistency, source clarity, metadata signals, and risk indicators. It is not a legal or forensic determination.</p>
              </div>
            </div>

            {/* C. Major Trust Concerns */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <PanelLabel
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                right={<span className="h-4 px-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300/70 text-[9px]">4 concerns</span>}>
                C. Major Trust Concerns
              </PanelLabel>
              <div className="flex flex-col gap-2">
                {CONCERNS.map((c, i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-3 ${SEV[c.sev]}`}>
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${DOT[c.sev]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-white/80 text-xs font-medium leading-snug flex-1">{c.title}</p>
                          <SourceChip label={c.chip} />
                        </div>
                        <p className="text-white/38 text-[10px] leading-relaxed">{c.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 pl-4">
                      <ChevronRight className="w-2.5 h-2.5 text-violet-400/35 shrink-0 mt-0.5" />
                      <p className="text-violet-300/50 text-[10px] leading-relaxed">{c.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. Verification Checklist */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.06) 0%, rgba(12,12,15,0) 55%)" }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/28 flex items-center justify-center">
                  <ClipboardCheck className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-white/85 text-sm font-semibold flex-1">D. Verification Checklist</p>
                <div className="h-5 px-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-300/80 text-[9px] font-medium">2 urgent</span>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {CHECKLIST.map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-white/[0.02] ${item.urgent ? "border-white/[0.10] bg-white/[0.018]" : "border-white/[0.06]"}`}>
                    <div className="w-3.5 h-3.5 rounded border border-white/[0.18] flex-shrink-0 mt-0.5" />
                    <p className={`text-[10px] leading-relaxed flex-1 ${item.urgent ? "text-white/75 font-medium" : "text-white/38"}`}>{item.label}</p>
                    {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* E. Document Consistency */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <PanelLabel icon={<FileText className="w-3.5 h-3.5" />}>E. Document Consistency</PanelLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {CONSISTENCY.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/[0.05]">
                    {STAT[item.status]}
                    <p className="text-white/45 text-[10px] flex-1 truncate">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* F. Metadata / Structure Signals */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <PanelLabel icon={<BarChart2 className="w-3.5 h-3.5" />}>F. Metadata &amp; Structure Signals</PanelLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "File type", value: "PDF (v1.7)", ok: true },
                  { label: "Page count", value: "3 pages", ok: true },
                  { label: "Creation metadata", value: "Not available / stripped", ok: false },
                  { label: "Scan quality", value: "Good · 92% OCR confidence", ok: true },
                  { label: "Embedded fonts", value: "1 non-standard font detected", ok: false },
                  { label: "Document structure", value: "Unusual heading hierarchy", ok: false },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.ok ? "bg-emerald-400/55" : "bg-amber-400/55"}`} />
                    <p className="text-white/28 text-[10px] shrink-0">{m.label}</p>
                    <p className={`text-[10px] ml-auto ${m.ok ? "text-white/45" : "text-amber-300/55"}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* G. Source Traceability */}
            <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
              <PanelLabel icon={<FileWarning className="w-3.5 h-3.5 text-violet-400/50" />}>G. Source Traceability</PanelLabel>
              <p className="text-white/25 text-[10px] leading-relaxed mb-3">Each concern links to the section where PlainPath found it. Click a chip to jump to that location in the viewer.</p>
              <div className="flex flex-col gap-1.5">
                {[
                  "Possible domain mismatch — document header",
                  "Unusual payment destination — payment section",
                  "Date inconsistency — invoice vs. service period",
                  "Incomplete header identifiers — page 1",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.05] bg-white/[0.01] cursor-pointer hover:bg-violet-500/[0.04] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/15" />
                    <p className="text-white/35 text-[10px] flex-1 truncate">{item}</p>
                    <SourceChip label="jump ↗" />
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
