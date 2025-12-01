/**
 * Route Registry Utility
 * Utility for registering routes using shared configuration
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { logger } from "@headnorth/utils";
import type { RouteDefinition, RouteHandlers, RouteOptions } from "../types";

/**
 * Register API routes using provided route definitions
 * @param fastify - Fastify instance
 * @param routes - Array of route definitions
 * @param handlers - Object containing route handlers
 * @param options - Registration options
 */
function registerApiRoutes(
  fastify: FastifyInstance,
  routes: RouteDefinition[],
  handlers: RouteHandlers,
  options: RouteOptions = {},
): void {
  const { logRoutes = true, prefix = "" } = options;

  routes.forEach((route) => {
    // Get the actual handler function from the handlers object
    const handlerFunction =
      typeof route.handler === "string"
        ? handlers[route.handler] || defaultHealthCheck
        : route.handler;

    if (handlerFunction) {
      const fullPath = prefix + route.path;
      const method = route.method.toLowerCase() as
        | "get"
        | "post"
        | "put"
        | "delete"
        | "patch"
        | "head"
        | "options";

      // Register route with Fastify
      fastify[method](
        fullPath,
        handlerFunction as (
          request: FastifyRequest,
          reply: FastifyReply,
        ) => Promise<void>,
      );

      if (logRoutes) {
        logger.default.info("Route registered", {
          method: route.method,
          path: fullPath,
          description: route.description,
        });
      }
    }
  });

  if (logRoutes) {
    logger.default.info("API routes registered", {
      totalRoutes: routes.length,
      routePaths: routes.map((r) => r.path),
    });
  }
}

/**
 * Default health check handler
 */
function defaultHealthCheck(
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  reply.send({
    success: true,
    timestamp: new Date().toISOString(),
    service: "headnorth-backend",
  });
}

/**
 * Get all registered routes for debugging
 * @param fastify - Fastify instance
 * @returns Array of registered routes
 */
function getRegisteredRoutes(
  fastify: FastifyInstance,
): Array<{ method: string; path: string }> {
  const routes: Array<{ method: string; path: string }> = [];
  const validMethods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
  ];
  fastify
    .printRoutes()
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^(\w+)\s+(.+)$/);
      if (match && match[1] && match[2]) {
        const method = match[1].toUpperCase();
        const path = match[2].trim();
        // Only include valid HTTP methods and paths starting with /
        if (validMethods.includes(method) && path.startsWith("/")) {
          routes.push({ method, path });
        }
      }
    });
  return routes;
}

export { registerApiRoutes, getRegisteredRoutes };
