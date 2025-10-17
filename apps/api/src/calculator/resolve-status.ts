/**
 * Resolve JIRA issue status to Omega status value
 *
 * Converts a JIRA issue's status ID to the corresponding Omega status value
 * using the JIRA status mappings from OmegaConfig. Handles special cases like
 * postponed status when sprint timing doesn't match.
 *
 * @param issueFields - JIRA issue fields object
 * @param sprint - Sprint object with start/end dates
 * @param omegaConfig - OmegaConfig instance for status mappings
 * @returns Omega status value ('todo', 'inprogress', 'done', 'cancelled', 'postponed')
 *
 * @example
 * const status = resolveStatus(issue.fields, sprint, omegaConfig)
 * // Returns: 'inprogress', 'done', 'todo', etc.
 */
import type { OmegaConfig } from "@omega/config";
import type { JiraIssueFields, JiraSprint } from "../types";

export function resolveStatus(
  issueFields: JiraIssueFields,
  sprint: JiraSprint,
  omegaConfig: OmegaConfig,
): string {
  const statusId = issueFields.status.id;
  const jiraConfig = omegaConfig.getJiraConfig();

  if (
    issueFields.sprint &&
    sprint &&
    sprint.startDate &&
    new Date(sprint.startDate) < new Date(issueFields.sprint.startDate)
  ) {
    return (
      jiraConfig?.statusMappings?.[
        omegaConfig.getItemStatusValues().POSTPONED
      ] || "postponed"
    ); // POSTPONED_STATUS_ID
  }
  return (
    jiraConfig?.statusMappings?.[statusId] ||
    omegaConfig.getItemStatusValues().TODO
  );
}
