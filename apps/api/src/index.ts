import Koa from "koa";
import createRouter from "./routes/router";
import cors from "@koa/cors";
import { OmegaConfig } from "@omega/config";
import { logger } from "@omega/utils";
import errorHandler from "./middleware/error-handler";
import { createJiraAdapter } from "./adapters/adapter-factory";

try {
  // Create OmegaConfig instance for backend
  const omegaConfig = new OmegaConfig({
    processEnv: process.env,
    overrides: { environment: process.env.NODE_ENV || "development" },
  });

  // Validate JIRA config and create adapter at app startup
  // This ensures configuration errors are caught early (fail-fast)
  const adapterResult = createJiraAdapter(omegaConfig);
  const jiraAdapter = adapterResult.caseOf({
    Left: (error) => {
      const errorMessage = `JIRA configuration is invalid: ${error.message}. 
      Application cannot start without valid JIRA configuration when not using fake data.`;
      logger.default.error(errorMessage);
      logger.error.errorSafe("Backend App crashed:", error);
      process.exit(1);
      return null as never;
    },
    Right: (adapter) => adapter,
  });

  // Create the Koa app
  const app = new Koa();

  // Make omegaConfig and pre-validated jiraAdapter available to the app context
  app.context.omegaConfig = omegaConfig;
  app.context.jiraAdapter = jiraAdapter;

  // Create router with omegaConfig injection
  const router = createRouter(omegaConfig);

  app.use(cors());
  app.use(errorHandler);
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Start server
  const port = omegaConfig.get("backend.port");
  app.listen(port);
  logger.default.info("started", { port });
} catch (error) {
  logger.error.errorSafe("Backend App crashed:", error);
  process.exit(1);
}
