import {
  FileText, ChevronRight, AlertTriangle, AlertCircle, ListTodo,
  XCircle, Calendar, Flag, Zap, BookOpen, Info, Circle,
} from "lucide-react"

const BG = "#0c0c0f"
const PANEL = "#111115"
const BORDER = "rgba(255,255,255,0.06)"

const DOC_SECTIONS_PARTIAL = [
  {
    id: "s1", title: "§1 -- [SECTION -- PARTIALLY READABLE]",
    text: "This Agreement is entered into between [PARTY A] and [PARTY B]… [content partially extracted -- scan quality low] …The premises are located at… [unable to extract full address]…",
    partial: true,
  },
  {
    id: "s2", title: "§2 -- TERM",
    text: "The term of this Agreement shall commence on [DATE UNCLEAR] and expire [DURATION NOT FOUND]. Renewal terms were not clearly identified in the provided document.",
    partial: true,
  },
  {
    id: "s3", title: "§3 -- [SECTION TITLE NOT FOUND]",
    text: "Monthly payment of [AMOUNT NOT EXTRACTED]… due on the [DATE NOT FOUND] of each month… [remaining content not readable -- possible scan artefact or image-only PDF]",
    partial: true,
  },
]

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9.5px] uppercase tracking-[0.12em] font-semibold text-white/24 mb-2.5">{children}</p>
}

function SourceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-[17px] px-1.5 rounded text-[9px] font-mono font-medium bg-amber-500/12 border border-amber-400/22 text-amber-300/75">
      ~{label}
    </span>
  )
}

