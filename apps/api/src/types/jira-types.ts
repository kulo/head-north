// Jira-specific Types
// These types represent the Jira domain and should be shielded from the Omega domain

// ============================================================================
// Jira Sprint Types
// ============================================================================

/**
 * Sprint interface for Jira domain (different from Cycle)
 * This represents a Jira sprint with its metadata
 */
export interface Sprint {
  id: string | number;
  name: string;
  state: string;
  startDate: string;
  endDate: string;
}

// ============================================================================
// Jira Issue Types
// ============================================================================

export interface JiraIssueFields {
  summary: string;
  description?: string;
  status: { id: string; name: string };
  assignee: JiraAssignee | null;
  reporter?: JiraReporter;
  effort?: number;
  externalRoadmap?: string;
  labels: string[];
  parent?: { key: string };
  issuetype: { name: string };
  area?: string;
  initiativeId?: string;
  url?: string;
  sprint?: Sprint | null;
  teams?: string[];
  areaIds?: string[];
  created?: string;
  updated?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
  parent?: string;
  created?: string;
  updated?: string;
}

export interface JiraAssignee {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
}

export interface JiraReporter {
  accountId: string;
  displayName: string;
  emailAddress?: string;
}

// ============================================================================
// Jira API Response Types
// ============================================================================

export interface JiraApiResponse<T = unknown> {
  expand?: string;
  startAt: number;
  maxResults: number;
  total: number;
  values: T[];
}

export type JiraIssueResponse = JiraApiResponse<JiraIssue>;

export type JiraSprintResponse = JiraApiResponse<Sprint>;

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
