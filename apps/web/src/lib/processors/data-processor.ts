/**
 * DataProcessor - Unified data processing and filtering
 *
 * This class handles the transformation of raw CycleData into NestedCycleData
 * and applies unified filtering. It replaces the fragmented data transformation
 * and filtering logic with a single, consistent approach.
 */

import type { CycleData, InitiativeId, RoadmapItem } from "@omega/types";
import type {
  FilterCriteria,
  InitiativeWithProgress,
  NestedCycleData,
  RoadmapItemWithProgress,
} from "../../types/ui-types";
import { unifiedFilter } from "../filters/unified-filter";
import {
  calculateReleaseItemProgress,
  calculateCycleMetadata,
  aggregateProgressMetrics,
} from "../calculations/cycle-calculations";
import {
  DEFAULT_INITIATIVE,
  DEFAULT_ASSIGNEE,
  getDefaultInitiativeId,
  getDefaultAssigneeName,
} from "../constants/default-values";

/**
 * DataProcessor class for unified data processing
 *
 * Handles:
 * 1. Transformation of raw CycleData to NestedCycleData
 * 2. Application of unified filters
 * 3. Progress calculations and metrics
 */
export class DataProcessor {
  /**
   * Process raw cycle data into nested structure with filtering
   *
   * @param rawData - Raw cycle data from backend
   * @param filters - Filter criteria to apply
   * @returns Processed nested data with filters applied
   */
  processCycleData(
    rawData: CycleData,
    filters: FilterCriteria = {},
  ): NestedCycleData {
    // Transform raw data to nested structure
    const nestedData = this.transformToNestedStructure(rawData);

    // Apply initiative filter first (at initiative level)
    const initiativeFilteredData = this.applyInitiativeFilter(
      nestedData,
      filters.initiatives,
    );

    // Apply all other filters (cascading from release items up)
    const result = unifiedFilter.apply(initiativeFilteredData, filters);

    return result.data;
  }

