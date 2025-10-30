/**
 * Filter - Core filtering system for NestedCycleData
 *
 * This class provides a single, composable filtering system that replaces
 * the fragmented filtering approach. All filters are applied at the
 * ReleaseItem level and cascade up through the hierarchy.
 */

import type {
  FilterCriteria,
  NestedCycleData,
  FilterResult,
  InitiativeWithProgress,
} from "../../types/ui-types";
import type { ReleaseItem } from "@omega/types";
import type {
  AreaId,
  InitiativeId,
  StageId,
  PersonId,
  CycleId,
  RoadmapItem,
} from "@omega/types";

/**
 * Filter class for applying filters to NestedCycleData
 *
 * The filter works by:
 * 1. Applying filters at the ReleaseItem level (lowest level)
 * 2. Cascading results up through RoadmapItem -> Initiative
 * 3. Removing empty containers at each level
 */
export class Filter {
  /**
   * Apply filters to NestedCycleData structure
   *
   * @param data - The nested cycle data to filter
   * @param criteria - Filter criteria to apply
   * @returns FilterResult with filtered data and metadata
   */
  apply(data: NestedCycleData, criteria: FilterCriteria): FilterResult {
    if (!data?.initiatives) {
      return {
        data: { initiatives: [] },
        appliedFilters: criteria,
        totalInitiatives: 0,
        totalRoadmapItems: 0,
        totalReleaseItems: 0,
      };
    }

    // Count original data for metadata
    // const originalCounts = this.countData(data);

    // Filter initiatives, which will cascade down to roadmap items and release items
    const filteredInitiatives = data.initiatives
      .map((initiative) => this.filterInitiative(initiative, criteria))
      .filter((initiative) => initiative.roadmapItems.length > 0);

    const filteredData: NestedCycleData = {
      initiatives: filteredInitiatives,
    };

    // Count filtered data for metadata
    const filteredCounts = this.countData(filteredData);

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
  private filterInitiative(
    initiative: InitiativeWithProgress,
    criteria: FilterCriteria,
  ): InitiativeWithProgress {
    // Check if this initiative matches the initiative filter
    if (criteria.initiatives && criteria.initiatives.length > 0) {
      if (!criteria.initiatives.includes(initiative.id)) {
        // Return empty initiative if it doesn't match the filter
        return {
          ...initiative,
          roadmapItems: [],
        };
      }
    }

    // Filter roadmap items within this initiative
    const filteredRoadmapItems = initiative.roadmapItems
      .map((roadmapItem) => this.filterRoadmapItem(roadmapItem, criteria))
      .filter((roadmapItem) => {
        // Keep roadmap items that either:
        // 1. Have matching release items, OR
        // 2. Match the area filter directly (even if no release items match)
        const hasMatchingReleaseItems = roadmapItem.releaseItems.length > 0;
        const matchesAreaDirectly =
          criteria.area &&
          criteria.area !== "all" &&
          this.roadmapItemMatchesArea(roadmapItem, criteria.area);
        return hasMatchingReleaseItems || matchesAreaDirectly;
      });

    // If area filter is applied and no roadmap items match, hide the entire initiative
    if (
      criteria.area &&
      criteria.area !== "all" &&
      filteredRoadmapItems.length === 0
    ) {
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
  private filterRoadmapItem(
    roadmapItem: RoadmapItem,
    criteria: FilterCriteria,
  ): RoadmapItem {
    // Filter release items within this roadmap item
    const filteredReleaseItems = roadmapItem.releaseItems.filter(
      (releaseItem) => this.matchesAllCriteria(releaseItem, criteria),
    );

    // Check if roadmap item should be included based on area filter
    const shouldIncludeRoadmapItem = this.shouldIncludeRoadmapItem(
      roadmapItem,
      filteredReleaseItems,
      criteria,
    );

    // Check validation filter for roadmap items
    if (criteria.showValidationErrors) {
      const hasRoadmapValidationErrors = roadmapItem.validations?.length > 0;
      const hasReleaseItemValidationErrors = filteredReleaseItems.some(
        (item) => item.validations?.length > 0,
      );

      if (!hasRoadmapValidationErrors && !hasReleaseItemValidationErrors) {
        return {
          ...roadmapItem,
          releaseItems: [],
        };
      }
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
  private shouldIncludeRoadmapItem(
    roadmapItem: RoadmapItem,
    filteredReleaseItems: ReleaseItem[],
    criteria: FilterCriteria,
  ): boolean {
    // If no area filter is applied, include the roadmap item
    if (!criteria.area || criteria.area === "all") {
      return true;
    }

    // Rule 1: Include if there are matching release items
    if (filteredReleaseItems.length > 0) {
      return true;
    }

    // Rule 2: Include if the roadmap item itself matches the area filter
    if (this.roadmapItemMatchesArea(roadmapItem, criteria.area)) {
      return true;
    }

    // Rule 3: Exclude if neither release items nor roadmap item match
    return false;
  }

  /**
   * Check if a roadmap item matches the area filter directly
   */
  private roadmapItemMatchesArea(
    roadmapItem: RoadmapItem,
    area: AreaId,
  ): boolean {
    if (!roadmapItem.area) return false;

    // Handle string area
    if (typeof roadmapItem.area === "string") {
      return roadmapItem.area === area;
    }

    // Handle Area object
    if (typeof roadmapItem.area === "object" && "name" in roadmapItem.area) {
      return roadmapItem.area.name === area;
    }

    return false;
  }

  /**
   * Check if a release item matches all filter criteria
   */
  private matchesAllCriteria(
    releaseItem: ReleaseItem,
    criteria: FilterCriteria,
  ): boolean {
    // Area filter
    if (criteria.area && criteria.area !== "all") {
      if (!this.matchesArea(releaseItem, criteria.area)) return false;
    }

    // Stage filter
    if (criteria.stages && criteria.stages.length > 0) {
      if (!this.matchesStages(releaseItem, criteria.stages)) return false;
    }

    // Assignee filter
    if (criteria.assignees && criteria.assignees.length > 0) {
      if (!this.matchesAssignees(releaseItem, criteria.assignees)) return false;
    }

    // Cycle filter
    if (criteria.cycle && criteria.cycle !== "all") {
      if (!this.matchesCycle(releaseItem, criteria.cycle)) return false;
    }

    // Validation filter - show only items with validation errors
    if (criteria.showValidationErrors) {
      const hasErrors = releaseItem.validations?.length > 0;
      if (!hasErrors) return false;
    }

    // Initiative filter is handled at the initiative level
    // since we need to check the initiative ID from the parent context
    return true;
  }

  /**
   * Check if release item matches area filter
   */
  private matchesArea(releaseItem: ReleaseItem, area: AreaId): boolean {
    // Check areaIds array (primary field for release items)
    if (releaseItem.areaIds && Array.isArray(releaseItem.areaIds)) {
      return releaseItem.areaIds.includes(area);
    }

    // Fallback to area field if areaIds doesn't exist
    if (!releaseItem.area) return false;

    // Handle string area
    if (typeof releaseItem.area === "string") {
      return releaseItem.area === area;
    }

    // Handle Area object
    if (typeof releaseItem.area === "object" && "id" in releaseItem.area) {
      return releaseItem.area.id === area;
    }

    return false;
  }

  /**
   * Check if release item matches stage filter
   */
  private matchesStages(
    releaseItem: ReleaseItem,
    stages: readonly StageId[],
  ): boolean {
    if (!releaseItem.stage) return false;
    return stages.includes(releaseItem.stage as StageId);
  }

  /**
   * Check if release item matches assignee filter
   */
  private matchesAssignees(
    releaseItem: ReleaseItem,
    assignees: readonly PersonId[],
  ): boolean {
    if (!releaseItem.assignee) {
      return false;
    }

    // Handle Person object - check for both 'id' and 'accountId' fields
    if (typeof releaseItem.assignee === "object") {
      let assigneeId: string | undefined;

      // Try 'id' field first (current data structure)
      if (
        "id" in releaseItem.assignee &&
        typeof releaseItem.assignee.id === "string"
      ) {
        assigneeId = releaseItem.assignee.id;
      }
      // Fallback to 'accountId' field (legacy data structure)
      else if (
        "accountId" in releaseItem.assignee &&
        typeof releaseItem.assignee.accountId === "string"
      ) {
        assigneeId = releaseItem.assignee.accountId;
      }

      if (assigneeId) {
        return assignees.includes(assigneeId);
      }
    }

    return false;
  }

  /**
   * Check if release item matches cycle filter
   */
  private matchesCycle(releaseItem: ReleaseItem, cycle: CycleId): boolean {
    if (!releaseItem.cycleId) return false;
    return releaseItem.cycleId === cycle;
  }

  /**
   * Check if initiative matches initiative filter
   */
  private matchesInitiatives(
    initiative: InitiativeWithProgress,
    initiatives: readonly InitiativeId[],
  ): boolean {
    return initiatives.includes(initiative.id);
  }

  /**
   * Count data items for metadata
   */
  private countData(data: NestedCycleData): {
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
  applyInitiativeFilter(
    data: NestedCycleData,
    initiatives: InitiativeId[],
  ): NestedCycleData {
    if (!initiatives || initiatives.length === 0) {
      return data;
    }

    const filteredInitiatives = data.initiatives.filter((initiative) =>
      this.matchesInitiatives(initiative, initiatives),
    );

    return {
      ...data,
      initiatives: filteredInitiatives,
    };
  }
}

// Export singleton instance
export const filter = new Filter();
