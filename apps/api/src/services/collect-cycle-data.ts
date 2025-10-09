import { ReleaseItemParser } from "../calculator/release-item-parser";
import { RoadmapItemParser } from "../calculator/roadmap-item-parser";
import JiraApiProxy from "./jira-api-proxy";
import _ from "lodash";
import type { OmegaConfig } from "@omega/config";
import type {
  Cycle,
  ReleaseItem,
  RoadmapItem,
  Person,
  Area,
  Team,
  RawCycleData,
} from "@omega/types";
import type { JiraIssue, JiraSprint } from "../types/jira-types";

/**
 * Collect cycle data for both roadmap and cycle overview views
 * This replaces the need for separate collect-cycle-overview-data.js and collect-roadmap-data.js
 * Now uses existing parsers for Jira-specific logic while maintaining flat structure
 */
export default async (
  omegaConfig: OmegaConfig,
  _extraFields: string[] = [],
): Promise<RawCycleData> => {
  const jiraApi = new JiraApiProxy(omegaConfig);

  // Initialize enhancedAreas early to avoid hoisting issues
  let enhancedAreas: Record<string, Area> = {};

  const { sprints } = await jiraApi.getSprintsData();

  // Convert sprints to cycles for our domain
  const cycles: Cycle[] = sprints.map((sprint: JiraSprint) => ({
    id: sprint.id,
    name: sprint.name,
    start: sprint.startDate,
    end: sprint.endDate,
    delivery: sprint.startDate,
    state: sprint.state,
  }));

  // Get all necessary data in parallel
  const [roadmapItems, releaseItems] = await Promise.all([
    jiraApi.getRoadmapItemsData(),
    jiraApi.getReleaseItemsData(),
  ]);

  // Get issues for all cycles
  const allIssues = await Promise.all(
    sprints.map(({ id }: JiraSprint) => jiraApi.getIssuesForSprint(id)),
  );

  // Process assignees from all issues (will be overridden for fake data)
  const allIssuesFlat = allIssues.flat().filter(Boolean);
  let assignees = getAssignees(allIssuesFlat);

  // Parse release items using existing parsers
  const parsedReleaseItems: ReleaseItem[] = [];
  const roadmapItemsFlat: RoadmapItem[] = [];

  // Process release items from getReleaseItemsData() which have proper roadmapItemId
  releaseItems.forEach((rawReleaseItem: JiraIssue) => {
    if (!rawReleaseItem.roadmapItemId) return; // Skip items without roadmapItemId

    // Find the corresponding issue for additional fields
    const matchingIssue = allIssues
      .flat()
      .find((issue: JiraIssue) => issue && issue.key === rawReleaseItem.id);

    // Use existing ReleaseItemParser if we have an issue, otherwise create basic data
    let parsedReleaseItem: ReleaseItem | undefined;
    if (matchingIssue) {
      const cycle = cycles.find((c) => c.id === rawReleaseItem.cycleId);
      if (cycle) {
        const releaseItemParser = new ReleaseItemParser(cycle, omegaConfig);
        parsedReleaseItem = releaseItemParser.parse(matchingIssue);
      }
    }

    // Create flat release item with foreign keys
    const releaseItem: ReleaseItem = {
      id: rawReleaseItem.id,
      ticketId: rawReleaseItem.id,
      effort: parsedReleaseItem?.effort || rawReleaseItem.effort || 0,
      name: parsedReleaseItem?.name || rawReleaseItem.summary || "",
      areaIds: parsedReleaseItem?.areaIds || rawReleaseItem.areaIds || [],
      teams: parsedReleaseItem?.teams || rawReleaseItem.teams || [],
      status: parsedReleaseItem?.status || rawReleaseItem.status || "",
      url: parsedReleaseItem?.url || rawReleaseItem.url || "",
      isExternal:
        parsedReleaseItem?.isExternal || rawReleaseItem.isExternal || false,
      stage: parsedReleaseItem?.stage || rawReleaseItem.stage || "",
      assignee: parsedReleaseItem?.assignee || rawReleaseItem.assignee || {},
      validations:
        parsedReleaseItem?.validations || rawReleaseItem.validations || [],
      roadmapItemId: rawReleaseItem.roadmapItemId, // Foreign key from getReleaseItemsData()
      cycleId: rawReleaseItem.cycleId?.toString() || "", // Foreign key
      cycle: (() => {
        // Always look up the actual cycle by ID to get the correct name
        const matchingCycle = cycles.find(
          (c) => c.id === rawReleaseItem.cycleId?.toString(),
        );
        return {
          id: rawReleaseItem.cycleId?.toString() || "",
          name: matchingCycle?.name || `Cycle ${rawReleaseItem.cycleId}`,
        };
      })(),
      created: matchingIssue?.fields?.created || new Date().toISOString(),
      updated: matchingIssue?.fields?.updated || new Date().toISOString(),
    };

    parsedReleaseItems.push(releaseItem);
  });

  // Parse roadmap items using existing parser
  const roadmapItemParser = new RoadmapItemParser(roadmapItems, omegaConfig);

  Object.entries(roadmapItems).forEach(([projectId, _roadmapItem]) => {
    // Get release items for this roadmap item
    const itemReleaseItems = parsedReleaseItems.filter(
      (ri) => ri.roadmapItemId === projectId,
    );

    // Parse using existing RoadmapItemParser
    const parsedRoadmapItem = roadmapItemParser.parse(
      projectId,
      itemReleaseItems,
    );

    // Convert TeamId to Team object
    const owningTeamId = parsedRoadmapItem.owningTeam;
    const owningTeam: Team = (() => {
      // Find the team in enhanced areas
      for (const area of Object.values(enhancedAreas)) {
        const team = area.teams.find((t) => t.id === owningTeamId);
        if (team) {
          return team;
        }
      }
      // Fallback: create a basic team object if not found
      return {
        id: owningTeamId,
        name: `Team ${owningTeamId}`,
      };
    })();

    // Create flat roadmap item
    const flatRoadmapItem: RoadmapItem = {
      id: projectId,
      name: parsedRoadmapItem.name,
      summary: parsedRoadmapItem.name,
      labels: [],
      initiativeId: parsedRoadmapItem.initiativeId,
      theme: parsedRoadmapItem.theme,
      area: parsedRoadmapItem.area as unknown as Area,
      isExternal: parsedRoadmapItem.isExternal,
      owningTeam: owningTeam,
      url: parsedRoadmapItem.url,
      validations: parsedRoadmapItem.validations,
      // Remove the nested releaseItems - they're in the flat releaseItems array
    };

    roadmapItemsFlat.push(flatRoadmapItem);
  });

  // Get areas and initiatives from config
  const areas = omegaConfig.getAreas();
  const initiatives = omegaConfig.getInitiatives();
  const stages = omegaConfig.getStages();

  // Get enhanced areas with teams from fake data generator if available
  if (omegaConfig.isUsingFakeCycleData()) {
    // Import FakeDataGenerator to get enhanced areas and assignees
    const FakeDataGenerator = (await import("./fake-data-generator")).default;
    const fakeDataGenerator = new FakeDataGenerator(omegaConfig);
    const enhancedAreasData = fakeDataGenerator.getEnhancedAreas();
    enhancedAreas = Object.fromEntries(
      Object.entries(enhancedAreasData).map(([id, data]) => [
        id,
        { ...data, id },
      ]),
    );
    // Use fake data generator's assignees directly
    assignees = fakeDataGenerator.getAssignees();
  } else {
    // Convert areas to objects with teams for real data
    Object.entries(areas).forEach(([areaId, areaName]) => {
      enhancedAreas[areaId] = {
        id: areaId,
        name: areaName as string,
        teams: [],
      };
    });
  }

  // Calculate progress for each cycle based on release item completion
  const cyclesWithProgress = cycles.map((cycle) => {
    const cycleReleaseItems = parsedReleaseItems.filter(
      (ri) => ri.cycleId === cycle.id,
    );

    if (cycleReleaseItems.length === 0) {
      return { ...cycle, progress: 0 };
    }

    const completedItems = cycleReleaseItems.filter((ri) => {
      const status = ri.status?.toLowerCase();
      return status === "done" || status === "completed" || status === "closed";
    });

    const progress = Math.round(
      (completedItems.length / cycleReleaseItems.length) * 100,
    );
    return { ...cycle, progress };
  });

  // Get teams from enhanced areas
  const teams = Object.values(enhancedAreas).flatMap((area) => area.teams);

  return {
    // Core data - flat structure
    roadmapItems: roadmapItemsFlat,
    releaseItems: parsedReleaseItems,

    // Cycle data
    cycles: cyclesWithProgress,

    // Metadata - all as arrays
    assignees,
    areas: enhancedAreas,
    initiatives: Object.entries(initiatives).map(([id, name]) => ({
      id: id as string,
      name: name as string,
      roadmapItems: [],
      progress: 0,
      progressWithInProgress: 0,
      progressByReleaseItems: 0,
      weeks: 0,
      weeksDone: 0,
      weeksInProgress: 0,
      weeksNotToDo: 0,
      weeksCancelled: 0,
      weeksPostponed: 0,
      weeksTodo: 0,
      releaseItemsCount: 0,
      releaseItemsDoneCount: 0,
      percentageNotToDo: 0,
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    })),
    stages,
    teams,
  };
};

/**
 * Extract assignees from issues
 */
const getAssignees = (issues: JiraIssue[]): Person[] => {
  return _.uniqBy(
    issues
      .filter((issue) => issue.fields.assignee !== null)
      .map((issue) => issue.fields.assignee!)
      .map((assignee) => ({
        name: assignee.displayName,
        id: assignee.accountId,
      })),
    "id",
  ).sort((assignee1, assignee2) => {
    return assignee1.name > assignee2.name ? 1 : -1;
  });
};
