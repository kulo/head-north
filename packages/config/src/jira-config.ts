// Jira Configuration Types
// These are kept in config for now but should eventually move to API package

import type { Either } from "purify-ts";
import { validateJiraConfig } from "./jira-config-validation";

export default class JiraConfig {
  private processEnv: Record<string, string | undefined>;
  private useFakeData: boolean;

  constructor(
    processEnv: Record<string, string | undefined> = {},
    useFakeData: boolean = false,
  ) {
    this.processEnv = processEnv;
    this.useFakeData = useFakeData;
  }

  getConfig(): JiraConfigData {
    return {
      statusMappings: {},
      statusCategories: {
        finished: [],
        active: [],
        future: [],
      },
      limits: {
        maxResults: 1000,
        maxIssuesPerRequest: 100,
      },
      fields: {
        epic: this.processEnv.HN_JIRA_FIELD_EPIC || undefined,
        sprint: this.processEnv.HN_JIRA_FIELD_SPRINT || undefined,
        storyPoints: this.processEnv.HN_JIRA_FIELD_STORY_POINTS || undefined,
      } as JiraFields,
      connection: {
        user: this.processEnv.HN_JIRA_USER || null,
        token: this.processEnv.HN_JIRA_TOKEN || null,
        host: this.processEnv.HN_JIRA_HOST || null,
        boardId: Number(this.processEnv.HN_JIRA_BOARD_ID),
      },
    };
  }

  /**
   * Get validated JIRA configuration
   * Returns Either with validation errors if configuration is invalid
   */
  getValidatedConfig(): Either<Error, JiraConfigData> {
    return validateJiraConfig(this.getConfig());
  }
}

export type JiraFields = Partial<{
  epic: string;
  sprint: string;
  storyPoints: string;
}>;

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

export interface JiraConfigData {
  statusMappings: JiraStatusMappings;
  statusCategories: JiraStatusCategories;
  limits: JiraLimits;
  fields: JiraFields;
  connection: JiraConnection;
}

export interface BackendConfigWithJira {
  port?: string;
  maxRetry?: string;
  delayBetweenRetry?: string;
  jira?: JiraConfigData;
  useFakeData?: boolean;
}

// Re-export validation function
export { validateJiraConfig } from "./jira-config-validation";
