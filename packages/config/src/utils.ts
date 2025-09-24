/**
 * Shared utility functions for configuration classes
 */

import type { ProcessEnv } from "./types";

/**
 * Get required environment variable
 * @param processEnv - Process environment object
 * @param key - Environment variable key
 * @param errorMessage - Error message if variable is missing
 * @returns Environment variable value
 * @throws Error if environment variable is missing
 */
export function getRequiredEnvVar(
  processEnv: ProcessEnv,
  key: string,
  errorMessage: string,
): string {
  const value = processEnv[key];
  if (!value) {
    throw new Error(`${errorMessage}. Missing environment variable: ${key}`);
  }
  return value;
}

/**
 * Get environment variable with fallback
 * @param processEnv - Process environment object
 * @param key - Environment variable key
 * @param fallback - Fallback value if variable is missing
 * @param description - Description for logging
 * @returns Environment variable value or fallback
 */
export function getEnvVarWithFallback(
  processEnv: ProcessEnv,
  key: string,
  fallback: string,
  description: string,
): string {
  const value = processEnv[key];
  if (!value) {
    console.warn(
      `⚠️  Using fallback for ${description}: ${key}=${fallback} (set ${key} environment variable for production)`,
    );
    return fallback;
  }
  return value;
}
