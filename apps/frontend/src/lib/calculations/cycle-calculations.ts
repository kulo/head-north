/**
 * Cycle calculation utilities
 * Extracted from CycleProgressData class for reuse across the application
 */

import { STATUS, normalizeStatus, isCompletedStatus, isInProgressStatus, isNotToDoStatus } from '../constants/status-constants'

/**
 * Normalize a number to one decimal place
 * @param {number} number - Number to normalize
 * @returns {number} Normalized number
 */
export const normalize = (number) => {
  return Math.round(number * 10) / 10
}

/**
 * Round a number to two decimal places
 * @param {number} number - Number to round
 * @returns {number} Rounded number
 */
export const roundToTwoDigit = (number) => {
  return Math.round(number * 100) / 100
}

/**
 * Calculate progress metrics for release items
 * @param {Array} releaseItems - Array of release items
 * @returns {Object} Progress metrics
 */
export const calculateReleaseItemProgress = (releaseItems) => {
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
      percentageNotToDo: 0
    }
  }

  let weeks = 0
  let weeksDone = 0
  let weeksInProgress = 0
  let weeksTodo = 0
  let weeksNotToDo = 0
  let weeksCancelled = 0
  let weeksPostponed = 0
  let releaseItemsCount = 0
  let releaseItemsDoneCount = 0

  releaseItems.forEach((releaseItem) => {
    const effort = parseFloat(releaseItem.effort) || 0
    const status = normalizeStatus(releaseItem.status)

    if (status !== STATUS.REPLANNED) {
      weeks += effort
      releaseItemsCount += 1
    }

    if (status === STATUS.TODO) {
      weeksTodo += effort
    } else if (isCompletedStatus(status)) {
      weeksDone += effort
      releaseItemsDoneCount += 1
    } else if (isInProgressStatus(status)) {
      weeksInProgress += effort
    } else if (status === STATUS.POSTPONED) {
      weeksNotToDo += effort
      weeksPostponed += effort
    } else if (status === STATUS.CANCELLED) {
      weeksNotToDo += effort
      weeksCancelled += effort
    }
  })

  weeks = roundToTwoDigit(weeks)
  const progress = weeks > 0 ? Math.round((weeksDone / weeks) * 100) : 0
  const progressWithInProgress = weeks > 0 ? Math.round(((weeksDone + weeksInProgress) / weeks) * 100) : 0
  const progressByReleaseItems = releaseItemsCount > 0 ? Math.round((releaseItemsDoneCount / releaseItemsCount) * 100) : 0
  const percentageNotToDo = weeks > 0 ? Math.round((weeksNotToDo / weeks) * 100) : 0

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
    percentageNotToDo
  }
}

/**
 * Calculate cycle metadata (months, days, percentages)
 * @param {Object} cycle - Cycle object with start, delivery, end dates
 * @returns {Object} Cycle metadata
 */
export const calculateCycleMetadata = (cycle) => {
  if (!cycle || !cycle.delivery || !cycle.end) {
    return {
      startMonth: '',
      endMonth: '',
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0
    }
  }

  const startDate = new Date(cycle.delivery)
  const endDate = new Date(cycle.end)
  const now = new Date()

  const startMonth = startDate.toLocaleString('en-us', { month: 'short' })
  const endMonth = endDate.toLocaleString('en-us', { month: 'short' })
  const daysFromStartOfCycle = Math.floor(Math.abs(startDate - now) / 1000 / 86400)
  const daysInCycle = Math.floor(Math.abs(startDate - endDate) / 1000 / 86400)
  const currentDayPercentage = daysInCycle > 0 ? Math.round((daysFromStartOfCycle / daysInCycle) * 100) : 0

  return {
    startMonth,
    endMonth,
    daysFromStartOfCycle,
    daysInCycle,
    currentDayPercentage: Math.min(currentDayPercentage, 100)
  }
}

/**
 * Aggregate progress metrics from multiple sources
 * @param {Array} metricsArray - Array of progress metrics objects
 * @returns {Object} Aggregated progress metrics
 */
export const aggregateProgressMetrics = (metricsArray) => {
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
      percentageNotToDo: 0
    }
  }

  const aggregated = metricsArray.reduce((acc, metrics) => {
    acc.weeks += metrics.weeks || 0
    acc.weeksDone += metrics.weeksDone || 0
    acc.weeksInProgress += metrics.weeksInProgress || 0
    acc.weeksTodo += metrics.weeksTodo || 0
    acc.weeksNotToDo += metrics.weeksNotToDo || 0
    acc.weeksCancelled += metrics.weeksCancelled || 0
    acc.weeksPostponed += metrics.weeksPostponed || 0
    acc.releaseItemsCount += metrics.releaseItemsCount || 0
    acc.releaseItemsDoneCount += metrics.releaseItemsDoneCount || 0
    return acc
  }, {
    weeks: 0,
    weeksDone: 0,
    weeksInProgress: 0,
    weeksTodo: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    releaseItemsCount: 0,
    releaseItemsDoneCount: 0
  })

  // Calculate percentages
  aggregated.weeks = normalize(aggregated.weeks)
  aggregated.progress = aggregated.weeks > 0 ? Math.round((aggregated.weeksDone / aggregated.weeks) * 100) : 0
  aggregated.progressWithInProgress = aggregated.weeks > 0 ? Math.round(((aggregated.weeksDone + aggregated.weeksInProgress) / aggregated.weeks) * 100) : 0
  aggregated.progressByReleaseItems = aggregated.releaseItemsCount > 0 ? Math.round((aggregated.releaseItemsDoneCount / aggregated.releaseItemsCount) * 100) : 0
  aggregated.percentageNotToDo = aggregated.weeks > 0 ? Math.round((aggregated.weeksNotToDo / aggregated.weeks) * 100) : 0

  return aggregated
}
