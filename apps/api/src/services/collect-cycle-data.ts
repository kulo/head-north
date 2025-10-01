import { ReleaseItemParser } from "../calculator/release-item-parser";
import { RoadmapItemParser } from "../calculator/roadmap-item-parser";
import JiraApiProxy from "./jira-api-proxy";
import { logger } from "@omega/utils";
import pkg from "lodash";
const { uniqBy } = pkg;
import type { OmegaConfig } from "@omega/config";
import type {
  Cycle,
  ReleaseItem,
  RoadmapItem,
  Person,
  Area,
  Team,
  Initiative,
} from "@omega/types";
import type {
  JiraSprintData,
  JiraIssue,
  JiraSprint,
  Stage,
  Team as ApiTeam,
} from "../types/api-response-types";

/**
 * Collect cycle data for both roadmap and cycle overview views
 * This replaces the need for separate collect-cycle-overview-data.js and collect-roadmap-data.js
 * Now uses existing parsers for Jira-specific logic while maintaining flat structure
 */
export default async (
  omegaConfig: OmegaConfig,
  extraFields: string[] = [],
): Promise<{
  roadmapItems: RoadmapItem[];
  releaseItems: ReleaseItem[];
  cycles: Cycle[];
  assignees: Person[];
  areas: Record<string, Area>;
  initiatives: Initiative[];
  stages: Stage[];
  teams: ApiTeam[];
}> => {
  logger.default.info(
    "🚀 COLLECT CYCLE DATA: Using integrated parser with existing parsers",
  );
  logger.default.info(
    "🔄 COLLECT CYCLE DATA: Using integrated parser with existing parsers",
  );
  const jiraApi = new JiraApiProxy(omegaConfig);

  logger.default.info("🔄 PARSING CYCLE DATA: Starting with existing parsers");

  // Get all sprint data from Jira
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

  // Process assignees from all issues
  const allIssuesFlat = allIssues.flat().filter(Boolean);
  const assignees = getAssignees(allIssuesFlat);

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
    let parsedReleaseItem: ReleaseItem;
    if (matchingIssue) {
      const cycle = cycles.find((c) => c.id === rawReleaseItem.cycleId);
      if (cycle) {
        const releaseItemParser = new ReleaseItemParser(cycle, omegaConfig);
        parsedReleaseItem = releaseItemParser.parse(matchingIssue);
      }
    }

    // Create flat release item with foreign keys
    const releaseItem: ReleaseItem = {
      ticketId: rawReleaseItem.id,
      effort: parsedReleaseItem?.effort || rawReleaseItem.effort || 0,
      projectId: parsedReleaseItem?.projectId || null,
      name: parsedReleaseItem?.name || rawReleaseItem.summary,
      areaIds: parsedReleaseItem?.areaIds || rawReleaseItem.areaIds || [],
      teams: parsedReleaseItem?.teams || rawReleaseItem.teams || [],
      status: parsedReleaseItem?.status || rawReleaseItem.status,
      url: parsedReleaseItem?.url || rawReleaseItem.url,
      isExternal:
        parsedReleaseItem?.isExternal || rawReleaseItem.isExternal || false,
      stage: parsedReleaseItem?.stage || rawReleaseItem.stage,
      assignee: parsedReleaseItem?.assignee || rawReleaseItem.assignee,
      validations:
        parsedReleaseItem?.validations || rawReleaseItem.validations || [],
      isPartOfReleaseNarrative:
        parsedReleaseItem?.isPartOfReleaseNarrative ||
        rawReleaseItem.isPartOfReleaseNarrative ||
        false,
      isReleaseAtRisk:
        parsedReleaseItem?.isReleaseAtRisk ||
        rawReleaseItem.isReleaseAtRisk ||
        false,
      roadmapItemId: rawReleaseItem.roadmapItemId, // Foreign key from getReleaseItemsData()
      cycleId: rawReleaseItem.cycleId, // Foreign key
      cycle: (() => {
        // Always look up the actual cycle by ID to get the correct name
        const matchingCycle = cycles.find(
          (c) => c.id === rawReleaseItem.cycleId,
        );
        return {
          id: rawReleaseItem.cycleId,
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

  Object.entries(roadmapItems).forEach(([projectId, roadmapItem]) => {
    // Get release items for this roadmap item
    const itemReleaseItems = parsedReleaseItems.filter(
      (ri) => ri.roadmapItemId === projectId,
    );

    // Parse using existing RoadmapItemParser
    const parsedRoadmapItem = roadmapItemParser.parse(
      projectId,
      itemReleaseItems,
    );

    // Create flat roadmap item
    const flatRoadmapItem: RoadmapItem = {
      id: projectId,
      name: parsedRoadmapItem.name,
      summary: parsedRoadmapItem.name,
      labels: [],
      externalRoadmap: parsedRoadmapItem.isExternal ? "Yes" : "No",
      initiative: parsedRoadmapItem.initiative,
      initiativeId: parsedRoadmapItem.initiativeId,
      theme: parsedRoadmapItem.theme,
      area: parsedRoadmapItem.area,
      isExternal: parsedRoadmapItem.isExternal,
      crew: parsedRoadmapItem.crew,
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
  let enhancedAreas: Record<string, Area> = {};
  if (omegaConfig.isUsingFakeCycleData()) {
    // Import FakeDataGenerator to get enhanced areas
    const FakeDataGenerator = (await import("./fake-data-generator")).default;
    const fakeDataGenerator = new FakeDataGenerator(omegaConfig);
    const enhancedAreasData = fakeDataGenerator.getEnhancedAreas();
    enhancedAreas = Object.fromEntries(
      Object.entries(enhancedAreasData).map(([id, data]) => [
        id,
        { ...data, id },
      ]),
    );
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
      id,
      name: name as string,
    })),
    stages,
    teams,
  };
};

/**
 * Extract assignees from issues
 */
const getAssignees = (issues: JiraIssue[]): Person[] => {
  return [
    {
      displayName: "All Assignees",
      accountId: "all",
    },
  ].concat(
    uniqBy(
      issues
        .filter((issue) => issue.fields.assignee !== null)
        .map((issue) => issue.fields.assignee),
      "accountId",
    ).sort((assignee1, assignee2) =>
      assignee1.displayName > assignee2.displayName ? 1 : -1,
    ),
  );
};
