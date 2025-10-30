/**
 * Cycle calculation utilities
 * Extracted from CycleProgressData class for reuse across the application
 */

import { Maybe } from "purify-ts";
import {
  STATUS,
  normalizeStatus,
  isCompletedStatus,
  isInProgressStatus,
} from "../constants/status-constants";
import type { ReleaseItem, Cycle } from "@omega/types";
import type { CycleMetadata, ProgressMetrics } from "../../types/ui-types";

/**
 * Normalize a number to one decimal place
 * @param {number} number - Number to normalize
 * @returns {number} Normalized number
 */
export const normalize = (number: number): number => {
  return Math.round(number * 10) / 10;
};

/**
 * Round a number to two decimal places
 * @param {number} number - Number to round
 * @returns {number} Rounded number
 */
export const roundToTwoDigit = (number: number): number => {
  return Math.round(number * 100) / 100;
};

/**
 * Parse effort from release item safely
 */
const parseEffort = (item: ReleaseItem): number =>
  Maybe.fromNullable(item.effort)
    .map((effort) =>
      typeof effort === "number" ? effort : parseFloat(String(effort)),
    )
    .filter((effort) => !isNaN(effort))
    .orDefault(0);

/**
 * Calculate progress metrics for release items
 * @param {ReleaseItem[]} releaseItems - Array of release items
 * @returns {ProgressMetrics} Progress metrics
 */
export const calculateReleaseItemProgress = (
  releaseItems: readonly ReleaseItem[],
): ProgressMetrics => {
  if (!Array.isArray(releaseItems) || releaseItems.length === 0) {
    return {
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

  // Filter out REPLANNED items for count calculation (functional with readonly)
  const nonReplannedItems = releaseItems.filter(
    (item) => normalizeStatus(item.status) !== STATUS.REPLANNED,
  );

  // Calculate total weeks from non-replanned items using functional reduce
  const weeks = roundToTwoDigit(
    nonReplannedItems.map(parseEffort).reduce((acc, effort) => acc + effort, 0),
  );

  // Count release items
  const releaseItemsCount = nonReplannedItems.length;

  // Calculate weeks by status using functional operations
  const completedItems = releaseItems.filter((item) =>
    isCompletedStatus(normalizeStatus(item.status)),
  );
  const weeksDone = completedItems
    .map(parseEffort)
    .reduce((acc, effort) => acc + effort, 0);
  const releaseItemsDoneCount = completedItems.length;

  const inProgressItems = releaseItems.filter((item) =>
    isInProgressStatus(normalizeStatus(item.status)),
  );
  const weeksInProgress = inProgressItems
    .map(parseEffort)
    .reduce((acc, effort) => acc + effort, 0);

  const todoItems = releaseItems.filter(
    (item) => normalizeStatus(item.status) === STATUS.TODO,
  );
  const weeksTodo = todoItems
    .map(parseEffort)
    .reduce((acc, effort) => acc + effort, 0);

  const postponedItems = releaseItems.filter(
    (item) => normalizeStatus(item.status) === STATUS.POSTPONED,
  );
  const weeksPostponed = postponedItems
    .map(parseEffort)
    .reduce((acc, effort) => acc + effort, 0);

  const cancelledItems = releaseItems.filter(
    (item) => normalizeStatus(item.status) === STATUS.CANCELLED,
  );
  const weeksCancelled = cancelledItems
    .map(parseEffort)
    .reduce((acc, effort) => acc + effort, 0);

  const weeksNotToDo = weeksPostponed + weeksCancelled;

  // Calculate percentages
  const progress = weeks > 0 ? Math.round((weeksDone / weeks) * 100) : 0;
  const progressWithInProgress =
    weeks > 0 ? Math.round(((weeksDone + weeksInProgress) / weeks) * 100) : 0;
  const progressByReleaseItems =
    releaseItemsCount > 0
      ? Math.round((releaseItemsDoneCount / releaseItemsCount) * 100)
      : 0;
  const percentageNotToDo =
    weeks > 0 ? Math.max(0, Math.round((weeksNotToDo / weeks) * 100)) : 0;

  return {
    weeks,
    weeksDone,
    weeksInProgress,
    weeksTodo,
    weeksNotToDo,
    weeksCancelled,
    weeksPostponed,
    releaseItemsCount,
    releaseItemsDoneCount,
    progress,
    progressWithInProgress,
    progressByReleaseItems,
    percentageNotToDo,
  };
};

/**
 * Calculate cycle metadata (months, days, percentages)
 * @param {Cycle} cycle - Cycle object with start, delivery, end dates
 * @returns {CycleMetadata} Cycle metadata
 */
export const calculateCycleMetadata = (cycle: Cycle): CycleMetadata => {
  if (!cycle || !cycle.start || !cycle.end) {
    return {
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    };
  }

  const startDate = new Date(cycle.start);
  const endDate = new Date(cycle.end);
  const now = new Date();

  // Check if dates are valid
  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime()) ||
    isNaN(now.getTime())
  ) {
    return {
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    };
  }

  const startMonth = startDate.toLocaleString("en-us", { month: "short" });
  const endMonth = endDate.toLocaleString("en-us", { month: "short" });

  // Calculate days using proper date arithmetic
  const daysFromStartOfCycle = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysInCycle = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const currentDayPercentage =
    daysInCycle > 0
      ? Math.round((daysFromStartOfCycle / daysInCycle) * 100)
      : 0;

  return {
    startMonth,
    endMonth,
    daysFromStartOfCycle: Math.max(0, daysFromStartOfCycle),
    daysInCycle: Math.max(0, daysInCycle),
    currentDayPercentage: Math.min(Math.max(0, currentDayPercentage), 100),
  };
};

