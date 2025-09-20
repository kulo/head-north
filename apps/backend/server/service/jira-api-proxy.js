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
   * Get sprints data (raw)
   * @returns {Promise<Object>} Raw sprint data
   */
  async getSprintsData() {
    const dataSource = this._getDataSource();
    return await dataSource.getSprintsData();
  }

  /**
   * Get roadmap items data (raw)
   * @returns {Promise<Object>} Raw roadmap items data
   */
  async getRoadmapItemsData() {
    const dataSource = this._getDataSource();
    return await dataSource.getRoadmapItemsData();
  }

  /**
   * Get release items data (raw)
   * @returns {Promise<Array>} Raw release items data
   */
  async getReleaseItemsData() {
    const dataSource = this._getDataSource();
    return await dataSource.getReleaseItemsData();
  }

  /**
   * Get issues for a specific sprint (raw)
   * @param {string|number} sprintId - Sprint ID
   * @param {Array} extraFields - Additional fields to retrieve
   * @returns {Promise<Array>} Raw issues data
   */
  async getIssuesForSprint(sprintId, extraFields = []) {
    const dataSource = this._getDataSource();
    return await dataSource.getIssuesForSprint(sprintId, extraFields);
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
