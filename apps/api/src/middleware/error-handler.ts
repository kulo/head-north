import { Context, Next } from "koa";
import { logger } from "@headnorth/utils";

export default async (context: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (error) {
    const errorMessage =
      (error as Error)?.message || error?.toString() || "Unknown error";
    logger.middleware.errorSafe("error-handler", error);

    context.status = 503;
    context.body = {
      message: "An Error occurred!",
      error: errorMessage,
      stack: (error as Error)?.stack || "No stack trace available",
    };
  }
};
