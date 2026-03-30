export default function SolutionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f7cac]/8 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 w-[35vw] h-[35vw] rounded-full bg-[#4f7cac]/5 blur-[8vw] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative flex h-full gap-[6vw] px-[8vw] py-[7vh] items-center">
        <div className="flex-1 flex flex-col gap-[3vh]">
          <div>
            <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.5vh] font-body">
              The Solution
            </p>
            <h2 className="text-[4vw] font-extrabold leading-[1.0] tracking-tight text-[#f0f4f8] font-display">
              Drop in any document.
            </h2>
            <h2 className="text-[4vw] font-extrabold leading-[1.0] tracking-tight text-[#4f7cac] font-display">
              Get a clear action plan.
            </h2>
          </div>

          <p className="text-[1.7vw] text-[#f0f4f8]/60 font-body leading-relaxed max-w-[38vw]">
            PlainPath reads the full content of any PDF, Word document, or pasted text — and extracts every requirement, deadline, and risk into a structured, prioritized plan.
          </p>

          <div className="flex flex-col gap-[1.6vh]">
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[1.6vw] h-[1.6vw] rounded-full bg-[#4f7cac] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-[0.8vw] h-[0.8vw]">
                  <path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[1.5vw] text-[#f0f4f8]/80 font-body">Upload PDF, Word doc, or paste text</span>
            </div>
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[1.6vw] h-[1.6vw] rounded-full bg-[#4f7cac] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-[0.8vw] h-[0.8vw]">
                  <path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[1.5vw] text-[#f0f4f8]/80 font-body">AI extracts every step, document, and deadline</span>
            </div>
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[1.6vw] h-[1.6vw] rounded-full bg-[#4f7cac] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-[0.8vw] h-[0.8vw]">
                  <path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[1.5vw] text-[#f0f4f8]/80 font-body">Work through a prioritized checklist — check items off as you go</span>
            </div>
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[1.6vw] h-[1.6vw] rounded-full bg-[#4f7cac] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-[0.8vw] h-[0.8vw]">
                  <path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[1.5vw] text-[#f0f4f8]/80 font-body">No account required — results saved on your device</span>
            </div>
          </div>
        </div>

        <div className="w-[36vw] shrink-0 flex flex-col gap-[1.5vh]">
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2vw]">
            <div className="text-[1.1vw] font-semibold text-[#4f7cac] uppercase tracking-widest mb-[1.2vh] font-body">
              Upload
            </div>
            <div className="h-[6vh] bg-[#172035] rounded-[0.8vw] border border-[#4f7cac]/20 flex items-center px-[1.2vw] gap-[1vw]">
              <div className="w-[1.5vw] h-[1.5vw] bg-[#4f7cac]/20 rounded flex items-center justify-center">
                <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#4f7cac]" />
              </div>
              <span className="text-[1.3vw] text-[#f0f4f8]/50 font-body">Event_Permit_Application.pdf</span>
            </div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2vw] flex flex-col gap-[1vh]">
            <div className="text-[1.1vw] font-semibold text-[#4f7cac] uppercase tracking-widest mb-[0.5vh] font-body">
              Action Plan — 8 steps identified
            </div>
            <div className="flex items-center gap-[0.8vw] py-[0.6vh] border-b border-[#1e2d44]">
              <div className="w-[1vw] h-[1vw] rounded-full bg-[#ef4444] shrink-0" />
              <span className="text-[1.2vw] text-[#f0f4f8]/80 font-body">Submit liability insurance certificate</span>
              <span className="ml-auto text-[1vw] text-[#ef4444]/70 font-body">High priority</span>
            </div>
            <div className="flex items-center gap-[0.8vw] py-[0.6vh] border-b border-[#1e2d44]">
              <div className="w-[1vw] h-[1vw] rounded-full bg-[#f59e0b] shrink-0" />
              <span className="text-[1.2vw] text-[#f0f4f8]/80 font-body">File noise variance request (45-day lead)</span>
              <span className="ml-auto text-[1vw] text-[#f59e0b]/70 font-body">Deadline</span>
            </div>
            <div className="flex items-center gap-[0.8vw] py-[0.6vh]">
              <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac] shrink-0" />
              <span className="text-[1.2vw] text-[#f0f4f8]/80 font-body">Obtain site plan approval from Parks Dept.</span>
              <span className="ml-auto text-[1vw] text-[#4f7cac]/70 font-body">Medium</span>
            </div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[1.8vw] flex items-center gap-[2vw]">
            <div className="text-[2.5vw] font-extrabold text-[#4f7cac] font-display">6</div>
            <div>
              <div className="text-[1.3vw] font-semibold text-[#f0f4f8] font-display">Required documents</div>
              <div className="text-[1.1vw] text-[#6b7a8d] font-body">All with source citations from original text</div>
            </div>
            <div className="ml-auto text-[2.5vw] font-extrabold text-[#4f7cac] font-display">3</div>
            <div>
              <div className="text-[1.3vw] font-semibold text-[#f0f4f8] font-display">Hard deadlines</div>
              <div className="text-[1.1vw] text-[#6b7a8d] font-body">Extracted from fine print</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
