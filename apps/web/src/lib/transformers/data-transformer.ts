/**
 * Data Transformer
 *
 * Pure data transformation functions with no side effects.
 * Handles the core business logic of transforming raw data into UI-ready formats.
 *
 * This belongs in /lib because it contains only pure functions with no external dependencies.
 */

import { Maybe } from "purify-ts";
import type { CycleData, ObjectiveId, ValidationItem } from "@headnorth/types";
import type {
  FilterCriteria,
  ObjectiveWithProgress,
  NestedCycleData,
  RoadmapItemWithProgress,
  RoadmapData,
  CycleOverviewData,
  FilterResult,
} from "../../types/ui-types";
import { filter } from "../utils/filter";
import { selectDefaultCycle } from "../selectors/cycle-selector";
import { calculateCycleProgress } from "../cycle-progress-calculator";
import { calculateCycleItemProgress } from "../calculations/cycle-calculations";
import { pipe } from "@headnorth/utils";
import HeadNorthConfig from "@headnorth/config";

/**
 * Hydrate ValidationItems with dictionary data
 * Uses Maybe for safe dictionary lookup
 */
function hydrateValidations(
  config: HeadNorthConfig,
  validations: readonly ValidationItem[],
): readonly ValidationItem[] {
  const dictionary = config.getValidationDictionary();

  return validations.map((v) => {
    // Parse code to determine if it's cycleItem or roadmapItem
    const [category, ruleKey] = parseValidationCode(v.code);

    // Use Maybe chain for safe dictionary lookup without extract()
    // Type assertion needed because category is a string but ValidationRules has specific keys
    const rule = Maybe.fromNullable(
      (
        dictionary as unknown as Record<
          string,
          Record<string, { label: string; reference: URL }>
        >
      )[category],
    ).chain((categoryDict) => Maybe.fromNullable(categoryDict[ruleKey]));

    const hydratedName = rule.map((r) => r.label).orDefault(v.name);
    const hydratedDescription = rule
      .map((r) => r.reference.toString())
      .orDefault(v.description ?? "");

    return {
      ...v,
      name: hydratedName,
      ...(hydratedDescription !== undefined && {
        description: hydratedDescription,
      }),
    };
  });
}

/**
 * Parse validation code to determine category and rule key
 */
function parseValidationCode(code: string): [string, string] {
  // Check if it's a cycle item validation
  const cycleItemValidations = [
    "noProjectId",
    "missingAreaLabel",
    "missingTeamLabel",
    "missingTeamTranslation",
    "missingEstimate",
    "tooGranularEstimate",
    "missingStage",
    "missingAssignee",
    "tooLowStageWithoutProperRoadmapItem",
  ];

  if (cycleItemValidations.includes(code)) {
    return ["cycleItem", code];
  }

  // Otherwise it's a roadmap item validation
  return ["roadmapItem", code];
}

/**
 * Transform raw CycleData to NestedCycleData structure
 * Pure function - no side effects
 */
