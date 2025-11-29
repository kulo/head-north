/**
 * Filter - Core filtering system for NestedCycleData
 *
 * Pure functional filtering system that replaces class-based approach.
 * All filters are applied at the CycleItem level and cascade up through
 * the hierarchy using functional composition.
 */

import { Maybe } from "purify-ts";
import type {
  FilterCriteria,
  NestedCycleData,
  FilterResult,
  ObjectiveWithProgress,
} from "../../types/ui-types";
import type { CycleItem } from "@headnorth/types";
import type {
  AreaId,
  ObjectiveId,
  StageId,
  PersonId,
  CycleId,
  RoadmapItem,
} from "@headnorth/types";

/**
 * Pure filtering functions for NestedCycleData
 *
 * The filter works by:
 * 1. Applying filters at the CycleItem level (lowest level)
 * 2. Cascading results up through RoadmapItem -> Objective
 * 3. Removing empty containers at each level
 */

/**
 * Apply filters to NestedCycleData structure
 *
 * @param data - The nested cycle data to filter
 * @param criteria - Filter criteria to apply
 * @returns FilterResult with filtered data and metadata
 */
function applyFilter(
  data: NestedCycleData,
  criteria: FilterCriteria,
): FilterResult {
  if (!data?.objectives) {
    return {
      data: { objectives: [] },
      appliedFilters: criteria,
      totalObjectives: 0,
      totalRoadmapItems: 0,
      totalCycleItems: 0,
    };
  }

  // Filter objectives, which will cascade down to roadmap items and cycle items
  const filteredObjectives = data.objectives
    .map((objective) => filterObjective(objective, criteria))
    .filter((objective) => (objective.roadmapItems?.length ?? 0) > 0);

  const filteredData: NestedCycleData = {
    objectives: filteredObjectives,
  };

  // Count filtered data for metadata
  const filteredCounts = countData(filteredData);

  return {
    data: filteredData,
    appliedFilters: criteria,
    totalObjectives: filteredCounts.objectives,
    totalRoadmapItems: filteredCounts.roadmapItems,
    totalCycleItems: filteredCounts.cycleItems,
  };
}

/**
 * Filter a single objective and its nested data
 */
function filterObjective(
  objective: ObjectiveWithProgress,
  criteria: FilterCriteria,
): ObjectiveWithProgress {
  // Check if this objective matches the objective filter using Maybe
  // Empty array means "no filter" - treat same as undefined/null
  const objectiveMatches = Maybe.fromNullable(criteria.objectives)
    .filter((objectives) => objectives.length > 0) // Only apply filter if array has items
    .map((objectives) => objectives.includes(objective.id))
    .orDefault(true); // If empty array or undefined, include all (no filter)

  if (!objectiveMatches) {
    // Return empty objective if it doesn't match the filter
    return {
      ...objective,
      roadmapItems: [],
    };
  }

  // Filter roadmap items within this objective
  const filteredRoadmapItems = (objective.roadmapItems ?? [])
    .map((roadmapItem) => filterRoadmapItem(roadmapItem, criteria))
    .filter((roadmapItem) => {
      // Keep roadmap items that either:
      // 1. Have matching cycle items, OR
      // 2. Match the product area filter directly (even if no cycle items match)
      const hasMatchingCycleItems = (roadmapItem.cycleItems?.length ?? 0) > 0;
      const matchesAreaDirectly = Maybe.fromNullable(criteria.area)
        .filter((area) => area !== "all")
        .map((area) => roadmapItemMatchesArea(roadmapItem, area))
        .orDefault(false);

      return hasMatchingCycleItems || matchesAreaDirectly;
    });

  // If product area filter is applied and no roadmap items match, hide the entire objective
  const shouldHideObjective = Maybe.fromNullable(criteria.area)
    .filter((area) => area !== "all")
    .map(() => filteredRoadmapItems.length === 0)
    .orDefault(false);

  if (shouldHideObjective) {
    return {
      ...objective,
      roadmapItems: [],
    };
  }

  return {
    ...objective,
    roadmapItems: filteredRoadmapItems,
  };
}

/**
 * Filter a single roadmap item and its nested cycle items
 */
