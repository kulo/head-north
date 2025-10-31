// Data extraction utilities for JIRA data
import { Maybe } from "purify-ts";
import type { JiraIssue } from "./types";
import type { Person } from "@omega/types";

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
 */
export function extractCustomField<T>(
  issue: JiraIssue,
  fieldName: string,
): T | undefined {
  return (issue.fields as unknown as Record<string, unknown>)[fieldName] as
    | T
    | undefined;
}

/**
 * Extract custom field value from JIRA issue (functional version with Maybe)
 * Returns Maybe<T> for safer optional value handling
 */
export function extractCustomFieldMaybe<T>(
  issue: JiraIssue,
  fieldName: string,
): Maybe<T> {
  const value = (issue.fields as unknown as Record<string, unknown>)[fieldName];
  return Maybe.fromNullable(value as T | null | undefined);
}

/**
 * Extract parent issue key from JIRA issue
 */
export function extractParent(issue: JiraIssue): string | undefined {
  return issue.fields.parent?.key;
}

/**
 * Extract parent issue key from JIRA issue (functional version with Maybe)
 * Returns Maybe<string> for safer optional value handling
 */
export function extractParentMaybe(issue: JiraIssue): Maybe<string> {
  return Maybe.fromNullable(issue.fields.parent?.key);
}

/**
 * Extract components from JIRA issue
 */
export function extractComponents(_issue: JiraIssue): string[] {
  // This would need to be implemented based on how components are stored
  // For now, return empty array as components aren't used in current setup
  return [];
}

/**
 * Extract assignee information from JIRA issue
 */
export function extractAssignee(issue: JiraIssue): Person | null {
  const assignee = issue.fields.assignee;
  if (!assignee) {
    return null;
  }

  return {
    id: assignee.accountId,
    name: assignee.displayName,
  };
}

/**
 * Extract assignee information from JIRA issue (functional version with Maybe)
 * Returns Maybe<Person> for safer optional value handling
 */
export function extractAssigneeMaybe(issue: JiraIssue): Maybe<Person> {
  return Maybe.fromNullable(issue.fields.assignee).map((assignee) => ({
    id: assignee.accountId,
    name: assignee.displayName,
  }));
}

/**
 * Extract all unique assignees from a list of issues
 */
export function extractAllAssignees(issues: JiraIssue[]): Person[] {
  const assigneeMap = new Map<string, Person>();

  issues.forEach((issue) => {
    const assignee = extractAssignee(issue);
    if (assignee && !assigneeMap.has(assignee.id)) {
      assigneeMap.set(assignee.id, assignee);
    }
  });

  return Array.from(assigneeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * Extract stage from issue name (text in last parentheses)
 */
export function extractStageFromName(name: string): string {
  const startPostfix = name.lastIndexOf("(");
  const endPostfix = name.lastIndexOf(")");

  if (startPostfix === -1 || endPostfix === -1 || startPostfix >= endPostfix) {
    return "";
  }

  return name.substring(startPostfix + 1, endPostfix).toLowerCase();
}

/**
 * Extract stage from issue name (functional version with Maybe)
 * Returns Maybe<string> - empty string becomes Nothing
 */
export function extractStageFromNameMaybe(name: string): Maybe<string> {
  const stage = extractStageFromName(name);
  return stage.length > 0 ? Maybe.of(stage) : Maybe.empty();
}

/**
 * Extract project name from summary (remove brackets)
 */
export function extractProjectName(summary: string): string {
  const endOfPrefix = !summary.startsWith("[") ? 0 : summary.indexOf("]") + 1;
  const beginningOfSuffix = summary.lastIndexOf("[");
  const endOfProjectName =
    beginningOfSuffix > 0 ? beginningOfSuffix : undefined;

  return summary.substring(endOfPrefix, endOfProjectName).trim();
}
