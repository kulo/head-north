/**
 * Status constants for release items and roadmap items
 * Extracted from the original AreaData class for reuse across the application
 */
export const STATUS = {
  TODO: "todo",
  IN_PROGRESS: "inprogress",
  DONE: "done",
  POSTPONED: "postponed",
  CANCELLED: "cancelled",
  REPLANNED: "replanned",
};

/**
 * Normalize status string to match our constants
 * @param status - Raw status string
 * @returns Normalized status
 */
export const normalizeStatus = (status: string): string => {
  if (!status || typeof status !== "string") {
    return STATUS.TODO;
  }

  const normalized = status.toLowerCase().trim();

  // Map common variations to our constants
  const statusMap = {
    "to do": STATUS.TODO,
    "not started": STATUS.TODO,
    open: STATUS.TODO,
    "in progress": STATUS.IN_PROGRESS,
    "in-progress": STATUS.IN_PROGRESS,
    wip: STATUS.IN_PROGRESS,
    "work in progress": STATUS.IN_PROGRESS,
    completed: STATUS.DONE,
    closed: STATUS.DONE,
    finished: STATUS.DONE,
    cancelled: STATUS.CANCELLED,
    canceled: STATUS.CANCELLED,
    replanned: STATUS.REPLANNED,
    rescheduled: STATUS.REPLANNED,
  };

  return statusMap[normalized] || normalized;
};

/**
 * Check if a status represents completed work
 * @param status - Status to check
 * @returns True if status represents completed work
 */
export const isCompletedStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === STATUS.DONE;
};

/**
 * Check if a status represents work in progress
 * @param status - Status to check
 * @returns True if status represents work in progress
 */
export const isInProgressStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === STATUS.IN_PROGRESS;
};

/**
 * Check if a status represents work that won't be done
 * @param status - Status to check
 * @returns True if status represents cancelled or postponed work
 */
export const isNotToDoStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === STATUS.CANCELLED || normalized === STATUS.POSTPONED;
};
