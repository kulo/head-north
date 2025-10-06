/**
 * Data transformation utilities for frontend
 * Handles all presentation logic and calculations that were moved from backend
 */

import pkg from "lodash";
const { groupBy } = pkg;
import type {
  CycleId,
  InitiativeId,
  ReleaseItem,
  Cycle,
  CycleData,
  CycleWithProgress,
  InitiativeWithProgress,
} from "@omega/types";
import type {
  CycleOverviewData,
  TransformedRoadmapData,
  TransformedRoadmapItem,
  ProgressMetrics,
} from "../../types/ui-types";
import {
  calculateReleaseItemProgress,
  calculateCycleMetadata,
  aggregateProgressMetrics,
} from "../calculations/cycle-calculations";

/**
 * Calculate progress percentage for release items
 * @param {ReleaseItem[]} releaseItems - Array of release items
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (releaseItems: ReleaseItem[]): number => {
  if (!Array.isArray(releaseItems) || releaseItems.length === 0) {
    return 0;
  }

  const completedItems = releaseItems.filter(
    (ri) => ri.status === "done",
  ).length;
  const totalItems = releaseItems.length;

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};

/**
 * Calculate total weeks from effort values
 * @param {ReleaseItem[]} releaseItems - Array of release items
 * @returns {number} Total weeks
 */
export const calculateTotalWeeks = (releaseItems: ReleaseItem[]): number => {
  if (!Array.isArray(releaseItems)) {
    return 0;
  }

  return releaseItems.reduce((sum, ri) => sum + (ri.effort || 0), 0);
};

/**
 * Get primary owner from release items
 * @param {ReleaseItem[]} releaseItems - Array of release items
 * @returns {string} Primary owner name
 */
export const getPrimaryOwner = (releaseItems: ReleaseItem[]): string => {
  if (!Array.isArray(releaseItems) || releaseItems.length === 0) {
    return "Unassigned";
  }

  const lastItem = releaseItems[releaseItems.length - 1];

  // Handle both object and string assignee formats
  if (!lastItem.assignee) {
    return "Unassigned";
  }

  // If assignee is an object with displayName property
  if (
    typeof lastItem.assignee === "object" &&
    lastItem.assignee &&
    "displayName" in lastItem.assignee
  ) {
    return String((lastItem.assignee as any).displayName);
  }

  // If assignee is already a string
  if (typeof lastItem.assignee === "string") {
    return lastItem.assignee;
  }

  return "Unassigned";
};

/**
 * Get cycle name by ID
 * @param {Cycle[]} cycles - Array of cycles
 * @param {CycleId} cycleId - Cycle ID to look up
 * @returns {string} Cycle name
 */
export const getCycleName = (cycles: Cycle[], cycleId: CycleId): string => {
  if (!Array.isArray(cycles)) {
    return `Cycle ${cycleId}`;
  }

  const cycle = cycles.find((c) => c.id === cycleId);
  return cycle ? cycle.name : `Cycle ${String(cycleId)}`;
};

/**
 * Group roadmap items by initiative
 * @param {RoadmapItem[]} roadmapItems - Array of roadmap items
 * @returns {Record<string, RoadmapItem[]>} Grouped roadmap items by initiative ID
 */
export const groupRoadmapItemsByInitiative = (
  roadmapItems: RoadmapItem[],
): Record<string, RoadmapItem[]> => {
  if (!Array.isArray(roadmapItems)) {
    return {};
  }

  return groupBy(roadmapItems, (item) =>
    String(item.initiative?.id || "unassigned"),
  );
};

/**
 * Transform raw roadmap item for display
 * @param {RoadmapItem} item - Raw roadmap item
 * @param {Cycle[]} cycles - Array of cycles for name lookup
 * @returns {TransformedRoadmapItem | null} Transformed roadmap item
 */
export const transformRoadmapItem = (
  item: RoadmapItem,
  cycles: Cycle[],
): TransformedRoadmapItem | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  // Get all release items from the roadmap item
  const allReleaseItems = item.releaseItems || [];

  return {
    id: item.id,
    name: item.summary || item.name || `Roadmap Item ${item.id}`,
    area: typeof item.area === "string" ? item.area : item.area?.name || "",
    theme: typeof item.theme === "string" ? item.theme : "",
    owner: getPrimaryOwner(allReleaseItems),
    progress: calculateProgress(allReleaseItems),
    weeks: calculateTotalWeeks(allReleaseItems),
    url: item.url || `https://example.com/browse/${item.id}`,
    validations: item.validations || [],
    releaseItems: allReleaseItems.map((releaseItem) => ({
      ...releaseItem,
      cycle: {
        id: releaseItem.cycleId || "",
        name: getCycleName(cycles, releaseItem.cycleId || ""),
      },
    })),
  };
};

