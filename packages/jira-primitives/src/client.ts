// Low-level JIRA API wrapper
import { AgileClient } from "jira.js";
import type { JiraIssue, JiraSprint, JiraConfig } from "./types";

export class JiraClient {
  private client: AgileClient;

  constructor(config: JiraConfig) {
    this.client = new AgileClient({
      host: config.connection.host,
      authentication: {
        basic: {
          email: config.connection.user,
          apiToken: config.connection.token,
        },
      },
    });
  }

  /**
   * Search for issues using JQL
   */
  async searchIssues(jql: string, fields: string[] = []): Promise<JiraIssue[]> {
    const response = await this.client.board.getIssuesForBoard({
      boardId: 0, // Will be overridden by adapter
      maxResults: 1000,
      jql,
      fields,
    });

    return (response as { issues: JiraIssue[] }).issues;
  }

  /**
   * Get all sprints for a board
   */
  async getSprints(boardId: number): Promise<JiraSprint[]> {
    const response = await this.client.board.getAllSprints({
      boardId,
      state: "active,closed,future",
    });

    return response.values as JiraSprint[];
  }

  /**
   * Get a specific issue by key
   */
  async getIssue(key: string): Promise<JiraIssue> {
    const response = await this.client.issue.getIssue({
      issueIdOrKey: key,
    });

    return response as unknown as JiraIssue;
  }

  /**
   * Get issues for a specific sprint
   */
  async getIssuesForSprint(
    sprintId: string | number,
    boardId: number,
    fields: string[] = [],
  ): Promise<JiraIssue[]> {
    const response = await this.client.board.getBoardIssuesForSprint({
      maxResults: 1000,
      boardId,
      sprintId: Number(sprintId),
      fields,
    });

    return (response as { issues: JiraIssue[] }).issues;
  }
}
