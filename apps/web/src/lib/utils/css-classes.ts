/**
 * CSS Class Generation Utilities
 *
 * Pure utility functions for generating CSS classes based on data values.
 * These functions are stateless and can be used across components.
 */

/**
 * Generates a CSS class name for a status value
 * @param status - The status value to convert to a CSS class
 * @returns CSS class name or empty string if no status
 */
export function getStatusClass(status: string | null | undefined): string {
  if (!status) return "";
  const normalizedStatus = status.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `status-${normalizedStatus}`;
}

/**
 * Generates a CSS class name for a release stage value
 * @param stage - The release stage value to convert to a CSS class
 * @returns CSS class name or empty string if no release stage
 */
export function getStageClass(stage: string | null | undefined): string {
  if (!stage) return "";
  const normalizedStage = stage.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `stage-${normalizedStage}`;
}
