/**
 * Route Registry Utility
 * Utility for registering routes using shared configuration
 */

import { Context } from "koa";
import { logger } from "@omega/utils";
import type { RouteDefinition, RouteHandlers, RouteOptions } from "../types";
import type { Router, RouterLayer } from "../types/api-response-types";

/**
 * Register API routes using provided route definitions
 * @param router - Koa router instance
 * @param routes - Array of route definitions
 * @param handlers - Object containing route handlers
 * @param options - Registration options
 */
function registerApiRoutes(
  router: Router,
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
      (
        router as unknown as {
          [key: string]: (path: string, handler: unknown) => void;
        }
      )[route.method.toLowerCase()]?.(fullPath, handlerFunction);

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
function defaultHealthCheck(context: Context): void {
  context.body = {
    success: true,
    timestamp: new Date().toISOString(),
    service: "omega-backend",
  };
}

/**
 * Get all registered routes for debugging
 * @param router - Koa router instance
 * @returns Array of registered routes
 */
function getRegisteredRoutes(
  router: Router,
): Array<{ method: string; path: string; name: string }> {
  return router.stack.map((layer: RouterLayer) => ({
    method: layer.methods.join(", ").toUpperCase(),
    path: layer.path,
    name: layer.name || "unnamed",
  }));
}

export { registerApiRoutes, getRegisteredRoutes };
