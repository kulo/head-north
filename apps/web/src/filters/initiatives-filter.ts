/**
 * Initiatives filtering utilities
 * Filters items by selected initiatives
 */

import type { Initiative } from "@omega/types";
import type { InitiativeFilter } from "@omega/ui";

interface Item {
  initiativeId?: string;
  initiatives?: Initiative[];
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
  selectedInitiatives: InitiativeFilter[],
): Item[] => {
  if (!selectedInitiatives || selectedInitiatives.length === 0) {
    return items;
  }

  // Check if "All" is selected
  const isAllSelected = selectedInitiatives.some(
    (init) => init && (init.id === "all" || init.name === "all"),
  );

  if (isAllSelected) {
    return items;
  }

  // Filter by selected initiative IDs
  const selectedInitiativeIds = selectedInitiatives
    .filter((init) => init && init.id)
    .map((init) => String(init.id))
    .filter((id) => id !== "all");

  return items.filter((item) => {
    if (item.initiativeId) {
      // Roadmap structure
      return selectedInitiativeIds.includes(String(item.initiativeId));
    } else if (item.initiatives) {
      // Cycle-overview structure - filter initiatives within the item
      const filteredInitiatives = item.initiatives.filter((initiative) =>
        selectedInitiativeIds.includes(String(initiative.initiativeId)),
      );
      return filteredInitiatives.length > 0;
    }
    return true;
  });
};

export default filterByInitiatives;
