import Router from '@koa/router';
import { registerApiRoutes } from './utils/route-registry.js';
import getCycleData from './actions/cycle-data.js';

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

  // Define API routes
  const routes = [
    {
      method: 'GET',
      path: '/healthcheck',
      handler: 'healthCheck',
      description: 'Health check endpoint'
    },
    {
      method: 'GET',
      path: '/cycle-data',
      handler: 'cycleData',
      description: 'Cycle data endpoint with unified data structure for all views'
    }
  ];

  // Define route handlers
  const handlers = {
    cycleData: getCycleData
  };

  // Register API routes
  registerApiRoutes(router, routes, handlers);

  return router;
}

export default createRouter;