/**
 * Transform raw data for cycle overview view
 * @param {CycleData} rawData - Raw data from backend
 * @returns {CycleOverviewData} Transformed data for cycle overview with full calculations
 */
export const transformForCycleOverview = (
  rawData: CycleData,
): CycleOverviewData => {
  if (!rawData || typeof rawData !== "object") {
    return { cycle: null, initiatives: [] };
  }

  const {
    cycles,
    roadmapItems,
    releaseItems,
    initiatives: configInitiatives,
  } = rawData;

  // Convert initiatives array to lookup object
  const initiativesLookup = {};
  if (Array.isArray(configInitiatives)) {
    configInitiatives.forEach((init) => {
      initiativesLookup[init.id] = init.name;
    });
  }

  // Group roadmap items by initiative and calculate progress
  const groupedInitiatives: Record<string, InitiativeWithProgress> = {};
  const cycleMetrics = [];

  roadmapItems.forEach((item) => {
    const initiativeId: InitiativeId = String(
      item.initiative?.id || "unassigned",
    );
    if (!groupedInitiatives[initiativeId]) {
      groupedInitiatives[initiativeId] = {
        id: initiativeId,
        name: initiativesLookup[initiativeId] || initiativeId,
        roadmapItems: [],
        // Initialize initiative-level metrics
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

    // Find release items for this roadmap item using foreign key
    const itemReleaseItems = releaseItems.filter(
      (ri) => ri.roadmapItemId === item.id,
    );

    // Calculate progress metrics for this roadmap item
    const roadmapItemMetrics = calculateReleaseItemProgress(itemReleaseItems);

    const roadmapItem = {
      id: item.id,
      name: item.summary || item.name || `Roadmap Item ${item.id}`,
      area: typeof item.area === "string" ? item.area : item.area?.name || "",
      theme: typeof item.theme === "string" ? item.theme : "",
      owner: getPrimaryOwner(itemReleaseItems),
      url: item.url || `https://example.com/browse/${item.id}`,
      validations: item.validations || {},
      releaseItems: itemReleaseItems.map((releaseItem) => ({
        ...releaseItem,
        cycle: releaseItem.cycle || {
          id: releaseItem.cycleId,
          name: getCycleName(cycles, releaseItem.cycleId),
        },
      })),
      // Add calculated metrics
      ...roadmapItemMetrics,
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

    // Add to cycle metrics
    cycleMetrics.push(roadmapItemMetrics);
  });

  // Calculate final initiative-level percentages
  Object.values(groupedInitiatives).forEach(
    (initiative: InitiativeWithProgress) => {
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
          ? Math.round((initiative.weeksNotToDo / initiative.weeks) * 100)
          : 0;
    },
  );

  // Sort initiatives by weeks (largest first)
  const sortedInitiatives = Object.values(groupedInitiatives).sort(
    (a, b) => b.weeks - a.weeks,
  );

  return {
    cycle: cycles?.[0] || null,
    initiatives: sortedInitiatives,
  };
};

/**
 * Transform raw data for roadmap view
 * @param {CycleData} rawData - Raw data from backend
 * @returns {TransformedRoadmapData} Transformed data for roadmap
 */
export const transformForRoadmap = (
  rawData: CycleData,
): TransformedRoadmapData => {
  if (!rawData || typeof rawData !== "object") {
    return { initiatives: [] };
  }

  const {
    cycles,
    roadmapItems,
    releaseItems,
    initiatives: configInitiatives,
  } = rawData;

  // Convert initiatives array to lookup object
  const initiativesLookup = {};
  if (Array.isArray(configInitiatives)) {
    configInitiatives.forEach((init) => {
      initiativesLookup[init.id] = init.name;
    });
  }

  // Group roadmap items by initiative
  const groupedInitiatives = {};

  roadmapItems.forEach((item) => {
    const initiativeId: InitiativeId = String(
      item.initiative?.name || "unassigned",
    );
    if (!groupedInitiatives[initiativeId]) {
      groupedInitiatives[initiativeId] = {
        id: initiativeId,
        name: initiativesLookup[initiativeId] || initiativeId,
        roadmapItems: [],
      };
    }

    // Find release items for this roadmap item using foreign key
    const itemReleaseItems = releaseItems.filter(
      (ri) => ri.roadmapItemId === item.id,
    );

    groupedInitiatives[initiativeId].roadmapItems.push({
      id: item.id,
      name: item.summary || item.name || `Roadmap Item ${item.id}`,
      area: typeof item.area === "string" ? item.area : item.area?.name || "",
      theme: typeof item.theme === "string" ? item.theme : "",
      owner: getPrimaryOwner(itemReleaseItems),
      progress: calculateProgress(itemReleaseItems),
      weeks: calculateTotalWeeks(itemReleaseItems),
      url: item.url || `https://example.com/browse/${item.id}`,
      validations: item.validations || {},
      releaseItems: itemReleaseItems.map((releaseItem) => ({
        ...releaseItem,
        cycle: releaseItem.cycle || {
          id: releaseItem.cycleId,
          name: getCycleName(cycles, releaseItem.cycleId),
        },
      })),
    });
  });

  return {
    initiatives: Object.values(groupedInitiatives),
  };
};

/**
 * Calculate cycle progress based on release items
 * @param {Cycle[]} cycles - Array of cycles
 * @param {ReleaseItem[]} releaseItems - Array of release items
 * @returns {CycleWithProgress[]} Cycles with calculated progress and metadata
 */
export const calculateCycleProgress = (
  cycles: Cycle[],
  releaseItems: ReleaseItem[],
): CycleWithProgress[] => {
  if (!Array.isArray(cycles) || !Array.isArray(releaseItems)) {
    return (cycles || []).map((cycle) => ({
      ...cycle,
      progress: 0,
      progressWithInProgress: 0,
      progressByReleaseItems: 0,
      weeks: 0,
      weeksDone: 0,
      weeksInProgress: 0,
      weeksNotToDo: 0,
      weeksCancelled: 0,
      weeksPostponed: 0,
      weeksTodo: 0,
      releaseItemsCount: 0,
      releaseItemsDoneCount: 0,
      percentageNotToDo: 0,
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    }));
  }

  return cycles.map((cycle) => {
    // Get release items for this cycle using foreign key
    const cycleReleaseItems = releaseItems.filter(
      (ri) => ri.cycleId === cycle.id,
    );

    if (cycleReleaseItems.length === 0) {
      const cycleMetadata = calculateCycleMetadata(cycle);
      return {
        ...cycle,
        progress: 0,
        progressWithInProgress: 0,
        progressByReleaseItems: 0,
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        releaseItemsCount: 0,
        releaseItemsDoneCount: 0,
        percentageNotToDo: 0,
        ...cycleMetadata,
      };
    }

    // Calculate comprehensive progress metrics
    const cycleMetrics = calculateReleaseItemProgress(cycleReleaseItems);
    const cycleMetadata = calculateCycleMetadata(cycle);

    return {
      ...cycle,
      ...cycleMetrics,
      ...cycleMetadata,
    };
  });
};

/**
 * Calculate cycle-level data for a specific cycle with all initiatives
 * @param {Cycle} cycle - Cycle object
 * @param {InitiativeWithProgress[]} initiatives - Array of initiatives with calculated metrics
 * @returns {CycleWithProgress} Cycle with aggregated data
 */
export const calculateCycleData = (
  cycle: Cycle,
  initiatives: InitiativeWithProgress[],
): CycleWithProgress => {
  if (!cycle || !Array.isArray(initiatives)) {
    return {
      ...cycle,
      progress: 0,
      progressWithInProgress: 0,
      progressByReleaseItems: 0,
      weeks: 0,
      weeksDone: 0,
      weeksInProgress: 0,
      weeksNotToDo: 0,
      weeksCancelled: 0,
      weeksPostponed: 0,
      weeksTodo: 0,
      releaseItemsCount: 0,
      releaseItemsDoneCount: 0,
      percentageNotToDo: 0,
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    };
  }

  // Aggregate all initiative metrics
  const initiativeMetrics: ProgressMetrics[] = initiatives.map(
    (initiative) => ({
      weeks: initiative.weeks || 0,
      weeksDone: initiative.weeksDone || 0,
      weeksInProgress: initiative.weeksInProgress || 0,
      weeksTodo: initiative.weeksTodo || 0,
      weeksNotToDo: initiative.weeksNotToDo || 0,
      weeksCancelled: initiative.weeksCancelled || 0,
      weeksPostponed: initiative.weeksPostponed || 0,
      releaseItemsCount: initiative.releaseItemsCount || 0,
      releaseItemsDoneCount: initiative.releaseItemsDoneCount || 0,
      progress: initiative.progress || 0,
      progressWithInProgress: initiative.progressWithInProgress || 0,
      progressByReleaseItems: initiative.progressByReleaseItems || 0,
      percentageNotToDo: initiative.percentageNotToDo || 0,
    }),
  );

  const aggregatedMetrics = aggregateProgressMetrics(initiativeMetrics);
  const cycleMetadata = calculateCycleMetadata(cycle);

  return {
    ...cycle,
    ...aggregatedMetrics,
    ...cycleMetadata,
  };
};
