import React from "react"

export default function BusinessModelSlide() {
  const plans = [
    {
      name: "Free",
      price: "0",
      sub: "No account required",
      highlight: false,
      accentColor: "#6b7a8d",
      dotColor: "#4f7cac",
      features: [
        "2 document analyses",
        "All 10 analysis tabs",
        "Progress tracking",
        "No account required",
      ],
      badge: null,
    },
    {
      name: "Starter",
      price: "4.99",
      sub: "/month",
      highlight: false,
      accentColor: "#7fb2d9",
      dotColor: "#4f7cac",
      features: [
        "Unlimited document analyses",
        "All 10 analysis tabs",
        "Save & export analyses",
        "Shareable analysis links",
        "Email deadline reminders",
      ],
      badge: null,
    },
    {
      name: "Pro",
      price: "14.99",
      sub: "/month",
      highlight: true,
      accentColor: "white",
      dotColor: "rgba(255,255,255,0.9)",
      features: [
        "Everything in Starter",
        "Document Trust Check",
        "Build a Contract (all types)",
        "Contract Review",
        "PDF export for all tools",
        "Priority AI processing",
      ],
      badge: "Most Popular",
    },
    {
      name: "Team",
      price: "39.99",
      sub: "/month",
      highlight: false,
      accentColor: "#6b7a8d",
      dotColor: "#4f7cac",
      features: [
        "Everything in Pro",
        "Up to 10 team members",
        "Shared workspace",
        "Admin controls & audit log",
      ],
      badge: "Coming Soon",
    },
  ]

  const toolRows = [
    { label: "Analyze a Document", free: true, starter: true, pro: true, team: true, color: "#60a5fa" },
    { label: "Document Trust Check", free: false, starter: false, pro: true, team: true, color: "#f87171" },
    { label: "Build a Contract", free: false, starter: false, pro: true, team: true, color: "#34d399" },
    { label: "Contract Review", free: false, starter: false, pro: true, team: true, color: "#fbbf24" },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d1a]">
      <div className="absolute top-0 right-0 w-[40vw] h-[50vh] bg-gradient-to-bl from-[#4f7cac]/8 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col px-[8vw] py-[6vh]">
        <div className="mb-[3vh]">
          <p className="text-[1.2vw] font-semibold tracking-[0.18em] uppercase text-[#4f7cac] mb-[1.2vh] font-body">
            Business Model
          </p>
          <h2 className="text-[3.8vw] font-extrabold leading-[1.05] tracking-tight text-[#f0f4f8] font-display">
            Start free. Upgrade to unlock all four tools.
          </h2>
          <p className="mt-[0.8vh] text-[1.5vw] text-[#f0f4f8]/50 font-body">
            Freemium entry — no account needed. Paid plans via Stripe. Cancel any time.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-[1.8vw] mb-[2.5vh]">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-[1.3vw] p-[1.8vw] flex flex-col gap-[1.4vh] relative overflow-hidden"
              style={plan.highlight
                ? { background: "#4f7cac", boxShadow: "0 0 4vw rgba(79,124,172,0.3)" }
                : { background: "#0f1929", border: "1px solid #1e2d44" }
              }
            >
              {plan.badge && (
                <div className="absolute top-[1.2vh] right-[1vw] text-[0.85vw] font-bold tracking-wide px-[0.7vw] py-[0.2vh] rounded-full font-body"
                  style={plan.highlight
                    ? { background: "rgba(255,255,255,0.2)", color: "white" }
                    : { background: "rgba(79,124,172,0.2)", color: "#7fb2d9" }
                  }>
                  {plan.badge}
                </div>
              )}
              {plan.highlight && <div className="absolute bottom-0 right-0 w-[10vw] h-[10vw] rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />}
              <div>
                <div className="text-[1vw] font-bold tracking-widest uppercase font-body mb-[0.8vh]" style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "#6b7a8d" }}>{plan.name}</div>
                <div className="flex items-baseline gap-[0.3vw]">
                  <span className="text-[0.9vw] font-semibold font-body" style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "#6b7a8d" }}>{plan.price === "0" ? "" : "$"}</span>
                  <span className="text-[3vw] font-extrabold font-display leading-none" style={{ color: plan.highlight ? "white" : "#f0f4f8" }}>{plan.price === "0" ? "Free" : plan.price}</span>
                  {plan.price !== "0" && <span className="text-[1vw] font-body" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#6b7a8d" }}>{plan.sub}</span>}
                </div>
              </div>
              <div className="h-px" style={{ background: plan.highlight ? "rgba(255,255,255,0.2)" : "#1e2d44" }} />
              <div className="flex flex-col gap-[0.8vh]">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-[0.6vw]">
                    <div className="w-[0.8vw] h-[0.8vw] rounded-full shrink-0 mt-[0.3vh]" style={{ background: plan.dotColor }} />
                    <span className="text-[1vw] font-body leading-snug" style={{ color: plan.highlight ? "rgba(255,255,255,0.9)" : "rgba(240,244,248,0.70)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0f1929] border border-[#1e2d44] rounded-[1vw] px-[2vw] py-[1.2vh]">
          <div className="grid grid-cols-5 gap-[1vw] items-center">
            <div className="text-[1vw] font-semibold text-[#6b7a8d] font-body">Tool access</div>
            {["Free", "Starter", "Pro", "Team"].map(p => (
              <div key={p} className="text-center text-[1vw] font-bold font-body" style={{ color: p === "Pro" ? "#7fb2d9" : "#6b7a8d" }}>{p}</div>
            ))}
            {toolRows.map((row) => (
              <React.Fragment key={row.label}>
                <div className="flex items-center gap-[0.5vw]">
                  <div className="w-[0.6vw] h-[0.6vw] rounded-full" style={{ background: row.color }} />
                  <span className="text-[0.95vw] font-body" style={{ color: row.color }}>{row.label}</span>
                </div>
                {[row.free, row.starter, row.pro, row.team].map((has, i) => (
                  <div key={i} className="flex justify-center">
                    {has
                      ? <svg viewBox="0 0 16 16" fill="none" className="w-[1.1vw] h-[1.1vw]"><circle cx="8" cy="8" r="7" fill={i === 2 ? "rgba(79,124,172,0.25)" : "rgba(52,211,153,0.15)"}/><path d="M5 8l2 2 4-4" stroke={i === 2 ? "#7fb2d9" : "#34d399"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg viewBox="0 0 16 16" fill="none" className="w-[1.1vw] h-[1.1vw]"><circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.04)"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#2d3f55" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    }
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
