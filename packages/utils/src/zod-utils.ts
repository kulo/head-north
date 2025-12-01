/**
 * Zod Utility Functions
 *
 * General-purpose utilities for working with Zod schemas and validation errors.
 */

import { z } from "zod";

/**
 * Format Zod error into a readable error message
 * Formats validation errors with field paths for better debugging
 *
 * @param error - Zod validation error
 * @returns Formatted error message string
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   const message = formatZodErrorMessage(result.error);
 *   console.error(message); // "field1: required; field2.nested: must be a string"
 * }
 * ```
 */
export function formatZodErrorMessage(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
  return issues.join("; ");
}

/**
 * Format Zod error into an Error object with informative message
 * Convenience function that wraps formatZodErrorMessage in an Error
 *
 * @param error - Zod validation error
 * @returns Error object with formatted message
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   return Left(formatZodError(result.error));
 * }
 * ```
 */
export function formatZodError(error: z.ZodError): Error {
  return new Error(formatZodErrorMessage(error));
}
