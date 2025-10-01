import Router from "@koa/router";
import { registerApiRoutes } from "../utils/route-registry";
import { getCycleData } from "../controllers/actions/get-cycle-data";
import type { OmegaConfig } from "@omega/config";

/**
 * Create router with OmegaConfig dependency injection
 * @param omegaConfig - OmegaConfig instance
 * @returns Koa router instance
 */
function createRouter(omegaConfig: OmegaConfig): Router {
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
    cycleData: getCycleData as any,
  };

  // Register API routes
  registerApiRoutes(router as any, routes, handlers);

  return router;
}

export default createRouter;
