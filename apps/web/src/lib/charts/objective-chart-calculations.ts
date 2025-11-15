/**
 * Objective Chart Calculations
 *
 * Pure functions for calculating objective chart data.
 * Extracted from ObjectiveChart.vue for better testability and reusability.
 */

import { Maybe } from "purify-ts";
import type { ObjectiveWithProgress } from "../../types/ui-types";

/**
 * Safe numeric value with bounds checking
 * Ensures value is finite, within bounds, and positive
 */
const safeValue = (
  value: number,
  min: number,
  max: number,
  defaultValue: number,
): number => {
  const safe = Math.max(min, Math.min(max, Math.abs(value)));
  return Maybe.fromNullable(safe)
    .filter((v) => isFinite(v) && !isNaN(v))
    .orDefault(defaultValue);
};

/**
 * Deep copy an object using JSON serialization
 */
const deepCopy = <T>(src: T): T => JSON.parse(JSON.stringify(src));

/**
 * Sort objectives by weeks (largest first)
 */
export const sortObjectives = (
  objectives: readonly ObjectiveWithProgress[],
): readonly ObjectiveWithProgress[] => {
  return [...objectives].sort((obj1, obj2) => obj2.weeks - obj1.weeks);
};

/**
 * Summarize objectives when there are more than maxCount
 * Combines smaller objectives into "Other Projects"
 */
export const summarizeObjectives = (
  objectives: readonly ObjectiveWithProgress[],
  maxCount: number = 8,
): readonly ObjectiveWithProgress[] => {
  if (objectives.length <= maxCount) {
    return sortObjectives(objectives);
  }

  const sortedObjectives = sortObjectives(objectives);
  const headObjectives = sortedObjectives.slice(0, maxCount - 1);
  const tailObjectives = sortedObjectives.slice(maxCount - 1);

  const defaultOtherObjective: ObjectiveWithProgress = {
    id: "other",
    name: "Other Projects",
    roadmapItems: [],
    weeks: 0,
    weeksDone: 0,
    weeksInProgress: 0,
    weeksTodo: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    cycleItemsCount: 0,
    cycleItemsDoneCount: 0,
    progress: 0,
    progressWithInProgress: 0,
    progressByCycleItems: 0,
    percentageNotToDo: 0,
    startMonth: "",
    endMonth: "",
    daysFromStartOfCycle: 0,
    daysInCycle: 0,
    currentDayPercentage: 0,
  };

  // Aggregate tail objectives
  const aggregated = tailObjectives.reduce(
    (acc, obj) => ({
      weeks: acc.weeks + obj.weeks,
      weeksDone: acc.weeksDone + obj.weeksDone,
      weeksInProgress: acc.weeksInProgress + obj.weeksInProgress,
    }),
    {
      weeks: defaultOtherObjective.weeks,
      weeksDone: defaultOtherObjective.weeksDone,
      weeksInProgress: defaultOtherObjective.weeksInProgress,
    },
  );

  // Calculate progress rates
  const progressRate =
    aggregated.weeks > 0 ? aggregated.weeksDone / aggregated.weeks : 0;
  const progress = Math.round(progressRate * 100) || 0;

  const inprogressRate =
    aggregated.weeks > 0
      ? (aggregated.weeksDone + aggregated.weeksInProgress) / aggregated.weeks
      : 0;
  const progressWithInProgress = Math.round(inprogressRate * 100) || 0;

  // Create final summarized objective with calculated progress
  const summarizedOtherObjective: ObjectiveWithProgress = {
    ...defaultOtherObjective,
    ...aggregated,
    progress,
    progressWithInProgress,
  };

  return sortObjectives([...headObjectives, summarizedOtherObjective]);
};

/**
 * Objective data with relative track calculations for chart display
 */
export interface ObjectiveChartData {
  readonly name: string;
  readonly weeks: number;
  readonly weeksDone: number;
  readonly progress: number;
  readonly trackLength: number;
  readonly progressOnTrack: number;
  readonly inprogressOnTrack: number;
}

/**
 * Calculate relative values for chart display
 * Determines track lengths and progress positions based on objective sizes
 */
