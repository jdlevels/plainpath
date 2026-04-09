export default function HowItWorksSlide() {
  const steps = [
    {
      n: "1",
      title: "Choose the right tool",
      body: "Four tools cover every scenario. Need to understand a complex form? Use Analyze. Suspicious offer or IRS notice? Trust Check. Starting a project or renting? Build a Contract. About to sign something? Contract Review.",
      accent: "#4f7cac",
      tags: [
        { label: "Analyze", color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
        { label: "Trust Check", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
        { label: "Build", color: "#34d399", bg: "rgba(16,185,129,0.12)" },
        { label: "Review", color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
      ],
    },
    {
      n: "2",
      title: "Upload, paste, or answer 6 questions",
      body: "Drop in a PDF, Word document, or paste text directly for Analyze, Trust Check, and Contract Review. For Contract Builder, a plain-English wizard guides you through 6 questions about parties, scope, payment, and terms. No legal knowledge needed.",
      accent: "#4f7cac",
      tags: [
        { label: "PDF / Word", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "Paste text", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "6-step wizard", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "No account required", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
      ],
    },
    {
      n: "3",
      title: "Get a structured, actionable result",
      body: "AI returns a fully structured output — not a paragraph of text. Action plans with priority ratings. Trust scores with red-flag breakdowns. Contract drafts with gap analysis. Fairness scores with per-clause negotiation tips. Every finding linked to its exact source.",
      accent: "#4f7cac",
      tags: [
        { label: "Source citations", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "Priority ratings", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "Export to PDF", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "Share results", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
      ],
    },
    {
      n: "4",
      title: "Act — with deadline reminders",
      body: "Check off action steps as you complete them. Set email reminders for deadlines surfaced from the document. Save and export your analysis. Share a link with a lawyer, accountant, or family member. Progress tracked in real time across sessions.",
      accent: "#4f7cac",
      tags: [
        { label: "Progress tracking", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "Email reminders", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "Shareable links", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
        { label: "iOS + Android", color: "#8fa3bc", bg: "rgba(143,163,188,0.10)" },
      ],
    },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f7cac]/6 via-transparent to-transparent" />
      <div className="absolute bottom-0 right-0 w-[45vw] h-[45vw] rounded-full bg-[#4f7cac]/4 blur-[10vw] translate-x-1/4 translate-y-1/4" />

      <div className="relative flex h-full flex-col px-[8vw] py-[6.5vh]">
        <div className="mb-[3.5vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            How It Works
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            Pick a tool. Get a structured result. Act.
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-[2vw] flex-1 content-center">
          {steps.map((step, i) => (
            <div key={step.n} className="flex flex-col gap-[1.4vh]">
              <div className="flex items-center gap-[1vw]">
                <div className="w-[3.2vw] h-[3.2vw] rounded-full bg-[#4f7cac] flex items-center justify-center shrink-0">
                  <span className="text-[1.4vw] font-extrabold text-white font-display">{step.n}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px bg-gradient-to-r from-[#4f7cac]/40 to-transparent" />
                )}
              </div>
              <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[1.8vw] flex flex-col gap-[1.2vh] flex-1">
                <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display leading-snug">{step.title}</div>
                <p className="text-[1.1vw] text-[#6b7a8d] font-body leading-snug flex-1">{step.body}</p>
                <div className="flex flex-wrap gap-[0.5vw] mt-[0.5vh]">
                  {step.tags.map((tag) => (
                    <span key={tag.label} className="text-[0.85vw] font-semibold px-[0.55vw] py-[0.15vh] rounded-full font-body" style={{ color: tag.color, background: tag.bg }}>{tag.label}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[2.5vh] bg-[#4f7cac]/10 border border-[#4f7cac]/25 rounded-[1vw] px-[2vw] py-[1.4vh] flex items-center gap-[1.2vw]">
          <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw] shrink-0"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#7fb2d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[1.2vw] text-[#7fb2d9] font-body">From upload to structured result in <strong>under 60 seconds</strong> — for any of the four tools, on any device.</span>
        </div>
      </div>
    </div>
  )
}
