import type { Either } from "@omega/utils";
import { Right, Left } from "@omega/utils";
import type { OmegaConfig } from "@omega/config";
import type { RawCycleData } from "@omega/types";
import type { JiraAdapter } from "../adapters/jira-adapter.interface";
import {
  validateRawCycleData,
  formatValidationErrors,
} from "../middleware/validation";

/**
 * Collect cycle data using the pre-validated adapter from app context
 * This service now focuses solely on business logic - adapter is provided
 * Uses Either for functional error handling
 */
export default async function collectCycleData(
  adapter: JiraAdapter,
  omegaConfig: OmegaConfig,
  _extraFields: string[] = [],
): Promise<Either<Error, RawCycleData>> {
  const result: Either<Error, RawCycleData> = await adapter.fetchCycleData();
  return result.map((rawData) => applyBusinessLogic(rawData));
}

/**
 * Apply Omega-specific business logic to raw data
 * Domain logic: calculates cycle progress from release items
 */
function applyBusinessLogic(rawData: RawCycleData): RawCycleData {
  // Calculate progress for each cycle based on release item completion
  const cyclesWithProgress = rawData.cycles.map((cycle) => {
    const cycleReleaseItems = rawData.releaseItems.filter(
      (ri) => ri.cycleId === cycle.id,
    );

    if (cycleReleaseItems.length === 0) {
      return { ...cycle, progress: 0 };
    }

    const completedItems = cycleReleaseItems.filter((ri) => {
      const status = ri.status?.toLowerCase();
      return status === "done" || status === "completed" || status === "closed";
    });

    const progress = Math.round(
      (completedItems.length / cycleReleaseItems.length) * 100,
    );
    return { ...cycle, progress };
  });

  return {
    ...rawData,
    cycles: cyclesWithProgress,
  };
}

/**
 * Format areas from object or array to consistent array format for API responses
 * API presentation logic: ensures consistent format for HTTP responses
 */
export const formatAreasForResponse = (
  areas: RawCycleData["areas"],
): Array<{ readonly id: string; readonly name: string }> => {
  if (Array.isArray(areas)) {
    return areas.map((area) => ({
      id: area.id,
      name: area.name,
    }));
  }

  // Convert Record to array
  return Object.entries(
    areas as Record<string, { id: string; name: string }>,
  ).map(([id, areaData]) => ({
    id,
    name: typeof areaData === "string" ? areaData : areaData.name,
  }));
};

/**
 * Prepare cycle data for API response
 * API presentation logic: formats domain data for HTTP responses
 */
export const prepareCycleDataResponse = (
  rawData: RawCycleData,
): {
  readonly cycles: RawCycleData["cycles"];
  readonly roadmapItems: RawCycleData["roadmapItems"];
  readonly releaseItems: RawCycleData["releaseItems"];
  readonly assignees: RawCycleData["assignees"];
  readonly areas: Array<{ readonly id: string; readonly name: string }>;
  readonly initiatives: RawCycleData["initiatives"];
  readonly stages: RawCycleData["stages"];
  readonly teams?: RawCycleData["teams"];
} => {
  const {
    cycles,
    roadmapItems,
    releaseItems,
    assignees,
    areas,
    initiatives: configInitiatives,
    stages,
    teams,
  } = rawData;

  return {
    cycles,
    roadmapItems,
    releaseItems,
    assignees,
    areas: formatAreasForResponse(areas),
    initiatives: configInitiatives,
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
  rawData: RawCycleData,
): Either<
  { message: string; validationErrors: unknown[] },
  ReturnType<typeof prepareCycleDataResponse>
> => {
  const validationResult = validateRawCycleData(rawData);

  return validationResult.caseOf({
    Left: (error) =>
      Left({
        message: "Collected data does not match expected schema",
        validationErrors: formatValidationErrors(error),
      }),
    Right: (validatedData) => Right(prepareCycleDataResponse(validatedData)),
  });
};
