/**
 * Data Transformer
 *
 * Pure data transformation functions with no side effects.
 * Handles the core business logic of transforming raw data into UI-ready formats.
 *
 * This belongs in /lib because it contains only pure functions with no external dependencies.
 */

import { Maybe } from "purify-ts";
import type { CycleData, InitiativeId, ValidationItem } from "@headnorth/types";
import type {
  FilterCriteria,
  InitiativeWithProgress,
  NestedCycleData,
  RoadmapItemWithProgress,
  RoadmapData,
  CycleOverviewData,
  FilterResult,
} from "../../types/ui-types";
import { filter } from "../utils/filter";
import { selectDefaultCycle } from "../selectors/cycle-selector";
import { calculateCycleProgress } from "../cycle-progress-calculator";
import { calculateReleaseItemProgress } from "../calculations/cycle-calculations";
import {
  DEFAULT_INITIATIVE,
  getDefaultInitiativeId,
} from "../constants/default-values";
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
    // Parse code to determine if it's releaseItem or roadmapItem
    const [category, ruleKey] = parseValidationCode(v.code);

    // Use Maybe chain for safe dictionary lookup without extract()
    const rule = Maybe.fromNullable(dictionary[category]).chain(
      (categoryDict) => Maybe.fromNullable(categoryDict[ruleKey]),
    );

    return {
      ...v,
      name: rule.map((r) => r.label).orDefault(v.name),
      description: rule.map((r) => r.reference).orDefault(v.description),
    };
  });
}

/**
 * Parse validation code to determine category and rule key
 */
