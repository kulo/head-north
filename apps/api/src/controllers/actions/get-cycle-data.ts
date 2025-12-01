import { logger } from "@headnorth/utils";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { HeadNorthRequest } from "../../types/head-north-request";

/**
 * Get cycle data endpoint that provides raw data for frontend transformation
 *
 * This handler handles I/O:
 * - Fetches data from JIRA adapter (I/O)
 * - Handles HTTP response (I/O)
 *
 * All data transformations are handled in the frontend.
 */
export const getCycleData = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const headNorthRequest = request as HeadNorthRequest;
  const { jiraAdapter } = headNorthRequest;

  logger.default.info("Fetching raw cycle data.");

  // Fetch data directly from adapter
  const fetchResult = await jiraAdapter.fetchCycleData();

  // Handle result functionally using Either
  fetchResult.caseOf({
    Left: (error) => {
      // Log error
      logger.default.errorSafe("Getting cycle data failed!", error);

      // Translate error to HTTP response
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    },
    Right: (cycleData) => {
      logger.default.info(
        `Raw cycle data fetched successfully: 
        ${cycleData.roadmapItems.length} roadmap items, 
        ${cycleData.cycleItems.length} cycle items, 
        ${cycleData.cycles.length} cycles`,
      );

      reply.send(cycleData);
    },
  });
};