function filterRoadmapItem(
  roadmapItem: RoadmapItem,
  criteria: FilterCriteria,
): RoadmapItem {
  // Filter cycle items within this roadmap item
  const filteredCycleItems = (roadmapItem.cycleItems ?? []).filter(
    (cycleItem) => matchesAllCriteria(cycleItem, criteria),
  );

  // Check if roadmap item should be included based on product area filter
  const shouldIncludeRoadmapItem = shouldIncludeRoadmapItemCheck(
    roadmapItem,
    filteredCycleItems,
    criteria,
  );

  // Check validation filter for roadmap items
  const hasValidationErrors = Maybe.fromNullable(criteria.showValidationErrors)
    .map((showErrors) => {
      if (!showErrors) return true;

      const hasRoadmapValidationErrors =
        Maybe.fromNullable(roadmapItem.validations)
          .map((vals) => vals.length)
          .orDefault(0) > 0;
      const hasCycleItemValidationErrors = filteredCycleItems.some(
        (item) =>
          Maybe.fromNullable(item.validations)
            .map((vals) => vals.length)
            .orDefault(0) > 0,
      );

      return hasRoadmapValidationErrors || hasCycleItemValidationErrors;
    })
    .orDefault(true);

  if (!hasValidationErrors) {
    return {
      ...roadmapItem,
      cycleItems: [],
    };
  }

  // If roadmap item should not be included, return it with empty cycle items
  if (!shouldIncludeRoadmapItem) {
    return {
      ...roadmapItem,
      cycleItems: [],
    };
  }

  return {
    ...roadmapItem,
    cycleItems: filteredCycleItems,
  };
}

/**
 * Determine if a roadmap item should be included based on filtering criteria
 */
function shouldIncludeRoadmapItemCheck(
  roadmapItem: RoadmapItem,
  filteredCycleItems: readonly CycleItem[],
  criteria: FilterCriteria,
): boolean {
  // If no product area filter is applied, include the roadmap item
  // Use Maybe pattern matching instead of extract() to stay in Maybe context
  return Maybe.fromNullable(criteria.area)
    .filter((area) => area !== "all")
    .map((areaFilter) => {
      // Rule 1: Include if there are matching cycle items
      if (filteredCycleItems.length > 0) {
        return true;
      }

      // Rule 2: Include if the roadmap item itself matches the product area filter
      if (roadmapItemMatchesArea(roadmapItem, areaFilter)) {
        return true;
      }

      // Rule 3: Exclude if neither cycle items nor roadmap item match
      return false;
    })
    .orDefault(true); // If no product area filter, include by default
}

/**
 * Check if a roadmap item matches the product area filter directly
 */
function roadmapItemMatchesArea(
  roadmapItem: RoadmapItem,
  area: AreaId,
): boolean {
  return Maybe.fromNullable(roadmapItem.area)
    .map((areaValue) => {
      // Use pattern matching for type-safe product area comparison
      if (typeof areaValue === "string") {
        return areaValue === area;
      }

      // Handle Product Area object
      if (
        typeof areaValue === "object" &&
        areaValue !== null &&
        "name" in areaValue
      ) {
        return (areaValue as { name: string }).name === area;
      }

      return false;
    })
    .orDefault(false);
}

/**
 * Check if a cycle item matches all filter criteria
 */
function matchesAllCriteria(
  cycleItem: CycleItem,
  criteria: FilterCriteria,
): boolean {
  // Product area filter - empty string or "all" means no filter
  const areaMatch = Maybe.fromNullable(criteria.area)
    .filter((area) => area !== "all" && area !== "")
    .map((area) => matchesArea(cycleItem, area))
    .orDefault(true);

  if (!areaMatch) return false;

  // Release stage filter - empty array means no filter
  const stageMatch = Maybe.fromNullable(criteria.stages)
    .filter((stages) => stages.length > 0)
    .map((stages) => matchesStages(cycleItem, stages))
    .orDefault(true);

  if (!stageMatch) return false;

  // Assignee filter - empty array means no filter
  const assigneeMatch = Maybe.fromNullable(criteria.assignees)
    .filter((assignees) => assignees.length > 0)
    .map((assignees) => matchesAssignees(cycleItem, assignees))
    .orDefault(true);

  if (!assigneeMatch) return false;

  // Cycle filter
  const cycleMatch = Maybe.fromNullable(criteria.cycle)
    .filter((cycle) => cycle !== "all")
    .map((cycle) => matchesCycle(cycleItem, cycle))
    .orDefault(true);

  if (!cycleMatch) return false;

  // Validation filter - show only items with validation errors
  const validationMatch = Maybe.fromNullable(criteria.showValidationErrors)
    .map((showErrors) => {
      if (!showErrors) return true;
      return (
        Maybe.fromNullable(cycleItem.validations)
          .map((vals) => vals.length)
          .orDefault(0) > 0
      );
    })
    .orDefault(true);

  if (!validationMatch) return false;

  return true;
}

/**
 * Check if cycle item matches product area filter
 */
