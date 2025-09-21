/**
 * Status constants for release items and roadmap items
 * Extracted from the original AreaData class for reuse across the application
 */
export const STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'inprogress',
  DONE: 'done',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
  REPLANNED: 'replanned'
}

/**
 * Normalize status string to match our constants
 * @param {string} status - Raw status string
 * @returns {string} Normalized status
 */
export const normalizeStatus = (status) => {
  if (!status || typeof status !== 'string') {
    return STATUS.TODO
  }
  
  const normalized = status.toLowerCase().trim()
  
  // Map common variations to our constants
  const statusMap = {
    'to do': STATUS.TODO,
    'not started': STATUS.TODO,
    'open': STATUS.TODO,
    'in progress': STATUS.IN_PROGRESS,
    'in-progress': STATUS.IN_PROGRESS,
    'wip': STATUS.IN_PROGRESS,
    'work in progress': STATUS.IN_PROGRESS,
    'completed': STATUS.DONE,
    'closed': STATUS.DONE,
    'finished': STATUS.DONE,
    'cancelled': STATUS.CANCELLED,
    'canceled': STATUS.CANCELLED,
    'replanned': STATUS.REPLANNED,
    'rescheduled': STATUS.REPLANNED
  }
  
  return statusMap[normalized] || normalized
}

/**
 * Check if a status represents completed work
 * @param {string} status - Status to check
 * @returns {boolean} True if status represents completed work
 */
export const isCompletedStatus = (status) => {
  const normalized = normalizeStatus(status)
  return normalized === STATUS.DONE
}

/**
 * Check if a status represents work in progress
 * @param {string} status - Status to check
 * @returns {boolean} True if status represents work in progress
 */
export const isInProgressStatus = (status) => {
  const normalized = normalizeStatus(status)
  return normalized === STATUS.IN_PROGRESS
}

/**
 * Check if a status represents work that won't be done
 * @param {string} status - Status to check
 * @returns {boolean} True if status represents cancelled or postponed work
 */
export const isNotToDoStatus = (status) => {
  const normalized = normalizeStatus(status)
  return normalized === STATUS.CANCELLED || normalized === STATUS.POSTPONED
}
