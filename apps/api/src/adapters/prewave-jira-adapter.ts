// Prewave JIRA Adapter
// Handles Prewave-specific JIRA setup: Epic issue types, virtual Roadmap Items
// Uses Either for functional error handling

import { Either, Maybe, safeAsync } from "@headnorth/utils";
import { logger } from "@headnorth/utils";
import { match } from "ts-pattern";
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
  extractAssignee,
  extractAllAssignees,
  jiraSprintToCycle,
  mapJiraStatus,
  createJiraUrl,
  validateRequired,
} from "@headnorth/jira-primitives";
import type { JiraIssue } from "@headnorth/jira-primitives";

/**
type JiraSprintField = { id?: number | string; name?: string; state?: string; boardId?: number; startDate?: string; endDate?: string; goal?: string; [key: string]: unknown };

 * Prewave-specific mapping: Product Areas → Teams → Assignees
 *
 * This mapping structure defines the organizational hierarchy for Prewave:
 * - Product Areas: Platform, Resilience, Sustainability
 * - Teams: Each product area has multiple teams
 * - Assignees: Each team has multiple assignees (mapped by email/accountId)
 *
 * TODO: This mapping should be:
 * 1. Populated from actual Prewave Jira data (assignees → teams → areas)
 * 2. Made configurable via environment variables or config file
 * 3. Enhanced to support dynamic discovery from Jira project structure
 */
interface PrewaveTeamMapping {
  name: string;
  assignees: string[]; // Array of assignee IDs (email addresses or account IDs)
}

interface PrewaveAreaMapping {
  name: string;
  teams: Record<string, PrewaveTeamMapping>;
}

// PrewaveMapping structure (used in PREWAVE_MAPPING constant)
// interface PrewaveMapping {
//   areas: Record<string, PrewaveAreaMapping>;
//   // Reverse lookup: assignee ID → team ID → area ID
//   assigneeToTeam: Record<string, string>;
//   teamToArea: Record<string, string>;
// }

const PREWAVE_AREAS: Readonly<Record<string, PrewaveAreaMapping>> = {
  platform: {
    name: "Platform",
    teams: {
      "platform-frontend": {
        name: "Frontend Team",
        assignees: [], // TODO: Populate from actual Prewave data
      },
      "platform-backend": {
        name: "Backend Team",
        assignees: [], // TODO: Populate from actual Prewave data
      },
      "platform-devops": {
        name: "DevOps Team",
        assignees: [], // TODO: Populate from actual Prewave data
      },
    },
  },
  resilience: {
    name: "Resilience",
    teams: {
      "resilience-security": {
        name: "Security Team",
        assignees: [], // TODO: Populate from actual Prewave data
      },
      "resilience-monitoring": {
        name: "Monitoring Team",
        assignees: [], // TODO: Populate from actual Prewave data
      },
    },
  },
  sustainability: {
    name: "Sustainability",
    teams: {
      "sustainability-green": {
        name: "Green Tech Team",
        assignees: [], // TODO: Populate from actual Prewave data
      },
      "sustainability-metrics": {
        name: "Metrics Team",
        assignees: [], // TODO: Populate from actual Prewave data
      },
    },
  },
} as const;

// Build reverse lookup maps immutably using reduce
const buildReverseLookups = (
  areas: Readonly<Record<string, PrewaveAreaMapping>>,
): {
  readonly assigneeToTeam: Readonly<Record<string, string>>;
  readonly teamToArea: Readonly<Record<string, string>>;
} => {
  const { teamToArea, assigneeToTeam } = Object.entries(areas).reduce(
    (acc, [areaId, area]) => {
      const { teamToArea: newTeamToArea, assigneeToTeam: newAssigneeToTeam } =
        Object.entries(area.teams).reduce(
          (teamAcc, [teamId, team]) => {
            const teamMappings = team.assignees.reduce(
              (assigneeAcc, assigneeId) => ({
                ...assigneeAcc,
                [assigneeId]: teamId,
              }),
              {} as Record<string, string>,
            );

            return {
              teamToArea: { ...teamAcc.teamToArea, [teamId]: areaId },
              assigneeToTeam: {
                ...teamAcc.assigneeToTeam,
                ...teamMappings,
              },
            };
          },
          { teamToArea: {}, assigneeToTeam: {} } as {
            teamToArea: Record<string, string>;
            assigneeToTeam: Record<string, string>;
          },
        );

      return {
        teamToArea: { ...acc.teamToArea, ...newTeamToArea },
        assigneeToTeam: { ...acc.assigneeToTeam, ...newAssigneeToTeam },
      };
    },
    { teamToArea: {}, assigneeToTeam: {} } as {
      teamToArea: Record<string, string>;
      assigneeToTeam: Record<string, string>;
    },
  );

  return { assigneeToTeam, teamToArea } as const;
};

