/**
 * Zod Schemas for JIRA API Response Validation
 *
 * These schemas validate the structure of responses from the Atlassian JIRA API.
 * They ensure that external API responses match our expected types before processing.
 *
 * Key considerations:
 * - JIRA API returns many optional fields - schemas reflect this
 * - Custom fields vary by JIRA instance - use passthrough() for flexibility
 * - Some fields can be null (e.g., assignee: JiraUser | null)
 * - Dates are ISO date strings - validate format
 * - Sprint IDs can be string | number - handle both
 */

import { z } from "zod";

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Schema for JIRA user objects
 */
export const jiraUserSchema = z.object({
  accountId: z.string(),
  displayName: z.string(),
  emailAddress: z.string().optional(),
  avatarUrls: z.record(z.string(), z.string()).optional(),
  active: z.boolean(),
  timeZone: z.string().optional(),
});

/**
 * Schema for JIRA status category
 */
const jiraStatusCategorySchema = z.object({
  id: z.number(),
  key: z.string(),
  colorName: z.string(),
  name: z.string(),
});

/**
 * Schema for JIRA status objects
 */
export const jiraStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  statusCategory: jiraStatusCategorySchema.optional(),
});

/**
 * Schema for JIRA sprint objects
 * Sprint IDs can be string or number
 * Dates are ISO date strings (YYYY-MM-DD format)
 */
export const jiraSprintSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  state: z.enum(["active", "closed", "future"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, {
    message: "startDate must be in ISO date format (YYYY-MM-DD)",
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, {
    message: "endDate must be in ISO date format (YYYY-MM-DD)",
  }),
  originBoardId: z.number().optional(),
  goal: z.string().optional(),
});

/**
 * Schema for parent issue fields (nested in JiraIssueFields)
 */
const jiraParentFieldsSchema = z.object({
  summary: z.string(),
  status: jiraStatusSchema,
});

/**
 * Schema for parent issue (nested in JiraIssueFields)
 */
const jiraParentSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: jiraParentFieldsSchema,
});

/**
 * Schema for issue type objects
 */
const jiraIssueTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  subtask: z.boolean(),
});

// ============================================================================
// Complex Schemas
// ============================================================================

/**
 * Schema for JIRA issue fields
 * This is complex with many optional fields and custom fields
 * Uses passthrough() to allow additional custom fields
 */
export const jiraIssueFieldsSchema = z
  .object({
    summary: z.string(),
    status: jiraStatusSchema,
    assignee: jiraUserSchema.nullable(),
    reporter: jiraUserSchema.optional(),
    effort: z.number().optional(),
    labels: z.array(z.string()).default([]),
    parent: jiraParentSchema.optional(),
    // issuetype is optional because when specific fields are requested from JIRA API,
    // it may not be included in the response
    issuetype: jiraIssueTypeSchema.optional(),
    area: z.string().optional(),
    sprint: jiraSprintSchema.nullable().optional(),
    teams: z.array(z.string()).optional(),
    areaIds: z.array(z.string()).optional(),
    created: z.string().optional(),
    updated: z.string().optional(),
    // Common custom fields - explicitly defined
    customfield_10002: z.number().optional(), // Effort field
    // Note: Other custom fields are allowed via passthrough()
  })
  .passthrough(); // Allow additional custom fields

/**
 * Schema for JIRA issue objects
 */
export const jiraIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: jiraIssueFieldsSchema,
  expand: z.string().optional(),
});

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Schema for JIRA search API response
 * Used for searchIssues() and getIssuesForSprint()
 */
export const jiraSearchResponseSchema = z
  .object({
    issues: z.array(jiraIssueSchema),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    total: z.number().optional(),
  })
  .passthrough(); // Allow additional response fields

/**
 * Schema for JIRA sprints API response
 * Used for getSprints()
 */
export const jiraSprintsResponseSchema = z
  .object({
    values: z.array(jiraSprintSchema),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    isLast: z.boolean().optional(),
  })
  .passthrough(); // Allow additional response fields
