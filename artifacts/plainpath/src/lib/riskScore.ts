export interface RiskScoreResult {
  score: number;
  label: string;
  color: string;
  bg: string;
  ring: string;
  description: string;
}

export function computeRiskScore(analysis: {
  risks: { severity: string }[];
  deadlines: { isHard: boolean }[];
  overallConfidence: "high" | "medium" | "low";
}): number {
  let score = 0;
  for (const risk of analysis.risks) {
    if (risk.severity === "high") score += 22;
    else if (risk.severity === "medium") score += 10;
    else score += 4;
  }
  for (const dl of analysis.deadlines) {
    if (dl.isHard) score += 7;
  }
  if (analysis.overallConfidence === "low") score += 10;
  else if (analysis.overallConfidence === "medium") score += 3;
  return Math.min(100, score);
}

export function getRiskScoreResult(score: number): RiskScoreResult {
  if (score <= 20) {
    return {
      score,
      label: "Low Risk",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40",
      ring: "ring-emerald-400/40",
      description: "Looks relatively safe. Review deadlines and sign with confidence.",
    };
  }
  if (score <= 45) {
    return {
      score,
      label: "Moderate Risk",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40",
      ring: "ring-amber-400/40",
      description: "Some items need attention. Read the Risks & Deadlines tabs carefully.",
    };
  }
  if (score <= 70) {
    return {
      score,
      label: "High Risk",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/40",
      ring: "ring-orange-400/40",
      description: "Several serious concerns. Consider negotiating or getting advice.",
    };
  }
  return {
    score,
    label: "Critical Risk",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/40",
    ring: "ring-red-400/40",
    description: "Major concerns detected. Consider consulting a qualified professional.",
  };
}
