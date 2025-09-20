import JiraApiProxy from './jira-api-proxy.js';
import { logger } from '@omega-one/shared-utils';
import pkg from 'lodash';
const { uniqBy, uniq, groupBy, pick } = pkg;

/**
 * Collect cycle data for both roadmap and cycle overview views
 * This replaces the need for separate collect-cycle-overview-data.js and collect-roadmap-data.js
 */
export default async (omegaConfig, extraFields = []) => {
  const jiraApi = new JiraApiProxy(omegaConfig);
  
  // Get all sprint data from Jira (sprint terminology stays in Jira domain)
  const { sprints } = await jiraApi.getAllSprints();
  
  // Convert sprints to cycles for our domain
  const cycles = sprints.map(sprint => ({
    id: sprint.id,
    name: sprint.name,
    start: sprint.start,
    end: sprint.end,
    delivery: sprint.delivery,
    state: sprint.state,
    progress: 0, // Will be calculated after we have issues data
    isActive: sprint.state === 'active',
    description: null
  }));
  
  const activeCycle = cycles.find(cycle => cycle.isActive) || cycles[0];
  
  // Get all necessary data in parallel
  const [roadmapItems, releaseItemsByRoadmapItem] = await Promise.all([
    jiraApi.getRoadmapItems(),
    jiraApi.getReleaseItemsGroupedByRoadmapItem()
  ]);
  
  // Get issues for all cycles
  const allIssues = await Promise.all(
    sprints.map(({ id }) => jiraApi.getIssuesForSprint(id, extraFields))
  );
  
  // Process assignees from all issues
  const allIssuesFlat = allIssues.flat().filter(Boolean);
  const assignees = getAssignees(allIssuesFlat);
  
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
  
  // Calculate progress for each cycle based on issue completion
  const cyclesWithProgress = cycles.map(cycle => {
    // Get issues for this specific cycle
    const cycleIssues = allIssues.filter(issue => {
      // Check if issue belongs to this cycle
      return issue.fields.sprint && issue.fields.sprint.id === cycle.id;
    });
    
    if (cycleIssues.length === 0) {
      return { ...cycle, progress: 0 };
    }
    
    // Count completed issues (status === 'done')
    const completedIssues = cycleIssues.filter(issue => {
      const status = issue.fields.status.name.toLowerCase();
      return status === 'done' || status === 'completed' || status === 'closed';
    });
    
    const progress = Math.round((completedIssues.length / cycleIssues.length) * 100);
    return { ...cycle, progress };
  });
  
  return {
    // Core data
    roadmapItems,
    issues: allIssues,
    issuesByRoadmapItems: releaseItemsByRoadmapItem,
    
    // Cycle data
    cycles: cyclesWithProgress,
    
    // Metadata
    assignees,
    areas: enhancedAreas,
    initiatives,
    stages,
    
    // Teams
    teams: omegaConfig.getTeams()
  };
};

/**
 * Extract assignees from issues
 */
const getAssignees = (issues) => {
  return [{
    displayName: 'All Assignees',
    accountId: 'all'
  }].concat(uniqBy(issues
    .filter(issue => issue.fields.assignee !== null)
    .map(issue => issue.fields.assignee), 'accountId')
    .sort((assignee1, assignee2) => assignee1.displayName > assignee2.displayName ? 1 : -1));
};
