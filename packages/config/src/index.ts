/**
 * Shared Configuration Package
 *
 * This package provides a unified configuration system for the Head North application.
 * It exports only the HeadNorthConfig class, which encapsulates all configuration
 * logic, environment detection, and utility functions.
 *
 * Usage:
 *   import { HeadNorthConfig } from '@headnorth/config'
 *
 *   // Create configuration instance
 *   const config = new HeadNorthConfig('development')
 *
 *   // Access configuration
 *   const apiHost = config.getHost()
 *   const endpoints = config.getEndpoints()
 *   const cacheTTL = config.getCacheTTL()
 */

// Export HeadNorthConfig as the main and only export
export { default as HeadNorthConfig } from "./head-north-config";

// For backward compatibility, also export as default
export { default } from "./head-north-config";

// Export types for external use
export type * from "./types";
export type * from "./jira-config";

// Export utility functions
export { createURL } from "./utils";
