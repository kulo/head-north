// Default JIRA Adapter
// Handles standard JIRA setup: separate Roadmap Item and Cycle Item issue types
// Uses Either for functional error handling

import { Either, Maybe, safeAsync } from "@headnorth/utils";
import type { HeadNorthConfig, JiraConfigData } from "@headnorth/config";
import type {
  CycleData,
  Cycle,
  RoadmapItem,
  CycleItem,
  Area,
  Team,
  Objective,
  ValidationItem,
  Person,
} from "@headnorth/types";
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
} from "@headnorth/jira-primitives";
import type { JiraIssue } from "@headnorth/jira-primitives";

export class DefaultJiraAdapter implements JiraAdapter {
  private readonly jiraConfig: JiraConfigData;
  private readonly config: HeadNorthConfig;

  constructor(
    private jiraClient: JiraClient,
    config: HeadNorthConfig,
    jiraConfig: JiraConfigData,
  ) {
    this.jiraConfig = jiraConfig;
    // Store config reference for non-JIRA methods (e.g., getLabelTranslations)
    this.config = config;
  }

  async fetchCycleData(): Promise<Either<Error, CycleData>> {
    return safeAsync(async () => {
      // 1. Fetch all JIRA data in parallel
      const boardId = this.jiraConfig.connection.boardId;

      const [sprints, roadmapIssues, cycleIssues] = await Promise.all([
        this.jiraClient.getSprints(boardId),
        this.jiraClient.searchIssues(
          'issuetype = "Roadmap Item"',
          ["summary", "labels"],
          boardId,
        ),
        this.jiraClient.searchIssues(
          'issuetype = "Cycle Item"',
          ["*"],
          boardId,
        ),
      ]);

      // 2. Transform sprints to cycles
      const cycles = sprints.map(jiraSprintToCycle);

      // 3. Transform issues to roadmap/cycle items
      const roadmapItems = roadmapIssues.map((issue: JiraIssue) =>
        this.transformRoadmapItem(issue, cycleIssues),
      );

      const cycleItems = cycleIssues.map((issue: JiraIssue) =>
        this.transformCycleItem(issue, cycles),
      );

      // 4. Extract metadata from all issues
      const allIssues = [...roadmapIssues, ...cycleIssues];
      const objectives = this.extractObjectives(allIssues);
      const teams = this.extractTeams(allIssues);
      const assignees = extractAllAssignees(allIssues);
      // Extract areas and associate teams (needs teams to be extracted first)
      const areas = this.extractAreas(allIssues, teams);

      const rawData: CycleData = {
        cycles,
        roadmapItems,
        cycleItems,
        areas,
        objectives,
        assignees,
        stages: this.config.getStages(),
        teams,
      };

      return rawData;
    });
  }

  /**
   * Get translated label with fallback using Maybe for safe extraction
   * @param label - The label to translate (may be undefined)
   * @param translations - Translation dictionary
   * @param fallback - Fallback value if translation not found
   * @returns Translated label or fallback
   */
  private getTranslatedLabel(
    label: string | undefined,
    translations: Record<string, string>,
    fallback: string = "unknown",
  ): string {
    return Maybe.fromNullable(label)
      .chain((l) => Maybe.fromNullable(translations[l]))
      .orDefault(label || fallback);
  }

  private transformRoadmapItem(
    issue: JiraIssue,
    cycleIssues: JiraIssue[],
  ): RoadmapItem {
    // Extract labels using primitives
    const areaLabels = extractLabelsWithPrefix(issue.fields.labels, "area:");
    const themeLabel = extractLabelsWithPrefix(
      issue.fields.labels,
      "theme:",
    )[0];
    const objectiveLabel = extractLabelsWithPrefix(
      issue.fields.labels,
      "objective:",
    )[0];

    // Translate labels using Maybe for safe extraction
    const areaTranslations = this.config.getLabelTranslations().areas;
    const area = this.getTranslatedLabel(
      areaLabels[0],
      areaTranslations,
      areaLabels[0] || "unknown",
    );

    const themeTranslations = this.config.getLabelTranslations().themes;
    const theme = this.getTranslatedLabel(
      themeLabel,
      themeTranslations,
      themeLabel || "unknown",
    );

    const objectiveTranslations = this.config.getLabelTranslations().objectives;
    const objective = this.getTranslatedLabel(
      objectiveLabel,
      objectiveTranslations,
      objectiveLabel || "unknown",
    );

    // Generate validations
    const validations: ValidationItem[] = [
      ...validateRequired(area, issue.key, "area"),
      ...validateRequired(theme, issue.key, "theme"),
      ...validateRequired(objective, issue.key, "objective"),
    ];

    const name = this.extractRoadmapItemName(issue.fields.summary);

    // Find related cycle items
    const relatedCycleItems = cycleIssues.filter((ci) =>
      extractParent(ci)
        .map((parentKey: string) => parentKey === issue.key)
        .orDefault(false),
    );

    // Determine owning team from cycle items using Maybe
    const teamLabels = relatedCycleItems.flatMap((ci) =>
      extractLabelsWithPrefix(ci.fields.labels, "team:"),
    );
    const owningTeamId = Maybe.fromNullable(teamLabels[0]).orDefault("unknown");

    // Get team translation using Maybe
    const teamTranslations = this.config.getLabelTranslations().teams;
    const owningTeamName = this.getTranslatedLabel(
      owningTeamId,
      teamTranslations,
      owningTeamId,
    );

    // Extract product area ID using Maybe
    const areaId = Maybe.fromNullable(areaLabels[0]).orDefault("unknown");
    const themeId = Maybe.fromNullable(themeLabel).orDefault("unknown");

    // Extract host URL using Maybe
    const host = Maybe.fromNullable(this.jiraConfig.connection.host).orDefault(
      "",
    );

    return {
      id: issue.key,
      name,
      summary: issue.fields.summary,
      area: { id: areaId, name: area, teams: [] },
      theme: { id: themeId, name: theme },
      objectiveId: objectiveLabel || null,
      labels: issue.fields.labels,
      validations,
      owningTeam: {
        id: owningTeamId,
        name: owningTeamName,
      },
      url: createJiraUrl(issue.key, host),
      isExternal: false, // Will be determined by business logic
    };
  }

