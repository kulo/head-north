import type { Either } from "@headnorth/utils";
import { Right, Left } from "@headnorth/utils";
import type { HeadNorthConfig } from "@headnorth/config";
import type { RawCycleData } from "@headnorth/types";
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
  headNorthConfig: HeadNorthConfig,
  _extraFields: string[] = [],
): Promise<Either<Error, RawCycleData>> {
  const result: Either<Error, RawCycleData> = await adapter.fetchCycleData();
  return result.map((rawData) => applyBusinessLogic(rawData));
}

/**
 * Apply Head North-specific business logic to raw data
 * Domain logic: calculates cycle progress from cycle items
 */
function applyBusinessLogic(rawData: RawCycleData): RawCycleData {
  // Calculate progress for each cycle based on cycle item completion
  const cyclesWithProgress = rawData.cycles.map((cycle) => {
    const cycleItems = rawData.cycleItems.filter(
      (ri) => ri.cycleId === cycle.id,
    );

    if (cycleItems.length === 0) {
      return { ...cycle, progress: 0 };
    }

    const completedItems = cycleItems.filter((ri) => {
      const status = ri.status?.toLowerCase();
      return status === "done" || status === "completed" || status === "closed";
    });

    const progress = Math.round(
      (completedItems.length / cycleItems.length) * 100,
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
  readonly cycleItems: RawCycleData["cycleItems"];
  readonly assignees: RawCycleData["assignees"];
  readonly areas: Array<{ readonly id: string; readonly name: string }>;
  readonly objectives: RawCycleData["objectives"];
  readonly stages: RawCycleData["stages"];
  readonly teams?: RawCycleData["teams"];
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
    areas: formatAreasForResponse(areas),
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
