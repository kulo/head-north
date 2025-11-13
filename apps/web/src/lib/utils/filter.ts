/**
 * Filter - Core filtering system for NestedCycleData
 *
 * Pure functional filtering system that replaces class-based approach.
 * All filters are applied at the ReleaseItem level and cascade up through
 * the hierarchy using functional composition.
 */

import { Maybe } from "purify-ts";
import type {
  FilterCriteria,
  NestedCycleData,
  FilterResult,
  InitiativeWithProgress,
} from "../../types/ui-types";
import type { ReleaseItem } from "@headnorth/types";
import type {
  AreaId,
  InitiativeId,
  StageId,
  PersonId,
  CycleId,
  RoadmapItem,
} from "@headnorth/types";

/**
 * Pure filtering functions for NestedCycleData
 *
 * The filter works by:
 * 1. Applying filters at the ReleaseItem level (lowest level)
 * 2. Cascading results up through RoadmapItem -> Initiative
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
  if (!data?.initiatives) {
    return {
      data: { initiatives: [] },
      appliedFilters: criteria,
      totalInitiatives: 0,
      totalRoadmapItems: 0,
      totalReleaseItems: 0,
    };
  }

  // Filter initiatives, which will cascade down to roadmap items and release items
  const filteredInitiatives = data.initiatives
    .map((initiative) => filterInitiative(initiative, criteria))
    .filter((initiative) => initiative.roadmapItems.length > 0);

  const filteredData: NestedCycleData = {
    initiatives: filteredInitiatives,
  };

  // Count filtered data for metadata
  const filteredCounts = countData(filteredData);

  return {
    data: filteredData,
    appliedFilters: criteria,
    totalInitiatives: filteredCounts.initiatives,
    totalRoadmapItems: filteredCounts.roadmapItems,
    totalReleaseItems: filteredCounts.releaseItems,
  };
}

/**
 * Filter a single initiative and its nested data
 */
function filterInitiative(
  initiative: InitiativeWithProgress,
  criteria: FilterCriteria,
): InitiativeWithProgress {
  // Check if this initiative matches the initiative filter using Maybe
  // Empty array means "no filter" - treat same as undefined/null
  const initiativeMatches = Maybe.fromNullable(criteria.initiatives)
    .filter((initiatives) => initiatives.length > 0) // Only apply filter if array has items
    .map((initiatives) => initiatives.includes(initiative.id))
    .orDefault(true); // If empty array or undefined, include all (no filter)

  if (!initiativeMatches) {
    // Return empty initiative if it doesn't match the filter
    return {
      ...initiative,
      roadmapItems: [],
    };
  }

  // Filter roadmap items within this initiative
  const filteredRoadmapItems = initiative.roadmapItems
    .map((roadmapItem) => filterRoadmapItem(roadmapItem, criteria))
    .filter((roadmapItem) => {
      // Keep roadmap items that either:
      // 1. Have matching release items, OR
      // 2. Match the area filter directly (even if no release items match)
      const hasMatchingReleaseItems = roadmapItem.releaseItems.length > 0;
      const matchesAreaDirectly = Maybe.fromNullable(criteria.area)
        .filter((area) => area !== "all")
        .map((area) => roadmapItemMatchesArea(roadmapItem, area))
        .orDefault(false);

      return hasMatchingReleaseItems || matchesAreaDirectly;
    });

  // If area filter is applied and no roadmap items match, hide the entire initiative
  const shouldHideInitiative = Maybe.fromNullable(criteria.area)
    .filter((area) => area !== "all")
    .map(() => filteredRoadmapItems.length === 0)
    .orDefault(false);

  if (shouldHideInitiative) {
    return {
      ...initiative,
      roadmapItems: [],
    };
  }

  return {
    ...initiative,
    roadmapItems: filteredRoadmapItems,
  };
}

/**
 * Filter a single roadmap item and its nested release items
 */