const PREWAVE_MAPPING = {
  areas: PREWAVE_AREAS,
  ...buildReverseLookups(PREWAVE_AREAS),
} as const;

const PREWAVE_FIELDS = {
  // TODO: Confirm this is stable across Prewave projects
  sprint: "customfield_10021",
} as const;

export class PrewaveJiraAdapter implements JiraAdapter {
  private readonly jiraConfig: JiraConfigData;
  private readonly config: HeadNorthConfig;

  constructor(
    private jiraClient: JiraClient,
    config: HeadNorthConfig,
    jiraConfig: JiraConfigData,
  ) {
    this.jiraConfig = jiraConfig;
    this.config = config;
  }

  async fetchCycleData(): Promise<Either<Error, CycleData>> {
    return safeAsync(async () => {
      // 1. Fetch all JIRA data in parallel
      const boardId = this.jiraConfig.connection.boardId;

      const [sprints, epicIssues] = await Promise.all([
        this.jiraClient.getSprints(boardId),
        // Don't pass boardId for Epic search - Epic issues aren't on boards, use regular search API
        this.jiraClient.searchIssues(
          'project = PRODUCT AND issuetype = "Epic" ORDER BY updated DESC',
          ["summary", "status", "assignee", "labels", PREWAVE_FIELDS.sprint],
        ),
      ]);

      logger.default.info("PrewaveJiraAdapter: fetched data", {
        sprints: sprints.length,
        epics: epicIssues.length,
        sampleEpicKeys: epicIssues.slice(0, 3).map((e) => e.key),
      });

      const inspectEpic =
        epicIssues.find((e) => e.key === "PRODUCT-43") || epicIssues[0];

      const inspectSprintField = (
        inspectEpic?.fields as unknown as Record<string, unknown>
      )?.[PREWAVE_FIELDS.sprint];
      logger.default.info("PrewaveJiraAdapter: sprint field inspection", {
        key: inspectEpic?.key,
        type: Array.isArray(inspectSprintField)
          ? "array"
          : typeof inspectSprintField,
        ids: Array.isArray(inspectSprintField)
          ? inspectSprintField.map((s: JiraSprintField) => s?.id)
          : inspectSprintField?.id,
      });

      // 2. Transform sprints to cycles and normalize dates to YYYY-MM-DD
      const cycles = sprints.map(jiraSprintToCycle).map((c) => ({
        ...c,
        start: c.start
          ? (c.start as string).slice(0, 10)
          : ("" as typeof c.start),
        end: c.end ? (c.end as string).slice(0, 10) : ("" as typeof c.end),
        delivery: c.delivery
          ? (c.delivery as string).slice(0, 10)
          : ("" as typeof c.delivery),
      }));

      // 3. Transform Epics to CycleItems
      const cycleItems = epicIssues.map((issue: JiraIssue) =>
        this.transformEpicToCycleItem(issue, cycles),
      );

      logger.default.info("PrewaveJiraAdapter: transformed items", {
        cycles: cycles.length,
        cycleItems: cycleItems.length,
        roadmapItems: epicIssues.length,
      });

      // 4. Create virtual RoadmapItems (one per CycleItem)
      const roadmapItems = epicIssues.map((issue: JiraIssue) =>
        this.createVirtualRoadmapItem(issue),
      );

      // 5. Extract metadata from all issues
      const assignees = extractAllAssignees(epicIssues);
      const objectives = this.extractObjectives();
      const teams = this.extractTeams(epicIssues, assignees);
      // Extract areas and associate teams (needs teams to be extracted first)
      const areas = this.extractAreas(epicIssues, assignees, teams);

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

      logger.default.info("PrewaveJiraAdapter: rawData prepared", {
        cycles: rawData.cycles?.length || 0,
        cycleItems: rawData.cycleItems?.length || 0,
        areas: rawData.areas?.length || 0,
        objectives: rawData.objectives?.length || 0,
        teams: rawData.teams?.length || 0,
      });

      return rawData;
    });
  }

