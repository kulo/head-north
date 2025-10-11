/**
 * Data Store - Data management
 *
 * Manages raw and processed cycle data. This store handles the core data
 * fetching and processing logic that was previously in Vuex actions.
 *
 * Uses factory function pattern for immutable service injection.
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { DataTransformer } from "../lib/transformers/data-transformer";
import type { CycleData } from "@omega/types";
import type {
  NestedCycleData,
  RoadmapData,
  CycleOverviewData,
} from "../types/ui-types";
import type { default as CycleDataService } from "../services/cycle-data-service";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";

export function createDataStore(
  cycleDataService: CycleDataService,
  cycleDataViewCoordinator: CycleDataViewCoordinator,
) {
  return defineStore("data", () => {
    // ✅ Services are immutable constants
    const dataService = cycleDataService;
    const coordinator = cycleDataViewCoordinator;

    // State
    const rawData = ref<CycleData | null>(null);
    const processedData = ref<NestedCycleData | null>(null);

    // Getters
    const hasRawData = computed(() => rawData.value !== null);
    const hasProcessedData = computed(() => processedData.value !== null);

    const initiatives = computed(() => processedData.value?.initiatives || []);
    const areas = computed(() => rawData.value?.areas || []);
    const assignees = computed(() => rawData.value?.assignees || []);
    const stages = computed(() => rawData.value?.stages || []);
    const cycles = computed(() => rawData.value?.cycles || []);

    // Complex getters that were in Vuex
    const roadmapData = computed((): RoadmapData => {
      console.log("🔍 Computing roadmapData:", {
        hasProcessedData: !!processedData.value,
        hasRawData: !!rawData.value,
        processedDataInitiatives: processedData.value?.initiatives?.length || 0,
        rawDataCycles: rawData.value?.cycles?.length || 0,
      });

      if (!processedData.value) {
        console.log("⚠️ No processed data available for roadmapData");
        return {
          orderedCycles: [],
          roadmapItems: [],
          activeCycle: null,
          initiatives: [],
        };
      }

      const result = {
        orderedCycles: rawData.value?.cycles || [],
        roadmapItems: [],
        activeCycle: selectBestCycle(rawData.value?.cycles || []),
        initiatives: processedData.value.initiatives || [],
      };

      console.log("✅ roadmapData computed:", {
        initiativesCount: result.initiatives.length,
        cyclesCount: result.orderedCycles.length,
        hasActiveCycle: !!result.activeCycle,
      });

      return result;
    });

    // Filtered roadmap data using CycleDataViewCoordinator
    const filteredRoadmapData = computed((): RoadmapData => {
      console.log("🔍 Computing filteredRoadmapData:", {
        hasCoordinator: !!coordinator,
        hasProcessedData: !!processedData.value,
        hasRawData: !!rawData.value,
      });

      if (!processedData.value || !rawData.value) {
        console.warn(
          "⚠️ No data available for filtering, using empty roadmapData",
        );
        return {
          orderedCycles: [],
          roadmapItems: [],
          activeCycle: null,
          initiatives: [],
        };
      }

      try {
        const filtered = coordinator.generateFilteredRoadmapData(
          rawData.value,
          processedData.value,
        );

        console.log("✅ filteredRoadmapData computed:", {
          initiativesCount: filtered.initiatives?.length || 0,
          cyclesCount: filtered.orderedCycles?.length || 0,
          hasActiveCycle: !!filtered.activeCycle,
        });

        return filtered;
      } catch (error) {
        console.error("❌ Error generating filtered roadmap data:", error);
        console.warn("⚠️ Falling back to unfiltered roadmapData");
        return roadmapData.value;
      }
    });

    const cycleOverviewData = computed((): CycleOverviewData | null => {
      if (!processedData.value || !rawData.value?.cycles?.length) {
        return null;
      }
      const selectedCycle = selectBestCycle(rawData.value.cycles);
      if (!selectedCycle) {
        return null;
      }
      return {
        cycle: selectedCycle,
        initiatives: processedData.value.initiatives || [],
      };
    });

    // Filtered cycle overview data using CycleDataViewCoordinator
    const filteredCycleOverviewData = computed((): CycleOverviewData | null => {
      console.log("🔍 Computing filteredCycleOverviewData:", {
        hasCoordinator: !!coordinator,
        hasProcessedData: !!processedData.value,
        hasRawData: !!rawData.value,
      });

      if (!processedData.value || !rawData.value) {
        console.warn(
          "⚠️ No data available for filtering cycle overview, using null",
        );
        return null;
      }

      try {
        const filtered = coordinator.generateFilteredCycleOverviewData(
          rawData.value,
          processedData.value,
        );

        console.log("✅ filteredCycleOverviewData computed:", {
          hasCycle: !!filtered?.cycle,
          initiativesCount: filtered?.initiatives?.length || 0,
        });

        return filtered;
      } catch (error) {
        console.error(
          "❌ Error generating filtered cycle overview data:",
          error,
        );
        console.warn("⚠️ Falling back to unfiltered cycleOverviewData");
        return cycleOverviewData.value;
      }
    });

    // Actions
    function setRawData(data: CycleData) {
      rawData.value = data;
    }

    function setProcessedData(data: NestedCycleData) {
      processedData.value = data;
    }

    async function fetchAndProcessData(appStore) {
      try {
        appStore.setLoading(true);
        appStore.clearError();

        console.log("Fetching cycle data from API");
        const cycleData = await dataService.getCycleData();

        if (!cycleData) {
          throw new Error("No cycle data received from API");
        }

        console.log("Raw data received", {
          roadmapItems: cycleData.roadmapItems?.length || 0,
          releaseItems: cycleData.releaseItems?.length || 0,
          cycles: cycleData.cycles?.length || 0,
        });

        // Store raw data
        setRawData(cycleData);

        // Process data using DataProcessor
        console.log("Processing data with DataProcessor");
        const processed = DataTransformer.processCycleData(cycleData, {});

        if (!processed) {
          throw new Error("Data processing failed");
        }

        console.log("Data processed successfully", {
          initiatives: processed.initiatives?.length || 0,
        });

        // Store processed data
        setProcessedData(processed);

        console.log("Data fetch and processing completed successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Failed to fetch and process data", error);
        appStore.setError(errorMessage);
      } finally {
        appStore.setLoading(false);
      }
    }

    function clearData() {
      rawData.value = null;
      processedData.value = null;
    }

    return {
      // State
      rawData,
      processedData,

      // Getters
      hasRawData,
      hasProcessedData,
      initiatives,
      areas,
      assignees,
      stages,
      cycles,
      roadmapData,
      filteredRoadmapData,
      cycleOverviewData,
      filteredCycleOverviewData,

      // Actions
      setRawData,
      setProcessedData,
      fetchAndProcessData,
      clearData,
    };
  });
}

/**
 * Helper function moved from Vuex store
 * Determines the best cycle to select based on availability and priority
 */
