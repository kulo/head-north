/**
 * Cycle Progress Calculator
 *
 * Pure business logic for calculating cycle progress data.
 * Extracted from Vuex store to improve separation of concerns.
 */

import {
  calculateReleaseItemProgress,
  calculateCycleMetadata,
} from "./calculations/cycle-calculations";
import type { Cycle } from "@headnorth/types";
import type {
  CycleWithProgress,
  InitiativeWithProgress,
} from "../types/ui-types";

/**
 * Calculate cycle progress data by aggregating progress from all initiatives
 * @param cycle - Basic cycle object
 * @param initiatives - Array of initiatives with progress data
 * @returns CycleWithProgress object with calculated progress metrics
 */
export const calculateCycleProgress = (
  cycle: Cycle,
  initiatives: readonly InitiativeWithProgress[],
): CycleWithProgress => {
  // Calculate cycle metadata (months, days, etc.)
  const cycleMetadata = calculateCycleMetadata(cycle);

  // Collect all release items from all initiatives
  const allReleaseItems = initiatives.flatMap(
    (initiative) =>
      initiative.roadmapItems?.flatMap(
        (roadmapItem) => roadmapItem.releaseItems || [],
      ) || [],
  );

  // Calculate progress metrics from all release items
  const progressMetrics = calculateReleaseItemProgress(allReleaseItems);

  // Combine cycle data with progress metrics and metadata
  return {
    ...cycle,
    ...progressMetrics,
    ...cycleMetadata,
  };
};
