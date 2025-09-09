/**
 * Route Registry Utility
 * Utility for registering routes using shared configuration
 */

import { logger } from '@omega-one/shared-utils';

/**
 * Register API routes using provided route definitions
 * @param {Object} router - Koa router instance
 * @param {Array} routes - Array of route definitions
 * @param {Object} handlers - Object containing route handlers
 * @param {Object} options - Registration options
 */
function registerApiRoutes(router, routes, handlers, options = {}) {
  const { logRoutes = true, prefix = '' } = options;

  routes.forEach(route => {
    // Get the actual handler function from the handlers object
    const handlerFunction = typeof route.handler === 'string' 
      ? handlers[route.handler] || defaultHealthCheck
      : route.handler;
    
    if (handlerFunction) {
      const fullPath = prefix + route.path;
      router[route.method.toLowerCase()](fullPath, handlerFunction);
      
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
    logger.default.info('API routes registered', {
      totalRoutes: routes.length,
      routePaths: routes.map(r => r.path)
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
