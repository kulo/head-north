// Default JIRA Adapter
// Handles standard JIRA setup: separate Roadmap Item and Release Item issue types
// Uses Either for functional error handling

import { Either, Maybe, safeAsync } from "@omega/utils";
import type { OmegaConfig, JiraConfigData } from "@omega/config";
import type {
  RawCycleData,
  Cycle,
  RoadmapItem,
  ReleaseItem,
  Area,
  Team,
  Initiative,
  ValidationItem,
  Person,
} from "@omega/types";
import type { JiraAdapter } from "./jira-adapter.interface";
import {
  JiraClient,
  extractLabelsWithPrefix,
  extractCustomField,
  extractParent,
  extractAssignee,
  extractAllAssignees,
  jiraSprintToCycle,
  mapJiraStatus,
  createJiraUrl,
  validateRequired,
} from "@omega/jira-primitives";
import type { JiraIssue } from "@omega/jira-primitives";

export class DefaultJiraAdapter implements JiraAdapter {
  private readonly jiraConfig: JiraConfigData;
  private readonly config: OmegaConfig;

  constructor(
    private jiraClient: JiraClient,
    config: OmegaConfig,
    jiraConfig: JiraConfigData,
  ) {
    this.jiraConfig = jiraConfig;
    // Store config reference for non-JIRA methods (e.g., getLabelTranslations)
    this.config = config;
  }

  async fetchCycleData(): Promise<Either<Error, RawCycleData>> {
    return safeAsync(async () => {
      // 1. Fetch all JIRA data in parallel
      const boardId = this.jiraConfig.connection.boardId;

      const [sprints, roadmapIssues, releaseIssues] = await Promise.all([
        this.jiraClient.getSprints(boardId),
        this.jiraClient.searchIssues('issuetype = "Roadmap Item"', [
          "summary",
          "labels",
        ]),
        this.jiraClient.searchIssues('issuetype = "Release Item"', ["*"]),
      ]);

      // 2. Transform sprints to cycles
      const cycles = sprints.map(jiraSprintToCycle);

      // 3. Transform issues to roadmap/release items
      const roadmapItems = roadmapIssues.map((issue: JiraIssue) =>
        this.transformRoadmapItem(issue, releaseIssues),
      );

      const releaseItems = releaseIssues.map((issue: JiraIssue) =>
        this.transformReleaseItem(issue, cycles),
      );

      // 4. Extract metadata from all issues
      const allIssues = [...roadmapIssues, ...releaseIssues];
      const areas = this.extractAreas(allIssues);
      const initiatives = this.extractInitiatives(allIssues);
      const teams = this.extractTeams(allIssues);
      const assignees = extractAllAssignees(allIssues);

      const rawData: RawCycleData = {
        cycles,
        roadmapItems,
        releaseItems,
        areas,
        initiatives,
        assignees,
        stages: this.config.getStages(),
        teams,
      };

      return rawData;
    });
  }

  private transformRoadmapItem(
    issue: JiraIssue,
    releaseIssues: JiraIssue[],
  ): RoadmapItem {
    // Extract labels using primitives
    const areaLabels = extractLabelsWithPrefix(issue.fields.labels, "area:");
    const themeLabel = extractLabelsWithPrefix(
      issue.fields.labels,
      "theme:",
    )[0];
    const initiativeLabel = extractLabelsWithPrefix(
      issue.fields.labels,
      "initiative:",
    )[0];

    // Translate labels using config
    const area =
      (areaLabels[0]
        ? this.config.getLabelTranslations().areas[areaLabels[0]]
        : undefined) ||
      areaLabels[0] ||
      "unknown";
    const theme =
      (themeLabel
        ? this.config.getLabelTranslations().themes[themeLabel]
        : undefined) ||
      themeLabel ||
      "unknown";
    const initiative =
      (initiativeLabel
        ? this.config.getLabelTranslations().initiatives[initiativeLabel]
        : undefined) ||
      initiativeLabel ||
      "unknown";

    // Generate validations
    const validations: ValidationItem[] = [
      ...validateRequired(area, issue.key, "area"),
      ...validateRequired(theme, issue.key, "theme"),
      ...validateRequired(initiative, issue.key, "initiative"),
    ];

    const name = this.extractRoadmapItemName(issue.fields.summary);

    // Find related release items
    const relatedReleaseItems = releaseIssues.filter((ri) =>
      extractParent(ri)
        .map((parentKey: string) => parentKey === issue.key)
        .orDefault(false),
    );

    // Determine owning team from release items
    const teamLabels = relatedReleaseItems.flatMap((ri) =>
      extractLabelsWithPrefix(ri.fields.labels, "team:"),
    );
    const owningTeamId = teamLabels[0] || "unknown";

    return {
      id: issue.key,
      name,
      summary: issue.fields.summary,
      area: { id: areaLabels[0] || "unknown", name: area, teams: [] },
      theme: { id: themeLabel || "unknown", name: theme },
      initiativeId: initiativeLabel || null,
      labels: issue.fields.labels,
      validations,
      owningTeam: {
        id: owningTeamId,
        name:
          this.config.getLabelTranslations().teams[owningTeamId] ||
          owningTeamId,
      },
      url: createJiraUrl(issue.key, this.jiraConfig.connection.host || ""),
      isExternal: false, // Will be determined by business logic
    };
  }