  /**
   * Map Prewave status to Head North status
   * - "in progress", "done", "cancelled" map 1:1
   * - "new", "in technical scopign", "ready", "planned" → "todo"
   */
  private mapPrewaveStatus(jiraStatus: { id: string; name: string }): string {
    const statusName = jiraStatus.name.toLowerCase();
    const defaultStatus = this.config.getItemStatusValues().TODO;

    // Use pattern matching for status mapping
    return match(statusName)
      .with("in progress", () => "inprogress")
      .with("done", () => "done")
      .with("cancelled", () => "cancelled")
      .with(
        "new",
        "in technical scopign",
        "ready",
        "planned",
        () => defaultStatus,
      )
      .otherwise(() =>
        mapJiraStatus(
          jiraStatus,
          this.jiraConfig.statusMappings,
          defaultStatus,
        ),
      );
  }

  /**
   * Transform Epic issue to CycleItem
   */
  private transformEpicToCycleItem(
    issue: JiraIssue,
    cycles: Cycle[],
  ): CycleItem {
    // TODO: Prewave doesn't use story points; replace with concrete Effort/Appetite field once available
    const effort = 1;

    // Extract assignee
    const assignee = extractAssignee(issue).orDefault({
      id: "",
      name: "",
    } as Person);

    // Map status using Prewave-specific mapping
    const status = this.mapPrewaveStatus(issue.fields.status);

    // Extract sprint/cycle (Prewave sprint field returns an array of sprint objects)
    const sprintField = (issue.fields as unknown as Record<string, unknown>)[
      PREWAVE_FIELDS.sprint
    ];
    const sprintIdValue = Array.isArray(sprintField)
      ? sprintField[0]?.id
      : sprintField?.id;
    if (issue.key === "PRODUCT-43") {
      logger.default.info("PrewaveJiraAdapter: sprint extraction", {
        key: issue.key,
        sprintFieldType: Array.isArray(sprintField)
          ? "array"
          : typeof sprintField,
        sprintIds: Array.isArray(sprintField)
          ? sprintField.map((s: JiraSprintField) => s?.id)
          : sprintField?.id,
      });
    }
    const cycleId = Maybe.fromNullable(sprintIdValue)
      .map((id: string | number) => id.toString())
      .orDefault("");

    const cycle = Maybe.fromNullable(cycles.find((c) => c.id === cycleId))
      .map((c) => ({ id: c.id, name: c.name }))
      .orDefault({ id: "", name: "" });

    // Generate virtual roadmap item ID
    const roadmapItemId = `VIRTUAL-${issue.key}`;

    // Extract Product Area from assignee mapping (TODO: will be in labels later)
    const productAreaId =
      this.mapAssigneeToProductArea(assignee).orDefault(null);
    const areaIds = productAreaId ? [productAreaId] : [];

    // Extract Team from assignee mapping (TODO: will be in labels later)
    const teamId = this.mapAssigneeToTeam(assignee).orDefault(null);
    const teams = teamId ? [teamId] : [];

    // Release Stage not available yet (TODO: will be added later)
    const stage = "";

    // Generate validations
    const validations: ValidationItem[] = [
      ...validateRequired(effort, issue.key, "effort"),
      // Product Area validation - warn if missing but don't fail
      ...(productAreaId
        ? []
        : [
            {
              id: `${issue.key}-missingArea`,
              code: "missingArea",
              name: "Missing Product Area",
              status: "warning",
              description:
                "Product Area not available in Jira data yet. TODO: Will be extracted from labels or assignee mapping.",
            },
          ]),
    ];

    const host = Maybe.fromNullable(this.jiraConfig.connection.host).orDefault(
      "",
    );

    return {
      id: issue.key,
      ticketId: issue.key,
      effort,
      name: issue.fields.summary,
      areaIds,
      teams,
      status,
      url: createJiraUrl(issue.key, host),
      isExternal: false,
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

  /**
   * Create virtual RoadmapItem from Epic issue
   */
  private createVirtualRoadmapItem(issue: JiraIssue): RoadmapItem {
    // Extract Product Area from assignee mapping (TODO: will be in labels later)
    const assignee = extractAssignee(issue).orDefault({
      id: "",
      name: "",
    } as Person);
    const productAreaId =
      this.mapAssigneeToProductArea(assignee).orDefault(null);

    // Extract host URL
    const host = Maybe.fromNullable(this.jiraConfig.connection.host).orDefault(
      "",
    );

    // Generate validations
    const validations: ValidationItem[] = productAreaId
      ? []
      : [
          {
            id: `${issue.key}-missingArea`,
            code: "missingArea",
            name: "Missing Product Area",
            status: "warning",
            description:
              "Product Area not available in Jira data yet. TODO: Will be extracted from labels or assignee mapping.",
          },
        ];

    return {
      id: `VIRTUAL-${issue.key}`,
      name: issue.fields.summary,
      summary: issue.fields.summary,
      area: productAreaId
        ? {
            id: productAreaId,
            name: PREWAVE_MAPPING.areas[productAreaId]?.name || productAreaId,
            teams: [],
          }
        : undefined,
      objectiveId: "uncategorized", // TODO: Objectives not available yet
      url: createJiraUrl(issue.key, host),
      isExternal: false,
      validations,
      labels: issue.fields.labels || [],
    };
  }

  /**
   * Map assignee to Product Area using Prewave-specific mapping
   *
   * Mapping flow: assignee → team → product area
   *
   * TODO: Enhance this to:
   * 1. Support multiple identifier formats (email, accountId, displayName)
   * 2. Populate mapping from actual Prewave Jira data
   * 3. Fall back to labels if mapping not available
   */
  private mapAssigneeToProductArea(assignee: Person): Maybe<string> {
    return Maybe.fromNullable(assignee?.id)
      .chain(() => this.mapAssigneeToTeam(assignee))
      .chain((teamId) =>
        Maybe.fromNullable(PREWAVE_MAPPING.teamToArea[teamId]),
      );
  }

  /**
   * Map assignee to Team using Prewave-specific mapping
   *
   * TODO: Enhance this to:
   * 1. Support multiple identifier formats (email, accountId, displayName)
   * 2. Populate mapping from actual Prewave Jira data
   * 3. Use case-insensitive matching
   * 4. Support partial email matching (e.g., "john.doe" matches "john.doe@prewave.ai")
   */
  private mapAssigneeToTeam(assignee: Person): Maybe<string> {
    if (!assignee?.id) {
      return Maybe.empty();
    }

    // Try direct lookup by assignee ID
    const directMatch = Maybe.fromNullable(
      PREWAVE_MAPPING.assigneeToTeam[assignee.id],
    );
    if (directMatch.isJust()) {
      return directMatch;
    }

    // Try case-insensitive lookup using functional approach
    const lowerId = assignee.id.toLowerCase();
    const caseInsensitiveMatch = Object.entries(PREWAVE_MAPPING.assigneeToTeam)
      .map(([assigneeId, teamId]) =>
        assigneeId.toLowerCase() === lowerId ? teamId : null,
      )
      .find((teamId) => teamId !== null);

    return Maybe.fromNullable(caseInsensitiveMatch);
  }

  /**
   * Extract Product Areas from issues and assignees
   * Uses Prewave-specific mapping as fallback
   * Associates teams with areas using PREWAVE_MAPPING.teamToArea
   */
  private extractAreas(
    allIssues: readonly JiraIssue[],
    assignees: readonly Person[],
    teams: readonly Team[],
  ): Area[] {
    const DEFAULT_AREA_UNASSIGNED = {
      ID: "unassigned-teams",
      NAME: "Unassigned Teams",
    } as const;

    // First try to extract from labels
    const areaLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels, "area:"),
      ),
    );

