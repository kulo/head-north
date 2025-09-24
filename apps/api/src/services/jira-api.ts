import { AgileClient } from "jira.js";
import pkg from "lodash";
const { omit, get } = pkg;
import type { OmegaConfig } from "@omega/config";

class JiraAPI {
  private omegaConfig: OmegaConfig;
  private _client: AgileClient;

  constructor(omegaConfig: OmegaConfig) {
    this.omegaConfig = omegaConfig;
    this._client = this._createClient();
  }

  /**
   * Get all sprints data (raw from Jira)
   * @returns Raw sprint data
   */
  async getSprintsData(): Promise<{ sprints: any[] }> {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const sprints = await this._client.board.getAllSprints({
      boardId: jiraConfig?.connection?.boardId || 0,
      state: "active,closed,future",
    });

    return { sprints: sprints.values };
  }

  /**
   * Get roadmap items data (raw from Jira)
   * @returns Raw roadmap items data
   */
  async getRoadmapItemsData(): Promise<Record<string, any>> {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const response = await this._client.board.getIssuesForBoard({
      boardId: jiraConfig?.connection?.boardId || 0,
      maxResults: jiraConfig?.limits?.maxResults || 100,
      jql: 'issuetype = "Roadmap Item"',
      fields: ["summary", "labels", "customfield_10000", "customfield_10001"], // Using generic field names for now
    });

    const roadmapItemData = response.issues.map((issue) => ({
      [issue.key as string]: {
        summary: issue.fields?.summary || "",
        labels: issue.fields?.labels || [],
        externalRoadmap: get(issue, "fields.customfield_10000.value"),
        externalRoadmapDescription: get(issue, "fields.customfield_10001"),
      },
    }));

    return Object.assign({}, ...roadmapItemData);
  }

  /**
   * Get release items data (raw from Jira)
   * @returns Raw release items data
   */
  async getReleaseItemsData(): Promise<any[]> {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const issues = await this._client.board.getIssuesForBoard({
      boardId: jiraConfig?.connection?.boardId || 0,
      maxResults: jiraConfig?.limits?.maxResults || 100,
      jql: 'issuetype = "Release Item"',
      fields: [
        "parent",
        "result",
        "summary",
        "closedSprints",
        "status",
        "sprint",
      ],
    });

    return issues.issues
      .map((issue) => ({
        id: issue.key,
        summary: issue.fields?.summary || "",
        closedSprints: get(issue, "fields.closedSprints", []),
        parent: get(issue, "fields.parent.key"),
        status: get(issue, "fields.status"),
        sprint: get(issue, "fields.sprint"),
        roadmapItemId: get(issue, "fields.parent.key"), // Foreign key
        cycleId: get(issue, "fields.sprint.id"), // Foreign key
      }))
      .filter((x) => !!x.parent)
      .filter((x) => !(x.sprint === null && (x.status as any)?.name === "Done"))
      .filter((x) => (x.status as any)?.name !== "Cancelled");
  }

  /**
   * Get issues for a specific sprint (raw from Jira)
   * @param sprintId - Sprint ID
   * @param extraFields - Additional fields to fetch
   * @returns Raw issues data
   */
  async getIssuesForSprint(
    sprintId: string | number,
    extraFields: string[] = [],
  ): Promise<any[]> {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const response = await this._client.board.getBoardIssuesForSprint({
      maxResults: jiraConfig?.limits?.maxResults || 100,
      boardId: jiraConfig?.connection?.boardId || 0,
      sprintId: Number(sprintId),
      jql: 'issuetype = "Release Item"',
      fields: [
        "parent",
        "summary",
        "customfield_10002",
        "customfield_10000",
        "status",
        "labels",
        "assignee",
        "reporter",
        "sprint",
        "closedSprints",
      ].concat(extraFields),
    });

    return (response as any).issues.map((issue: any) => {
      return {
        ...issue,
        fields: {
          ...omit(issue.fields, ["customfield_10002", "customfield_10000"]),
          effort: issue.fields.customfield_10002,
          externalRoadmap: get(issue, "fields.customfield_10000.value"),
          assignee: issue.fields.assignee
            ? {
                accountId: issue.fields.assignee.accountId,
                displayName: issue.fields.assignee.displayName,
              }
            : null,
          reporter: issue.fields.reporter
            ? {
                accountId: issue.fields.reporter.accountId,
                displayName: issue.fields.reporter.displayName,
              }
            : null,
        },
      };
    });
  }

  private _createClient(): AgileClient {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    return new AgileClient({
      host: jiraConfig?.connection?.host || "https://example.atlassian.net",
      authentication: {
        basic: {
          email: jiraConfig?.connection?.user || "user@example.com",
          apiToken: jiraConfig?.connection?.token || "dummy-token",
        },
      },
    });
  }
}

export default JiraAPI;
