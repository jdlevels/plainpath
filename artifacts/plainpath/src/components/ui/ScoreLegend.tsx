import { TrendingDown, TrendingUp } from "lucide-react"

export interface ScoreRange {
  min: number
  max: number
  label: string
  bgClass: string
  textClass: string
}

export interface ScoreLegendConfig {
  scoreLabel: string
  higherIsBetter: boolean
  ranges: ScoreRange[]
}

interface Props {
  score: number
  config: ScoreLegendConfig
}

function activeRange(score: number, ranges: ScoreRange[]): ScoreRange {
  return (
    ranges.find((r) => score >= r.min && score <= r.max) ?? ranges[ranges.length - 1]
  )
}

export function ScoreLegend({ score, config }: Props) {
  const active = activeRange(score, config.ranges)
  const DirectionIcon = config.higherIsBetter ? TrendingUp : TrendingDown

  return (
    <div className="mt-3 space-y-2">
      {/* Direction + status row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          <DirectionIcon className="w-3 h-3" />
          Higher = {config.higherIsBetter ? "better" : "worse"}
        </span>
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${active.textClass}`}
          style={{ backgroundColor: "transparent" }}
        >
          {score} / 100 — {active.label}
        </span>
      </div>

      {/* Segmented legend bar */}
      <div className="flex gap-0.5 rounded-lg overflow-hidden h-1.5">
        {config.ranges.map((r) => {
          const isActive = score >= r.min && score <= r.max
          return (
            <div
              key={r.min}
              className={`flex-1 h-full transition-opacity ${r.bgClass} ${isActive ? "opacity-100" : "opacity-25"}`}
            />
          )
        })}
      </div>

      {/* Segment labels */}
      <div className="flex gap-0.5">
        {config.ranges.map((r) => {
          const isActive = score >= r.min && score <= r.max
          return (
            <div key={r.min} className="flex-1 text-center">
              <p className={`text-[9px] font-semibold leading-tight transition-colors ${
                isActive ? active.textClass : "text-muted-foreground/50"
              }`}>
                {r.label}
              </p>
              <p className="text-[8px] text-muted-foreground/40 tabular-nums">{r.min}–{r.max}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Tool-specific configs ──────────────────────────────────────────────── */

export const TRUST_CHECK_LEGEND: ScoreLegendConfig = {
  scoreLabel: "Scam Risk Score",
  higherIsBetter: false,
  ranges: [
    {
      min: 0,  max: 24,
      label: "Low scam risk",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    },
    {
      min: 25, max: 49,
      label: "Caution",
      bgClass: "bg-amber-400",
      textClass: "text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    },
    {
      min: 50, max: 74,
      label: "High risk",
      bgClass: "bg-orange-500",
      textClass: "text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    },
    {
      min: 75, max: 100,
      label: "Severe / likely scam",
      bgClass: "bg-red-600",
      textClass: "text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
    },
  ],
}

export const CONTRACT_REVIEW_LEGEND: ScoreLegendConfig = {
  scoreLabel: "Contract Fairness Score",
  higherIsBetter: true,
  ranges: [
    {
      min: 0,  max: 24,
      label: "Unsafe / major revisions needed",
      bgClass: "bg-red-600",
      textClass: "text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
    },
    {
      min: 25, max: 49,
      label: "Weak / risky",
      bgClass: "bg-orange-500",
      textClass: "text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    },
    {
      min: 50, max: 74,
      label: "Acceptable with revisions",
      bgClass: "bg-amber-400",
      textClass: "text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    },
    {
      min: 75, max: 100,
      label: "Strong / fair",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    },
  ],
}
