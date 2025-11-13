// Validation utilities for JIRA data transformation
import type { ValidationItem } from "@headnorth/types";

/**
 * Create a validation item with a specific code
 */
export function createValidation(
  itemId: string,
  code: string,
  status: "error" | "warning" = "error",
): ValidationItem {
  return {
    id: `${itemId}-${code}`,
    code,
    name: code, // Temporary, UI will replace from dictionary
    status,
    description: "",
  };
}

/**
 * Create a validation item with a dynamic parameter
 */
export function createParameterizedValidation(
  itemId: string,
  code: string,
  parameter: string,
  status: "error" | "warning" = "error",
): ValidationItem {
  return {
    id: `${itemId}-${code}-${parameter}`,
    code,
    name: `${code}:${parameter}`, // Will be replaced by UI with proper message
    status,
    description: parameter,
  };
}

/**
 * Validate that a required value is present
 */
export function validateRequired(
  value: unknown,
  itemId: string,
  field: string,
): ValidationItem[] {
  if (value === undefined || value === null || value === "") {
    return [
      createValidation(
        itemId,
        `missing${field.charAt(0).toUpperCase() + field.slice(1)}`,
      ),
    ];
  }
  return [];
}

/**
 * Validate that a value is one of the allowed values
 */
export function validateOneOf(
  value: string,
  allowed: string[],
  itemId: string,
  field: string,
): ValidationItem[] {
  if (!allowed.includes(value)) {
    return [
      createParameterizedValidation(
        itemId,
        `invalid${field.charAt(0).toUpperCase() + field.slice(1)}`,
        value,
      ),
    ];
  }
  return [];
}

/**
 * Validate that a number is within a range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  itemId: string,
  field: string,
): ValidationItem[] {
  if (value < min || value > max) {
    return [createValidation(itemId, `${field}OutOfRange`)];
  }
  return [];
}
