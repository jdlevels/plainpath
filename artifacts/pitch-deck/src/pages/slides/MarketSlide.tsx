export default function MarketSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f7cac]/10 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 w-[55vw] h-[55vw] rounded-full bg-[#4f7cac]/6 blur-[12vw] -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] rounded-full bg-[#4f7cac]/4 blur-[10vw] translate-x-1/4 translate-y-1/4" />

      <div className="relative flex h-full items-center px-[8vw] gap-[8vw]">
        <div className="flex-1 flex flex-col gap-[3vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] font-body">
            Market Opportunity
          </p>
          <div>
            <div className="text-[11vw] font-extrabold text-[#4f7cac] leading-none tracking-tight font-display">
              330M
            </div>
            <div className="text-[2.2vw] font-bold text-[#f0f4f8] font-display mt-[1vh]">
              Americans deal with confusing paperwork every year.
            </div>
          </div>
          <p className="text-[1.6vw] text-[#f0f4f8]/55 font-body leading-relaxed max-w-[38vw]">
            Tax filings, benefit applications, permits, legal notices, healthcare forms — paperwork is universal. PlainPath serves anyone who receives a document they don't fully understand.
          </p>
        </div>

        <div className="w-[32vw] shrink-0 flex flex-col gap-[2vh]">
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw]">
            <div className="text-[3vw] font-extrabold text-[#f0f4f8] font-display leading-none">
              145M+
            </div>
            <div className="text-[1.3vw] font-semibold text-[#f0f4f8]/70 font-display mt-[0.8vh]">
              Individual tax returns filed annually
            </div>
          </div>
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw]">
            <div className="text-[3vw] font-extrabold text-[#f0f4f8] font-display leading-none">
              32M+
            </div>
            <div className="text-[1.3vw] font-semibold text-[#f0f4f8]/70 font-display mt-[0.8vh]">
              Small businesses navigating government permits
            </div>
          </div>
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.2vw] p-[2vw]">
            <div className="text-[3vw] font-extrabold text-[#f0f4f8] font-display leading-none">
              Global
            </div>
            <div className="text-[1.3vw] font-semibold text-[#f0f4f8]/70 font-display mt-[0.8vh]">
              Paperwork is a universal problem — every country, every language
            </div>
          </div>
          <div className="bg-[#4f7cac]/15 border border-[#4f7cac]/30 rounded-[1.2vw] p-[2vw]">
            <div className="text-[1.3vw] font-semibold text-[#7fb2d9] font-display">
              Initial focus: US individual and small business filers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