function filterRoadmapItem(
  roadmapItem: RoadmapItem,
  criteria: FilterCriteria,
): RoadmapItem {
  // Filter release items within this roadmap item
  const filteredReleaseItems = roadmapItem.releaseItems.filter((releaseItem) =>
    matchesAllCriteria(releaseItem, criteria),
  );

  // Check if roadmap item should be included based on area filter
  const shouldIncludeRoadmapItem = shouldIncludeRoadmapItemCheck(
    roadmapItem,
    filteredReleaseItems,
    criteria,
  );

  // Check validation filter for roadmap items
  const hasValidationErrors = Maybe.fromNullable(criteria.showValidationErrors)
    .map((showErrors) => {
      if (!showErrors) return true;

      const hasRoadmapValidationErrors =
        (roadmapItem.validations?.length || 0) > 0;
      const hasReleaseItemValidationErrors = filteredReleaseItems.some(
        (item) => (item.validations?.length || 0) > 0,
      );

      return hasRoadmapValidationErrors || hasReleaseItemValidationErrors;
    })
    .orDefault(true);

  if (!hasValidationErrors) {
    return {
      ...roadmapItem,
      releaseItems: [],
    };
  }

  // If roadmap item should not be included, return it with empty release items
  if (!shouldIncludeRoadmapItem) {
    return {
      ...roadmapItem,
      releaseItems: [],
    };
  }

  return {
    ...roadmapItem,
    releaseItems: filteredReleaseItems,
  };
}

/**
 * Determine if a roadmap item should be included based on filtering criteria
 */
function shouldIncludeRoadmapItemCheck(
  roadmapItem: RoadmapItem,
  filteredReleaseItems: readonly ReleaseItem[],
  criteria: FilterCriteria,
): boolean {
  // If no area filter is applied, include the roadmap item
  // Use Maybe pattern matching instead of extract() to stay in Maybe context
  return Maybe.fromNullable(criteria.area)
    .filter((area) => area !== "all")
    .map((areaFilter) => {
      // Rule 1: Include if there are matching release items
      if (filteredReleaseItems.length > 0) {
        return true;
      }

      // Rule 2: Include if the roadmap item itself matches the area filter
      if (roadmapItemMatchesArea(roadmapItem, areaFilter)) {
        return true;
      }

      // Rule 3: Exclude if neither release items nor roadmap item match
      return false;
    })
    .orDefault(true); // If no area filter, include by default
}

/**
 * Check if a roadmap item matches the area filter directly
 */
