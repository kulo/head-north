import collectCycleData, {
  validateAndPrepareCycleData,
} from "../../services/collect-cycle-data";
import { Either, logger } from "@headnorth/utils";
import type { RawCycleData } from "@headnorth/types";
import type { HeadNorthContext } from "../../types/koa-context";

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
  context: HeadNorthContext,
): Promise<void> => {
  const { headNorthConfig, jiraAdapter } = context;

  logger.default.info("fetching raw cycle data");

  // Collect raw data (I/O operation) - now returns Either
  // Adapter is pre-validated at app startup, so no config extraction needed
  const collectResult: Either<Error, RawCycleData> = await collectCycleData(
    jiraAdapter,
    headNorthConfig,
  );

  // Chain validation and preparation, handling errors functionally
  const validationResult = collectResult.chain((rawData: RawCycleData) =>
    validateAndPrepareCycleData(rawData),
  );

  // Handle result functionally using Either
  validationResult.caseOf({
    Left: (error) => {
      // Check if error is from collection or validation
      if ("validationErrors" in error) {
        logger.default.errorSafe("Raw cycle data validation failed", error, {
          validationErrors: error.validationErrors,
        });
        context.status = 500;
        context.body = {
          success: false,
          error: "Data validation failed",
          message: error.message,
          validationErrors: error.validationErrors,
        };
      } else {
        // Error from collection (adapter failure)
        logger.default.errorSafe("Error fetching raw cycle data", error, {
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
        });
        context.status = 500;
        context.body = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Failed to fetch cycle data",
        };
      }
    },
    Right: (preparedData) => {
      logger.default.info(
        `Raw cycle data validated successfully: ${(preparedData.roadmapItems as unknown[])?.length || 0} roadmap items, ${(preparedData.cycleItems as unknown[])?.length || 0} cycle items, ${(preparedData.cycles as unknown[])?.length || 0} cycles`,
      );

      // Return prepared data - all transformations handled in frontend
      context.body = preparedData;
    },
  });
};
