// Data extraction utilities for JIRA data
import { Maybe } from "purify-ts";
import type { JiraIssue } from "./types";
import type { Person } from "@headnorth/types";

/**
 * Extract labels with a specific prefix
 */
export function extractLabelsWithPrefix(
  labels: string[],
  prefix: string,
): string[] {
  const prefixWithColon = `${prefix}:`;
  return labels
    .filter((label) => label.trim().startsWith(prefixWithColon))
    .map((label) => label.trim().replace(prefixWithColon, ""));
}

/**
 * Extract custom field value from JIRA issue
 * Returns Maybe<T> for safe optional value handling
 */
export function extractCustomField<T>(
  issue: JiraIssue,
  fieldName: string,
): Maybe<T> {
  if (!issue.fields) {
    return Maybe.empty();
  }
  const value = (issue.fields as unknown as Record<string, unknown>)[fieldName];
  return Maybe.fromNullable(value as T | null | undefined);
}

/**
 * Extract parent issue key from JIRA issue
 * Returns Maybe<string> for safe optional value handling
 */
export function extractParent(issue: JiraIssue): Maybe<string> {
  return Maybe.fromNullable(issue.fields.parent?.key);
}

/**
 * Extract assignee information from JIRA issue
 * Returns Maybe<Person> for safe optional value handling
 */
export function extractAssignee(issue: JiraIssue): Maybe<Person> {
  return Maybe.fromNullable(issue.fields.assignee).map((assignee) => ({
    id: assignee.accountId,
    name: assignee.displayName,
  }));
}

/**
 * Extract all unique assignees from a list of issues
 * Uses functional approach with Maybe for safe extraction
 */
export function extractAllAssignees(issues: JiraIssue[]): Person[] {
  // Use reduce to build map immutably with Maybe for safe extraction
  const assigneeMap = issues.reduce((acc, issue) => {
    return extractAssignee(issue)
      .map((assignee) => {
        if (!acc.has(assignee.id)) {
          return new Map(acc).set(assignee.id, assignee);
        }
        return acc;
      })
      .orDefault(acc);
  }, new Map<string, Person>());

  return Array.from(assigneeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * Extract sprint ID from JIRA issue
 * Handles both standard sprint field and custom field sprint data
 *
 * Tries standard `sprint` field first (for Cycle Items), then falls back to
 * custom field (for Epics that store sprint in custom fields like customfield_10021).
 *
 * Custom field can be an array of sprint objects or a single sprint object.
 *
 * @param issue - JIRA issue
 * @param customFieldName - Optional custom field name (e.g., "customfield_10021")
 * @returns Maybe<string | number> - Sprint ID if found
 */
export function extractSprintId(
  issue: JiraIssue,
  customFieldName?: string,
): Maybe<string | number> {
  // First try standard sprint field (for Cycle Items)
  const standardSprintId = Maybe.fromNullable(issue.fields.sprint?.id);
  if (standardSprintId.isJust()) {
    return standardSprintId;
  }

  // Fall back to custom field if provided (for Epics)
  if (!customFieldName) {
    return Maybe.empty();
  }

  const customField = extractCustomField<unknown>(issue, customFieldName);
  return customField.chain((field) => {
    // Handle array of sprint objects (custom fields can be arrays)
    if (Array.isArray(field)) {
      const firstSprint = field[0] as { id?: string | number } | undefined;
      return Maybe.fromNullable(firstSprint?.id);
    }

    // Handle single sprint object
    // Only extract id - other fields (name, state, dates) are not used
    const sprintObj = field as { id?: string | number } | undefined;
    return Maybe.fromNullable(sprintObj?.id);
  });
}
