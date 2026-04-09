export default function SolutionSlide() {
  const tools = [
    {
      dot: "#3b82f6",
      bg: "rgba(59,130,246,0.10)",
      border: "rgba(59,130,246,0.25)",
      label: "Analyze a Document",
      desc: "Upload any PDF, Word file, or paste text. AI extracts every requirement, deadline, risk, and missing item into a prioritized 10-tab action plan — with source citations.",
      tags: ["Action checklist", "Deadlines", "Required docs", "Risks"],
      tagColor: "#60a5fa",
      tagBg: "rgba(59,130,246,0.12)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.6vw] h-[1.6vw]">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      dot: "#ef4444",
      bg: "rgba(239,68,68,0.10)",
      border: "rgba(239,68,68,0.25)",
      label: "Document Trust Check",
      desc: "Drop in any contract, notice, or offer. AI scores its legitimacy, flags manipulation tactics, and tells you exactly why it looks legitimate — or suspicious.",
      tags: ["Trust score", "Red flags", "Scam signals", "Legitimacy rating"],
      tagColor: "#f87171",
      tagBg: "rgba(239,68,68,0.12)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.6vw] h-[1.6vw]">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      dot: "#10b981",
      bg: "rgba(16,185,129,0.10)",
      border: "rgba(16,185,129,0.25)",
      label: "Build a Contract",
      desc: "Answer 6 plain-English questions. AI generates a gap-checked contract draft — NDA, freelance agreement, service contract, lease, and more. Download as PDF.",
      tags: ["6-step wizard", "Gap analysis", "PDF export", "6 contract types"],
      tagColor: "#34d399",
      tagBg: "rgba(16,185,129,0.12)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.6vw] h-[1.6vw]">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      dot: "#f59e0b",
      bg: "rgba(245,158,11,0.10)",
      border: "rgba(245,158,11,0.25)",
      label: "Contract Review",
      desc: "Paste any contract before you sign. AI scores overall fairness, flags every one-sided clause, and suggests plain-English negotiation language for each issue found.",
      tags: ["Fairness score", "Clause flags", "Negotiation tips", "Risk rating"],
      tagColor: "#fbbf24",
      tagBg: "rgba(245,158,11,0.12)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.6vw] h-[1.6vw]">
          <path d="M9 11l3 3L22 4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f7cac]/6 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col px-[8vw] py-[6vh]">
        <div className="mb-[3vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            The Solution
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.0] tracking-tight text-[#f0f4f8] font-display">
            Four tools. Every paperwork problem.
          </h2>
          <p className="mt-[1vh] text-[1.5vw] text-[#f0f4f8]/50 font-body max-w-[60vw]">
            One platform covers the full document lifecycle — from understanding what a form requires, to verifying it's legitimate, to building or reviewing the contract before you sign.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-[1.8vw] flex-1 content-center">
          {tools.map((t) => (
            <div key={t.label} className="rounded-[1.3vw] p-[1.8vw] flex flex-col gap-[1.4vh]" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
              <div className="w-[3vw] h-[3vw] rounded-[0.7vw] flex items-center justify-center" style={{ background: `rgba(255,255,255,0.06)` }}>
                {t.icon}
              </div>
              <div className="text-[1.4vw] font-bold font-display" style={{ color: t.tagColor }}>{t.label}</div>
              <p className="text-[1.1vw] text-[#8fa3bc] font-body leading-snug flex-1">{t.desc}</p>
              <div className="flex flex-wrap gap-[0.5vw] mt-[0.5vh]">
                {t.tags.map((tag) => (
                  <span key={tag} className="text-[0.9vw] font-semibold px-[0.6vw] py-[0.2vh] rounded-full font-body" style={{ color: t.tagColor, background: t.tagBg }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[2.5vh] bg-[#0f1929] border border-[#1e2d44] rounded-[1vw] px-[2vw] py-[1.4vh] flex items-center gap-[2vw]">
          <span className="text-[1.2vw] text-[#6b7a8d] font-body">Works on:</span>
          {["Government forms", "Legal notices", "Employment contracts", "Insurance packets", "Lease agreements", "Grant applications", "NDAs", "Tax filings"].map((item) => (
            <span key={item} className="text-[1.1vw] text-[#f0f4f8]/60 font-body">• {item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