export function transformToNestedStructure(
  config: HeadNorthConfig,
  rawData: CycleData,
): NestedCycleData {
  const { cycles, roadmapItems, cycleItems, objectives } = rawData;

  // Create objectives lookup using functional reduce
  const objectivesLookup: Record<string, string> = Array.isArray(objectives)
    ? objectives.reduce(
        (acc, obj) => {
          acc[obj.id] = obj.name;
          return acc;
        },
        {} as Record<string, string>,
      )
    : {};

  // Group roadmap items by objective using functional reduce
  // Using mutable type during construction, will be cast to readonly at return
  type MutableObjective = {
    id: string;
    name: string;
    roadmapItems: RoadmapItemWithProgress[];
    weeks: number;
    weeksDone: number;
    weeksInProgress: number;
    weeksTodo: number;
    weeksNotToDo: number;
    weeksCancelled: number;
    weeksPostponed: number;
    cycleItemsCount: number;
    cycleItemsDoneCount: number;
    progress: number;
    progressWithInProgress: number;
    progressByCycleItems: number;
    percentageNotToDo: number;
  };

  // Use reduce instead of forEach for functional aggregation
  const groupedObjectives = roadmapItems.reduce<
    Record<string, MutableObjective>
  >((acc, item) => {
    const objectiveId =
      item.objectiveId || config.getDefaultValues().DEFAULT_OBJECTIVE.ID;

    // Initialize objective if not exists
    if (!acc[objectiveId]) {
      acc[objectiveId] = {
        id: objectiveId,
        name: Maybe.fromNullable(objectivesLookup[objectiveId]).orDefault(
          config.getDefaultValues().DEFAULT_OBJECTIVE.NAME,
        ),
        roadmapItems: [],
        // Initialize progress metrics
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        cycleItemsCount: 0,
        cycleItemsDoneCount: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByCycleItems: 0,
        percentageNotToDo: 0,
      };
    }

    // Find cycle items for this roadmap item
    const itemCycleItems = cycleItems.filter(
      (ci) => ci.roadmapItemId === item.id,
    );

    // Transform roadmap item with progress metrics
    const roadmapItemMetrics = calculateCycleItemProgress(itemCycleItems);

    // Extract values using Maybe for safe transformation
    const name = Maybe.fromNullable(item.summary)
      .alt(Maybe.fromNullable(item.name))
      .orDefault(`Roadmap Item ${item.id}`);
    const labels = Maybe.fromNullable(item.labels).orDefault([]);
    const area =
      typeof item.area === "string"
        ? item.area
        : Maybe.fromNullable(item.area?.name).orDefault("");
    const theme = typeof item.theme === "string" ? item.theme : "";
    const url = Maybe.fromNullable(item.url).orDefault(
      `https://example.com/browse/${item.id}`,
    );

    const roadmapItem: RoadmapItemWithProgress = {
      id: item.id,
      name,
      summary: name,
      labels,
      area,
      theme,
      url,
      validations: Maybe.fromNullable(item.validations)
        .filter(Array.isArray)
        .map((vals) => hydrateValidations(config, vals))
        .orDefault([]),
      ...(item.startDate !== undefined && { startDate: item.startDate }),
      ...(item.endDate !== undefined && { endDate: item.endDate }),
      cycleItems: itemCycleItems.map((cycleItem) => ({
        ...cycleItem,
        validations: Maybe.fromNullable(cycleItem.validations)
          .filter(Array.isArray)
          .map((vals) => hydrateValidations(config, vals))
          .orDefault([]),
        cycle: Maybe.fromNullable(cycleItem.cycle)
          .alt(
            Maybe.fromNullable(cycleItem.cycleId).map((cycleId) => ({
              id: cycleId,
              name: getCycleName(cycles, cycleId),
            })),
          )
          .orDefault({ id: "", name: "" }),
      })),
      // Add calculated metrics
      ...roadmapItemMetrics,
    };

    // Create new objective with updated values (functional style - immutable update)
    const currentObjective = acc[objectiveId];
    acc[objectiveId] = {
      ...currentObjective,
      roadmapItems: [...currentObjective.roadmapItems, roadmapItem],
      // Aggregate metrics to objective level (calculate new values)
      weeks: currentObjective.weeks + roadmapItemMetrics.weeks,
      weeksDone: currentObjective.weeksDone + roadmapItemMetrics.weeksDone,
      weeksInProgress:
        currentObjective.weeksInProgress + roadmapItemMetrics.weeksInProgress,
      weeksTodo: currentObjective.weeksTodo + roadmapItemMetrics.weeksTodo,
      weeksNotToDo:
        currentObjective.weeksNotToDo + roadmapItemMetrics.weeksNotToDo,
      weeksCancelled:
        currentObjective.weeksCancelled + roadmapItemMetrics.weeksCancelled,
      weeksPostponed:
        currentObjective.weeksPostponed + roadmapItemMetrics.weeksPostponed,
      cycleItemsCount:
        currentObjective.cycleItemsCount + roadmapItemMetrics.cycleItemsCount,
      cycleItemsDoneCount:
        currentObjective.cycleItemsDoneCount +
        roadmapItemMetrics.cycleItemsDoneCount,
    };

    return acc;
  }, {});

  // Calculate final objective-level percentages (functional style)
  const objectivesWithPercentages = Object.values(groupedObjectives).map(
    (objective): MutableObjective => ({
      ...objective,
      progress:
        objective.weeks > 0
          ? Math.round((objective.weeksDone / objective.weeks) * 100)
          : 0,
      progressWithInProgress:
        objective.weeks > 0
          ? Math.round(
              ((objective.weeksDone + objective.weeksInProgress) /
                objective.weeks) *
                100,
            )
          : 0,
      progressByCycleItems:
        objective.cycleItemsCount > 0
          ? Math.round(
              (objective.cycleItemsDoneCount / objective.cycleItemsCount) * 100,
            )
          : 0,
      percentageNotToDo:
        objective.weeks > 0
          ? Math.max(
              0,
              Math.round((objective.weeksNotToDo / objective.weeks) * 100),
            )
          : 0,
    }),
  );

  // Sort objectives by weeks (largest first) and cast to readonly at return
  const sortedObjectives = objectivesWithPercentages
    .sort((a, b) => b.weeks - a.weeks)
    .map(
      (obj): ObjectiveWithProgress => ({
        ...obj,
        roadmapItems: obj.roadmapItems,
      }),
    ) as readonly ObjectiveWithProgress[];

  return {
    objectives: sortedObjectives,
  };
}

