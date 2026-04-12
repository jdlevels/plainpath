const base = import.meta.env.BASE_URL;

export default function ClosingSlide() {
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
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/75 to-[#080d1a]/55" />
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] rounded-full bg-[#4f7cac]/8 blur-[10vw] -translate-x-1/3 -translate-y-1/3" />

      <div className="relative flex h-full flex-col items-center justify-center text-center px-[12vw] gap-[3.5vh]">
        <div className="flex items-center gap-[0.8vw] mb-[0.5vh]">
          <div className="w-[1.4vw] h-[1.4vw] rounded-full bg-[#4f7cac]" />
          <span className="text-[1.6vw] font-bold tracking-[0.15em] text-[#f0f4f8]/60 uppercase font-display">
            PlainPath
          </span>
        </div>

        <div>
          <h2 className="text-[4.5vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            Every document. Understood.
          </h2>
          <h2 className="text-[4.5vw] font-extrabold leading-[1.05] tracking-tight text-[#4f7cac] font-display">
            Every contract. Reviewed.
          </h2>
          <h2 className="text-[4.5vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8]/70 font-display">
            All in plain English.
          </h2>
        </div>

        <div className="flex items-center gap-[1.5vw] mt-[0.5vh]">
          {tools.map((t) => (
            <div key={t.label} className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vh] rounded-full border" style={{ borderColor: `${t.dot}55`, backgroundColor: `${t.dot}18` }}>
              <div className="w-[0.65vw] h-[0.65vw] rounded-full shrink-0" style={{ backgroundColor: t.dot }} />
              <span className="text-[0.95vw] font-semibold font-body" style={{ color: t.color }}>{t.label}</span>
            </div>
          ))}
        </div>

        <div className="h-px w-[20vw] bg-gradient-to-r from-transparent via-[#4f7cac]/40 to-transparent" />

        <div className="flex items-center gap-[4vw]">
          <div className="text-center">
            <div className="text-[1.2vw] text-[#6b7a8d] font-body mb-[0.5vh]">Email</div>
            <div className="text-[1.5vw] font-semibold text-[#7fb2d9] font-body">support@plainpathapp.com</div>
          </div>
          <div className="w-px h-[5vh] bg-[#1e2d44]" />
          <div className="text-center">
            <div className="text-[1.2vw] text-[#6b7a8d] font-body mb-[0.5vh]">Try it live</div>
            <div className="text-[1.5vw] font-semibold text-[#7fb2d9] font-body">plain-path.replit.app</div>
          </div>
          <div className="w-px h-[5vh] bg-[#1e2d44]" />
          <div className="text-center">
            <div className="text-[1.2vw] text-[#6b7a8d] font-body mb-[0.5vh]">Platform</div>
            <div className="text-[1.5vw] font-semibold text-[#7fb2d9] font-body">Web · iOS · Android</div>
          </div>
        </div>
      </div>
    </div>
  )
}
