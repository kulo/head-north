import Fastify from "fastify";
import cors from "@fastify/cors";
import { HeadNorthConfig } from "@headnorth/config";
import { logger } from "@headnorth/utils";
import errorHandler from "./middleware/error-handler";
import { createJiraAdapter } from "./adapters/adapter-factory";
import type { JiraAdapter } from "./adapters/jira-adapter.interface";
import registerRoutes from "./routes/router";

/**
 * Creates and validates JIRA adapter at application startup.
 * Exits the process if adapter creation fails (critical startup failure).
 *
 * @param headNorthConfig - Head North configuration instance
 * @returns Validated JIRA adapter
 */
function getJiraAdapterOrExit(headNorthConfig: HeadNorthConfig): JiraAdapter {
  const adapterResult = createJiraAdapter(headNorthConfig);
  return adapterResult.caseOf({
    Left: (error) => {
      // Critical startup failure - fail fast to prevent running in invalid state
      logger.error.errorSafe(
        "Cannot create JIRA adapter due to invalid configuration:",
        error,
      );
      process.exit(1);
      return null as never;
    },
    Right: (adapter) => adapter,
  });
}

async function startServer(): Promise<void> {
  const headNorthConfig = new HeadNorthConfig({
    processEnv: process.env,
    overrides: { environment: process.env.NODE_ENV || "development" },
  });

  try {
    const jiraAdapter = getJiraAdapterOrExit(headNorthConfig);

    const fastify = Fastify({
      logger: false, // We use our own logger
    });

    await fastify.register(cors, {
      origin: true, // Allow all origins (can be configured later)
    });

    // Decorate request with headNorthConfig and pre-validated jiraAdapter
    // Using a hook to attach these to every request
    fastify.addHook("onRequest", async (request) => {
      (
        request as unknown as { headNorthConfig: HeadNorthConfig }
      ).headNorthConfig = headNorthConfig;
      (request as unknown as { jiraAdapter: typeof jiraAdapter }).jiraAdapter =
        jiraAdapter;
    });

    fastify.setErrorHandler(errorHandler);

    registerRoutes(fastify, headNorthConfig);

    // Start server
    const port = headNorthConfig.getPort();
    await fastify.listen({ port, host: "0.0.0.0" });
    logger.default.info("Started Head-North backend process! ", { port });
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === "EADDRINUSE") {
      const portNumber = headNorthConfig.getPort();
      logger.default.error(
        `Port ${portNumber} is already in use. Please stop the process using this port or use a different port.`,
      );
      logger.default.info(
        `You can stop processes on port ${portNumber} by running: pnpm stop:api or lsof -ti:${portNumber} | xargs kill -9`,
      );
    } else {
      // Unified error logging for startup errors (JIRA config errors handled separately above)
      logger.error.errorSafe("Backend App crashed:", err);
    }
    process.exit(1);
  }
}

// Start the server
startServer();
