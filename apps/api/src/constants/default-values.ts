/**
 * Default values for unassigned, unknown, or uncategorised items
 * These constants ensure consistency across the API when dealing with
 * missing or undefined data
 */

/**
 * Default values for unknown or missing data
 */
export const DEFAULT_UNKNOWN = {
  ID: "unknown",
  NAME: "Unknown",
  DISPLAY_NAME: "Unknown",
} as const;

/**
 * Default values for teams
 */
export const DEFAULT_TEAM = {
  ID: "unknown",
  NAME: "Unknown Team",
} as const;

/**
 * Default values for stages
 */
export const DEFAULT_STAGE = {
  ID: "unknown",
  NAME: "Unknown",
} as const;

/**
 * Default values for ticket IDs
 */
export const DEFAULT_TICKET_ID = "unknown";

/**
 * Helper function to get default team ID
 * @param teamId - The team ID to check
 * @returns The team ID or default if null/undefined
 */
export const getDefaultTeamId = (teamId: string | null | undefined): string => {
  return teamId || DEFAULT_TEAM.ID;
};

/**
 * Helper function to get default stage
 * @param stage - The stage to check
 * @returns The stage or default if null/undefined
 */
export const getDefaultStage = (stage: string | null | undefined): string => {
  return stage || DEFAULT_STAGE.ID;
};

/**
 * Helper function to get default ticket ID
 * @param ticketId - The ticket ID to check
 * @returns The ticket ID or default if null/undefined
 */
export const getDefaultTicketId = (
  ticketId: string | null | undefined,
): string => {
  return ticketId || DEFAULT_TICKET_ID;
};
