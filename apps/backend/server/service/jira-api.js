import { AgileClient } from 'jira.js';
import pkg from 'lodash';
const { omit, get, groupBy } = pkg;

class JiraAPI {
  constructor(omegaConfig) {
    this.omegaConfig = omegaConfig;
    this._client = this._createClient();
  }

  async getSprintById(sprintId) {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const rawSprints = await this._client.board.getAllSprints({ boardId: jiraConfig.boardId });
    const filteredSprints = this._filterClosedSprints(rawSprints);
    const sprints = this._mapSprints(filteredSprints);
    let selectedSprint;

    if(sprintId) {
      selectedSprint = rawSprints.values.find(({ id }) => `${id}` === sprintId);
    } else {
      selectedSprint = this._findActiveOrLatest(filteredSprints);
    }

    const sprint = {
      name: selectedSprint.name,
      end: selectedSprint.endDate,
      start: selectedSprint.startDate,
      delivery: selectedSprint.startDate,
      id: selectedSprint.id,
      state: selectedSprint.state
    };

    return { sprint, sprints };
  }

  async getIssuesForSprint(sprintId, extraFields = []) {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const { issues } = await this._client.board.getBoardIssuesForSprint({
      maxResults: jiraConfig.limits.maxResults,
      boardId: jiraConfig.boardId,
      sprintId,
      jql: 'issuetype = "Release Item"',
      fields: ['parent', 'summary', jiraConfig.fields.effort, jiraConfig.fields.externalRoadmap, 'status', 'labels', 'assignee', 'reporter', 'sprint', 'closedSprints'].concat(extraFields)
    });

    return issues.map(issue => {
      return {
        ...issue,
        fields: {
          ...omit(issue.fields, [jiraConfig.fields.effort, jiraConfig.fields.externalRoadmap]),
          effort: issue.fields[jiraConfig.fields.effort],
          externalRoadmap: get(issue, `fields.${jiraConfig.fields.externalRoadmap}.value`),
          assignee: issue.fields.assignee ? {
            accountId: issue.fields.assignee.accountId,
            displayName: issue.fields.assignee.displayName
          } : null,
          reporter: issue.fields.reporter ? {
            accountId: issue.fields.reporter.accountId,
            displayName: issue.fields.reporter.displayName
          } : null,
        }
      };
    });
  }

  async getProjects() {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const response = await this._client.board.getIssuesForBoard({
      boardId: jiraConfig.boardId,
      maxResults: jiraConfig.limits.maxResults,
      jql: 'issuetype = "Roadmap Item"',
      fields: ['summary', 'labels', jiraConfig.fields.externalRoadmap, jiraConfig.fields.externalRoadmapDescription]
    });
    const projectData = response.issues.map(issue => ({
      [issue.key]: {
        summary: issue.fields.summary,
        labels: issue.fields.labels,
        externalRoadmap: get(issue, `fields.${jiraConfig.fields.externalRoadmap}.value`),
        externalRoadmapDescription: get(issue, `fields.${jiraConfig.fields.externalRoadmapDescription}`)
      }
    }));
    return Object.assign({}, ...projectData);
  }

  async getFutureIssuesByRoadmapItems() {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const issues = await this._client.board.getIssuesForBoard({
      boardId: jiraConfig.boardId,
      maxResults: jiraConfig.limits.maxResultsForFutureIssues,
      jql: 'issuetype = "Release Item"',
      fields: ['parent', 'result', 'summary', 'closedSprints', 'status', 'sprint']
    })
    const filteredIssues = issues.issues.map(issue => {
      return {
        id: issue.key,
        summary: issue.fields.summary,
        closedSprints: get(issue, 'fields.closedSprints', []),
        parent: get(issue, 'fields.parent.key'),
        status: get(issue, 'fields.status'),
        sprint: get(issue, 'fields.sprint')
      };
    }).filter(x => !!x.parent)
      .filter(x => !(x.sprint === null && x.status === 'Done'))
      .filter(x => x.status !== 'Cancelled')

    return groupBy(filteredIssues, 'parent')
  }

  _findActiveOrLatest(filteredSprints) {
    return filteredSprints.find(({ state }) => state === 'active') ||
      filteredSprints.find(({ state }) => state === 'closed');
  }

  _createClient() {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    return new AgileClient({
      host: jiraConfig.host,
      authentication: {
        basic: {
          email: jiraConfig.user,
          apiToken: jiraConfig.token
        }
      }
    });
  }

  _mapSprints(sprints) {
    return sprints.map(sprint => ({
      name: sprint.name,
      id: sprint.id,
      state: sprint.state,
      end: sprint.endDate,
      start: sprint.startDate,
      delivery: sprint.startDate
    }));
  }

  _filterClosedSprints(sprints) {
    const closedSprints = sprints.values
      .filter(sprint => sprint.state === 'closed')
      .sort((s1, s2) => new Date(s2.endDate).getTime() - new Date(s1.endDate).getTime());
    const notClosedSprints = sprints.values.filter(sprint => sprint.state !== 'closed');

    return notClosedSprints.concat(closedSprints[0]);
  }
}

export default JiraAPI;
