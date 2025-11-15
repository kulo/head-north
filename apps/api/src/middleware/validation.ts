/**
 * Validation Middleware
 *
 * Provides Zod-based validation with purify-ts Either for type-safe validation
 * at API boundaries. Ensures data integrity before processing.
 */

import { z } from "zod";
import type { Either } from "@headnorth/utils";
import { Left, Right } from "@headnorth/utils";
import type { Context } from "koa";
import type { RawCycleData } from "@headnorth/types";

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * ISODateString schema - validates YYYY-MM-DD format
 */
const isoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date must be in YYYY-MM-DD format",
});

/**
 * Cycle state schema
 */
const cycleStateSchema = z.enum(["active", "closed", "future", "completed"]);

/**
 * Cycle schema
 */
const cycleSchema = z.object({
  id: z.string().min(1, "Cycle ID is required"),
  name: z.string().min(1, "Cycle name is required"),
  start: isoDateStringSchema,
  end: isoDateStringSchema,
  delivery: isoDateStringSchema,
  state: cycleStateSchema,
});

/**
 * Person schema
 */
const personSchema = z.object({
  id: z.string().min(1, "Person ID is required"),
  name: z.string().min(1, "Person name is required"),
});

/**
 * Area schema
 */
const areaSchema = z.object({
  id: z.string().min(1, "Area ID is required"),
  name: z.string().min(1, "Area name is required"),
  teams: z.array(z.unknown()).optional(),
});

/**
 * Stage schema
 */
const stageSchema = z.object({
  id: z.string().min(1, "Stage ID is required"),
  name: z.string().min(1, "Stage name is required"),
});

/**
 * CycleItem schema
 */
const cycleItemSchema = z.object({
  id: z.string().min(1, "CycleItem ID is required"),
  ticketId: z.string().min(1, "Ticket ID is required"),
  effort: z.number().nonnegative().optional().default(0),
  name: z.string().min(1, "CycleItem name is required"),
  areaIds: z.array(z.string()).optional().default([]),
  teams: z.array(z.string()).optional().default([]),
  status: z.string(),
  url: z.string().optional(),
  isExternal: z.boolean().optional().default(false),
  stage: z.string(),
  assignee: z.union([personSchema, z.record(z.string(), z.unknown())]),
  validations: z.array(z.unknown()).optional().default([]),
  roadmapItemId: z.string().optional(),
  cycleId: z.string().nullable().optional(),
  cycle: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  created: z.string().optional(),
});

/**
 * RoadmapItem schema
 */
const roadmapItemSchema = z.object({
  id: z.string().min(1, "RoadmapItem ID is required"),
  name: z.string().min(1, "RoadmapItem name is required"),
  summary: z.string().optional(),
  area: z.union([z.string(), areaSchema]).optional(),
  theme: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  objective: z.record(z.string(), z.unknown()).optional(),
  objectiveId: z.string().nullable().optional(),
  isExternal: z.boolean().optional().default(false),
  owningTeam: z.unknown().optional(),
  url: z.string().optional(),
  validations: z.array(z.unknown()).optional().default([]),
  cycleItems: z.array(cycleItemSchema).optional().default([]),
  labels: z.array(z.string()).optional().default([]),
  startDate: isoDateStringSchema.optional(),
  endDate: isoDateStringSchema.optional(),
});

/**
 * Objective schema
 */
const objectiveSchema = z.object({
  id: z.string().min(1, "Objective ID is required"),
  name: z.string().min(1, "Objective name is required"),
  roadmapItems: z.array(roadmapItemSchema).optional(),
});

/**
 * RawCycleData schema - main schema for API response validation
 */
export const rawCycleDataSchema = z.object({
  cycles: z.array(cycleSchema),
  roadmapItems: z.array(roadmapItemSchema),
  cycleItems: z.array(cycleItemSchema),
  assignees: z.array(personSchema),
  areas: z.union([z.record(z.string(), areaSchema), z.array(areaSchema)]),
  stages: z.array(stageSchema),
  objectives: z.union([
    z.record(z.string(), objectiveSchema),
    z.array(objectiveSchema),
  ]),
  teams: z.array(z.unknown()).optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate RawCycleData using Zod schema
 * Returns Either<z.ZodError, RawCycleData> for functional error handling
 */
export const validateRawCycleData = (
  data: unknown,
): Either<z.ZodError, RawCycleData> => {
  const result = rawCycleDataSchema.safeParse(data);
  return result.success
    ? Right(result.data as RawCycleData)
    : Left(result.error);
};

/**
 * Koa middleware for validating request body
 */
export const validateRequestBody = <T extends z.ZodType>(schema: T) => {
  return async (ctx: Context, next: () => Promise<void>): Promise<void> => {
    // Koa request body is available via bodyParser middleware
    const body = (ctx.request as { body?: unknown }).body;
    const result = schema.safeParse(body);

    if (!result.success) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "Validation failed",
        errors: result.error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      };
      return;
    }

    // Attach validated data to context
    (ctx.request as unknown as { body: unknown }).body = result.data;
    await next();
  };
};

/**
 * Koa middleware for validating response data
 * Useful for ensuring API responses match expected schema
 */
export const validateResponse = <T extends z.ZodType>(schema: T) => {
  return async (ctx: Context, next: () => Promise<void>): Promise<void> => {
    await next();

    // Only validate if body exists and status is success
    if (ctx.body && ctx.status >= 200 && ctx.status < 300) {
      const result = schema.safeParse(ctx.body);

      if (!result.success) {
        // Log validation error but don't fail request (response already sent)
        console.error("Response validation failed:", result.error.issues);
      }
    }
  };
};

/**
 * Helper to format Zod errors for API responses
 */
export const formatValidationErrors = (
  error: z.ZodError,
): Array<{ field: string; message: string; code: string }> => {
  return error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));
};
