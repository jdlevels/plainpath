import {
  ShieldCheck, AlertTriangle, FileText, FileWarning, Zap, Bookmark,
  Upload, RotateCcw, MessageSquare, Info, ChevronRight
} from "lucide-react";

const SECTIONS = [
  { id: "s1", body: "ATLAS VENDOR SERVICES\nPAYMENT REQUEST — PR-2025-3391\nDate: March 28, 2025\nAmount due: $8,750.00\nPlease remit to the account below within 14 days.", lowQ: false },
  { id: "s2", body: "[Low scan quality — text partially illegible]\n…by authority of…[illegible]…penalty for non-payment…", lowQ: true },
  { id: "s3", body: "[Scanned image — text extraction very limited]\n[Signature / stamp area — unreadable]", lowQ: true },
];

export function TrustCheckLowConf() {
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
        <span className="text-white/30 text-xs truncate max-w-[180px]">Atlas Vendor Services — PR-2025-3391.pdf</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 px-2.5 rounded-full border flex items-center gap-1.5 bg-amber-600/12 border-amber-500/28 text-amber-300">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span className="text-[10px] font-medium">29% scan confidence</span>
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

        {/* LEFT: partial document */}
        <div className="w-[58%] border-r border-white/[0.06] flex flex-col bg-[#0d0d10] shrink-0 overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-amber-400/45 shrink-0" />
            <span className="text-white/45 text-xs flex-1 truncate">Atlas Vendor Services — PR-2025-3391.pdf</span>
            <span className="text-white/18 text-xs shrink-0">3 pp.</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {SECTIONS.map(s => (
              <div key={s.id} className={`w-full rounded-xl border p-4 flex flex-col gap-2 ${s.lowQ ? "border-amber-500/12 bg-amber-500/[0.015]" : "border-white/[0.05] bg-white/[0.015]"}`}>
                {s.lowQ && (
                  <div className="self-start h-4 px-1.5 rounded-full bg-amber-500/15 border border-amber-500/22 flex items-center">
                    <span className="text-amber-300/65 text-[9px]">low scan quality</span>
                  </div>
                )}
                <p className={`text-[11px] leading-relaxed whitespace-pre-line ${s.lowQ ? "text-amber-200/22 italic" : "text-white/32"}`}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: low-conf intelligence panel */}
        <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
          <div className="p-5 flex flex-col gap-5">

            {/* Doc identity */}
            <div className="flex items-start gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileWarning className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-white/88 text-sm font-semibold">Atlas Vendor Services — PR-2025-3391</h1>
                  <span className="h-4 px-1.5 rounded border border-amber-500/28 bg-amber-500/10 text-amber-300/80 text-[9px] font-medium">Poor Scan</span>
                </div>
                <p className="text-white/28 text-[10px]">Low scan quality · 1 of 3 sections readable · trust check incomplete</p>
              </div>
            </div>

            {/* Main warning */}
            <div className="rounded-xl border border-amber-500/22 bg-amber-600/[0.06] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-300 text-sm font-semibold mb-1.5">Partial trust check — low scan quality</p>
                  <p className="text-white/55 text-xs leading-relaxed mb-3">
                    PlainPath could review part of this document, but the scan quality limits trust confidence. A full check is not possible from this version.
                  </p>
                  <p className="text-white/28 text-[10px] font-medium uppercase tracking-wide mb-1.5">What PlainPath could read</p>
                  <div className="flex flex-col gap-1 mb-3">
                    {["Page 1 — payment request, amount, and due date"].map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-white/45 text-[10px]">
                        <div className="w-1 h-1 rounded-full bg-emerald-400/55 shrink-0" />{item}
                      </div>
                    ))}
                  </div>
                  <p className="text-white/28 text-[10px] font-medium uppercase tracking-wide mb-1.5">What could not be verified</p>
                  <div className="flex flex-col gap-1 mb-3">
                    {[
                      "Pages 2–3 — authority references, terms, and conditions",
                      "Signature block and official identifiers",
                      "Sender contact details and issuing authority",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-white/38 text-[10px]">
                        <div className="w-1 h-1 rounded-full bg-amber-400/50 shrink-0" />{item}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-amber-400/45 shrink-0" />
                    <p className="text-amber-300/45 text-[10px]">Upload a text-based PDF for a full, high-confidence trust check.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What to do */}
            <div className="rounded-xl overflow-hidden border border-white/[0.09]" style={{ background: "linear-gradient(140deg, rgba(109,40,217,0.07) 0%, rgba(12,12,15,0) 55%)" }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                <p className="text-white/85 text-sm font-semibold">Recommended next steps</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {[
                  { icon: <Upload className="w-4 h-4" />, label: "Upload a clearer scan or PDF", desc: "Higher resolution gives much better trust signal coverage.", primary: true, color: "text-violet-400 bg-violet-600/10 border-violet-500/20" },
                  { icon: <FileText className="w-4 h-4" />, label: "Upload a text-based version", desc: "Export from the original application instead of scanning.", primary: false, color: "text-violet-400 bg-violet-600/8 border-violet-500/15" },
                  { icon: <RotateCcw className="w-4 h-4" />, label: "Continue with partial review", desc: "See what PlainPath could assess from the readable sections.", primary: false, color: "text-white/38 bg-white/[0.03] border-white/[0.07]" },
                  { icon: <MessageSquare className="w-4 h-4" />, label: "Ask This Document", desc: "Ask targeted questions — sometimes extracts more from poor scans.", primary: false, color: "text-sky-400 bg-sky-600/8 border-sky-500/18" },
                ].map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border cursor-pointer ${a.primary ? "border-white/[0.10] bg-white/[0.025]" : "border-white/[0.06]"}`}>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${a.color}`}>{a.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-[12px] font-medium ${a.primary ? "text-white/88" : "text-white/48"}`}>{a.label}</p>
                        {a.primary && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                      </div>
                      <p className="text-white/25 text-[10px] leading-relaxed">{a.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0 mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Partial signals found */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/24 flex-1">Partial Signals Found</p>
                <span className="h-4 px-1.5 rounded bg-amber-500/8 border border-amber-500/18 text-amber-300/55 text-[9px]">verify manually</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { title: "Payment request for $8,750.00 — payee details incomplete", sev: "caution" },
                  { title: "Possible authority language in section 2 — text not extractable", sev: "low" },
                ].map((r, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${r.sev === "caution" ? "border-amber-500/14 bg-amber-500/[0.025]" : "border-white/[0.05]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${r.sev === "caution" ? "bg-amber-400" : "bg-white/20"}`} />
                    <p className="text-white/45 text-xs leading-relaxed flex-1">{r.title}</p>
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
