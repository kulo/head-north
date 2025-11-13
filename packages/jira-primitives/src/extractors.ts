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
