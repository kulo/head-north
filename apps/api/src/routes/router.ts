import Router from "@koa/router";
import { registerApiRoutes } from "../utils/route-registry";
import { getCycleData } from "../controllers/actions/get-cycle-data";
import type { OmegaConfig } from "@omega/config";
import type { Router as ApiRouter } from "../types/api-response-types";

/**
 * Create router with OmegaConfig dependency injection
 * @param omegaConfig - OmegaConfig instance
 * @returns Koa router instance
 */
function createRouter(_omegaConfig: OmegaConfig): Router {
  const router = new Router();

  // Root endpoint
  router.get("/", async (context) => {
    context.body = "Welcome to the Omega Cycle Data Service Backend";
  });

  // Define API routes
  const routes = [
    {
      method: "GET",
      path: "/healthcheck",
      handler: "healthCheck",
      description: "Health check endpoint",
    },
    {
      method: "GET",
      path: "/cycle-data",
      handler: "cycleData",
      description:
        "Cycle data endpoint with unified data structure for all views",
    },
  ];

  // Define route handlers
  const handlers = {
    cycleData: getCycleData as (context: unknown) => void | Promise<void>,
  };

  // Register API routes
  registerApiRoutes(router as unknown as ApiRouter, routes, handlers);

  return router;
}

export default createRouter;
