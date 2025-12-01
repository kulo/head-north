import type { FastifyInstance } from "fastify";
import { registerApiRoutes } from "../utils/route-registry";
import { getCycleData } from "../controllers/actions/get-cycle-data";
import type { HeadNorthConfig } from "@headnorth/config";

/**
 * Register routes with Fastify instance
 * @param fastify - Fastify instance
 * @param headNorthConfig - HeadNorthConfig instance (for future use)
 */
function registerRoutes(
  fastify: FastifyInstance,
  _headNorthConfig: HeadNorthConfig,
): void {
  // Root endpoint
  fastify.get("/", async (_request, reply) => {
    reply.send("Welcome to the Head North Cycle Data Service Backend");
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
    cycleData: getCycleData,
  };

  // Register API routes
  registerApiRoutes(fastify, routes, handlers);
}

export default registerRoutes;
