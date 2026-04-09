export default function ExamplesSlide() {
  const examples = [
    {
      tool: "Analyze a Document",
      toolColor: "#60a5fa",
      toolBg: "rgba(59,130,246,0.12)",
      toolBorder: "rgba(59,130,246,0.22)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Small Business Event Permit",
      desc: "City permit to host a public event. Requires 4 departmental sign-offs and a $1M liability certificate.",
      stats: [{ v: "8", l: "action steps" }, { v: "6", l: "required docs" }, { v: "3", l: "deadlines" }],
      highlight: "Submit $1M general liability certificate 45 days before event date — or the permit is auto-rejected.",
      highlightLabel: "Top priority identified:",
    },
    {
      tool: "Document Trust Check",
      toolColor: "#f87171",
      toolBg: "rgba(239,68,68,0.12)",
      toolBorder: "rgba(239,68,68,0.22)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: "Fake IRS Payment Demand",
      desc: "Email claiming an overdue IRS balance of $2,840 — urgent payment required within 48 hours or face arrest.",
      stats: [{ v: "18", l: "trust score" }, { v: "5", l: "red flags" }, { v: "3", l: "scam signals" }],
      highlight: "\"Arrest threat\" language is never used in real IRS communications. This document is consistent with a known phishing pattern.",
      highlightLabel: "Verdict:",
    },
    {
      tool: "Build a Contract",
      toolColor: "#34d399",
      toolBg: "rgba(16,185,129,0.12)",
      toolBorder: "rgba(16,185,129,0.22)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Freelance Web Design Agreement",
      desc: "Designer building a client's e-commerce site. Fixed fee, 2 revision rounds, client owns final deliverables.",
      stats: [{ v: "6", l: "wizard steps" }, { v: "2", l: "gaps filled" }, { v: "PDF", l: "ready" }],
      highlight: "Gap analysis flagged missing IP ownership clause — AI added it automatically before generating the final draft.",
      highlightLabel: "Gap filled:",
    },
    {
      tool: "Contract Review",
      toolColor: "#fbbf24",
      toolBg: "rgba(245,158,11,0.12)",
      toolBorder: "rgba(245,158,11,0.22)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M9 11l3 3L22 4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: "Employment Offer Letter",
      desc: "Job offer from a startup — role is software engineer, but contract includes a broad IP assignment and no termination notice.",
      stats: [{ v: "31", l: "fairness score" }, { v: "4", l: "flagged clauses" }, { v: "High", l: "risk" }],
      highlight: "\"All inventions conceived during employment\" clause assigns personal side-project IP to employer. Suggested negotiation language included.",
      highlightLabel: "Highest-risk clause:",
    },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-gradient-to-br from-[#4f7cac]/6 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col px-[8vw] py-[6vh]">
        <div className="mb-[3vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            Real Examples
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            One tool per scenario. All live at plain-path.replit.app.
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-[1.6vw] flex-1 content-start">
          {examples.map((ex) => (
            <div key={ex.tool} className="bg-[#0f1929] rounded-[1.3vw] p-[1.8vw] flex flex-col gap-[1.4vh]" style={{ border: `1px solid ${ex.toolBorder}` }}>
              <div className="flex items-center gap-[0.6vw]">
                <div className="w-[2.2vw] h-[2.2vw] rounded-[0.55vw] flex items-center justify-center" style={{ background: ex.toolBg }}>
                  {ex.icon}
                </div>
                <span className="text-[0.95vw] font-bold font-body" style={{ color: ex.toolColor }}>{ex.tool}</span>
              </div>
              <div>
                <div className="text-[1.35vw] font-bold text-[#f0f4f8] font-display leading-snug mb-[0.6vh]">{ex.title}</div>
                <div className="text-[1.05vw] text-[#6b7a8d] font-body leading-snug">{ex.desc}</div>
              </div>
              <div className="h-px bg-[#1e2d44]" />
              <div className="grid grid-cols-3 gap-[0.6vw]">
                {ex.stats.map((s) => (
                  <div key={s.l} className="bg-[#172035] rounded-[0.5vw] p-[0.7vw] text-center">
                    <div className="text-[1.6vw] font-extrabold font-display" style={{ color: ex.toolColor }}>{s.v}</div>
                    <div className="text-[0.8vw] text-[#6b7a8d] font-body mt-[0.15vh]">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-[0.7vw] p-[1vw] flex-1" style={{ background: ex.toolBg }}>
                <div className="text-[0.85vw] font-semibold font-body mb-[0.4vh]" style={{ color: ex.toolColor }}>{ex.highlightLabel}</div>
                <div className="text-[0.95vw] text-[#f0f4f8]/80 font-body leading-snug">"{ex.highlight}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
