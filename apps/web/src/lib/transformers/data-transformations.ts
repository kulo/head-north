/**
 * Data transformation utilities for frontend
 * Handles all presentation logic and calculations that were moved from backend
 */

import pkg from "lodash";
const { groupBy } = pkg;
import {
  calculateReleaseItemProgress,
  calculateCycleMetadata,
  aggregateProgressMetrics,
} from "../calculations/cycle-calculations";

/**
 * Calculate progress percentage for release items
 * @param {Array} releaseItems - Array of release items
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (releaseItems) => {
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
 * @param {Array} releaseItems - Array of release items
 * @returns {number} Total weeks
 */
export const calculateTotalWeeks = (releaseItems) => {
  if (!Array.isArray(releaseItems)) {
    return 0;
  }

  return releaseItems.reduce((sum, ri) => sum + (ri.effort || 0), 0);
};

/**
 * Get primary owner from release items
 * @param {Array} releaseItems - Array of release items
 * @returns {string} Primary owner name
 */
export const getPrimaryOwner = (releaseItems) => {
  if (!Array.isArray(releaseItems) || releaseItems.length === 0) {
    return "Unassigned";
  }

  const lastItem = releaseItems[releaseItems.length - 1];

  // Handle both object and string assignee formats
  if (!lastItem.assignee) {
    return "Unassigned";
  }

  // If assignee is an object with displayName property
  if (typeof lastItem.assignee === "object" && lastItem.assignee.displayName) {
    return lastItem.assignee.displayName;
  }

  // If assignee is already a string
  if (typeof lastItem.assignee === "string") {
    return lastItem.assignee;
  }

  return "Unassigned";
};

/**
 * Get cycle name by ID
 * @param {Array} cycles - Array of cycles
 * @param {string|number} cycleId - Cycle ID to look up
 * @returns {string} Cycle name
 */
export const getCycleName = (cycles, cycleId) => {
  if (!Array.isArray(cycles)) {
    return `Cycle ${cycleId}`;
  }

  const cycle = cycles.find((c) => c.id === cycleId);
  return cycle ? cycle.name : `Cycle ${cycleId}`;
};

/**
 * Group roadmap items by initiative
 * @param {Array} roadmapItems - Array of roadmap items
 * @returns {Object} Grouped roadmap items by initiative ID
 */
export const groupRoadmapItemsByInitiative = (roadmapItems) => {
  if (!Array.isArray(roadmapItems)) {
    return {};
  }

  return groupBy(roadmapItems, (item) => item.initiativeId);
};

/**
 * Transform raw roadmap item for display
 * @param {Object} item - Raw roadmap item
 * @param {Array} cycles - Array of cycles for name lookup
 * @returns {Object} Transformed roadmap item
 */
export const transformRoadmapItem = (item, cycles) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  // Get all release items from sprints
  const allReleaseItems =
    item.sprints?.flatMap((sprint) => sprint.releaseItems || []) || [];

  return {
    id: item.id,
    name: item.summary || item.name || `Roadmap Item ${item.id}`,
    area: item.area,
    theme: item.theme,
    owner: getPrimaryOwner(allReleaseItems),
    progress: calculateProgress(allReleaseItems),
    weeks: calculateTotalWeeks(allReleaseItems),
    url: item.url || `https://example.com/browse/${item.id}`,
    validations: item.validations || [],
    releaseItems: allReleaseItems.map((releaseItem) => ({
      ...releaseItem,
      cycle: {
        id: item.sprints?.find((s) => s.releaseItems?.includes(releaseItem))
          ?.sprintId,
        name: getCycleName(
          cycles,
          item.sprints?.find((s) => s.releaseItems?.includes(releaseItem))
            ?.sprintId,
        ),
      },
    })),
  };
};

/**
 * Transform raw data for cycle overview view
 * @param {Object} rawData - Raw data from backend
 * @returns {Object} Transformed data for cycle overview with full calculations
 */
export const transformForCycleOverview = (rawData) => {
  if (!rawData || typeof rawData !== "object") {
    return { cycles: [], initiatives: [] };
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
  const groupedInitiatives = {};
  const cycleMetrics = [];

  roadmapItems.forEach((item) => {
    const initiativeId = item.initiativeId || "unassigned";
    if (!groupedInitiatives[initiativeId]) {
      groupedInitiatives[initiativeId] = {
        initiativeId,
        initiative: initiativesLookup[initiativeId] || initiativeId,
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
      area: item.area,
      theme: item.theme,
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
  Object.values(groupedInitiatives).forEach((initiative: any) => {
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
            (initiative.releaseItemsDoneCount / initiative.releaseItemsCount) *
              100,
          )
        : 0;
    initiative.percentageNotToDo =
      initiative.weeks > 0
        ? Math.round((initiative.weeksNotToDo / initiative.weeks) * 100)
        : 0;
  });

  // Sort initiatives by weeks (largest first)
  const sortedInitiatives = Object.values(groupedInitiatives).sort(
    (a, b) => (b as any).weeks - (a as any).weeks,
  );

  return {
    cycles: cycles || [],
    initiatives: sortedInitiatives,
  };
};

/**
 * Transform raw data for roadmap view
 * @param {Object} rawData - Raw data from backend
 * @returns {Object} Transformed data for roadmap
 */
export const transformForRoadmap = (rawData) => {
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
    const initiativeId = item.initiativeId || "unassigned";
    if (!groupedInitiatives[initiativeId]) {
      groupedInitiatives[initiativeId] = {
        initiativeId,
        initiative: initiativesLookup[initiativeId] || initiativeId,
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
      area: item.area,
      theme: item.theme,
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
 * @param {Array} cycles - Array of cycles
 * @param {Array} releaseItems - Array of release items
 * @returns {Array} Cycles with calculated progress and metadata
 */
export const calculateCycleProgress = (cycles, releaseItems) => {
  if (!Array.isArray(cycles) || !Array.isArray(releaseItems)) {
    return cycles || [];
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
 * @param {Object} cycle - Cycle object
 * @param {Array} initiatives - Array of initiatives with calculated metrics
 * @returns {Object} Cycle with aggregated data
 */
export const calculateCycleData = (cycle, initiatives) => {
  if (!cycle || !Array.isArray(initiatives)) {
    return cycle;
  }

  // Aggregate all initiative metrics
  const initiativeMetrics = initiatives.map((initiative) => ({
    weeks: initiative.weeks || 0,
    weeksDone: initiative.weeksDone || 0,
    weeksInProgress: initiative.weeksInProgress || 0,
    weeksTodo: initiative.weeksTodo || 0,
    weeksNotToDo: initiative.weeksNotToDo || 0,
    weeksCancelled: initiative.weeksCancelled || 0,
    weeksPostponed: initiative.weeksPostponed || 0,
    releaseItemsCount: initiative.releaseItemsCount || 0,
    releaseItemsDoneCount: initiative.releaseItemsDoneCount || 0,
  }));

  const aggregatedMetrics = aggregateProgressMetrics(initiativeMetrics);
  const cycleMetadata = calculateCycleMetadata(cycle);

  return {
    ...cycle,
    ...aggregatedMetrics,
    ...cycleMetadata,
  };
};