function parseValidationCode(code: string): [string, string] {
  // Check if it's a release item validation
  const releaseItemValidations = [
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

  if (releaseItemValidations.includes(code)) {
    return ["releaseItem", code];
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
  const { cycles, roadmapItems, releaseItems, initiatives } = rawData;

  // Create initiatives lookup using functional reduce
  const initiativesLookup: Record<string, string> = Array.isArray(initiatives)
    ? initiatives.reduce(
        (acc, init) => {
          acc[init.id] = init.name;
          return acc;
        },
        {} as Record<string, string>,
      )
    : {};

  // Group roadmap items by initiative using functional reduce
  // Using mutable type during construction, will be cast to readonly at return
  type MutableInitiative = {
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
    releaseItemsCount: number;
    releaseItemsDoneCount: number;
    progress: number;
    progressWithInProgress: number;
    progressByReleaseItems: number;
    percentageNotToDo: number;
    startMonth: string;
    endMonth: string;
    daysFromStartOfCycle: number;
    daysInCycle: number;
    currentDayPercentage: number;
  };

  // Use reduce instead of forEach for functional aggregation
  const groupedInitiatives = roadmapItems.reduce<
    Record<string, MutableInitiative>
  >((acc, item) => {
    const initiativeId = getDefaultInitiativeId(item.initiativeId);

    // Initialize initiative if not exists
    if (!acc[initiativeId]) {
      acc[initiativeId] = {
        id: initiativeId,
        name: initiativesLookup[initiativeId] || DEFAULT_INITIATIVE.NAME,
        roadmapItems: [],
        // Initialize progress metrics
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        releaseItemsCount: 0,
        releaseItemsDoneCount: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByReleaseItems: 0,
        percentageNotToDo: 0,
        startMonth: "",
        endMonth: "",
        daysFromStartOfCycle: 0,
        daysInCycle: 0,
        currentDayPercentage: 0,
      };
    }

    // Find release items for this roadmap item
    const itemReleaseItems = releaseItems.filter(
      (ri) => ri.roadmapItemId === item.id,
    );

    // Transform roadmap item with progress metrics
    const roadmapItemMetrics = calculateReleaseItemProgress(itemReleaseItems);

    const roadmapItem: RoadmapItemWithProgress = {
      id: item.id,
      name: item.summary || item.name || `Roadmap Item ${item.id}`,
      summary: item.summary || item.name || `Roadmap Item ${item.id}`,
      labels: item.labels || [],
      area: typeof item.area === "string" ? item.area : item.area?.name || "",
      theme: typeof item.theme === "string" ? item.theme : "",
      url: item.url || `https://example.com/browse/${item.id}`,
      validations: Maybe.fromNullable(item.validations)
        .filter(Array.isArray)
        .map((vals) => hydrateValidations(config, vals))
        .orDefault([]),
      startDate: item.startDate,
      endDate: item.endDate,
      releaseItems: itemReleaseItems.map((releaseItem) => ({
        ...releaseItem,
        validations: Maybe.fromNullable(releaseItem.validations)
          .filter(Array.isArray)
          .map((vals) => hydrateValidations(config, vals))
          .orDefault([]),
        cycle:
          releaseItem.cycle ||
          Maybe.fromNullable(releaseItem.cycleId)
            .map((cycleId) => ({
              id: cycleId,
              name: getCycleName(cycles, cycleId),
            }))
            .orDefault({ id: "", name: "" }),
      })),
      // Add calculated metrics
      ...roadmapItemMetrics,
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    };

    // Create new initiative with updated values (functional style - immutable update)
    const currentInitiative = acc[initiativeId];
    acc[initiativeId] = {
      ...currentInitiative,
      roadmapItems: [...currentInitiative.roadmapItems, roadmapItem],
      // Aggregate metrics to initiative level (calculate new values)
      weeks: currentInitiative.weeks + roadmapItemMetrics.weeks,
      weeksDone: currentInitiative.weeksDone + roadmapItemMetrics.weeksDone,
      weeksInProgress:
        currentInitiative.weeksInProgress + roadmapItemMetrics.weeksInProgress,
      weeksTodo: currentInitiative.weeksTodo + roadmapItemMetrics.weeksTodo,
      weeksNotToDo:
        currentInitiative.weeksNotToDo + roadmapItemMetrics.weeksNotToDo,
      weeksCancelled:
        currentInitiative.weeksCancelled + roadmapItemMetrics.weeksCancelled,
      weeksPostponed:
        currentInitiative.weeksPostponed + roadmapItemMetrics.weeksPostponed,
      releaseItemsCount:
        currentInitiative.releaseItemsCount +
        roadmapItemMetrics.releaseItemsCount,
      releaseItemsDoneCount:
        currentInitiative.releaseItemsDoneCount +
        roadmapItemMetrics.releaseItemsDoneCount,
    };

    return acc;
  }, {});

  // Calculate final initiative-level percentages (functional style)
  const initiativesWithPercentages = Object.values(groupedInitiatives).map(
    (initiative): MutableInitiative => ({
      ...initiative,
      progress:
        initiative.weeks > 0
          ? Math.round((initiative.weeksDone / initiative.weeks) * 100)
          : 0,
      progressWithInProgress:
        initiative.weeks > 0
          ? Math.round(
              ((initiative.weeksDone + initiative.weeksInProgress) /
                initiative.weeks) *
                100,
            )
          : 0,
      progressByReleaseItems:
        initiative.releaseItemsCount > 0
          ? Math.round(
              (initiative.releaseItemsDoneCount /
                initiative.releaseItemsCount) *
                100,
            )
          : 0,
      percentageNotToDo:
        initiative.weeks > 0
          ? Math.max(
              0,
              Math.round((initiative.weeksNotToDo / initiative.weeks) * 100),
            )
          : 0,
    }),
  );

  // Sort initiatives by weeks (largest first) and cast to readonly at return
  const sortedInitiatives = initiativesWithPercentages
    .sort((a, b) => b.weeks - a.weeks)
    .map(
      (init): InitiativeWithProgress => ({
        ...init,
        roadmapItems: init.roadmapItems,
      }),
    ) as readonly InitiativeWithProgress[];

  return {
    initiatives: sortedInitiatives,
  };
}

/**
 * Apply initiative filter at the initiative level
 * Pure function - no side effects, uses Maybe for safe filtering
 */
export function applyInitiativeFilter(
  data: NestedCycleData,
  initiatives?: readonly InitiativeId[],
): NestedCycleData {
  // Use Maybe to handle optional/empty filter arrays
  const filteredInitiatives = Maybe.fromNullable(initiatives)
    .filter((ids) => ids.length > 0)
    .map(
      (ids) =>
        data.initiatives.filter((initiative) =>
          ids.includes(initiative.id),
        ) as readonly InitiativeWithProgress[],
    )
    .orDefault(data.initiatives);

  return {
    ...data,
    initiatives: filteredInitiatives,
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
      applyInitiativeFilter(nestedData, filters.initiatives),
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
      initiatives: [],
    };
  }

  return {
    orderedCycles: rawData?.cycles ? [...rawData.cycles] : [],
    roadmapItems: [],
    activeCycle: selectDefaultCycle(rawData?.cycles || []),
    initiatives: processedData.initiatives || [],
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
  if (!processedData || !rawData?.cycles?.length) {
    return null;
  }

  const selectedCycle = selectDefaultCycle(rawData.cycles);
  if (!selectedCycle) {
    return null;
  }

  return {
    cycle: selectedCycle,
    initiatives: processedData.initiatives || [],
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
      initiatives: [],
    };
  }

  // Apply filters using unified filter system
  const filteredData = filter.apply(processedData, activeFilters);

  return {
    orderedCycles: rawData?.cycles ? [...rawData.cycles] : [],
    roadmapItems: [],
    activeCycle: selectDefaultCycle(rawData?.cycles || []),
    initiatives: filteredData.data.initiatives || [],
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
  // Early return for null/empty data
  if (!processedData || !rawData?.cycles?.length) {
    return null;
  }

  // Use Maybe for safe cycle selection
  const selectedCycle = Maybe.fromNullable(selectDefaultCycle(rawData.cycles));

  // Compose pipeline using Maybe for safe transformations
  return selectedCycle
    .map((cycle) => {
      // Apply filters using unified filter system
      const filteredData = filter.apply(processedData, activeFilters);
      const filteredInitiatives = filteredData.data.initiatives || [];

      // Calculate cycle progress data
      const cycleWithProgress = calculateCycleProgress(
        cycle,
        filteredInitiatives,
      );

      return {
        cycle: cycleWithProgress,
        initiatives: filteredInitiatives,
      };
    })
    .orDefault(null);
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
    .map((cycle) => {
      const cycleWithName = cycle as { name?: string };
      return cycleWithName.name || `Cycle ${String(cycleId)}`;
    })
    .orDefault(`Cycle ${String(cycleId)}`);
}

// Export all functions as a single object
export const dataTransformer = {
  transformToNestedStructure,
  applyInitiativeFilter,
  processCycleData,
  generateRoadmapData,
  generateCycleOverviewData,
  generateFilteredRoadmapData,
  generateFilteredCycleOverviewData,
};
