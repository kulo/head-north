import Router from '@koa/router';
import { registerApiRoutes } from './utils/route-registry.js';
import getCycleOverview from './actions/cycle-overview.js';
import getCyclesRoadmap from './actions/cycles-roadmap.js';
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
    },
    {
      method: 'GET',
      path: '/cycles/:id/overview',
      handler: 'cycleOverview',
      description: 'Overview data for a specific cycle/sprint (legacy)'
    },
    {
      method: 'GET',
      path: '/cycles/roadmap',
      handler: 'cyclesRoadmap',
      description: 'Cycles roadmap data showing past, current, and future cycles (legacy)'
    }
  ];

  // Define route handlers
  const handlers = {
    unifiedData: getUnifiedData,
    cycleOverview: getCycleOverview,
    cyclesRoadmap: getCyclesRoadmap
  };

  // Register API routes
  registerApiRoutes(router, routes, handlers);

  return router;
}

export default createRouter;
