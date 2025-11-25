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
  ISODateString,
} from "@headnorth/types";
import type { JiraAdapter } from "./jira-adapter.interface";
import {
  JiraClient,
  extractLabelsWithPrefix,
  extractAssignee,
  extractAllAssignees,
  extractSprintId,
  jiraSprintToCycle,
  mapJiraStatus,
  createJiraUrl,
  validateRequired,
} from "@headnorth/jira-primitives";
import type { JiraIssue } from "@headnorth/jira-primitives";

/**
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

      if (inspectEpic) {
        const sprintId = extractSprintId(inspectEpic, PREWAVE_FIELDS.sprint);
        sprintId.caseOf({
          Just: (id) => {
            logger.default.info("PrewaveJiraAdapter: sprint field inspection", {
              key: inspectEpic.key,
              sprintId: id,
            });
          },
          Nothing: () => {
            logger.default.info("PrewaveJiraAdapter: sprint field inspection", {
              key: inspectEpic.key,
              sprintId: null,
            });
          },
        });
      }

      // 2. Transform sprints to cycles and normalize dates to YYYY-MM-DD
      const cycles = sprints.map(jiraSprintToCycle).map((c) => ({
        ...c,
        start: c.start
          ? ((c.start as string).slice(0, 10) as ISODateString)
          : ("" as ISODateString),
        end: c.end
          ? ((c.end as string).slice(0, 10) as ISODateString)
          : ("" as ISODateString),
        delivery: c.delivery
          ? ((c.delivery as string).slice(0, 10) as ISODateString)
          : ("" as ISODateString),
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

    // Extract assignee - use DEFAULT_ASSIGNEE if missing
    const assignee = extractAssignee(issue).orDefault({
      id: this.config.getDefaultValues().DEFAULT_ASSIGNEE.ID,
      name: this.config.getDefaultValues().DEFAULT_ASSIGNEE.NAME,
    } as Person);

    // Map status using Prewave-specific mapping
    const status = this.mapPrewaveStatus(issue.fields.status);

    // Extract sprint/cycle ID - tries standard field first, then custom field
    // Prewave stores sprint in customfield_10021 (can be array or single object)
    const cycleId = extractSprintId(issue, PREWAVE_FIELDS.sprint)
      .map((id: string | number) => id.toString())
      .orDefault("");

    const cycle = Maybe.fromNullable(cycles.find((c) => c.id === cycleId))
      .map((c) => ({ id: c.id, name: c.name }))
      .orDefault({
        id: this.config.getDefaultValues().DEFAULT_TICKET_ID,
        name: "Unknown Cycle",
      });

    // Generate virtual roadmap item ID
    const roadmapItemId = `VIRTUAL-${issue.key}`;

    // Extract Product Area from assignee mapping (TODO: will be in labels later)
    const defaultProductAreaId =
      this.config.getDefaultValues().DEFAULT_PRODUCT_AREA.ID;
    const productAreaId =
      this.mapAssigneeToProductArea(assignee).orDefault(defaultProductAreaId);
    const isProductAreaDefault = productAreaId === defaultProductAreaId;
    const areaIds = !isProductAreaDefault ? [productAreaId] : [];

    // Extract Team from assignee mapping (TODO: will be in labels later)
    const defaultTeamId = this.config.getDefaultValues().DEFAULT_TEAM.ID;
    const teamId = this.mapAssigneeToTeam(assignee).orDefault(defaultTeamId);
    const isTeamDefault = teamId === defaultTeamId;
    const teams = !isTeamDefault ? [teamId] : [];

    // Release Stage not available yet (TODO: will be added later)
    const stage = this.config.getDefaultValues().DEFAULT_RELEASE_STAGE.ID;

    // Generate validations
    const validations: ValidationItem[] = [
      ...validateRequired(effort, issue.key, "effort"),
      // Product Area validation - warn if using default value
      ...(isProductAreaDefault
        ? [
            {
              id: `${issue.key}-missingArea`,
              code: "missingArea",
              name: "Missing Product Area",
              status: "warning",
              description:
                "Product Area not available in Jira data yet. TODO: Will be extracted from labels or assignee mapping.",
            },
          ]
        : []),
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
      id: this.config.getDefaultValues().DEFAULT_ASSIGNEE.ID,
      name: this.config.getDefaultValues().DEFAULT_ASSIGNEE.NAME,
    } as Person);
    const defaultProductAreaId =
      this.config.getDefaultValues().DEFAULT_PRODUCT_AREA.ID;
    const productAreaId =
      this.mapAssigneeToProductArea(assignee).orDefault(defaultProductAreaId);
    const isProductAreaDefault = productAreaId === defaultProductAreaId;

    // Extract host URL
    const host = Maybe.fromNullable(this.jiraConfig.connection.host).orDefault(
      "",
    );

    // Generate validations
    const validations: ValidationItem[] = isProductAreaDefault
      ? [
          {
            id: `${issue.key}-missingArea`,
            code: "missingArea",
            name: "Missing Product Area",
            status: "warning",
            description:
              "Product Area not available in Jira data yet. TODO: Will be extracted from labels or assignee mapping.",
          },
        ]
      : [];

    return {
      id: `VIRTUAL-${issue.key}`,
      name: issue.fields.summary,
      summary: issue.fields.summary,
      ...(productAreaId && {
        area: {
          id: productAreaId,
          name: PREWAVE_MAPPING.areas[productAreaId]?.name || productAreaId,
          teams: [],
        },
      }),
      objectiveId: this.config.getDefaultValues().DEFAULT_OBJECTIVE.ID, // TODO: Objectives not available yet
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
    // First try to extract from labels
    const areaLabels = new Set(
      allIssues.flatMap((issue) =>
        extractLabelsWithPrefix(issue.fields.labels, "area"),
      ),
    );

    // Build areas from labels as array
    // Note: extractLabelsWithPrefix already removes the "area:" prefix
    const areasFromLabels = Array.from(areaLabels).map((label) => {
      const areaId = label; // Label already has prefix removed
      const translations = this.config.getLabelTranslations().areas;
      const name = Maybe.fromNullable(translations[label]).orDefault(
        Maybe.fromNullable(PREWAVE_MAPPING.areas[areaId]?.name).orDefault(
          areaId,
        ),
      );
      return {
        id: areaId,
        name,
        teams: [] as readonly Team[],
      };
    });

    // If no areas from labels, try to derive from assignees using mapping
    const areasFromAssignees =
      areasFromLabels.length === 0
        ? (() => {
            const seenAreaIds = new Set<string>();
            return assignees
              .map((assignee) => {
                const areaId = this.mapAssigneeToProductArea(
                  assignee,
                ).orDefault(
                  this.config.getDefaultValues().DEFAULT_PRODUCT_AREA.ID,
                );
                if (areaId && !seenAreaIds.has(areaId)) {
                  seenAreaIds.add(areaId);
                  const name = Maybe.fromNullable(
                    PREWAVE_MAPPING.areas[areaId]?.name,
                  ).orDefault(areaId);
                  return {
                    id: areaId,
                    name,
                    teams: [] as readonly Team[],
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
        ? Object.keys(PREWAVE_MAPPING.areas).map((areaId) => {
            const name = Maybe.fromNullable(
              PREWAVE_MAPPING.areas[areaId]?.name,
            ).orDefault(areaId);
            return {
              id: areaId,
              name,
              teams: [] as readonly Team[],
            };
          })
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
    const baseAreas = allAreas.filter((area) => {
      if (seenIds.has(area.id)) {
        return false;
      }
      seenIds.add(area.id);
      return true;
    });

    // Associate teams to areas using PREWAVE_MAPPING.teamToArea
    // Build a map of areaId -> teams to associate immutably using reduce
    // Note: team.id already has "team:" prefix removed by extractLabelsWithPrefix
    const { teamsByAreaId, unassociatedTeams } = teams.reduce(
      (acc, team) => {
        const teamId = team.id; // Already without "team:" prefix
        const areaId = PREWAVE_MAPPING.teamToArea[teamId];

        if (areaId) {
          const existingTeams = Maybe.fromNullable(
            acc.teamsByAreaId.get(areaId),
          ).orDefault([]);
          return {
            teamsByAreaId: new Map(acc.teamsByAreaId).set(areaId, [
              ...existingTeams,
              team,
            ]),
            unassociatedTeams: acc.unassociatedTeams,
          };
        } else {
          return {
            teamsByAreaId: acc.teamsByAreaId,
            unassociatedTeams: [...acc.unassociatedTeams, team],
          };
        }
      },
      {
        teamsByAreaId: new Map<string, Team[]>(),
        unassociatedTeams: [] as Team[],
      },
    );

    // Create areas with associated teams immutably
    const areasWithTeams = baseAreas.map((area) => {
      const associatedTeams = Maybe.fromNullable(
        teamsByAreaId.get(area.id),
      ).orDefault([]);
      if (associatedTeams.length === 0) {
        return area;
      }
      return {
        ...area,
        teams: [...area.teams, ...associatedTeams] as readonly Team[],
      };
    });

    // Handle unassociated teams - create or update default area immutably
    if (unassociatedTeams.length > 0) {
      const defaultAreaId =
        this.config.getDefaultValues().DEFAULT_PRODUCT_AREA.ID;
      const existingDefaultArea = areasWithTeams.find(
        (area) => area.id === defaultAreaId,
      );

      if (existingDefaultArea) {
        // Update existing default area with unassociated teams
        const updatedAreas = areasWithTeams.map((area) =>
          area.id === defaultAreaId
            ? {
                ...area,
                teams: [...area.teams, ...unassociatedTeams] as readonly Team[],
              }
            : area,
        );
        return updatedAreas;
      } else {
        // Create new default area with unassociated teams
        return [
          ...areasWithTeams,
          {
            id: defaultAreaId,
            name: this.config.getDefaultValues().DEFAULT_PRODUCT_AREA.NAME,
            teams: unassociatedTeams as readonly Team[],
          },
        ];
      }
    }

    return areasWithTeams;
  }

  /**
   * Extract Objectives - for now return single default objective
   * TODO: Objectives not available yet - will be extracted from labels or custom field later
   */
  private extractObjectives(): Objective[] {
    // TODO: Extract from labels with "objective:" prefix when available
    // For now, return single default objective
    return [
      {
        id: this.config.getDefaultValues().DEFAULT_OBJECTIVE.ID,
        name: this.config.getDefaultValues().DEFAULT_OBJECTIVE.NAME,
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
        extractLabelsWithPrefix(issue.fields.labels || [], "team"),
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
            .map((assignee) =>
              this.mapAssigneeToTeam(assignee).orDefault(
                this.config.getDefaultValues().DEFAULT_TEAM.ID,
              ),
            )
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
