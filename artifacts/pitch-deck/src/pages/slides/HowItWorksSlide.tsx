export default function HowItWorksSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f7cac]/6 via-transparent to-transparent" />
      <div className="absolute bottom-0 right-0 w-[45vw] h-[45vw] rounded-full bg-[#4f7cac]/4 blur-[10vw] translate-x-1/4 translate-y-1/4" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[4.5vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            How It Works
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            From document to action plan in under a minute.
          </h2>
        </div>

        <div className="flex flex-col gap-[2.2vh] flex-1 justify-center max-w-[82vw]">
          <div className="flex items-start gap-[2.5vw]">
            <div className="shrink-0 flex flex-col items-center gap-0">
              <div className="w-[3.8vw] h-[3.8vw] rounded-full bg-[#4f7cac] flex items-center justify-center">
                <span className="text-[1.6vw] font-extrabold text-white font-display">1</span>
              </div>
              <div className="w-px h-[5vh] bg-gradient-to-b from-[#4f7cac]/40 to-transparent" />
            </div>
            <div className="flex-1 pb-[1vh]">
              <div className="text-[1.9vw] font-bold text-[#f0f4f8] font-display mb-[0.6vh]">Upload or paste your document</div>
              <div className="text-[1.4vw] text-[#6b7a8d] font-body leading-snug">Drop in a PDF, Word file, or paste text directly — government forms, legal notices, insurance packets, grant applications, and more. PlainPath reads the full content.</div>
            </div>
          </div>

          <div className="flex items-start gap-[2.5vw]">
            <div className="shrink-0 flex flex-col items-center gap-0">
              <div className="w-[3.8vw] h-[3.8vw] rounded-full bg-[#4f7cac] flex items-center justify-center">
                <span className="text-[1.6vw] font-extrabold text-white font-display">2</span>
              </div>
              <div className="w-px h-[5vh] bg-gradient-to-b from-[#4f7cac]/40 to-transparent" />
            </div>
            <div className="flex-1 pb-[1vh]">
              <div className="text-[1.9vw] font-bold text-[#f0f4f8] font-display mb-[0.6vh]">AI extracts every hidden requirement</div>
              <div className="text-[1.4vw] text-[#6b7a8d] font-body leading-snug">GPT-5 reads the full document and pulls out action steps, required documents, deadlines buried in fine print, risks, costs, and open questions — all with source citations from the original text.</div>
            </div>
          </div>

          <div className="flex items-start gap-[2.5vw]">
            <div className="shrink-0 flex flex-col items-center gap-0">
              <div className="w-[3.8vw] h-[3.8vw] rounded-full bg-[#4f7cac] flex items-center justify-center">
                <span className="text-[1.6vw] font-extrabold text-white font-display">3</span>
              </div>
              <div className="w-px h-[5vh] bg-gradient-to-b from-[#4f7cac]/40 to-transparent" />
            </div>
            <div className="flex-1 pb-[1vh]">
              <div className="text-[1.9vw] font-bold text-[#f0f4f8] font-display mb-[0.6vh]">
                Receive a color-coded, 10-tab action plan
              </div>
              <div className="text-[1.4vw] text-[#6b7a8d] font-body leading-snug">
                Findings organized across ten semantic tabs — <span className="text-[#f87171]/80">red</span> flags blockers and hard deadlines, <span className="text-[#fb923c]/80">amber</span> surfaces risks, <span className="text-[#34d399]/80">green</span> confirms completed steps. The <span className="text-[#f0f4f8]/70">"What's Missing"</span> tab shows exactly what will get your submission rejected before you submit.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-[2.5vw]">
            <div className="shrink-0 flex flex-col items-center gap-0">
              <div className="w-[3.8vw] h-[3.8vw] rounded-full bg-[#4f7cac] flex items-center justify-center">
                <span className="text-[1.6vw] font-extrabold text-white font-display">4</span>
              </div>
              <div className="w-px h-[5vh] bg-gradient-to-b from-[#4f7cac]/40 to-transparent" />
            </div>
            <div className="flex-1 pb-[1vh]">
              <div className="text-[1.9vw] font-bold text-[#f0f4f8] font-display mb-[0.6vh]">Use Guided Review to walk through every finding</div>
              <div className="text-[1.4vw] text-[#6b7a8d] font-body leading-snug">Open Guided Review from any tab and step through each finding one by one. The panel highlights and scrolls to the exact sentence in the source document so you always know where a requirement came from.</div>
            </div>
          </div>

          <div className="flex items-start gap-[2.5vw]">
            <div className="shrink-0">
              <div className="w-[3.8vw] h-[3.8vw] rounded-full bg-[#4f7cac] flex items-center justify-center">
                <span className="text-[1.6vw] font-extrabold text-white font-display">5</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[1.9vw] font-bold text-[#f0f4f8] font-display mb-[0.6vh]">Work through your checklist — nothing falls through the cracks</div>
              <div className="text-[1.4vw] text-[#6b7a8d] font-body leading-snug">Check off action steps as you complete them. Progress tracked in real time. Save and export your analysis. No account required to get started.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
