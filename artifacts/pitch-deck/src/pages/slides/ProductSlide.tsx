export default function ProductSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4f7cac]/4 blur-[10vw]" />

      <div className="relative flex h-full gap-[5vw] px-[8vw] py-[6vh] items-stretch">
        <div className="flex flex-col gap-[2vh] justify-center w-[28vw] shrink-0">
          <div>
            <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
              The Platform
            </p>
            <h2 className="text-[3.5vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
              Four tools, deeply built.
            </h2>
            <p className="mt-[1.5vh] text-[1.5vw] text-[#f0f4f8]/50 font-body leading-relaxed">
              Each tool is a complete, end-to-end experience — not a feature flag or a chatbot prompt. Built on GPT-4o with structured extraction, source citation, and a mobile-first interface.
            </p>
          </div>

          <div className="flex flex-col gap-[1.2vh]">
            {[
              "PDF, Word, and plain-text input",
              "Structured extraction with source citations",
              "No account required to start",
              "Works on web, iOS, and Android",
              "Email reminders for deadlines",
              "Save, export, and share results",
            ].map((f) => (
              <div key={f} className="flex items-center gap-[0.8vw]">
                <div className="w-[1.4vw] h-[1.4vw] rounded-full bg-[#4f7cac] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[0.7vw] h-[0.7vw]">
                    <path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[1.2vw] text-[#f0f4f8]/75 font-body">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-[1.6vw] content-center">
          <div className="bg-[#0c1522] border rounded-[1.3vw] p-[1.8vw] flex flex-col gap-[1.2vh]" style={{ borderColor: "rgba(59,130,246,0.25)" }}>
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-[1.3vw] h-[1.3vw]"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-[1.3vw] font-bold font-display" style={{ color: "#60a5fa" }}>Analyze a Document</span>
            </div>
            <p className="text-[1.05vw] text-[#6b7a8d] font-body leading-snug">10 semantic tabs: Plain English summary, What's Missing, Action Checklist, Required Documents, Deadlines & Risks, Key Terms, Costs, FAQs, Guided Review, Legal Glossary.</p>
            <div className="flex flex-wrap gap-[0.5vw] mt-[0.4vh]">
              {["10 analysis tabs", "Progress tracking", "Guided Review", "Source citations"].map(t => (
                <span key={t} className="text-[0.85vw] font-semibold px-[0.55vw] py-[0.15vh] rounded-full font-body" style={{ color: "#60a5fa", background: "rgba(59,130,246,0.12)" }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="bg-[#0c1522] border rounded-[1.3vw] p-[1.8vw] flex flex-col gap-[1.2vh]" style={{ borderColor: "rgba(239,68,68,0.25)" }}>
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-[1.3vw] h-[1.3vw]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-[1.3vw] font-bold font-display" style={{ color: "#f87171" }}>Document Trust Check</span>
            </div>
            <p className="text-[1.05vw] text-[#6b7a8d] font-body leading-snug">Legitimacy score 0–100, red-flag breakdown, manipulation tactic detection, urgency pressure analysis, contact verification, and a plain-English verdict on whether to trust the document.</p>
            <div className="flex flex-wrap gap-[0.5vw] mt-[0.4vh]">
              {["Trust score 0–100", "Red flag detail", "Scam signals", "Verdict + reasoning"].map(t => (
                <span key={t} className="text-[0.85vw] font-semibold px-[0.55vw] py-[0.15vh] rounded-full font-body" style={{ color: "#f87171", background: "rgba(239,68,68,0.12)" }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="bg-[#0c1522] border rounded-[1.3vw] p-[1.8vw] flex flex-col gap-[1.2vh]" style={{ borderColor: "rgba(16,185,129,0.25)" }}>
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-[1.3vw] h-[1.3vw]"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-[1.3vw] font-bold font-display" style={{ color: "#34d399" }}>Build a Contract</span>
            </div>
            <p className="text-[1.05vw] text-[#6b7a8d] font-body leading-snug">6-step guided wizard. AI generates a complete, gap-checked contract draft. Supports NDA, freelance, service agreement, simple payment, and lease. Instant PDF download.</p>
            <div className="flex flex-wrap gap-[0.5vw] mt-[0.4vh]">
              {["6 contract types", "Gap analysis", "PDF download", "Plain-English clauses"].map(t => (
                <span key={t} className="text-[0.85vw] font-semibold px-[0.55vw] py-[0.15vh] rounded-full font-body" style={{ color: "#34d399", background: "rgba(16,185,129,0.12)" }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="bg-[#0c1522] border rounded-[1.3vw] p-[1.8vw] flex flex-col gap-[1.2vh]" style={{ borderColor: "rgba(245,158,11,0.25)" }}>
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-[1.3vw] h-[1.3vw]"><path d="M9 11l3 3L22 4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <span className="text-[1.3vw] font-bold font-display" style={{ color: "#fbbf24" }}>Contract Review</span>
            </div>
            <p className="text-[1.05vw] text-[#6b7a8d] font-body leading-snug">Paste any contract before signing. AI scores overall fairness, flags every one-sided or unusual clause, rates risk severity, and provides specific negotiation language for each issue.</p>
            <div className="flex flex-wrap gap-[0.5vw] mt-[0.4vh]">
              {["Fairness score", "Clause-by-clause flags", "Risk ratings", "Negotiation tips"].map(t => (
                <span key={t} className="text-[0.85vw] font-semibold px-[0.55vw] py-[0.15vh] rounded-full font-body" style={{ color: "#fbbf24", background: "rgba(245,158,11,0.12)" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
