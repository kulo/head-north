// Jira-specific Types
// These types represent the Jira domain and should be shielded from the Omega domain

import type { ISODateString, AreaId, Person } from "@omega/types";
import type {
  JiraStatusMappings,
  JiraStatusCategories,
  JiraLimits,
  JiraFields,
  JiraConnection,
} from "@omega/config";

export interface JiraSprintsData {
  sprints: JiraSprint[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraSprint {
  id: string | number;
  name: string;
  state: "active" | "closed" | "future";
  startDate: ISODateString;
  endDate: ISODateString;
  originBoardId?: number;
  goal?: string;
}

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
  validations?: any[];
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
