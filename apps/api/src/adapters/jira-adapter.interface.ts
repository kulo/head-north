// JIRA Adapter Interface
// Defines the contract for organization-specific JIRA data adapters

import type { Either } from "@headnorth/utils";
import type { CycleData } from "@headnorth/types";

/**
 * Interface for JIRA data adapters
 *
 * Each organization can implement their own adapter to handle their specific
 * JIRA setup (issue types, field mappings, label conventions, etc.)
 *
 * The adapter is responsible for:
 * - Fetching raw data from JIRA
 * - Transforming JIRA domain objects to Head North domain objects
 * - Applying organization-specific business rules
 * - Returning complete CycleData structure with functional error handling
 */
export interface JiraAdapter {
  /**
   * Fetch and transform cycle data from JIRA
   *
   * @returns Either<Error, CycleData> - Uses Either for explicit error handling
   */
  fetchCycleData(): Promise<Either<Error, CycleData>>;
}

/**
 * Factory function type for creating adapters
 */
export type AdapterFactory = (config: unknown) => JiraAdapter;
