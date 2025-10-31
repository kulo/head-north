import { Context } from "koa";
import collectCycleData, {
  validateAndPrepareCycleData,
} from "../../services/collect-cycle-data";
import { logger } from "@omega/utils";
import type { OmegaConfig } from "@omega/config";
import type { RawCycleData } from "@omega/types";

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
export const getCycleData = async (context: Context): Promise<void> => {
  const omegaConfig = context.omegaConfig as OmegaConfig;

  logger.default.info("fetching raw cycle data");

  try {
    // Collect raw data (I/O operation)
    const rawData: RawCycleData = await collectCycleData(omegaConfig);

    // Validate and prepare using pure business logic
    const validationResult = validateAndPrepareCycleData(rawData);

    // Handle result functionally using Either
    validationResult.caseOf({
      Left: (error) => {
        logger.default.error("Raw cycle data validation failed", {
          errors: error.validationErrors,
        });
        context.status = 500;
        context.body = {
          success: false,
          error: "Data validation failed",
          message: error.message,
          validationErrors: error.validationErrors,
        };
      },
      Right: (preparedData) => {
        logger.default.info(
          `Raw cycle data validated successfully: ${(preparedData.roadmapItems as unknown[])?.length || 0} roadmap items, ${(preparedData.releaseItems as unknown[])?.length || 0} release items, ${(preparedData.cycles as unknown[])?.length || 0} cycles`,
        );

        // Return prepared data - all transformations handled in frontend
        context.body = preparedData;
      },
    });
  } catch (error: unknown) {
    logger.default.error("Error fetching raw cycle data", error);
    context.status = 500;
    context.body = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to fetch cycle data",
    };
  }
};
