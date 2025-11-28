// Low-level JIRA API wrapper
import { AgileClient, Version3Client } from "jira.js";
import type { JiraIssue, JiraSprint, JiraConfig } from "./types";

export class JiraClient {
  private agileClient: AgileClient;
  private version3Client: Version3Client;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    const authConfig = {
      host: config.connection.host,
      authentication: {
        basic: {
          email: config.connection.user,
          apiToken: config.connection.token,
        },
      },
    };

    this.agileClient = new AgileClient(authConfig);
    this.version3Client = new Version3Client(authConfig);
  }

  /**
   * Search for issues using JQL
   * @param jql - JQL query string
   * @param fields - Fields to retrieve (default: [])
   * @param boardId - Optional board ID. If provided, searches within the board context.
   *                  If not provided, uses the regular issue search API (better for Epic issues)
   */
  async searchIssues(
    jql: string,
    fields: string[] = [],
    boardId?: number,
  ): Promise<JiraIssue[]> {
    // If boardId is provided, use board-specific search
    if (boardId !== undefined) {
      const response = await this.agileClient.board.getIssuesForBoard({
        boardId,
        maxResults: 1000,
        jql,
        fields,
      });

      return (response as unknown as { issues: JiraIssue[] }).issues;
    }

    // Otherwise, use the regular issue search API (better for Epic issues that aren't on boards)
    // Use the new /rest/api/3/search/jql endpoint directly (jira.js method uses deprecated endpoint)
    const host = this.config.connection.host;
    const email = this.config.connection.user;
    const apiToken = this.config.connection.token;

    if (!host || !email || !apiToken) {
      throw new Error("Jira configuration incomplete");
    }

    // Make direct HTTP call to the new POST search endpoint
    const response = await fetch(`${host}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
      },
      body: JSON.stringify({
        jql,
        maxResults: 1000,
        fields: fields && fields.length > 0 ? fields : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Jira API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = (await response.json()) as { issues?: unknown[] };
    const rawIssues = (data.issues || []) as unknown[];

    // Normalize issues to ensure required shape for downstream parsing
    const issues: JiraIssue[] = rawIssues.map((raw: unknown) => {
      const issue = raw as Partial<JiraIssue> & {
        fields?: Record<string, unknown>;
      };
      const fieldsObj = (issue.fields ?? {}) as Record<string, unknown>;

      // Ensure minimal required fields exist
      fieldsObj.labels = (fieldsObj.labels as string[] | undefined) ?? [];
      fieldsObj.status =
        (fieldsObj.status as { id: string; name: string } | undefined) ??
        ({ id: "", name: "" } as const);
      fieldsObj.issuetype =
        (fieldsObj.issuetype as
          | { id: string; name: string; subtask: boolean }
          | undefined) ?? ({ id: "", name: "", subtask: false } as const);

      return {
        id: (issue as JiraIssue).id,
        key: (issue as JiraIssue).key,
        fields: fieldsObj as unknown as JiraIssue["fields"],
        expand: (issue as JiraIssue).expand,
      } as JiraIssue;
    });

    return issues;
  }

  /**
   * Get all sprints for a board
   */
  async getSprints(boardId: number): Promise<JiraSprint[]> {
    const response = await this.agileClient.board.getAllSprints({
      boardId,
      state: "active,closed,future",
    });

    return response.values as JiraSprint[];
  }

  /**
   * Get a specific issue by key
   */
  async getIssue(key: string): Promise<JiraIssue> {
    const response = await this.version3Client.issues.getIssue({
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
    const response = await this.agileClient.board.getBoardIssuesForSprint({
      maxResults: 1000,
      boardId,
      sprintId: Number(sprintId),
      fields,
    });

    return (response as { issues: JiraIssue[] }).issues;
  }
}
