/**
 * Roadmap Item Utilities
 *
 * Pure utility functions for working with roadmap items and their cycle items.
 * Extracted from stores and components for better testability and reusability.
 */

import type { CycleItem } from "@headnorth/types";

/**
 * Get cycle items for a specific cycle from a roadmap item
 * @param roadmapItem - Roadmap item containing cycle items
 * @param cycleId - Cycle ID to filter by (can be string or number)
 * @returns Array of cycle items belonging to the specified cycle
 */
export function getCycleItemsForCycle(
  roadmapItem: { cycleItems?: readonly CycleItem[] | CycleItem[] },
  cycleId: string | number,
): readonly CycleItem[] {
  if (!roadmapItem?.cycleItems || roadmapItem.cycleItems.length === 0) {
    return [];
  }

  // Filter cycle items that belong to this cycle
  // Use == for type coercion to handle string/number mismatches
  const filtered = roadmapItem.cycleItems.filter(
    (cycleItem: CycleItem) => cycleItem.cycle && cycleItem.cycle.id == cycleId,
  );

  // Return as readonly array to maintain immutability
  return filtered as readonly CycleItem[];
}