function selectBestCycle(cycles: any[]): any | null {
  if (!cycles || !Array.isArray(cycles) || cycles.length === 0) {
    return null;
  }

  // Sort cycles by start date (oldest first)
  const sortedCycles = [...cycles].sort((a, b) => {
    const dateA = new Date(a.start || a.delivery || 0).getTime();
    const dateB = new Date(b.start || b.delivery || 0).getTime();
    return dateA - dateB;
  });

  // 1. Try to find active cycles (oldest first)
  const activeCycles = sortedCycles.filter((cycle) => cycle.state === "active");
  if (activeCycles.length > 0) {
    return activeCycles[0]; // Oldest active cycle
  }

  // 2. Try to find future cycles (oldest first)
  const futureCycles = sortedCycles.filter((cycle) => {
    const cycleDate = new Date(cycle.start || cycle.delivery || 0);
    const now = new Date();
    return (
      cycleDate > now && cycle.state !== "closed" && cycle.state !== "completed"
    );
  });
  if (futureCycles.length > 0) {
    return futureCycles[0]; // Oldest future cycle
  }

  // 3. Fall back to closed cycles (oldest first)
  const closedCycles = sortedCycles.filter(
    (cycle) => cycle.state === "closed" || cycle.state === "completed",
  );
  if (closedCycles.length > 0) {
    return closedCycles[0]; // Oldest closed cycle
  }

  // 4. Last resort: return the first cycle (oldest by our sort)
  return sortedCycles[0];
}
