import Koa from "koa";
import createRouter from "./routes/router";
import cors from "@koa/cors";
import { HeadNorthConfig } from "@headnorth/config";
import { logger } from "@headnorth/utils";
import errorHandler from "./middleware/error-handler";
import { createJiraAdapter } from "./adapters/adapter-factory";

try {
  // Create HeadNorthConfig instance for backend
  const headNorthConfig = new HeadNorthConfig({
    processEnv: process.env,
    overrides: { environment: process.env.NODE_ENV || "development" },
  });

  // Validate JIRA config and create adapter at app startup
  // This ensures configuration errors are caught early (fail-fast)
  const adapterResult = createJiraAdapter(headNorthConfig);
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

  // Make headNorthConfig and pre-validated jiraAdapter available to the app context
  app.context.headNorthConfig = headNorthConfig;
  app.context.jiraAdapter = jiraAdapter;

  // Create router with headNorthConfig injection
  const router = createRouter(headNorthConfig);

  app.use(cors());
  app.use(errorHandler);
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Start server
  const port = headNorthConfig.get("backend.port");
  app.listen(port);
  logger.default.info("started", { port });
} catch (error) {
  logger.error.errorSafe("Backend App crashed:", error);
  process.exit(1);
}
