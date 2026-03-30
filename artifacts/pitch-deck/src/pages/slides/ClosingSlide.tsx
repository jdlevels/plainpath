const base = import.meta.env.BASE_URL;

export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/70 to-[#080d1a]/50" />
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] rounded-full bg-[#4f7cac]/8 blur-[10vw] -translate-x-1/3 -translate-y-1/3" />

      <div className="relative flex h-full flex-col items-center justify-center text-center px-[12vw] gap-[4vh]">
        <div className="flex items-center gap-[0.8vw] mb-[1vh]">
          <div className="w-[1.4vw] h-[1.4vw] rounded-full bg-[#4f7cac]" />
          <span className="text-[1.6vw] font-bold tracking-[0.15em] text-[#f0f4f8]/60 uppercase font-display">
            PlainPath
          </span>
        </div>

        <h2 className="text-[5vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
          Every requirement.
        </h2>
        <h2 className="text-[5vw] font-extrabold leading-[1.05] tracking-tight text-[#4f7cac] font-display -mt-[3vh]">
          Every deadline.
        </h2>
        <h2 className="text-[5vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8]/70 font-display -mt-[3vh]">
          In plain English.
        </h2>

        <div className="h-px w-[20vw] bg-gradient-to-r from-transparent via-[#4f7cac]/40 to-transparent mt-[2vh]" />

        <div className="flex items-center gap-[4vw]">
          <div className="text-center">
            <div className="text-[1.2vw] text-[#6b7a8d] font-body mb-[0.5vh]">Email</div>
            <div className="text-[1.5vw] font-semibold text-[#7fb2d9] font-body">hello@plainpath.app</div>
          </div>
          <div className="w-px h-[5vh] bg-[#1e2d44]" />
          <div className="text-center">
            <div className="text-[1.2vw] text-[#6b7a8d] font-body mb-[0.5vh]">Try it live</div>
            <div className="text-[1.5vw] font-semibold text-[#7fb2d9] font-body">plain-path.replit.app</div>
          </div>
        </div>
      </div>
    </div>
  );
}
