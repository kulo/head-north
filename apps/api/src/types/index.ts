// API-specific types that are not shared across the monorepo

// ============================================================================
// Jira-specific Types
// ============================================================================

/**
 * Sprint interface for Jira domain (different from Cycle)
 * This represents a Jira sprint with its metadata
 */
export interface Sprint {
  id: string | number;
  name: string;
  state: string;
  startDate: string;
  endDate: string;
}

// ============================================================================
// API Route Types
// ============================================================================

export interface RouteDefinition {
  method: string;
  path: string;
  handler: string | ((context: any) => Promise<void> | void);
  description: string;
}

export interface RouteHandlers {
  [key: string]: (context: any) => Promise<void> | void;
}

export interface RouteOptions {
  logRoutes?: boolean;
  prefix?: string;
}
