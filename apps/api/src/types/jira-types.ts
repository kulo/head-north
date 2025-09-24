// Jira-specific Types
// These types represent the Jira domain and should be shielded from the Omega domain

import type {
  JiraSprint,
  JiraIssue,
  JiraIssueFields,
  JiraUser,
  JiraApiResponse,
  JiraSprintData,
  JiraIssueData,
} from "./api-response-types";

// Re-export commonly used types for backward compatibility
export type Sprint = JiraSprint;
export type JiraAssignee = JiraUser;
export type JiraReporter = JiraUser;

// ============================================================================
// Jira API Response Types (Legacy compatibility)
// ============================================================================

export type JiraIssueResponse = JiraApiResponse<JiraIssue>;
export type JiraSprintResponse = JiraApiResponse<JiraSprint>;

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
