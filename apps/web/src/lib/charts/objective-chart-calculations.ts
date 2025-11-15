/**
 * Initiative Chart Calculations
 *
 * Pure functions for calculating initiative chart data.
 * Extracted from InitiativeChart.vue for better testability and reusability.
 */

import { Maybe } from "purify-ts";
import type { InitiativeWithProgress } from "../../types/ui-types";

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
 * Sort initiatives by weeks (largest first)
 */
export const sortInitiatives = (
  initiatives: readonly InitiativeWithProgress[],
): readonly InitiativeWithProgress[] => {
  return [...initiatives].sort((init1, init2) => init2.weeks - init1.weeks);
};

/**
 * Summarize initiatives when there are more than maxCount
 * Combines smaller initiatives into "Other Projects"
 */
export const summarizeInitiatives = (
  initiatives: readonly InitiativeWithProgress[],
  maxCount: number = 8,
): readonly InitiativeWithProgress[] => {
  if (initiatives.length <= maxCount) {
    return sortInitiatives(initiatives);
  }

  const sortedInitiatives = sortInitiatives(initiatives);
  const headInitiatives = sortedInitiatives.slice(0, maxCount - 1);
  const tailInitiatives = sortedInitiatives.slice(maxCount - 1);

  const defaultOtherInitiative: InitiativeWithProgress = {
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

  // Aggregate tail initiatives
  const aggregated = tailInitiatives.reduce(
    (acc, init) => ({
      weeks: acc.weeks + init.weeks,
      weeksDone: acc.weeksDone + init.weeksDone,
      weeksInProgress: acc.weeksInProgress + init.weeksInProgress,
    }),
    {
      weeks: defaultOtherInitiative.weeks,
      weeksDone: defaultOtherInitiative.weeksDone,
      weeksInProgress: defaultOtherInitiative.weeksInProgress,
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

  // Create final summarized initiative with calculated progress
  const summarizedOtherInitiative: InitiativeWithProgress = {
    ...defaultOtherInitiative,
    ...aggregated,
    progress,
    progressWithInProgress,
  };

  return sortInitiatives([...headInitiatives, summarizedOtherInitiative]);
};

/**
 * Initiative data with relative track calculations for chart display
 */
export interface InitiativeChartData {
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
 * Determines track lengths and progress positions based on initiative sizes
 */
export const calculateInitiativeRelativeValues = (
  initiatives: readonly InitiativeWithProgress[],
): readonly InitiativeChartData[] => {
  if (initiatives.length === 0) {
    return [];
  }

  // Extract basic initiative data
  const basicData = initiatives.map((initiative) => ({
    name: initiative.name,
    weeks: initiative.weeks,
    weeksDone: initiative.weeksDone,
    progress: initiative.progress || 0,
    progressWithInProgress: initiative.progressWithInProgress || 0,
  }));

  const longestInitiative = basicData[0];

  return basicData.map((initiative) => {
    // Calculate relative modifier to longest initiative
    const relativeModifierToLongest = Maybe.fromNullable(
      longestInitiative.weeks > 0
        ? initiative.weeks / longestInitiative.weeks
        : 0,
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
    const safeProgress = safeValue(initiative.progress, 0, 100, 0);
    const safeInProgress = safeValue(
      initiative.progressWithInProgress,
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
      name: initiative.name,
      weeks: initiative.weeks,
      weeksDone: initiative.weeksDone,
      progress: safeProgress,
      trackLength,
      progressOnTrack,
      inprogressOnTrack,
    };
  });
};

/**
 * Extract track lengths from initiative chart data
 */
export const extractInitiativeTracks = (
  chartData: readonly InitiativeChartData[],
): readonly number[] => {
  return chartData.map((initiative) =>
    safeValue(initiative.trackLength, 1, 100, 1),
  );
};

/**
 * Extract progress values from initiative chart data
 */
export const extractInitiativeProgresses = (
  chartData: readonly InitiativeChartData[],
): readonly number[] => {
  return chartData.map((initiative) =>
    safeValue(initiative.progressOnTrack, 0, 100, 0),
  );
};

/**
 * Extract in-progress values from initiative chart data
 */
export const extractInitiativeInProgress = (
  chartData: readonly InitiativeChartData[],
): readonly number[] => {
  return chartData.map((initiative) =>
    safeValue(initiative.inprogressOnTrack, 0, 100, 0),
  );
};

/**
 * Validate chart options based on initiative count
 * Adjusts radial bar settings for better display with many initiatives
 */
export const validateChartOptions = <T extends { plotOptions?: unknown }>(
  options: T,
  initiativeCount: number,
): T => {
  const safeOptions = deepCopy(options);

  // For many initiatives, ensure we have enough space for the radial bars
  if (initiativeCount > 4) {
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
 * Generate CSS class name for initiative length styling
 */
export const getInitiativeLengthClass = (
  initiativeCount: number,
): Record<string, boolean> => {
  return {
    [`global-initiatives__details-${initiativeCount}`]: true,
    "global-initiatives__details-gt4": initiativeCount > 4,
  };
};