    // Build areas from labels as array
    const areasFromLabels = Array.from(areaLabels).map((label) => {
      const areaId = label.replace("area:", "");
      return {
        id: areaId,
        name:
          this.config.getLabelTranslations().areas[label] ||
          PREWAVE_MAPPING.areas[areaId]?.name ||
          areaId,
        teams: [] as Team[],
      };
    });

    // If no areas from labels, try to derive from assignees using mapping
    const areasFromAssignees =
      areasFromLabels.length === 0
        ? (() => {
            const seenAreaIds = new Set<string>();
            return assignees
              .map((assignee) => {
                const areaId =
                  this.mapAssigneeToProductArea(assignee).orDefault(null);
                if (areaId && !seenAreaIds.has(areaId)) {
                  seenAreaIds.add(areaId);
                  return {
                    id: areaId,
                    name: PREWAVE_MAPPING.areas[areaId]?.name || areaId,
                    teams: [] as Team[],
                  };
                }
                return null;
              })
              .filter((area): area is Area => area !== null);
          })()
        : [];

    // If still no areas, add default Prewave areas
    const defaultAreas =
      areasFromLabels.length === 0 && areasFromAssignees.length === 0
        ? Object.keys(PREWAVE_MAPPING.areas).map((areaId) => ({
            id: areaId,
            name: PREWAVE_MAPPING.areas[areaId].name,
            teams: [] as Team[],
          }))
        : [];