  private transformCycleItem(issue: JiraIssue, cycles: Cycle[]): CycleItem {
    // Extract effort from custom field
    const effort = extractCustomField<number>(
      issue,
      "customfield_10002",
    ).orDefault(0);

    // Extract labels
    const areaLabels = extractLabelsWithPrefix(issue.fields.labels, "area:");
    const teamLabels = extractLabelsWithPrefix(issue.fields.labels, "team:");

    // Extract release stage from name
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

    // Extract cycleId from sprint using Maybe
    const cycleId = Maybe.fromNullable(issue.fields.sprint?.id)
      .map((id) => id.toString())
      .orDefault("");

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
      url: createJiraUrl(
        issue.key,
        Maybe.fromNullable(this.jiraConfig.connection.host).orDefault(""),
      ),
      isExternal: false, // Will be determined by business logic
      stage,
      assignee,
      validations,
      roadmapItemId,
      cycleId,
      cycle,
      created: Maybe.fromNullable(issue.fields.created).orDefault(
        new Date().toISOString() as `${number}-${number}-${number}`,
      ),
      updated: Maybe.fromNullable(issue.fields.updated).orDefault(
        new Date().toISOString() as `${number}-${number}-${number}`,
      ),
    };
  }

  private extractAreas(allIssues: JiraIssue[], teams: Team[]): Area[] {
    const DEFAULT_AREA_UNASSIGNED = {
      ID: "unassigned-teams",
      NAME: "Unassigned Teams",
    } as const;

    const areaLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels, "area:"),
      ),
    );

    // Build areas array
    const areas = Array.from(areaLabels).map((label) => ({
      id: label,
      name: this.config.getLabelTranslations().areas[label] || label,
      teams: [] as Team[],
    }));

    // Associate teams to areas using prefix matching
    // Team ID should start with area ID (e.g., team "platform-frontend" belongs to area "platform")
    const unassociatedTeams: Team[] = [];

    for (const team of teams) {
      const teamId = team.id.replace("team:", "");
      let associated = false;

      for (const area of areas) {
        const areaId = area.id.replace("area:", "");
        if (teamId.startsWith(areaId)) {
          area.teams.push(team);
          associated = true;
          break;
        }
      }

      if (!associated) {
        unassociatedTeams.push(team);
      }
    }

    // Create default area for orphaned teams if needed
    if (unassociatedTeams.length > 0) {
      // Check if default area already exists
      const defaultAreaExists = areas.some(
        (area) => area.id === DEFAULT_AREA_UNASSIGNED.ID,
      );

      if (!defaultAreaExists) {
        areas.push({
          id: DEFAULT_AREA_UNASSIGNED.ID,
          name: DEFAULT_AREA_UNASSIGNED.NAME,
          teams: unassociatedTeams,
        });
      } else {
        // Add orphaned teams to existing default area
        const defaultArea = areas.find(
          (area) => area.id === DEFAULT_AREA_UNASSIGNED.ID,
        );
        if (defaultArea) {
          defaultArea.teams.push(...unassociatedTeams);
        }
      }
    }

    return areas;
  }

  private extractObjectives(allIssues: JiraIssue[]): Objective[] {
    const objectiveLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels, "objective:"),
      ),
    );

    return Array.from(objectiveLabels).map((label) => ({
      id: label,
      name: this.config.getLabelTranslations().objectives[label] || label,
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
   * Extract release stage from issue name (text in last parentheses)
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
