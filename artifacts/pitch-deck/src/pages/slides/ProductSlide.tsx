export default function ProductSlide() {
  const cards = [
    {
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.12)",
      label: "Plain English",
      desc: "The whole document re-explained without jargon — what it is, what it says, and what it wants from you.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
      label: "What's Missing",
      desc: "Blockers surfaced up front — the exact items that will get your submission rejected if not resolved first.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="2"/>
          <path d="M12 8v5M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
      label: "Action Checklist",
      desc: "Every required step grouped by urgency — high, medium, completed. Check off as you go; progress tracked in real time.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.12)",
      label: "Required Documents",
      desc: "Every form, certificate, and proof — color-coded by status, with exact source citations from the original text.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      color: "#fb923c",
      bg: "rgba(251,146,60,0.12)",
      label: "Deadlines & Risks",
      desc: "Hard dates surfaced from fine print flagged red. High-severity risks rated amber. Never miss a filing window or a warning.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      color: "#818cf8",
      bg: "rgba(129,140,248,0.14)",
      label: "Guided Review",
      desc: "Step through every finding one by one. Each item highlights and scrolls to its exact source in the original document.",
      highlight: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="#818cf8" strokeWidth="2"/>
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4f7cac]/4 blur-[10vw]" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[3.5vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            The Product
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            One upload. Ten views. One guided walkthrough.
          </h2>
          <p className="mt-[1vh] text-[1.6vw] text-[#f0f4f8]/50 font-body">
            Every finding organized across ten semantic tabs — plus Guided Review, which walks you through each item linked to its exact source.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.6vw] flex-1 content-start">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`rounded-[1.2vw] p-[2vw] flex flex-col gap-[1.2vh] ${
                card.highlight
                  ? "bg-[#13163a] border border-[#818cf8]/35 shadow-[0_0_2vw_rgba(129,140,248,0.12)]"
                  : "bg-[#0f1929] border border-[#1e2d44]"
              }`}
            >
              <div
                className="w-[2.8vw] h-[2.8vw] rounded-[0.7vw] flex items-center justify-center"
                style={{ background: card.bg }}
              >
                {card.icon}
              </div>
              <div className="text-[1.5vw] font-bold font-display" style={{ color: card.highlight ? "#a5b4fc" : "#f0f4f8" }}>
                {card.label}
              </div>
              <div className="text-[1.15vw] text-[#6b7a8d] font-body leading-snug">{card.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
