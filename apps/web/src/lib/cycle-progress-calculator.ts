/**
 * Cycle Progress Calculator
 *
 * Pure business logic for calculating cycle progress data.
 * Extracted from Vuex store to improve separation of concerns.
 */

import {
  calculateCycleItemProgress,
  calculateCycleMetadata,
} from "./calculations/cycle-calculations";
import type { Cycle } from "@headnorth/types";
import type {
  CycleWithProgress,
  ObjectiveWithProgress,
} from "../types/ui-types";

/**
 * Calculate cycle progress data by aggregating progress from all objectives
 * @param cycle - Basic cycle object
 * @param objectives - Array of objectives with progress data
 * @returns CycleWithProgress object with calculated progress metrics
 */
export const calculateCycleProgress = (
  cycle: Cycle,
  objectives: readonly ObjectiveWithProgress[],
): CycleWithProgress => {
  // Calculate cycle metadata (months, days, etc.)
  const cycleMetadata = calculateCycleMetadata(cycle);

  // Collect all cycle items from all objectives
  const allCycleItems = objectives.flatMap(
    (objective) =>
      objective.roadmapItems?.flatMap(
        (roadmapItem) => roadmapItem.cycleItems || [],
      ) || [],
  );

  // Calculate progress metrics from all cycle items
  const progressMetrics = calculateCycleItemProgress(allCycleItems);

  // Combine cycle data with progress metrics and metadata
  return {
    ...cycle,
    ...progressMetrics,
    ...cycleMetadata,
  };
};
