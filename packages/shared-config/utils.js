/**
 * Shared utility functions for configuration classes
 */

/**
 * Get required environment variable
 * @param {object} processEnv - Process environment object
 * @param {string} key - Environment variable key
 * @param {string} errorMessage - Error message if variable is missing
 * @returns {string} Environment variable value
 * @throws {Error} If environment variable is missing
 */
export function getRequiredEnvVar(processEnv, key, errorMessage) {
  const value = processEnv[key]
  if (!value) {
    throw new Error(`${errorMessage}. Missing environment variable: ${key}`)
  }
  return value
}

/**
 * Get environment variable with fallback
 * @param {object} processEnv - Process environment object
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value if variable is missing
 * @param {string} description - Description for logging
 * @returns {string} Environment variable value or fallback
 */
export function getEnvVarWithFallback(processEnv, key, fallback, description) {
  const value = processEnv[key]
  if (!value) {
    console.warn(`⚠️  Using fallback for ${description}: ${key}=${fallback} (set ${key} environment variable for production)`)
    return fallback
  }
  return value
}
