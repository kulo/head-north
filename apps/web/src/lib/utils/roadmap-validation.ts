/**
 * Roadmap Item Validation Utilities
 *
 * Pure functions for validating roadmap items and generating validation error messages.
 * Extracted from Vue components to enable testability and reusability.
 */

/**
 * Roadmap item validations object structure
 * Note: This is a flattened structure with boolean properties, not an array of ValidationItem
 */
export interface RoadmapItemValidations {
  readonly hasScheduledRelease?: boolean;
  readonly hasGlobalReleaseInBacklog?: boolean;
}

/**
 * Check if a roadmap item has validation errors
 * @param validations - Roadmap item validations object (may be undefined)
 * @returns true if there are validation errors
 */
export function hasValidationError(
  validations: RoadmapItemValidations | undefined | null,
): boolean {
  if (!validations) {
    return false;
  }

  return (
    !validations.hasScheduledRelease || !validations.hasGlobalReleaseInBacklog
  );
}

/**
 * Generate validation error text from roadmap item validations
 * @param validations - Roadmap item validations object (may be undefined)
 * @returns Error message string or empty string if no errors
 */
export function getValidationErrorText(
  validations: RoadmapItemValidations | undefined | null,
): string {
  if (!hasValidationError(validations)) {
    return "";
  }

  if (!validations) {
    return "";
  }

  const errors: string[] = [];

  if (!validations.hasScheduledRelease) {
    errors.push("No scheduled S1/S3 release.");
  }

  if (!validations.hasGlobalReleaseInBacklog) {
    errors.push("No planned S3 release.");
  }

  return errors.join(" ");
}
