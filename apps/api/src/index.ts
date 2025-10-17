import Koa from "koa";
import createRouter from "./routes/router";
import cors from "@koa/cors";
import { OmegaConfig } from "@omega/config";
import { logger } from "@omega/utils";
import errorHandler from "./middleware/error-handler";

// Create OmegaConfig instance for backend
const omegaConfig = new OmegaConfig({
  processEnv: process.env,
  overrides: { environment: process.env.NODE_ENV || "development" },
});

// Create the Koa app
const app = new Koa();

// Make omegaConfig available to the app context
app.context.omegaConfig = omegaConfig;

// Create router with omegaConfig injection
const router = createRouter(omegaConfig);

app.use(cors());

app.use(errorHandler);

app.use(router.routes());
app.use(router.allowedMethods());

try {
  const port = omegaConfig.get("backend.port");
  app.listen(port);
  logger.default.info("started", { port });
} catch (error) {
  logger.error.errorSafe("app-crashed", error);
}
