/**
 * Data Transformer
 *
 * Pure data transformation functions with no side effects.
 * Handles the core business logic of transforming raw data into UI-ready formats.
 *
 * This belongs in /lib because it contains only pure functions with no external dependencies.
 */

import type { CycleData, InitiativeId, RoadmapItem } from "@omega/types";
import type {
  FilterCriteria,
  InitiativeWithProgress,
  NestedCycleData,
  RoadmapItemWithProgress,
  RoadmapData,
  CycleOverviewData,
} from "../../types/ui-types";
import { filter } from "../utils/filter";
import { selectDefaultCycle } from "../selectors/cycle-selector";
import { calculateCycleProgress } from "../cycle-progress-calculator";
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
 * Pure data transformation functions
 */
export class DataTransformer {
  /**
   * Transform raw CycleData to NestedCycleData structure
   * Pure function - no side effects
   */
  static transformToNestedStructure(rawData: CycleData): NestedCycleData {
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
            name: DataTransformer.getCycleName(cycles, releaseItem.cycleId),
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
   * Pure function - no side effects
   */
  static applyInitiativeFilter(
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
   * Process raw cycle data into nested structure with filtering
   * Pure function - no side effects
   */
  static processCycleData(
    rawData: CycleData,
    filters: FilterCriteria = {},
  ): NestedCycleData {
    // Transform raw data to nested structure
    const nestedData = DataTransformer.transformToNestedStructure(rawData);

    // Apply initiative filter first (at initiative level)
    const initiativeFilteredData = DataTransformer.applyInitiativeFilter(
      nestedData,
      filters.initiatives,
    );

    // Apply all other filters (cascading from release items up)
    const result = filter.apply(initiativeFilteredData, filters);

    return result.data;
  }

  /**
   * Generate roadmap data from raw and processed data
   * Pure function - no side effects
   */
  static generateRoadmapData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): RoadmapData {
    if (!processedData) {
      return {
        orderedCycles: [],
        roadmapItems: [],
        activeCycle: null,
        initiatives: [],
      };
    }

    return {
      orderedCycles: rawData?.cycles || [],
      roadmapItems: [],
      activeCycle: selectDefaultCycle(rawData?.cycles || []),
      initiatives: processedData.initiatives || [],
    };
  }

  /**
   * Generate cycle overview data from raw and processed data
   * Pure function - no side effects
   */
  static generateCycleOverviewData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): CycleOverviewData | null {
    if (!processedData || !rawData?.cycles?.length) {
      return null;
    }

    const selectedCycle = selectDefaultCycle(rawData.cycles);
    if (!selectedCycle) {
      return null;
    }

    return {
      cycle: selectedCycle,
      initiatives: processedData.initiatives || [],
    };
  }

  /**
   * Generate filtered roadmap data
   * Pure function - no side effects
   */
  static generateFilteredRoadmapData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
    activeFilters: FilterCriteria,
  ): RoadmapData {
    if (!processedData) {
      return {
        orderedCycles: [],
        roadmapItems: [],
        activeCycle: null,
        initiatives: [],
      };
    }

    // Apply filters using unified filter system
    const filteredData = filter.apply(processedData, activeFilters);

    return {
      orderedCycles: rawData?.cycles || [],
      roadmapItems: [],
      activeCycle: selectDefaultCycle(rawData?.cycles || []),
      initiatives: filteredData.data.initiatives || [],
    };
  }

  /**
   * Generate filtered cycle overview data with progress calculations
   * Pure function - no side effects
   */
  static generateFilteredCycleOverviewData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
    activeFilters: FilterCriteria,
  ): CycleOverviewData | null {
    if (!processedData || !rawData?.cycles?.length) {
      return null;
    }

    const selectedCycle = selectDefaultCycle(rawData.cycles);
    if (!selectedCycle) {
      return null;
    }

    // Apply filters using unified filter system
    const filteredData = filter.apply(processedData, activeFilters);
    const filteredInitiatives = filteredData.data.initiatives || [];

    // Calculate cycle progress data
    const cycleWithProgress = calculateCycleProgress(
      selectedCycle,
      filteredInitiatives,
    );

    return {
      cycle: cycleWithProgress,
      initiatives: filteredInitiatives,
    };
  }

  /**
   * Get cycle name by ID
   * Pure function - no side effects
   */
  private static getCycleName(cycles: any[], cycleId: string): string {
    if (!Array.isArray(cycles)) {
      return `Cycle ${cycleId}`;
    }

    const cycle = cycles.find((c) => c.id === cycleId);
    return cycle ? cycle.name : `Cycle ${String(cycleId)}`;
  }
}
