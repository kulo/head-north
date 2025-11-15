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
import type { CycleItem, Cycle } from "@headnorth/types";
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
 * Parse effort from cycle item safely
 */
const parseEffort = (item: CycleItem): number =>
  Maybe.fromNullable(item.effort)
    .map((effort) =>
      typeof effort === "number" ? effort : parseFloat(String(effort)),
    )
    .filter((effort) => !isNaN(effort))
    .orDefault(0);

/**
 * Helper: Calculate sum of efforts for items matching a predicate
 * Pure functional composition for repeated pattern
 */
const sumEfforts = (
  items: readonly CycleItem[],
  predicate?: (item: CycleItem) => boolean,
): number => {
  const filteredItems = predicate ? items.filter(predicate) : items;
  return roundToTwoDigit(
    filteredItems.map(parseEffort).reduce((acc, effort) => acc + effort, 0),
  );
};

/**
 * Helper: Count items matching a predicate
 */
const countItems = <T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
): number => items.filter(predicate).length;

/**
 * Calculate progress metrics for cycle items
 * @param {CycleItem[]} cycleItems - Array of cycle items
 * @returns {ProgressMetrics} Progress metrics
 */
export const calculateCycleItemProgress = (
  cycleItems: readonly CycleItem[],
): ProgressMetrics => {
  if (!Array.isArray(cycleItems) || cycleItems.length === 0) {
    return {
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
    };
  }

  // Filter out REPLANNED items for count calculation (functional with readonly)
  const isNotReplanned = (item: CycleItem): boolean =>
    normalizeStatus(item.status) !== STATUS.REPLANNED;
  const nonReplannedItems = cycleItems.filter(isNotReplanned);

  // Calculate total weeks from non-replanned items using functional helper
  const weeks = sumEfforts(nonReplannedItems);

  // Count cycle items
  const cycleItemsCount = nonReplannedItems.length;

  // Calculate weeks by status using functional composition helpers
  const isCompleted = (item: CycleItem): boolean =>
    isCompletedStatus(normalizeStatus(item.status));
  const weeksDone = sumEfforts(cycleItems, isCompleted);
  const cycleItemsDoneCount = countItems(cycleItems, isCompleted);

  const isInProgress = (item: CycleItem): boolean =>
    isInProgressStatus(normalizeStatus(item.status));
  const weeksInProgress = sumEfforts(cycleItems, isInProgress);

  const isTodo = (item: CycleItem): boolean =>
    normalizeStatus(item.status) === STATUS.TODO;
  const weeksTodo = sumEfforts(cycleItems, isTodo);

  const isPostponed = (item: CycleItem): boolean =>
    normalizeStatus(item.status) === STATUS.POSTPONED;
  const weeksPostponed = sumEfforts(cycleItems, isPostponed);

  const isCancelled = (item: CycleItem): boolean =>
    normalizeStatus(item.status) === STATUS.CANCELLED;
  const weeksCancelled = sumEfforts(cycleItems, isCancelled);

  const weeksNotToDo = weeksPostponed + weeksCancelled;

  // Calculate percentages
  const progress = weeks > 0 ? Math.round((weeksDone / weeks) * 100) : 0;
  const progressWithInProgress =
    weeks > 0 ? Math.round(((weeksDone + weeksInProgress) / weeks) * 100) : 0;
  const progressByCycleItems =
    cycleItemsCount > 0
      ? Math.round((cycleItemsDoneCount / cycleItemsCount) * 100)
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
    cycleItemsCount,
    cycleItemsDoneCount,
    progress,
    progressWithInProgress,
    progressByCycleItems,
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
      cycleItemsCount: 0,
      cycleItemsDoneCount: 0,
      progress: 0,
      progressWithInProgress: 0,
      progressByCycleItems: 0,
      percentageNotToDo: 0,
    };
  }

  /**
   * Helper: Sum a field from all metrics
   */
  const sumField = (
    field: keyof ProgressMetrics,
    useNormalize = false,
  ): number => {
    const sum = metricsArray
      .map((m) => (m[field] as number) || 0)
      .reduce((acc, val) => acc + val, 0);
    return useNormalize ? normalize(sum) : sum;
  };

  // Aggregate all numeric fields using functional helper
  const weeks = sumField("weeks", true);
  const weeksDone = sumField("weeksDone");
  const weeksInProgress = sumField("weeksInProgress");
  const weeksTodo = sumField("weeksTodo");
  const weeksNotToDo = sumField("weeksNotToDo");
  const weeksCancelled = sumField("weeksCancelled");
  const weeksPostponed = sumField("weeksPostponed");
  const cycleItemsCount = sumField("cycleItemsCount");
  const cycleItemsDoneCount = sumField("cycleItemsDoneCount");

  // Calculate percentages
  const progress =
    weeks > 0 ? Math.max(0, Math.round((weeksDone / weeks) * 100)) : 0;

  const progressWithInProgress =
    weeks > 0
      ? Math.max(0, Math.round(((weeksDone + weeksInProgress) / weeks) * 100))
      : 0;

  const progressByCycleItems =
    cycleItemsCount > 0
      ? Math.max(0, Math.round((cycleItemsDoneCount / cycleItemsCount) * 100))
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
    cycleItemsCount,
    cycleItemsDoneCount,
    progress,
    progressWithInProgress,
    progressByCycleItems,
    percentageNotToDo,
  };
};
