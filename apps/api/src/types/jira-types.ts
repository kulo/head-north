// Jira-specific Types
// These types represent the Jira domain and should be shielded from the Head North domain

import type { ISODateString, AreaId, Person } from "@headnorth/types";
import type {
  JiraStatusMappings,
  JiraStatusCategories,
  JiraLimits,
  JiraFields,
  JiraConnection,
} from "@headnorth/config";

/**
 * Standard JIRA sprint object from Agile API
 * Used when fetching sprints via getSprints() and in issue.fields.sprint
 */
export interface JiraSprint {
  id: string | number;
  name: string;
  state: "active" | "closed" | "future";
  startDate: ISODateString;
  endDate: ISODateString;
  originBoardId?: number;
  goal?: string;
}

/**
 * Minimal type for sprint data stored in custom fields.
 * Only the `id` field is actually extracted by extractSprintId().
 * Custom fields can be an array or single object (e.g., customfield_10021).
 */
export type JiraSprintFieldId = {
  id?: string | number;
  [key: string]: unknown; // Allow other fields but we only use id
};

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
  expand?: string;
  // Custom properties added during parsing
  roadmapItemId?: string;
  cycleId?: string | number;
  effort?: number;
  summary?: string;
  areaIds?: AreaId[];
  teams?: string[];
  status?: string;
  url?: string;
  isExternal?: boolean;
  stage?: string;
  assignee?: Person | Record<string, unknown>;
  validations?: unknown[];
}

export interface JiraIssueFields {
  summary: string;
  status: JiraStatus;
  assignee: JiraUser | null;
  reporter?: JiraUser;
  effort?: number;
  labels: string[];
  parent?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
    };
  };
  issuetype: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    subtask: boolean;
  };
  area?: string;
  sprint?: JiraSprint | null;
  teams?: string[];
  areaIds?: AreaId[];
  created?: ISODateString;
  updated?: ISODateString;
  customfield_10002?: number; // Effort field
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory?: {
    id: number;
    key: string;
    colorName: string;
    name: string;
  };
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
  active: boolean;
  timeZone?: string;
}

export interface JiraRoadmapItemData {
  summary: string;
  labels: string[];
}

export type JiraRoadmapItemsData = Record<string, JiraRoadmapItemData>;

export interface JiraConfig {
  statusMappings: JiraStatusMappings;
  statusCategories: JiraStatusCategories;
  limits: JiraLimits;
  fields: JiraFields;
  connection: JiraConnection;
}
