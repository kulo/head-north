// API-specific types that are not shared across the monorepo

// Re-export Jira types
export * from "./jira-types";

// Re-export parsed DTO types
export * from "./parsed-types";

// ============================================================================
// API Route Types
// ============================================================================

export interface RouteDefinition {
  method: string;
  path: string;
  handler: string | ((context: unknown) => Promise<void> | void);
  description: string;
}

export interface RouteHandlers {
  [key: string]: (context: unknown) => Promise<void> | void;
}

export interface RouteOptions {
  logRoutes?: boolean;
  prefix?: string;
}
