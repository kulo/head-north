import type { Either } from "@headnorth/utils";
import { Right, Left } from "@headnorth/utils";
import type { HeadNorthConfig } from "@headnorth/config";
import type { CycleData } from "@headnorth/types";
import type { JiraAdapter } from "../adapters/jira-adapter.interface";
import {
  validateCycleData,
  formatValidationErrors,
} from "../middleware/validation";

/**
 * Collect cycle data using the pre-validated adapter from app context
 * This service now focuses solely on business logic - adapter is provided
 * Uses Either for functional error handling
 */
export default async function collectCycleData(
  adapter: JiraAdapter,
  headNorthConfig: HeadNorthConfig,
  _extraFields: string[] = [],
): Promise<Either<Error, CycleData>> {
  // Progress calculations are now handled entirely in the frontend
  return await adapter.fetchCycleData();
}

/**
 * Prepare cycle data for API response
 * API presentation logic: formats domain data for HTTP responses
 */
export const prepareCycleDataResponse = (
  rawData: CycleData,
): {
  readonly cycles: CycleData["cycles"];
  readonly roadmapItems: CycleData["roadmapItems"];
  readonly cycleItems: CycleData["cycleItems"];
  readonly assignees: CycleData["assignees"];
  readonly areas: CycleData["areas"];
  readonly objectives: CycleData["objectives"];
  readonly stages: CycleData["stages"];
  readonly teams?: CycleData["teams"];
} => {
  const {
    cycles,
    roadmapItems,
    cycleItems,
    assignees,
    areas,
    objectives: configObjectives,
    stages,
    teams,
  } = rawData;

  return {
    cycles,
    roadmapItems,
    cycleItems,
    assignees,
    areas,
    objectives: configObjectives,
    stages,
    teams,
  };
};

/**
 * Validate and prepare cycle data for API response
 * API boundary logic: validates domain data and formats for HTTP responses
 * Returns Either<Error, PreparedData> for functional error handling
 */
export const validateAndPrepareCycleData = (
  rawData: CycleData,
): Either<Error, ReturnType<typeof prepareCycleDataResponse>> => {
  const validationResult = validateCycleData(rawData);

  return validationResult.caseOf({
    Left: (error) => {
      // Create error with validation details in message
      const validationErrors = formatValidationErrors(error);
      const errorMessage = `Data validation failed: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join(", ")}`;
      const validationError = new Error(errorMessage);
      // Attach validation errors to error object for HTTP response
      (
        validationError as Error & { validationErrors?: unknown[] }
      ).validationErrors = validationErrors;
      return Left(validationError);
    },
    Right: (validatedData) => Right(prepareCycleDataResponse(validatedData)),
  });
};
