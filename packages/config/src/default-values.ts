/**
 * Default values for unassigned, unknown, or uncategorised items
 * These constants ensure consistency across the application when dealing with
 * missing or undefined data
 *
 * This implementation satisfies the DefaultValues interface defined in @headnorth/types
 */

import type { DefaultValues, TicketId } from "@headnorth/types";

export const defaultValues: DefaultValues = {
  DEFAULT_OBJECTIVE: {
    ID: "unassigned",
    NAME: "Unassigned Objective",
  },
  DEFAULT_ASSIGNEE: {
    ID: "unassigned",
    NAME: "Unassigned",
  },
  DEFAULT_PRODUCT_AREA: {
    ID: "unassigned-teams",
    NAME: "Unassigned Teams",
  },
  DEFAULT_RELEASE_STAGE: {
    ID: "non-customer-facing",
    NAME: "Non-Customer Facing",
  },
  DEFAULT_STATUS: {
    ID: "unknown",
    NAME: "Unknown",
  },
  DEFAULT_TEAM: {
    ID: "unknown",
    NAME: "Unknown Team",
  },
  DEFAULT_TICKET_ID: "unknown" as TicketId,
} as const satisfies DefaultValues;
