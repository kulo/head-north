/**
 * Route Registry Utility
 * Utility for registering routes using shared configuration
 */

import { logger } from '@omega-one/shared-utils';

/**
 * Register API routes using shared configuration
 * @param {Object} router - Koa router instance
 * @param {Object} handlers - Object containing route handlers
 * @param {Object} omegaConfig - OmegaConfig instance
 * @param {Object} options - Registration options
 */
function registerApiRoutes(router, handlers, omegaConfig, options = {}) {
  const { logRoutes = true, prefix = '' } = options;
  const endpoints = omegaConfig.getEndpoints();
  
  const routes = [
    {
      method: 'GET',
      path: endpoints.HEALTH_CHECK,
      handler: handlers.healthCheck || defaultHealthCheck,
      description: 'Health check endpoint'
    },
    {
      method: 'GET',
      path: endpoints.CYCLE_OVERVIEW,
      handler: handlers.cycleOverview,
      description: 'Overview data for a specific cycle/sprint'
    },
    {
      method: 'GET',
      path: endpoints.CYCLES_ROADMAP,
      handler: handlers.cyclesRoadmap,
      description: 'Cycles roadmap data showing past, current, and future cycles'
    }
  ];

  routes.forEach(route => {
    if (route.handler) {
      const fullPath = prefix + route.path;
      router[route.method.toLowerCase()](fullPath, route.handler);
      
      if (logRoutes) {
        logger.default.info('Route registered', {
          method: route.method,
          path: fullPath,
          description: route.description
        });
      }
    }
  });

  if (logRoutes) {
    logger.default.info('API routes registered using shared configuration', {
      totalRoutes: routes.length,
      endpoints: Object.values(endpoints)
    });
  }
}

/**
 * Default health check handler
 */
function defaultHealthCheck(context) {
  context.body = { 
    success: true, 
    timestamp: new Date().toISOString(),
    service: 'omega-backend'
  };
}

/**
 * Get all registered routes for debugging
 * @param {Object} router - Koa router instance
 * @returns {Array} Array of registered routes
 */
function getRegisteredRoutes(router) {
  return router.stack.map(layer => ({
    method: layer.methods.join(', ').toUpperCase(),
    path: layer.path,
    name: layer.name
  }));
}

export {
  registerApiRoutes,
  getRegisteredRoutes
};
