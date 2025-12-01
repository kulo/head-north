import collectCycleData, {
  validateAndPrepareCycleData,
} from "../../services/collect-cycle-data";
import { Either, logger } from "@headnorth/utils";
import type { CycleData } from "@headnorth/types";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { HeadNorthRequest } from "../../types/head-north-request";

/**
 * Get cycle data endpoint that provides raw data for frontend transformation
 *
 * This handler is now thin - it only handles I/O:
 * - Fetches data (I/O)
 * - Calls pure business logic functions
 * - Handles HTTP response (I/O)
 *
 * All business logic is in cycle-data-business-logic.ts
 */
export const getCycleData = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const headNorthRequest = request as HeadNorthRequest;
  const { headNorthConfig, jiraAdapter } = headNorthRequest;

  logger.default.info("fetching raw cycle data");

  const collectResult = await collectCycleData(jiraAdapter, headNorthConfig);

  const validationResult = collectResult.chain((rawData: CycleData) =>
    validateAndPrepareCycleData(rawData),
  );

  // Handle result functionally using Either
  validationResult.caseOf({
    Left: (error) => {
      // Log error
      logger.default.errorSafe("Getting cycle data failed!", error);

      // Translate error to HTTP response - error message already contains proper context
      reply.status(500).send({
        success: false,
        error: error.message,
        ...("validationErrors" in error && {
          validationErrors: (error as Error & { validationErrors?: unknown[] })
            .validationErrors,
        }),
      });
    },
    Right: (preparedData) => {
      logger.default.info(
        `Raw cycle data validated successfully: 
        ${(preparedData.roadmapItems as unknown[])?.length || 0} roadmap items, 
        ${(preparedData.cycleItems as unknown[])?.length || 0} cycle items, 
        ${(preparedData.cycles as unknown[])?.length || 0} cycles`,
      );

      // Return prepared data - all transformations handled in frontend
      reply.send(preparedData);
    },
  });
};
