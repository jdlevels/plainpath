export default function WhyNowSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute inset-0 bg-gradient-to-tl from-[#4f7cac]/8 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-[#4f7cac]/5 blur-[9vw] translate-x-1/3 -translate-y-1/3" />

      <div className="relative flex h-full gap-[7vw] px-[8vw] py-[7vh] items-center">
        <div className="flex-1 flex flex-col gap-[3vh]">
          <div>
            <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.5vh] font-body">
              Why Now
            </p>
            <h2 className="text-[4vw] font-extrabold leading-[1.0] tracking-tight text-[#f0f4f8] font-display">
              Three forces aligning
            </h2>
            <h2 className="text-[4vw] font-extrabold leading-[1.0] tracking-tight text-[#4f7cac] font-display">
              right now.
            </h2>
          </div>
          <p className="text-[1.6vw] text-[#f0f4f8]/55 font-body leading-relaxed max-w-[36vw]">
            The technology to do this right exists today. The market is underserved. And no purpose-built tool for structured document analysis has emerged yet.
          </p>
          <div className="bg-[#4f7cac]/12 border border-[#4f7cac]/25 rounded-[1.2vw] p-[2vw]">
            <div className="text-[1.4vw] font-semibold text-[#7fb2d9] font-display mb-[0.6vh]">First-mover window</div>
            <div className="text-[1.2vw] text-[#f0f4f8]/65 font-body leading-snug">The category of "structured document intelligence" is being defined right now. PlainPath is positioned to own it before incumbents recognize the opportunity.</div>
          </div>
        </div>

        <div className="w-[40vw] shrink-0 flex flex-col gap-[2.5vh]">
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.2vw] flex gap-[1.8vw] items-start">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.8vw] bg-[#4f7cac]/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.7vw] h-[1.7vw]">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display mb-[0.5vh]">AI capability reached the threshold</div>
              <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">GPT-5 class models can now read, reason, and extract structured data from any document with the accuracy needed for this use case. This wasn't true two years ago.</div>
            </div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.2vw] flex gap-[1.8vw] items-start">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.8vw] bg-[#4f7cac]/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.7vw] h-[1.7vw]">
                <path d="M3 3l18 18M3 21l18-18" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display mb-[0.5vh]">No existing solution in this space</div>
              <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">Legal tech targets lawyers. Tax software targets accountants. Nobody has built a tool for the 330M people who just need to understand what a document is asking of them.</div>
            </div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.2vw] flex gap-[1.8vw] items-start">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.8vw] bg-[#4f7cac]/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.7vw] h-[1.7vw]">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display mb-[0.5vh]">Paperwork complexity keeps growing</div>
              <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">Federal regulations, state filings, and compliance requirements expand every year. The problem is getting harder, not easier — making the need for PlainPath more acute over time.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
