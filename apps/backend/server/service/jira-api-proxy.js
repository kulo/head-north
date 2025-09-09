import JiraAPI from './jira-api.js';
import FakeDataGenerator from './fake-data-generator.js';
import { logger } from '@omega-one/shared-utils';

/**
 * JiraApiProxy - Facade that switches between real JiraAPI and FakeDataGenerator
 * based on the OmegaConfig.isUsingFakeCycleData() setting.
 * 
 * This proxy shields client code from knowing whether it's using real Jira data
 * or fake data, providing a consistent interface regardless of the data source.
 */
class JiraApiProxy {
  constructor(omegaConfig) {
    this.omegaConfig = omegaConfig;
    this._realJiraApi = null;
    this._fakeDataGenerator = null;
  }

  /**
   * Get the appropriate data source (real Jira API or fake data generator)
   * @private
   */
  _getDataSource() {
    if (this.omegaConfig.isUsingFakeCycleData()) {
      if (!this._fakeDataGenerator) {
        this._fakeDataGenerator = new FakeDataGenerator(this.omegaConfig);
      }
      return this._fakeDataGenerator;
    } else {
      if (!this._realJiraApi) {
        this._realJiraApi = new JiraAPI(this.omegaConfig);
      }
      return this._realJiraApi;
    }
  }

  /**
   * Get sprint by ID
   * @param {string|number} sprintId - Sprint ID to retrieve
   * @returns {Promise<Object>} Sprint data with sprints array
   */
  async getSprintById(sprintId) {
    const dataSource = this._getDataSource();
    return await dataSource.getSprintById(sprintId);
  }

  /**
   * Get issues for a specific sprint
   * @param {string|number} sprintId - Sprint ID
   * @param {Array} extraFields - Additional fields to retrieve
   * @returns {Promise<Array>} Array of issues
   */
  async getIssuesForSprint(sprintId, extraFields = []) {
    const dataSource = this._getDataSource();
    return await dataSource.getIssuesForSprint(sprintId, extraFields);
  }

  /**
   * Get all roadmap items
   * @returns {Promise<Object>} Object with roadmap item data keyed by roadmap item ID
   */
  async getRoadmapItems() {
    const dataSource = this._getDataSource();
    return await dataSource.getRoadmapItems();
  }

  /**
   * Get release items grouped by roadmap item
   * @returns {Promise<Object>} Object with release items grouped by parent roadmap item
   */
  async getReleaseItemsGroupedByRoadmapItem() {
    const dataSource = this._getDataSource();
    return await dataSource.getReleaseItemsGroupedByRoadmapItem();
  }

  /**
   * Check if currently using fake data
   * @returns {boolean} True if using fake data, false if using real Jira API
   */
  isUsingFakeData() {
    return this.omegaConfig.isUsingFakeCycleData();
  }

  /**
   * Get the underlying data source instance (for debugging purposes)
   * @returns {JiraAPI|FakeDataGenerator} The actual data source instance
   */
  getDataSource() {
    return this._getDataSource();
  }
}

export default JiraApiProxy;
