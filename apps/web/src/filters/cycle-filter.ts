/**
 * Cycle filtering utilities
 * Filters items by cycle (case-insensitive)
 * Works with both roadmap and cycle-overview data structures
 */

import type { RoadmapItem, Initiative, CycleId } from "@omega/types";
import type { CycleFilter } from "../types";

interface Item {
  roadmapItems?: RoadmapItem[];
  initiatives?: Initiative[];
}

/**
 * Filter items by cycle
 * Works with both roadmap and cycle-overview data structures
 *
 * @param items - Array of items to filter
 * @param selectedCycle - Selected cycle ID or cycle object to filter by
 * @returns Filtered items
 */
export const filterByCycle = (
  items: Item[],
  selectedCycle: CycleId | CycleFilter,
): Item[] => {
  if (selectedCycle === null || selectedCycle === undefined) {
    console.error(
      "filterByCycle: No cycle provided. Client code must ensure a valid cycle is passed.",
    );
    return [];
  }

  // Extract cycle ID from cycle object or use the value directly
  const cycleId =
    typeof selectedCycle === "object" ? selectedCycle.id : selectedCycle;

  if (!cycleId || cycleId === "all" || cycleId === "") {
    console.error(
      "filterByCycle: Invalid cycle ID provided. Client code must ensure a valid cycle ID is passed.",
    );
    return [];
  }

  // Handle null or invalid data
  if (!items || !Array.isArray(items)) {
    console.error(
      "filterByCycle: Invalid items data provided. Expected an array.",
    );
    return [];
  }

  // Filter initiatives by cycle - check if any roadmap items have release items in the selected cycle
  const filteredItems = items.filter((item) => {
    if (!item.roadmapItems || !Array.isArray(item.roadmapItems)) {
      return false;
    }

    // Check if any roadmap item has release items in the selected cycle
    const hasMatchingCycle = item.roadmapItems.some((roadmapItem) => {
      if (
        !roadmapItem.releaseItems ||
        !Array.isArray(roadmapItem.releaseItems)
      ) {
        return false;
      }

      // Check if any release item belongs to the selected cycle
      return roadmapItem.releaseItems.some((releaseItem) => {
        // Handle both cycle object and cycleId cases
        if (releaseItem.cycle) {
          const releaseCycleId = releaseItem.cycle.id || releaseItem.cycleId;
          const releaseCycleName = releaseItem.cycle.name;
          return releaseCycleId === cycleId || releaseCycleName === cycleId;
        } else if (releaseItem.cycleId) {
          return releaseItem.cycleId === cycleId;
        }
        return false;
      });
    });

    return hasMatchingCycle;
  });

  return filteredItems;
};

export default filterByCycle;
