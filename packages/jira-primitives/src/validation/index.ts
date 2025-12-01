/**
 * JIRA API Response Validation Functions
 *
 * Provides validation functions that use Zod schemas and return Either
 * for functional error handling. Validates external JIRA API responses
 * to ensure they match expected structures before processing.
 */

import { z } from "zod";
import type { Either } from "@headnorth/utils";
import { Left, Right } from "@headnorth/utils";
import type { JiraIssue, JiraSprint } from "../types";
import {
  jiraIssueSchema,
  jiraSprintSchema,
  jiraSearchResponseSchema,
  jiraSprintsResponseSchema,
} from "./jira-schemas";

/**
 * Validate a single JIRA issue
 * @param data - Unknown data to validate
 * @returns Either<z.ZodError, JiraIssue>
 */
export function validateJiraIssue(
  data: unknown,
): Either<z.ZodError, JiraIssue> {
  const result = jiraIssueSchema.safeParse(data);
  return result.success ? Right(result.data as JiraIssue) : Left(result.error);
}

/**
 * Validate an array of JIRA issues
 * Validates each issue and collects all errors
 * @param data - Unknown data to validate
 * @returns Either<z.ZodError, JiraIssue[]>
 */
export function validateJiraIssues(
  data: unknown,
): Either<z.ZodError, JiraIssue[]> {
  if (!Array.isArray(data)) {
    return Left(
      new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: [],
          message: "Expected array of JIRA issues",
        },
      ]),
    );
  }

  // Use functional approach: map to validation results
  const validationResults = data.map((item, index) => {
    const result = jiraIssueSchema.safeParse(item);
    return {
      index,
      result,
    };
  });

  // Collect all errors (functional - no mutations)
  // Use flatMap to collect errors from failed validations
  const errors = validationResults.flatMap((vr) =>
    vr.result.success
      ? []
      : vr.result.error.issues.map((issue) => ({
          ...issue,
          path: [vr.index, ...issue.path],
        })),
  );

  if (errors.length > 0) {
    return Left(new z.ZodError(errors));
  }

  // Extract validated items (functional - no mutations)
  const validated = validationResults
    .filter((vr) => vr.result.success)
    .map((vr) => vr.result.data as JiraIssue);

  return Right(validated);
}

/**
 * Validate a single JIRA sprint
 * @param data - Unknown data to validate
 * @returns Either<z.ZodError, JiraSprint>
 */
export function validateJiraSprint(
  data: unknown,
): Either<z.ZodError, JiraSprint> {
  const result = jiraSprintSchema.safeParse(data);
  return result.success ? Right(result.data as JiraSprint) : Left(result.error);
}

/**
 * Validate an array of JIRA sprints
 * Validates each sprint and collects all errors
 * @param data - Unknown data to validate
 * @returns Either<z.ZodError, JiraSprint[]>
 */
export function validateJiraSprints(
  data: unknown,
): Either<z.ZodError, JiraSprint[]> {
  if (!Array.isArray(data)) {
    return Left(
      new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: [],
          message: "Expected array of JIRA sprints",
        },
      ]),
    );
  }

  // Use functional approach: map to validation results
  const validationResults = data.map((item, index) => {
    const result = jiraSprintSchema.safeParse(item);
    return {
      index,
      result,
    };
  });

  // Collect all errors (functional - no mutations)
  // Use flatMap to collect errors from failed validations
  const errors = validationResults.flatMap((vr) =>
    vr.result.success
      ? []
      : vr.result.error.issues.map((issue) => ({
          ...issue,
          path: [vr.index, ...issue.path],
        })),
  );

  if (errors.length > 0) {
    return Left(new z.ZodError(errors));
  }

  // Extract validated items (functional - no mutations)
  const validated = validationResults
    .filter((vr) => vr.result.success)
    .map((vr) => vr.result.data as JiraSprint);

  return Right(validated);
}

/**
 * Validate JIRA search API response
 * @param data - Unknown data to validate
 * @returns Either<z.ZodError, { issues: JiraIssue[] }>
 */
export function validateJiraSearchResponse(
  data: unknown,
): Either<z.ZodError, { issues: JiraIssue[] }> {
  const result = jiraSearchResponseSchema.safeParse(data);
  if (!result.success) {
    return Left(result.error);
  }

  // Validate issues array
  const issuesValidation = validateJiraIssues(result.data.issues);
  return issuesValidation.map((issues) => ({ issues }));
}

/**
 * Validate JIRA sprints API response
 * @param data - Unknown data to validate
 * @returns Either<z.ZodError, { values: JiraSprint[] }>
 */
export function validateJiraSprintsResponse(
  data: unknown,
): Either<z.ZodError, { values: JiraSprint[] }> {
  const result = jiraSprintsResponseSchema.safeParse(data);
  if (!result.success) {
    return Left(result.error);
  }

  // Validate sprints array
  const sprintsValidation = validateJiraSprints(result.data.values);
  return sprintsValidation.map((values) => ({ values }));
}

/**
 * Format Zod error for error messages
 * Re-exported from @headnorth/utils for convenience
 * @param error - Zod error to format
 * @returns Formatted error message string
 */
export { formatZodError } from "@headnorth/utils";
