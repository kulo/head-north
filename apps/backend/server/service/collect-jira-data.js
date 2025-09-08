import JiraAPI from './jira-api.js';
import FakeDataGenerator from './fake-data-generator.js';
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

const isJiraConfigured = (omegaConfig) => {
  const jiraConfig = omegaConfig.getJiraConfig();
  return (jiraConfig.user && jiraConfig.user.trim() && 
            jiraConfig.token && jiraConfig.token.trim() && 
            jiraConfig.host && jiraConfig.host.trim());
};

export default async (sprintId, omegaConfig, extraFields = []) => {
  if (isJiraConfigured(omegaConfig)) {
    logger.service.info('Jira is configured. Using real Jira API.');
    // Use real Jira API
    const jira = new JiraAPI(omegaConfig);
    const { sprint, sprints } = await jira.getSprintById(sprintId);
    const [projects, issues] = await Promise.all([
      jira.getProjects(),
      jira.getIssuesForSprint(sprint.id, extraFields)
    ]);
    const assignees = getAssignees(issues);

    return { projects, issues, sprint, sprints, assignees };
  } else {
    const fakeData = new FakeDataGenerator(omegaConfig);
    const { sprint, sprints } = await fakeData.getSprintById(sprintId);
    const [projects, issues] = await Promise.all([
      fakeData.getProjects(),
      fakeData.getIssuesForSprint(sprint.id, extraFields)
    ]);
    const assignees = getAssignees(issues);
    const areas = fakeData.getAreas();
    const initiatives = fakeData.getInitiatives();

    return { projects, issues, sprint, sprints, assignees, areas, initiatives };
  }
};
