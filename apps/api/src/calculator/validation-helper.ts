import type { ValidationItem } from "@omega/types";

/**
 * Create a validation item with a specific code
 * The code links to the validation dictionary for user-facing messages
 */
export function createValidationItem(
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
 * Create a validation item with a dynamic parameter (e.g., team name)
 */
export function createParameterizedValidationItem(
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
