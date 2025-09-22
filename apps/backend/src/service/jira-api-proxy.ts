import JiraAPI from './jira-api';
import FakeDataGenerator from './fake-data-generator';
import { logger } from '@omega-one/shared-utils';
import type { OmegaConfig } from '@omega/shared-config';

/**
 * JiraApiProxy - Facade that switches between real JiraAPI and FakeDataGenerator
 * based on the OmegaConfig.isUsingFakeCycleData() setting.
 * 
 * This proxy shields client code from knowing whether it's using real Jira data
 * or fake data, providing a consistent interface regardless of the data source.
 */
export default class JiraApiProxy {
  private omegaConfig: OmegaConfig;
  private _realJiraApi: JiraAPI | null;
  private _fakeDataGenerator: FakeDataGenerator | null;

  constructor(omegaConfig: OmegaConfig) {
    this.omegaConfig = omegaConfig;
    this._realJiraApi = null;
    this._fakeDataGenerator = null;
  }

  /**
   * Get the appropriate data source (real Jira API or fake data generator)
   * @private
   */
  private _getDataSource(): JiraAPI | FakeDataGenerator {
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
   * @returns Raw sprint data
   */
  async getSprintsData(): Promise<any> {
    const dataSource = this._getDataSource();
    return await dataSource.getSprintsData();
  }

  /**
   * Get roadmap items data (raw)
   * @returns Raw roadmap items data
   */
  async getRoadmapItemsData(): Promise<any> {
    const dataSource = this._getDataSource();
    return await dataSource.getRoadmapItemsData();
  }

  /**
   * Get release items data (raw)
   * @returns Raw release items data
   */
  async getReleaseItemsData(): Promise<any> {
    const dataSource = this._getDataSource();
    return await dataSource.getReleaseItemsData();
  }

  /**
   * Get issues for a specific sprint (raw)
   * @param sprintId - Sprint ID
   * @param extraFields - Additional fields to retrieve
   * @returns Raw issues data
   */
  async getIssuesForSprint(sprintId: string | number, extraFields: string[] = []): Promise<any> {
    const dataSource = this._getDataSource();
    return await dataSource.getIssuesForSprint(sprintId, extraFields);
  }

  /**
   * Check if currently using fake data
   * @returns True if using fake data, false if using real Jira API
   */
  isUsingFakeData(): boolean {
    return this.omegaConfig.isUsingFakeCycleData();
  }

  /**
   * Get the underlying data source instance (for debugging purposes)
   * @returns The actual data source instance
   */
  getDataSource(): JiraAPI | FakeDataGenerator {
    return this._getDataSource();
  }
}
