import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { logger } from "@headnorth/utils";

/**
 * Fastify error handler
 * Handles errors thrown during request processing
 */
export default async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const errorMessage = error?.message || error?.toString() || "Unknown error";
  logger.middleware.errorSafe("error-handler", error);

  reply.status(503).send({
    message: "An Error occurred!",
    error: errorMessage,
    stack: error?.stack || "No stack trace available",
  });
};
