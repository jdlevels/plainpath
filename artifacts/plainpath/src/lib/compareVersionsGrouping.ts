// ─── Compare Versions — Group Zone Computation (Slice 4) ──────────────────────
// Computes union-rect group zones from individual diff item rects.
// Zones are computed per-pane (original | revised).
// Overlapping rects on the same page are merged iteratively until stable.
// ──────────────────────────────────────────────────────────────────────────────

import type {
  CVDiffItem,
  CVDiffRect,
  CVDiffSeverity,
  CVDiffChangeType,
  CVGroupZone,
} from "./compareVersionsTypes"

// Skip rects that cover essentially the entire page — not useful as overlays
const FULL_PAGE_X = 0.01
const FULL_PAGE_Y = 0.01
const FULL_PAGE_W = 0.98
const FULL_PAGE_H = 0.98

function isFullPage(r: CVDiffRect): boolean {
  return r.x < FULL_PAGE_X && r.y < FULL_PAGE_Y && r.w > FULL_PAGE_W && r.h > FULL_PAGE_H
}

function rectsOverlap(a: CVDiffRect, b: CVDiffRect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

function unionRect(a: CVDiffRect, b: CVDiffRect): CVDiffRect {
  const x1 = Math.min(a.x, b.x)
  const y1 = Math.min(a.y, b.y)
  const x2 = Math.max(a.x + a.w, b.x + b.w)
  const y2 = Math.max(a.y + a.h, b.y + b.h)
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

const SEV_ORDER: CVDiffSeverity[] = ["high", "medium", "low"]

function higherSeverity(a: CVDiffSeverity, b: CVDiffSeverity): CVDiffSeverity {
  return SEV_ORDER.indexOf(a) <= SEV_ORDER.indexOf(b) ? a : b
}

function isAddedType(ct: CVDiffChangeType): boolean {
  return ct === "text_added" || ct === "added_page"
}

function isRemovedType(ct: CVDiffChangeType): boolean {
  return ct === "text_removed" || ct === "removed_page"
}

interface RawZone {
  rect: CVDiffRect
  page: number
  itemIds: string[]
  highestSeverity: CVDiffSeverity
  containsAdded: boolean
  containsRemoved: boolean
}

/**
 * Compute group zones for one pane.
 * Each diff item with a non-null, non-full-page rect on this pane
 * becomes a candidate. Candidates on the same page whose rects overlap
 * are iteratively merged into union rects until no more overlaps remain.
 */
export function computeGroupZones(
  items: CVDiffItem[],
  pane: "original" | "revised",
): CVGroupZone[] {
  // Build initial single-item zones
  const zones: RawZone[] = []

  for (const item of items) {
    const rect = pane === "original" ? item.rect_original : item.rect_revised
    const page = pane === "original" ? item.page_original : item.page_revised
    if (!rect || page == null) continue
    if (isFullPage(rect)) continue
    zones.push({
      rect,
      page,
      itemIds: [item.id],
      highestSeverity: item.severity,
      containsAdded: isAddedType(item.change_type),
      containsRemoved: isRemovedType(item.change_type),
    })
  }

  // Iterative union-rect merging within the same page
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        if (zones[i].page !== zones[j].page) continue
        if (rectsOverlap(zones[i].rect, zones[j].rect)) {
          // Merge j into i
          zones[i].rect = unionRect(zones[i].rect, zones[j].rect)
          zones[i].itemIds = [...zones[i].itemIds, ...zones[j].itemIds]
          zones[i].highestSeverity = higherSeverity(
            zones[i].highestSeverity,
            zones[j].highestSeverity,
          )
          zones[i].containsAdded = zones[i].containsAdded || zones[j].containsAdded
          zones[i].containsRemoved = zones[i].containsRemoved || zones[j].containsRemoved
          zones.splice(j, 1)
          j--
          changed = true
        }
      }
    }
  }

  // Convert to CVGroupZone with stable IDs
  return zones.map((z) => {
    const sortedIds = [...z.itemIds].sort()
    return {
      id: `grp-${pane}-${sortedIds.join("~")}`,
      pane,
      page: z.page,
      rect: z.rect,
      itemIds: z.itemIds,
      highestSeverity: z.highestSeverity,
      containsAdded: z.containsAdded,
      containsRemoved: z.containsRemoved,
    }
  })
}

/** Return all group zones that contain at least one of the given item IDs */
export function groupsForItems(
  zones: CVGroupZone[],
  itemIds: Set<string>,
): CVGroupZone[] {
  return zones.filter((z) => z.itemIds.some((id) => itemIds.has(id)))
}
