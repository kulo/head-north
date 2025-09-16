import Router from '@koa/router';
import { registerApiRoutes } from './utils/route-registry.js';
import getUnifiedData from './actions/unified-data.js';

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
      path: '/unified-data',
      handler: 'unifiedData',
      description: 'Unified data endpoint with single data structure for all views'
    },
    {
      method: 'GET',
      path: '/unified-data/:id',
      handler: 'unifiedData',
      description: 'Unified data endpoint for specific cycle with single data structure'
    }
  ];

  // Define route handlers
  const handlers = {
    unifiedData: getUnifiedData
  };

  // Register API routes
  registerApiRoutes(router, routes, handlers);

  return router;
}

export default createRouter;
