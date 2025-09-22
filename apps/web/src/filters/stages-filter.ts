/**
 * Stages filtering utilities
 * Filters items by selected stages
 */

interface RoadmapItem {
  id: string;
  releaseItems?: ReleaseItem[];
}

interface ReleaseItem {
  stage?: string;
}

interface Initiative {
  initiativeId: string;
  roadmapItems: RoadmapItem[];
}

interface Item {
  roadmapItems?: RoadmapItem[];
  initiatives?: Initiative[];
}

interface Stage {
  id?: string;
  value?: string;
  name?: string;
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
  selectedStages: Stage[],
): Item[] => {
  if (!selectedStages || selectedStages.length === 0) {
    return items;
  }

  // Check if "All" is selected
  const isAllSelected = selectedStages.some(
    (stage) => stage && (stage.id === "all" || stage.value === "all"),
  );

  if (isAllSelected) {
    return items;
  }

  // Filter by selected stage values/IDs
  const selectedStageValues = selectedStages
    .filter((stage) => stage && (stage.value || stage.id || stage.name))
    .map((stage) => stage.value || stage.id || stage.name)
    .filter((value) => value !== "all");

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
                  selectedStageValues.includes(releaseItem.stage)
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
