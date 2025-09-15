import JiraApiProxy from './jira-api-proxy.js';
import { logger } from '@omega-one/shared-utils';

export default async (omegaConfig, extraFields = []) => {
  const jiraApi = new JiraApiProxy(omegaConfig);
  
  // Get sprint data from Jira (sprint terminology stays in Jira domain)
  const { sprint, sprints } = await jiraApi.getSprintById();

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

  const [roadmapItems, releaseItemsByRoadmapItem, ...issuesArrays] = await Promise.all([
    jiraApi.getRoadmapItems(),
    jiraApi.getReleaseItemsGroupedByRoadmapItem(),
    ...sprints.map(({ id }) => jiraApi.getIssuesForSprint(id, extraFields))
  ]);
  
  return { 
    roadmapItems, 
    issues: issuesArrays, 
    issuesByRoadmapItems: releaseItemsByRoadmapItem, 
    cycle: activeCycle,  // Use cycle instead of sprint
    cycles              // Use cycles instead of sprints
  };
};
