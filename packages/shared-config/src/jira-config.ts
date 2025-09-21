/**
 * Jira Configuration Class
 * Handles JIRA-specific configuration including status mappings and field definitions
 */

import { getRequiredEnvVar, getEnvVarWithFallback } from './utils.js';
import type { ProcessEnv, JiraConfig as JiraConfigType } from './types.js';

export default class JiraConfig {
  private processEnv: ProcessEnv;
  private useFakeData: boolean;
  private config: JiraConfigType;

  constructor(processEnv: ProcessEnv = {}, useFakeData: boolean = false) {
    this.processEnv = processEnv;
    this.useFakeData = useFakeData;
    this.config = this._initializeConfig();
  }

  /**
   * Initialize JIRA configuration
   * @private
   */
  private _initializeConfig(): JiraConfigType {
    const config: JiraConfigType = {
      // JIRA Status Mappings
      statusMappings: {
        // JIRA Status IDs to Omega Status Values
        '18234': 'todo',      // PLANNED_STATUS_ID
        '18264': 'inprogress', // IN_PROGRESS_STATUS_ID
        '18235': 'done',      // DONE_STATUS_ID
        '18295': 'cancelled', // CANCELLED_STATUS_ID
        '18306': 'postponed'  // POSTPONED_STATUS_ID
      },

      // JIRA Status Categories
      statusCategories: {
        finished: ['18235', '18295'], // DONE_STATUS_ID, CANCELLED_STATUS_ID
        active: ['18234', '18264'],   // PLANNED_STATUS_ID, IN_PROGRESS_STATUS_ID
        future: ['18234', '18264', '18306'] // PLANNED_STATUS_ID, IN_PROGRESS_STATUS_ID, POSTPONED_STATUS_ID
      },

      // JIRA API Limits
      limits: {
        maxResults: 1000,               // Maximum results per API call
        maxIssuesPerRequest: 100        // Maximum issues per request
      },

      // Placeholder fields - will be set below
      fields: {
        epic: '',
        sprint: '',
        storyPoints: ''
      },

      // Placeholder connection - will be set below
      connection: {
        user: null,
        token: null,
        host: null,
        boardId: -1
      }
    };

    // Configure JIRA fields and connection based on useFakeData setting
    if (this.useFakeData) {
      // When using fake data, provide default values for JIRA configuration
      // TODO: do we need this fake data at all? will this ever be called in a case without real jira data?
      config.fields = {
        epic: getEnvVarWithFallback(this.processEnv, 'JIRA_EPIC_FIELD', 'customfield_10014', 'Jira epic field'),
        sprint: getEnvVarWithFallback(this.processEnv, 'JIRA_SPRINT_FIELD', 'customfield_10020', 'Jira sprint field'),
        storyPoints: getEnvVarWithFallback(this.processEnv, 'JIRA_STORY_POINTS_FIELD', 'customfield_10016', 'Jira story points field')
      };

      config.connection = {
        user: null,
        token: null,
        host: null,
        boardId: -1
      };
    } else {
      // When not using fake data, require all JIRA configuration
      config.fields = {
        epic: getRequiredEnvVar(this.processEnv, 'JIRA_EPIC_FIELD', 'Jira epic field is required'),
        sprint: getRequiredEnvVar(this.processEnv, 'JIRA_SPRINT_FIELD', 'Jira sprint field is required'),
        storyPoints: getRequiredEnvVar(this.processEnv, 'JIRA_STORY_POINTS_FIELD', 'Jira story points field is required')
      };

      config.connection = {
        user: getRequiredEnvVar(this.processEnv, 'JIRA_USER', 'Jira user is required'),
        token: getRequiredEnvVar(this.processEnv, 'JIRA_TOKEN', 'Jira token is required'),
        host: getRequiredEnvVar(this.processEnv, 'JIRA_HOST', 'Jira host is required'),
        boardId: parseInt(getRequiredEnvVar(this.processEnv, 'JIRA_BOARD_ID', 'Jira board ID is required'))
      };
    }

    return config;
  }

  /**
   * Get complete JIRA configuration
   * @returns Complete JIRA configuration
   */
  getConfig(): JiraConfigType {
    return this.config;
  }
}
