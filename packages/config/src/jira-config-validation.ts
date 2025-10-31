/**
 * JIRA Configuration Validation
 *
 * Validates JIRA configuration data using Zod schemas with purify-ts Either
 * for functional error handling. Ensures all required connection fields are present and valid.
 */

import { z } from "zod";
import type { Either } from "purify-ts";
import { Left, Right } from "purify-ts";
import type { JiraConfigData } from "./jira-config";

/**
 * Zod schema for JIRA connection validation
 * Ensures all required fields are present and valid
 * Note: JiraConnection interface allows null, but for validation we require non-null strings
 */
const jiraConnectionSchema = z
  .object({
    user: z
      .string({ message: "JIRA user is required" })
      .min(1, "JIRA user cannot be empty")
      .transform((val) => val.trim()),
    token: z
      .string({ message: "JIRA token is required" })
      .min(1, "JIRA token cannot be empty")
      .transform((val) => val.trim()),
    host: z
      .string({ message: "JIRA host is required" })
      .min(1, "JIRA host cannot be empty")
      .url("JIRA host must be a valid URL")
      .transform((val) => val.trim()),
    boardId: z
      .number({ message: "JIRA boardId is required" })
      .int("JIRA boardId must be an integer")
      .positive("JIRA boardId must be greater than 0"),
  })
  .refine((data) => data.user && data.user.trim().length > 0, {
    message: "JIRA user cannot be empty",
    path: ["user"],
  })
  .refine((data) => data.token && data.token.trim().length > 0, {
    message: "JIRA token cannot be empty",
    path: ["token"],
  })
  .refine((data) => data.host && data.host.trim().length > 0, {
    message: "JIRA host cannot be empty",
    path: ["host"],
  });

/**
 * Zod schema for complete JIRA configuration validation
 */
const jiraConfigSchema = z.object({
  statusMappings: z.record(z.string(), z.string()).default({}),
  statusCategories: z.object({
    finished: z.array(z.string()).default([]),
    active: z.array(z.string()).default([]),
    future: z.array(z.string()).default([]),
  }),
  limits: z.object({
    maxResults: z.number().int().positive().default(1000),
    maxIssuesPerRequest: z.number().int().positive().default(100),
  }),
  fields: z.object({
    epic: z.string().default("customfield_10014"),
    sprint: z.string().default("customfield_10020"),
    storyPoints: z.string().default("customfield_10016"),
  }),
  connection: jiraConnectionSchema,
});

/**
 * Format Zod validation errors into Error with informative message
 */
function formatZodErrors(error: z.ZodError): Error {
  const missingFields = error.issues.map((err) => {
    // Format field path (e.g., "connection.user" -> "user")
    const path = err.path.join(".");
    return path.startsWith("connection.")
      ? path.replace("connection.", "")
      : path || "unknown";
  });

  const uniqueMissingFields = [...new Set(missingFields)]; // Remove duplicates

  const errorMessages = error.issues
    .map((err) => {
      const path = err.path.join(".");
      const fieldPath = path.startsWith("connection.")
        ? path.replace("connection.", "")
        : path || "unknown";
      return `${fieldPath}: ${err.message}`;
    })
    .join("; ");

  const errorMessage = `JIRA configuration validation failed: ${errorMessages}. Missing or invalid fields: ${uniqueMissingFields.join(", ")}`;

  return new Error(errorMessage);
}

/**
 * Validate JIRA configuration data using Zod
 * Ensures all required connection fields are present and valid
 *
 * @param config - JIRA configuration data to validate
 * @returns Either<Error, JiraConfigData>
 */
export function validateJiraConfig(
  config: JiraConfigData | null | undefined,
): Either<Error, JiraConfigData> {
  if (!config) {
    return Left(new Error("JIRA configuration is missing"));
  }

  // Handle nullable connection fields - transform null to empty string for validation
  // This allows us to validate even when fields are null (from JiraConnection interface)
  const configToValidate = {
    ...config,
    connection: {
      user: config.connection.user ?? "",
      token: config.connection.token ?? "",
      host: config.connection.host ?? "",
      boardId: config.connection.boardId,
    },
  };

  // Validate using Zod schema
  const result = jiraConfigSchema.safeParse(configToValidate);

  if (!result.success) {
    return Left(formatZodErrors(result.error));
  }

  return Right(result.data as JiraConfigData);
}
