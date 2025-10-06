import { Context } from "koa";
import collectCycleData from "../../services/collect-cycle-data";
import { logger } from "@omega/utils";
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

    // Basic data validation - fail fast on invalid data
    validateRawData(rawData);

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

/**
 * Validate raw data structure - fail fast on invalid data
 */
function validateRawData(data: RawCycleData): void {
  const {
    cycles,
    roadmapItems,
    releaseItems,
    assignees,
    areas,
    stages,
    initiatives,
  } = data;

  // Validate required arrays exist
  if (!Array.isArray(cycles)) {
    throw new Error("Invalid cycles data: expected array");
  }
  if (!Array.isArray(roadmapItems)) {
    throw new Error("Invalid roadmapItems data: expected array");
  }
  if (!Array.isArray(releaseItems)) {
    throw new Error("Invalid releaseItems data: expected array");
  }
  if (!Array.isArray(assignees)) {
    throw new Error("Invalid assignees data: expected array");
  }
  if (!Array.isArray(stages)) {
    throw new Error("Invalid stages data: expected array");
  }
  if (typeof initiatives !== "object" || initiatives === null) {
    throw new Error("Invalid initiatives data: expected object");
  }

  // Validate areas (can be object or array)
  if (typeof areas !== "object" || areas === null) {
    throw new Error("Invalid areas data: expected object");
  }

  // Validate cycles have required fields
  cycles.forEach((cycle, index) => {
    if (!cycle.id || !cycle.name) {
      throw new Error(`Invalid cycle at index ${index}: missing id or name`);
    }
  });

  // Validate assignees have required fields
  assignees.forEach((assignee, index) => {
    if (!assignee.accountId || !assignee.displayName) {
      throw new Error(
        `Invalid assignee at index ${index}: missing accountId or displayName`,
      );
    }
  });

  logger.default.info(
    `Raw data validation passed: ${roadmapItems?.length || 0} roadmap items, ${releaseItems?.length || 0} release items, ${cycles?.length || 0} cycles`,
  );
}
