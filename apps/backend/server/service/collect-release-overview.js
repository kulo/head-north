import JiraAPI from './jira-api.js';
import FakeDataGenerator from './fake-data-generator.js';
import { logger } from '@omega-one/shared-utils';

const isJiraConfigured = (omegaConfig) => {
  const jiraConfig = omegaConfig.getJiraConfig();
  return !!(jiraConfig.user && jiraConfig.token && jiraConfig.token !== 'XXX');
};

export default async (omegaConfig, extraFields = []) => {
  if (isJiraConfigured(omegaConfig)) {
    // Use real Jira API
    const jira = new JiraAPI(omegaConfig);
    const { sprint, sprints } = await jira.getSprintById();

    const [projects, issuesByRoadmapItems, ...issues] = await Promise.all([
      jira.getProjects(),
      jira.getFutureIssuesByRoadmapItems(),
      ...sprints.map(({ id }) => jira.getIssuesForSprint(id, extraFields))
    ]);
    return { projects, issues, issuesByRoadmapItems, sprint, sprints };
  } else {
    // Use fake data generator
    logger.service.warn('Jira API not available or credentials not configured, using fake data generator for release overview');
    const fakeData = new FakeDataGenerator(omegaConfig);
    const { sprint, sprints } = await fakeData.getSprintById();

    const [projects, issuesByRoadmapItems, ...issues] = await Promise.all([
      fakeData.getProjects(),
      fakeData.getFutureIssuesByRoadmapItems(),
      ...sprints.map(({ id }) => fakeData.getIssuesForSprint(id, extraFields))
    ]);
    return { projects, issues, issuesByRoadmapItems, sprint, sprints };
  }
};
