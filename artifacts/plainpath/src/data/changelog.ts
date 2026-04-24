export interface ChangelogEntry {
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "Apr 2025",
    title: "Clause Extractor & Annual billing",
    items: [
      "New: Clause Extractor — pull specific clause types from any document",
      "New: Compare Versions — diff two document versions side by side",
      "Annual billing now available — save 20% vs monthly",
      "30-day money-back guarantee added to all plans",
    ],
  },
  {
    date: "Mar 2025",
    title: "Pro plan & billing",
    items: [
      "Starter and Pro plans now live with Stripe billing",
      "Subscription management portal — view plan, cancel anytime",
    ],
  },
  {
    date: "Feb 2025",
    title: "Contract Builder & Review",
    items: [
      "New: Build contracts from templates — employment, NDA, freelance",
      "New: Contract Review — line-by-line risk and red-flag analysis",
      "Document history and saved analyses",
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
