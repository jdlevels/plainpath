export default function ProductSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4f7cac]/4 blur-[10vw]" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            The Product
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            One upload. Ten views of clarity.
          </h2>
          <p className="mt-[1vh] text-[1.6vw] text-[#f0f4f8]/50 font-body">
            Every analysis is structured across ten organized tabs — covering every angle of the document.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.8vw] flex-1 content-start">
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw] flex flex-col gap-[1.2vh]">
            <div className="w-[2.8vw] h-[2.8vw] rounded-[0.7vw] bg-[#4f7cac]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display">Action Checklist</div>
            <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">Every required step — ranked by urgency. Check items off as you complete them.</div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw] flex flex-col gap-[1.2vh]">
            <div className="w-[2.8vw] h-[2.8vw] rounded-[0.7vw] bg-[#4f7cac]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display">Required Documents</div>
            <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">Complete list of every attachment, form, ID, and proof — with exact source quotes.</div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw] flex flex-col gap-[1.2vh]">
            <div className="w-[2.8vw] h-[2.8vw] rounded-[0.7vw] bg-[#4f7cac]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display">Deadlines</div>
            <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">Hard dates surfaced from fine print. Countdown timers. Never miss a filing window.</div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw] flex flex-col gap-[1.2vh]">
            <div className="w-[2.8vw] h-[2.8vw] rounded-[0.7vw] bg-[#4f7cac]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display">Risks</div>
            <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">High-severity risks flagged before they become rejections. Severity ratings on each.</div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw] flex flex-col gap-[1.2vh]">
            <div className="w-[2.8vw] h-[2.8vw] rounded-[0.7vw] bg-[#4f7cac]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
                <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display">Plain English</div>
            <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">The entire document re-explained without jargon. What it is, what it wants from you.</div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw] flex flex-col gap-[1.2vh]">
            <div className="w-[2.8vw] h-[2.8vw] rounded-[0.7vw] bg-[#4f7cac]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-[1.4vw] h-[1.4vw]">
                <path d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.657 17.657l-.707-.707M12 20v-1M6.343 17.657l.707-.707M4 12h1M6.343 6.343l.707.707" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="4" stroke="#4f7cac" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-[1.5vw] font-bold text-[#f0f4f8] font-display">+ 5 More Views</div>
            <div className="text-[1.2vw] text-[#6b7a8d] font-body leading-snug">Costs, parties involved, follow-up questions, Q&A, and a full overview summary.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
