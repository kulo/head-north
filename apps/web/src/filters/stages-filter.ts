/**
 * Stages filtering utilities
 * Filters items by selected stages
 */

import type { RoadmapItem, ReleaseItem, Initiative, Stage } from "@omega/types";
import type { StageFilter } from "@omega/ui";

interface Item {
  roadmapItems?: RoadmapItem[];
  initiatives?: Initiative[];
}

/**
 * Filter items by selected stages
 *
 * @param items - Array of items to filter
 * @param selectedStages - Array of selected stages
 * @returns Filtered items
 */
export const filterByStages = (
  items: Item[],
  selectedStages: StageFilter[],
): Item[] => {
  if (!selectedStages || selectedStages.length === 0) {
    return items;
  }

  // Check if "All" is selected
  const isAllSelected = selectedStages.some(
    (stage) => stage && (stage.id === "all" || stage.name === "all"),
  );

  if (isAllSelected) {
    return items;
  }

  // Filter by selected stage IDs
  const selectedStageIds = selectedStages
    .filter((stage) => stage && stage.id)
    .map((stage) => stage.id)
    .filter((id) => id !== "all");

  return items
    .map((item) => {
      // Handle different data structures
      const roadmapItems =
        item.roadmapItems ||
        item.initiatives?.flatMap((init) => init.roadmapItems) ||
        [];

      const filteredRoadmapItems = roadmapItems
        .map((roadmapItem) => {
          // Only filter release items by stage - roadmap items don't have stages
          const filteredReleaseItems = roadmapItem.releaseItems
            ? roadmapItem.releaseItems.filter((releaseItem) => {
                // Check if release item stage matches any selected stage
                if (
                  releaseItem.stage &&
                  selectedStageIds.includes(releaseItem.stage)
                ) {
                  return true;
                }

                return false;
              })
            : [];

          // Only keep roadmap items that have matching release items after stage filtering
          if (filteredReleaseItems.length > 0) {
            return { ...roadmapItem, releaseItems: filteredReleaseItems };
          }

          return null;
        })
        .filter((item) => item !== null);

      // Return filtered item with appropriate structure
      if (item.roadmapItems) {
        // Roadmap structure
        return { ...item, roadmapItems: filteredRoadmapItems };
      } else if (item.initiatives) {
        // Cycle-overview structure
        return {
          ...item,
          initiatives: item.initiatives
            .map((initiative) => ({
              ...initiative,
              roadmapItems: filteredRoadmapItems.filter((roadmapItem) =>
                initiative.roadmapItems.some(
                  (orig) => orig.id === roadmapItem.id,
                ),
              ),
            }))
            .filter((initiative) => initiative.roadmapItems.length > 0),
        };
      }

      return item;
    })
    .filter((item) => {
      // Remove items with no matching roadmap items
      if (item.roadmapItems) {
        return item.roadmapItems.length > 0;
      } else if (item.initiatives) {
        return item.initiatives.length > 0;
      }
      return true;
    });
};

export default filterByStages;
