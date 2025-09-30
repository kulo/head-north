/**
 * Stages filtering utilities
 * Filters items by selected stages
 */

import type { RoadmapItem, Initiative } from "@omega/types";
import type { StageFilter } from "../types";

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
  selectedStages: (StageFilter | string)[],
): Item[] => {
  if (!selectedStages || selectedStages.length === 0) {
    return items;
  }

  // Check if "All" is selected - handle both object and string formats
  const isAllSelected = selectedStages.some((stage) => {
    if (typeof stage === "string") {
      return stage === "all";
    }
    return (
      stage &&
      (stage.id === "all" ||
        stage.name === "all" ||
        stage.name === "All Stages")
    );
  });

  if (isAllSelected) {
    return items;
  }

  // Filter by selected stage IDs - handle both string and object formats
  const selectedStageIds = selectedStages
    .map((stage) => {
      if (typeof stage === "string") {
        return stage;
      }
      return stage && stage.id ? stage.id : null;
    })
    .filter((id) => id && id !== "all");

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