export const calculateObjectiveRelativeValues = (
  objectives: readonly ObjectiveWithProgress[],
): readonly ObjectiveChartData[] => {
  if (objectives.length === 0) {
    return [];
  }

  // Extract basic objective data
  const basicData = objectives.map((objective) => ({
    name: objective.name,
    weeks: objective.weeks,
    weeksDone: objective.weeksDone,
    progress: objective.progress || 0,
    progressWithInProgress: objective.progressWithInProgress || 0,
  }));

  const longestObjective = basicData[0];

  return basicData.map((objective) => {
    // Calculate relative modifier to longest objective
    const relativeModifierToLongest = Maybe.fromNullable(
      longestObjective.weeks > 0 ? objective.weeks / longestObjective.weeks : 0,
    )
      .map((modifier) => Math.max(0, Math.min(10, modifier))) // Cap at 10
      .filter((modifier) => isFinite(modifier))
      .orDefault(0);

    // Calculate base track length
    let trackLength = safeValue(
      Math.ceil(relativeModifierToLongest * 100 * 1.1),
      1,
      100,
      1,
    );

    // Apply multipliers with safety checks
    trackLength =
      trackLength < 10
        ? safeValue(trackLength * 2.3, 1, 100, 1)
        : trackLength < 30
          ? safeValue(trackLength * 1.1, 1, 100, 1)
          : trackLength < 80
            ? safeValue(trackLength * 1.15, 1, 100, 1)
            : trackLength;

    // Ensure progress values are safe
    const safeProgress = safeValue(objective.progress, 0, 100, 0);
    const safeInProgress = safeValue(
      objective.progressWithInProgress,
      0,
      100,
      0,
    );

    // Calculate progress on track
    const progressOnTrack = safeValue(
      Math.ceil((safeProgress / 100) * trackLength),
      0,
      trackLength,
      0,
    );

    const inprogressOnTrack = safeValue(
      Math.ceil((safeInProgress / 100) * trackLength),
      0,
      trackLength,
      0,
    );

    return {
      name: objective.name,
      weeks: objective.weeks,
      weeksDone: objective.weeksDone,
      progress: safeProgress,
      trackLength,
      progressOnTrack,
      inprogressOnTrack,
    };
  });
};

/**
 * Extract track lengths from objective chart data
 */
export const extractObjectiveTracks = (
  chartData: readonly ObjectiveChartData[],
): readonly number[] => {
  return chartData.map((objective) =>
    safeValue(objective.trackLength, 1, 100, 1),
  );
};

/**
 * Extract progress values from objective chart data
 */
export const extractObjectiveProgresses = (
  chartData: readonly ObjectiveChartData[],
): readonly number[] => {
  return chartData.map((objective) =>
    safeValue(objective.progressOnTrack, 0, 100, 0),
  );
};

/**
 * Extract in-progress values from objective chart data
 */
export const extractObjectiveInProgress = (
  chartData: readonly ObjectiveChartData[],
): readonly number[] => {
  return chartData.map((objective) =>
    safeValue(objective.inprogressOnTrack, 0, 100, 0),
  );
};

/**
 * Validate chart options based on objective count
 * Adjusts radial bar settings for better display with many objectives
 */
export const validateChartOptions = <T extends { plotOptions?: unknown }>(
  options: T,
  objectiveCount: number,
): T => {
  const safeOptions = deepCopy(options);

  // For many objectives, ensure we have enough space for the radial bars
  if (objectiveCount > 4) {
    const plotOptions = safeOptions.plotOptions as {
      radialBar?: {
        hollow?: { size?: string; margin?: number };
        track?: { margin?: number };
      };
    };

    if (plotOptions?.radialBar) {
      if (plotOptions.radialBar.hollow) {
        plotOptions.radialBar.hollow.size = "35%";
        plotOptions.radialBar.hollow.margin = 20;
      }

      if (plotOptions.radialBar.track) {
        plotOptions.radialBar.track.margin = 3;
      }
    }
  }

  return safeOptions;
};

/**
 * Generate CSS class name for objective length styling
 */
export const getObjectiveLengthClass = (
  objectiveCount: number,
): Record<string, boolean> => {
  return {
    [`global-objectives__details-${objectiveCount}`]: true,
    "global-objectives__details-gt4": objectiveCount > 4,
  };
};
