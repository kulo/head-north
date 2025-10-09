import { AgileClient } from "jira.js";
import _ from "lodash";
import type { OmegaConfig } from "@omega/config";
import type {
  JiraSprintsData,
  JiraIssue,
  JiraSprint,
  JiraRoadmapItemsData,
} from "../types/jira-types";
import type { ApiResponse } from "../types/api-response-types";

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
  async getSprintsData(): Promise<JiraSprintsData> {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const sprints = await this._client.board.getAllSprints({
      boardId: jiraConfig?.connection?.boardId || 0,
      state: "active,closed,future",
    });

    return {
      sprints: sprints.values as JiraSprint[],
      total: sprints.total,
      startAt: sprints.startAt,
      maxResults: sprints.maxResults,
    };
  }

  /**
   * Get roadmap items data (raw from Jira)
   * @returns Raw roadmap items data
   */
  async getRoadmapItemsData(): Promise<JiraRoadmapItemsData> {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const response = await this._client.board.getIssuesForBoard({
      boardId: jiraConfig?.connection?.boardId || 0,
      maxResults: jiraConfig?.limits?.maxResults || 100,
      jql: 'issuetype = "Roadmap Item"',
      fields: ["summary", "labels"], // Using generic field names for now
    });

    const roadmapItemData = response.issues.map((issue) => ({
      [issue.key as string]: {
        summary: issue.fields?.summary || "",
        labels: issue.fields?.labels || [],
      },
    }));

    return Object.assign({}, ...roadmapItemData);
  }

  /**
   * Get release items data (raw from Jira)
   * @returns Raw release items data
   */
  async getReleaseItemsData(): Promise<JiraIssue[]> {
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
        id: issue.key || "",
        key: issue.key || "",
        fields: {
          summary: issue.fields?.summary || "",
          status: _.get(issue, "fields.status") || {
            id: "",
            name: "",
            statusCategory: { id: 0, key: "", colorName: "", name: "" },
          },
          parent: _.get(issue, "fields.parent"),
          sprint: _.get(issue, "fields.sprint")
            ? {
                id: _.get(issue, "fields.sprint.id") || 0,
                name: _.get(issue, "fields.sprint.name") || "",
                state:
                  (_.get(issue, "fields.sprint.state") as
                    | "active"
                    | "closed"
                    | "future") || "active",
                startDate:
                  (_.get(issue, "fields.sprint.startDate") as any) || "",
                endDate: (_.get(issue, "fields.sprint.endDate") as any) || "",
                originBoardId: _.get(issue, "fields.sprint.originBoardId") || 0,
                ...(_.get(issue, "fields.sprint.goal") && {
                  goal: _.get(issue, "fields.sprint.goal") as string,
                }),
              }
            : null,
          labels: issue.fields?.labels || [],
          issuetype: issue.fields?.issuetype || {
            id: "",
            name: "",
            subtask: false,
          },
          assignee: issue.fields?.assignee
            ? {
                accountId: issue.fields.assignee.accountId,
                displayName: issue.fields.assignee.displayName,
                ...(issue.fields.assignee.emailAddress && {
                  emailAddress: issue.fields.assignee.emailAddress,
                }),
                ...(issue.fields.assignee.avatarUrls && {
                  avatarUrls: issue.fields.assignee.avatarUrls as Record<
                    string,
                    string
                  >,
                }),
                active: issue.fields.assignee.active,
                ...(issue.fields.assignee.timeZone && {
                  timeZone: issue.fields.assignee.timeZone,
                }),
              }
            : null,
          ...(issue.fields?.reporter && {
            reporter: {
              accountId: issue.fields.reporter.accountId,
              displayName: issue.fields.reporter.displayName,
              ...(issue.fields.reporter.emailAddress && {
                emailAddress: issue.fields.reporter.emailAddress,
              }),
              ...(issue.fields.reporter.avatarUrls && {
                avatarUrls: issue.fields.reporter.avatarUrls as Record<
                  string,
                  string
                >,
              }),
              active: issue.fields.reporter.active,
              ...(issue.fields.reporter.timeZone && {
                timeZone: issue.fields.reporter.timeZone,
              }),
            },
          }),
        },
        summary: issue.fields?.summary || "",
        closedSprints: _.get(issue, "fields.closedSprints", []),
        parent: _.get(issue, "fields.parent.key"),
        status: _.get(issue, "fields.status")?.name || "",
        sprint: _.get(issue, "fields.sprint"),
        roadmapItemId: _.get(issue, "fields.parent.key"), // Foreign key
        cycleId: _.get(issue, "fields.sprint.id") || "", // Foreign key
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
  ): Promise<JiraIssue[]> {
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

    return (response as { issues: JiraIssue[] }).issues.map(
      (issue: JiraIssue) => {
        return {
          ...issue,
          fields: {
            ..._.omit(issue.fields, ["customfield_10002"]),
            ...(issue.fields.customfield_10002 !== undefined && {
              effort: issue.fields.customfield_10002,
            }),
            assignee: issue.fields.assignee
              ? {
                  accountId: issue.fields.assignee.accountId,
                  displayName: issue.fields.assignee.displayName,
                  ...(issue.fields.assignee.emailAddress && {
                    emailAddress: issue.fields.assignee.emailAddress,
                  }),
                  ...(issue.fields.assignee.avatarUrls && {
                    avatarUrls: issue.fields.assignee.avatarUrls as Record<
                      string,
                      string
                    >,
                  }),
                  active: issue.fields.assignee.active,
                  ...(issue.fields.assignee.timeZone && {
                    timeZone: issue.fields.assignee.timeZone,
                  }),
                }
              : null,
            ...(issue.fields.reporter && {
              reporter: {
                accountId: issue.fields.reporter.accountId,
                displayName: issue.fields.reporter.displayName,
                ...(issue.fields.reporter.emailAddress && {
                  emailAddress: issue.fields.reporter.emailAddress,
                }),
                ...(issue.fields.reporter.avatarUrls && {
                  avatarUrls: issue.fields.reporter.avatarUrls as Record<
                    string,
                    string
                  >,
                }),
                active: issue.fields.reporter.active,
                ...(issue.fields.reporter.timeZone && {
                  timeZone: issue.fields.reporter.timeZone,
                }),
              },
            }),
          },
        };
      },
    );
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
