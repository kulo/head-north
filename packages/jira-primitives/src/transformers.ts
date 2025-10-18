// JIRA to Omega transformation utilities
import type { JiraSprint, JiraStatus } from "./types";
import type { Cycle } from "@omega/types";

/**
 * Transform JIRA sprint to Omega cycle
 */
export function jiraSprintToCycle(sprint: JiraSprint): Cycle {
  return {
    id: String(sprint.id),
    name: sprint.name,
    start: sprint.startDate,
    end: sprint.endDate,
    delivery: sprint.startDate,
    state: sprint.state,
  };
}

/**
 * Map JIRA status to Omega status using mappings
 */
export function mapJiraStatus(
  jiraStatus: JiraStatus,
  mappings: Record<string, string>,
  defaultStatus: string = "todo",
): string {
  return mappings[jiraStatus.id] || defaultStatus;
}

/**
 * Create JIRA URL for an issue
 */
export function createJiraUrl(key: string, host: string): string {
  if (!host) {
    return `https://example.com/browse/${key}`;
  }
  const baseUrl = host.replace("/rest", "");
  return `${baseUrl}/browse/${key}`;
}

/**
 * Transform date string to ISODateString format (YYYY-MM-DD)
 */
export function transformToISODateString(dateString: string): string {
  if (!dateString) return "1970-01-01";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "1970-01-01";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "1970-01-01";
  }
}
