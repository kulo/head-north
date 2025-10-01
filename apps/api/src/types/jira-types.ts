// Jira-specific Types
// These types represent the Jira domain and should be shielded from the Omega domain

import type {
  JiraSprint,
  JiraIssueFields,
  JiraUser,
  JiraSprintData,
  JiraIssueData,
  ApiResponse,
} from "./api-response-types";
import type { ISODateString } from "@omega/types";

// Re-export commonly used types for backward compatibility
export type JiraSprintAlias = JiraSprint;
export type JiraAssignee = JiraUser;
export type JiraReporter = JiraUser;

// ============================================================================
// Jira API Response Types (Legacy compatibility)
// ============================================================================

export type JiraIssueResponse = ApiResponse<JiraIssue>;
export type JiraSprintResponse = ApiResponse<JiraSprint>;

// ============================================================================
// Jira Domain Types
// ============================================================================

export interface JiraIssue {
  id: string;
  key: string;
  fields: Record<string, unknown>;
  expand?: string;
}

export interface Sprint {
  id: string | number;
  name: string;
  startDate: ISODateString;
  endDate: ISODateString;
  state: "active" | "closed" | "future";
}

// ============================================================================
// Jira Configuration Types
// ============================================================================

export interface JiraFields {
  epic: string;
  sprint: string;
  storyPoints: string;
}

export interface JiraConnection {
  user: string | null;
  token: string | null;
  host: string | null;
  boardId: number;
}

export interface JiraStatusMappings {
  [statusId: string]: string;
}

export interface JiraStatusCategories {
  finished: string[];
  active: string[];
  future: string[];
}

export interface JiraLimits {
  maxResults: number;
  maxIssuesPerRequest: number;
}

export interface JiraConfig {
  statusMappings: JiraStatusMappings;
  statusCategories: JiraStatusCategories;
  limits: JiraLimits;
  fields: JiraFields;
  connection: JiraConnection;
}
