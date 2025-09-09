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

export default async (sprintId, omegaConfig, extraFields = []) => {
  const jiraApi = new JiraApiProxy(omegaConfig);
  
  const { sprint, sprints } = await jiraApi.getSprintById(sprintId);
  const [projects, issues] = await Promise.all([
    jiraApi.getRoadmapItems(),
    jiraApi.getIssuesForSprint(sprint.id, extraFields)
  ]);
  const assignees = getAssignees(issues);

  return { projects, issues, sprint, sprints, assignees };
};