    if (defaultAreas.length > 0) {
      logger.default.warn(
        "No Product Areas found in Jira data. Using default Prewave areas. TODO: Implement proper Product Area extraction from labels or assignee mapping.",
      );
    }

    // Merge arrays and deduplicate by area ID
    const allAreas = [
      ...areasFromLabels,
      ...areasFromAssignees,
      ...defaultAreas,
    ];
    const seenIds = new Set<string>();
    const areas = allAreas.filter((area) => {
      if (seenIds.has(area.id)) {
        return false;
      }
      seenIds.add(area.id);
      return true;
    });

    // Associate teams to areas using PREWAVE_MAPPING.teamToArea
    const unassociatedTeams: Team[] = [];

    for (const team of teams) {
      const teamId = team.id.replace("team:", "");
      const areaId = PREWAVE_MAPPING.teamToArea[teamId];

      if (areaId) {
        const area = areas.find((a) => a.id === areaId);
        if (area) {
          area.teams.push(team);
        } else {
          // Area not found, add to unassociated
          unassociatedTeams.push(team);
        }
      } else {
        // No mapping found, add to unassociated
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

  /**
   * Extract Objectives - for now return single uncategorized objective
   * TODO: Objectives not available yet - will be extracted from labels or custom field later
   */
  private extractObjectives(): Objective[] {
    // TODO: Extract from labels with "objective:" prefix when available
    // For now, return single default uncategorized objective
    return [
      {
        id: "uncategorized",
        name: "Uncategorized",
      },
    ];
  }

  /**
   * Extract Teams from issues and assignees
   * Uses Prewave-specific mapping as fallback
   */
  private extractTeams(
    allIssues: readonly JiraIssue[],
    assignees: readonly Person[],
  ): readonly Team[] {
    // First try to extract from labels
    const teamLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels || [], "team:"),
      ),
    );

    // Build teams from labels using map (immutable)
    // Note: extractLabelsWithPrefix already removes the "team:" prefix
    const teamsFromLabels = Array.from(teamLabels).map((teamId) => {
      const fullLabel = `team:${teamId}`;
      return {
        id: teamId,
        name:
          this.config.getLabelTranslations().teams[fullLabel] ||
          this.findTeamNameInMapping(teamId).orDefault(teamId),
      };
    });

    // If no teams from labels, try to derive from assignees using mapping
    const teamsFromAssignees =
      teamsFromLabels.length === 0
        ? assignees
            .map((assignee) => this.mapAssigneeToTeam(assignee).orDefault(null))
            .filter((teamId): teamId is string => teamId !== null)
            .filter(
              (teamId, index, self) => self.indexOf(teamId) === index, // Remove duplicates
            )
            .map((teamId) => ({
              id: teamId,
              name: this.findTeamNameInMapping(teamId).orDefault(teamId),
            }))
        : [];

    return [...teamsFromLabels, ...teamsFromAssignees];
  }

  /**
   * Find team name in Prewave mapping
   */
  private findTeamNameInMapping(teamId: string): Maybe<string> {
    return Maybe.fromNullable(
      Object.values(PREWAVE_MAPPING.areas)
        .map((area) => area.teams[teamId]?.name)
        .find((name) => name !== undefined),
    );
  }
}
