import { AgileClient } from 'jira.js';
import pkg from 'lodash';
const { omit, get } = pkg;

class JiraAPI {
  constructor(omegaConfig) {
    this.omegaConfig = omegaConfig;
    this._client = this._createClient();
  }

  /**
   * Get all sprints data (raw from Jira)
   * @returns {Promise<Object>} Raw sprint data
   */
  async getSprintsData() {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const sprints = await this._client.board.getAllSprints({
      boardId: jiraConfig.boardId,
      state: 'active,closed,future'
    });
    
    return { sprints: sprints.values };
  }

  /**
   * Get roadmap items data (raw from Jira)
   * @returns {Promise<Object>} Raw roadmap items data
   */
  async getRoadmapItemsData() {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const response = await this._client.board.getIssuesForBoard({
      boardId: jiraConfig.boardId,
      maxResults: jiraConfig.limits.maxResults,
      jql: 'issuetype = "Roadmap Item"',
      fields: ['summary', 'labels', jiraConfig.fields.externalRoadmap, jiraConfig.fields.externalRoadmapDescription]
    });
    
    const roadmapItemData = response.issues.map(issue => ({
      [issue.key]: {
        summary: issue.fields.summary,
        labels: issue.fields.labels,
        externalRoadmap: get(issue, `fields.${jiraConfig.fields.externalRoadmap}.value`),
        externalRoadmapDescription: get(issue, `fields.${jiraConfig.fields.externalRoadmapDescription}`)
      }
    }));
    
    return Object.assign({}, ...roadmapItemData);
  }

  /**
   * Get release items data (raw from Jira)
   * @returns {Promise<Array>} Raw release items data
   */
  async getReleaseItemsData() {
    const jiraConfig = this.omegaConfig.getJiraConfig();
    const issues = await this._client.board.getIssuesForBoard({
      boardId: jiraConfig.boardId,
      maxResults: jiraConfig.limits.maxResultsForFutureIssues,
      jql: 'issuetype = "Release Item"',
      fields: ['parent', 'result', 'summary', 'closedSprints', 'status', 'sprint']
    });
    
    return issues.issues.map(issue => ({
      id: issue.key,
      summary: issue.fields.summary,
      closedSprints: get(issue, 'fields.closedSprints', []),
      parent: get(issue, 'fields.parent.key'),
      status: get(issue, 'fields.status'),
      sprint: get(issue, 'fields.sprint'),
      roadmapItemId: get(issue, 'fields.parent.key'), // Foreign key
      cycleId: get(issue, 'fields.sprint.id') // Foreign key
    })).filter(x => !!x.parent)
      .filter(x => !(x.sprint === null && x.status === 'Done'))
      .filter(x => x.status !== 'Cancelled');
  }

  /**
   * Get issues for a specific sprint (raw from Jira)
   * @param {string|number} sprintId - Sprint ID
   * @param {Array} extraFields - Additional fields to fetch
   * @returns {Promise<Array>} Raw issues data
   */
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
}

export default JiraAPI;