// Logger utility functions

// Safe error message extraction
export const getSafeErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  if (error) {
    return String(error);
  }
  return "Unknown error";
};

// Safe error stack extraction
export const getSafeErrorStack = (error: unknown): string => {
  if (error && typeof error === "object" && "stack" in error) {
    return String(error.stack);
  }
  return "No stack trace available";
};

// Extract all error properties for detailed logging
export const getErrorDetails = (error: unknown): Record<string, unknown> => {
  if (!error || typeof error !== "object") {
    return {};
  }

  const details: Record<string, unknown> = {};

  // Extract common error properties
  if ("message" in error) {
    details.message = String(error.message);
  }
  if ("name" in error) {
    details.name = String(error.name);
  }
  if ("code" in error) {
    details.code = error.code;
  }
  if ("statusCode" in error) {
    details.statusCode = error.statusCode;
  }
  if ("status" in error) {
    details.status = error.status;
  }
  if ("response" in error) {
    // Try to extract response details safely
    try {
      const response = error.response as unknown;
      if (response && typeof response === "object") {
        if ("status" in response) {
          details.responseStatus = response.status;
        }
        if ("statusText" in response) {
          details.responseStatusText = response.statusText;
        }
        if ("data" in response) {
          details.responseData = response.data;
        }
      }
    } catch {
      // Ignore errors when extracting response details
    }
  }
  if ("cause" in error) {
    details.cause = error.cause;
  }

  return details;
};

// Logger interface
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
  trace: (...args: unknown[]) => void;
  child: (meta: { component?: string }) => Logger;
  errorSafe: (
    message: string,
    error: unknown,
    additionalData?: Record<string, unknown>,
  ) => void;
  warnSafe: (
    message: string,
    error: unknown,
    additionalData?: Record<string, unknown>,
  ) => void;
}

// Create a console-based logger that works in both browser and Node.js
const createConsoleLogger = (component?: string): Logger => {
  const prefix = component ? `[${component}]` : "";

  return {
    debug: (...args: unknown[]) => console.debug(prefix, ...args),
    info: (...args: unknown[]) => console.info(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
    fatal: (...args: unknown[]) => console.error(prefix, ...args),
    trace: (...args: unknown[]) => console.trace(prefix, ...args),
    child: (meta: { component?: string }) =>
      createConsoleLogger(meta.component || component),

    // Safe error logging methods
    errorSafe: (
      message: string,
      error: unknown,
      additionalData: Record<string, unknown> = {},
    ) => {
      const errorMessage = getSafeErrorMessage(error);
      const errorStack = getSafeErrorStack(error);
      const errorDetails = getErrorDetails(error);
      console.error(prefix, message, {
        error: errorMessage,
        stack: errorStack,
        ...errorDetails,
        ...additionalData,
      });
    },

    warnSafe: (
      message: string,
      error: unknown,
      additionalData: Record<string, unknown> = {},
    ) => {
      const errorMessage = getSafeErrorMessage(error);
      const errorStack = getSafeErrorStack(error);
      const errorDetails = getErrorDetails(error);
      console.warn(prefix, message, {
        error: errorMessage,
        stack: errorStack,
        ...errorDetails,
        ...additionalData,
      });
    },
  };
};

// Use console-based logger for both environments
// This ensures compatibility and avoids module loading issues
const baseLogger = createConsoleLogger();

// Create a logger factory function
export const createLogger = (name: string): Logger => {
  return baseLogger.child({ component: name });
};

// Create default loggers for common components
export const logger = {
  middleware: createLogger("middleware"),
  api: createLogger("api"),
  service: createLogger("service"),
  calculator: createLogger("calculator"),
  error: createLogger("error"),
  default: baseLogger,
};
