import JiraApiProxy from './jira-api-proxy.js';
import { logger } from '@omega-one/shared-utils';

export default async (omegaConfig, extraFields = []) => {
  const jiraApi = new JiraApiProxy(omegaConfig);
  
  const { sprint, sprints } = await jiraApi.getSprintById();

  const [roadmapItems, releaseItemsByRoadmapItem, ...issuesArrays] = await Promise.all([
    jiraApi.getRoadmapItems(),
    jiraApi.getReleaseItemsGroupedByRoadmapItem(),
    ...sprints.map(({ id }) => jiraApi.getIssuesForSprint(id, extraFields))
  ]);
  
  return { roadmapItems, issues: issuesArrays, issuesByRoadmapItems: releaseItemsByRoadmapItem, sprint, sprints };
};
