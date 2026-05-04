export interface ChangelogEntry {
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "May 2026",
    title: "PlainPath launch-ready cleanup",
    items: [
      "PlainPath now focuses on two core tools: Analyze a Document and Contract Review",
      "PlainPath Pro includes both tools and saved analysis history",
      "Results now include clearer risk scores, deadlines, required documents, source sections, and action steps",
      "Billing simplified to one plan: PlainPath Pro at $19.99/month",
      "Removed legacy tools and old plan references from the launch experience",
    ],
  },
  {
    date: "April 2026",
    title: "Analyze + Contract Review polish",
    items: [
      "Improved document results layout with labeled sections and structured cards",
      "Added clearer risk and deadline summaries with severity grouping",
      "Added source-backed section breakdowns with inline evidence",
      "Improved save, export, and results navigation actions",
    ],
  },
]

const SEEN_KEY = "pp-changelog-seen"

export function hasUnseenChanges(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== CHANGELOG[0].date
  } catch {
    return false
  }
}

export function markChangelogSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, CHANGELOG[0].date)
  } catch {}
}
