import { ReleaseItemParser } from '../calculator/release-item-parser.js';
import { RoadmapItemParser } from '../calculator/roadmap-item-parser.js';
import JiraApiProxy from './jira-api-proxy.js';
import { logger } from '@omega-one/shared-utils';
import pkg from 'lodash';
const { uniqBy } = pkg;

/**
 * Collect cycle data for both roadmap and cycle overview views
 * This replaces the need for separate collect-cycle-overview-data.js and collect-roadmap-data.js
 * Now uses existing parsers for Jira-specific logic while maintaining flat structure
 */
export default async (omegaConfig, extraFields = []) => {
  console.log('🚀 COLLECT CYCLE DATA: Using integrated parser with existing parsers');
  logger.default.info('🔄 COLLECT CYCLE DATA: Using integrated parser with existing parsers');
  const jiraApi = new JiraApiProxy(omegaConfig);
  
  logger.default.info('🔄 PARSING CYCLE DATA: Starting with existing parsers');
  
  // Get all sprint data from Jira
  const { sprints } = await jiraApi.getSprintsData();
  
  // Convert sprints to cycles for our domain
  const cycles = sprints.map(sprint => ({
    id: sprint.id,
    name: sprint.name,
    start: sprint.startDate,
    end: sprint.endDate,
    delivery: sprint.startDate,
    state: sprint.state,
    progress: 0, // Will be calculated after we have release items
    isActive: sprint.state === 'active',
    description: null
  }));
  
  // Get all necessary data in parallel
  const [roadmapItems, releaseItems] = await Promise.all([
    jiraApi.getRoadmapItemsData(),
    jiraApi.getReleaseItemsData()
  ]);
  
  // Get issues for all cycles
  const allIssues = await Promise.all(
    sprints.map(({ id }) => jiraApi.getIssuesForSprint(id))
  );
  
  // Process assignees from all issues
  const allIssuesFlat = allIssues.flat().filter(Boolean);
  const assignees = getAssignees(allIssuesFlat);
  
  // Parse release items using existing parsers
  const parsedReleaseItems = [];
  const roadmapItemsFlat = [];
  
  // Process release items from getReleaseItemsData() which have proper roadmapItemId
  releaseItems.forEach(rawReleaseItem => {
    if (!rawReleaseItem.roadmapItemId) return; // Skip items without roadmapItemId
    
    // Find the corresponding issue for additional fields
    const matchingIssue = allIssues.flat().find(issue => 
      issue && issue.key === rawReleaseItem.id
    );
    
    // Use existing ReleaseItemParser if we have an issue, otherwise create basic data
    let parsedReleaseItem;
    if (matchingIssue) {
      const cycle = cycles.find(c => c.id === rawReleaseItem.cycleId);
      if (cycle) {
        const releaseItemParser = new ReleaseItemParser(cycle, omegaConfig);
        parsedReleaseItem = releaseItemParser.parse(matchingIssue);
      }
    }
    
    // Create flat release item with foreign keys
    const releaseItem = {
      id: rawReleaseItem.id,
      key: rawReleaseItem.id,
      name: parsedReleaseItem?.name || rawReleaseItem.summary,
      description: matchingIssue?.fields?.description || rawReleaseItem.description || '',
      status: parsedReleaseItem?.status || rawReleaseItem.status,
      effort: parsedReleaseItem?.effort || rawReleaseItem.effort || 0,
      assignee: parsedReleaseItem?.assignee || rawReleaseItem.assignee,
      areaIds: parsedReleaseItem?.areaIds || rawReleaseItem.areaIds || [],
      teams: parsedReleaseItem?.teams || rawReleaseItem.teams || [],
      stage: parsedReleaseItem?.stage || rawReleaseItem.stage,
      url: parsedReleaseItem?.url || rawReleaseItem.url,
      isExternal: parsedReleaseItem?.isExternal || rawReleaseItem.isExternal || false,
      validations: parsedReleaseItem?.validations || rawReleaseItem.validations || [],
      isPartOfReleaseNarrative: parsedReleaseItem?.isPartOfReleaseNarrative || rawReleaseItem.isPartOfReleaseNarrative || false,
      isReleaseAtRisk: parsedReleaseItem?.isReleaseAtRisk || rawReleaseItem.isReleaseAtRisk || false,
      roadmapItemId: rawReleaseItem.roadmapItemId,  // Foreign key from getReleaseItemsData()
      cycleId: rawReleaseItem.cycleId,  // Foreign key
      cycle: rawReleaseItem.cycle || { id: rawReleaseItem.cycleId, name: `Cycle ${rawReleaseItem.cycleId}` },
      created: matchingIssue?.fields?.created || new Date().toISOString(),
      updated: matchingIssue?.fields?.updated || new Date().toISOString()
    };
    
    parsedReleaseItems.push(releaseItem);
  });
  
  // Parse roadmap items using existing parser
  const roadmapItemParser = new RoadmapItemParser(roadmapItems, omegaConfig);
  
  Object.entries(roadmapItems).forEach(([projectId, roadmapItem]) => {
    // Get release items for this roadmap item
    const itemReleaseItems = parsedReleaseItems.filter(ri => ri.roadmapItemId === projectId);
    
    // Parse using existing RoadmapItemParser
    const parsedRoadmapItem = roadmapItemParser.parse(projectId, itemReleaseItems);
    
    // Create flat roadmap item
    const flatRoadmapItem = {
      id: projectId,
      name: parsedRoadmapItem.name,
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
  let enhancedAreas = {};
  if (omegaConfig.isUsingFakeCycleData()) {
    // Import FakeDataGenerator to get enhanced areas
    const FakeDataGenerator = (await import('./fake-data-generator.js')).default;
    const fakeDataGenerator = new FakeDataGenerator(omegaConfig);
    enhancedAreas = fakeDataGenerator.getEnhancedAreas();
  } else {
    // Convert areas to objects with teams for real data
    Object.entries(areas).forEach(([areaId, areaName]) => {
      enhancedAreas[areaId] = {
        name: areaName,
        teams: []
      };
    });
  }
  
  // Calculate progress for each cycle based on release item completion
  const cyclesWithProgress = cycles.map(cycle => {
    const cycleReleaseItems = parsedReleaseItems.filter(ri => ri.cycleId === cycle.id);
    
    if (cycleReleaseItems.length === 0) {
      return { ...cycle, progress: 0 };
    }
    
    const completedItems = cycleReleaseItems.filter(ri => {
      const status = ri.status?.toLowerCase();
      return status === 'done' || status === 'completed' || status === 'closed';
    });
    
    const progress = Math.round((completedItems.length / cycleReleaseItems.length) * 100);
    return { ...cycle, progress };
  });
  
  return {
    // Core data - flat structure
    roadmapItems: roadmapItemsFlat,
    releaseItems: parsedReleaseItems,
    
    // Cycle data
    cycles: cyclesWithProgress,
    
    // Metadata - all as arrays
    assignees,
    areas: enhancedAreas,
    initiatives: Object.entries(initiatives).map(([id, name]) => ({ id, name })),
    stages
  };
};

/**
 * Extract assignees from issues
 */
const getAssignees = (issues) => {
  const { uniqBy } = pkg;
  
  return [{
    displayName: 'All Assignees',
    accountId: 'all'
  }].concat(uniqBy(issues
    .filter(issue => issue.fields.assignee !== null)
    .map(issue => issue.fields.assignee), 'accountId')
    .sort((assignee1, assignee2) => assignee1.displayName > assignee2.displayName ? 1 : -1));
};


