// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Safe error message extraction
const getSafeErrorMessage = (error) => {
  return error?.message || error?.toString() || 'Unknown error';
};

// Safe error stack extraction
const getSafeErrorStack = (error) => {
  return error?.stack || 'No stack trace available';
};

// Create a console-based logger that works in both browser and Node.js
const createConsoleLogger = (component) => {
  const prefix = component ? `[${component}]` : '';
  
  return {
    debug: (...args) => console.debug(prefix, ...args),
    info: (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
    fatal: (...args) => console.error(prefix, ...args),
    trace: (...args) => console.trace(prefix, ...args),
    child: (meta) => createConsoleLogger(meta.component || component),
    
    // Safe error logging methods
    errorSafe: (message, error, additionalData = {}) => {
      const errorMessage = getSafeErrorMessage(error);
      const errorStack = getSafeErrorStack(error);
      console.error(prefix, message, { 
        error: errorMessage, 
        stack: errorStack, 
        ...additionalData 
      });
    },
    
    warnSafe: (message, error, additionalData = {}) => {
      const errorMessage = getSafeErrorMessage(error);
      const errorStack = getSafeErrorStack(error);
      console.warn(prefix, message, { 
        error: errorMessage, 
        stack: errorStack, 
        ...additionalData 
      });
    }
  };
};

// Use console-based logger for both environments
// This ensures compatibility and avoids module loading issues
const baseLogger = createConsoleLogger();

// Create a logger factory function
const createLogger = (name) => {
  return baseLogger.child({ component: name });
};

// Create default loggers for common components
const logger = {
  middleware: createLogger('middleware'),
  api: createLogger('api'),
  service: createLogger('service'),
  calculator: createLogger('calculator'),
  error: createLogger('error'),
  default: baseLogger
};

export {
  createLogger,
  logger,
  getSafeErrorMessage,
  getSafeErrorStack
};
