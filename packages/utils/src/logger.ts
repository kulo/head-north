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
      console.error(prefix, message, {
        error: errorMessage,
        stack: errorStack,
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
      console.warn(prefix, message, {
        error: errorMessage,
        stack: errorStack,
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