/**
 * Aggregate progress metrics from multiple sources
 * @param {ProgressMetrics[]} metricsArray - Array of progress metrics objects
 * @returns {ProgressMetrics} Aggregated progress metrics
 */
export const aggregateProgressMetrics = (
  metricsArray: readonly ProgressMetrics[],
): ProgressMetrics => {
  if (!Array.isArray(metricsArray) || metricsArray.length === 0) {
    return {
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

  // Aggregate all numeric fields using functional reduce (readonly arrays work fine)
  const weeks = normalize(
    metricsArray.map((m) => m.weeks || 0).reduce((acc, val) => acc + val, 0),
  );

  const weeksDone = metricsArray
    .map((m) => m.weeksDone || 0)
    .reduce((acc, val) => acc + val, 0);

  const weeksInProgress = metricsArray
    .map((m) => m.weeksInProgress || 0)
    .reduce((acc, val) => acc + val, 0);

  const weeksTodo = metricsArray
    .map((m) => m.weeksTodo || 0)
    .reduce((acc, val) => acc + val, 0);

  const weeksNotToDo = metricsArray
    .map((m) => m.weeksNotToDo || 0)
    .reduce((acc, val) => acc + val, 0);

  const weeksCancelled = metricsArray
    .map((m) => m.weeksCancelled || 0)
    .reduce((acc, val) => acc + val, 0);

  const weeksPostponed = metricsArray
    .map((m) => m.weeksPostponed || 0)
    .reduce((acc, val) => acc + val, 0);

  const releaseItemsCount = metricsArray
    .map((m) => m.releaseItemsCount || 0)
    .reduce((acc, val) => acc + val, 0);

  const releaseItemsDoneCount = metricsArray
    .map((m) => m.releaseItemsDoneCount || 0)
    .reduce((acc, val) => acc + val, 0);

  // Calculate percentages
  const progress =
    weeks > 0 ? Math.max(0, Math.round((weeksDone / weeks) * 100)) : 0;

  const progressWithInProgress =
    weeks > 0
      ? Math.max(0, Math.round(((weeksDone + weeksInProgress) / weeks) * 100))
      : 0;

  const progressByReleaseItems =
    releaseItemsCount > 0
      ? Math.max(
          0,
          Math.round((releaseItemsDoneCount / releaseItemsCount) * 100),
        )
      : 0;

  const percentageNotToDo =
    weeks > 0 ? Math.max(0, Math.round((weeksNotToDo / weeks) * 100)) : 0;

  return {
    weeks,
    weeksDone,
    weeksInProgress,
    weeksTodo,
    weeksNotToDo,
    weeksCancelled,
    weeksPostponed,
    releaseItemsCount,
    releaseItemsDoneCount,
    progress,
    progressWithInProgress,
    progressByReleaseItems,
    percentageNotToDo,
  };
};
