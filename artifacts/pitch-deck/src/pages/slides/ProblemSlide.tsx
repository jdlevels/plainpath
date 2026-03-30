export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-gradient-to-bl from-[#4f7cac]/6 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#4f7cac]/15 to-transparent" style={{left: "7.5vw"}} />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[5vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.5vh] font-body">
            The Problem
          </p>
          <h2 className="text-[4vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            Paperwork is designed to be confusing.
          </h2>
          <p className="mt-[1.5vh] text-[1.7vw] text-[#f0f4f8]/55 font-body max-w-[55vw]">
            Buried requirements, legal jargon, and missing checklists leave people guessing — with costly consequences.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[2.5vw] flex-1 content-center">
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.5vw] flex flex-col gap-[1.5vh]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.8vw] bg-[#4f7cac]/15 flex items-center justify-center">
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" className="w-[1.8vw] h-[1.8vw]">
                <circle cx="12" cy="12" r="10" stroke="#4f7cac" strokeWidth="2"/>
                <path d="M12 8v4l3 3" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-[4.5vw] font-extrabold text-[#4f7cac] leading-none font-display">
              47%
            </div>
            <p className="text-[1.4vw] font-semibold text-[#f0f4f8] font-display leading-tight">
              of government applications are rejected on the first submission
            </p>
            <p className="text-[1.2vw] text-[#6b7a8d] font-body">
              Most due to missing documents or missed requirements
            </p>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.5vw] flex flex-col gap-[1.5vh]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.8vw] bg-[#4f7cac]/15 flex items-center justify-center">
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" className="w-[1.8vw] h-[1.8vw]">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-[4.5vw] font-extrabold text-[#4f7cac] leading-none font-display">
              6 hrs
            </div>
            <p className="text-[1.4vw] font-semibold text-[#f0f4f8] font-display leading-tight">
              average time spent reading a single complex filing packet
            </p>
            <p className="text-[1.2vw] text-[#6b7a8d] font-body">
              Without a structured checklist to guide the process
            </p>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.5vw] flex flex-col gap-[1.5vh]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.8vw] bg-[#4f7cac]/15 flex items-center justify-center">
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" className="w-[1.8vw] h-[1.8vw]">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#4f7cac" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-[4.5vw] font-extrabold text-[#4f7cac] leading-none font-display">
              $3.1B
            </div>
            <p className="text-[1.4vw] font-semibold text-[#f0f4f8] font-display leading-tight">
              lost annually to missed deadlines on legal and tax filings
            </p>
            <p className="text-[1.2vw] text-[#6b7a8d] font-body">
              Penalties that could have been avoided with clearer guidance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
