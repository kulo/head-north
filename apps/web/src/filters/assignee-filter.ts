/**
 * Assignee filtering utilities
 * Filters items by selected assignees
 */

import type { RoadmapItem, Initiative } from "@omega/types";
import type { AssigneeFilter } from "../types";

interface Item {
  roadmapItems?: RoadmapItem[];
  initiatives?: Initiative[];
}

/**
 * Filter items by selected assignees
 *
 * @param items - Array of items to filter
 * @param selectedAssignees - Array of selected assignees
 * @returns Filtered items
 */
export const filterByAssignees = (
  items: Item[],
  selectedAssignees: AssigneeFilter[],
): Item[] => {
  if (!selectedAssignees || selectedAssignees.length === 0) {
    return items;
  }

  // Check if "All" is selected
  const isAllSelected = selectedAssignees.some(
    (assignee) =>
      assignee && (assignee.id === "all" || assignee.name === "all"),
  );

  if (isAllSelected) {
    return items;
  }

  // Filter by selected assignee IDs
  const selectedAssigneeIds = selectedAssignees
    .filter((assignee) => assignee && assignee.id)
    .map((assignee) => String(assignee.id));

  return items
    .map((item) => {
      // Handle different data structures
      const roadmapItems =
        item.roadmapItems ||
        item.initiatives?.flatMap((init) => init.roadmapItems) ||
        [];

      const filteredRoadmapItems = roadmapItems
        .map((roadmapItem) => {
          // Filter release items by assignee
          const filteredReleaseItems = roadmapItem.releaseItems
            ? roadmapItem.releaseItems.filter((releaseItem) => {
                // Check if release item assignee matches any selected assignee
                if (releaseItem.assignee) {
                  const assigneeId =
                    typeof releaseItem.assignee === "object" &&
                    "accountId" in releaseItem.assignee
                      ? releaseItem.assignee.accountId
                      : (releaseItem.assignee as any).id;
                  if (
                    assigneeId &&
                    selectedAssigneeIds.includes(String(assigneeId))
                  ) {
                    return true;
                  }
                }

                return false;
              })
            : [];

          // Only keep roadmap items that have matching release items after assignee filtering
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

export default filterByAssignees;