/**
 * Apply objective filter at the objective level
 * Pure function - no side effects, uses Maybe for safe filtering
 */
export function applyObjectiveFilter(
  data: NestedCycleData,
  objectives?: readonly ObjectiveId[],
): NestedCycleData {
  // Use Maybe to handle optional/empty filter arrays
  const filteredObjectives = Maybe.fromNullable(objectives)
    .filter((ids) => ids.length > 0)
    .map(
      (ids) =>
        data.objectives.filter((objective) =>
          ids.includes(objective.id),
        ) as readonly ObjectiveWithProgress[],
    )
    .orDefault(data.objectives);

  return {
    ...data,
    objectives: filteredObjectives,
  };
}

/**
 * Process raw cycle data into nested structure with filtering
 * Pure function - no side effects
 * Uses functional pipeline composition for clear data flow
 */
export function processCycleData(
  config: HeadNorthConfig,
  rawData: CycleData,
  filters: FilterCriteria = {},
): NestedCycleData {
  return pipe(
    rawData,
    (data: CycleData) => transformToNestedStructure(config, data),
    (nestedData: NestedCycleData) =>
      applyObjectiveFilter(nestedData, filters.objectives),
    (filteredData: NestedCycleData) => filter.apply(filteredData, filters),
    (result: FilterResult) => result.data,
  );
}

/**
 * Generate roadmap data from raw and processed data
 * Pure function - no side effects
 */
export function generateRoadmapData(
  rawData: CycleData | null,
  processedData: NestedCycleData | null,
): RoadmapData {
  if (!processedData) {
    return {
      orderedCycles: [],
      roadmapItems: [],
      activeCycle: null,
      objectives: [],
    };
  }

  return {
    orderedCycles: Maybe.fromNullable(rawData?.cycles)
      .map((cycles) => [...cycles])
      .orDefault([]),
    roadmapItems: [],
    activeCycle: selectDefaultCycle(
      Maybe.fromNullable(rawData?.cycles).orDefault([]),
    ),
    objectives: Maybe.fromNullable(processedData.objectives).orDefault([]),
  };
}

/**
 * Generate cycle overview data from raw and processed data
 * Pure function - no side effects
 */