function matchesArea(cycleItem: CycleItem, area: AreaId): boolean {
  // Check product area IDs array (primary field for cycle items)
  const areaIdsMatch = Maybe.fromNullable(cycleItem.areaIds)
    .filter(Array.isArray)
    .map((areaIds) => areaIds.includes(area))
    .orDefault(false);

  if (areaIdsMatch) return true;

  // Fallback to product area field if areaIds doesn't exist
  return Maybe.fromNullable(cycleItem.area)
    .map((areaValue) => {
      // Handle string product area
      if (typeof areaValue === "string") {
        return areaValue === area;
      }

      // Handle Product Area object
      if (typeof areaValue === "object" && "id" in areaValue) {
        return areaValue.id === area;
      }

      return false;
    })
    .orDefault(false);
}

/**
 * Check if cycle item matches release stage filter
 */
function matchesStages(
  cycleItem: CycleItem,
  stages: readonly StageId[],
): boolean {
  return Maybe.fromNullable(cycleItem.stage)
    .map((stage) => stages.includes(stage as StageId))
    .orDefault(false);
}

/**
 * Check if cycle item matches assignee filter
 */
function matchesAssignees(
  cycleItem: CycleItem,
  assignees: readonly PersonId[],
): boolean {
  return Maybe.fromNullable(cycleItem.assignee)
    .chain((assignee) => {
      // Handle Person object - check for both 'id' and 'accountId' fields
      if (typeof assignee === "object" && assignee !== null) {
        // Try 'id' field first (current data structure)
        const idField = Maybe.fromNullable(
          "id" in assignee ? assignee.id : undefined,
        ).filter((id): id is string => typeof id === "string");

        // Check if id matches
        const idMatch = idField
          .map((id) => assignees.includes(id))
          .orDefault(false);

        if (idMatch) {
          return Maybe.of(true);
        }

        // Fallback to 'accountId' field (legacy data structure)
        const accountIdField = Maybe.fromNullable(
          "accountId" in assignee
            ? (assignee as { accountId?: string }).accountId
            : undefined,
        ).filter((id): id is string => typeof id === "string");

        // Return Maybe<boolean> - map to boolean result
        return accountIdField.map((id) => assignees.includes(id));
      }

      // Return empty Maybe if not an object
      return Maybe.empty();
    })
    .orDefault(false);
}

/**
 * Check if cycle item matches cycle filter
 */
function matchesCycle(cycleItem: CycleItem, cycle: CycleId): boolean {
  return Maybe.fromNullable(cycleItem.cycleId)
    .map((cycleId) => cycleId === cycle)
    .orDefault(false);
}

/**
 * Check if objective matches objective filter
 */
function matchesObjectives(
  objective: ObjectiveWithProgress,
  objectives: readonly ObjectiveId[],
): boolean {
  return objectives.includes(objective.id);
}

/**
 * Count data items for metadata
 */
function countData(data: NestedCycleData): {
  objectives: number;
  roadmapItems: number;
  cycleItems: number;
} {
  const roadmapItems = data.objectives.flatMap((obj) => obj.roadmapItems ?? []);
  const cycleItems = roadmapItems
    .flatMap((item) => item?.cycleItems ?? [])
    .filter((item): item is NonNullable<typeof item> => item !== undefined);

  return {
    objectives: data.objectives.length,
    roadmapItems: roadmapItems.length,
    cycleItems: cycleItems.length,
  };
}

/**
 * Apply objective filter at the objective level
 * This is a special case since objectives are at the top level
 */
function applyObjectiveFilter(
  data: NestedCycleData,
  objectives: readonly ObjectiveId[],
): NestedCycleData {
  if (!objectives || objectives.length === 0) {
    return data;
  }

  const filteredObjectives = data.objectives.filter((objective) =>
    matchesObjectives(objective, objectives),
  );

  return {
    ...data,
    objectives: filteredObjectives,
  };
}

// Legacy class wrapper for backward compatibility
export class Filter {
  apply(data: NestedCycleData, criteria: FilterCriteria): FilterResult {
    return applyFilter(data, criteria);
  }

  applyObjectiveFilter(
    data: NestedCycleData,
    objectives: readonly ObjectiveId[],
  ): NestedCycleData {
    return applyObjectiveFilter(data, objectives);
  }
}

// Export singleton instance for backward compatibility
export const filter = new Filter();

// Export pure functions for direct use
export {
  applyFilter,
  filterObjective,
  filterRoadmapItem,
  matchesAllCriteria,
  matchesArea,
  matchesStages,
  matchesAssignees,
  matchesCycle,
  matchesObjectives,
  countData,
  applyObjectiveFilter,
};
