import {
  ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, FileText,
  FileWarning, Zap, Bookmark, Users, Calendar, X, Shield,
  AlertCircle, ClipboardCheck, BarChart2
} from "lucide-react";

function SourceChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 h-[18px] px-1.5 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer ${
      active
        ? "bg-violet-500/30 border border-violet-400/55 text-violet-100 ring-1 ring-violet-500/35 shadow-[0_0_8px_rgba(139,92,246,0.22)]"
        : "bg-violet-600/10 border border-violet-500/18 text-violet-300/75 hover:bg-violet-500/20"
    }`}>
      {active && <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
      {label}
    </span>
  );
}

function SLabel({ children, icon, right }: { children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-white/28 shrink-0">{icon}</span>}
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/26 flex-1">{children}</p>
      {right}
    </div>
  );
}

const CONCERNS = [
  {
    title: "Sender email domain doesn't match Microsoft",
    detail: "Sent from m1crosoft-invoices.com — not microsoft.com. Possible impersonation.",
    sev: "critical",
    chip: "p.1 · Header",
    action: "Verify sender identity directly with Microsoft before paying.",
  },
  {
    title: "Wire transfer to international account",
    detail: "Microsoft does not typically request wire transfers to personal or foreign accounts.",
    sev: "critical",
    chip: "p.2 · §4",
    action: "Reject this payment method. Contact Microsoft finance directly.",
  },
  {
    title: "Date inconsistency — invoice post-dates service period",
    detail: "Invoice dated March 15 but service period ended February 28, 2025.",
    sev: "high",
    chip: "p.1 · §1",
    action: "Request an explanation and a corrected, re-dated invoice.",
  },
  {
    title: "Missing official watermark and document identifier",
    detail: "Genuine Microsoft invoices include embedded document IDs and security watermarks.",
    sev: "high",
    chip: "p.1",
    action: "Compare against a verified Microsoft invoice from your account portal.",
  },
];

const CHECKLIST = [
  { label: "Contact Microsoft directly to verify invoice #MS-2025-88241", done: false, urgent: true },
  { label: "Do not send any payment until identity is confirmed", done: false, urgent: true },
  { label: "Check Microsoft customer portal for this invoice", done: false, urgent: false },
  { label: "Forward to your finance/IT team for review", done: false, urgent: false },
  { label: "Save a copy of this document as evidence", done: false, urgent: false },
];

const CONSISTENCY = [
  { label: "Company name", status: "ok" },
  { label: "Invoice number format", status: "warn" },
  { label: "Sender email domain", status: "critical" },
  { label: "Payment instructions", status: "critical" },
  { label: "Dates — invoice vs. service period", status: "warn" },
  { label: "Document logo/watermark", status: "warn" },
  { label: "Referenced attachments", status: "ok" },
];

const DOC_SECTIONS = [
  { id: "s1", title: "Invoice Header", body: "MICROSOFT CORP — INVOICE\nInvoice #: MS-2025-88241\nDate: March 15, 2025\nBill To: Acme Industries LLC, 14 Oak Ave, Portland, OR", active: false },
  { id: "s2", title: "Service Period & Items", body: "Enterprise Software Licensing — Q1 2025\nService period: Jan 1 – Feb 28, 2025\n12-month subscription renewal — $47,350.00", active: false },
  { id: "s3", title: "Payment Instructions", body: "Wire Transfer ONLY to:\nBank: Erste Bank AG, Vienna\nIBAN: AT12 3456 7890 1234 5678\nBIC: GIBAATWW\nRef: INV-2025-88241", active: false },
];

function DocSection({ section }: { section: typeof DOC_SECTIONS[0] }) {
  return (
    <div className={`w-full rounded-xl border p-4 flex flex-col gap-2 ${section.active ? "border-violet-500/45 bg-violet-500/[0.06] ring-1 ring-violet-500/20" : "border-white/[0.05] bg-white/[0.015]"}`}>
      <p className="text-[9px] font-mono text-white/18">{section.title}</p>
      <p className="text-[11px] text-white/38 leading-relaxed whitespace-pre-line">{section.body}</p>
    </div>
  );
}

const SEV_STYLES: Record<string, string> = {
  critical: "border-red-500/28 bg-red-500/[0.05]",
  high: "border-amber-500/18 bg-amber-500/[0.03]",
  medium: "border-white/[0.07]",
};
const DOT_STYLES: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-amber-400",
  medium: "bg-white/25",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  ok: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  warn: <AlertTriangle className="w-3 h-3 text-amber-400" />,
  critical: <AlertCircle className="w-3 h-3 text-red-400" />,
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
        <span className="text-white/30 text-xs truncate max-w-[180px]">Microsoft — Invoice INV-2025-88241.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-red-600/12 border-red-500/28 text-red-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">High risk · 22/100</span>
          </div>
          <button className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" /><span>Save</span>
          </button>
          <a className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3" /><span>Re-analyze</span>
          </a>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: document viewer */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileWarning className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
            <span className="text-white/45 text-xs flex-1 truncate">Microsoft — Invoice INV-2025-88241.pdf</span>
            <span className="text-white/18 text-xs shrink-0">3 pp.</span>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-0.5">
              {["Fit", "75%", "100%"].map((z, i) => (
                <button key={i} className={`h-5 px-1.5 rounded text-[9px] font-medium ${i === 1 ? "bg-white/[0.07] text-white/55" : "text-white/22"}`}>{z}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {DOC_SECTIONS.map(s => <DocSection key={s.id} section={s} />)}
          </div>
          <div className="h-10 border-t border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <span className="text-white/20 text-xs">3 sections</span>
            <div className="flex items-center gap-1">
              {[1,2,3].map(n => <button key={n} className="w-6 h-6 rounded-md text-[9px] flex items-center justify-center text-white/22">{n}</button>)}
            </div>
            <span className="text-white/14 text-[10px]">Jump to section</span>
          </div>
        </div>

        {/* RIGHT: trust intelligence panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/22 flex items-center justify-center shrink-0 mt-0.5">
                <FileWarning className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/90 text-sm font-semibold">Microsoft Invoice — INV-2025-88241</h1>
                  <span className="h-4 px-1.5 rounded border border-red-500/28 bg-red-500/10 text-red-300/80 text-[9px] font-medium">High Risk</span>
                </div>
                <p className="text-white/28 text-[10px]">Claimed: Microsoft Corp · Invoice · March 15, 2025 · 3 pages</p>
              </div>
            </div>

            {/* A. Trust Summary */}
            <div className="rounded-xl border border-red-500/18 bg-red-600/[0.04] p-4">
              <SLabel icon={<ShieldCheck className="w-3.5 h-3.5 text-red-400/60" />}>Trust Summary</SLabel>
              <p className="text-white/72 text-sm leading-[1.7]">
                This document has <strong className="text-red-300">major trust concerns</strong> and should <strong className="text-red-300">not be acted on</strong> without direct verification. The sender domain does not match Microsoft's, the payment method is highly atypical, and dates are internally inconsistent. These are <strong className="text-white/80">common signals of invoice fraud</strong>. Do not make any payment until you confirm this invoice independently through a verified Microsoft contact.
              </p>
            </div>

            {/* B. Trust Score strip */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <SLabel icon={<BarChart2 className="w-3.5 h-3.5 text-white/30" />}>Trust Score & Confidence</SLabel>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-red-600/12 border-red-500/28 text-red-300">
                  <span className="text-[11px] font-semibold">22 / 100</span>
                  <span className="text-[9px] text-red-300/60">trust score</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-amber-600/10 border-amber-500/22 text-amber-300">
                  <span className="text-[11px] font-medium">Medium confidence</span>
                </div>
                <div className="h-6 px-2.5 rounded-lg border flex items-center gap-1.5 bg-white/[0.04] border-white/[0.10] text-white/45">
                  <span className="text-[10px]">Invoice · 84% type match</span>
                </div>
              </div>
              {/* Red flag count pills */}
              <div className="flex items-center gap-1.5">
                <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/22 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  <span className="text-red-300 text-[9px] font-medium">2 critical signals</span>
                </div>
                <div className="h-5 px-2 rounded-full bg-amber-500/8 border border-amber-500/18 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-300 text-[9px] font-medium">2 high signals</span>
                </div>
                <div className="h-5 px-2 rounded-full bg-amber-500/6 border border-amber-500/12 flex items-center gap-1">
                  <AlertTriangle className="w-2 h-2 text-amber-400/60 shrink-0" />
                  <span className="text-amber-300/60 text-[9px]">Needs human review</span>
                </div>
              </div>
            </div>

            {/* C. Major Trust Concerns */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <SLabel icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400/55" />}
                right={<span className="h-4 px-1.5 rounded bg-red-500/10 border border-red-500/22 text-red-300/70 text-[9px]">2 critical</span>}>
                Major Trust Concerns
              </SLabel>
              <div className="flex flex-col gap-2">
                {CONCERNS.map((c, i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-3 ${SEV_STYLES[c.sev]}`}>
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${DOT_STYLES[c.sev]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white/80 text-xs font-medium leading-snug">{c.title}</p>
                          <SourceChip label={c.chip} />
                        </div>
                        <p className="text-white/38 text-[10px] leading-relaxed mt-1">{c.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-4">
                      <ChevronRight className="w-2.5 h-2.5 text-violet-400/40 shrink-0" />
                      <p className="text-violet-300/55 text-[10px] leading-relaxed">{c.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. Verification Checklist */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.07) 0%, rgba(12,12,15,0) 55%)" }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600/18 border border-violet-500/28 flex items-center justify-center">
                  <ClipboardCheck className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-white/85 text-sm font-semibold flex-1">Verification Checklist</p>
                <div className="h-5 px-2 rounded-full bg-red-500/10 border border-red-500/20">
                  <span className="text-red-300/90 text-[9px] font-medium">2 urgent</span>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {CHECKLIST.map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-white/[0.02] ${item.urgent ? "border-white/[0.10] bg-white/[0.018]" : "border-white/[0.06]"}`}>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center mt-0.5 shrink-0 ${item.done ? "bg-emerald-500 border-emerald-500" : "border-white/[0.18]"}`}>
                      {item.done && <CheckCircle2 className="w-2 h-2 text-white" />}
                    </div>
                    <p className={`text-xs ${item.urgent ? "text-white/78 font-medium" : "text-white/40"}`}>{item.label}</p>
                    {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* E. Document Consistency */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SLabel icon={<FileText className="w-3.5 h-3.5 text-white/28" />}>Document Consistency</SLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {CONSISTENCY.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/[0.05]">
                    {STATUS_ICON[item.status]}
                    <p className="text-white/48 text-[10px] flex-1 truncate">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* F. Metadata Signals */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <SLabel icon={<BarChart2 className="w-3.5 h-3.5 text-white/25" />}>Metadata & Structure Signals</SLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "File type", value: "PDF (v1.7)", ok: true },
                  { label: "Page count", value: "3 pages", ok: true },
                  { label: "Creation metadata", value: "Stripped / unavailable", ok: false },
                  { label: "Scan quality", value: "Good · 94% OCR confidence", ok: true },
                  { label: "Embedded fonts", value: "1 non-standard font detected", ok: false },
                  { label: "Document structure", value: "Unusual heading hierarchy", ok: false },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.ok ? "bg-emerald-400/60" : "bg-amber-400/60"}`} />
                    <p className="text-white/28 text-[10px] shrink-0">{m.label}</p>
                    <p className={`text-[10px] ml-auto ${m.ok ? "text-white/50" : "text-amber-300/60"}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* G. Source Traceability */}
            <div className="rounded-xl border border-violet-500/10 bg-violet-600/[0.03] p-4">
              <SLabel icon={<FileWarning className="w-3.5 h-3.5 text-violet-400/55" />}>Source Traceability</SLabel>
              <p className="text-white/28 text-[11px] leading-relaxed mb-3">Every concern links to the document section where it was found. Click a chip to jump the viewer.</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Spoofed sender domain — header section" },
                  { label: "Wire transfer to foreign account" },
                  { label: "Date inconsistency — invoice vs. service period" },
                  { label: "Missing watermark/document identifier" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.05] bg-white/[0.01] cursor-pointer hover:bg-violet-500/[0.04]">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/18" />
                    <p className="text-white/38 text-[11px] flex-1 truncate">{item.label}</p>
                    <SourceChip label="jump" />
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
