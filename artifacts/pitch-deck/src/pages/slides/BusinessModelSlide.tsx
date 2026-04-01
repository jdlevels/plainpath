export default function BusinessModelSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute top-0 right-0 w-[40vw] h-[50vh] bg-gradient-to-bl from-[#4f7cac]/8 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            Business Model
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            Simple pricing. No contracts.
          </h2>
          <p className="mt-[1vh] text-[1.6vw] text-[#f0f4f8]/50 font-body">
            Three tiers. No contracts. Cancel any time.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[2.5vw] flex-1 content-center">
          {/* Starter */}
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2vw] flex flex-col gap-[1.6vh]">
            <div>
              <div className="text-[1.1vw] font-bold tracking-widest uppercase text-[#6b7a8d] font-body mb-[1vh]">Starter</div>
              <div className="flex items-baseline gap-[0.3vw]">
                <span className="text-[3.5vw] font-extrabold text-[#f0f4f8] font-display leading-none">$4.99</span>
                <span className="text-[1.2vw] text-[#6b7a8d] font-body">/mo</span>
              </div>
            </div>
            <div className="h-px bg-[#1e2d44]" />
            <div className="flex flex-col gap-[1vh]">
              {["Analyze any document","All 10 analysis tabs","Save & export analyses","Progress tracking"].map(f => (
                <div key={f} className="flex items-center gap-[0.7vw]">
                  <div className="w-[0.9vw] h-[0.9vw] rounded-full bg-[#4f7cac] shrink-0" />
                  <span className="text-[1.15vw] text-[#f0f4f8]/70 font-body">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro — highlighted */}
          <div className="bg-[#4f7cac] rounded-[1.5vw] p-[2vw] flex flex-col gap-[1.6vh] relative overflow-hidden shadow-[0_0_4vw_rgba(79,124,172,0.25)]">
            <div className="absolute top-[1.5vh] right-[1.2vw] bg-white/20 text-white text-[0.9vw] font-bold tracking-wide px-[0.8vw] py-[0.3vh] rounded-full font-body">
              Most Popular
            </div>
            <div className="absolute bottom-0 right-0 w-[12vw] h-[12vw] rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
            <div>
              <div className="text-[1.1vw] font-bold tracking-widest uppercase text-white/70 font-body mb-[1vh]">Pro</div>
              <div className="flex items-baseline gap-[0.3vw]">
                <span className="text-[3.5vw] font-extrabold text-white font-display leading-none">$14.99</span>
                <span className="text-[1.2vw] text-white/70 font-body">/mo</span>
              </div>
            </div>
            <div className="h-px bg-white/20" />
            <div className="flex flex-col gap-[1vh]">
              {["Everything in Starter","Cloud sync across devices","Export to PDF & text","Priority AI processing"].map(f => (
                <div key={f} className="flex items-center gap-[0.7vw]">
                  <div className="w-[0.9vw] h-[0.9vw] rounded-full bg-white shrink-0" />
                  <span className="text-[1.15vw] text-white font-body">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2vw] flex flex-col gap-[1.6vh]">
            <div>
              <div className="flex items-center gap-[0.6vw] mb-[1vh]">
                <div className="text-[1.1vw] font-bold tracking-widest uppercase text-[#6b7a8d] font-body">Team</div>
                <div className="bg-[#4f7cac]/20 text-[#4f7cac] text-[0.8vw] font-bold tracking-wide px-[0.6vw] py-[0.2vh] rounded-full font-body">Waitlist</div>
              </div>
              <div className="flex items-baseline gap-[0.3vw]">
                <span className="text-[3.5vw] font-extrabold text-[#f0f4f8] font-display leading-none">$39.99</span>
                <span className="text-[1.2vw] text-[#6b7a8d] font-body">/mo</span>
              </div>
            </div>
            <div className="h-px bg-[#1e2d44]" />
            <div className="flex flex-col gap-[1vh]">
              {["Everything in Pro","Up to 10 team members","Shared workspace","Admin controls & audit log"].map(f => (
                <div key={f} className="flex items-center gap-[0.7vw]">
                  <div className="w-[0.9vw] h-[0.9vw] rounded-full bg-[#4f7cac] shrink-0" />
                  <span className="text-[1.15vw] text-[#f0f4f8]/70 font-body">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
