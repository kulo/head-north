import JiraApiProxy from './jira-api-proxy.js';
import parseCycleData from './parse-cycle-data.js';
import { logger } from '@omega-one/shared-utils';

/**
 * Collect cycle data for both roadmap and cycle overview views
 * This replaces the need for separate collect-cycle-overview-data.js and collect-roadmap-data.js
 * Now uses existing parsers for Jira-specific logic while maintaining flat structure
 */
export default async (omegaConfig, extraFields = []) => {
  console.log('🚀 COLLECT CYCLE DATA: Using new parser with existing parsers');
  logger.default.info('🔄 COLLECT CYCLE DATA: Using new parser with existing parsers');
  const jiraApi = new JiraApiProxy(omegaConfig);
  
  // Use the new parser that integrates existing Jira parsers with flat structure
  return await parseCycleData(omegaConfig, jiraApi);
};


