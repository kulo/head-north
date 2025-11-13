// Pure JIRA Types - No Head North concepts mixed in
// These types represent the JIRA domain and should be shielded from the Head North domain

import type { ISODateString } from "@headnorth/types";

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
  areaIds?: string[];
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
  statusMappings: Record<string, string>;
  statusCategories: Record<string, string>;
  limits: {
    maxResults: number;
  };
  fields: Record<string, string>;
  connection: {
    host: string;
    user: string;
    token: string;
    boardId: number;
  };
}
