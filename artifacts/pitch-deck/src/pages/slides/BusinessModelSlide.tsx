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
            Free to try. Subscription for power users and teams.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[2.5vw] flex-1 content-center">
          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.5vw] flex flex-col gap-[2vh]">
            <div>
              <div className="text-[1.1vw] font-bold tracking-widest uppercase text-[#6b7a8d] font-body mb-[1vh]">
                Free
              </div>
              <div className="flex items-baseline gap-[0.3vw]">
                <span className="text-[4vw] font-extrabold text-[#f0f4f8] font-display leading-none">$0</span>
                <span className="text-[1.4vw] text-[#6b7a8d] font-body">/forever</span>
              </div>
            </div>
            <div className="h-px bg-[#1e2d44]" />
            <div className="flex flex-col gap-[1.2vh]">
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac]/40 shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">Analyze any document</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac]/40 shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">All 10 analysis tabs</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac]/40 shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">No account required</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac]/40 shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">Saved locally on device</span>
              </div>
            </div>
          </div>

          <div className="bg-[#4f7cac] rounded-[1.5vw] p-[2.5vw] flex flex-col gap-[2vh] relative overflow-hidden shadow-[0_0_4vw_rgba(79,124,172,0.25)]">
            <div className="absolute top-[1.5vh] right-[1.2vw] bg-white/20 text-white text-[1vw] font-bold tracking-wide px-[0.8vw] py-[0.3vh] rounded-full font-body">
              Most Popular
            </div>
            <div className="absolute bottom-0 right-0 w-[15vw] h-[15vw] rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
            <div>
              <div className="text-[1.1vw] font-bold tracking-widest uppercase text-white/70 font-body mb-[1vh]">
                Pro
              </div>
              <div className="flex items-baseline gap-[0.3vw]">
                <span className="text-[4vw] font-extrabold text-white font-display leading-none">$9</span>
                <span className="text-[1.4vw] text-white/70 font-body">/month</span>
              </div>
            </div>
            <div className="h-px bg-white/20" />
            <div className="flex flex-col gap-[1.2vh]">
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-white shrink-0" />
                <span className="text-[1.3vw] text-white font-body">Everything in Free</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-white shrink-0" />
                <span className="text-[1.3vw] text-white font-body">Cloud sync across devices</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-white shrink-0" />
                <span className="text-[1.3vw] text-white font-body">Export to PDF and Word</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-white shrink-0" />
                <span className="text-[1.3vw] text-white font-body">Priority processing</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1.5vw] p-[2.5vw] flex flex-col gap-[2vh]">
            <div>
              <div className="text-[1.1vw] font-bold tracking-widest uppercase text-[#6b7a8d] font-body mb-[1vh]">
                Team
              </div>
              <div className="flex items-baseline gap-[0.3vw]">
                <span className="text-[4vw] font-extrabold text-[#f0f4f8] font-display leading-none">$29</span>
                <span className="text-[1.4vw] text-[#6b7a8d] font-body">/month</span>
              </div>
            </div>
            <div className="h-px bg-[#1e2d44]" />
            <div className="flex flex-col gap-[1.2vh]">
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac] shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">Everything in Pro</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac] shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">Up to 10 team members</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac] shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">Shared document workspace</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#4f7cac] shrink-0" />
                <span className="text-[1.3vw] text-[#f0f4f8]/70 font-body">Admin controls and audit log</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
