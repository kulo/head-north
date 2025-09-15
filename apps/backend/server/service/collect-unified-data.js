import JiraApiProxy from './jira-api-proxy.js';
import { logger } from '@omega-one/shared-utils';
import pkg from 'lodash';
const { uniqBy, uniq, groupBy, pick } = pkg;

/**
 * Collect unified data for both roadmap and cycle overview views
 * This replaces the need for separate collect-cycle-overview-data.js and collect-roadmap-data.js
 */
export default async (cycleId, omegaConfig, extraFields = []) => {
  const jiraApi = new JiraApiProxy(omegaConfig);
  
  // Get sprint data from Jira (sprint terminology stays in Jira domain)
  const { sprint, sprints } = await jiraApi.getSprintById(cycleId);
  
  // Convert sprints to cycles for our domain
  const cycles = sprints.map(sprint => ({
    id: sprint.id,
    name: sprint.name,
    start: sprint.start,
    end: sprint.end,
    delivery: sprint.delivery,
    state: sprint.state,
    progress: 0, // TODO: Calculate progress
    isActive: sprint.state === 'active',
    description: null
  }));
  
  const activeCycle = cycles.find(cycle => cycle.isActive) || cycles[0];
  
  // Get all necessary data in parallel
  const [roadmapItems, issues, releaseItemsByRoadmapItem] = await Promise.all([
    jiraApi.getRoadmapItems(),
    cycleId ? jiraApi.getIssuesForSprint(cycleId, extraFields) : null,
    jiraApi.getReleaseItemsGroupedByRoadmapItem()
  ]);
  
  // Get issues for all cycles if no specific cycle requested
  const allIssues = cycleId ? [issues] : await Promise.all(
    sprints.map(({ id }) => jiraApi.getIssuesForSprint(id, extraFields))
  );
  
  // Process assignees from all issues
  const allIssuesFlat = allIssues.flat().filter(Boolean);
  const assignees = getAssignees(allIssuesFlat);
  
  // Get areas and initiatives from config
  const areas = omegaConfig.getAreas();
  const initiatives = omegaConfig.getInitiatives();
  const stages = omegaConfig.getStages();
  
  return {
    // Core data
    roadmapItems,
    issues: allIssues,
    issuesByRoadmapItems: releaseItemsByRoadmapItem,
    
    // Cycle data
    cycle: activeCycle,
    cycles,
    
    // Metadata
    assignees,
    areas,
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
