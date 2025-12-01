// API-specific types that are not shared across the monorepo

// Re-export Jira types
export * from "./jira-types";

// Re-export parsed DTO types
export * from "./parsed-types";

// Re-export API response types
export * from "./api-response-types";

// Re-export error types
export * from "./error-types";

// ============================================================================
// API Route Types
// ============================================================================

import type { FastifyRequest, FastifyReply } from "fastify";

export interface RouteDefinition {
  method: string;
  path: string;
  handler:
    | string
    | ((request: FastifyRequest, reply: FastifyReply) => Promise<void> | void);
  description: string;
}

export interface RouteHandlers {
  [key: string]: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<void> | void;
}

export interface RouteOptions {
  logRoutes?: boolean;
  prefix?: string;
}