  /**
   * Transform raw CycleData to NestedCycleData structure
   */
  private transformToNestedStructure(rawData: CycleData): NestedCycleData {
    const { cycles, roadmapItems, releaseItems, initiatives } = rawData;

    // Create initiatives lookup
    const initiativesLookup: Record<string, string> = {};
    if (Array.isArray(initiatives)) {
      initiatives.forEach((init) => {
        initiativesLookup[init.id] = init.name;
      });
    }

    // Group roadmap items by initiative
    const groupedInitiatives: Record<string, InitiativeWithProgress> = {};

    roadmapItems.forEach((item) => {
      const initiativeId = getDefaultInitiativeId(item.initiativeId);

      // Initialize initiative if not exists
      if (!groupedInitiatives[initiativeId]) {
        groupedInitiatives[initiativeId] = {
          id: initiativeId,
          name: initiativesLookup[initiativeId] || DEFAULT_INITIATIVE.NAME,
          roadmapItems: [],
          // Initialize progress metrics
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 0,
          releaseItemsDoneCount: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByReleaseItems: 0,
          percentageNotToDo: 0,
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        };
      }

      // Find release items for this roadmap item
      const itemReleaseItems = releaseItems.filter(
        (ri) => ri.roadmapItemId === item.id,
      );

      // Transform roadmap item with progress metrics
      const roadmapItemMetrics = calculateReleaseItemProgress(itemReleaseItems);

      const roadmapItem: RoadmapItemWithProgress = {
        id: item.id,
        name: item.summary || item.name || `Roadmap Item ${item.id}`,
        summary: item.summary || item.name || `Roadmap Item ${item.id}`,
        labels: item.labels || [],
        area: typeof item.area === "string" ? item.area : item.area?.name || "",
        theme: typeof item.theme === "string" ? item.theme : "",
        url: item.url || `https://example.com/browse/${item.id}`,
        validations: Array.isArray(item.validations) ? item.validations : [],
        startDate: item.startDate,
        endDate: item.endDate,
        releaseItems: itemReleaseItems.map((releaseItem) => ({
          ...releaseItem,
          cycle: releaseItem.cycle || {
            id: releaseItem.cycleId,
            name: this.getCycleName(cycles, releaseItem.cycleId),
          },
        })),
        // Add calculated metrics
        ...roadmapItemMetrics,
        startMonth: "",
        endMonth: "",
        daysFromStartOfCycle: 0,
        daysInCycle: 0,
        currentDayPercentage: 0,
      };

      groupedInitiatives[initiativeId].roadmapItems.push(roadmapItem);

      // Aggregate metrics to initiative level
      const initiative = groupedInitiatives[initiativeId];
      initiative.weeks += roadmapItemMetrics.weeks;
      initiative.weeksDone += roadmapItemMetrics.weeksDone;
      initiative.weeksInProgress += roadmapItemMetrics.weeksInProgress;
      initiative.weeksTodo += roadmapItemMetrics.weeksTodo;
      initiative.weeksNotToDo += roadmapItemMetrics.weeksNotToDo;
      initiative.weeksCancelled += roadmapItemMetrics.weeksCancelled;
      initiative.weeksPostponed += roadmapItemMetrics.weeksPostponed;
      initiative.releaseItemsCount += roadmapItemMetrics.releaseItemsCount;
      initiative.releaseItemsDoneCount +=
        roadmapItemMetrics.releaseItemsDoneCount;
    });

    // Calculate final initiative-level percentages
    Object.values(groupedInitiatives).forEach((initiative) => {
      initiative.progress =
        initiative.weeks > 0
          ? Math.round((initiative.weeksDone / initiative.weeks) * 100)
          : 0;
      initiative.progressWithInProgress =
        initiative.weeks > 0
          ? Math.round(
              ((initiative.weeksDone + initiative.weeksInProgress) /
                initiative.weeks) *
                100,
            )
          : 0;
      initiative.progressByReleaseItems =
        initiative.releaseItemsCount > 0
          ? Math.round(
              (initiative.releaseItemsDoneCount /
                initiative.releaseItemsCount) *
                100,
            )
          : 0;
      initiative.percentageNotToDo =
        initiative.weeks > 0
          ? Math.max(
              0,
              Math.round((initiative.weeksNotToDo / initiative.weeks) * 100),
            )
          : 0;
    });

    // Sort initiatives by weeks (largest first)
    const sortedInitiatives = Object.values(groupedInitiatives).sort(
      (a, b) => b.weeks - a.weeks,
    );

    return {
      initiatives: sortedInitiatives,
    };
  }

  /**
   * Apply initiative filter at the initiative level
   */
  private applyInitiativeFilter(
    data: NestedCycleData,
    initiatives?: InitiativeId[],
  ): NestedCycleData {
    if (!initiatives || initiatives.length === 0) {
      return data;
    }

    const filteredInitiatives = data.initiatives.filter((initiative) =>
      initiatives.includes(initiative.id),
    );

    return {
      ...data,
      initiatives: filteredInitiatives,
    };
  }

  /**
   * Get primary owner from release items
   */
  private getPrimaryOwner(releaseItems: any[]): string {
    if (!Array.isArray(releaseItems) || releaseItems.length === 0) {
      return DEFAULT_ASSIGNEE.NAME;
    }

    const lastItem = releaseItems[releaseItems.length - 1];
    return getDefaultAssigneeName(lastItem.assignee);
  }

  /**
   * Get cycle name by ID
   */
  private getCycleName(cycles: any[], cycleId: string): string {
    if (!Array.isArray(cycles)) {
      return `Cycle ${cycleId}`;
    }

    const cycle = cycles.find((c) => c.id === cycleId);
    return cycle ? cycle.name : `Cycle ${String(cycleId)}`;
  }
}

// Export singleton instance
export const dataProcessor = new DataProcessor();