export default function AnalyzeDocumentLowConf() {
  return (
    <div className="flex flex-col" style={{ background: BG, width: 1280, height: 900, fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      {/* Top bar */}
      <div className="h-11 border-b flex items-center px-4 gap-2.5 shrink-0" style={{ borderColor: BORDER }}>
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <FileText className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-white/85 text-sm font-semibold">PlainPath</span>
        <div className="w-px h-3.5 bg-white/10" />
        <span className="text-white/35 text-xs">Analyze a Document</span>
        <ChevronRight className="w-3 h-3 text-white/15" />
        <span className="text-white/30 text-xs">Unknown-Scan-Document.pdf</span>
        <div className="ml-auto">
          <div className="h-6 px-2.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.22)" }}>
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-amber-300 text-[10px] font-medium">Partial extraction</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT -- Document Viewer -- partial/degraded */}
        <div className="flex flex-col border-r" style={{ width: "57%", borderColor: BORDER }}>
          <div className="h-9 border-b flex items-center px-4 gap-2 shrink-0" style={{ borderColor: BORDER, background: PANEL }}>
            <FileText className="w-3.5 h-3.5 text-white/22" />
            <span className="text-white/30 text-[11px] font-medium">Unknown-Scan-Document.pdf</span>
            <span className="ml-auto text-amber-400/60 text-[10px] font-medium">Low scan quality</span>
          </div>

          {/* Low quality banner */}
          <div className="px-4 py-2.5 flex items-start gap-2.5 shrink-0" style={{ background: "rgba(245,158,11,0.06)", borderBottom: "1px solid rgba(245,158,11,0.18)" }}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-[11px] font-semibold mb-0.5">Low scan quality -- partial text extracted</p>
              <p className="text-amber-200/45 text-[10px] leading-relaxed">This appears to be a scanned image PDF. PlainPath extracted what was readable, but portions of the document could not be fully parsed. All findings below should be verified against the original.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {DOC_SECTIONS_PARTIAL.map((sec) => (
              <div
                key={sec.id}
                className="rounded-xl p-4"
                style={{ border: "1px solid rgba(245,158,11,0.14)", background: "rgba(245,158,11,0.025)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] font-semibold text-amber-300/50 uppercase tracking-widest">{sec.title}</p>
                </div>
                <p className="text-white/38 text-[12px] leading-relaxed italic">{sec.text}</p>
              </div>
            ))}

            {/* Image-only page placeholder */}
            <div className="rounded-xl p-4 flex flex-col items-center justify-center text-center" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", minHeight: 100 }}>
              <AlertCircle className="w-6 h-6 text-white/12 mb-2" />
              <p className="text-white/20 text-[11px]">Pages 3–6 could not be parsed</p>
              <p className="text-white/12 text-[10px] mt-0.5">Possible image-only or encrypted content</p>
            </div>
          </div>
        </div>

        {/* RIGHT -- Low Confidence Intelligence Panel */}
        <div className="flex flex-col" style={{ width: "43%", background: PANEL }}>
          <div className="h-9 border-b flex items-center px-4 gap-2 shrink-0" style={{ borderColor: BORDER }}>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white/55 text-[11px] font-semibold">Partial Document Action Plan</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

            {/* Low confidence notice */}
            <div className="rounded-xl px-4 py-3.5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.22)" }}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200/80 text-[12px] font-semibold mb-1">Low confidence -- partial extraction only</p>
                  <p className="text-amber-200/45 text-[10.5px] leading-relaxed">PlainPath extracted what was readable, but critical sections were not fully parseable. The action plan below is incomplete -- verify all items against the original document before acting.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(245,158,11,0.12)" }}>
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10.5px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-white/28">What PlainPath could read:</span>
                  <span className="text-white/55 font-medium">~40%</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10.5px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-white/28">Sections unreadable:</span>
                  <span className="text-amber-300/60 font-medium">4 of 6</span>
                </div>
              </div>
            </div>

            {/* A -- Partial Summary */}
            <div>
              <SLabel>Plain-English Summary -- Partial</SLabel>
              <div className="rounded-xl px-3.5 py-3 text-[11.5px] text-white/42 leading-relaxed" style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${BORDER}` }}>
                Based on what was extracted, this appears to be a multi-party agreement with payment and term obligations. Specific parties, amounts, and dates could not be reliably extracted. Verify all key terms directly in the original document before acting.
              </div>
            </div>

            {/* B -- Snapshot (degraded) */}
            <div>
              <SLabel>Action Plan Snapshot -- Incomplete</SLabel>
              <div className="rounded-xl px-3.5 py-2.5 flex flex-wrap gap-2" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.14)" }}>
                {[
                  { val: "2", label: "partial actions", color: "text-amber-300" },
                  { val: "?", label: "urgent (unconfirmed)", color: "text-red-300/50" },
                  { val: "4+", label: "items to verify", color: "text-amber-300/60" },
                  { val: "0", label: "confirmed deadlines", color: "text-white/22" },
                ].map((s, i) => (
                  <div key={i} className="flex items-baseline gap-1">
                    <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
                    <span className="text-white/25 text-[10px]">{s.label}</span>
                    {i < 3 && <span className="text-white/12 ml-1">·</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* C -- Partial Actions */}
            <div>
              <SLabel>Step-by-Step Required Actions -- Partial</SLabel>
              <div className="flex flex-col gap-2">
                {[
                  {
                    step: 1,
                    title: "Confirm party names and roles",
                    instruction: "The parties section was partially extracted. Verify that Party A and Party B are correctly identified in the original document.",
                    source: "§1 · p.1",
                    uncertain: true,
                  },
                  {
                    step: 2,
                    title: "Locate and confirm payment amounts",
                    instruction: "A payment obligation appears to exist but the exact amount and due date could not be extracted. Locate this section in the original PDF.",
                    source: "§3 · p.?",
                    uncertain: true,
                  },
                ].map((a) => (
                  <div key={a.step} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.022)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)" }}>
                        <span className="text-amber-300 text-[9px] font-bold">{a.step}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Circle className="w-3.5 h-3.5 text-white/18" />
                          <span className="text-white/75 text-[11.5px] font-semibold">{a.title}</span>
                        </div>
                        <p className="text-white/42 text-[10.5px] leading-relaxed mb-2">{a.instruction}</p>
                        <div className="flex items-center gap-1.5">
                          <Info className="w-2.5 h-2.5 text-amber-400/60" />
                          <span className="text-amber-300/50 text-[10px]">Appears to require verification -- not confirmed from document</span>
                        </div>
                        {a.source && <div className="mt-1.5"><SourceChip label={a.source} /></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D -- What could not be verified */}
            <div>
              <SLabel>What Could Not Be Verified</SLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  "Effective date and term duration",
                  "Payment amount and schedule",
                  "Termination conditions",
                  "Governing law / jurisdiction",
                  "Full party addresses and registration details",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${BORDER}` }}>
                    <XCircle className="w-3 h-3 text-red-400/50 shrink-0" />
                    <span className="text-white/38 text-[11px]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended next steps */}
            <div>
              <SLabel>Recommended Next Steps</SLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: <FileText className="w-3 h-3" />, label: "Try uploading a text-layer PDF if available", color: "text-violet-300 bg-violet-500/10 border-violet-500/20" },
                  { icon: <ListTodo className="w-3 h-3" />, label: "Use Ask This Document for targeted questions", color: "text-blue-300 bg-blue-500/8 border-blue-500/15" },
                  { icon: <Flag className="w-3 h-3" />, label: "Consider professional review -- high-risk document", color: "text-amber-300 bg-amber-500/8 border-amber-500/15" },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[11px] font-medium ${s.color}`} style={{ border: "1px solid" }}>
                    {s.icon}
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-white/15 text-[10px] leading-relaxed px-1">Based on partial document extraction. Verify all items before acting. Not legal advice. Consider professional review for high-risk documents.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