export function generateCycleOverviewData(
  rawData: CycleData | null,
  processedData: NestedCycleData | null,
): CycleOverviewData | null {
  // Use Maybe for safe null checking
  const hasValidData = Maybe.fromNullable(processedData)
    .chain(() => Maybe.fromNullable(rawData?.cycles))
    .filter((cycles) => cycles.length > 0)
    .isJust();

  if (!hasValidData || !rawData || !processedData) {
    return null;
  }

  const selectedCycle = selectDefaultCycle(rawData.cycles);
  if (!selectedCycle) {
    return null;
  }

  const objectives = Maybe.fromNullable(processedData.objectives).orDefault([]);

  // Calculate cycle progress data
  const cycleWithProgress = calculateCycleProgress(selectedCycle, objectives);

  return {
    cycle: cycleWithProgress,
    objectives,
  };
}

/**
 * Generate filtered roadmap data
 * Pure function - no side effects
 */
export function generateFilteredRoadmapData(
  rawData: CycleData | null,
  processedData: NestedCycleData | null,
  activeFilters: FilterCriteria,
): RoadmapData {
  if (!processedData) {
    return {
      orderedCycles: [],
      roadmapItems: [],
      activeCycle: null,
      objectives: [],
    };
  }

  // Apply filters using unified filter system
  const filteredData = filter.apply(processedData, activeFilters);

  return {
    orderedCycles: Maybe.fromNullable(rawData?.cycles)
      .map((cycles) => [...cycles])
      .orDefault([]),
    roadmapItems: [],
    activeCycle: selectDefaultCycle(
      Maybe.fromNullable(rawData?.cycles).orDefault([]),
    ),
    objectives: Maybe.fromNullable(filteredData.data.objectives).orDefault([]),
  };
}

/**
 * Generate filtered cycle overview data with progress calculations
 * Pure function - no side effects
 * Uses functional pipeline composition for clear data flow
 */
export function generateFilteredCycleOverviewData(
  rawData: CycleData | null,
  processedData: NestedCycleData | null,
  activeFilters: FilterCriteria,
): CycleOverviewData | null {
  // Early return for null/empty data using Maybe
  const hasValidData = Maybe.fromNullable(processedData)
    .chain(() => Maybe.fromNullable(rawData?.cycles))
    .filter((cycles) => cycles.length > 0)
    .isJust();

  if (!hasValidData || !rawData || !processedData) {
    return null;
  }

  // Use Maybe for safe cycle selection
  const selectedCycle = Maybe.fromNullable(selectDefaultCycle(rawData.cycles));

  // Compose pipeline using Maybe for safe transformations
  const result = selectedCycle.map((cycle) => {
    // Apply filters using unified filter system
    const filteredData = filter.apply(processedData, activeFilters);
    const filteredObjectives = Maybe.fromNullable(
      filteredData.data.objectives,
    ).orDefault([]);

    // Calculate cycle progress data
    const cycleWithProgress = calculateCycleProgress(cycle, filteredObjectives);

    return {
      cycle: cycleWithProgress,
      objectives: filteredObjectives,
    };
  });

  return result.isJust() ? result.extract() : null;
}

/**
 * Get cycle name by ID using Maybe for safe lookup
 * Pure function - no side effects
 */
function getCycleName(cycles: readonly unknown[], cycleId: string): string {
  if (!Array.isArray(cycles) || !cycleId) {
    return `Cycle ${cycleId}`;
  }

  return Maybe.fromNullable(
    cycles.find((c) => {
      const cycleObj = c as { id?: string };
      return cycleObj.id === cycleId;
    }),
  )
    .chain((cycle) => {
      const cycleWithName = cycle as { name?: string };
      return Maybe.fromNullable(cycleWithName.name);
    })
    .orDefault(`Cycle ${String(cycleId)}`);
}

// Export all functions as a single object
export const dataTransformer = {
  transformToNestedStructure,
  applyObjectiveFilter,
  processCycleData,
  generateRoadmapData,
  generateCycleOverviewData,
  generateFilteredRoadmapData,
  generateFilteredCycleOverviewData,
};