function roadmapItemMatchesArea(
  roadmapItem: RoadmapItem,
  area: AreaId,
): boolean {
  return Maybe.fromNullable(roadmapItem.area)
    .map((areaValue) => {
      // Use pattern matching for type-safe area comparison
      if (typeof areaValue === "string") {
        return areaValue === area;
      }

      // Handle Area object
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
 * Check if a release item matches all filter criteria
 */
function matchesAllCriteria(
  releaseItem: ReleaseItem,
  criteria: FilterCriteria,
): boolean {
  // Area filter - empty string or "all" means no filter
  const areaMatch = Maybe.fromNullable(criteria.area)
    .filter((area) => area !== "all" && area !== "")
    .map((area) => matchesArea(releaseItem, area))
    .orDefault(true);

  if (!areaMatch) return false;

  // Stage filter - empty array means no filter
  const stageMatch = Maybe.fromNullable(criteria.stages)
    .filter((stages) => stages.length > 0)
    .map((stages) => matchesStages(releaseItem, stages))
    .orDefault(true);

  if (!stageMatch) return false;

  // Assignee filter - empty array means no filter
  const assigneeMatch = Maybe.fromNullable(criteria.assignees)
    .filter((assignees) => assignees.length > 0)
    .map((assignees) => matchesAssignees(releaseItem, assignees))
    .orDefault(true);

  if (!assigneeMatch) return false;

  // Cycle filter
  const cycleMatch = Maybe.fromNullable(criteria.cycle)
    .filter((cycle) => cycle !== "all")
    .map((cycle) => matchesCycle(releaseItem, cycle))
    .orDefault(true);

  if (!cycleMatch) return false;

  // Validation filter - show only items with validation errors
  const validationMatch = Maybe.fromNullable(criteria.showValidationErrors)
    .map((showErrors) => {
      if (!showErrors) return true;
      return (releaseItem.validations?.length || 0) > 0;
    })
    .orDefault(true);

  if (!validationMatch) return false;

  return true;
}

/**
 * Check if release item matches area filter
 */
function matchesArea(releaseItem: ReleaseItem, area: AreaId): boolean {
  // Check areaIds array (primary field for release items)
  const areaIdsMatch = Maybe.fromNullable(releaseItem.areaIds)
    .filter(Array.isArray)
    .map((areaIds) => areaIds.includes(area))
    .orDefault(false);

  if (areaIdsMatch) return true;

  // Fallback to area field if areaIds doesn't exist
  return Maybe.fromNullable(releaseItem.area)
    .map((areaValue) => {
      // Handle string area
      if (typeof areaValue === "string") {
        return areaValue === area;
      }

      // Handle Area object
      if (typeof areaValue === "object" && "id" in areaValue) {
        return areaValue.id === area;
      }

      return false;
    })
    .orDefault(false);
}

/**
 * Check if release item matches stage filter
 */
function matchesStages(
  releaseItem: ReleaseItem,
  stages: readonly StageId[],
): boolean {
  return Maybe.fromNullable(releaseItem.stage)
    .map((stage) => stages.includes(stage as StageId))
    .orDefault(false);
}

/**
 * Check if release item matches assignee filter
 */
function matchesAssignees(
  releaseItem: ReleaseItem,
  assignees: readonly PersonId[],
): boolean {
  return Maybe.fromNullable(releaseItem.assignee)
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
 * Check if release item matches cycle filter
 */
function matchesCycle(releaseItem: ReleaseItem, cycle: CycleId): boolean {
  return Maybe.fromNullable(releaseItem.cycleId)
    .map((cycleId) => cycleId === cycle)
    .orDefault(false);
}

/**
 * Check if initiative matches initiative filter
 */
function matchesInitiatives(
  initiative: InitiativeWithProgress,
  initiatives: readonly InitiativeId[],
): boolean {
  return initiatives.includes(initiative.id);
}

/**
 * Count data items for metadata
 */
function countData(data: NestedCycleData): {
  initiatives: number;
  roadmapItems: number;
  releaseItems: number;
} {
  const roadmapItems = data.initiatives.flatMap((init) => init.roadmapItems);
  const releaseItems = roadmapItems.flatMap((item) => item.releaseItems);

  return {
    initiatives: data.initiatives.length,
    roadmapItems: roadmapItems.length,
    releaseItems: releaseItems.length,
  };
}

/**
 * Apply initiative filter at the initiative level
 * This is a special case since initiatives are at the top level
 */
function applyInitiativeFilter(
  data: NestedCycleData,
  initiatives: readonly InitiativeId[],
): NestedCycleData {
  if (!initiatives || initiatives.length === 0) {
    return data;
  }

  const filteredInitiatives = data.initiatives.filter((initiative) =>
    matchesInitiatives(initiative, initiatives),
  );

  return {
    ...data,
    initiatives: filteredInitiatives,
  };
}

// Legacy class wrapper for backward compatibility
export class Filter {
  apply(data: NestedCycleData, criteria: FilterCriteria): FilterResult {
    return applyFilter(data, criteria);
  }

  applyInitiativeFilter(
    data: NestedCycleData,
    initiatives: readonly InitiativeId[],
  ): NestedCycleData {
    return applyInitiativeFilter(data, initiatives);
  }
}

// Export singleton instance for backward compatibility
export const filter = new Filter();

// Export pure functions for direct use
export {
  applyFilter,
  filterInitiative,
  filterRoadmapItem,
  matchesAllCriteria,
  matchesArea,
  matchesStages,
  matchesAssignees,
  matchesCycle,
  matchesInitiatives,
  countData,
  applyInitiativeFilter,
};
