/**
 * Roadmap Item Utilities
 *
 * Pure utility functions for working with roadmap items and their release items.
 * Extracted from stores and components for better testability and reusability.
 */

import type { ReleaseItem } from "@headnorth/types";

/**
 * Get release items for a specific cycle from a roadmap item
 * @param roadmapItem - Roadmap item containing release items
 * @param cycleId - Cycle ID to filter by (can be string or number)
 * @returns Array of release items belonging to the specified cycle
 */
export function getReleaseItemsForCycle(
  roadmapItem: { releaseItems?: readonly ReleaseItem[] | ReleaseItem[] },
  cycleId: string | number,
): readonly ReleaseItem[] {
  if (!roadmapItem?.releaseItems || roadmapItem.releaseItems.length === 0) {
    return [];
  }

  // Filter release items that belong to this cycle
  // Use == for type coercion to handle string/number mismatches
  const filtered = roadmapItem.releaseItems.filter(
    (releaseItem: ReleaseItem) =>
      releaseItem.cycle && releaseItem.cycle.id == cycleId,
  );

  // Return as readonly array to maintain immutability
  return filtered as readonly ReleaseItem[];
}
