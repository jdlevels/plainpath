const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  const tools = [
    { label: "Analyze a Document", color: "#60a5fa", dot: "#3b82f6" },
    { label: "Document Trust Check", color: "#f87171", dot: "#ef4444" },
    { label: "Build a Contract", color: "#34d399", dot: "#10b981" },
    { label: "Contract Review", color: "#fbbf24", dot: "#f59e0b" },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#080d1a]/85 via-transparent to-[#080d1a]/70" />
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-[#4f7cac]/10 blur-[8vw] -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-[#4f7cac]/8 blur-[6vw] translate-x-1/4 translate-y-1/4" />

      <div className="relative flex h-full flex-col justify-between px-[8vw] py-[8vh]">
        <div className="flex items-center gap-[0.8vw]">
          <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-[#4f7cac]" />
          <span className="text-[1.4vw] font-bold tracking-[0.15em] text-[#f0f4f8]/70 uppercase font-display">
            PlainPath
          </span>
        </div>

        <div className="max-w-[75vw]">
          <div className="inline-block px-[1.2vw] py-[0.4vh] rounded-full border border-[#4f7cac]/40 bg-[#4f7cac]/10 text-[#7fb2d9] text-[1.2vw] font-semibold tracking-wide mb-[3vh]">
            Investor Presentation · 2026
          </div>
          <h1 className="text-[6vw] font-extrabold leading-[0.93] tracking-tight text-[#f0f4f8] font-display">
            Stop guessing what
          </h1>
          <h1 className="text-[6vw] font-extrabold leading-[0.93] tracking-tight text-[#4f7cac] font-display">
            your documents mean.
          </h1>
          <p className="mt-[2.5vh] text-[1.8vw] text-[#f0f4f8]/60 font-body leading-snug max-w-[58vw]">
            A four-tool platform that reads any paperwork and returns a clear, structured result in plain English — so anyone can understand, verify, and act on any document.
          </p>
          <div className="flex items-center gap-[2vw] mt-[3vh]">
            {tools.map((t) => (
              <div key={t.label} className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vh] rounded-full border" style={{ borderColor: `${t.dot}55`, backgroundColor: `${t.dot}18` }}>
                <div className="w-[0.7vw] h-[0.7vw] rounded-full shrink-0" style={{ backgroundColor: t.dot }} />
                <span className="text-[1vw] font-semibold font-body" style={{ color: t.color }}>{t.label}</span>
              </div>
            ))}
          </div>
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
