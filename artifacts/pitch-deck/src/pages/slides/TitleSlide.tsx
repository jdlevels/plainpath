const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#080d1a]/80 via-transparent to-[#080d1a]/60" />
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-[#4f7cac]/10 blur-[8vw] -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-[#4f7cac]/8 blur-[6vw] translate-x-1/4 translate-y-1/4" />

      <div className="relative flex h-full flex-col justify-between px-[8vw] py-[8vh]">
        <div className="flex items-center gap-[0.8vw]">
          <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-[#4f7cac]" />
          <span className="text-[1.4vw] font-bold tracking-[0.15em] text-[#f0f4f8]/70 uppercase font-display">
            PlainPath
          </span>
        </div>

        <div className="max-w-[72vw]">
          <div className="inline-block px-[1.2vw] py-[0.4vh] rounded-full border border-[#4f7cac]/40 bg-[#4f7cac]/10 text-[#7fb2d9] text-[1.2vw] font-semibold tracking-wide mb-[3vh]">
            Investor Presentation · 2026
          </div>
          <h1 className="text-[6.5vw] font-extrabold leading-[0.93] tracking-tight text-[#f0f4f8] font-display">
            Stop guessing what
          </h1>
          <h1 className="text-[6.5vw] font-extrabold leading-[0.93] tracking-tight text-[#4f7cac] font-display">
            a document requires.
          </h1>
          <p className="mt-[3vh] text-[1.9vw] text-[#f0f4f8]/65 font-body leading-snug max-w-[55vw]">
            PlainPath turns any confusing paperwork into a clear, structured action plan — instantly.
          </p>
        </div>

        <div className="flex items-center gap-[3vw]">
          <div className="text-[1.3vw] text-[#f0f4f8]/45 font-body">
            hello@plainpath.app
          </div>
          <div className="w-[0.06vw] h-[2.5vh] bg-[#f0f4f8]/20" />
          <div className="text-[1.3vw] text-[#f0f4f8]/45 font-body">
            plain-path.replit.app
          </div>
        </div>
      </div>
    </div>
  );
}
