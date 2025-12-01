/**
 * Shared utility functions for configuration classes
 */

import type { ProcessEnv, URL } from "./types";

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
    // Suppress warnings in test environments
    // Check multiple ways to detect test environment:
    // 1. Check processEnv parameter (may not have NODE_ENV)
    // 2. Check actual process.env (more reliable for test detection)
    // 3. Check for vitest-specific indicators
    const isTestEnv =
      processEnv.NODE_ENV === "test" ||
      processEnv.VITEST === "true" ||
      (typeof process !== "undefined" &&
        process.env &&
        (process.env.NODE_ENV === "test" ||
          process.env.VITEST === "true" ||
          // Vitest sets this when running
          process.env.VITEST_WORKER_ID !== undefined)) ||
      // Check if vitest is running via global
      (typeof globalThis !== "undefined" &&
        (globalThis as { __vitest__?: unknown }).__vitest__ !== undefined);

    if (!isTestEnv) {
      console.warn(
        `⚠️  Using fallback for ${description}: ${key}=${fallback} (set ${key} environment variable for production)`,
      );
    }
    return fallback;
  }
  return value;
}

/**
 * Create a URL with validation
 * @param url - URL string to validate and convert
 * @returns Validated URL type
 * @throws Error if URL is invalid
 */
export function createURL(url: string): URL {
  try {
    const validatedUrl = new URL(url);
    // Ensure it's http or https
    if (!validatedUrl.protocol.startsWith("http")) {
      throw new Error(`URL must use http or https protocol: ${url}`);
    }
    return url as URL;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}
