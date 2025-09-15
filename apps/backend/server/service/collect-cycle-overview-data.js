import JiraApiProxy from './jira-api-proxy.js';
import { logger } from '@omega-one/shared-utils';
import pkg from 'lodash';
const { uniqBy } = pkg;

const getAssignees = (issues) => {
  return [{
    displayName: 'All Assignees',
    accountId: 'all'
  }].concat(uniqBy(issues
    .filter(issue => issue.fields.assignee !== null)
    .map(issue => issue.fields.assignee), 'accountId')
    .sort((assignee1, assignee2) => assignee1.displayName > assignee2.displayName ? 1 : -1));
};

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
  
  const [roadmapItems, issues] = await Promise.all([
    jiraApi.getRoadmapItems(),
    jiraApi.getIssuesForSprint(sprint.id, extraFields)
  ]);
  const assignees = getAssignees(issues);
  const areas = omegaConfig.getAreas();
  const initiatives = omegaConfig.getInitiatives();

  return { 
    roadmapItems, 
    issues, 
    cycle: activeCycle,  // Use cycle instead of sprint
    cycles,             // Use cycles instead of sprints
    assignees, 
    areas, 
    initiatives 
  };
};
