import { match } from "ts-pattern";

/**
 * Status constants for cycle items and roadmap items
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
 * Normalize status string to match our constants using pattern matching
 * @param status - Raw status string
 * @returns Normalized status
 */
export const normalizeStatus = (status: string): string => {
  // Handle invalid input
  if (!status || typeof status !== "string") {
    return STATUS.TODO;
  }

  const normalized = status.toLowerCase().trim();

  // Use ts-pattern for exhaustive pattern matching with multiple patterns per case
  return match(normalized)
    .with("to do", "not started", "open", () => STATUS.TODO)
    .with(
      "in progress",
      "in-progress",
      "wip",
      "work in progress",
      () => STATUS.IN_PROGRESS,
    )
    .with("completed", "closed", "finished", () => STATUS.DONE)
    .with("cancelled", "canceled", () => STATUS.CANCELLED)
    .with("replanned", "rescheduled", () => STATUS.REPLANNED)
    .otherwise(() => normalized); // Return normalized if no pattern matches
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
