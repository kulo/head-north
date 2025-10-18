// JIRA Adapter Interface
// Defines the contract for organization-specific JIRA data adapters

import type { RawCycleData } from "@omega/types";

/**
 * Interface for JIRA data adapters
 *
 * Each organization can implement their own adapter to handle their specific
 * JIRA setup (issue types, field mappings, label conventions, etc.)
 *
 * The adapter is responsible for:
 * - Fetching raw data from JIRA
 * - Transforming JIRA domain objects to Omega domain objects
 * - Applying organization-specific business rules
 * - Returning complete RawCycleData structure
 */
export interface JiraAdapter {
  /**
   * Fetch and transform cycle data from JIRA
   *
   * @returns Complete cycle data structure with all entities
   */
  fetchCycleData(): Promise<RawCycleData>;
}

/**
 * Factory function type for creating adapters
 */
export type AdapterFactory = (config: unknown) => JiraAdapter;
