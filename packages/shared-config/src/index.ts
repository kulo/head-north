/**
 * Shared Configuration Package
 *
 * This package provides a unified configuration system for the Omega application.
 * It exports only the OmegaConfig class, which encapsulates all configuration
 * logic, environment detection, and utility functions.
 *
 * Usage:
 *   import { OmegaConfig } from '@omega/shared-config'
 *
 *   // Create configuration instance
 *   const config = new OmegaConfig('development')
 *
 *   // Access configuration
 *   const apiHost = config.getHost()
 *   const endpoints = config.getEndpoints()
 *   const cacheTTL = config.getCacheTTL()
 */

// Export OmegaConfig as the main and only export
export { default as OmegaConfig } from "./omega-config.js";

// For backward compatibility, also export as default
export { default } from "./omega-config.js";

// Export types for external use
export type * from "./types.js";
