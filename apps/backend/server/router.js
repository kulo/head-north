import Router from '@koa/router';
import { registerApiRoutes } from './utils/route-registry.js';
import getCycleOverview from './actions/overview-for-cycle.js';
import getCyclesRoadmap from './actions/cycles-roadmap.js';

/**
 * Create router with OmegaConfig dependency injection
 * @param {Object} omegaConfig - OmegaConfig instance
 * @returns {Object} Koa router instance
 */
function createRouter(omegaConfig) {
  const router = new Router();

  // Root endpoint
  router.get('/', async (context) => {
      context.body = "Welcome to the Omega Cycle Data Service Backend";
  });

  // Register API routes using shared configuration
  registerApiRoutes(router, {
      cycleOverview: getCycleOverview,
      cyclesRoadmap: getCyclesRoadmap
  }, omegaConfig);

  return router;
}

export default createRouter;