  private transformReleaseItem(issue: JiraIssue, cycles: Cycle[]): ReleaseItem {
    // Extract effort from custom field
    const effort = extractCustomField<number>(
      issue,
      "customfield_10002",
    ).orDefault(0);

    // Extract labels
    const areaLabels = extractLabelsWithPrefix(issue.fields.labels, "area:");
    const teamLabels = extractLabelsWithPrefix(issue.fields.labels, "team:");

    // Extract stage from name
    const stage = this.extractStageFromName(issue.fields.summary).orDefault("");

    // Map status
    const status = mapJiraStatus(
      issue.fields.status,
      this.jiraConfig.statusMappings,
      this.config.getItemStatusValues().TODO,
    );

    // Extract assignee with empty object fallback
    const assignee = extractAssignee(issue).orDefault({
      id: "",
      name: "",
    } as Person);

    // Extract parent (roadmapItemId)
    const roadmapItemId = extractParent(issue).orDefault("");

    // Extract cycleId from sprint
    const cycleId = issue.fields.sprint?.id?.toString() || "";

    // Find cycle using Maybe for safe lookup and transform to required shape
    const cycle = Maybe.fromNullable(cycles.find((c) => c.id === cycleId))
      .map((c) => ({ id: c.id, name: c.name }))
      .orDefault({ id: "", name: "" });

    // Generate validations
    const validations: ValidationItem[] = [
      ...validateRequired(effort, issue.key, "effort"),
      ...validateRequired(areaLabels[0], issue.key, "area"),
      ...validateRequired(teamLabels[0], issue.key, "team"),
    ];

    return {
      id: issue.key,
      ticketId: issue.key,
      effort,
      name: issue.fields.summary,
      areaIds: areaLabels,
      teams: teamLabels,
      status,
      url: createJiraUrl(issue.key, this.jiraConfig.connection.host || ""),
      isExternal: false, // Will be determined by business logic
      stage,
      assignee,
      validations,
      roadmapItemId: roadmapItemId || "",
      cycleId,
      cycle,
      created: issue.fields.created || new Date().toISOString(),
      updated: issue.fields.updated || new Date().toISOString(),
    };
  }

  private extractAreas(allIssues: JiraIssue[]): Record<string, Area> {
    const areaLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels, "area:"),
      ),
    );

    // Use reduce for immutable transformation instead of forEach
    return Array.from(areaLabels).reduce(
      (acc, label) => {
        return {
          ...acc,
          [label]: {
            id: label,
            name: this.config.getLabelTranslations().areas[label] || label,
            teams: [], // Will be populated elsewhere
          },
        };
      },
      {} as Record<string, Area>,
    );
  }

  private extractInitiatives(allIssues: JiraIssue[]): Initiative[] {
    const initiativeLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels, "initiative:"),
      ),
    );

    return Array.from(initiativeLabels).map((label) => ({
      id: label,
      name: this.config.getLabelTranslations().initiatives[label] || label,
    }));
  }

  private extractTeams(allIssues: JiraIssue[]): Team[] {
    const teamLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels, "team:"),
      ),
    );

    return Array.from(teamLabels).map((label) => ({
      id: label,
      name: this.config.getLabelTranslations().teams[label] || label,
    }));
  }

  /**
   * Extract stage from issue name (text in last parentheses)
   * This is adapter-specific policy for DefaultJiraAdapter
   * Returns Maybe<string> - empty string becomes Nothing
   */
  private extractStageFromName(name: string): Maybe<string> {
    const startPostfix = name.lastIndexOf("(");
    const endPostfix = name.lastIndexOf(")");

    if (
      startPostfix === -1 ||
      endPostfix === -1 ||
      startPostfix >= endPostfix
    ) {
      return Maybe.empty();
    }

    const stage = name.substring(startPostfix + 1, endPostfix).toLowerCase();
    return stage.length > 0 ? Maybe.of(stage) : Maybe.empty();
  }

  /**
   * Extract roadmap item name from summary (remove brackets)
   * This is adapter-specific policy for DefaultJiraAdapter
   */
  private extractRoadmapItemName(summary: string): string {
    const endOfPrefix = !summary.startsWith("[") ? 0 : summary.indexOf("]") + 1;
    const beginningOfSuffix = summary.lastIndexOf("[");
    const endOfProjectName =
      beginningOfSuffix > 0 ? beginningOfSuffix : undefined;

    return summary.substring(endOfPrefix, endOfProjectName).trim();
  }
}
