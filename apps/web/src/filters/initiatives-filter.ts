/**
 * Initiatives filtering utilities
 * Filters items by selected initiatives
 */

import type { Initiative } from "@omega/types";
import type { InitiativeFilter } from "../types";

interface Item {
  initiativeId?: string;
  name?: string;
  initiatives?: Initiative[];
  roadmapItems?: any[];
}

/**
 * Filter items by selected initiatives
 *
 * @param items - Array of items to filter
 * @param selectedInitiatives - Array of selected initiatives
 * @returns Filtered items
 */
export const filterByInitiatives = (
  items: Item[],
  selectedInitiatives: (InitiativeFilter | string)[],
): Item[] => {
  if (!selectedInitiatives || selectedInitiatives.length === 0) {
    return items;
  }

  // Check if "All" is selected - handle both object and string formats
  const isAllSelected = selectedInitiatives.some((init) => {
    if (typeof init === "string") {
      return init === "all";
    }
    return (
      init &&
      (init.id === "all" ||
        init.name === "all" ||
        init.name === "All Initiatives")
    );
  });

  if (isAllSelected) {
    return items;
  }

  // Filter by selected initiative IDs - handle both string and object formats
  const selectedInitiativeIds = selectedInitiatives
    .map((init) => {
      if (typeof init === "string") {
        return init;
      }
      return init && init.id ? String(init.id) : null;
    })
    .filter((id) => id && id !== "all");

  const filteredItems = items.filter((item) => {
    if (item.initiativeId) {
      // Roadmap structure
      const matches = selectedInitiativeIds.includes(String(item.initiativeId));
      return matches;
    } else if (item.initiatives) {
      // Cycle-overview structure - filter initiatives within the item
      const filteredInitiatives = item.initiatives.filter((initiative) =>
        selectedInitiativeIds.includes(String(initiative.initiativeId)),
      );
      const matches = filteredInitiatives.length > 0;
      return matches;
    } else if (item.name && item.roadmapItems) {
      // Transformed initiative structure - filter by initiativeId
      const matches = selectedInitiativeIds.includes(String(item.initiativeId));
      return matches;
    }
    return true;
  });

  return filteredItems;
};

export default filterByInitiatives;
