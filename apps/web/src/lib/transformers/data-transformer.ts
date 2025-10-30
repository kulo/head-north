/**
 * Data Transformer
 *
 * Pure data transformation functions with no side effects.
 * Handles the core business logic of transforming raw data into UI-ready formats.
 *
 * This belongs in /lib because it contains only pure functions with no external dependencies.
 */

import type {
  Cycle,
  CycleData,
  InitiativeId,
  ValidationItem,
} from "@omega/types";
import type {
  FilterCriteria,
  InitiativeWithProgress,
  NestedCycleData,
  RoadmapItemWithProgress,
  RoadmapData,
  CycleOverviewData,
} from "../../types/ui-types";
import { filter } from "../utils/filter";
import { selectDefaultCycle } from "../selectors/cycle-selector";
import { calculateCycleProgress } from "../cycle-progress-calculator";
import { calculateReleaseItemProgress } from "../calculations/cycle-calculations";
import {
  DEFAULT_INITIATIVE,
  getDefaultInitiativeId,
} from "../constants/default-values";
import OmegaConfig from "@omega/config";

/**
 * Hydrate ValidationItems with dictionary data
 */
function hydrateValidations(
  config: OmegaConfig,
  validations: ValidationItem[],
): ValidationItem[] {
  const dictionary = config.getValidationDictionary();

  return validations.map((v) => {
    // Parse code to determine if it's releaseItem or roadmapItem
    const [category, ruleKey] = parseValidationCode(v.code);
    const rule = dictionary[category]?.[ruleKey];

    return {
      ...v,
      name: rule?.label || v.name,
      description: rule?.reference || v.description,
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
  config: OmegaConfig,
  rawData: CycleData,
): NestedCycleData {
  const { cycles, roadmapItems, releaseItems, initiatives } = rawData;

  // Create initiatives lookup
  const initiativesLookup: Record<string, string> = {};
  if (Array.isArray(initiatives)) {
    initiatives.forEach((init) => {
      initiativesLookup[init.id] = init.name;
    });
  }

  // Group roadmap items by initiative
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
  const groupedInitiatives: Record<string, MutableInitiative> = {};

  roadmapItems.forEach((item) => {
    const initiativeId = getDefaultInitiativeId(item.initiativeId);

    // Initialize initiative if not exists
    if (!groupedInitiatives[initiativeId]) {
      groupedInitiatives[initiativeId] = {
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
      validations: Array.isArray(item.validations)
        ? hydrateValidations(config, item.validations)
        : [],
      startDate: item.startDate,
      endDate: item.endDate,
      releaseItems: itemReleaseItems.map((releaseItem) => ({
        ...releaseItem,
        validations: Array.isArray(releaseItem.validations)
          ? hydrateValidations(config, releaseItem.validations)
          : [],
        cycle: releaseItem.cycle || {
          id: releaseItem.cycleId,
          name: getCycleName(cycles, releaseItem.cycleId),
        },
      })),
      // Add calculated metrics
      ...roadmapItemMetrics,
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    };

    // Create new initiative with updated values (functional style - no mutations)
    const currentInitiative = groupedInitiatives[initiativeId];
    groupedInitiatives[initiativeId] = {
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
  });

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
 * Pure function - no side effects
 */
export function applyInitiativeFilter(
  data: NestedCycleData,
  initiatives?: readonly InitiativeId[],
): NestedCycleData {
  if (!initiatives || initiatives.length === 0) {
    return data;
  }

  const filteredInitiatives = data.initiatives.filter((initiative) =>
    initiatives.includes(initiative.id),
  ) as readonly InitiativeWithProgress[];

  return {
    ...data,
    initiatives: filteredInitiatives,
  };
}

/**
 * Process raw cycle data into nested structure with filtering
 * Pure function - no side effects
 */
export function processCycleData(
  config: OmegaConfig,
  rawData: CycleData,
  filters: FilterCriteria = {},
): NestedCycleData {
  // Transform raw data to nested structure
  const nestedData = transformToNestedStructure(config, rawData);

  // Apply initiative filter first (at initiative level)
  const initiativeFilteredData = applyInitiativeFilter(
    nestedData,
    filters.initiatives,
  );

  // Apply all other filters (cascading from release items up)
  const result = filter.apply(initiativeFilteredData, filters);

  return result.data;
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
 */
export function generateFilteredCycleOverviewData(
  rawData: CycleData | null,
  processedData: NestedCycleData | null,
  activeFilters: FilterCriteria,
): CycleOverviewData | null {
  if (!processedData || !rawData?.cycles?.length) {
    return null;
  }

  const selectedCycle = selectDefaultCycle(rawData.cycles);
  if (!selectedCycle) {
    return null;
  }

  // Apply filters using unified filter system
  const filteredData = filter.apply(processedData, activeFilters);
  const filteredInitiatives = filteredData.data.initiatives || [];

  // Calculate cycle progress data
  const cycleWithProgress = calculateCycleProgress(
    selectedCycle,
    filteredInitiatives,
  );

  return {
    cycle: cycleWithProgress,
    initiatives: filteredInitiatives,
  };
}

/**
 * Get cycle name by ID
 * Pure function - no side effects
 */
function getCycleName(cycles: readonly unknown[], cycleId: string): string {
  if (!Array.isArray(cycles)) {
    return `Cycle ${cycleId}`;
  }

  const cycle = cycles.find((c) => {
    const cycleObj = c as { id?: string };
    return cycleObj.id === cycleId;
  });
  return cycle
    ? (cycle as { name?: string }).name || `Cycle ${String(cycleId)}`
    : `Cycle ${String(cycleId)}`;
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
