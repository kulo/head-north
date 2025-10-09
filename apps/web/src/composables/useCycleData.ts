/**
 * Cycle Data Composable
 *
 * Vue 3 composable for managing cycle data calculations and transformations.
 * Provides reactive computed properties for complex data operations.
 */

import { computed, type ComputedRef } from "vue";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";
import type { CycleData } from "@omega/types";
import type {
  NestedCycleData,
  RoadmapData,
  CycleOverviewData,
} from "../types/ui-types";

export interface UseCycleDataOptions {
  rawData: ComputedRef<CycleData | null>;
  processedData: ComputedRef<NestedCycleData | null>;
}

export function useCycleData(
  cycleDataViewCoordinator: CycleDataViewCoordinator,
  { rawData, processedData }: UseCycleDataOptions,
) {
  // Roadmap data
  const roadmapData = computed((): RoadmapData => {
    return cycleDataViewCoordinator.generateRoadmapData(
      rawData.value,
      processedData.value,
    );
  });

  // Cycle overview data
  const cycleOverviewData = computed((): CycleOverviewData | null => {
    return cycleDataViewCoordinator.generateCycleOverviewData(
      rawData.value,
      processedData.value,
    );
  });

  // Filtered roadmap data
  const filteredRoadmapData = computed((): RoadmapData => {
    return cycleDataViewCoordinator.generateFilteredRoadmapData(
      rawData.value,
      processedData.value,
    );
  });

  // Filtered cycle overview data
  const filteredCycleOverviewData = computed((): CycleOverviewData | null => {
    return cycleDataViewCoordinator.generateFilteredCycleOverviewData(
      rawData.value,
      processedData.value,
    );
  });

  // Metadata getters
  const initiatives = computed(() => processedData.value?.initiatives || []);
  const areas = computed(() => rawData.value?.areas || []);
  const assignees = computed(() => rawData.value?.assignees || []);
  const stages = computed(() => rawData.value?.stages || []);
  const cycles = computed(() => rawData.value?.cycles || []);

  return {
    // Data
    roadmapData,
    cycleOverviewData,
    filteredRoadmapData,
    filteredCycleOverviewData,

    // Metadata
    initiatives,
    areas,
    assignees,
    stages,
    cycles,
  };
}
