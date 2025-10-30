import { Context } from "koa";
import { Either } from "purify-ts";
import collectCycleData from "../../services/collect-cycle-data";
import { logger } from "@omega/utils";
import {
  validateRawCycleData,
  formatValidationErrors,
} from "../../middleware/validation";
import type { OmegaConfig } from "@omega/config";
import type { RawCycleData } from "@omega/types";

/**
 * Get cycle data endpoint that provides raw data for frontend transformation
 * Backend responsibility: Data validation and basic normalization only
 * Frontend responsibility: All presentation logic and calculations
 */
export const getCycleData = async (context: Context): Promise<void> => {
  const omegaConfig = context.omegaConfig as OmegaConfig;

  logger.default.info("fetching raw cycle data");

  try {
    // Collect raw data from Jira
    const rawData: RawCycleData = await collectCycleData(omegaConfig);
    const {
      roadmapItems,
      releaseItems,
      cycles,
      assignees,
      areas,
      initiatives: configInitiatives,
      stages,
      teams,
    } = rawData;

    // Validate data using Zod schema with purify-ts Either for functional error handling
    const validationResult = validateRawCycleData(rawData);

    // Handle validation errors functionally
    validationResult.caseOf({
      Left: (error) => {
        logger.default.error("Raw cycle data validation failed", {
          errors: formatValidationErrors(error),
        });
        context.status = 500;
        context.body = {
          success: false,
          error: "Data validation failed",
          message: "Collected data does not match expected schema",
          validationErrors: formatValidationErrors(error),
        };
        return;
      },
      Right: () => {
        // Validation passed - continue with processing
      },
    });

    // If validation failed, exit early
    if (validationResult.isLeft()) {
      return;
    }

    logger.default.info(
      `Raw cycle data validated successfully: ${roadmapItems?.length || 0} roadmap items, ${releaseItems?.length || 0} release items, ${cycles?.length || 0} cycles`,
    );

    // Convert areas object to array for consistency
    const areasArray = Object.entries(areas).map(([id, areaData]) => ({
      ...areaData,
      id,
    }));

    // Return raw data - all transformations handled in frontend
    context.body = {
      cycles,
      roadmapItems,
      releaseItems, // ← Changed from issues
      assignees,
      areas: areasArray,
      initiatives: configInitiatives,
      stages,
      teams,
    };
  } catch (error) {
    logger.default.error("Error fetching raw cycle data", error);
    context.status = 500;
    context.body = {
      success: false,
      error: (error as Error).message,
      message: "Failed to fetch cycle data",
    };
  }
};
