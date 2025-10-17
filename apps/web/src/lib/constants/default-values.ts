/**
 * Default values for unassigned, unknown, or uncategorised items
 * These constants ensure consistency across the application when dealing with
 * missing or undefined data
 */

/**
 * Default values for initiatives
 */
export const DEFAULT_INITIATIVE = {
  ID: "unassigned",
  NAME: "Unassigned Initiative",
} as const;

/**
 * Default values for assignees
 */
export const DEFAULT_ASSIGNEE = {
  ID: "unassigned",
  NAME: "Unassigned",
  DISPLAY_NAME: "Unassigned",
} as const;

/**
 * Default values for unknown or missing data
 */
export const DEFAULT_UNKNOWN = {
  ID: "unknown",
  NAME: "Unknown",
  DISPLAY_NAME: "Unknown",
} as const;

/**
 * Default values for areas
 */
export const DEFAULT_AREA = {
  ID: "uncategorised",
  NAME: "Uncategorised",
} as const;

/**
 * Default values for stages
 */
export const DEFAULT_STAGE = {
  ID: "unknown",
  NAME: "Unknown",
} as const;

/**
 * Default values for status
 */
export const DEFAULT_STATUS = {
  ID: "unknown",
  NAME: "Unknown",
} as const;

/**
 * Helper function to get default initiative ID
 * @param initiativeId - The initiative ID to check
 * @returns The initiative ID or default if null/undefined
 */
export const getDefaultInitiativeId = (
  initiativeId: string | null | undefined,
): string => {
  return initiativeId || DEFAULT_INITIATIVE.ID;
};

/**
 * Helper function to get default assignee name
 * @param assignee - The assignee to check
 * @returns The assignee name or default if null/undefined
 */
export const getDefaultAssigneeName = (assignee: unknown): string => {
  if (!assignee) {
    return DEFAULT_ASSIGNEE.NAME;
  }

  if (typeof assignee === "string") {
    return assignee;
  }

  if (typeof assignee === "object" && assignee !== null) {
    const assigneeObj = assignee as {
      displayName?: string;
      accountId?: string;
    };
    return (
      assigneeObj.displayName || assigneeObj.accountId || DEFAULT_ASSIGNEE.NAME
    );
  }

  return DEFAULT_ASSIGNEE.NAME;
};

/**
 * Helper function to get default area name
 * @param area - The area to check
 * @returns The area name or default if null/undefined
 */
export const getDefaultAreaName = (area: unknown): string => {
  if (!area) {
    return DEFAULT_AREA.NAME;
  }

  if (typeof area === "string") {
    return area;
  }

  if (typeof area === "object" && area !== null) {
    const areaObj = area as { name?: string };
    return areaObj.name || DEFAULT_AREA.NAME;
  }

  return DEFAULT_AREA.NAME;
};
