/**
 * Resolve JIRA issue status to Omega status value
 * 
 * Converts a JIRA issue's status ID to the corresponding Omega status value
 * using the JIRA status mappings from OmegaConfig. Handles special cases like
 * postponed status when sprint timing doesn't match.
 * 
 * @param {object} issueFields - JIRA issue fields object
 * @param {object} sprint - Sprint object with start/end dates
 * @param {OmegaConfig} omegaConfig - OmegaConfig instance for status mappings
 * @returns {string} Omega status value ('todo', 'inprogress', 'done', 'cancelled', 'postponed')
 * 
 * @example
 * const status = resolveStatus(issue.fields, sprint, omegaConfig)
 * // Returns: 'inprogress', 'done', 'todo', etc.
 */
export function resolveStatus(issueFields, sprint, omegaConfig) {
  const statusId = issueFields.status.id;
  const jiraConfig = omegaConfig.getJiraConfig();

  if(issueFields.sprint && new Date(sprint.start) < new Date(issueFields.sprint.startDate)) {
    return jiraConfig.statusMappings[omegaConfig.getItemStatusValues().POSTPONED]; // POSTPONED_STATUS_ID
  }
  return jiraConfig.statusMappings[statusId] || omegaConfig.getItemStatusValues().TODO;
}
